import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PropertiesModule } from "../properties/properties.module";
import { DashboardController } from "./dashboard.controller";
import { SampleDashboardProvider } from "./sample-data.provider";

@Module({
  imports: [AuthModule, PropertiesModule],
  controllers: [DashboardController],
  providers: [SampleDashboardProvider],
})
export class DashboardModule {}
