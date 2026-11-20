import { Redis } from '@upstash/redis';

let redis: Redis | null = null;
export function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  if (!redis) redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
  return redis;
}

/** Shared Redis cache + short lock: browser clients never call 24data directly. */
export async function cachedUpstream<T>(key: string, url: string, minIntervalSeconds: number) {
  const db = getRedis();
  if (!db) return { data: null as T | null, configured: false, stale: false };
  const cacheKey = `atlas:${key}:data`;
  const lockKey = `atlas:${key}:lock`;
  const cached = await db.get<T>(cacheKey);
  const lock = await db.set(lockKey, '1', { nx: true, ex: minIntervalSeconds });
  if (lock === 'OK') {
    try {
      const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(7000) });
      if (!response.ok) throw new Error(`24data returned HTTP ${response.status}`);
      const data = await response.json() as T;
      await db.set(cacheKey, data, { ex: 20 });
      return { data, configured: true, stale: false };
    } catch (error) {
      if (cached) return { data: cached, configured: true, stale: true };
      throw error;
    }
  }
  return { data: cached, configured: true, stale: false };
}
