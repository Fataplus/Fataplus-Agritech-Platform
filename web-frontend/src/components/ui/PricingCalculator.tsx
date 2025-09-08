import React, { useState, useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import Button from './Button';
import Badge from './Badge';
import Input from './Input';

// Pricing constants based on Fataplus PRD
const DAILY_RATE_MGA = 150000; // 150,000 MGA TTC per day
const DAILY_RATE_EUR = 28.57; // ~28.57 € per day
const MONTHLY_SAAS_RATE = 1; // €1 per user per month

// Exchange rate (approximate)
const MGA_TO_EUR = 0.0001905; // 1 MGA ≈ 0.0001905 €
const EUR_TO_MGA = 5247; // 1 € ≈ 5,247 MGA

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  minDays: number;
  maxDays: number;
  complexity: 'low' | 'medium' | 'high';
  sdg: string;
}

const serviceCategories: ServiceCategory[] = [
  {
    id: 'ux-audit',
    name: 'Audit UX/UI & Benchmarking',
    description: 'Analyse de l&apos;expérience utilisateur et benchmarking concurrentiel',
    minDays: 2,
    maxDays: 3,
    complexity: 'low',
    sdg: 'SDG 2 - Améliore accessibilité pour inclusion'
  },
  {
    id: 'design-system',
    name: 'Design System & Prototypage',
    description: 'Création de système de design et prototypes interactifs',
    minDays: 3,
    maxDays: 5,
    complexity: 'medium',
    sdg: 'SDG 12 - Composants réutilisables pour apps durables'
  },
  {
    id: 'wireframing',
    name: 'Wireframing & Flow Utilisateur',
    description: 'Maquettes et diagrammes de flux utilisateur',
    minDays: 2,
    maxDays: 4,
    complexity: 'low',
    sdg: 'SDG 2 - Optimise prise de décision pour productivité'
  },
  {
    id: 'user-testing',
    name: 'Tests Utilisateurs & Itérations',
    description: 'Sessions de tests utilisateurs et itérations',
    minDays: 2,
    maxDays: 3,
    complexity: 'low',
    sdg: 'SDG 5/8 - Assure inclusion femmes/jeunes'
  },
  {
    id: 'no-code-app',
    name: 'Application Web/Mobile No-Code',
    description: 'Développement d&apos;application web/mobile avec Bubble/Adalo',
    minDays: 6,
    maxDays: 12,
    complexity: 'high',
    sdg: 'SDG 8 - Scalable pour croissance économique'
  },
  {
    id: 'api-integration',
    name: 'Intégration API & Automatisation',
    description: 'Connexions APIs et workflows automatisés',
    minDays: 2,
    maxDays: 4,
    complexity: 'medium',
    sdg: 'SDG 13 - Réduit pertes climatiques'
  },
  {
    id: 'deployment',
    name: 'Déploiement & Publication',
    description: 'Configuration hébergement et publication',
    minDays: 2,
    maxDays: 3,
    complexity: 'low',
    sdg: 'SDG 9 - Favorise innovation inclusive'
  },
  {
    id: 'ai-integration',
    name: 'Intégration IA (VibeCoding)',
    description: 'Agents IA et fonctionnalités intelligentes',
    minDays: 2,
    maxDays: 5,
    complexity: 'high',
    sdg: 'SDG 13 - Renforce résilience climatique'
  },
  {
    id: 'branding',
    name: 'Branding & Identité Visuelle',
    description: 'Logo, charte graphique et supports marketing',
    minDays: 2,
    maxDays: 3,
    complexity: 'low',
    sdg: 'SDG 12 - Promote marque durable'
  },
  {
    id: 'audit',
    name: 'Audit Technique & Conseil',
    description: 'Analyse technique et recommandations stratégiques',
    minDays: 2,
    maxDays: 3,
    complexity: 'medium',
    sdg: 'SDG 12 - Optimise ressources'
  },
  {
    id: 'training',
    name: 'Formation No-Code & IA',
    description: 'Ateliers pratiques et certification',
    minDays: 1,
    maxDays: 3,
    complexity: 'low',
    sdg: 'SDG 4/8 - Emploi/formation'
  }
];

interface SelectedService {
  categoryId: string;
  days: number;
  complexity: 'low' | 'medium' | 'high';
}

