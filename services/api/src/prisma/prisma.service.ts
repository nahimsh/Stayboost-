import { Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { PrismaClient, type Prisma } from "@stayboost/db";

/** A Prisma transaction client (the subset available inside $transaction). */
export type TenantClient = Prisma.TransactionClient;

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

  /**
   * Run tenant-scoped work with Postgres RLS enforced. Opens a transaction, sets
   * the request's `app.org_id` (parameterized — safe), and runs `fn` against the
   * tx. Every query on RLS-protected tables inside is confined to that tenant.
   * Use this for ALL reservation / channel-connection access.
   */
  withTenant<T>(orgId: string, fn: (tx: TenantClient) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.org_id', ${orgId}, true)`;
      return fn(tx);
    });
  }
}
