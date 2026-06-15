import { describe, expect, it } from "vitest";
import { loadEnv } from "./env";

describe("loadEnv", () => {
  it("applies safe defaults in development", () => {
    const env = loadEnv({ NODE_ENV: "development" });
    expect(env.API_PORT).toBe(4000);
    expect(env.WEB_ORIGIN).toEqual(["http://localhost:3000"]);
  });

  it("splits WEB_ORIGIN into a trimmed list", () => {
    const env = loadEnv({ WEB_ORIGIN: "https://a.com, https://b.com" });
    expect(env.WEB_ORIGIN).toEqual(["https://a.com", "https://b.com"]);
  });

  it("fails fast in production when required dependencies are missing", () => {
    expect(() => loadEnv({ NODE_ENV: "production" })).toThrow(/required in production/);
  });

  it("accepts a fully configured production environment", () => {
    const env = loadEnv({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://u:p@db:5432/sb",
      REDIS_URL: "redis://cache:6379",
      RESEND_API_KEY: "re_test_key",
    });
    expect(env.NODE_ENV).toBe("production");
  });
});
