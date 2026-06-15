"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { buttonVariants, cn } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";
import { api } from "@/lib/api";
import { AuthCard } from "./auth-card";

const t = getDictionary().auth.verify;

type Status = "verifying" | "success" | "error";

export function VerifyEmailView(): React.JSX.Element {
  const [status, setStatus] = useState<Status>("verifying");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      return;
    }
    api.auth
      .verifyEmail({ token })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, []);

  if (status === "verifying") {
    return (
      <AuthCard title={t.verifying}>
        <div className="flex justify-center py-4" role="status" aria-label={t.verifying}>
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        </div>
      </AuthCard>
    );
  }

  if (status === "success") {
    return (
      <AuthCard title={t.successTitle}>
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="size-10 text-success" aria-hidden />
          <p className="text-sm text-muted-foreground">{t.successBody}</p>
          <Link href="/dashboard" className={cn(buttonVariants(), "w-full")}>
            {t.continue}
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t.errorTitle}>
      <div className="flex flex-col items-center gap-4 text-center">
        <XCircle className="size-10 text-destructive" aria-hidden />
        <p className="text-sm text-muted-foreground">{t.errorBody}</p>
        <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
          {getDictionary().auth.magic.backToLogin}
        </Link>
      </div>
    </AuthCard>
  );
}
