import { randomUUID } from "node:crypto";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { GrowthReport, PropertyProfileInput } from "@stayboost/domain";
import { PrismaService } from "../prisma/prisma.service";
import { AiClient } from "../ai/ai.client";

export interface AnalyzerRunResult {
  readonly token: string;
  readonly report: GrowthReport;
}

const AGENT = "onboarding_scout";

@Injectable()
export class AnalyzerService {
  private readonly logger = new Logger(AnalyzerService.name);

  constructor(
    private readonly ai: AiClient,
    private readonly prisma: PrismaService,
  ) {}

  /** Run the analyzer, persist the (anonymous) report under a claim token, and
   *  audit the AI action. The report is returned for immediate display.
   *  Persistence is best-effort: a DB outage must not break this public,
   *  pre-signup tool — we log and still return the generated report. */
  async run(input: PropertyProfileInput): Promise<AnalyzerRunResult> {
    const report = await this.ai.analyze(input);
    const token = randomUUID();

    try {
      await this.prisma.$transaction([
        this.prisma.analyzerReport.create({
          data: { token, input, report, engine: report.engine, model: report.model },
        }),
        this.prisma.aiAction.create({
          data: {
            agent: AGENT,
            actionType: "analyze_property",
            input,
            output: report,
            rationale: report.summary,
            model: report.model,
            engine: report.engine,
            status: "executed",
          },
        }),
      ]);
    } catch (error) {
      this.logger.error("Analyzer persistence failed; returning report unsaved", error);
    }

    return { token, report };
  }

  async getByToken(token: string): Promise<AnalyzerRunResult> {
    const row = await this.prisma.analyzerReport.findUnique({ where: { token } });
    if (!row) {
      throw new NotFoundException("Report not found");
    }
    return { token: row.token, report: row.report as unknown as GrowthReport };
  }
}
