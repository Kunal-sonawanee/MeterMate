"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, Input } from "@/components/ui/field";
import { signup, ApiRequestError } from "@/lib/api";
import { signupSchema, type SignupInput } from "@/lib/validation";

export function SignupForm() {
  const router = useRouter();
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignupInput) {
    setRootError(null);
    try {
      await signup(values);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.status === 409) {
          setError("email", { message: error.message });
          return;
        }
        setRootError(error.message);
        return;
      }
      setRootError("Something went wrong. Please try again.");
      return;
    }

    const result = await signIn("credentials", { ...values, redirect: false });
    if (result?.error) {
      setRootError("Account created — sign in to continue.");
      router.push("/login");
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <div>
        <h1 className="text-lg font-semibold">Create your account</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Free, no card needed — just an email and password.
        </p>
      </div>

      <Field error={errors.email?.message}>
        <FieldLabel>Email</FieldLabel>
        <Input type="email" autoComplete="email" autoFocus {...register("email")} />
      </Field>

      <Field
        error={errors.password?.message}
        hint="At least 8 characters."
      >
        <FieldLabel>Password</FieldLabel>
        <Input
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
      </Field>

      {rootError ? (
        <p
          role="alert"
          className="bg-destructive-soft text-destructive rounded-lg px-3 py-2 text-sm"
        >
          {rootError}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}
