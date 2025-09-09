// API service for the Fataplus platform
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Generic fetch function with error handling
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    throw error;
  }
}

// Dashboard API functions
export const dashboardAPI = {
  // Fetch dashboard statistics
  getStats: async () => {
    // In a real implementation, this would be:
    // return fetchAPI('/dashboard/stats');
    
    // For now, returning mock data with the same structure
    return {
      activeUsers: 2847,
      activeUsersChange: 12,
      apiCallsToday: 45231,
      apiCallsChange: 8,
      aiResponseTime: 245,
      aiResponseTimeChange: -15,
      serverUptime: 99.98,
      serverUptimeChange: 0.01,
      totalUsers: 15642,
      totalTokens: 89234,
      storageUsed: 45.2,
      aiRequestsPerHour: 1250
    };
  },

  // Fetch recent activities
  getActivities: async () => {
    // In a real implementation, this would be:
    // return fetchAPI('/dashboard/activities');
    
    // For now, returning mock data with the same structure
    return [
      {
        id: 1,
        user: 'Marie Dubois',
        action: 'Created new API key',
        target: 'Weather API Access',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        type: 'create'
      },
      {
        id: 2,
        user: 'Jean Rakoto',
        action: 'Updated context',
        target: 'Rice Farming Techniques',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        type: 'update'
      },
      {
        id: 3,
        user: 'AI Service',
        action: 'Processed request',
        target: 'Crop Disease Detection',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        type: 'ai'
      },
      {
        id: 4,
        user: 'Admin',
        action: 'Deployed update',
        target: 'Context API v2.1.0',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        type: 'deploy'
      },
      {
        id: 5,
        user: 'Sophie Martin',
        action: 'Generated report',
        target: 'Monthly Analytics',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
        type: 'report'
      }
    ];
  },

  // Fetch server metrics
  getServerMetrics: async () => {
    // In a real implementation, this would be:
    // return fetchAPI('/dashboard/server-metrics');
    
    // For now, returning mock data with the same structure
    return {
      web_backend: {
        status: 'running',
        uptime: '99.9%',
        response_time: '145ms',
        cpu: 65,
        memory: 78
      },
      ai_service: {
        status: 'running',
        uptime: '99.8%',
        response_time: '850ms',
        active_requests: 12,
        queue_length: 3
      },
      database: {
        status: 'running',
        uptime: '99.95%',
        connections: 45,
        storage_used: '12.5GB'
      },
      redis: {
        status: 'running',
        uptime: '99.9%',
        memory_used: '256MB',
        hit_rate: '94%'
      }
    };
  }
};

// Context API functions
export const contextAPI = {
  // Fetch all contexts
  getContexts: async () => {
    // In a real implementation, this would be:
    // return fetchAPI('/contexts');
    
    // For now, returning mock data with the same structure as in context.tsx
    return [
      {
        id: '1',
        title: 'Techniques de Culture du Riz Irrigué',
        type: 'guide',
        category: 'Agriculture',
        author: 'Dr. Marie Dubois',
        status: 'published',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        views: 1250,
        tags: ['riz', 'irrigation', 'culture'],
        language: 'fr'
      },
      {
        id: '2',
        title: 'Détection Précoce des Maladies des Plantes',
        type: 'research',
        category: 'Pathologie Végétale',
        author: 'Prof. Jean Rakoto',
        status: 'published',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
        views: 890,
        tags: ['maladies', 'diagnostic', 'prévention'],
        language: 'fr'
      },
      {
        id: '3',
        title: 'Optimisation de la Fertilisation Azotée',
        type: 'technique',
        category: 'Nutrition des Plantes',
        author: 'Sophie Martin',
        status: 'draft',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        views: 0,
        tags: ['fertilisation', 'azote', 'efficacité'],
        language: 'fr'
      },
      {
        id: '4',
        title: 'Impact du Changement Climatique sur l\'Agriculture',
        type: 'article',
        category: 'Climatologie',
        author: 'Pierre Andrian',
        status: 'published',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        views: 2100,
        tags: ['climat', 'changement', 'adaptation'],
        language: 'fr'
      }
    ];
  },

  // Fetch a specific context by ID
  getContextById: async (id: string) => {
    // In a real implementation, this would be:
    // return fetchAPI(`/contexts/${id}`);
    
    // For now, returning mock data
    return {
      id,
      title: 'Sample Context',
      type: 'article',
      category: 'Sample Category',
      author: 'Sample Author',
      status: 'published',
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      tags: ['sample'],
      language: 'en',
      content: 'This is sample context content.'
    };
  },

  // Create a new context
  createContext: async (contextData: any) => {
    // In a real implementation, this would be:
    // return fetchAPI('/contexts', {
    //   method: 'POST',
    //   body: JSON.stringify(contextData),
    // });
    
    // For now, returning mock data
    return {
      id: 'new-id',
      ...contextData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  // Update an existing context
  updateContext: async (id: string, contextData: any) => {
    // In a real implementation, this would be:
    // return fetchAPI(`/contexts/${id}`, {
    //   method: 'PUT',
    //   body: JSON.stringify(contextData),
    // });
    
    // For now, returning mock data
    return {
      id,
      ...contextData,
      updatedAt: new Date(),
    };
  },

  // Delete a context
  deleteContext: async (id: string) => {
    // In a real implementation, this would be:
    // return fetchAPI(`/contexts/${id}`, {
    //   method: 'DELETE',
    // });
    
    // For now, returning mock data
    return { success: true };
  }
};

export default {
  dashboardAPI,
  contextAPI
};