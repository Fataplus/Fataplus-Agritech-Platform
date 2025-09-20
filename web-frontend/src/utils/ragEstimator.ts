// Cloudflare RAG-like Estimation System for Fataplus Pricing
// This simulates a Retrieval-Augmented Generation approach using Cloudflare's AI capabilities

export interface EstimationContext {
  prompt: string;
  complexity: 'low' | 'medium' | 'high';
  domain: string;
  features: string[];
  userType: 'farmer' | 'cooperative' | 'enterprise' | 'government';
  scale: 'small' | 'medium' | 'large';
}

export interface RAGEstimation {
  serviceId: string;
  estimatedDays: number;
  confidence: number;
  reasoning: string;
  similarProjects: Array<{
    name: string;
    actualDays: number;
    successRate: number;
  }>;
}

// Knowledge base of historical project data (simulating RAG retrieval)
const PROJECT_KNOWLEDGE_BASE = {
  mobile_apps: [
    {
      name: "FarmTracker Mobile",
      description: "Mobile app for crop tracking",
      actualDays: 28,
      complexity: 'medium',
      features: ['gps', 'camera', 'offline_sync'],
      successRate: 0.92
    },
    {
      name: "AgriMarket Mobile",
      description: "Marketplace mobile app",
      actualDays: 35,
      complexity: 'high',
      features: ['payments', 'chat', 'search'],
      successRate: 0.88
    }
  ],
  web_platforms: [
    {
      name: "CoopManager SaaS",
      description: "Cooperative management platform",
      actualDays: 45,
      complexity: 'high',
      features: ['user_management', 'reporting', 'payments'],
      successRate: 0.95
    }
  ],
  data_analytics: [
    {
      name: "Yield Analytics Dashboard",
      description: "Crop yield analysis platform",
      actualDays: 22,
      complexity: 'medium',
      features: ['charts', 'export', 'real_time'],
      successRate: 0.89
    }
  ]
};

const SERVICE_ESTIMATION_RULES = {
  'ux-research': {
    baseDays: 8,
    complexityMultiplier: { low: 0.7, medium: 1.0, high: 1.4 },
    featureMultipliers: {
      'user_interviews': 1.2,
      'competitor_analysis': 1.1,
      'usability_testing': 1.3
    }
  },
  'ui-design': {
    baseDays: 12,
    complexityMultiplier: { low: 0.8, medium: 1.0, high: 1.5 },
    featureMultipliers: {
      'mobile_design': 1.2,
      'responsive_design': 1.1,
      'accessibility': 1.3,
      'dark_mode': 1.1
    }
  },
  'mobile-development': {
    baseDays: 25,
    complexityMultiplier: { low: 0.6, medium: 1.0, high: 1.6 },
    featureMultipliers: {
      'offline_mode': 1.4,
      'push_notifications': 1.2,
      'camera_integration': 1.3,
      'gps_tracking': 1.2,
      'real_time_sync': 1.3
    }
  },
  'web-development': {
    baseDays: 20,
    complexityMultiplier: { low: 0.7, medium: 1.0, high: 1.4 },
    featureMultipliers: {
      'real_time_features': 1.3,
      'advanced_search': 1.2,
      'export_functionality': 1.1,
      'multi_tenant': 1.5
    }
  },
  'backend-api': {
    baseDays: 15,
    complexityMultiplier: { low: 0.8, medium: 1.0, high: 1.5 },
    featureMultipliers: {
      'authentication': 1.1,
      'file_upload': 1.2,
      'real_time_websockets': 1.4,
      'third_party_integrations': 1.3,
      'advanced_security': 1.4
    }
  },
  'database-design': {
    baseDays: 8,
    complexityMultiplier: { low: 0.9, medium: 1.0, high: 1.3 },
    featureMultipliers: {
      'complex_relationships': 1.3,
      'high_performance': 1.4,
      'data_migration': 1.2,
      'backup_recovery': 1.2
    }
  },
  'testing': {
    baseDays: 10,
    complexityMultiplier: { low: 0.8, medium: 1.0, high: 1.4 },
    featureMultipliers: {
      'automated_testing': 1.2,
      'performance_testing': 1.3,
      'security_testing': 1.4,
      'cross_browser_testing': 1.2
    }
  },
  'data-analysis': {
    baseDays: 12,
    complexityMultiplier: { low: 0.7, medium: 1.0, high: 1.3 },
    featureMultipliers: {
      'predictive_analytics': 1.5,
      'real_time_processing': 1.3,
      'custom_dashboards': 1.2,
      'data_visualization': 1.2
    }
  },
  'payment-integration': {
    baseDays: 8,
    complexityMultiplier: { low: 0.9, medium: 1.0, high: 1.4 },
    featureMultipliers: {
      'multiple_payment_methods': 1.3,
      'subscription_management': 1.4,
      'fraud_detection': 1.5,
      'international_payments': 1.3
    }
  },
  'security-audit': {
    baseDays: 6,
    complexityMultiplier: { low: 0.8, medium: 1.0, high: 1.3 },
    featureMultipliers: {
      'penetration_testing': 1.4,
      'compliance_certification': 1.3,
      'security_monitoring': 1.2
    }
  },
  'gis-integration': {
    baseDays: 14,
    complexityMultiplier: { low: 0.8, medium: 1.0, high: 1.5 },
    featureMultipliers: {
      'satellite_imagery': 1.4,
      'field_mapping': 1.2,
      'weather_integration': 1.3,
      'yield_prediction': 1.5
    }
  },
  'ai-model-integration': {
    baseDays: 18,
    complexityMultiplier: { low: 0.7, medium: 1.0, high: 1.6 },
    featureMultipliers: {
      'custom_model_training': 1.8,
      'computer_vision': 1.5,
      'natural_language_processing': 1.4,
      'real_time_inference': 1.3
    }
  }
};

