import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface AuditEntry {
  readonly action: string;
  readonly actorUserId?: string | null;
  readonly orgId?: string | null;
  readonly targetType?: string;
  readonly targetId?: string;
  readonly ip?: string | undefined;
  readonly userAgent?: string | undefined;
  readonly metadata?: Record<string, unknown>;
}

/** Records human/system write actions. Failures never block the primary action. */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          actorUserId: entry.actorUserId ?? null,
          orgId: entry.orgId ?? null,
          targetType: entry.targetType ?? null,
          targetId: entry.targetId ?? null,
          ip: entry.ip ?? null,
          userAgent: entry.userAgent ?? null,
          metadata: (entry.metadata ?? {}) as object,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log for "${entry.action}"`, error);
    }
  }
}
