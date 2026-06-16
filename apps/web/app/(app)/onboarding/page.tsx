import type { Metadata } from "next";
import { getDictionary } from "@stayboost/i18n";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = {
  title: getDictionary().onboarding.meta.title,
  robots: { index: false },
};

export default function OnboardingPage(): React.JSX.Element {
  return <OnboardingWizard />;
}
