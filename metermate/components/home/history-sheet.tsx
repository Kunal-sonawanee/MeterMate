"use client";

import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogDismiss,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReadingsBrowser } from "@/components/readings/readings-browser";
import { lastMonthInputValue } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";

/**
 * History lives behind one button rather than its own page — it's something
 * you check, not something you live in. Opens pre-filtered to last month,
 * the period someone checking history is usually actually after.
 */
export function HistorySheet() {
  const { t } = useTranslation();

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="lg" className="w-full">
            <History aria-hidden />
            {t("home.viewHistory")}
          </Button>
        }
      />
      <DialogContent size="lg">
        <DialogHeader>
          <div>
            <DialogTitle>{t("home.historyTitle")}</DialogTitle>
            <DialogDescription>{t("home.historyDescription")}</DialogDescription>
          </div>
          <DialogDismiss />
        </DialogHeader>
        <DialogBody>
          <ReadingsBrowser defaultMonthValue={lastMonthInputValue()} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
