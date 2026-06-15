import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { contactLeadInputSchema, type ContactLeadInput } from "@stayboost/domain";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { ContactService } from "./contact.service";

@Controller({ path: "contact", version: "1" })
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  // Tighter limit than the global default: contact is a public, abusable POST.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @UsePipes(new ZodValidationPipe(contactLeadInputSchema))
  async submit(@Body() body: ContactLeadInput): Promise<{ id: string | null; accepted: true }> {
    return this.contact.submit(body);
  }
}
