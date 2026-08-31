// Centralized TTL Caching Layer & Rate Limiter
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const cached = memoryCache.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  try {
    const freshData = await fetcher();
    memoryCache.set(key, {
      data: freshData,
      expiresAt: now + ttlSeconds * 1000,
    });
    return freshData;
  } catch (error) {
    // If fresh fetch fails but stale data exists, return stale data instead of breaking
    if (cached) {
      return cached.data as T;
    }
    throw error;
  }
}

export function invalidateCache(key: string): void {
  memoryCache.delete(key);
}

export function clearAllCache(): void {
  memoryCache.clear();
}

// Rate limiter helper for upstream government/public APIs
const requestTimestamps = new Map<string, number[]>();

export function checkRateLimit(domain: string, maxRequests: number, windowSeconds: number): boolean {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const timestamps = requestTimestamps.get(domain) || [];
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= maxRequests) {
    return false;
  }

  validTimestamps.push(now);
  requestTimestamps.set(domain, validTimestamps);
  return true;
}

// SEC EDGAR Compliant User-Agent
export const SEC_HEADERS = {
  "User-Agent": process.env.SEC_USER_AGENT || "0ther5ideIntelligenceTerminal/2.1 (ops@0ther5ide.intel)",
  "Accept-Encoding": "gzip, deflate",
  "Host": "www.sec.gov",
};
