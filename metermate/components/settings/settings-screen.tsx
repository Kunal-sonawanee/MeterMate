"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Check, ChevronRight, Info, LogOut } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel, Input, InputAffix } from "@/components/ui/field";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { LanguageToggle } from "@/components/app/language-toggle";
import { BrandFooter } from "@/components/app/brand-footer";
import { Skeleton } from "@/components/ui/states";
import { usePreferences } from "@/hooks/use-preferences";
import { useDashboard, useMainBill, useSaveMainBill } from "@/hooks/use-metermate";
import { MAX_RATE } from "@/lib/validation";
import { currentMonthInputValue, formatUnits, fromMonthInputValue } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";

/**
 * Ordered by how often a landlord actually opens it: language and appearance
 * are the settings someone might revisit, the tariff default a little less
 * often, account and one-time setup (properties/meters) almost never — those
 * sit at the bottom on purpose.
 */
export function SettingsScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { data: session } = useSession();
  const { preferences, update } = usePreferences();
  const { data: dashboard } = useDashboard();

  // The input shows the saved rate until the user types; `draft` holds their
  // in-progress edit, so no effect is needed to keep the two in step.
  const [draft, setDraft] = useState<string | null>(null);
  const rate = draft ?? String(preferences.defaultRatePerUnit);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save(event: React.FormEvent) {
    event.preventDefault();
    const parsed = Number(rate);

    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Enter a rate of 0 or more.");
      return;
    }
    if (parsed > MAX_RATE) {
      setError("That rate looks too large — please check it.");
      return;
    }

    setError(null);
    update({ defaultRatePerUnit: parsed });
    setDraft(null);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <>
      <PageHeader title={t("settings.title")} description={t("settings.subtitle")} />

      <div className="grid max-w-2xl gap-4 sm:gap-5">
        <MainBillCard />

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("settings.language")}</CardTitle>
              <CardDescription>{t("settings.languageDescription")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <LanguageToggle />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("settings.appearance")}</CardTitle>
              <CardDescription>{t("settings.appearanceDescription")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ThemeToggle />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("settings.defaultRate")}</CardTitle>
              <CardDescription>{t("settings.defaultRateDescription")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <form
              onSubmit={save}
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <div className="grid gap-1.5 sm:max-w-48 sm:flex-1">
                <label className="text-foreground text-sm font-medium">Rate</label>
                <InputAffix
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  prefix="₹"
                  suffix="/unit"
                  value={rate}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setSaved(false);
                  }}
                />
                {error ? (
                  <p className="text-destructive text-xs font-medium">{error}</p>
                ) : null}
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" size="lg" className="sm:h-9">
                  {t("common.save")}
                </Button>
                {saved ? (
                  <span
                    role="status"
                    className="text-success inline-flex items-center gap-1 text-sm font-medium"
                  >
                    <Check aria-hidden className="size-4" />
                    Saved
                  </span>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("settings.account")}</CardTitle>
              <CardDescription>{session?.user?.email ?? "…"}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              variant="outline"
              onClick={() =>
                signOut({ redirect: false }).then(() => {
                  router.push("/login");
                  router.refresh();
                })
              }
            >
              <LogOut aria-hidden />
              {t("settings.signOut")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("settings.oneTimeSetup")}</CardTitle>
              <CardDescription>{t("settings.oneTimeSetupDescription")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 pt-0">
            <Link href="/meters" className="border-border hover:bg-muted flex min-h-11 items-center justify-between rounded-lg border px-3 text-sm font-medium">
              {t("settings.manageMeters")} <ChevronRight aria-hidden className="size-4" />
            </Link>
            <Link href="/properties" className="border-border hover:bg-muted flex min-h-11 items-center justify-between rounded-lg border px-3 text-sm font-medium">
              {t("settings.manageProperties")} <ChevronRight aria-hidden className="size-4" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("settings.yourData")}</CardTitle>
              <CardDescription>{t("settings.yourDataDescription")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <dl className="divide-border divide-y">
              <DataRow
                label={t("settings.properties")}
                value={dashboard?.counts.properties}
              />
              <DataRow label={t("settings.meters")} value={dashboard?.counts.meters} />
              <DataRow
                label={t("settings.unitsThisCycle")}
                value={
                  dashboard
                    ? formatUnits(dashboard.totals.unitsConsumed)
                    : undefined
                }
              />
            </dl>

            <p className="text-muted-foreground mt-4 flex gap-2 text-xs">
              <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Properties, meters and readings are stored in your database. The
                rate default, theme and language above are saved in this browser
                only.
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <BrandFooter language={language} />
    </>
  );
}

/**
 * The only place the main bill can be edited — Home only ever displays it.
 * Defaults to the current month, since that's what almost every visit here
 * is for; the month picker exists for backfilling an earlier one.
 */
function MainBillCard() {
  const { t } = useTranslation();
  const [billMonth, setBillMonth] = useState(currentMonthInputValue());
  const period = fromMonthInputValue(billMonth)!;

  const { data: mainBill } = useMainBill(period);
  const saveMainBill = useSaveMainBill();

  const [draft, setDraft] = useState<string | null>(null);
  const [billError, setBillError] = useState<string | null>(null);
  const amountValue = draft ?? (mainBill ? String(mainBill.amount) : "");

  function saveBill(event: React.FormEvent) {
    event.preventDefault();
    const amount = Number(amountValue);
    if (!Number.isFinite(amount) || amount < 0) {
      setBillError("Enter an amount of 0 or more.");
      return;
    }
    setBillError(null);
    saveMainBill.mutate(
      { month: period.month, year: period.year, amount },
      { onSuccess: () => setDraft(null) },
    );
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{t("settings.mainBill")}</CardTitle>
          <CardDescription>{t("settings.mainBillDescription")}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={saveBill} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field>
            <FieldLabel>{t("settings.billingMonth")}</FieldLabel>
            <Input
              type="month"
              max={currentMonthInputValue()}
              value={billMonth}
              onChange={(event) => {
                setBillMonth(event.target.value);
                setDraft(null);
              }}
            />
          </Field>
          <Field error={billError ?? undefined}>
            <FieldLabel>{t("settings.totalAmount")}</FieldLabel>
            <InputAffix
              prefix="₹"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amountValue}
              onChange={(event) => setDraft(event.target.value)}
            />
          </Field>
          <Button type="submit" size="lg" className="sm:h-9" disabled={saveMainBill.isPending}>
            {t("common.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DataRow({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-sm font-medium" data-numeric="">
        {value === undefined ? <Skeleton className="h-4 w-10" /> : value}
      </dd>
    </div>
  );
}
