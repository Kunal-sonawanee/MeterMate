import Image from "next/image";
import { Wordmark } from "@/components/app/logo";
import { BrandFooter } from "@/components/app/brand-footer";
import kantexIcon from "@/app/icon.svg";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/40 relative flex min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden px-4 py-10">
      {/* Decorative watermark — hidden from screen readers, purely visual. */}
      <Image
        src={kantexIcon}
        alt=""
        aria-hidden
        width={480}
        height={480}
        className="pointer-events-none absolute -right-24 -bottom-24 opacity-[0.04] select-none dark:opacity-[0.06]"
      />

      <Wordmark className="relative" />
      <div className="border-border bg-card relative w-full max-w-sm rounded-xl border p-6 shadow-sm sm:p-7">
        {children}
      </div>

      <BrandFooter language="en" className="relative py-0" />
    </div>
  );
}
