import { describe, expect, it } from "vitest";
import { generateToken, hashPassword, hashToken, safeEqual, verifyPassword } from "./crypto.util";

describe("password hashing", () => {
  it("verifies a correct password and rejects a wrong one", async () => {
    const hash = await hashPassword("ValidPassw0rd!!");
    expect(await verifyPassword("ValidPassw0rd!!", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("returns false for users without a password (OAuth-only)", async () => {
    expect(await verifyPassword("anything", null)).toBe(false);
  });

  it("produces distinct hashes for the same password (salted)", async () => {
    expect(await hashPassword("ValidPassw0rd!!")).not.toEqual(await hashPassword("ValidPassw0rd!!"));
  });
});

describe("token hashing", () => {
  it("generates unique URL-safe tokens", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toEqual(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("hashes deterministically (lookup by hash)", () => {
    const token = generateToken();
    expect(hashToken(token)).toEqual(hashToken(token));
    expect(hashToken(token)).not.toEqual(token);
  });
});

describe("safeEqual", () => {
  it("compares in constant time by value", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});
