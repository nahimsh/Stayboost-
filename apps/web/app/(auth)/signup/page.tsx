import type { Metadata } from "next";
import { getDictionary } from "@stayboost/i18n";
import { SignupForm } from "@/components/auth/signup-form";

const t = getDictionary().auth.signup;

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  robots: { index: false },
};

export default function SignupPage(): React.JSX.Element {
  return <SignupForm />;
}
