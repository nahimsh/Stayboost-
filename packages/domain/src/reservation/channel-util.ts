import type { Channel } from "../analyzer/property-profile";
import type { ChannelProvider } from "./reservation";

export function channelFor(provider: ChannelProvider): Channel {
  if (provider === "airbnb") return "airbnb";
  if (provider === "booking_com") return "booking_com";
  return "other";
}
