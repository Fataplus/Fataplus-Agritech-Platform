import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, streamText, generateObject, tool } from 'ai';
import { z } from 'zod';

// AI models configuration with AI Elements
const openaiModel = openai('gpt-4o-mini');
const claudeModel = anthropic('claude-3-5-sonnet-20241022');

// Enhanced Agricultural system prompt with AI Elements
const AGRICULTURAL_SYSTEM_PROMPT = `You are AgriBot, an expert agricultural assistant specializing in African farming practices.
You provide practical, culturally appropriate advice for small-scale farmers across Africa.
Always consider local climate, traditional farming methods, and sustainable practices.
Be helpful, accurate, and encouraging. Use simple language that farmers can understand.
If you don't know something specific to a region, acknowledge this and provide general best practices.

You have access to various tools to provide comprehensive agricultural guidance:
- Weather information for farming decisions
- Crop disease identification and treatment
- Market price trends and recommendations
- Livestock health and management advice
- Soil analysis and improvement suggestions
- Pest control methods
- Irrigation techniques
- Sustainable farming practices

Always provide actionable, step-by-step advice when possible.`;

// AI Elements: Define tools for enhanced functionality
const weatherTool = tool({
  description: 'Get weather information for farming decisions',
  parameters: z.object({
    location: z.string().describe('Location for weather information'),
    days: z.number().optional().describe('Number of days ahead to forecast'),
  }),
  execute: async ({ location, days = 3 }: { location: string; days?: number }) => {
    // Placeholder for weather API integration
    return {
      location,
      forecast: `Weather forecast for ${location}: ${days} days ahead`,
      farming_advice: 'Consider soil moisture levels and temperature changes'
    };
  },
});

const cropDiseaseTool = tool({
  description: 'Identify crop diseases and provide treatment recommendations',
  parameters: z.object({
    symptoms: z.string().describe('Symptoms observed on the crop'),
    crop_type: z.string().describe('Type of crop affected'),
  }),
  execute: async ({ symptoms, crop_type }: { symptoms: string; crop_type: string }) => {
    // Placeholder for disease identification
    console.log('Disease symptoms:', symptoms, 'for crop:', crop_type);
    return {
      disease: 'Possible disease identified',
      treatment: 'Recommended treatment steps',
      prevention: 'Preventive measures for the future'
    };
  },
});

const marketTool = tool({
  description: 'Get current market prices and trends for crops',
  parameters: z.object({
    crop: z.string().describe('Crop to check market prices for'),
    location: z.string().describe('Location for market information'),
  }),
  execute: async ({ crop, location }: { crop: string; location: string }) => {
    // Placeholder for market data
    return {
      crop,
      location,
      current_price: 'Current market price per kg',
      trend: 'Price trend analysis',
      recommendations: 'Selling or holding recommendations'
    };
  },
});

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
  processingTime: number;
  tools?: any[];
  metadata?: Record<string, any>;
}

export interface EnhancedAIContext {
  location?: string;
  crop?: string;
  livestock?: string;
  experience?: string;
  weather?: {
    location: string;
    forecast: string;
    farming_advice: string;
  };
  market_data?: {
    crop: string;
    location: string;
    current_price: string;
    trend: string;
    recommendations: string;
  };
  soil_type?: string;
  farming_method?: string;
}

export class AIService {
  private model = openaiModel; // Default to OpenAI, can be switched
  private availableTools = [weatherTool, cropDiseaseTool, marketTool];

  setModel(model: 'openai' | 'claude') {
    this.model = model === 'claude' ? claudeModel : openaiModel;
  }

