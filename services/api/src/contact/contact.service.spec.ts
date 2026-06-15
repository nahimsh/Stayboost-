import { describe, expect, it, vi } from "vitest";
import type { ConfigService } from "@nestjs/config";
import type { ContactLeadInput } from "@stayboost/domain";
import type { PrismaService } from "../prisma/prisma.service";
import type { MailService } from "../mail/mail.service";
import { ContactService } from "./contact.service";

const baseInput: ContactLeadInput = {
  name: "Maya Host",
  email: "maya@example.com",
  reason: "sales",
  message: "I run three villas and want more direct bookings.",
};

function makeService(overrides?: { sendImpl?: () => Promise<void> }) {
  const create = vi.fn().mockResolvedValue({ id: "lead-1" });
  const send = vi.fn().mockImplementation(overrides?.sendImpl ?? (() => Promise.resolve()));
  const prisma = { contactLead: { create } } as unknown as PrismaService;
  const mail = { send } as unknown as MailService;
  const config = { get: vi.fn().mockReturnValue("team@stayboost.com") } as unknown as ConfigService;
  return { service: new ContactService(prisma, mail, config), create, send };
}

describe("ContactService", () => {
  it("stores the lead and sends team + autoresponder emails", async () => {
    const { service, create, send } = makeService();
    const result = await service.submit(baseInput);

    expect(result).toEqual({ id: "lead-1", accepted: true });
    expect(create).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("silently drops honeypot submissions without storing or emailing", async () => {
    const { service, create, send } = makeService();
    const result = await service.submit({ ...baseInput, website: "http://spam.example" });

    expect(result).toEqual({ id: null, accepted: true });
    expect(create).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("still succeeds when email delivery fails (lead is already stored)", async () => {
    const { service, create } = makeService({
      sendImpl: () => Promise.reject(new Error("smtp down")),
    });
    const result = await service.submit(baseInput);

    expect(result.id).toBe("lead-1");
    expect(create).toHaveBeenCalledOnce();
  });
});
