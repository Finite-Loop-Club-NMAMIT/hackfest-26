import Redis from "ioredis";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { env } from "~/env";

let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    if (!env.REDIS_URL) {
      throw new Error("REDIS_URL is required to initialize rate limiting");
    }
    redis = new Redis(env.REDIS_URL);
  }
  return redis;
}

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
    const _rateLimitRes = await limiter.consume(identifier);

    return null;
  } catch (rateLimitError) {
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
