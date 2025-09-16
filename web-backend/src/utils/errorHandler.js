/**
 * Global error handler for Cloudflare Worker
 */

import { HTTPException } from 'hono/http-exception';

export function errorHandler(err, c) {
  console.error('Error occurred:', err);

  // Handle HTTPException (thrown by our route handlers)
  if (err instanceof HTTPException) {
    return c.json({
      success: false,
      error: err.message,
      code: err.status,
      timestamp: new Date().toISOString(),
    }, err.status);
  }

  // Handle JWT errors
  if (err.name === 'JwtTokenInvalid' || err.name === 'JwtTokenNotBefore' || err.name === 'JwtTokenExpired') {
    return c.json({
      success: false,
      error: 'Invalid or expired token',
      code: 401,
      timestamp: new Date().toISOString(),
    }, 401);
  }

  // Handle database errors
  if (err.message && err.message.includes('SQLITE_')) {
    return c.json({
      success: false,
      error: 'Database error occurred',
      code: 500,
      timestamp: new Date().toISOString(),
      ...(c.env.ENVIRONMENT === 'development' && { details: err.message }),
    }, 500);
  }

  // Handle R2 storage errors
  if (err.message && (err.message.includes('R2') || err.message.includes('storage'))) {
    return c.json({
      success: false,
      error: 'Storage service error',
      code: 503,
      timestamp: new Date().toISOString(),
    }, 503);
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return c.json({
      success: false,
      error: 'Validation failed',
      details: err.message,
      code: 400,
      timestamp: new Date().toISOString(),
    }, 400);
  }

  // Handle network/fetch errors
  if (err instanceof TypeError && err.message.includes('fetch')) {
    return c.json({
      success: false,
      error: 'External service unavailable',
      code: 503,
      timestamp: new Date().toISOString(),
    }, 503);
  }

  // Handle timeout errors
  if (err.name === 'TimeoutError' || (err.message && err.message.includes('timeout'))) {
    return c.json({
      success: false,
      error: 'Request timeout',
      code: 408,
      timestamp: new Date().toISOString(),
    }, 408);
  }

  // Handle rate limiting errors
  if (err.message && err.message.includes('rate limit')) {
    return c.json({
      success: false,
      error: 'Rate limit exceeded',
      code: 429,
      timestamp: new Date().toISOString(),
      retryAfter: '60', // seconds
    }, 429);
  }

  // Generic internal server error
  return c.json({
    success: false,
    error: 'Internal server error',
    code: 500,
    timestamp: new Date().toISOString(),
    requestId: c.req.header('cf-ray') || 'unknown',
    ...(c.env.ENVIRONMENT === 'development' && { 
      details: err.message,
      stack: err.stack,
    }),
  }, 500);
}