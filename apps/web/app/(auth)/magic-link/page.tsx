import type { Metadata } from "next";
import { getDictionary } from "@stayboost/i18n";
import { MagicLinkView } from "@/components/auth/magic-link-view";

const t = getDictionary().auth.login;

export const metadata: Metadata = {
  title: t.magicLink,
  description: t.meta.description,
  robots: { index: false },
};

export default function MagicLinkPage(): React.JSX.Element {
  return <MagicLinkView />;
}
