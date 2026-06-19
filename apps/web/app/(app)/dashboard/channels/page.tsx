import type { Metadata } from "next";
import { getDictionary } from "@stayboost/i18n";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ChannelConnectCenter } from "@/components/channels/channel-connect-center";

export const metadata: Metadata = {
  title: getDictionary().channels.meta.title,
  robots: { index: false },
};

export default function ChannelsPage(): React.JSX.Element {
  return (
    <div className="flex min-h-dvh bg-secondary/20">
      <Sidebar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        <ChannelConnectCenter />
      </main>
    </div>
  );
}
