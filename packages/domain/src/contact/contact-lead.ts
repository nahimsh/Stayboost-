import { z } from "zod";

/** Why someone is reaching out — routes the lead internally. */
export const CONTACT_REASONS = ["sales", "support", "partnership", "other"] as const;
export const contactReasonSchema = z.enum(CONTACT_REASONS);
export type ContactReason = z.infer<typeof contactReasonSchema>;

/**
 * Contact form payload. Validated identically on the client (instant feedback)
 * and the server (trust boundary). `company`/`propertyCount` are optional.
 * `website` is a honeypot — real users leave it empty.
 */
export const contactLeadInputSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  company: z.string().trim().max(160).optional(),
  propertyCount: z.coerce.number().int().min(0).max(100_000).optional(),
  reason: contactReasonSchema,
  message: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(5000),
  // Honeypot: hidden from real users. Bots fill it; the server silently drops
  // those submissions rather than erroring, so we don't tip off the bot.
  website: z.string().optional(),
});

export type ContactLeadInput = z.infer<typeof contactLeadInputSchema>;