const PricingCalculator: React.FC = () => {
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [saasUsers, setSaasUsers] = useState<number>(10);
  const [saasMonths, setSaasMonths] = useState<number>(12);
  const [currency, setCurrency] = useState<'MGA' | 'EUR'>('EUR');

  // Calculate total costs
  const calculations = useMemo(() => {
    const agencyTotalDays = selectedServices.reduce((sum, service) => sum + service.days, 0);
    const agencyTotalMGA = agencyTotalDays * DAILY_RATE_MGA;
    const agencyTotalEUR = agencyTotalDays * DAILY_RATE_EUR;

    const saasTotalEUR = saasUsers * saasMonths * MONTHLY_SAAS_RATE;
    const saasTotalMGA = saasTotalEUR * EUR_TO_MGA;

    const grandTotalMGA = agencyTotalMGA + saasTotalMGA;
    const grandTotalEUR = agencyTotalEUR + saasTotalEUR;

    // Calculate by complexity
    const complexityBreakdown = {
      low: { days: 0, costMGA: 0, costEUR: 0 },
      medium: { days: 0, costMGA: 0, costEUR: 0 },
      high: { days: 0, costMGA: 0, costEUR: 0 }
    };

    selectedServices.forEach(service => {
      complexityBreakdown[service.complexity].days += service.days;
      complexityBreakdown[service.complexity].costEUR += service.days * DAILY_RATE_EUR;
      complexityBreakdown[service.complexity].costMGA += service.days * DAILY_RATE_MGA;
    });

    return {
      agencyTotalDays,
      agencyTotalMGA,
      agencyTotalEUR,
      saasTotalMGA,
      saasTotalEUR,
      grandTotalMGA,
      grandTotalEUR,
      complexityBreakdown
    };
  }, [selectedServices, saasUsers, saasMonths]);

  const toggleService = (categoryId: string) => {
    const category = serviceCategories.find(cat => cat.id === categoryId);
    if (!category) return;

    const existingService = selectedServices.find(s => s.categoryId === categoryId);

    if (existingService) {
      setSelectedServices(prev => prev.filter(s => s.categoryId !== categoryId));
    } else {
      const newService: SelectedService = {
        categoryId,
        days: category.minDays,
        complexity: category.complexity
      };
      setSelectedServices(prev => [...prev, newService]);
    }
  };

  const updateServiceDays = (categoryId: string, days: number) => {
    setSelectedServices(prev =>
      prev.map(service =>
        service.categoryId === categoryId
          ? { ...service, days: Math.max(1, Math.min(days, 30)) }
          : service
      )
    );
  };

  const formatCurrency = (amount: number, currency: 'MGA' | 'EUR') => {
    if (currency === 'MGA') {
      return new Intl.NumberFormat('fr-MG', {
        style: 'currency',
        currency: 'MGA',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } else {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    }
  };

  const getComplexityBadgeVariant = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Calculateur de Prix Fataplus
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Estimez le coût de vos projets AgriTech avec notre modèle de tarification transparent
        </p>
        <div className="flex justify-center gap-4 mt-4">
          <Badge variant="primary">150 000 MGA TTC/jour</Badge>
          <Badge variant="secondary">~28,57 €/jour</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Service Selection */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sélection des Services</CardTitle>
              <p className="text-sm text-gray-600">
                Choisissez les prestations dont vous avez besoin pour votre projet AgriTech
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {serviceCategories.map(category => {
                const selectedService = selectedServices.find(s => s.categoryId === category.id);
                const isSelected = !!selectedService;

                return (
                  <div
                    key={category.id}
                    className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                    onClick={() => toggleService(category.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                        <p className="text-xs text-primary-600 mt-1">{category.sdg}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={getComplexityBadgeVariant(category.complexity)}>
                          {category.complexity.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {category.minDays}-{category.maxDays} jours
                        </span>
                      </div>
                    </div>

                    {isSelected && selectedService && (
                      <div className="mt-4 pt-4 border-t border-primary-200">
                        <div className="flex items-center gap-4">
                          <label className="text-sm font-medium text-gray-700">
                            Durée estimée:
                          </label>
                          <Input
                            type="number"
                            value={selectedService.days}
                            onChange={(e) => updateServiceDays(category.id, parseInt(e.target.value) || 0)}
                            className="w-20"
                            min={category.minDays}
                            max={category.maxDays}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-sm text-gray-500">jours</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* SaaS Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration Plateforme SaaS</CardTitle>
              <p className="text-sm text-gray-600">
                Configuration de votre abonnement mensuel à la plateforme Fataplus
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre d&apos;utilisateurs
                  </label>
                  <Input
                    type="number"
                    value={saasUsers}
                    onChange={(e) => setSaasUsers(Math.max(1, parseInt(e.target.value) || 0))}
                    min={1}
                    max={1000}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée (mois)
                  </label>
                  <Input
                    type="number"
                    value={saasMonths}
                    onChange={(e) => setSaasMonths(Math.max(1, parseInt(e.target.value) || 0))}
                    min={1}
                    max={36}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Tarif: {MONTHLY_SAAS_RATE}€ par utilisateur par mois
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Summary */}
        <div className="space-y-6">
          {/* Currency Toggle */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center gap-2">
                <Button
                  variant={currency === 'EUR' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCurrency('EUR')}
                >
                  €
                </Button>
                <Button
                  variant={currency === 'MGA' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCurrency('MGA')}
                >
                  MGA
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Agency Services Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Services Agence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Nombre de jours total</span>
                <span className="font-semibold">{calculations.agencyTotalDays} jours</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tarif journalier</span>
                <span className="font-semibold">
                  {currency === 'MGA'
                    ? formatCurrency(DAILY_RATE_MGA, 'MGA')
                    : formatCurrency(DAILY_RATE_EUR, 'EUR')
                  }
                </span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Agence</span>
                  <span className="font-bold text-lg">
                    {currency === 'MGA'
                      ? formatCurrency(calculations.agencyTotalMGA, 'MGA')
                      : formatCurrency(calculations.agencyTotalEUR, 'EUR')
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SaaS Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Plateforme SaaS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{saasUsers} utilisateurs × {saasMonths} mois</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tarif mensuel</span>
                <span className="font-semibold">{formatCurrency(MONTHLY_SAAS_RATE, 'EUR')}/utilisateur/mois</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total SaaS</span>
                  <span className="font-bold text-lg">
                    {currency === 'MGA'
                      ? formatCurrency(calculations.saasTotalMGA, 'MGA')
                      : formatCurrency(calculations.saasTotalEUR, 'EUR')
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grand Total */}
          <Card variant="elevated">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Estimé</h3>
                <div className="text-3xl font-bold text-primary-600">
                  {currency === 'MGA'
                    ? formatCurrency(calculations.grandTotalMGA, 'MGA')
                    : formatCurrency(calculations.grandTotalEUR, 'EUR')
                  }
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Pour {calculations.agencyTotalDays} jours de développement +
                  {saasUsers} utilisateurs pendant {saasMonths} mois
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Complexity Breakdown */}
          {selectedServices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Complexité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(calculations.complexityBreakdown).map(([complexity, data]) => {
                  if (data.days === 0) return null;
                  return (
                    <div key={complexity} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant={getComplexityBadgeVariant(complexity)}>
                          {complexity.toUpperCase()}
                        </Badge>
                        <span className="text-sm">{data.days} jours</span>
                      </div>
                      <span className="font-medium">
                        {currency === 'MGA'
                          ? formatCurrency(data.costMGA, 'MGA')
                          : formatCurrency(data.costEUR, 'EUR')
                        }
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Contact CTA */}
          <Card variant="gradient">
            <CardContent className="pt-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Prêt à lancer votre projet AgriTech ?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Contactez-nous pour une consultation gratuite et un devis personnalisé
              </p>
              <div className="space-y-2">
                <Button size="lg" className="w-full">
                  Demander un Devis
                </Button>
                <p className="text-xs text-gray-500">
                  Réponse sous 24h • Consultation gratuite
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selected Services Summary */}
      {selectedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Services Sélectionnés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedServices.map(service => {
                const category = serviceCategories.find(cat => cat.id === service.categoryId);
                if (!category) return null;

                return (
                  <div key={service.categoryId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      <p className="text-sm text-gray-600">{category.sdg}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getComplexityBadgeVariant(service.complexity)}>
                        {service.days} jours
                      </Badge>
                      <span className="font-medium">
                        {currency === 'MGA'
                          ? formatCurrency(service.days * DAILY_RATE_MGA, 'MGA')
                          : formatCurrency(service.days * DAILY_RATE_EUR, 'EUR')
                        }
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PricingCalculator;
