import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  growthReportSchema,
  type GrowthReport,
  type PropertyProfileInput,
} from "@stayboost/domain";

const REQUEST_TIMEOUT_MS = 60_000;

/** Server-to-server client for the FastAPI AI service (services/ai). */
@Injectable()
export class AiClient {
  private readonly logger = new Logger(AiClient.name);
  private readonly baseUrl: string;
  private readonly serviceToken: string | undefined;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>("AI_SERVICE_URL") ?? "http://localhost:8000";
    this.serviceToken = config.get<string>("AI_SERVICE_TOKEN");
  }

  /** Run the AI Property Analyzer. Validates the AI service's response against
   *  the shared schema before returning — never trusts the payload blindly. */
  async analyze(profile: PropertyProfileInput): Promise<GrowthReport> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${this.baseUrl}/v1/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.serviceToken ? { "X-Service-Token": this.serviceToken } : {}),
        },
        body: JSON.stringify(profile),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`AI service responded ${response.status}`);
      }
      return growthReportSchema.parse(await response.json());
    } catch (error) {
      this.logger.error("AI analyze call failed", error);
      throw new ServiceUnavailableException("The analysis service is temporarily unavailable");
    } finally {
      clearTimeout(timeout);
    }
  }
}
