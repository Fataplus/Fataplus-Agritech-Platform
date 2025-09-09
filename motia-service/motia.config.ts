import { defineConfig } from 'motia';

export default defineConfig({
  // Project configuration
  name: 'fataplus-ai-service',
  version: '1.0.0',
  
  // Environment configuration
  env: {
    // Database connections
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/fataplus',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    
    // AI service configurations
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    WEATHER_API_KEY: process.env.WEATHER_API_KEY,
    
    // Integration with main backend
    MAIN_BACKEND_URL: process.env.MAIN_BACKEND_URL || 'http://localhost:8000',
    
    // Motia-specific settings
    MOTIA_PORT: process.env.MOTIA_PORT || '8001',
  },
  
  // Development settings
  dev: {
    port: 8001,
    watch: true,
    workbench: true, // Enable Motia's visual debugging interface
  },
  
  // Production settings
  build: {
    outDir: 'dist',
    target: 'node18',
  },
  
  // Observability
  observability: {
    logs: {
      level: 'info',
      format: 'json',
    },
    tracing: {
      enabled: true,
      serviceName: 'fataplus-ai-service',
    },
  },
  
  // Integration settings
  integrations: {
    // Connect to existing PostgreSQL database
    database: {
      type: 'postgresql',
      url: process.env.DATABASE_URL,
    },
    
    // Connect to existing Redis instance
    cache: {
      type: 'redis',
      url: process.env.REDIS_URL,
    },
  },
});