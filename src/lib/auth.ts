import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import crypto from "crypto";
import { db, ensureNeonSchemaUpdated } from "@/lib/db";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(`reviewmitra_salt_${password}`).digest("hex");
}

export function verifyPassword(inputPassword: string, storedHash?: string | null): boolean {
  if (!storedHash) return false;
  const hashedInput = hashPassword(inputPassword);
  return storedHash === hashedInput || storedHash === inputPassword;
}

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
      name: "Email or Google",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        mode: { label: "Mode", type: "text" }, // "email" | "firebase"
        firebaseVerified: { label: "Firebase Verified", type: "text" },
        setPasswordForGoogle: { label: "Set Password For Google", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        await ensureNeonSchemaUpdated();

        const mode = credentials.mode || "email";
        const email = credentials.email?.toLowerCase().trim();

        if (!email) {
          throw new Error("Please enter a valid email address.");
        }

        // ─── MODE 1: Google OAuth via Firebase ─────────────────────────────
        if (mode === "firebase") {
          const displayName = credentials.name?.trim() || "Business Owner";

          let user = await db.user.findUnique({
            where: { email },
            include: { businesses: { orderBy: { createdAt: "asc" } } },
          });

          if (!user) {
            // Create verified user + initial business on first Google Sign-In
            user = await db.user.create({
              data: {
                email,
                fullName: displayName,
                authProvider: "google",
                emailVerified: true,
                businesses: {
                  create: {
                    businessName: `${displayName}'s Business`,
                    category: "clinic",
                    defaultTone: "friendly",
                    matchReviewLanguage: true,
                    subscriptions: {
                      create: {
                        planName: "nano_79",
                        status: "active",
                        taxExclusive: true,
                        monthlyAiReplyLimit: 100,
                        maxBusinesses: 1,
                        aiRepliesUsed: 0,
                      },
                    },
                  },
                },
              },
              include: { businesses: { orderBy: { createdAt: "asc" } } },
            });
          } else if (!user.emailVerified || user.authProvider === "email") {
            // Link existing email account with Google and mark email as verified
            user = await db.user.update({
              where: { id: user.id },
              data: {
                emailVerified: true,
                authProvider: user.passwordHash ? "both" : "google",
              },
              include: { businesses: { orderBy: { createdAt: "asc" } } },
            });
          }

          const primaryBusiness = user.businesses[0] || null;

          return {
            id: user.id,
            name: user.fullName,
            email: user.email,
            phone: user.phoneNumber,
            emailVerified: true,
            businessId: primaryBusiness?.id || null,
            businessName: primaryBusiness?.businessName || null,
            businesses: user.businesses.map((b) => ({
              id: b.id,
              name: b.businessName,
              category: b.category,
            })),
          } as any;
        }

        // ─── MODE 2: Email + Password Login ────────────────────────────────
        if (mode === "email") {
          const password = credentials.password;

          if (!password) {
            throw new Error("Please enter both your email address and password.");
          }

          let user = await db.user.findUnique({
            where: { email },
            include: { businesses: { orderBy: { createdAt: "asc" } } },
          });

          if (!user) {
            throw new Error("No account is registered with this email address. Please sign up first.");
          }

          // Scenario: User first signed up with Google and now tries to log in with Email + Password
          if (!user.passwordHash) {
            if (credentials.setPasswordForGoogle === "true") {
              // Link new password to the existing Google-registered account
              user = await db.user.update({
                where: { id: user.id },
                data: {
                  passwordHash: hashPassword(password),
                  authProvider: "both",
                  emailVerified: true,
                },
                include: { businesses: { orderBy: { createdAt: "asc" } } },
              });
            } else {
              throw new Error(
                "GOOGLE_ACCOUNT_NO_PASSWORD: This email was registered using Google Sign-In. Please click 'Continue with Google' or click 'Set Password for Google Account' below to enable password login."
              );
            }
          } else {
            // Verify password hash
            const isValid = verifyPassword(password, user.passwordHash);
            if (!isValid) {
              throw new Error("Incorrect password. Please try again or reset your password.");
            }
          }

          // Sync Firebase email verification status if verified via Firebase link
          if (credentials.firebaseVerified === "true" && !user.emailVerified) {
            user = await db.user.update({
              where: { id: user.id },
              data: {
                emailVerified: true,
                verificationToken: null,
              },
              include: { businesses: { orderBy: { createdAt: "asc" } } },
            });
          }

          // Enforce mandatory email verification before activating service
          if (!user.emailVerified) {
            throw new Error(
              "EMAIL_NOT_VERIFIED: Please verify your email address to activate your account. Check your inbox or click 'Resend Verification Email' below."
            );
          }

          const primaryBusiness = user.businesses[0] || null;

          return {
            id: user.id,
            name: user.fullName,
            email: user.email,
            phone: user.phoneNumber,
            emailVerified: user.emailVerified,
            businessId: primaryBusiness?.id || null,
            businessName: primaryBusiness?.businessName || null,
            businesses: user.businesses.map((b) => ({
              id: b.id,
              name: b.businessName,
              category: b.category,
            })),
          } as any;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.phone = (user as any).phone;
        token.emailVerified = (user as any).emailVerified;
        token.businessId = (user as any).businessId;
        token.businessName = (user as any).businessName;
        token.businesses = (user as any).businesses || [];
      }
      // Support switching active business in multi-business accounts
      if (trigger === "update" && session?.businessId) {
        token.businessId = session.businessId;
        if (session.businessName) token.businessName = session.businessName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).phone = token.phone as string;
        (session.user as any).emailVerified = token.emailVerified as boolean;
        (session.user as any).businessId = token.businessId as string;
        (session.user as any).businessName = token.businessName as string;
        (session.user as any).businesses = (token.businesses as any[]) || [];
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "reviewmitra-dev-secret-change-in-production",
};
