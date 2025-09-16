/**
 * AI services routes for Cloudflare Worker
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const ai = new Hono();

// Generate AI insights for farm data
ai.post('/insights/farm/:farmId', async (c) => {
  try {
    const { userId, role } = c.get('jwtPayload');
    const farmId = c.req.param('farmId');
    const { dataType = 'general', includeRecommendations = true } = await c.req.json();

    // Check farm access
    const farm = await c.env.DB.prepare(`
      SELECT f.*, u.name as owner_name
      FROM farms f
      JOIN users u ON f.owner_id = u.id
      WHERE f.id = ? AND f.active = 1
    `).bind(farmId).first();

    if (!farm) {
      throw new HTTPException(404, { message: 'Farm not found' });
    }

    const hasAccess = role === 'admin' || 
                     farm.owner_id === userId ||
                     (farm.organization_id && await checkOrganizationMembership(c.env.DB, userId, farm.organization_id));

    if (!hasAccess) {
      throw new HTTPException(403, { message: 'Access denied' });
    }

    // Gather farm data for AI analysis
    const [crops, equipment, weather, soilData] = await Promise.all([
      c.env.DB.prepare(`
        SELECT name, variety, current_stage, health_status, area_hectares, planting_date
        FROM crops WHERE farm_id = ? AND active = 1
      `).bind(farmId).all(),
      
      c.env.DB.prepare(`
        SELECT name, type, condition_status, last_maintenance
        FROM farm_equipment WHERE farm_id = ? AND active = 1
      `).bind(farmId).all(),
      
      getWeatherData(c.env, farm.location),
      getSoilData(c.env, farmId)
    ]);

    // Prepare data for AI analysis
    const analysisData = {
      farm: {
        name: farm.name,
        location: farm.location,
        size_hectares: farm.size_hectares,
        farm_type: farm.farm_type,
        soil_type: farm.soil_type,
        climate_zone: farm.climate_zone,
      },
      crops: crops.results,
      equipment: equipment.results,
      weather: weather,
      soil: soilData,
      analysis_type: dataType,
    };

    // Use Cloudflare Workers AI for analysis
    const aiPrompt = buildAIPrompt(analysisData, includeRecommendations);
    
    const aiResponse = await c.env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [
        {
          role: "system",
          content: "You are an agricultural AI assistant with expertise in farming, crop management, and agricultural best practices. Provide detailed, actionable insights based on the farm data provided."
        },
        {
          role: "user",
          content: aiPrompt
        }
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });

    // Parse and structure the AI response
    const insights = parseAIInsights(aiResponse.response);

    // Store the analysis for future reference
    const analysisId = await storeAnalysis(c.env.DB, {
      farmId,
      userId,
      dataType,
      insights,
      rawData: analysisData,
    });

    // Log activity
    await logUserActivity(c.env.DB, userId, 'ai_analysis', 'AI Farm Analysis',
      `Generated AI insights for farm: ${farm.name}`, { farmId, analysisId });

    return c.json({
      success: true,
      insights,
      analysisId,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('AI farm insights error:', error);
    throw new HTTPException(500, { message: 'Failed to generate AI insights' });
  }
});

// Generate crop recommendations
ai.post('/recommendations/crop', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');
    const { 
      location, 
      soilType, 
      climateZone, 
      farmSize, 
      currentCrops = [], 
      season,
      preferences = {} 
    } = await c.req.json();

    if (!location || !soilType) {
      throw new HTTPException(400, { message: 'Location and soil type are required' });
    }

    // Get weather data for location
    const weatherData = await getWeatherData(c.env, location);

    // Prepare data for AI recommendation
    const recommendationData = {
      location,
      soil_type: soilType,
      climate_zone: climateZone,
      farm_size: farmSize,
      current_crops: currentCrops,
      season,
      weather: weatherData,
      preferences,
    };

    const aiPrompt = `
Based on the following agricultural data, recommend the best crops to grow:

Location: ${location}
Soil Type: ${soilType}
Climate Zone: ${climateZone || 'Unknown'}
Farm Size: ${farmSize || 'Not specified'} hectares
Current Season: ${season || 'Not specified'}
Current Crops: ${currentCrops.join(', ') || 'None'}

Weather Data: ${JSON.stringify(weatherData, null, 2)}

Preferences: ${JSON.stringify(preferences, null, 2)}

Please provide:
1. Top 5 recommended crops with reasons
2. Planting timeline and care instructions
3. Expected yield and market potential
4. Risk factors and mitigation strategies
5. Crop rotation suggestions

Format the response as structured JSON with clear categories.
`;

    const aiResponse = await c.env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [
        {
          role: "system",
          content: "You are an expert agricultural advisor specializing in crop selection and farming optimization. Provide practical, location-specific recommendations."
        },
        {
          role: "user",
          content: aiPrompt
        }
      ],
      max_tokens: 1024,
      temperature: 0.8,
    });

    const recommendations = parseCropRecommendations(aiResponse.response);

    // Store recommendation for user
    await c.env.DB.prepare(`
      INSERT INTO ai_recommendations (user_id, type, data, recommendations, created_at)
      VALUES (?, 'crop', ?, ?, datetime('now'))
    `).bind(userId, JSON.stringify(recommendationData), JSON.stringify(recommendations)).run();

    return c.json({
      success: true,
      recommendations,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('AI crop recommendations error:', error);
    throw new HTTPException(500, { message: 'Failed to generate crop recommendations' });
  }
});

// Analyze crop health from image
ai.post('/analyze/crop-health', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');
    const formData = await c.req.formData();
    const imageFile = formData.get('image');
    const cropType = formData.get('cropType');
    const additionalInfo = formData.get('additionalInfo');

    if (!imageFile || !(imageFile instanceof File)) {
      throw new HTTPException(400, { message: 'Image file is required' });
    }

    if (!imageFile.type.startsWith('image/')) {
      throw new HTTPException(400, { message: 'File must be an image' });
    }

    // Upload image to R2 for processing
    const filename = `crop-analysis/${userId}-${Date.now()}.${imageFile.name.split('.').pop()}`;
    const imageBuffer = await imageFile.arrayBuffer();
    await c.env.STORAGE.put(filename, imageBuffer, {
      httpMetadata: {
        contentType: imageFile.type,
      },
    });

    // Use Cloudflare Vision AI for image analysis
    const visionResponse = await c.env.AI.run('@cf/microsoft/resnet-50', {
      image: Array.from(new Uint8Array(imageBuffer)),
    });

    // Combine vision results with crop health analysis
    const healthPrompt = `
Analyze the crop health based on this image analysis and additional information:

Crop Type: ${cropType || 'Unknown'}
Image Analysis: ${JSON.stringify(visionResponse, null, 2)}
Additional Information: ${additionalInfo || 'None provided'}

Please provide:
1. Overall health assessment (Healthy/Stressed/Diseased)
2. Specific issues identified (diseases, pests, nutrient deficiencies)
3. Confidence level of diagnosis
4. Recommended treatments or interventions
5. Prevention strategies
6. Follow-up monitoring suggestions

Format as structured JSON with clear health status and recommendations.
`;

    const aiResponse = await c.env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [
        {
          role: "system",
          content: "You are a plant pathologist and crop health expert. Analyze crop health issues and provide actionable treatment recommendations."
        },
        {
          role: "user",
          content: healthPrompt
        }
      ],
      max_tokens: 1024,
      temperature: 0.6,
    });

    const healthAnalysis = parseHealthAnalysis(aiResponse.response);

    // Store analysis
    const analysisId = await c.env.DB.prepare(`
      INSERT INTO crop_health_analyses (user_id, image_path, crop_type, analysis, recommendations, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      userId, 
      filename, 
      cropType || null, 
      JSON.stringify(healthAnalysis),
      JSON.stringify(healthAnalysis.recommendations || [])
    ).run();

    return c.json({
      success: true,
      analysis: healthAnalysis,
      analysisId: analysisId.meta.last_row_id,
      imageUrl: `https://storage.fata.plus/${filename}`,
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('AI crop health analysis error:', error);
    throw new HTTPException(500, { message: 'Failed to analyze crop health' });
  }
});

// Get weather-based farming advice
ai.get('/weather-advice/:location', async (c) => {
  try {
    const location = c.req.param('location');
    const { cropTypes, timeframe = '7days' } = c.req.query();

    // Get comprehensive weather data
    const weatherData = await getWeatherForecast(c.env, location, timeframe);

    const advicePrompt = `
Based on the following weather forecast for ${location}, provide farming advice:

Weather Forecast: ${JSON.stringify(weatherData, null, 2)}
Crop Types: ${cropTypes || 'General farming'}
Timeframe: ${timeframe}

Please provide:
1. Daily farming recommendations
2. Irrigation scheduling advice
3. Pest and disease risk alerts
4. Harvesting opportunities
5. Equipment and field work recommendations
6. Risk mitigation strategies

Format as daily recommendations with specific actions.
`;

    const aiResponse = await c.env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [
        {
          role: "system",
          content: "You are a meteorological farming advisor. Provide weather-based farming recommendations that help optimize agricultural operations."
        },
        {
          role: "user",
          content: advicePrompt
        }
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });

    const advice = parseWeatherAdvice(aiResponse.response);

    return c.json({
      success: true,
      location,
      timeframe,
      weather: weatherData,
      advice,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('AI weather advice error:', error);
    throw new HTTPException(500, { message: 'Failed to generate weather advice' });
  }
});

// Get AI chat assistance
ai.post('/chat', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');
    const { message, context = {}, conversationId } = await c.req.json();

    if (!message) {
      throw new HTTPException(400, { message: 'Message is required' });
    }

    // Get conversation history if continuing existing conversation
    let conversationHistory = [];
    if (conversationId) {
      const historyResult = await c.env.DB.prepare(`
        SELECT message, response, created_at 
        FROM ai_conversations 
        WHERE id = ? AND user_id = ?
        ORDER BY created_at DESC 
        LIMIT 5
      `).bind(conversationId, userId).all();
      
      conversationHistory = historyResult.results.reverse();
    }

    // Get user's farm context for better responses
    const userFarms = await c.env.DB.prepare(`
      SELECT name, location, farm_type, size_hectares 
      FROM farms 
      WHERE owner_id = ? AND active = 1
    `).bind(userId).all();

    // Build context-aware prompt
    const contextPrompt = `
User Context:
- User ID: ${userId}
- Farms: ${JSON.stringify(userFarms.results)}
- Additional Context: ${JSON.stringify(context)}

Conversation History:
${conversationHistory.map(h => `User: ${h.message}\nAssistant: ${h.response}`).join('\n\n')}

Current Question: ${message}

Please provide helpful, specific advice related to farming, agriculture, and the user's context.
`;

    const aiResponse = await c.env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [
        {
          role: "system",
          content: "You are FarmBot, an AI assistant specializing in agriculture and farming. Provide helpful, practical advice to farmers. Be conversational but informative."
        },
        {
          role: "user",
          content: contextPrompt
        }
      ],
      max_tokens: 512,
      temperature: 0.8,
    });

    const response = aiResponse.response;

    // Store conversation
    const newConversationId = conversationId || crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO ai_conversations (id, user_id, message, response, context, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(newConversationId, userId, message, response, JSON.stringify(context)).run();

    return c.json({
      success: true,
      response,
      conversationId: newConversationId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('AI chat error:', error);
    throw new HTTPException(500, { message: 'Failed to process chat message' });
  }
});

// Helper functions
async function getWeatherData(env, location) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${env.OPENWEATHER_API_KEY}&units=metric`
    );
    
    if (response.ok) {
      return await response.json();
    }
    return { error: 'Weather data unavailable' };
  } catch (error) {
    return { error: 'Weather service unavailable' };
  }
}

async function getWeatherForecast(env, location, timeframe) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${env.OPENWEATHER_API_KEY}&units=metric`
    );
    
    if (response.ok) {
      return await response.json();
    }
    return { error: 'Weather forecast unavailable' };
  } catch (error) {
    return { error: 'Weather service unavailable' };
  }
}

async function getSoilData(env, farmId) {
  try {
    const soilResult = await env.DB.prepare(`
      SELECT soil_type, ph_level, nitrogen_level, phosphorus_level, potassium_level,
             organic_matter, last_tested
      FROM soil_tests 
      WHERE farm_id = ? 
      ORDER BY last_tested DESC 
      LIMIT 1
    `).bind(farmId).first();
    
    return soilResult || { message: 'No soil data available' };
  } catch (error) {
    return { error: 'Soil data unavailable' };
  }
}

function buildAIPrompt(data, includeRecommendations) {
  return `
Analyze this farm data and provide comprehensive insights:

Farm Information:
${JSON.stringify(data.farm, null, 2)}

Crops:
${JSON.stringify(data.crops, null, 2)}

Equipment:
${JSON.stringify(data.equipment, null, 2)}

Weather:
${JSON.stringify(data.weather, null, 2)}

Soil Data:
${JSON.stringify(data.soil, null, 2)}

Analysis Type: ${data.analysis_type}
Include Recommendations: ${includeRecommendations}

Please provide detailed insights covering:
1. Current farm status assessment
2. Crop health and growth analysis
3. Equipment maintenance needs
4. Weather impact analysis
5. Soil condition evaluation
${includeRecommendations ? '6. Specific recommendations for improvement' : ''}

Format the response as structured insights with clear categories.
`;
}

function parseAIInsights(aiResponse) {
  try {
    // Simple parsing - in production, this would be more sophisticated
    return {
      summary: extractSection(aiResponse, 'summary') || 'AI analysis completed',
      farmStatus: extractSection(aiResponse, 'farm status') || 'Status assessment unavailable',
      cropHealth: extractSection(aiResponse, 'crop') || 'Crop analysis unavailable',
      equipment: extractSection(aiResponse, 'equipment') || 'Equipment analysis unavailable',
      weather: extractSection(aiResponse, 'weather') || 'Weather impact analysis unavailable',
      soil: extractSection(aiResponse, 'soil') || 'Soil analysis unavailable',
      recommendations: extractRecommendations(aiResponse),
      confidence: 0.85, // Placeholder confidence score
    };
  } catch (error) {
    return {
      summary: 'Analysis completed with AI assistance',
      error: 'Failed to parse detailed insights',
      rawResponse: aiResponse,
    };
  }
}

function parseCropRecommendations(aiResponse) {
  try {
    return {
      topCrops: extractList(aiResponse, 'recommended crops', 5),
      timeline: extractSection(aiResponse, 'timeline') || 'Seasonal planting recommended',
      yield: extractSection(aiResponse, 'yield') || 'Yield estimates unavailable',
      risks: extractList(aiResponse, 'risk', 3),
      rotation: extractSection(aiResponse, 'rotation') || 'Crop rotation suggestions unavailable',
    };
  } catch (error) {
    return {
      error: 'Failed to parse crop recommendations',
      rawResponse: aiResponse,
    };
  }
}

function parseHealthAnalysis(aiResponse) {
  try {
    return {
      overallHealth: extractSection(aiResponse, 'health') || 'Assessment unavailable',
      issues: extractList(aiResponse, 'issues', 3),
      confidence: 0.80,
      recommendations: extractList(aiResponse, 'recommend', 3),
      prevention: extractSection(aiResponse, 'prevention') || 'Prevention strategies unavailable',
    };
  } catch (error) {
    return {
      error: 'Failed to parse health analysis',
      rawResponse: aiResponse,
    };
  }
}

function parseWeatherAdvice(aiResponse) {
  try {
    return {
      daily: extractSection(aiResponse, 'daily') || 'Daily recommendations unavailable',
      irrigation: extractSection(aiResponse, 'irrigation') || 'Irrigation advice unavailable',
      risks: extractList(aiResponse, 'risk', 3),
      opportunities: extractList(aiResponse, 'opportun', 3),
    };
  } catch (error) {
    return {
      error: 'Failed to parse weather advice',
      rawResponse: aiResponse,
    };
  }
}

// Utility functions for parsing AI responses
function extractSection(text, keyword) {
  const regex = new RegExp(`${keyword}[^\\n]*:?[^\\n]*\\n([^\\n]+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

function extractList(text, keyword, maxItems = 5) {
  const lines = text.split('\n');
  const items = [];
  let inSection = false;
  
  for (const line of lines) {
    if (line.toLowerCase().includes(keyword.toLowerCase())) {
      inSection = true;
      continue;
    }
    
    if (inSection && line.trim()) {
      if (line.match(/^\d+\./) || line.match(/^-/) || line.match(/^\*/)) {
        items.push(line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim());
        if (items.length >= maxItems) break;
      } else if (items.length > 0) {
        break; // End of list
      }
    }
  }
  
  return items;
}

function extractRecommendations(text) {
  return extractList(text, 'recommend', 5);
}

async function storeAnalysis(db, data) {
  const result = await db.prepare(`
    INSERT INTO ai_analyses (farm_id, user_id, analysis_type, insights, raw_data, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    data.farmId,
    data.userId,
    data.dataType,
    JSON.stringify(data.insights),
    JSON.stringify(data.rawData)
  ).run();
  
  return result.meta.last_row_id;
}

async function checkOrganizationMembership(db, userId, organizationId) {
  const membership = await db.prepare(
    'SELECT id FROM organization_members WHERE user_id = ? AND organization_id = ? AND active = 1'
  ).bind(userId, organizationId).first();
  return !!membership;
}

async function logUserActivity(db, userId, activityType, title, description, metadata = {}) {
  try {
    await db.prepare(`
      INSERT INTO user_activities (user_id, activity_type, title, description, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(userId, activityType, title, description, JSON.stringify(metadata)).run();
  } catch (error) {
    console.error('Failed to log user activity:', error);
  }
}

export { ai as aiRoutes };