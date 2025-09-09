"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface TierLimits {
  monthlyTopics: number;
  features: string[];
}

interface TierInfo {
  name: 'viewer' | 'registered' | 'premium';
  limits: TierLimits;
  currentUsage: {
    topicsUsed: number;
    monthYear: string;
  };
  isLimitReached: boolean;
}

const TIERS: Record<string, TierLimits> = {
  viewer: {
    monthlyTopics: 1,
    features: ['Basic AI responses', 'Public knowledge base'],
  },
  registered: {
    monthlyTopics: 5,
    features: ['Personalized responses', 'Conversation history', 'Basic courses'],
  },
  premium: {
    monthlyTopics: -1, // unlimited
    features: ['All features', 'Expert consultation', 'Advanced courses', 'Priority support'],
  },
};

interface TierContextType {
  tier: TierInfo;
  useTopic: (topicId: string) => boolean; // returns true if allowed
  upgradeTier: () => void;
  resetUsage: () => void;
  isFeatureAllowed: (feature: string) => boolean;
}

const TierContext = createContext<TierContextType | undefined>(undefined);

export const useTier = () => {
  const context = useContext(TierContext);
  if (context === undefined) {
    throw new Error('useTier must be used within a TierProvider');
  }
  return context;
};

interface TierProviderProps {
  children: ReactNode;
}

export const TierProvider: React.FC<TierProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [tier, setTier] = useState<TierInfo>({
    name: 'viewer',
    limits: TIERS.viewer,
    currentUsage: { topicsUsed: 0, monthYear: new Date().toISOString().slice(0, 7) },
    isLimitReached: false,
  });

  useEffect(() => {
    if (user) {
      const storedUsage = localStorage.getItem(`tier_usage_${user.id}`);
      const currentMonth = new Date().toISOString().slice(0, 7);
      let usage = { topicsUsed: 0, monthYear: currentMonth };

      if (storedUsage) {
        const parsed = JSON.parse(storedUsage);
        if (parsed.monthYear === currentMonth) {
          usage = parsed;
        }
      }

      const tierName = user.tier || 'viewer';
      const limits = TIERS[tierName] || TIERS.viewer;
      const isLimitReached = limits.monthlyTopics > 0 && usage.topicsUsed >= limits.monthlyTopics;

      setTier({
        name: tierName as 'viewer' | 'registered' | 'premium',
        limits,
        currentUsage: usage,
        isLimitReached,
      });
    }
  }, [user]);

  const useTopic = (_topicId: string): boolean => {
    if (tier.isLimitReached || tier.limits.monthlyTopics === -1) return false;

    const newUsage = { ...tier.currentUsage, topicsUsed: tier.currentUsage.topicsUsed + 1 };
    localStorage.setItem(`tier_usage_${user?.id}`, JSON.stringify(newUsage));

    setTier(prev => ({
      ...prev,
      currentUsage: newUsage,
      isLimitReached: newUsage.topicsUsed >= prev.limits.monthlyTopics,
    }));

    return true;
  };

  const upgradeTier = () => {
    // Placeholder for Stripe integration
    console.log('Upgrade to premium');
  };

  const resetUsage = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const newUsage = { topicsUsed: 0, monthYear: currentMonth };
    localStorage.setItem(`tier_usage_${user?.id}`, JSON.stringify(newUsage));
    setTier(prev => ({ ...prev, currentUsage: newUsage, isLimitReached: false }));
  };

  const isFeatureAllowed = (feature: string): boolean => {
    return tier.limits.features.some(f => f.includes(feature)) || tier.name === 'premium';
  };

  const value: TierContextType = {
    tier,
    useTopic,
    upgradeTier,
    resetUsage,
    isFeatureAllowed,
  };

  return (
    <TierContext.Provider value={value}>
      {children}
    </TierContext.Provider>
  );
};