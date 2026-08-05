import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      include: {
        meters: true,
      },
    });

    return NextResponse.json(properties);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to fetch properties",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const property = await prisma.property.create({
      data: {
        name: body.name,
        address: body.address,
      },
    });

    return NextResponse.json(property, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to create property",
      },
      {
        status: 500,
      }
    );
  }
}