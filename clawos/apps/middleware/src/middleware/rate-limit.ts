import type { NextFunction, Request, Response } from "express";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60_000
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function toPositiveNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function createRateLimitMiddleware(config?: Partial<RateLimitConfig>) {
  const mergedConfig: RateLimitConfig = {
    maxRequests: config?.maxRequests ?? DEFAULT_CONFIG.maxRequests,
    windowMs: config?.windowMs ?? DEFAULT_CONFIG.windowMs
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    const maxRequests = toPositiveNumber(process.env.API_RATE_LIMIT_MAX, mergedConfig.maxRequests);
    const windowMs = toPositiveNumber(process.env.API_RATE_LIMIT_WINDOW_MS, mergedConfig.windowMs);

    const keyHeader = req.header("x-rate-limit-key");
    const authHeader = req.header("authorization") ?? "anonymous";
    const key = `${keyHeader ?? authHeader}:${req.path}`;
    const now = Date.now();
    const existing = rateLimitStore.get(key);

    if (!existing || now >= existing.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (existing.count >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(429).json({
        error: {
          code: "rate_limited",
          message: "Too many requests. Please wait and retry.",
          details: {
            recovery_action: "Wait a few seconds and retry the same action."
          }
        }
      });
      return;
    }

    existing.count += 1;
    rateLimitStore.set(key, existing);
    next();
  };
}

function resetRateLimitStore(): void {
  rateLimitStore.clear();
}

export { createRateLimitMiddleware, resetRateLimitStore };
export type { RateLimitConfig };
