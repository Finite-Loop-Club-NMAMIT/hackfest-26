import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { getRedisClient } from "~/lib/redis";

function createRateLimiters() {
  const redisClient = getRedisClient();

  return {
    payment: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: "ratelimit:payment",
      points: 5,
      duration: 60,
      blockDuration: 60,
    }),

    auth: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: "ratelimit:auth",
      points: 20,
      duration: 60,
      blockDuration: 60,
    }),

    team: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: "ratelimit:team",
      points: 20,
      duration: 60,
      blockDuration: 30,
    }),

    email: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: "ratelimit:email",
      points: 10,
      duration: 60,
      blockDuration: 60,
    }),

    api: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: "ratelimit:api",
      points: 60,
      duration: 60,
      blockDuration: 30,
    }),
  };
}

export const rateLimiters = createRateLimiters();

export function getIdentifier(req: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get IP from various headers
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";

  return `ip:${ip}`;
}

//wrapper for routes
export async function withRateLimit(
  _req: NextRequest,
  limiter: RateLimiterRedis,
  identifier: string,
): Promise<NextResponse | null> {
  try {
    await limiter.consume(identifier);
    return null;
  } catch (rateLimitError) {
    // Real Error instance = Redis connection failure — fail open so requests still work
    if (rateLimitError instanceof Error) {
      console.error(
        "[RateLimit] Redis error, skipping rate limit:",
        rateLimitError.message,
      );
      return null;
    }

    // RateLimiterRes object = actual rate limit exceeded
    const error = rateLimitError as {
      msBeforeNext?: number;
      remainingPoints?: number;
    };

    const retryAfter = error.msBeforeNext
      ? Math.ceil(error.msBeforeNext / 1000)
      : 60;

    return NextResponse.json(
      {
        success: false,
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }
}
