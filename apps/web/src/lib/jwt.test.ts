import { describe, expect, it, vi, afterEach } from "vitest";
import { decodeJwtPayload, isJwtExpired } from "./jwt";

function makeToken(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `header.${body}.signature`;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("decodeJwtPayload", () => {
  it("decodes the payload segment", () => {
    const token = makeToken({ sub: "user-1", email: "a@b.local" });
    expect(decodeJwtPayload(token)).toEqual({
      sub: "user-1",
      email: "a@b.local",
    });
  });

  it("returns null for a malformed token instead of throwing", () => {
    expect(decodeJwtPayload("not-a-jwt")).toBeNull();
    expect(decodeJwtPayload("")).toBeNull();
    expect(decodeJwtPayload("a.!!!not-base64!!!.c")).toBeNull();
  });
});

describe("isJwtExpired", () => {
  it("treats a token without exp as expired", () => {
    expect(isJwtExpired(makeToken({ sub: "user-1" }))).toBe(true);
  });

  it("treats an unparseable token as expired", () => {
    expect(isJwtExpired("garbage")).toBe(true);
  });

  it("is false while the token is still valid", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const exp = Math.floor(Date.now() / 1000) + 60;
    expect(isJwtExpired(makeToken({ exp }))).toBe(false);
  });

  it("is true once the expiry instant is reached", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const exp = Math.floor(Date.now() / 1000);
    expect(isJwtExpired(makeToken({ exp }))).toBe(true);
  });
});
