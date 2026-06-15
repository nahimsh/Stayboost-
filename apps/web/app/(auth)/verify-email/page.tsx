import type { Metadata } from "next";
import { getDictionary } from "@stayboost/i18n";
import { VerifyEmailView } from "@/components/auth/verify-email-view";

const t = getDictionary().auth.verify;

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  robots: { index: false },
};

export default function VerifyEmailPage(): React.JSX.Element {
  return <VerifyEmailView />;
}
