import { z } from "zod";

/**
 * Shared validation contract.
 *
 * The same schemas run in the browser (so the user sees a field-level message
 * before a round trip) and on the server (so the API is safe regardless of who
 * is calling it). Messages are written to be shown to a user as-is.
 */

export const MIN_YEAR = 2000;
export const MAX_YEAR = 2100;
export const MAX_READING = 99_999_999;
export const MAX_RATE = 10_000;

const trimmedString = (max: number) =>
  z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().max(max, `Must be ${max} characters or fewer.`));

const requiredName = (label: string, max = 80) =>
  z
    .string({ error: `${label} is required.` })
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, `${label} is required.`)
        .max(max, `${label} must be ${max} characters or fewer.`),
    );

/** Accepts `"12.5"` from an input as well as a real number. */
const numeric = (label: string) =>
  z.preprocess(
    (value) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed === "" ? undefined : Number(trimmed);
      }
      return value;
    },
    z
      .number({ error: `${label} is required.` })
      .refine(Number.isFinite, { message: `${label} must be a number.` }),
  );

export const propertySchema = z.object({
  name: requiredName("Property name"),
  address: trimmedString(200).optional().or(z.literal("")),
});

/** Digits only after stripping spaces/dashes/+, 7–15 long (E.164 range). */
const whatsappNumberField = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .refine(
        (value) => value === "" || /^\+?[\d\s-]{7,20}$/.test(value),
        "Enter a valid phone number.",
      )
      .refine((value) => {
        const digits = value.replace(/\D/g, "");
        return digits.length === 0 || (digits.length >= 7 && digits.length <= 15);
      }, "Phone number should have 7–15 digits."),
  );

export const meterSchema = z.object({
  name: requiredName("Meter name", 60),
  whatsappNumber: whatsappNumberField.optional().or(z.literal("")),
  propertyId: z
    .string({ error: "Select a property." })
    .min(1, "Select a property."),
});

export const meterUpdateSchema = meterSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Nothing to update.");

export const propertyUpdateSchema = propertySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Nothing to update.");

const monthField = numeric("Month").pipe(
  z
    .number()
    .int("Month must be a whole number.")
    .min(1, "Month must be between 1 and 12.")
    .max(12, "Month must be between 1 and 12."),
);

const yearField = numeric("Year").pipe(
  z
    .number()
    .int("Year must be a whole number.")
    .min(MIN_YEAR, `Year must be ${MIN_YEAR} or later.`)
    .max(MAX_YEAR, `Year must be ${MAX_YEAR} or earlier.`),
);

const readingField = numeric("Current reading").pipe(
  z
    .number()
    .min(0, "Reading cannot be negative.")
    .max(MAX_READING, "That reading looks too large — please check it."),
);

const rateField = numeric("Rate per unit").pipe(
  z
    .number()
    .min(0, "Rate cannot be negative.")
    .max(MAX_RATE, "That rate looks too large — please check it."),
);

export const readingSchema = z.object({
  meterId: z.string({ error: "Select a meter." }).min(1, "Select a meter."),
  month: monthField,
  year: yearField,
  currentReading: readingField,
  ratePerUnit: rateField,
});

export const readingUpdateSchema = z.object({
  month: monthField.optional(),
  year: yearField.optional(),
  currentReading: readingField.optional(),
  ratePerUnit: rateField.optional(),
});

const mainBillAmountField = numeric("Main bill amount").pipe(
  z
    .number()
    .min(0, "Bill amount cannot be negative.")
    .max(1_000_000_000, "That bill amount looks too large — please check it."),
);

export const mainBillSchema = z.object({
  month: monthField,
  year: yearField,
  amount: mainBillAmountField,
});

/**
 * Form-shaped variants.
 *
 * `<input type="month">` yields a single `YYYY-MM` string, so the form
 * validates that shape and splits it into month/year on submit — the API keeps
 * taking the two numbers it always has.
 */
export const readingFormSchema = z.object({
  meterId: z.string().min(1, "Select a meter."),
  readingMonth: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Choose a billing month."),
  currentReading: readingField,
  ratePerUnit: rateField,
});

export const readingEditFormSchema = readingFormSchema.omit({ meterId: true });

export type ReadingFormValues = z.input<typeof readingFormSchema>;
export type ReadingEditFormValues = z.input<typeof readingEditFormSchema>;

const emailField = z
  .string({ error: "Email is required." })
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."));

const passwordField = z
  .string({ error: "Password is required." })
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be 72 characters or fewer.");

export const signupSchema = z.object({
  email: emailField,
  password: passwordField,
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ error: "Password is required." }).min(1, "Password is required."),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type PropertyInput = z.infer<typeof propertySchema>;
export type MeterInput = z.infer<typeof meterSchema>;
export type ReadingInput = z.infer<typeof readingSchema>;
export type ReadingUpdateInput = z.infer<typeof readingUpdateSchema>;
export type MainBillInput = z.infer<typeof mainBillSchema>;

/** Flattens a Zod error into `{ field: message }` for form and API responses. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!result[key]) {
      result[key] = issue.message;
    }
  }

  return result;
}

/** The first human-readable message from a Zod error. */
export function firstErrorMessage(
  error: z.ZodError,
  fallback = "Please check the form.",
): string {
  return error.issues[0]?.message ?? fallback;
}
