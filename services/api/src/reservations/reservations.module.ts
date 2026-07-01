import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ChannelsService } from "./channels.service";
import { ReservationsService } from "./reservations.service";
import { IcalConnector } from "./ical-connector.service";
import { SyncQueueService } from "./sync-queue.service";
import { ReservationsController } from "./reservations.controller";

@Module({
  imports: [AuthModule],
  controllers: [ReservationsController],
  providers: [ChannelsService, ReservationsService, IcalConnector, SyncQueueService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
