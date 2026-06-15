import { Body, Controller, Get, Param, Post, UsePipes } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { propertyProfileInputSchema, type PropertyProfileInput } from "@stayboost/domain";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AnalyzerService, type AnalyzerRunResult } from "./analyzer.service";

@Controller({ path: "analyzer", version: "1" })
export class AnalyzerController {
  constructor(private readonly analyzer: AnalyzerService) {}

  // Public + AI-backed (cost): keep the limit tight. A captcha is enforced at the
  // edge before this route in production (see docs/adr/0002).
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("run")
  @UsePipes(new ZodValidationPipe(propertyProfileInputSchema))
  async run(@Body() body: PropertyProfileInput): Promise<AnalyzerRunResult> {
    return this.analyzer.run(body);
  }

  @Get("reports/:token")
  async getReport(@Param("token") token: string): Promise<AnalyzerRunResult> {
    return this.analyzer.getByToken(token);
  }
}
