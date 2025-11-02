/**
 * Simple in-memory rate limiter using a sliding window approach
 *
 * For production, consider using:
 * - Redis-based rate limiting for multi-instance deployments
 * - Upstash Rate Limit (@upstash/ratelimit)
 * - Vercel Edge Config
 */

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Max requests per interval
}

interface RequestLog {
  count: number;
  resetTime: number;
}

// In-memory store for rate limit tracking
// Key format: "ip:endpoint" or "identifier:endpoint"
const requestLog = new Map<string, RequestLog>();

// Cleanup old entries every 10 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, log] of requestLog.entries()) {
    if (log.resetTime < now) {
      requestLog.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Document creation: 10 documents per hour per IP
  CREATE_DOCUMENT: {
    interval: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },
  // Document updates: 30 updates per hour per document
  UPDATE_DOCUMENT: {
    interval: 60 * 60 * 1000, // 1 hour
    maxRequests: 30,
  },
  // Document retrieval: 100 views per hour per IP
  GET_DOCUMENT: {
    interval: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,
  },
} as const;

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param endpoint - Endpoint name for different rate limit rules
 * @param config - Rate limit configuration
 * @returns Object with success status and remaining/reset info
 */
export function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();

  let log = requestLog.get(key);

  // Initialize or reset if window expired
  if (!log || log.resetTime <= now) {
    log = {
      count: 0,
      resetTime: now + config.interval,
    };
    requestLog.set(key, log);
  }

  // Increment request count
  log.count++;

  const remaining = Math.max(0, config.maxRequests - log.count);
  const success = log.count <= config.maxRequests;

  return {
    success,
    limit: config.maxRequests,
    remaining,
    reset: log.resetTime,
  };
}

/**
 * Get client IP address from request headers
 * Handles common proxy headers (X-Forwarded-For, X-Real-IP)
 */
export function getClientIp(request: Request): string {
  // Check common proxy headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  // Fallback to a generic identifier if no IP is available
  // In development/testing, this prevents rate limiting from failing
  return "unknown";
}

/**
 * Create a rate limit response with appropriate headers
 */
export function createRateLimitResponse(
  limit: number,
  remaining: number,
  reset: number
): Response {
  const resetDate = new Date(reset).toUTCString();

  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      message: "Too many requests. Please try again later.",
      limit,
      remaining: 0,
      reset: resetDate,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": reset.toString(),
        "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
      },
    }
  );
}

/**
 * Add rate limit headers to a successful response
 */
export function addRateLimitHeaders(
  response: Response,
  limit: number,
  remaining: number,
  reset: number
): Response {
  const headers = new Headers(response.headers);
  headers.set("X-RateLimit-Limit", limit.toString());
  headers.set("X-RateLimit-Remaining", remaining.toString());
  headers.set("X-RateLimit-Reset", reset.toString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
