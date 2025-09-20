import React, { useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from './Card';
import Button from './Button';
import { Badge } from './Badge';
import { cloudflareRAGEstimation, EstimationContext } from '../../utils/ragEstimator';

interface ServiceSuggestion {
  categoryId: string;
  days: number;
  reasoning: string;
}

interface AIPromptInterfaceProps {
  onSuggestionsGenerated: (suggestions: ServiceSuggestion[], prompt: string) => void;
  isLoading: boolean;
}

const AIPromptInterface: React.FC<AIPromptInterfaceProps> = ({
  onSuggestionsGenerated,
  isLoading
}) => {
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzePrompt = async () => {
    if (!prompt.trim()) return;

    setIsAnalyzing(true);
    try {
      // Simulate AI analysis - in production, this would call an AI service
      const mockAnalysis = await mockAIAnalysis(prompt);
      onSuggestionsGenerated(mockAnalysis.suggestions, prompt);
    } catch (error) {
      console.error('Erreur lors de l\'analyse du prompt:', error);
      alert('Erreur lors de l\'analyse du prompt. Veuillez réessayer.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Project type detection using advanced pattern matching
  const detectProjectType = (prompt: string): { type: string; confidence: number; features: string[] } => {
    const promptLower = prompt.toLowerCase();

    // Agricultural solutions (highest priority)
    if ((promptLower.includes('agricole') || promptLower.includes('ferme') ||
         promptLower.includes('culture') || promptLower.includes('agriculture')) &&
        (promptLower.includes('application') || promptLower.includes('plateforme') ||
         promptLower.includes('solution') || promptLower.includes('système'))) {
      return {
        type: 'agricultural_solution',
        confidence: 0.95,
        features: ['gis', 'mobile', 'data_analytics', 'real_time']
      };
    }

    // Mobile applications
    if (promptLower.includes('mobile') || promptLower.includes('application mobile') ||
        promptLower.includes('app mobile') || promptLower.includes('smartphone')) {
      return {
        type: 'mobile_app',
        confidence: 0.9,
        features: ['camera', 'gps', 'offline_sync', 'push_notifications']
      };
    }

    // Web platforms/SaaS
    if ((promptLower.includes('plateforme') || promptLower.includes('web') ||
         promptLower.includes('saas') || promptLower.includes('cloud')) &&
        !promptLower.includes('mobile')) {
      return {
        type: 'web_platform',
        confidence: 0.85,
        features: ['user_management', 'real_time', 'export', 'authentication']
      };
    }

    // Data analytics and dashboards
    if (promptLower.includes('données') || promptLower.includes('analytics') ||
        promptLower.includes('tableau') || promptLower.includes('dashboard') ||
        promptLower.includes('reporting') || promptLower.includes('statistiques')) {
      return {
        type: 'data_analytics',
        confidence: 0.8,
        features: ['charts', 'export', 'real_time', 'custom_dashboards']
    };
    }

    // Marketplace/e-commerce
    if (promptLower.includes('marketplace') || promptLower.includes('marché') ||
        promptLower.includes('vente') || promptLower.includes('achat') ||
        promptLower.includes('e-commerce') || promptLower.includes('commerce')) {
      return {
        type: 'marketplace',
        confidence: 0.85,
        features: ['payments', 'search', 'user_management', 'security']
      };
    }

    // AI/ML solutions
    if (promptLower.includes('ia') || promptLower.includes('intelligence artificielle') ||
        promptLower.includes('ai') || promptLower.includes('machine learning') ||
        promptLower.includes('prédiction') || promptLower.includes('analyse prédictive')) {
      return {
        type: 'ai_integration',
        confidence: 0.8,
        features: ['computer_vision', 'predictive_analytics', 'real_time_inference']
      };
    }

    // Default fallback
    return {
      type: 'web_platform',
      confidence: 0.6,
      features: ['user_management', 'reporting']
    };
  };

  const mockAIAnalysis = async (userPrompt: string): Promise<{ suggestions: ServiceSuggestion[] }> => {
    // Simulate AI processing time with RAG retrieval
    await new Promise(resolve => setTimeout(resolve, 3000));

    const suggestions: ServiceSuggestion[] = [];

    // Step 1: Detect project type and context
    const projectAnalysis = detectProjectType(userPrompt);

    // Step 2: Extract user type and scale
    const promptLower = userPrompt.toLowerCase();
    let userType: 'farmer' | 'cooperative' | 'enterprise' | 'government' = 'enterprise';
    let scale: 'small' | 'medium' | 'large' = 'medium';

    if (promptLower.includes('fermier') || promptLower.includes('agriculteur')) {
      userType = 'farmer';
    } else if (promptLower.includes('coopérative') || promptLower.includes('cooperative')) {
      userType = 'cooperative';
    } else if (promptLower.includes('gouvernement') || promptLower.includes('état')) {
      userType = 'government';
    }

    if (promptLower.includes('petit') || promptLower.includes('small') || promptLower.includes('local')) {
      scale = 'small';
    } else if (promptLower.includes('grand') || promptLower.includes('large') || promptLower.includes('national')) {
      scale = 'large';
    }

    // Step 3: Define service mappings for each project type
    const serviceMappings: Record<string, string[]> = {
      agricultural_solution: ['ux-research', 'ui-design', 'web-development', 'gis-integration', 'mobile-development', 'data-analysis'],
      mobile_app: ['ux-research', 'ui-design', 'mobile-development', 'testing', 'backend-api'],
      web_platform: ['ux-research', 'ui-design', 'web-development', 'backend-api', 'database-design', 'testing'],
      data_analytics: ['ux-research', 'data-analysis', 'dashboard-creation', 'api-integration', 'web-development'],
      marketplace: ['ux-research', 'ui-design', 'web-development', 'payment-integration', 'security-audit', 'backend-api'],
      ai_integration: ['ai-model-integration', 'backend-api', 'data-analysis', 'web-development', 'testing']
    };

    // Step 4: Get services for the detected project type
    const relevantServices = serviceMappings[projectAnalysis.type] || serviceMappings.web_platform;

    // Step 5: Use Cloudflare RAG estimation for each service
    for (const serviceId of relevantServices) {
      try {
        const context: EstimationContext = {
          prompt: userPrompt,
          complexity: 'medium', // Default, could be enhanced with prompt analysis
          domain: projectAnalysis.type,
          features: projectAnalysis.features,
          userType,
          scale
        };

        const estimation = await cloudflareRAGEstimation(serviceId, context);

        suggestions.push({
          categoryId: serviceId,
          days: estimation.estimatedDays,
          reasoning: `${estimation.reasoning} [Confiance: ${(estimation.confidence * 100).toFixed(0)}%]`
        });
      } catch (error) {
        console.error(`Error estimating ${serviceId}:`, error);
        // Fallback estimation
        suggestions.push({
          categoryId: serviceId,
          days: 10,
          reasoning: `Estimation par défaut pour ${serviceId} - Analyse RAG temporairement indisponible`
        });
      }
    }

    // Step 6: Sort by estimated days (largest first) and remove duplicates
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) =>
        index === self.findIndex(s => s.categoryId === suggestion.categoryId)
      )
      .sort((a, b) => b.days - a.days);

    return { suggestions: uniqueSuggestions };
  };

  const examplePrompts = [
    "Je veux créer une application mobile pour les agriculteurs qui peuvent suivre leurs cultures et recevoir des conseils personnalisés avec géolocalisation",
    "J'ai besoin d'une plateforme web complète pour connecter les agriculteurs avec les acheteurs de produits agricoles avec paiements intégrés",
    "Je souhaite développer un système de suivi des ventes avec tableaux de bord analytiques pour ma coopérative agricole",
    "Je veux une application mobile avec IA qui aide les agriculteurs à optimiser leurs rendements et prédire les récoltes",
    "Plateforme SaaS pour la gestion d'une chaîne d'approvisionnement agricole avec suivi GPS et analytics temps réel",
    "Application web pour marketplace agricole avec paiements sécurisés et système de notation des vendeurs",
    "Système de monitoring agricole avec capteurs IoT, tableaux de bord prédictifs et alertes automatiques"
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🤖 IA - Génération d'Estimation Automatisée
        </CardTitle>
        <p className="text-sm text-gray-600">
          Décrivez votre projet en langage naturel et laissez l'IA analyser vos besoins pour générer une estimation personnalisée
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="project-prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Décrivez votre projet :
          </label>
          <textarea
            id="project-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Je veux créer une application mobile pour les agriculteurs qui peuvent suivre leurs cultures..."
            className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            disabled={isAnalyzing || isLoading}
          />
        </div>

        {/* Example prompts */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Exemples de prompts :</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => setPrompt(example)}
                className="text-left text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded border text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isAnalyzing || isLoading}
              >
                "{example.length > 60 ? example.substring(0, 60) + '...' : example}"
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={analyzePrompt}
            disabled={!prompt.trim() || isAnalyzing || isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyse en cours...
              </>
            ) : (
              <>
                🚀 Analyser et Générer l'Estimation
              </>
            )}
          </Button>
          <Button
            onClick={() => setPrompt('')}
            variant="outline"
            disabled={isAnalyzing || isLoading}
          >
            Effacer
          </Button>
        </div>

        {isAnalyzing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
              <span className="text-sm">
                L'IA analyse votre demande et identifie les services les plus adaptés...
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIPromptInterface;
