/**
 * Cloudflare Worker for Fataplus Backend API
 * Provides edge-optimized API endpoints with caching and security
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { cache } from 'hono/cache';

// API route handlers
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { farmRoutes } from './routes/farms';
import { organizationRoutes } from './routes/organizations';
import { contextRoutes } from './routes/contexts';
import { aiRoutes } from './routes/ai';
import { storageRoutes } from './routes/storage';

// Utilities
import { errorHandler } from './utils/errorHandler';
import { analytics } from './utils/analytics';
import { rateLimiter } from './utils/rateLimiter';

// Types for Cloudflare bindings
interface Env {
  // D1 Database
  DB: D1Database;
  
  // KV Storage
  CACHE: KVNamespace;
  
  // R2 Storage
  STORAGE: R2Bucket;
  ML_MODELS: R2Bucket;
  
  // Queues
  EMAIL_QUEUE: Queue;
  ANALYTICS_QUEUE: Queue;
  
  // Analytics
  ANALYTICS: AnalyticsEngineDataset;
  
  // AI Services
  AI: Ai;
  
  // Service bindings
  AI_SERVICE: Fetcher;
  
  // Environment variables
  ENVIRONMENT: string;
  LOG_LEVEL: string;
  CORS_ORIGINS: string;
  JWT_SECRET_KEY: string;
  OPENWEATHER_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  SENDGRID_API_KEY: string;
  AIRTEL_API_KEY: string;
  AIRTEL_API_SECRET: string;
  
  // Durable Objects
  LIVE_CHAT: DurableObjectNamespace;
  NOTIFICATIONS: DurableObjectNamespace;
}

// Initialize Hono app
const app = new Hono<{ Bindings: Env }>();

// Middleware stack
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());

// CORS configuration
app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = c.env.CORS_ORIGINS?.split(',') || ['https://yourdomain.com'];
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));

// Rate limiting
app.use('/api/*', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  keyGenerator: (c) => c.req.header('cf-connecting-ip') || 'unknown',
}));

// Analytics middleware
app.use('*', analytics());

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'fataplus-api',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    region: c.req.cf?.colo || 'unknown',
  });
});

// API versioning
const apiV1 = app.basePath('/api/v1');

// Public routes
apiV1.route('/auth', authRoutes);

// Protected routes (require JWT)
apiV1.use('/users/*', jwt({ secret: (c) => c.env.JWT_SECRET_KEY }));
apiV1.use('/farms/*', jwt({ secret: (c) => c.env.JWT_SECRET_KEY }));
apiV1.use('/organizations/*', jwt({ secret: (c) => c.env.JWT_SECRET_KEY }));
apiV1.use('/contexts/*', jwt({ secret: (c) => c.env.JWT_SECRET_KEY }));
apiV1.use('/ai/*', jwt({ secret: (c) => c.env.JWT_SECRET_KEY }));
apiV1.use('/storage/*', jwt({ secret: (c) => c.env.JWT_SECRET_KEY }));

// Route handlers
apiV1.route('/users', userRoutes);
apiV1.route('/farms', farmRoutes);
apiV1.route('/organizations', organizationRoutes);
apiV1.route('/contexts', contextRoutes);
apiV1.route('/ai', aiRoutes);
apiV1.route('/storage', storageRoutes);

// Cached endpoints for better performance
app.get('/api/v1/public/weather/:location', 
  cache({
    cacheName: 'weather-cache',
    cacheControl: 'max-age=300', // 5 minutes
  }),
  async (c) => {
    const location = c.req.param('location');
    const apiKey = c.env.OPENWEATHER_API_KEY;
    
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error('Weather API request failed');
      }
      
      const data = await response.json();
      return c.json(data);
    } catch (error) {
      return c.json({ error: 'Failed to fetch weather data' }, 500);
    }
  }
);

// WebSocket support for real-time features
app.get('/ws/chat/:roomId', async (c) => {
  const roomId = c.req.param('roomId');
  const durableObjectId = c.env.LIVE_CHAT.idFromName(roomId);
  const durableObject = c.env.LIVE_CHAT.get(durableObjectId);
  
  return durableObject.fetch(c.req.raw);
});

// Background job handlers
app.post('/queue/email', async (c) => {
  const { to, subject, content } = await c.req.json();
  
  await c.env.EMAIL_QUEUE.send({
    to,
    subject,
    content,
    timestamp: Date.now(),
  });
  
  return c.json({ success: true, message: 'Email queued for sending' });
});

// Scheduled task handlers
app.post('/cron/health-check', async (c) => {
  // Perform health checks and alert if necessary
  const health = {
    database: await checkDatabaseHealth(c.env.DB),
    cache: await checkCacheHealth(c.env.CACHE),
    storage: await checkStorageHealth(c.env.STORAGE),
  };
  
  // Log health status
  await c.env.ANALYTICS.writeDataPoint({
    blobs: [JSON.stringify(health)],
    doubles: [health.database ? 1 : 0, health.cache ? 1 : 0, health.storage ? 1 : 0],
    indexes: ['health_check'],
  });
  
  return c.json(health);
});

app.post('/cron/daily-backup', async (c) => {
  // Trigger daily backup process
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupKey = `backups/daily/${timestamp}.sql`;
    
    // Export database to R2
    const backup = await exportDatabase(c.env.DB);
    await c.env.STORAGE.put(backupKey, backup);
    
    return c.json({ success: true, backup: backupKey });
  } catch (error) {
    return c.json({ error: 'Backup failed' }, 500);
  }
});

// Error handling
app.onError(errorHandler);

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: c.req.path,
  }, 404);
});

// Helper functions
async function checkDatabaseHealth(db: D1Database): Promise<boolean> {
  try {
    const result = await db.prepare('SELECT 1').first();
    return result !== null;
  } catch {
    return false;
  }
}

async function checkCacheHealth(kv: KVNamespace): Promise<boolean> {
  try {
    await kv.put('health-check', 'ok', { expirationTtl: 60 });
    const value = await kv.get('health-check');
    return value === 'ok';
  } catch {
    return false;
  }
}

async function checkStorageHealth(storage: R2Bucket): Promise<boolean> {
  try {
    await storage.put('health-check.txt', 'ok');
    const object = await storage.get('health-check.txt');
    return object !== null;
  } catch {
    return false;
  }
}

async function exportDatabase(db: D1Database): Promise<string> {
  // Simplified database export
  const tables = ['users', 'organizations', 'farms', 'contexts'];
  let exportData = '';
  
  for (const table of tables) {
    try {
      const result = await db.prepare(`SELECT * FROM ${table}`).all();
      exportData += `-- Table: ${table}\n`;
      exportData += JSON.stringify(result.results, null, 2) + '\n\n';
    } catch (error) {
      console.error(`Failed to export table ${table}:`, error);
    }
  }
  
  return exportData;
}

// Durable Object classes
export class LiveChatDurableObject {
  private state: DurableObjectState;
  private sessions: Set<WebSocket> = new Set();

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    server.accept();
    this.sessions.add(server);

    server.addEventListener('message', (event) => {
      // Broadcast message to all connected clients
      const message = event.data;
      this.sessions.forEach((session) => {
        if (session !== server) {
          session.send(message);
        }
      });
    });

    server.addEventListener('close', () => {
      this.sessions.delete(server);
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }
}

export class NotificationsDurableObject {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (request.method === 'POST' && url.pathname === '/send') {
      const { userId, message, type } = await request.json();
      
      // Store notification
      await this.state.storage.put(`notification:${Date.now()}`, {
        userId,
        message,
        type,
        timestamp: new Date().toISOString(),
        read: false,
      });
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (request.method === 'GET' && url.pathname === '/list') {
      const userId = url.searchParams.get('userId');
      if (!userId) {
        return new Response('Missing userId parameter', { status: 400 });
      }
      
      const notifications = await this.state.storage.list();
      const userNotifications = [];
      
      for (const [key, notification] of notifications) {
        if (notification.userId === userId) {
          userNotifications.push({ id: key, ...notification });
        }
      }
      
      return new Response(JSON.stringify(userNotifications), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
}

export default app;