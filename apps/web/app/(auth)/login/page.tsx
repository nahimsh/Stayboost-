import type { Metadata } from "next";
import { getDictionary } from "@stayboost/i18n";
import { LoginForm } from "@/components/auth/login-form";

const t = getDictionary().auth.login;

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  robots: { index: false },
};

export default function LoginPage(): React.JSX.Element {
  return <LoginForm />;
}
