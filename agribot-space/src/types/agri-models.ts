// AgriBot.space Data Models
// Based on PostgreSQL schema from specs/006-agribot-space/data-model.md
// These interfaces represent core entities for type-safe API integration with Fataplus platform

export interface User {
  id: string;
  keycloakUserId: string;
  email: string;
  phone?: string;
  fullName?: string;
  avatarUrl?: string;
  tier: 'viewer' | 'registered' | 'premium';
  language?: string;
  region?: string;
  timezone?: string;
  fataplusUserId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface UserProfile {
  id: string;
  userId: string;
  farmType?: string; // 'crop', 'livestock', 'mixed', 'agribusiness'
  farmSizeHectares?: number;
  primaryCrops?: string[];
  livestockTypes?: string[];
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  interests?: string[];
  goals?: string[];
  challenges?: string[];
  locationCoordinates?: { lat: number; lng: number };
  locationAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
  sortOrder?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Prompts {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  systemPrompt: string;
  userPromptTemplate: string;
  expectedOutputFormat?: 'text' | 'json' | 'structured';
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  accessLevel: 'free' | 'registered' | 'premium';
  estimatedTokens?: number;
  costUsd?: number;
  tags?: string[];
  contextRequirements?: string[];
  popularityScore?: number;
  successRate?: number;
  isFeatured?: boolean;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversations {
  id: string;
  userId?: string;
  sessionId?: string;
  promptId?: string;
  topicTitle?: string;
  status: 'active' | 'completed' | 'archived';
  totalMessages?: number;
  totalTokensUsed?: number;
  costUsd?: number;
  satisfactionRating?: number;
  feedbackText?: string;
  isBookmarked?: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface Messages {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, string | number | boolean>;
  tokensUsed?: number;
  processingTimeMs?: number;
  contextData?: Record<string, string | number | boolean>;
  isFlagged?: boolean;
  flagReason?: string;
  createdAt: Date;
}

export interface Subscriptions {
  id: string;
  userId: string;
  stripeSubscriptionId?: string;
  planName: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd?: boolean;
  amountUsd: number;
  currency?: 'USD';
  intervalType?: 'month' | 'year';
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Additional entities can be added as needed (e.g., Courses, Experts, etc.)