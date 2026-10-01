import Image from "next/image";
import { cn } from "@/lib/utils";
import { translate, type Language } from "@/lib/i18n/translate";
import kantexIcon from "@/app/icon.svg";

/**
 * Maker credit and copyright. MeterMate is the product; Kantex Technologies
 * is who builds it — this is the one place that says so.
 */
export function BrandFooter({
  language,
  className,
}: {
  language: Language;
  className?: string;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("flex flex-col items-center gap-1.5 py-6 text-center", className)}>
      <Image src={kantexIcon} alt="" aria-hidden width={20} height={20} className="rounded-[5px] opacity-70" />
      <p className="text-muted-foreground text-xs">{translate(language, "brand.poweredBy")}</p>
      <p className="text-muted-foreground/80 text-2xs">
        {translate(language, "brand.copyright", { year })}
      </p>
    </footer>
  );
}
