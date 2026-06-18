import { BadGatewayException, Injectable, Logger } from "@nestjs/common";
import type { CanonicalReservation, ChannelProvider } from "@stayboost/domain";
import { reservationsFromIcal } from "../integrations/ical";

const FETCH_TIMEOUT_MS = 20_000;
const MAX_BYTES = 5_000_000; // guard against unbounded calendar feeds

/**
 * Fetches a property's iCal feed (the export URL Airbnb/Booking.com give hosts)
 * and normalizes it into canonical reservations. `fetch` is injectable for tests.
 */
@Injectable()
export class IcalConnector {
  private readonly logger = new Logger(IcalConnector.name);
  fetchImpl: typeof fetch = fetch;

  async fetchReservations(
    icalUrl: string,
    provider: ChannelProvider,
  ): Promise<CanonicalReservation[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await this.fetchImpl(icalUrl, {
        signal: controller.signal,
        headers: { Accept: "text/calendar, text/plain" },
      });
      if (!response.ok) {
        throw new BadGatewayException(`iCal feed responded ${response.status}`);
      }
      const text = await response.text();
      if (text.length > MAX_BYTES) {
        throw new BadGatewayException("iCal feed is too large");
      }
      return reservationsFromIcal(text, provider);
    } catch (error) {
      this.logger.warn(`iCal fetch failed for ${provider}`, error as Error);
      throw error instanceof BadGatewayException
        ? error
        : new BadGatewayException("Could not read the iCal feed");
    } finally {
      clearTimeout(timeout);
    }
  }
}
