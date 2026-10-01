import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Auth.js configuration.
 *
 * Email + password only, JWT sessions (no database session table to manage).
 * `authorize` is the entire login check — look the user up, compare the
 * hash, and hand back only what the session needs. `onboardedAt` rides along
 * on the token so middleware can redirect a first-time user to `/onboarding`
 * without an extra database round trip on every request.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: email.trim().toLowerCase() },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, onboardedAt: user.onboardedAt };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.onboarded = Boolean(user.onboardedAt);
      }

      // `update()` on the client (called right after onboarding finishes)
      // re-checks the database rather than trusting a client-supplied flag.
      if (trigger === "update" && token.id) {
        const current = await prisma.user.findUnique({
          where: { id: token.id },
          select: { onboardedAt: true },
        });
        token.onboarded = Boolean(current?.onboardedAt);
      }

      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.onboarded = token.onboarded;
      return session;
    },
  },
});
