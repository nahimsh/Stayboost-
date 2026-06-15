import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "./client";
import { ApiError } from "./errors";

const input = {
  name: "Maya",
  email: "maya@example.com",
  reason: "sales" as const,
  message: "Hello there, this is a long enough message.",
};

function jsonResponse(body: unknown, init: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
}

describe("createApiClient.contact.submit", () => {
  it("posts to /v1/contact and returns the parsed body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: "lead-1", accepted: true }, { status: 202 }));
    const client = createApiClient({ baseUrl: "http://api.test/", fetch: fetchMock });

    const result = await client.contact.submit(input);

    expect(result).toEqual({ id: "lead-1", accepted: true });
    const [calledUrl, options] = fetchMock.mock.calls[0] ?? [];
    expect(calledUrl).toBe("http://api.test/v1/contact");
    expect(options?.method).toBe("POST");
  });

  it("throws a typed ApiError with field errors on 422", async () => {
    // Fresh response per call — a Response body can only be read once.
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        jsonResponse(
          { title: "Validation failed", status: 422, errors: [{ field: "email", message: "bad" }] },
          { status: 422 },
        ),
      ),
    );
    const client = createApiClient({ baseUrl: "http://api.test", fetch: fetchMock });

    const error = await client.contact.submit(input).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(422);
    expect((error as ApiError).fieldErrors[0]?.field).toBe("email");
  });
});
