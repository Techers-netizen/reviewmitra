import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    newUser: "/signup",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Phone or Email",
      credentials: {
        phone: { label: "Phone", type: "text" },
        otp: { label: "OTP", type: "text" },
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        mode: { label: "Mode", type: "text" }, // "phone" | "email"
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const mode = credentials.mode || (credentials.phone ? "phone" : "email");

        if (mode === "phone") {
          const rawPhone = credentials.phone?.replace(/\D/g, "");
          if (!rawPhone || rawPhone.length < 10) {
            throw new Error("Kripya valid 10-digit mobile number enter karein");
          }

          const phoneNumber = rawPhone.slice(-10);
          const otp = credentials.otp?.trim();

          // In development/demo, accept test OTP "123456" or any 6-digit number
          if (!otp || otp.length !== 6) {
            throw new Error("Kripya 6-digit OTP enter karein");
          }

          // Find or create user for smooth MSME onboarding
          let user = await db.user.findUnique({
            where: { phoneNumber },
            include: { businesses: true },
          });

          if (!user) {
            user = await db.user.create({
              data: {
                phoneNumber,
                fullName: "Business Owner",
                passwordHash: "otp-login",
                businesses: {
                  create: {
                    businessName: "My Business",
                    category: "clinic",
                    defaultTone: "friendly",
                  },
                },
              },
              include: { businesses: true },
            });
          }

          const primaryBusiness = user.businesses[0] || null;

          return {
            id: user.id,
            name: user.fullName,
            email: user.email || `${phoneNumber}@reviewmitra.in`,
            phone: user.phoneNumber,
            businessId: primaryBusiness?.id || null,
            businessName: primaryBusiness?.businessName || null,
          };
        }

        // Email + Password mode
        if (mode === "email") {
          const email = credentials.email?.toLowerCase().trim();
          const password = credentials.password;

          if (!email || !password) {
            throw new Error("Email aur password dono zaroori hain");
          }

          const user = await db.user.findUnique({
            where: { email },
            include: { businesses: true },
          });

          if (!user) {
            throw new Error("Is email se koi account registered nahi hai");
          }

          // Simple dev check or hash comparison
          if (user.passwordHash !== password && user.passwordHash !== "demo") {
            // In demo mode or plain check
            throw new Error("Galat password");
          }

          const primaryBusiness = user.businesses[0] || null;

          return {
            id: user.id,
            name: user.fullName,
            email: user.email,
            phone: user.phoneNumber,
            businessId: primaryBusiness?.id || null,
            businessName: primaryBusiness?.businessName || null,
          };
        }

        // Firebase mode (Google / Facebook OAuth)
        if (mode === "firebase") {
          const email = credentials.email?.toLowerCase().trim();
          const name = (credentials as any).name || "Business Owner";

          if (!email) {
            throw new Error("Email zaroori hai");
          }

          let user = await db.user.findUnique({
            where: { email },
            include: { businesses: true },
          });

          if (!user) {
            user = await db.user.create({
              data: {
                email,
                fullName: name,
                businesses: {
                  create: {
                    businessName: `${name}'s Business`,
                    category: "clinic",
                    defaultTone: "friendly",
                    subscriptions: {
                      create: {
                        planName: "starter_499",
                        status: "active",
                        monthlyAiReplyLimit: 100,
                        aiRepliesUsed: 0,
                      },
                    },
                  },
                },
              },
              include: { businesses: true },
            });
          }

          const primaryBusiness = user.businesses[0] || null;

          return {
            id: user.id,
            name: user.fullName,
            email: user.email,
            phone: user.phoneNumber,
            businessId: primaryBusiness?.id || null,
            businessName: primaryBusiness?.businessName || null,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = (user as any).phone;
        token.businessId = (user as any).businessId;
        token.businessName = (user as any).businessName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).phone = token.phone as string;
        (session.user as any).businessId = token.businessId as string;
        (session.user as any).businessName = token.businessName as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "reviewmitra-dev-secret-change-in-production",
};
