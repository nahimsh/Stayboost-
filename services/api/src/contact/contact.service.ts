import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ContactLeadInput } from "@stayboost/domain";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { autoresponderHtml, teamNotificationHtml } from "./contact.templates";

export interface ContactResult {
  readonly id: string | null;
  readonly accepted: true;
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Persist a lead and fire notification + autoresponder emails. Honeypot hits
   * are accepted but silently dropped. Email failures are logged but never fail
   * the request — the lead is already safely stored.
   */
  async submit(input: ContactLeadInput): Promise<ContactResult> {
    if (input.website && input.website.trim().length > 0) {
      this.logger.warn("Contact honeypot triggered — dropping submission.");
      return { id: null, accepted: true };
    }

    const lead = await this.prisma.contactLead.create({
      data: {
        name: input.name,
        email: input.email,
        company: input.company ?? null,
        propertyCount: input.propertyCount ?? null,
        reason: input.reason,
        message: input.message,
        source: "web",
      },
      select: { id: true },
    });

    await this.sendEmails(input);
    return { id: lead.id, accepted: true };
  }

  private async sendEmails(input: ContactLeadInput): Promise<void> {
    const inbox = this.config.get<string>("CONTACT_INBOX") ?? "team@stayboost.com";
    try {
      await Promise.all([
        this.mail.send({
          to: inbox,
          subject: `New ${input.reason} lead — ${input.name}`,
          html: teamNotificationHtml(input),
          replyTo: input.email,
        }),
        this.mail.send({
          to: input.email,
          subject: "Thanks for contacting StayBoost",
          html: autoresponderHtml(input),
        }),
      ]);
    } catch (error) {
      this.logger.error("Contact email delivery failed (lead was stored).", error);
    }
  }
}
