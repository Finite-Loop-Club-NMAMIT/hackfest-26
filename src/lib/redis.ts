import Redis from "ioredis";
import { env } from "~/env";

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    if (!env.REDIS_URL) {
      throw new Error("REDIS_URL is required");
    }
    redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  }
  return redis;
}
