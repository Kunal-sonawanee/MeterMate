import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      onboarded: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    onboardedAt?: Date | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    onboarded: boolean;
  }
}
