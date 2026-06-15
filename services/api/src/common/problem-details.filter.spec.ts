import { describe, expect, it, vi } from "vitest";
import type { ArgumentsHost } from "@nestjs/common";
import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { ProblemDetailsFilter } from "./problem-details.filter";

function fakeHost(): { host: ArgumentsHost; json: ReturnType<typeof vi.fn>; status: ReturnType<typeof vi.fn> } {
  const json = vi.fn();
  const setHeader = vi.fn().mockReturnThis();
  const status = vi.fn().mockReturnValue({ setHeader, json });
  const response = { status, setHeader };
  const request = { url: "/v1/contact", method: "POST" };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  return { host, json, status };
}

describe("ProblemDetailsFilter", () => {
  it("maps a ZodError to a 422 problem+json with field errors", () => {
    const { host, json, status } = fakeHost();
    const error = z.object({ email: z.string().email() }).safeParse({ email: "x" });
    if (error.success) throw new Error("expected zod failure");

    new ProblemDetailsFilter().catch(error.error, host);

    expect(status).toHaveBeenCalledWith(422);
    const body = json.mock.calls[0]?.[0];
    expect(body.status).toBe(422);
    expect(body.errors[0].field).toBe("email");
  });

  it("maps an HttpException to its status", () => {
    const { host, json, status } = fakeHost();
    new ProblemDetailsFilter().catch(new BadRequestException("bad"), host);
    expect(status).toHaveBeenCalledWith(400);
    expect(json.mock.calls[0]?.[0].detail).toBe("bad");
  });

  it("maps unknown errors to a 500 without leaking details", () => {
    const { host, json, status } = fakeHost();
    new ProblemDetailsFilter().catch(new Error("secret stack"), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json.mock.calls[0]?.[0].detail).toBeUndefined();
  });
});
