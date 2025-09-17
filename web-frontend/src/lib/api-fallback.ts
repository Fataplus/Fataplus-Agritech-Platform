/**
 * API Fallback for Admin Panel
 * Provides mock data when main API is unavailable
 */

export const mockMetrics = {
  total_users: 3,
  active_users: 3,
  total_farms: 2,
  active_farms: 2,
  ai_requests_today: 268,
  system_uptime: "7 days, 12 hours",
  database_status: "healthy",
  ai_service_status: "healthy",
  timestamp: new Date().toISOString()
};

export const mockUsers = [
  {
    id: "1",
    email: "admin@fata.plus",
    first_name: "Admin",
    last_name: "Fataplus",
    role: "admin",
    status: "active",
    location: "Madagascar",
    language: "fr",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-09-17T09:00:00Z",
    last_login: "2025-09-17T08:00:00Z",
    farm_ids: ["farm-1"]
  },
  {
    id: "2", 
    email: "farmer1@fata.plus",
    first_name: "Jean",
    last_name: "Rakoto",
    role: "farmer",
    status: "active",
    location: "Antananarivo",
    language: "fr",
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2025-09-17T07:00:00Z",
    last_login: "2025-09-16T18:00:00Z",
    farm_ids: ["farm-1", "farm-2"]
  },
  {
    id: "3",
    email: "coop@fata.plus", 
    first_name: "Marie",
    last_name: "Andry",
    role: "cooperative_manager",
    status: "active",
    location: "Fianarantsoa",
    language: "fr",
    created_at: "2025-02-01T00:00:00Z",
    updated_at: "2025-09-17T06:00:00Z",
    last_login: "2025-09-17T07:30:00Z",
    farm_ids: ["farm-2"]
  }
];

export const mockFarms = [
  {
    id: "farm-1",
    name: "Ferme Rakoto - Riz et Légumes",
    description: "Exploitation familiale de riz et légumes bio",
    owner_id: "2",
    farm_type: "individual",
    location: {
      latitude: -18.8792,
      longitude: 47.5079,
      address: "Antananarivo, Madagascar"
    },
    size_hectares: 2.5,
    crops: ["Riz", "Haricots", "Tomates"],
    livestock: [
      { type: "Poulets", quantity: 25 },
      { type: "Canards", quantity: 10 }
    ],
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2025-09-17T08:00:00Z",
    status: "active"
  },
  {
    id: "farm-2", 
    name: "Coopérative Agricole Sud",
    description: "Coopérative de producteurs de vanille et café",
    owner_id: "3",
    farm_type: "cooperative", 
    location: {
      latitude: -21.4530,
      longitude: 47.0860,
      address: "Fianarantsoa, Madagascar"
    },
    size_hectares: 15.0,
    crops: ["Vanille", "Café", "Girofle"],
    livestock: [
      { type: "Zébus", quantity: 8 }
    ],
    created_at: "2025-02-01T00:00:00Z",
    updated_at: "2025-09-17T07:30:00Z", 
    status: "active"
  }
];

/**
 * Fallback API client that uses mock data
 */
export class FallbackApiClient {
  static async getMetrics() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockMetrics;
  }
  
  static async getUsers() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockUsers;
  }
  
  static async getFarms() {
    await new Promise(resolve => setTimeout(resolve, 400)); 
    return mockFarms;
  }
}

/**
 * Smart API client that tries main API first, falls back to mock data
 */
export class SmartApiClient {
  private static baseUrl = 'https://fataplus-admin-api-production.fenohery.workers.dev';
  
  private static createTimeoutController(timeoutMs: number) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    // Clear timeout if request completes normally
    controller.signal.addEventListener('abort', () => clearTimeout(timeoutId));
    
    return controller;
  }
  
  static async getMetrics() {
    try {
      const controller = this.createTimeoutController(8000); // Longer timeout
      
      const response = await fetch(`${this.baseUrl}/admin/metrics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        signal: controller.signal
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API metrics loaded successfully');
        return data;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.warn('⚠️ API unavailable, using fallback data:', error);
      // Return fallback data immediately to avoid additional delays
      return mockMetrics;
    }
  }
  
  static async getUsers() {
    try {
      const controller = this.createTimeoutController(8000);
      
      const response = await fetch(`${this.baseUrl}/admin/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        signal: controller.signal
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API users loaded successfully');
        return data;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.warn('⚠️ API unavailable, using fallback data:', error);
      return mockUsers;
    }
  }
  
  static async getFarms() {
    try {
      const controller = this.createTimeoutController(8000);
      
      const response = await fetch(`${this.baseUrl}/admin/farms`, {
        method: 'GET', 
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        signal: controller.signal
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API farms loaded successfully');
        return data;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.warn('⚠️ API unavailable, using fallback data:', error);
      return mockFarms;
    }
  }
}