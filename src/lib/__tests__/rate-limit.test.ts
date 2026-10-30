import { describe, it, expect, beforeEach } from "vitest";
import { RateLimiter, sanitizeString } from "@/lib/rate-limit";

describe("Security & Rate Limiting Engine", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });
  });

  it("permits requests within the defined threshold and calculates remaining correctly", () => {
    const res1 = limiter.check("user-ip-1");
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = limiter.check("user-ip-1");
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = limiter.check("user-ip-1");
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("blocks requests that exceed the rate limit threshold", () => {
    limiter.check("user-ip-2");
    limiter.check("user-ip-2");
    limiter.check("user-ip-2");

    const blocked = limiter.check("user-ip-2");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("isolates rate limit counters between different IP addresses", () => {
    limiter.check("ip-a");
    limiter.check("ip-a");
    limiter.check("ip-a");
    expect(limiter.check("ip-a").allowed).toBe(false);

    // ip-b should still be allowed
    expect(limiter.check("ip-b").allowed).toBe(true);
  });

  it("allows manual reset of rate limit entries", () => {
    limiter.check("user-ip-3");
    limiter.check("user-ip-3");
    limiter.check("user-ip-3");
    expect(limiter.check("user-ip-3").allowed).toBe(false);

    limiter.reset("user-ip-3");
    expect(limiter.check("user-ip-3").allowed).toBe(true);
  });

  describe("sanitizeString helper", () => {
    it("strips script tags and malicious HTML vectors", () => {
      const malicious = '<script>alert("xss")</script>Hello <b>World</b>';
      const clean = sanitizeString(malicious);
      expect(clean).toBe("Hello World");
      expect(clean.includes("<script>")).toBe(false);
    });

    it("handles non-string inputs safely without throwing", () => {
      expect(sanitizeString(null)).toBe("");
      expect(sanitizeString(undefined)).toBe("");
      expect(sanitizeString(12345)).toBe("");
    });
  });
});
