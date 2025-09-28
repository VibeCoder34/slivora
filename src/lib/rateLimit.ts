/**
 * Simple in-memory rate limiting using sliding window algorithm
 * This is suitable for single-instance deployments
 * For production with multiple instances, consider using Redis
 */

interface RateLimitEntry {
  timestamps: number[];
  count: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up old entries from the store to prevent memory leaks
 */
function cleanupOldEntries(key: string, windowMs: number): void {
  const entry = rateLimitStore.get(key);
  if (!entry) return;

  const now = Date.now();
  const cutoff = now - windowMs;
  
  // Remove timestamps older than the window
  entry.timestamps = entry.timestamps.filter(timestamp => timestamp > cutoff);
  entry.count = entry.timestamps.length;

  // Remove entry if no timestamps remain
  if (entry.timestamps.length === 0) {
    rateLimitStore.delete(key);
  }
}

/**
 * Check if a request should be rate limited
 * @param key - Unique identifier for the rate limit (e.g., "gen:192.168.1.1")
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit result with remaining requests and retry time
 */
export function hitRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  
  // Clean up old entries first
  cleanupOldEntries(key, windowMs);
  
  // Get or create entry
  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = { timestamps: [], count: 0 };
    rateLimitStore.set(key, entry);
  }

  // Check if we're within the limit
  if (entry.count < limit) {
    // Add current timestamp
    entry.timestamps.push(now);
    entry.count = entry.timestamps.length;
    
    return {
      ok: true,
      remaining: limit - entry.count,
      retryAfter: 0,
    };
  }

  // Calculate retry time based on oldest request in window
  const oldestTimestamp = Math.min(...entry.timestamps);
  const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

  return {
    ok: false,
    remaining: 0,
    retryAfter: Math.max(0, retryAfter),
  };
}

/**
 * Get current rate limit status without incrementing
 * @param key - Unique identifier for the rate limit
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Current rate limit status
 */
export function getRateLimitStatus(
  key: string,
  limit: number,
  windowMs: number
): { remaining: number; retryAfter: number } {
  const now = Date.now();
  
  // Clean up old entries first
  cleanupOldEntries(key, windowMs);
  
  const entry = rateLimitStore.get(key);
  if (!entry) {
    return {
      remaining: limit,
      retryAfter: 0,
    };
  }

  const remaining = Math.max(0, limit - entry.count);
  
  if (entry.timestamps.length > 0) {
    const oldestTimestamp = Math.min(...entry.timestamps);
    const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
    return {
      remaining,
      retryAfter: Math.max(0, retryAfter),
    };
  }

  return {
    remaining,
    retryAfter: 0,
  };
}

/**
 * Clear rate limit for a specific key (useful for testing)
 * @param key - Key to clear
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limits (useful for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get rate limit store size (useful for monitoring)
 */
export function getRateLimitStoreSize(): number {
  return rateLimitStore.size;
}
