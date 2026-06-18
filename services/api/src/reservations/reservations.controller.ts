import {
  BadRequestException,
  Body,
  Controller,
  Get,
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
  type SyncResult,
} from "@stayboost/domain";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AuthService } from "../auth/auth.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CsrfGuard } from "../auth/guards/csrf.guard";
import { CurrentUser, Roles, type AuthenticatedUser } from "../auth/decorators";
import { ChannelsService } from "./channels.service";
import { ReservationsService } from "./reservations.service";

@Controller({ path: "", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(
    private readonly channels: ChannelsService,
    private readonly reservations: ReservationsService,
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
  @Post("channels/:id/sync")
  async sync(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SyncResult> {
    return this.reservations.sync(await this.orgIdFor(user), id, user.id);
  }

  @Get("reservations")
  async list(
    @Query("propertyId", ParseUUIDPipe) propertyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Reservation[]> {
    return this.reservations.listForProperty(await this.orgIdFor(user), propertyId);
  }
}
