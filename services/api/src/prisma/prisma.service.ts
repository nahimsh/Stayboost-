import { Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@stayboost/db";

/**
 * Owns the Prisma connection lifecycle within the Nest application. Inject this
 * service everywhere in the API — do NOT import the `prisma` singleton from
 * `@stayboost/db` here, or the process would open two connection pools. The
 * singleton is reserved for Next.js / standalone scripts.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
