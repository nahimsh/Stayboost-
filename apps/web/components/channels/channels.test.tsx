import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ChannelConnection } from "@stayboost/domain";
import { getDictionary } from "@stayboost/i18n";
import { ConnectionCard } from "./connection-card";
import { ChannelConnectCenter } from "./channel-connect-center";

const { replace, channels, auth, properties } = vi.hoisted(() => ({
  replace: vi.fn(),
  channels: { list: vi.fn(), create: vi.fn(), sync: vi.fn(), logs: vi.fn() },
  auth: { me: vi.fn() },
  properties: { list: vi.fn() },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/lib/api", () => ({ api: { channels, auth, properties } }));

const t = getDictionary().channels;

const connection: ChannelConnection = {
  id: "c1",
  propertyId: "p1",
  provider: "vrbo",
  icalUrl: "https://vrbo.com/calendar.ics",
  status: "active",
  health: "healthy",
  lastSyncedAt: new Date().toISOString(),
  lastError: null,
};

beforeEach(() => {
  replace.mockClear();
  Object.values(channels).forEach((f) => f.mockReset());
  auth.me.mockReset();
  properties.list.mockReset();
});

describe("ConnectionCard", () => {
  it("shows provider, health, and lazily loads logs", async () => {
    channels.logs.mockResolvedValue([]);
    render(<ConnectionCard connection={connection} onSynced={vi.fn()} />);

    expect(screen.getByText("Vrbo")).toBeInTheDocument();
    expect(screen.getByText(t.health.healthy)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t.card.viewLogs }));
    await waitFor(() => expect(channels.logs).toHaveBeenCalledWith("c1"));
    expect(await screen.findByText(t.logs.empty)).toBeInTheDocument();
  });
});

describe("ChannelConnectCenter", () => {
  it("renders the empty state when no channels are connected", async () => {
    auth.me.mockResolvedValue({ onboardingComplete: true });
    properties.list.mockResolvedValue([{ id: "p1", name: "Villa", type: "villa", country: "PT", city: "Lagos", roomsCount: 2, airbnbUrl: null, bookingUrl: null, websiteUrl: null }]);
    channels.list.mockResolvedValue([]);

    render(<ChannelConnectCenter />);
    expect(await screen.findByText(t.empty.title)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t.connect.submit })).toBeInTheDocument();
  });

  it("redirects to onboarding when the property wizard isn't done", async () => {
    auth.me.mockResolvedValue({ onboardingComplete: false });
    render(<ChannelConnectCenter />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/onboarding"));
  });
});
