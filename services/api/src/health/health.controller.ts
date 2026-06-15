import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { PrismaService } from "../prisma/prisma.service";

@Controller({ path: "health", version: "1" })
@SkipThrottle()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness: the process is up. Cheap, no dependencies. */
  @Get()
  live(): { status: "ok"; timestamp: string } {
    return { status: "ok", timestamp: new Date().toISOString() };
  }

  /** Readiness: dependencies (DB) are reachable — gate load-balancer traffic on this. */
  @Get("ready")
  async ready(): Promise<{ status: "ready"; checks: { database: "ok" } }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException("Database is not reachable");
    }
    return { status: "ready", checks: { database: "ok" } };
  }
}
