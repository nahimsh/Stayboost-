import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

/**
 * A process-wide PrismaClient. In dev we cache it on globalThis so Next.js /
 * Nest hot-reloads don't exhaust the connection pool.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
