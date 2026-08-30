import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/app/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Wordmark className="mb-8" />

      <p className="text-muted-foreground text-sm font-medium">404</p>
      <h1 className="mt-1 text-xl font-semibold">
        This page doesn&apos;t exist
      </h1>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm text-pretty">
        The link may be out of date, or the meter or property it pointed to has
        since been deleted.
      </p>

      <Button className="mt-6" render={<Link href="/" />}>
        Back to overview
      </Button>
    </div>
  );
}
