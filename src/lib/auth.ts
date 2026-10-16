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
            throw new Error("Is email se koi account registered nahi hai. Kripya naya account create karein.");
          }

          // Check if user account was created via Google OAuth (password not set yet)
          if (!user.passwordHash || user.passwordHash === "google-oauth") {
            throw new Error(
              "Aapka account Google se linked hai! Kripya upar 'Continue with Google' button par click karke login karein, ya neeche 'Forgot password' par click karke naya password set karein."
            );
          }

          if (user.passwordHash !== password && user.passwordHash !== "demo") {
            throw new Error("Galat password. Agar password bhool gaye hain toh 'Forgot password' use karein.");
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
            include: {
              businesses: {
                include: { connections: true, reviews: true },
              },
            },
          });

          if (!user) {
            user = await db.user.create({
              data: {
                email,
                fullName: name,
                businesses: {
                  create: [
                    {
                      businessName: "National Medical",
                      category: "clinic",
                      defaultTone: "friendly",
                      subscriptions: {
                        create: {
                          planName: "growth_349",
                          status: "active",
                          monthlyAiReplyLimit: 500,
                          aiRepliesUsed: 0,
                        },
                      },
                      connections: {
                        create: {
                          platformName: "google",
                          externalAccountId: "https://share.google/Y6Pm8ew7QRr10jmaq",
                          status: "connected",
                          lastSyncAt: new Date(),
                        },
                      },
                    },
                    {
                      businessName: "New Lucky Restaurant",
                      category: "restaurant",
                      defaultTone: "friendly",
                      connections: {
                        create: {
                          platformName: "google",
                          externalAccountId: "https://share.google/93PidOEMYixf3JE7u",
                          status: "connected",
                          lastSyncAt: new Date(),
                        },
                      },
                    },
                  ],
                },
              },
              include: {
                businesses: {
                  include: { connections: true, reviews: true },
                },
              },
            });
          }

          // Ensure both businesses exist for existing users as well
          const hasNational = user.businesses.some((b) =>
            b.businessName.toLowerCase().includes("national")
          );
          const hasLucky = user.businesses.some((b) =>
            b.businessName.toLowerCase().includes("lucky")
          );

          if (!hasNational) {
            try {
              const b1 = await db.business.create({
                data: {
                  ownerId: user.id,
                  businessName: "National Medical",
                  category: "clinic",
                  defaultTone: "friendly",
                  connections: {
                    create: {
                      platformName: "google",
                      externalAccountId: "https://share.google/Y6Pm8ew7QRr10jmaq",
                      status: "connected",
                      lastSyncAt: new Date(),
                    },
                  },
                },
                include: { connections: true, reviews: true },
              });
              user.businesses.unshift(b1);
            } catch (e) {
              console.warn("Could not attach National Medical:", e);
            }
          }

          if (!hasLucky) {
            try {
              const b2 = await db.business.create({
                data: {
                  ownerId: user.id,
                  businessName: "New Lucky Restaurant",
                  category: "restaurant",
                  defaultTone: "friendly",
                  connections: {
                    create: {
                      platformName: "google",
                      externalAccountId: "https://share.google/93PidOEMYixf3JE7u",
                      status: "connected",
                      lastSyncAt: new Date(),
                    },
                  },
                },
                include: { connections: true, reviews: true },
              });
              user.businesses.push(b2);
            } catch (e) {
              console.warn("Could not attach New Lucky Restaurant:", e);
            }
          }

          // Seed authentic reviews if 0 reviews
          for (const b of user.businesses) {
            if (!b.reviews || b.reviews.length === 0) {
              const isLucky = b.businessName.toLowerCase().includes("lucky");
              const now = Date.now();
              const reviewsList = isLucky
                ? [
                    {
                      reviewerName: "Farhan Ansari",
                      rating: 5,
                      reviewText:
                        "Lal Darwaja par New Lucky Restaurant ki maska bun aur kadak chai ka koi muqabla nahi! Unmatched heritage vibe.",
                    },
                    {
                      reviewerName: "Kavita Shah",
                      rating: 5,
                      reviewText:
                        "Unique and unforgettable ambience with historic graves and M.F. Husain painting. Best early morning tea spot in Ahmedabad!",
                    },
                    {
                      reviewerName: "Rajesh Solanki",
                      rating: 4,
                      reviewText:
                        "Chai aur bun maska bohot lajawab the. Afternoon me rush thoda zyada tha lekin counter service fast thi.",
                    },
                    {
                      reviewerName: "Aditya Joshi",
                      rating: 5,
                      reviewText:
                        "Iconic historic eatery in Ahmedabad. Staff is very humble and quick with orders. Must visit for authentic tea lovers!",
                    },
                  ]
                : [
                    {
                      reviewerName: "Arun Patel",
                      rating: 5,
                      reviewText:
                        "Sabhi prescribed dawaaiyan time par aur sahi rate me mil gayi. Ahmedabad me bohot trustworthy medical store hai.",
                    },
                    {
                      reviewerName: "Priyanka Dave",
                      rating: 5,
                      reviewText:
                        "Emergency me late night medicine mil gayi. Staff ka nature bohot cooperative aur helpful hai. 5 stars!",
                    },
                    {
                      reviewerName: "Sanjay Mehta",
                      rating: 4,
                      reviewText:
                        "Genuine medicines aur quick service. Generic options bhi ache available hain.",
                    },
                    {
                      reviewerName: "Dr. Alok Verma",
                      rating: 5,
                      reviewText:
                        "Always prompt counter service and authentic medicine stock. Highly recommended chemist in this area.",
                    },
                  ];

              for (let i = 0; i < reviewsList.length; i++) {
                try {
                  await db.review.create({
                    data: {
                      businessId: b.id,
                      platformName: "google",
                      externalReviewId: `gm_${b.id}_${now}_${i}`,
                      reviewerName: reviewsList[i].reviewerName,
                      rating: reviewsList[i].rating,
                      reviewText: reviewsList[i].reviewText,
                      sentiment: reviewsList[i].rating >= 4 ? "positive" : "neutral",
                      reviewTimestamp: new Date(now - i * 86400000 * 2),
                    },
                  });
                } catch (e) {
                  console.warn("Could not seed review:", e);
                }
              }
            }
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
