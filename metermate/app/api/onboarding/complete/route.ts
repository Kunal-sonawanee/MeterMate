import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, route } from "@/lib/http";

export const dynamic = "force-dynamic";

export const POST = route(async () => {
  const userId = await requireUserId();

  await prisma.user.update({
    where: { id: userId },
    data: { onboardedAt: new Date() },
  });

  return NextResponse.json({ message: "Onboarding complete." });
});
