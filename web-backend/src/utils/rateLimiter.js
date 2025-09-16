/**
 * Rate limiter middleware for Cloudflare Worker
 */

import { HTTPException } from 'hono/http-exception';

export function rateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // requests per window
    keyGenerator = (c) => c.req.header('cf-connecting-ip') || 'unknown',
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    onLimitReached = null,
  } = options;

  return async (c, next) => {
    const key = keyGenerator(c);
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const rateLimitKey = `rate_limit:${key}:${windowStart}`;

    try {
      // Get current count from KV
      const currentCountStr = await c.env.CACHE.get(rateLimitKey);
      const currentCount = currentCountStr ? parseInt(currentCountStr) : 0;

      // Check if limit exceeded
      if (currentCount >= max) {
        // Calculate retry after
        const retryAfter = Math.ceil((windowStart + windowMs - now) / 1000);
        
        // Call callback if provided
        if (onLimitReached) {
          try {
            await onLimitReached(c, key, currentCount, windowMs);
          } catch (callbackError) {
            console.error('Rate limiter callback error:', callbackError);
          }
        }

        // Return rate limit error
        const response = c.json({
          success: false,
          error: message,
          code: 429,
          limit: max,
          window: windowMs / 1000,
          retryAfter,
          timestamp: new Date().toISOString(),
        }, 429);

        response.headers.set('X-RateLimit-Limit', max.toString());
        response.headers.set('X-RateLimit-Remaining', '0');
        response.headers.set('X-RateLimit-Reset', Math.ceil((windowStart + windowMs) / 1000).toString());
        response.headers.set('Retry-After', retryAfter.toString());

        return response;
      }

      // Execute the request
      let shouldCount = true;
      let statusCode = 200;

      try {
        await next();
        statusCode = c.res.status;

        // Check if we should skip counting successful requests
        if (skipSuccessfulRequests && statusCode < 400) {
          shouldCount = false;
        }
      } catch (error) {
        statusCode = error.status || 500;

        // Check if we should skip counting failed requests
        if (skipFailedRequests && statusCode >= 400) {
          shouldCount = false;
        }

        throw error; // Re-throw the error
      }

      // Increment counter if we should count this request
      if (shouldCount) {
        const newCount = currentCount + 1;
        const ttl = Math.ceil((windowStart + windowMs - now) / 1000);
        
        // Store updated count with TTL
        await c.env.CACHE.put(rateLimitKey, newCount.toString(), {
          expirationTtl: ttl,
        });

        // Add rate limit headers to response
        const remaining = Math.max(0, max - newCount);
        c.res.headers.set('X-RateLimit-Limit', max.toString());
        c.res.headers.set('X-RateLimit-Remaining', remaining.toString());
        c.res.headers.set('X-RateLimit-Reset', Math.ceil((windowStart + windowMs) / 1000).toString());

        // Warn when approaching limit
        if (remaining <= 5 && remaining > 0) {
          c.res.headers.set('X-RateLimit-Warning', `Approaching rate limit. ${remaining} requests remaining.`);
        }
      }

    } catch (error) {
      // If rate limiting fails, log error but don't block the request
      console.error('Rate limiter error:', error);
      
      // Continue without rate limiting if KV is unavailable
      if (error.message && error.message.includes('KV')) {
        console.warn('KV unavailable, skipping rate limiting');
        await next();
        return;
      }

      throw error;
    }
  };
}

// Advanced rate limiter with different limits per endpoint/user type
export function createAdvancedRateLimiter(limitsConfig) {
  return async (c, next) => {
    const path = c.req.path;
    const method = c.req.method;
    const userRole = c.get('jwtPayload')?.role || 'anonymous';
    
    // Find matching limit configuration
    let limitConfig = null;
    
    for (const config of limitsConfig) {
      if (config.path && !path.match(new RegExp(config.path))) continue;
      if (config.method && config.method !== method) continue;
      if (config.role && config.role !== userRole) continue;
      
      limitConfig = config;
      break;
    }

    // Use default limits if no specific config found
    if (!limitConfig) {
      limitConfig = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: userRole === 'admin' ? 1000 : userRole === 'anonymous' ? 50 : 200,
      };
    }

    // Create key based on user ID or IP
    const userId = c.get('jwtPayload')?.userId;
    const keyGenerator = userId 
      ? () => `user:${userId}`
      : (c) => `ip:${c.req.header('cf-connecting-ip') || 'unknown'}`;

    // Apply rate limiting
    const rateLimiter = createRateLimiter({
      ...limitConfig,
      keyGenerator,
    });

    return rateLimiter(c, next);
  };
}

