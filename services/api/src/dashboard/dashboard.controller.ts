import { Controller, Get, UseGuards } from "@nestjs/common";
import type { DashboardSnapshot } from "@stayboost/domain";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { SampleDashboardProvider } from "./sample-data.provider";

@Controller({ path: "dashboard", version: "1" })
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly provider: SampleDashboardProvider) {}

  /** The Command Center snapshot for the authenticated user's active property. */
  @Get()
  snapshot(): DashboardSnapshot {
    return this.provider.build();
  }
}