// RAG-like retrieval function
function retrieveSimilarProjects(query: string, domain: string): Array<any> {
  // Simulate vector search based on project descriptions
  const relevantProjects: Array<any> = [];

  Object.values(PROJECT_KNOWLEDGE_BASE).forEach(categoryProjects => {
    categoryProjects.forEach(project => {
      const similarity = calculateSimilarity(query, project.description);
      if (similarity > 0.3) { // Similarity threshold
        relevantProjects.push({
          ...project,
          similarity,
          category: domain
        });
      }
    });
  });

  return relevantProjects.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
}

// Simple text similarity calculation
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(' ');
  const words2 = text2.toLowerCase().split(' ');
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  return intersection.length / union.length;
}

// Extract features from prompt using NLP-like approach
function extractFeatures(prompt: string): string[] {
  const features: string[] = [];
  const promptLower = prompt.toLowerCase();

  const featureKeywords = {
    'gps': ['gps', 'localisation', 'position', 'tracking'],
    'camera': ['photo', 'image', 'camera', 'scan'],
    'offline_sync': ['offline', 'hors ligne', 'sync', 'synchronisation'],
    'payments': ['paiement', 'payment', 'achat', 'vente'],
    'chat': ['chat', 'message', 'discussion', 'communication'],
    'search': ['recherche', 'search', 'filtre', 'filter'],
    'user_management': ['utilisateur', 'user', 'gestion', 'management'],
    'reporting': ['rapport', 'report', 'analytics', 'statistiques'],
    'real_time': ['temps réel', 'real time', 'live', 'instantané'],
    'export': ['export', 'téléchargement', 'download', 'pdf'],
    'authentication': ['connexion', 'login', 'authentification'],
    'file_upload': ['upload', 'fichier', 'document'],
    'websockets': ['temps réel', 'live', 'notification'],
    'third_party': ['intégration', 'api', 'service externe']
  };

  Object.entries(featureKeywords).forEach(([feature, keywords]) => {
    if (keywords.some(keyword => promptLower.includes(keyword))) {
      features.push(feature);
    }
  });

  return features;
}

// Main RAG estimation function
export async function estimateWithRAG(serviceId: string, context: EstimationContext): Promise<RAGEstimation> {
  const serviceRules = SERVICE_ESTIMATION_RULES[serviceId as keyof typeof SERVICE_ESTIMATION_RULES];

  if (!serviceRules) {
    return {
      serviceId,
      estimatedDays: 5,
      confidence: 0.5,
      reasoning: 'Service non trouvé dans la base de connaissances',
      similarProjects: []
    };
  }

  // RAG Step 1: Retrieve similar projects
  const similarProjects = retrieveSimilarProjects(context.prompt, context.domain);

  // RAG Step 2: Extract features from context
  const detectedFeatures = extractFeatures(context.prompt);

  // RAG Step 3: Calculate base estimation
  let estimatedDays = serviceRules.baseDays;

  // Apply complexity multiplier
  estimatedDays *= serviceRules.complexityMultiplier[context.complexity];

  // Apply feature multipliers
  detectedFeatures.forEach(feature => {
    const multiplier = serviceRules.featureMultipliers[feature as keyof typeof serviceRules.featureMultipliers];
    if (multiplier) {
      estimatedDays *= multiplier;
    }
  });

  // RAG Step 4: Adjust based on similar projects
  let confidence = 0.7; // Base confidence
  let adjustmentFactor = 1.0;

  if (similarProjects.length > 0) {
    const avgActualDays = similarProjects.reduce((sum, p) => sum + p.actualDays, 0) / similarProjects.length;
    const weight = Math.min(similarProjects.length * 0.2, 0.4); // Max 40% weight from similar projects

    adjustmentFactor = (avgActualDays * weight + estimatedDays * (1 - weight)) / estimatedDays;
    confidence = Math.min(0.9, 0.7 + similarProjects.length * 0.1);
  }

  estimatedDays *= adjustmentFactor;

  // Scale adjustment based on project size
  const scaleMultipliers = {
    small: 0.8,
    medium: 1.0,
    large: 1.3
  };
  estimatedDays *= scaleMultipliers[context.scale];

  // Round to nearest whole number
  estimatedDays = Math.max(1, Math.round(estimatedDays));

  // Generate reasoning
  let reasoning = `Estimation RAG basée sur ${estimatedDays} jours. `;

  if (similarProjects.length > 0) {
    reasoning += `Projets similaires trouvés: ${similarProjects.map(p => p.name).join(', ')}. `;
  }

  if (detectedFeatures.length > 0) {
    reasoning += `Fonctionnalités détectées: ${detectedFeatures.join(', ')}. `;
  }

  reasoning += `Confiance: ${(confidence * 100).toFixed(0)}%.`;

  return {
    serviceId,
    estimatedDays,
    confidence,
    reasoning,
    similarProjects: similarProjects.map(p => ({
      name: p.name,
      actualDays: p.actualDays,
      successRate: p.successRate
    }))
  };
}

// Cloudflare Workers-compatible estimation function
export async function cloudflareRAGEstimation(serviceId: string, context: EstimationContext): Promise<RAGEstimation> {
  // This would be called from a Cloudflare Worker in production
  // For now, we'll use the local RAG implementation

  try {
    // Simulate API call to Cloudflare Worker
    const result = await estimateWithRAG(serviceId, context);

    // Add Cloudflare-specific processing
    result.reasoning += ' [Powered by Cloudflare RAG]';

    return result;
  } catch (error) {
    console.error('Cloudflare RAG estimation failed:', error);
    return estimateWithRAG(serviceId, context); // Fallback
  }
}
