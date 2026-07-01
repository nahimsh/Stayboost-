import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  createChannelConnectionInputSchema,
  type ChannelConnection,
  type CreateChannelConnectionInput,
  type Reservation,
  type SyncLog,
} from "@stayboost/domain";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AuthService } from "../auth/auth.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CsrfGuard } from "../auth/guards/csrf.guard";
import { CurrentUser, Roles, type AuthenticatedUser } from "../auth/decorators";
import { ChannelsService } from "./channels.service";
import { ReservationsService } from "./reservations.service";
import { SyncQueueService, type SyncJobAccepted } from "./sync-queue.service";

@Controller({ path: "", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(
    private readonly channels: ChannelsService,
    private readonly reservations: ReservationsService,
    private readonly syncQueue: SyncQueueService,
    private readonly auth: AuthService,
  ) {}

  private async orgIdFor(user: AuthenticatedUser): Promise<string> {
    const orgId = await this.auth.getPrimaryOrgId(user.id);
    if (!orgId) throw new BadRequestException("No organization found for this user");
    return orgId;
  }

  @Roles("manager")
  @UseGuards(CsrfGuard)
  @Post("channels")
  @UsePipes(new ZodValidationPipe(createChannelConnectionInputSchema))
  async createChannel(
    @Body() body: CreateChannelConnectionInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ChannelConnection> {
    return this.channels.create(await this.orgIdFor(user), body, { userId: user.id });
  }

  @Get("channels")
  async listChannels(@CurrentUser() user: AuthenticatedUser): Promise<ChannelConnection[]> {
    return this.channels.list(await this.orgIdFor(user));
  }

  @Roles("manager")
  @UseGuards(CsrfGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(202)
  @Post("channels/:id/sync")
  async sync(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SyncJobAccepted> {
    const orgId = await this.orgIdFor(user);
    // Verify the connection exists and belongs to this org before enqueueing.
    await this.channels.requireConnection(orgId, id);
    return this.syncQueue.enqueue(orgId, id);
  }

  @Get("channels/:id/logs")
  async logs(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SyncLog[]> {
    return this.channels.listLogs(await this.orgIdFor(user), id);
  }

  @Get("reservations")
  async list(
    @Query("propertyId", ParseUUIDPipe) propertyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Reservation[]> {
    return this.reservations.listForProperty(await this.orgIdFor(user), propertyId);
  }
}
