import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DashboardController } from "./dashboard.controller";
import { SampleDashboardProvider } from "./sample-data.provider";

@Module({
  imports: [AuthModule],
  controllers: [DashboardController],
  providers: [SampleDashboardProvider],
})
export class DashboardModule {}
