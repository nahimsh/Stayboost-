import { Controller, Get, UseGuards } from "@nestjs/common";
import type { DashboardSnapshot } from "@stayboost/domain";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthService } from "../auth/auth.service";
import { CurrentUser, type AuthenticatedUser } from "../auth/decorators";
import { PropertiesService } from "../properties/properties.service";
import { SampleDashboardProvider } from "./sample-data.provider";
import { DashboardService } from "./dashboard.service";

@Controller({ path: "dashboard", version: "1" })
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly provider: SampleDashboardProvider,
    private readonly auth: AuthService,
    private readonly properties: PropertiesService,
    private readonly dashboardService: DashboardService,
  ) {}

  @Get()
  async snapshot(@CurrentUser() user: AuthenticatedUser): Promise<DashboardSnapshot> {
    const orgId = await this.auth.getPrimaryOrgId(user.id);
    const property = orgId ? await this.properties.primaryForOrg(orgId) : null;

    if (!orgId || !property) {
      return this.provider.build();
    }

    return this.dashboardService.snapshot(orgId, property);
  }
}
