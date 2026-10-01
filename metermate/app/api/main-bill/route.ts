import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, requireUserId, route } from "@/lib/http";
import { mainBillSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const GET = route(async (request: Request) => {
  const userId = await requireUserId();
  const params = new URL(request.url).searchParams;
  const month = Number(params.get("month"));
  const year = Number(params.get("year"));

  if (!Number.isInteger(month) || !Number.isInteger(year)) {
    return NextResponse.json(null);
  }

  const bill = await prisma.mainBill.findUnique({
    where: { userId_month_year: { userId, month, year } },
  });
  return NextResponse.json(
    bill ? { month: bill.month, year: bill.year, amount: Number(bill.amount) } : null,
  );
});

export const PUT = route(async (request: Request) => {
  const userId = await requireUserId();
  const data = await parseBody(request, mainBillSchema);
  const bill = await prisma.mainBill.upsert({
    where: { userId_month_year: { userId, month: data.month, year: data.year } },
    create: { ...data, userId },
    update: { amount: data.amount },
  });

  return NextResponse.json({
    month: bill.month,
    year: bill.year,
    amount: Number(bill.amount),
  });
});