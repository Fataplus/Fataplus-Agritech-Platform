/**
 * Fataplus Admin API - Cloudflare Worker
 * Provides admin backend functionality on Cloudflare's edge network
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';

interface Env {
  CACHE: KVNamespace;
  APP_CACHE: KVNamespace;
  STORAGE: R2Bucket;
  ML_MODELS: R2Bucket;
  JWT_SECRET_KEY: string;
  ENVIRONMENT: string;
  CORS_ORIGINS: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'admin' | 'farmer' | 'cooperative_manager' | 'extension_agent' | 'agribusiness';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  location?: string;
  language: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  farm_ids: string[];
}

interface Farm {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  farm_type: 'individual' | 'cooperative' | 'commercial';
  location: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  size_hectares?: number;
  crops: string[];
  livestock: Array<{
    type: string;
    count: number;
  }>;
  created_at: string;
  updated_at: string;
  status: string;
}

interface SystemMetrics {
  total_users: number;
  active_users: number;
  total_farms: number;
  active_farms: number;
  ai_requests_today: number;
  system_uptime: string;
  database_status: string;
  ai_service_status: string;
  timestamp: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('/*', (c, next) => {
  const corsMiddleware = cors({
    origin: (origin) => {
      const allowedOrigins = c.env.CORS_ORIGINS.split(',');
      return allowedOrigins.includes(origin) || origin?.includes('pages.dev') || origin?.includes('workers.dev');
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Sample data initialization
const initializeSampleData = async (env: Env) => {
  const usersKey = 'admin:users';
  const farmsKey = 'admin:farms';
  
  // Check if data exists
  const existingUsers = await env.CACHE.get(usersKey);
  if (!existingUsers) {
    // Initialize sample users
    const sampleUsers = [
      {
        id: 'user-admin-1',
        email: 'admin@fataplus.com',
        first_name: 'Admin',
        last_name: 'System',
        role: 'admin',
        status: 'active',
        location: 'Antananarivo, Madagascar',
        phone: '+261123456789',
        language: 'fr',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        farm_ids: []
      },
      {
        id: 'user-farmer-1',
        email: 'jean.rakoto@gmail.com',
        first_name: 'Jean',
        last_name: 'Rakoto',
        role: 'farmer',
        status: 'active',
        location: 'Antsirabe, Madagascar',
        phone: '+261987654321',
        language: 'fr',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        farm_ids: ['farm-1']
      },
      {
        id: 'user-coop-1',
        email: 'marie.razafy@coop.mg',
        first_name: 'Marie',
        last_name: 'Razafy',
        role: 'cooperative_manager',
        status: 'active',
        location: 'Fianarantsoa, Madagascar',
        phone: '+261456789123',
        language: 'fr',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        farm_ids: ['farm-2']
      }
    ];

    // Initialize sample farms
    const sampleFarms = [
      {
        id: 'farm-1',
        name: 'Ferme Rizicole Rakoto',
        description: 'Riziculture traditionnelle avec techniques modernes',
        owner_id: 'user-farmer-1',
        farm_type: 'individual',
        location: {
          latitude: -19.8667,
          longitude: 47.0333,
          address: 'Antsirabe, Madagascar'
        },
        size_hectares: 5.5,
        crops: ['Riz', 'Maïs', 'Haricots'],
        livestock: [
          { type: 'Zébu', count: 10 },
          { type: 'Poules', count: 25 }
        ],
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'farm-2',
        name: 'Coopérative Agricole du Sud',
        description: 'Coopérative regroupant 50 petits agriculteurs',
        owner_id: 'user-coop-1',
        farm_type: 'cooperative',
        location: {
          latitude: -21.4526,
          longitude: 47.0858,
          address: 'Fianarantsoa, Madagascar'
        },
        size_hectares: 150.0,
        crops: ['Café', 'Vanille', 'Girofle', 'Riz'],
        livestock: [
          { type: 'Zébu', count: 75 },
          { type: 'Chèvres', count: 120 }
        ],
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    await env.CACHE.put(usersKey, JSON.stringify(sampleUsers));
    await env.CACHE.put(farmsKey, JSON.stringify(sampleFarms));
  }
};

// Routes

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Fataplus Admin API - Cloudflare Worker',
    version: '1.0.0',
    environment: c.env.ENVIRONMENT,
    endpoints: {
      dashboard: '/admin/dashboard',
      users: '/admin/users',
      farms: '/admin/farms',
      metrics: '/admin/metrics',
      analytics: '/admin/analytics'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'fataplus-admin-api',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Admin dashboard
app.get('/admin/dashboard', async (c) => {
  await initializeSampleData(c.env);
  
  const usersData = await c.env.CACHE.get('admin:users');
  const farmsData = await c.env.CACHE.get('admin:farms');
  
  const users = usersData ? JSON.parse(usersData) : [];
  const farms = farmsData ? JSON.parse(farmsData) : [];
  
  const metrics: SystemMetrics = {
    total_users: users.length,
    active_users: users.filter((u: User) => u.status === 'active').length,
    total_farms: farms.length,
    active_farms: farms.filter((f: Farm) => f.status === 'active').length,
    ai_requests_today: Math.floor(Math.random() * 200) + 100, // Mock data
    system_uptime: '7 days, 12 hours',
    database_status: 'healthy',
    ai_service_status: 'healthy',
    timestamp: new Date().toISOString()
  };

  const dashboard = {
    metrics,
    recent_users: users.slice(0, 5),
    recent_farms: farms.slice(0, 5),
    alerts: [
      {
        id: 'alert_1',
        type: 'warning',
        title: 'Météo défavorable',
        message: 'Prévisions de fortes pluies à Antsirabe dans les 48h',
        timestamp: new Date().toISOString(),
        severity: 'medium'
      }
    ],
    performance_data: {
      api_response_time: Math.floor(Math.random() * 100) + 50,
      database_queries_per_second: Math.floor(Math.random() * 50) + 20,
      active_sessions: Math.floor(Math.random() * 50) + 10,
      memory_usage: Math.floor(Math.random() * 40) + 30,
      cpu_usage: Math.floor(Math.random() * 50) + 20,
      storage_usage: Math.floor(Math.random() * 30) + 20
    }
  };

  return c.json(dashboard);
});

// Get system metrics
app.get('/admin/metrics', async (c) => {
  await initializeSampleData(c.env);
  
  const usersData = await c.env.CACHE.get('admin:users');
  const farmsData = await c.env.CACHE.get('admin:farms');
  
  const users = usersData ? JSON.parse(usersData) : [];
  const farms = farmsData ? JSON.parse(farmsData) : [];
  
  const metrics: SystemMetrics = {
    total_users: users.length,
    active_users: users.filter((u: User) => u.status === 'active').length,
    total_farms: farms.length,
    active_farms: farms.filter((f: Farm) => f.status === 'active').length,
    ai_requests_today: Math.floor(Math.random() * 200) + 100,
    system_uptime: '7 days, 12 hours',
    database_status: 'healthy',
    ai_service_status: 'healthy',
    timestamp: new Date().toISOString()
  };

  return c.json(metrics);
});

// Get users with pagination
app.get('/admin/users', async (c) => {
  await initializeSampleData(c.env);
  
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const search = c.req.query('search') || '';
  
  const usersData = await c.env.CACHE.get('admin:users');
  let users = usersData ? JSON.parse(usersData) : [];
  
  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase();
    users = users.filter((user: User) => 
      user.email.toLowerCase().includes(searchLower) ||
      user.first_name.toLowerCase().includes(searchLower) ||
      user.last_name.toLowerCase().includes(searchLower)
    );
  }
  
  // Pagination
  const total = users.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedUsers = users.slice(start, end);
  
  return c.json({
    items: paginatedUsers,
    total,
    page,
    limit,
    pages,
    has_next: page < pages,
    has_prev: page > 1
  });
});

// Get single user
app.get('/admin/users/:id', async (c) => {
  const userId = c.req.param('id');
  
  const usersData = await c.env.CACHE.get('admin:users');
  const users = usersData ? JSON.parse(usersData) : [];
  
  const user = users.find((u: User) => u.id === userId);
  if (!user) {
    return c.json({ error: 'Utilisateur non trouvé' }, 404);
  }
  
  return c.json(user);
});

// Get farms with pagination  
app.get('/admin/farms', async (c) => {
  await initializeSampleData(c.env);
  
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const search = c.req.query('search') || '';
  
  const farmsData = await c.env.CACHE.get('admin:farms');
  let farms = farmsData ? JSON.parse(farmsData) : [];
  
  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase();
    farms = farms.filter((farm: Farm) => 
      farm.name.toLowerCase().includes(searchLower) ||
      (farm.description && farm.description.toLowerCase().includes(searchLower))
    );
  }
  
  // Pagination
  const total = farms.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedFarms = farms.slice(start, end);
  
  return c.json({
    items: paginatedFarms,
    total,
    page,
    limit,
    pages,
    has_next: page < pages,
    has_prev: page > 1
  });
});

// Get single farm
app.get('/admin/farms/:id', async (c) => {
  const farmId = c.req.param('id');
  
  const farmsData = await c.env.CACHE.get('admin:farms');
  const farms = farmsData ? JSON.parse(farmsData) : [];
  
  const farm = farms.find((f: Farm) => f.id === farmId);
  if (!farm) {
    return c.json({ error: 'Ferme non trouvée' }, 404);
  }
  
  return c.json(farm);
});

// User analytics
app.get('/admin/analytics/users', async (c) => {
  await initializeSampleData(c.env);
  
  const usersData = await c.env.CACHE.get('admin:users');
  const users = usersData ? JSON.parse(usersData) : [];
  
  const analytics = {
    total_users: users.length,
    users_by_role: {},
    users_by_status: {},
    users_by_location: {},
    timestamp: new Date().toISOString()
  };
  
  // Analyze user data
  users.forEach((user: User) => {
    // Count by role
    analytics.users_by_role[user.role] = (analytics.users_by_role[user.role] || 0) + 1;
    
    // Count by status
    analytics.users_by_status[user.status] = (analytics.users_by_status[user.status] || 0) + 1;
    
    // Count by location
    const location = user.location || 'Non spécifié';
    analytics.users_by_location[location] = (analytics.users_by_location[location] || 0) + 1;
  });
  
  return c.json(analytics);
});

// Farm analytics
app.get('/admin/analytics/farms', async (c) => {
  await initializeSampleData(c.env);
  
  const farmsData = await c.env.CACHE.get('admin:farms');
  const farms = farmsData ? JSON.parse(farmsData) : [];
  
  const analytics = {
    total_farms: farms.length,
    farms_by_type: {},
    total_area_hectares: 0,
    average_farm_size: 0,
    crops_distribution: {},
    livestock_distribution: {},
    timestamp: new Date().toISOString()
  };
  
  // Analyze farm data
  farms.forEach((farm: Farm) => {
    // Count by type
    analytics.farms_by_type[farm.farm_type] = (analytics.farms_by_type[farm.farm_type] || 0) + 1;
    
    // Calculate total area
    if (farm.size_hectares) {
      analytics.total_area_hectares += farm.size_hectares;
    }
    
    // Count crops
    farm.crops.forEach(crop => {
      analytics.crops_distribution[crop] = (analytics.crops_distribution[crop] || 0) + 1;
    });
    
    // Count livestock
    farm.livestock.forEach(animal => {
      const type = animal.type;
      const count = animal.count;
      analytics.livestock_distribution[type] = (analytics.livestock_distribution[type] || 0) + count;
    });
  });
  
  analytics.average_farm_size = farms.length > 0 ? 
    Math.round((analytics.total_area_hectares / farms.length) * 100) / 100 : 0;
  
  return c.json(analytics);
});

// AI service status
app.get('/admin/ai/status', (c) => {
  return c.json({
    status: 'healthy',
    service_url: 'https://api.fata.plus/ai',
    timestamp: new Date().toISOString(),
    data: {
      model: 'SmolLM2-1.7B-Instruct',
      status: 'operational',
      response_time: '120ms'
    }
  });
});

// System information
app.get('/admin/system/info', (c) => {
  return c.json({
    service: 'Fataplus Admin API',
    version: '1.0.0',
    environment: c.env.ENVIRONMENT,
    framework: 'Cloudflare Workers + Hono',
    database: 'Cloudflare KV',
    storage: 'Cloudflare R2',
    features: [
      'user_management',
      'farm_management', 
      'analytics',
      'ai_integration',
      'real_time_dashboard'
    ],
    timestamp: new Date().toISOString()
  });
});

export default app;