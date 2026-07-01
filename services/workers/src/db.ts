import { PrismaClient, type Prisma } from "@stayboost/db";

export type TenantClient = Prisma.TransactionClient;

// Process-level singleton — workers run as a single long-lived process.
// Not cached on globalThis (unlike the Next.js singleton) because hot-reload
// isn't a concern here.
export const prisma: PrismaClient = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

/**
 * Run `fn` inside a Postgres transaction with the `app.org_id` session variable
 * set so RLS policies confine all queries to `orgId`'s rows.
 */
export function withTenant<T>(orgId: string, fn: (tx: TenantClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.org_id', ${orgId}, true)`;
    return fn(tx);
  });
}
