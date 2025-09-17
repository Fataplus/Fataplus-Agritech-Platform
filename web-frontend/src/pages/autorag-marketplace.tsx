"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Star, 
  Users, 
  Zap, 
  CheckCircle, 
  XCircle, 
  CreditCard,
  BarChart3,
  Bot,
  Leaf,
  TrendingUp,
  Cloud,
  Heart,
  DollarSign,
  Shield
} from 'lucide-react';

interface ContextModule {
  id: string;
  name: string;
  description: string;
  domains: string[];
  access_tier: string;
  pricing: {
    monthly: number;
    per_query: number;
  };
  features: string[];
  rating: number;
  user_count: number;
  preview_available: boolean;
}

interface UserCapabilities {
  tier: string;
  monthly_queries_limit: number;
  remaining_queries: number;
  subscription_status?: string;
  features: Record<string, boolean>;
  available_domains: string[];
}

interface AutoRAGQuery {
  query: string;
  domain_focus: string[];
  response_detail_level: number;
  include_citations: boolean;
  real_time_data: boolean;
}

const AutoRAGMarketplace: React.FC = () => {
  const [modules, setModules] = useState<ContextModule[]>([]);
  const [capabilities, setCapabilities] = useState<UserCapabilities | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('marketplace');
  
  // AutoRAG Query State
  const [ragQuery, setRagQuery] = useState<AutoRAGQuery>({
    query: '',
    domain_focus: [],
    response_detail_level: 3,
    include_citations: true,
    real_time_data: false
  });
  const [ragResponse, setRagResponse] = useState<any>(null);
  const [ragLoading, setRagLoading] = useState(false);

  useEffect(() => {
    fetchMarketplaceData();
    fetchUserCapabilities();
  }, []);

  const fetchMarketplaceData = async () => {
    try {
      setLoading(true);
      
      // Mock data - in production, fetch from API
      const mockModules: ContextModule[] = [
        {
          id: "weather_intelligence_pro",
          name: "🌤️ Weather Intelligence Pro",
          description: "Advanced weather forecasting with agricultural insights, irrigation recommendations, and crop-specific alerts",
          domains: ["weather_intelligence"],
          access_tier: "premium",
          pricing: { monthly: 9.99, per_query: 0.05 },
          features: [
            "7-day detailed forecasts",
            "Crop-specific weather alerts", 
            "Irrigation recommendations",
            "Historical weather patterns",
            "Microclimate analysis"
          ],
          rating: 4.8,
          user_count: 1250,
          preview_available: true
        },
        {
          id: "market_analytics_enterprise",
          name: "📈 Market Analytics Enterprise", 
          description: "Real-time commodity pricing, market trend analysis, and predictive market models",
          domains: ["market_analytics"],
          access_tier: "enterprise",
          pricing: { monthly: 49.99, per_query: 0.02 },
          features: [
            "Real-time price feeds",
            "Predictive market models", 
            "Custom price alerts",
            "API access",
            "Export capabilities",
            "Regional market analysis"
          ],
          rating: 4.9,
          user_count: 324,
          preview_available: true
        },
        {
          id: "livestock_health_specialized",
          name: "🐄 Livestock Health Specialist",
          description: "Expert veterinary knowledge, health monitoring, and disease prevention guides",
          domains: ["livestock_health"],
          access_tier: "specialized", 
          pricing: { monthly: 19.99, per_query: 0.08 },
          features: [
            "Veterinary expertise",
            "Disease prevention guides",
            "Treatment recommendations",
            "Health monitoring protocols",
            "Nutrition optimization"
          ],
          rating: 4.7,
          user_count: 687,
          preview_available: true
        },
        {
          id: "crop_optimization_ai",
          name: "🌱 Crop Optimization AI",
          description: "AI-powered crop management with yield optimization and planting recommendations",
          domains: ["crop_optimization"],
          access_tier: "premium",
          pricing: { monthly: 14.99, per_query: 0.06 },
          features: [
            "Yield optimization",
            "Planting schedules",
            "Fertilizer recommendations",
            "Pest management",
            "Growth tracking"
          ],
          rating: 4.6,
          user_count: 892,
          preview_available: true
        },
        {
          id: "soil_science_expert",
          name: "🧪 Soil Science Expert", 
          description: "Advanced soil analysis, nutrient management, and soil health optimization",
          domains: ["soil_science"],
          access_tier: "specialized",
          pricing: { monthly: 17.99, per_query: 0.07 },
          features: [
            "Soil composition analysis",
            "Nutrient deficiency detection",
            "pH optimization",
            "Organic matter management",
            "Erosion prevention"
          ],
          rating: 4.5,
          user_count: 445,
          preview_available: true
        }
      ];
      
      setModules(mockModules);
    } catch (error) {
      console.error('Failed to fetch marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCapabilities = async () => {
    try {
      // Mock capabilities - in production, fetch from API
      const mockCapabilities: UserCapabilities = {
        tier: "premium",
        monthly_queries_limit: 1000,
        remaining_queries: 750,
        subscription_status: "active",
        features: {
          basic_recommendations: true,
          weather_data: true,
          market_data: true,
          real_time_updates: false,
          personalization: true,
          priority_processing: false,
          custom_models: false,
          api_access: false,
          analytics_dashboard: true
        },
        available_domains: [
          "weather_intelligence",
          "basic_agronomy", 
          "market_analytics",
          "crop_optimization"
        ]
      };
      
      setCapabilities(mockCapabilities);
    } catch (error) {
      console.error('Failed to fetch user capabilities:', error);
    }
  };

  const processAutoRAGQuery = async () => {
    if (!ragQuery.query.trim()) return;
    
    try {
      setRagLoading(true);
      
      // Mock AutoRAG response - in production, call API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
      
      const mockResponse = {
        result: {
          answer: `Based on your ${ragQuery.query}, here are personalized recommendations for your ${ragQuery.domain_focus.join(', ')} needs. The AI analysis suggests optimal timing for planting considering current weather patterns and market conditions. Key recommendations include soil preparation, irrigation scheduling, and pest prevention strategies.`,
          sources: [
            "Agricultural Research Database",
            "Weather Intelligence Pro", 
            "Market Analytics Enterprise"
          ],
          confidence: 0.92,
          tier: capabilities?.tier || 'basic',
          cost: 0.05,
          usageRemaining: (capabilities?.remaining_queries || 50) - 1,
          processingTime: 1847,
          enhancedFeatures: {
            marketData: ragQuery.domain_focus.includes('market_analytics') ? {
              prices: { rice: 1350, cassava: 850 },
              trends: ["rice_price_increasing"]
            } : null,
            weatherData: ragQuery.domain_focus.includes('weather_intelligence') ? {
              current: { temp: 26, humidity: 65 },
              forecast: "partly_cloudy_next_week"
            } : null
          }
        },
        timestamp: new Date().toISOString()
      };
      
      setRagResponse(mockResponse);
      
      // Update remaining queries
      if (capabilities) {
        setCapabilities({
          ...capabilities,
          remaining_queries: capabilities.remaining_queries - 1
        });
      }
      
    } catch (error) {
      console.error('AutoRAG query failed:', error);
      setRagResponse({
        error: 'Failed to process query. Please try again.'
      });
    } finally {
      setRagLoading(false);
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'basic': return 'bg-gray-500';
      case 'premium': return 'bg-blue-500';
      case 'enterprise': return 'bg-purple-500'; 
      case 'specialized': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getDomainIcon = (domain: string) => {
    switch (domain) {
      case 'weather_intelligence': return <Cloud className="h-4 w-4" />;
      case 'market_analytics': return <TrendingUp className="h-4 w-4" />;
      case 'livestock_health': return <Heart className="h-4 w-4" />;
      case 'crop_optimization': return <Leaf className="h-4 w-4" />;
      case 'soil_science': return <BarChart3 className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const filteredModules = modules.filter(module => {
    const matchesSearch = !searchQuery || 
      module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDomains = selectedDomains.length === 0 ||
      selectedDomains.some(domain => module.domains.includes(domain));
    
    const matchesTiers = selectedTiers.length === 0 ||
      selectedTiers.includes(module.access_tier);
    
    return matchesSearch && matchesDomains && matchesTiers;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🤖 AutoRAG Marketplace
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Intelligence agricole alimentée par l'IA - Modules de contexte premium pour l'agriculture moderne
          </p>
          
          {/* User Status */}
          {capabilities && (
            <div className="bg-white rounded-lg p-4 shadow-sm border max-w-2xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Badge className={`${getTierBadgeColor(capabilities.tier)} text-white px-3 py-1`}>
                    {capabilities.tier.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {capabilities.remaining_queries}/{capabilities.monthly_queries_limit} requêtes restantes
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">
                    {capabilities.subscription_status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="marketplace" className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Marketplace</span>
            </TabsTrigger>
            <TabsTrigger value="autorag" className="flex items-center space-x-2">
              <Bot className="h-4 w-4" />
              <span>AutoRAG Query</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Rechercher des modules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Domaines" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weather_intelligence">Météo Intelligence</SelectItem>
                      <SelectItem value="market_analytics">Analyses de marché</SelectItem>
                      <SelectItem value="livestock_health">Santé du bétail</SelectItem>
                      <SelectItem value="crop_optimization">Optimisation cultures</SelectItem>
                      <SelectItem value="soil_science">Science du sol</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select>
                    <SelectTrigger className="w-full md:w-32">
                      <SelectValue placeholder="Niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="specialized">Spécialisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-20 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                filteredModules.map((module) => (
                  <Card key={module.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg leading-tight">
                          {module.name}
                        </CardTitle>
                        <Badge className={`${getTierBadgeColor(module.access_tier)} text-white text-xs`}>
                          {module.access_tier}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{module.rating}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{module.user_count}</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <p className="text-gray-600 text-sm mb-4">
                        {module.description}
                      </p>
                      
                      {/* Features */}
                      <div className="space-y-2 mb-4">
                        {module.features.slice(0, 3).map((feature, i) => (
                          <div key={i} className="flex items-center space-x-2 text-xs">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {module.features.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{module.features.length - 3} autres fonctionnalités
                          </div>
                        )}
                      </div>
                      
                      {/* Pricing */}
                      <div className="bg-gray-50 rounded p-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span>Mensuel:</span>
                          <span className="font-semibold">${module.pricing.monthly}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Par requête:</span>
                          <span>${module.pricing.per_query}</span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          Aperçu
                        </Button>
                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                          <CreditCard className="h-3 w-3 mr-1" />
                          S'abonner
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* AutoRAG Query Tab */}
          <TabsContent value="autorag" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Query Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bot className="h-5 w-5" />
                    <span>Requête AutoRAG</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Question agricole</label>
                    <textarea
                      value={ragQuery.query}
                      onChange={(e) => setRagQuery({ ...ragQuery, query: e.target.value })}
                      placeholder="Ex: Comment optimiser mes rendements de riz cette saison ?"
                      className="w-full p-3 border rounded-lg resize-none h-24"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Domaines de focus</label>
                    <div className="flex flex-wrap gap-2">
                      {['weather_intelligence', 'crop_optimization', 'market_analytics', 'soil_science'].map((domain) => (
                        <Badge
                          key={domain}
                          variant={ragQuery.domain_focus.includes(domain) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const newFocus = ragQuery.domain_focus.includes(domain)
                              ? ragQuery.domain_focus.filter(d => d !== domain)
                              : [...ragQuery.domain_focus, domain];
                            setRagQuery({ ...ragQuery, domain_focus: newFocus });
                          }}
                        >
                          {getDomainIcon(domain)}
                          <span className="ml-1">{domain.replace('_', ' ')}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Niveau de détail: {ragQuery.response_detail_level}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={ragQuery.response_detail_level}
                      onChange={(e) => setRagQuery({ 
                        ...ragQuery, 
                        response_detail_level: parseInt(e.target.value) 
                      })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Basique</span>
                      <span>Expert</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={ragQuery.include_citations}
                        onChange={(e) => setRagQuery({ ...ragQuery, include_citations: e.target.checked })}
                      />
                      <span className="text-sm">Inclure les citations</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={ragQuery.real_time_data}
                        onChange={(e) => setRagQuery({ ...ragQuery, real_time_data: e.target.checked })}
                        disabled={!capabilities?.features.real_time_updates}
                      />
                      <span className="text-sm">
                        Données temps réel 
                        {!capabilities?.features.real_time_updates && 
                          <span className="text-xs text-gray-500">(Premium requis)</span>
                        }
                      </span>
                    </label>
                  </div>
                  
                  <Button
                    onClick={processAutoRAGQuery}
                    disabled={!ragQuery.query.trim() || ragLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {ragLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Traitement...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4" />
                        <span>Envoyer la requête</span>
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Response */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Réponse AutoRAG</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!ragResponse ? (
                    <div className="text-center py-8 text-gray-500">
                      <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Posez une question pour obtenir une réponse intelligente</p>
                    </div>
                  ) : ragResponse.error ? (
                    <div className="text-center py-8 text-red-500">
                      <XCircle className="h-12 w-12 mx-auto mb-4" />
                      <p>{ragResponse.error}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Response Meta */}
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Confiance: {Math.round(ragResponse.result.confidence * 100)}%</span>
                          <span>Coût: ${ragResponse.result.cost}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                          <span>Temps: {ragResponse.result.processingTime}ms</span>
                          <span>Niveau: {ragResponse.result.tier}</span>
                        </div>
                      </div>
                      
                      {/* Answer */}
                      <div>
                        <h4 className="font-semibold mb-2">Réponse:</h4>
                        <div className="bg-gray-50 rounded p-3 text-sm leading-relaxed">
                          {ragResponse.result.answer}
                        </div>
                      </div>
                      
                      {/* Sources */}
                      {ragResponse.result.sources && (
                        <div>
                          <h4 className="font-semibold mb-2">Sources:</h4>
                          <div className="space-y-1">
                            {ragResponse.result.sources.map((source: string, i: number) => (
                              <div key={i} className="flex items-center space-x-2 text-xs">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span>{source}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Enhanced Features */}
                      {ragResponse.result.enhancedFeatures && (
                        <div className="border-t pt-4">
                          <h4 className="font-semibold mb-2">Données premium:</h4>
                          {ragResponse.result.enhancedFeatures.marketData && (
                            <div className="bg-blue-50 rounded p-2 mb-2">
                              <div className="text-xs font-medium">Données de marché:</div>
                              <div className="text-xs">
                                Riz: {ragResponse.result.enhancedFeatures.marketData.prices.rice} MGA/kg
                              </div>
                            </div>
                          )}
                          {ragResponse.result.enhancedFeatures.weatherData && (
                            <div className="bg-blue-50 rounded p-2">
                              <div className="text-xs font-medium">Météo actuelle:</div>
                              <div className="text-xs">
                                {ragResponse.result.enhancedFeatures.weatherData.current.temp}°C, 
                                {ragResponse.result.enhancedFeatures.weatherData.current.humidity}% humidity
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                  <h3 className="font-semibold mb-2">Requêtes ce mois</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {capabilities ? capabilities.monthly_queries_limit - capabilities.remaining_queries : 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    sur {capabilities?.monthly_queries_limit || 0} disponibles
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="font-semibold mb-2">Coût estimé</h3>
                  <p className="text-3xl font-bold text-green-600">$12.50</p>
                  <p className="text-sm text-gray-500">ce mois-ci</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                  <h3 className="font-semibold mb-2">Précision moyenne</h3>
                  <p className="text-3xl font-bold text-purple-600">87%</p>
                  <p className="text-sm text-gray-500">sur vos requêtes</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AutoRAGMarketplace;