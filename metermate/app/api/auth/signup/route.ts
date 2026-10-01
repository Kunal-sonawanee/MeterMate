import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { conflict, parseBody, route, tooManyRequests } from "@/lib/http";
import { signupSchema } from "@/lib/validation";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const SALT_ROUNDS = 12;
const SIGNUP_LIMIT = { limit: 5, windowMs: 15 * 60_000 };

/**
 * Account creation.
 *
 * The very first account ever created inherits every property/main-bill row
 * that predates accounts (rows with `userId IS NULL`) — see the plan this
 * shipped under. Every account after that starts empty, since by then no
 * orphan rows are left.
 */
export const POST = route(async (request: Request) => {
  const { ok, retryAfterSeconds } = rateLimit(`signup:${clientKey(request)}`, SIGNUP_LIMIT);
  if (!ok) {
    throw tooManyRequests(`Too many attempts. Try again in ${retryAfterSeconds}s.`);
  }

  const data = await parseBody(request, signupSchema);

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (existing) {
    throw conflict("An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  await prisma.$transaction(async (tx) => {
    const isFirstUser = (await tx.user.count()) === 0;

    const user = await tx.user.create({
      data: { email: data.email, passwordHash },
      select: { id: true },
    });

    if (isFirstUser) {
      await tx.property.updateMany({
        where: { userId: null },
        data: { userId: user.id },
      });
      await tx.mainBill.updateMany({
        where: { userId: null },
        data: { userId: user.id },
      });
    }
  });

  return NextResponse.json({ message: "Account created." }, { status: 201 });
});
