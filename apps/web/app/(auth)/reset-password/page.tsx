import type { Metadata } from "next";
import { getDictionary } from "@stayboost/i18n";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

const t = getDictionary().auth.reset;

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  robots: { index: false },
};

export default function ResetPasswordPage(): React.JSX.Element {
  return <ResetPasswordForm />;
}