  // Enhanced AI Elements response generation with tools
  async generateResponse(
    userMessage: string,
    context?: EnhancedAIContext
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Build enhanced context-aware prompt
      let enhancedPrompt = userMessage;
      const tools = this.availableTools;

      if (context) {
        enhancedPrompt = `Context information:
${JSON.stringify(context, null, 2)}

User question: ${userMessage}

Please provide specific, actionable agricultural advice considering the context above.`;
      }

      // Use AI Elements with tools for enhanced functionality
      const result = await generateText({
        model: this.model,
        system: AGRICULTURAL_SYSTEM_PROMPT,
        prompt: enhancedPrompt,
        temperature: 0.7,
        tools: tools,
        maxToolRoundtrips: 3, // Allow multiple tool calls
      });

      const processingTime = Date.now() - startTime;

      return {
        content: result.text,
        model: this.model === openaiModel ? 'gpt-4o-mini' : 'claude-3-5-sonnet',
        tokensUsed: result.usage?.totalTokens || 0,
        processingTime,
        tools: result.toolCalls,
        metadata: {
          toolCalls: result.toolCalls?.length || 0,
          contextUsed: !!context,
        },
      };
    } catch (error) {
      console.error('AI generation error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  // Enhanced streaming with AI Elements
  async *streamResponse(
    userMessage: string,
    context?: EnhancedAIContext
  ): AsyncGenerator<string, void, unknown> {
    try {
      let enhancedPrompt = userMessage;
      const tools = this.availableTools;

      if (context) {
        enhancedPrompt = `Context information:
${JSON.stringify(context, null, 2)}

User question: ${userMessage}

Please provide specific, actionable agricultural advice considering the context above.`;
      }

      const result = await streamText({
        model: this.model,
        system: AGRICULTURAL_SYSTEM_PROMPT,
        prompt: enhancedPrompt,
        temperature: 0.7,
        tools: tools,
        maxToolRoundtrips: 3,
      });

      for await (const delta of result.textStream) {
        yield delta;
      }
    } catch (error) {
      console.error('AI streaming error:', error);
      throw new Error('Failed to stream AI response');
    }
  }

  // AI Elements: Structured data extraction for farming analysis
  async analyzeFarmingQuery(query: string): Promise<{
    intent: string;
    entities: Record<string, string>;
    confidence: number;
  }> {
    const result = await generateObject({
      model: this.model,
      system: 'Analyze agricultural queries and extract key entities and intent.',
      prompt: `Analyze this farming query: "${query}"`,
      schema: z.object({
        intent: z.string().describe('The main intent of the query (e.g., "crop_advice", "disease_diagnosis", "market_info")'),
        entities: z.record(z.string()).describe('Key entities extracted from the query'),
        confidence: z.number().min(0).max(1).describe('Confidence score for the analysis'),
      }),
    });

    return result.object;
  }

  // Agricultural-specific helper methods with AI Elements
  async getCropAdvice(crop: string, location: string, issue?: string): Promise<AIResponse> {
    const context: EnhancedAIContext = {
      crop,
      location,
      experience: 'intermediate',
    };

    const prompt = `Provide specific advice for growing ${crop} in ${location}${issue ? ` regarding: ${issue}` : ''}`;
    return this.generateResponse(prompt, context);
  }

  async getLivestockAdvice(species: string, location: string, issue?: string): Promise<AIResponse> {
    const context: EnhancedAIContext = {
      livestock: species,
      location,
      experience: 'intermediate',
    };

    const prompt = `Provide specific advice for raising ${species} in ${location}${issue ? ` regarding: ${issue}` : ''}`;
    return this.generateResponse(prompt, context);
  }

  async getMarketAdvice(crop: string, location: string): Promise<AIResponse> {
    const context: EnhancedAIContext = {
      crop,
      location,
      experience: 'intermediate',
    };

    const prompt = `Provide market advice for ${crop} in ${location} including pricing trends and selling strategies`;
    return this.generateResponse(prompt, context);
  }

  // AI Elements: Smart farming recommendations
  async getSmartRecommendations(context: EnhancedAIContext): Promise<{
    recommendations: string[];
    priority: 'low' | 'medium' | 'high';
    timeframe: string;
  }> {
    const result = await generateObject({
      model: this.model,
      system: 'Provide smart farming recommendations based on context.',
      prompt: `Generate farming recommendations for: ${JSON.stringify(context)}`,
      schema: z.object({
        recommendations: z.array(z.string()).describe('List of actionable recommendations'),
        priority: z.enum(['low', 'medium', 'high']).describe('Priority level of recommendations'),
        timeframe: z.string().describe('Recommended timeframe for implementation'),
      }),
    });

    return result.object;
  }
}

// Singleton instance
export const aiService = new AIService();