// Sliding window rate limiter (more accurate)
export function slidingWindowRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    keyGenerator = (c) => c.req.header('cf-connecting-ip') || 'unknown',
    message = 'Too many requests, please try again later',
  } = options;

  return async (c, next) => {
    const key = keyGenerator(c);
    const now = Date.now();
    const windowKey = `sliding_window:${key}`;

    try {
      // Get request timestamps from the sliding window
      const windowData = await c.env.CACHE.get(windowKey);
      let timestamps = windowData ? JSON.parse(windowData) : [];

      // Remove old timestamps outside the window
      timestamps = timestamps.filter(timestamp => now - timestamp < windowMs);

      // Check if limit exceeded
      if (timestamps.length >= max) {
        const oldestTimestamp = Math.min(...timestamps);
        const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

        const response = c.json({
          success: false,
          error: message,
          code: 429,
          limit: max,
          window: windowMs / 1000,
          retryAfter,
          timestamp: new Date().toISOString(),
        }, 429);

        response.headers.set('X-RateLimit-Limit', max.toString());
        response.headers.set('X-RateLimit-Remaining', '0');
        response.headers.set('Retry-After', retryAfter.toString());

        return response;
      }

      // Execute the request
      await next();

      // Add current timestamp to window
      timestamps.push(now);

      // Store updated window
      await c.env.CACHE.put(windowKey, JSON.stringify(timestamps), {
        expirationTtl: Math.ceil(windowMs / 1000) + 60, // Add buffer
      });

      // Add rate limit headers
      const remaining = Math.max(0, max - timestamps.length);
      c.res.headers.set('X-RateLimit-Limit', max.toString());
      c.res.headers.set('X-RateLimit-Remaining', remaining.toString());

    } catch (error) {
      console.error('Sliding window rate limiter error:', error);
      
      // Continue without rate limiting if KV is unavailable
      if (error.message && error.message.includes('KV')) {
        console.warn('KV unavailable, skipping rate limiting');
        await next();
        return;
      }

      throw error;
    }
  };
}

// Distributed rate limiter using Durable Objects (for high accuracy)
export function durableObjectRateLimiter(options = {}) {
  const {
    max = 100,
    windowMs = 15 * 60 * 1000,
    keyGenerator = (c) => c.req.header('cf-connecting-ip') || 'unknown',
  } = options;

  return async (c, next) => {
    const key = keyGenerator(c);
    
    try {
      // Use Durable Object for distributed rate limiting
      const id = c.env.RATE_LIMITER.idFromName(key);
      const rateLimiterObject = c.env.RATE_LIMITER.get(id);
      
      const request = new Request('https://rate-limiter.internal/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ max, windowMs, timestamp: Date.now() }),
      });
      
      const response = await rateLimiterObject.fetch(request);
      const result = await response.json();
      
      if (!result.allowed) {
        return c.json({
          success: false,
          error: 'Too many requests, please try again later',
          code: 429,
          limit: max,
          retryAfter: result.retryAfter,
          timestamp: new Date().toISOString(),
        }, 429);
      }
      
      await next();
      
      // Add rate limit headers
      c.res.headers.set('X-RateLimit-Limit', max.toString());
      c.res.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      
    } catch (error) {
      console.error('Durable Object rate limiter error:', error);
      // Fall back to basic rate limiting or continue without limiting
      await next();
    }
  };
}

// Export the default rate limiter
export default rateLimiter;