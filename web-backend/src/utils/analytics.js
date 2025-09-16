/**
 * Analytics middleware for Cloudflare Worker
 */

export function analytics() {
  return async (c, next) => {
    const startTime = Date.now();
    const requestId = c.req.header('cf-ray') || crypto.randomUUID();
    
    // Extract request information
    const requestData = {
      method: c.req.method,
      path: c.req.path,
      userAgent: c.req.header('user-agent') || 'unknown',
      referer: c.req.header('referer') || '',
      ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown',
      country: c.req.cf?.country || 'unknown',
      colo: c.req.cf?.colo || 'unknown',
      timestamp: new Date().toISOString(),
      requestId,
    };

    // Add request ID to context for logging
    c.set('requestId', requestId);

    let statusCode = 200;
    let error = null;

    try {
      await next();
      statusCode = c.res.status;
    } catch (err) {
      error = err.message || 'Unknown error';
      statusCode = err.status || 500;
      throw err; // Re-throw to let error handler deal with it
    } finally {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Prepare analytics data
      const analyticsData = {
        ...requestData,
        statusCode,
        duration,
        error,
        responseSize: c.res.headers.get('content-length') || 0,
      };

      // Send to Cloudflare Analytics Engine (non-blocking)
      try {
        if (c.env.ANALYTICS) {
          await c.env.ANALYTICS.writeDataPoint({
            blobs: [
              requestData.path,
              requestData.method,
              requestData.userAgent,
              requestData.country,
              requestData.ip,
              error || '',
            ],
            doubles: [
              statusCode,
              duration,
              parseInt(analyticsData.responseSize) || 0,
            ],
            indexes: [
              requestData.path.split('/')[1] || 'root', // First path segment
            ],
          });
        }
      } catch (analyticsError) {
        console.error('Failed to write analytics:', analyticsError);
        // Don't fail the request if analytics fails
      }

      // Log request details
      const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
      const logMessage = `${requestData.method} ${requestData.path} ${statusCode} ${duration}ms`;
      
      if (c.env.LOG_LEVEL === 'debug' || logLevel === 'error') {
        console[logLevel](logMessage, {
          requestId,
          statusCode,
          duration,
          ip: requestData.ip,
          country: requestData.country,
          error,
        });
      }

      // Store detailed logs in R2 for production (non-blocking)
      if (c.env.ENVIRONMENT === 'production' && (statusCode >= 400 || c.env.LOG_LEVEL === 'debug')) {
        try {
          const logEntry = {
            ...analyticsData,
            headers: Object.fromEntries(c.req.header()),
            query: c.req.query(),
          };

          const logKey = `logs/${new Date().toISOString().split('T')[0]}/${requestId}.json`;
          
          // Queue log storage (fire and forget)
          c.executionCtx?.waitUntil(
            c.env.STORAGE?.put(logKey, JSON.stringify(logEntry, null, 2), {
              httpMetadata: {
                contentType: 'application/json',
              },
            })
          );
        } catch (logError) {
          console.error('Failed to store log:', logError);
        }
      }
    }
  };
}