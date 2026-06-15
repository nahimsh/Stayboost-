import type { Metadata } from "next";
import { getDictionary } from "@stayboost/i18n";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

const t = getDictionary().auth.forgot;

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  robots: { index: false },
};

export default function ForgotPasswordPage(): React.JSX.Element {
  return <ForgotPasswordForm />;
}
