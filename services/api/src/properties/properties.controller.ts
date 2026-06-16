import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import type { Request } from "express";
import {
  propertySetupInputSchema,
  type PropertySetupInput,
  type PropertySummary,
} from "@stayboost/domain";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AuthService } from "../auth/auth.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CsrfGuard } from "../auth/guards/csrf.guard";
import { CurrentUser, Roles, type AuthenticatedUser } from "../auth/decorators";
import { PropertiesService } from "./properties.service";

@Controller({ path: "properties", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard)
export class PropertiesController {
  constructor(
    private readonly properties: PropertiesService,
    private readonly auth: AuthService,
  ) {}

  @Roles("manager") // manager or higher (owner/super_admin) may create properties
  @UseGuards(CsrfGuard)
  @Post()
  @UsePipes(new ZodValidationPipe(propertySetupInputSchema))
  async create(
    @Body() body: PropertySetupInput,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<PropertySummary> {
    const orgId = await this.auth.getPrimaryOrgId(user.id);
    if (!orgId) throw new BadRequestException("No organization found for this user");
    return this.properties.create(body, {
      userId: user.id,
      orgId,
      ip: req.ip,
      userAgent: req.header("user-agent") ?? undefined,
    });
  }

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser): Promise<PropertySummary[]> {
    const orgId = await this.auth.getPrimaryOrgId(user.id);
    return orgId ? this.properties.listForOrg(orgId) : [];
  }
}
