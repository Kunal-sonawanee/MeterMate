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
import { loginSchema, type LoginInput } from "@/lib/validation";

export function LoginForm() {
  const router = useRouter();
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setRootError(null);
    const result = await signIn("credentials", { ...values, redirect: false });

    if (result?.error) {
      setRootError("That email or password isn't right.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <div>
        <h1 className="text-lg font-semibold">Sign in</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Welcome back to MeterMate.
        </p>
      </div>

      <Field error={errors.email?.message}>
        <FieldLabel>Email</FieldLabel>
        <Input type="email" autoComplete="email" autoFocus {...register("email")} />
      </Field>

      <Field error={errors.password?.message}>
        <FieldLabel>Password</FieldLabel>
        <Input
          type="password"
          autoComplete="current-password"
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
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        New here?{" "}
        <Link href="/signup" className="text-primary font-medium">
          Create an account
        </Link>
      </p>
    </form>
  );
}
