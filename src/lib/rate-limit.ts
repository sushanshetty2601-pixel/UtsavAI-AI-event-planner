/**
 * Universal in-memory sliding-window rate limiter for UtsavAI API routes
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export class RateLimiter {
  private requests = new Map<string, { count: number; resetAt: number }>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(config: RateLimitConfig = { maxRequests: 20, windowMs: 60_000 }) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
  }

  public check(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetAt) {
      const resetAt = now + this.windowMs;
      this.requests.set(identifier, { count: 1, resetAt });
      return { allowed: true, remaining: this.maxRequests - 1, resetAt };
    }

    if (entry.count >= this.maxRequests) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count += 1;
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  public reset(identifier?: string): void {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }
}

/** Pre-configured shared rate limiters */
export const planRateLimiter = new RateLimiter({ maxRequests: 15, windowMs: 60_000 });
export const chatRateLimiter = new RateLimiter({ maxRequests: 25, windowMs: 60_000 });
export const imageRateLimiter = new RateLimiter({ maxRequests: 15, windowMs: 60_000 });

/**
 * Sanitizes input strings by stripping potential script tags and HTML injection vectors
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}
