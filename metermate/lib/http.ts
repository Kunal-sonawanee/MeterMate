import { NextResponse } from "next/server";
import { z } from "zod";
import { fieldErrors, firstErrorMessage } from "@/lib/validation";
import { auth } from "@/lib/auth";

/**
 * Route-handler plumbing.
 *
 * Every API route returns the same error envelope — `{ message, fields? }` —
 * so the client has exactly one shape to render, and unexpected failures never
 * leak a stack trace or a Prisma message to the user.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const badRequest = (message: string, fields?: Record<string, string>) =>
  new ApiError(400, message, fields);
export const notFound = (message: string) => new ApiError(404, message);
export const conflict = (message: string) => new ApiError(409, message);
export const unauthorized = () =>
  new ApiError(401, "Sign in to continue.");
export const tooManyRequests = (message: string) => new ApiError(429, message);

/**
 * Every data-touching route calls this first. It's the actual security
 * boundary — middleware only redirects page navigation, it doesn't stop a
 * direct request to an API route.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw unauthorized();
  return userId;
}

type PrismaLikeError = { code?: string };

const PRISMA_MESSAGES: Record<string, { status: number; message: string }> = {
  P2025: {
    status: 404,
    message: "That record no longer exists. Refresh and try again.",
  },
  P2002: {
    status: 409,
    message: "A record with these details already exists.",
  },
  P2003: {
    status: 400,
    message: "That reference is no longer valid. Refresh and try again.",
  },
};

/**
 * Wraps a route handler so thrown errors become consistent JSON responses.
 * Unrecognised errors are logged server-side and reported as a generic 500.
 */
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse> | NextResponse,
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
      { status: error.status },
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { message: firstErrorMessage(error), fields: fieldErrors(error) },
      { status: 400 },
    );
  }

  const code = (error as PrismaLikeError)?.code;
  const known = code ? PRISMA_MESSAGES[code] : undefined;
  if (known) {
    return NextResponse.json(
      { message: known.message },
      { status: known.status },
    );
  }

  console.error("[api] unhandled error", error);
  return NextResponse.json(
    { message: "Something went wrong on our end. Please try again." },
    { status: 500 },
  );
}

/** Reads and validates a JSON body, turning malformed JSON into a 400. */
export async function parseBody<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
): Promise<z.infer<Schema>> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw badRequest("Request body must be valid JSON.");
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    throw badRequest(
      firstErrorMessage(result.error),
      fieldErrors(result.error),
    );
  }

  return result.data;
}

/** Bounded integer query params (`?limit=`), ignoring junk rather than failing. */
export function intParam(
  params: URLSearchParams,
  key: string,
  { fallback, min, max }: { fallback: number; min: number; max: number },
): number {
  const raw = params.get(key);
  if (raw === null) return fallback;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(max, Math.max(min, parsed));
}
