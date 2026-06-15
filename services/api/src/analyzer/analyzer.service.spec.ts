import { describe, expect, it, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import type { GrowthReport, PropertyProfileInput } from "@stayboost/domain";
import type { PrismaService } from "../prisma/prisma.service";
import type { AiClient } from "../ai/ai.client";
import { AnalyzerService } from "./analyzer.service";

const profile: PropertyProfileInput = {
  propertyName: "Sea Breeze Villa",
  propertyType: "villa",
  country: "Portugal",
  city: "Lagos",
  unitsCount: 2,
  currency: "EUR",
  channels: ["airbnb", "booking_com"],
  biggestChallenge: "more_bookings",
};

const report = {
  summary: "A grounded growth summary.",
  overallScore: 64,
  estimatedMonthlyUplift: { lowMinor: 50000, highMinor: 120000, currency: "EUR" },
  pillars: [],
  quickWins: [{ title: "Win", action: "Do it", pillar: "acquire" }],
  confidence: 0.55,
  model: "heuristic-v1",
  engine: "heuristic",
  generatedAt: new Date().toISOString(),
} as unknown as GrowthReport;

function makeService() {
  const analyze = vi.fn().mockResolvedValue(report);
  const reportCreate = vi.fn().mockReturnValue({ kind: "report" });
  const actionCreate = vi.fn().mockReturnValue({ kind: "action" });
  const $transaction = vi.fn().mockResolvedValue([]);
  const findUnique = vi.fn();
  const ai = { analyze } as unknown as AiClient;
  const prisma = {
    analyzerReport: { create: reportCreate, findUnique },
    aiAction: { create: actionCreate },
    $transaction,
  } as unknown as PrismaService;
  return { service: new AnalyzerService(ai, prisma), analyze, $transaction, findUnique, reportCreate, actionCreate };
}

describe("AnalyzerService", () => {
  it("runs analysis, persists the report, and audits the AI action", async () => {
    const { service, analyze, $transaction, reportCreate, actionCreate } = makeService();
    const result = await service.run(profile);

    expect(analyze).toHaveBeenCalledWith(profile);
    expect(result.report).toEqual(report);
    expect(typeof result.token).toBe("string");
    expect(result.token.length).toBeGreaterThan(0);
    // Report + audit row written atomically.
    expect($transaction).toHaveBeenCalledOnce();
    expect(reportCreate).toHaveBeenCalledOnce();
    expect(actionCreate).toHaveBeenCalledOnce();
    expect(actionCreate.mock.calls[0]?.[0].data.agent).toBe("onboarding_scout");
  });

  it("returns a stored report by token", async () => {
    const { service, findUnique } = makeService();
    findUnique.mockResolvedValue({ token: "tok-1", report });
    const result = await service.getByToken("tok-1");
    expect(result.token).toBe("tok-1");
    expect(result.report).toEqual(report);
  });

  it("throws NotFound for an unknown token", async () => {
    const { service, findUnique } = makeService();
    findUnique.mockResolvedValue(null);
    await expect(service.getByToken("missing")).rejects.toBeInstanceOf(NotFoundException);
  });
});
