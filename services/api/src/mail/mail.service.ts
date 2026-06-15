import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

export interface OutboundEmail {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly replyTo?: string;
}

/**
 * Transactional email via Resend. If no API key is configured the service logs
 * the message instead of sending — a safe, explicit fallback for local/dev and
 * CI, never a silent no-op.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly client: Resend | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>("RESEND_API_KEY");
    this.from = config.get<string>("EMAIL_FROM") ?? "StayBoost <hello@stayboost.com>";
    this.client = apiKey ? new Resend(apiKey) : null;
    if (!this.client) {
      this.logger.warn("RESEND_API_KEY not set — emails will be logged, not sent.");
    }
  }

  async send(email: OutboundEmail): Promise<void> {
    if (!this.client) {
      this.logger.log(`[email:logged] to=${email.to} subject="${email.subject}"`);
      return;
    }
    const { error } = await this.client.emails.send({
      from: this.from,
      to: email.to,
      subject: email.subject,
      html: email.html,
      ...(email.replyTo ? { replyTo: email.replyTo } : {}),
    });
    if (error) {
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }
}
