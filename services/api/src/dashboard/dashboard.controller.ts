import { Controller, Get, UseGuards } from "@nestjs/common";
import type { DashboardSnapshot } from "@stayboost/domain";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthService } from "../auth/auth.service";
import { CurrentUser, type AuthenticatedUser } from "../auth/decorators";
import { PropertiesService } from "../properties/properties.service";
import { ReservationsService } from "../reservations/reservations.service";
import { SampleDashboardProvider } from "./sample-data.provider";

@Controller({ path: "dashboard", version: "1" })
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly provider: SampleDashboardProvider,
    private readonly auth: AuthService,
    private readonly properties: PropertiesService,
    private readonly reservations: ReservationsService,
  ) {}

  /**
   * Command Center snapshot. Check-ins, check-outs, and occupancy come from live
   * reservations when a channel is connected and synced; revenue/health/leads/
   * notifications remain estimated (`demo`) until their modules land.
   */
  @Get()
  async snapshot(@CurrentUser() user: AuthenticatedUser): Promise<DashboardSnapshot> {
    const orgId = await this.auth.getPrimaryOrgId(user.id);
    const property = orgId ? await this.properties.primaryForOrg(orgId) : null;

    const snapshot = this.provider.build(
      property
        ? { propertyName: property.name, propertyType: property.type, totalUnits: property.roomsCount }
        : {},
    );
    if (!orgId || !property) return snapshot;

    const metrics = await this.reservations.metrics(
      orgId,
      property.id,
      property.name,
      property.roomsCount,
    );
    if (!metrics.hasData) return snapshot;

    // Live reservation data replaces the sampled booking widgets.
    return {
      ...snapshot,
      checkIns: metrics.checkIns,
      checkOuts: metrics.checkOuts,
      occupancy: metrics.occupancy,
    };
  }
}
