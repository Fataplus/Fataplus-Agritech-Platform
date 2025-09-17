/**
 * Fataplus AgriTech Platform - Cloudflare Worker
 * Main API endpoint for the Fataplus application
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handling
      switch (url.pathname) {
        case '/':
          return handleRoot(env);
        
        case '/health':
          return handleHealth(env);
        
        case '/api/weather':
          return handleWeather(request, env);
        
        case '/api/crops':
          return handleCrops(request, env);
        
        case '/api/livestock':
          return handleLivestock(request, env);
        
        case '/api/market':
          return handleMarket(request, env);
        
        case '/api/knowledge/add':
          return handleKnowledgeAdd(request, env);
        
        case '/api/knowledge/search':
          return handleKnowledgeSearch(request, env);
        
        case '/api/todos':
          return handleTodos(request, env);
        
        case '/api/todos/add':
          return handleTodoAdd(request, env);
        
        case '/api/todos/update':
          return handleTodoUpdate(request, env);
        
        default:
          return new Response('Not Found', { 
            status: 404,
            headers: corsHeaders 
          });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: corsHeaders 
      });
    }
  },
};

// Handler functions
async function handleRoot(env) {
  const response = {
    service: 'Fataplus AgriTech API',
    version: '1.0.0',
    environment: env.ENVIRONMENT || 'development',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/health - Health check',
      '/api/weather - Weather predictions',
      '/api/crops - Crop management',
      '/api/livestock - Livestock management', 
      '/api/market - Market analysis',
      '/api/knowledge/add - Add knowledge to AutoRAG',
      '/api/knowledge/search - Search knowledge base',
      '/api/todos - Get all tasks',
      '/api/todos/add - Add new task',
      '/api/todos/update - Update task status'
    ]
  };

  return new Response(JSON.stringify(response, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleHealth(env) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(env),
      cache: await checkCache(env),
      ai: await checkAI(env)
    }
  };

  return new Response(JSON.stringify(health), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleWeather(request, env) {
  // Placeholder pour l'API météo
  const weather = {
    location: 'Madagascar',
    current: {
      temperature: 25,
      humidity: 70,
      condition: 'Partly Cloudy'
    },
    forecast: [
      { day: 'Today', temp: 25, condition: 'Sunny' },
      { day: 'Tomorrow', temp: 27, condition: 'Rain' }
    ],
    recommendations: [
      'Good conditions for planting rice',
      'Consider irrigation due to upcoming rain'
    ]
  };

  return new Response(JSON.stringify(weather), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleCrops(request, env) {
  // Placeholder pour la gestion des cultures
  const crops = {
    crops: [
      {
        id: 1,
        name: 'Rice',
        status: 'Growing',
        stage: 'Flowering',
        health: 'Good',
        estimated_harvest: '2024-03-15'
      },
      {
        id: 2,
        name: 'Cassava',
        status: 'Mature',
        stage: 'Ready',
        health: 'Excellent',
        estimated_harvest: '2024-01-20'
      }
    ],
    recommendations: [
      'Monitor rice for pests during flowering',
      'Cassava ready for harvest - optimal conditions'
    ]
  };

  return new Response(JSON.stringify(crops), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleLivestock(request, env) {
  // Placeholder pour la gestion du bétail
  const livestock = {
    animals: [
      {
        id: 1,
        type: 'Zebu Cattle',
        count: 15,
        health: 'Good',
        vaccination_status: 'Up to date'
      },
      {
        id: 2,
        type: 'Chickens',
        count: 50,
        health: 'Excellent',
        egg_production: '40 eggs/day'
      }
    ],
    alerts: [
      'Vaccination due for cattle in 2 weeks'
    ]
  };

  return new Response(JSON.stringify(livestock), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleMarket(request, env) {
  // Placeholder pour l'analyse de marché
  const market = {
    prices: [
      {
        commodity: 'Rice',
        price: 1200,
        currency: 'MGA',
        unit: 'kg',
        trend: 'up',
        change: '+5%'
      },
      {
        commodity: 'Cassava',
        price: 800,
        currency: 'MGA', 
        unit: 'kg',
        trend: 'stable',
        change: '0%'
      }
    ],
    recommendations: [
      'Good time to sell rice - prices trending up',
      'Hold cassava - stable market conditions'
    ]
  };

  return new Response(JSON.stringify(market), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// Service health checks
async function checkDatabase(env) {
  try {
    if (env.DB) {
      // Test query to D1 database
      await env.DB.prepare('SELECT 1').first();
      return { status: 'healthy', service: 'D1' };
    }
    return { status: 'not_configured', service: 'D1' };
  } catch (error) {
    return { status: 'error', service: 'D1', error: error.message };
  }
}

async function checkCache(env) {
  try {
    if (env.CACHE) {
      // Test KV store
      await env.CACHE.get('health_check');
      return { status: 'healthy', service: 'KV' };
    }
    return { status: 'not_configured', service: 'KV' };
  } catch (error) {
    return { status: 'error', service: 'KV', error: error.message };
  }
}

async function checkAI(env) {
  try {
    if (env.AI) {
      return { status: 'healthy', service: 'Workers AI' };
    }
    return { status: 'not_configured', service: 'Workers AI' };
  } catch (error) {
    return { status: 'error', service: 'Workers AI', error: error.message };
  }
}

// Knowledge base functions for AutoRAG
async function handleKnowledgeAdd(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const knowledge = await request.json();
    
    if (!knowledge.id || !knowledge.content) {
      return new Response(JSON.stringify({ error: 'Missing required fields: id, content' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Generate embedding using Cloudflare AI
    const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: knowledge.content
    });

    if (!embedding || !embedding.data) {
      throw new Error('Failed to generate embedding');
    }

    // Ensure embedding data is properly formatted as array of numbers
    const embeddingVector = Array.isArray(embedding.data[0]) ? embedding.data[0] : embedding.data;

    // Add to Vectorize index
    await env.VECTORIZE.upsert([{
      id: knowledge.id,
      values: embeddingVector,
      metadata: {
        title: knowledge.title || '',
        content: knowledge.content,
        category: knowledge.category || '',
        tags: JSON.stringify(knowledge.tags || []),
        timestamp: new Date().toISOString()
      }
    }]);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Knowledge added to AutoRAG',
      id: knowledge.id
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Knowledge add error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to add knowledge', 
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

async function handleKnowledgeSearch(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const { query, limit = 5 } = await request.json();
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'Missing query parameter' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Generate embedding for the query
    const queryEmbedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: query
    });

    if (!queryEmbedding || !queryEmbedding.data) {
      throw new Error('Failed to generate query embedding');
    }

    // Ensure query embedding is properly formatted
    const queryVector = Array.isArray(queryEmbedding.data[0]) ? queryEmbedding.data[0] : queryEmbedding.data;

    // Search in Vectorize index
    const results = await env.VECTORIZE.query(queryVector, {
      topK: limit,
      returnMetadata: true
    });

    // Format results
    const formattedResults = results.matches.map(match => ({
      id: match.id,
      score: match.score,
      title: match.metadata.title,
      content: match.metadata.content,
      category: match.metadata.category,
      tags: JSON.parse(match.metadata.tags || '[]')
    }));

    return new Response(JSON.stringify({
      query,
      results: formattedResults,
      count: formattedResults.length
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Knowledge search error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to search knowledge base', 
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Todo management functions
async function handleTodos(request, env) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    // Get todos from KV store
    const todosData = await env.APP_DATA.get('project_todos');
    const todos = todosData ? JSON.parse(todosData) : getDefaultTodos();

    return new Response(JSON.stringify({
      todos: todos,
      total: todos.length,
      completed: todos.filter(t => t.status === 'completed').length,
      in_progress: todos.filter(t => t.status === 'in_progress').length,
      pending: todos.filter(t => t.status === 'pending').length
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Todos fetch error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch todos', 
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

async function handleTodoAdd(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const newTodo = await request.json();
    
    if (!newTodo.content || !newTodo.priority) {
      return new Response(JSON.stringify({ error: 'Missing required fields: content, priority' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get existing todos
    const todosData = await env.APP_DATA.get('project_todos');
    const todos = todosData ? JSON.parse(todosData) : getDefaultTodos();

    // Add new todo
    const todo = {
      id: newTodo.id || Date.now().toString(),
      content: newTodo.content,
      priority: newTodo.priority,
      status: newTodo.status || 'pending',
      created: new Date().toISOString(),
      category: newTodo.category || 'general'
    };

    todos.push(todo);

    // Save back to KV
    await env.APP_DATA.put('project_todos', JSON.stringify(todos));

    return new Response(JSON.stringify({ 
      success: true, 
      todo: todo,
      message: 'Todo added successfully'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Todo add error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to add todo', 
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

async function handleTodoUpdate(request, env) {
  if (request.method !== 'PUT') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const updateData = await request.json();
    
    if (!updateData.id) {
      return new Response(JSON.stringify({ error: 'Missing todo ID' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get existing todos
    const todosData = await env.APP_DATA.get('project_todos');
    const todos = todosData ? JSON.parse(todosData) : getDefaultTodos();

    // Find and update todo
    const todoIndex = todos.findIndex(t => t.id === updateData.id);
    if (todoIndex === -1) {
      return new Response(JSON.stringify({ error: 'Todo not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Update fields
    if (updateData.status) todos[todoIndex].status = updateData.status;
    if (updateData.content) todos[todoIndex].content = updateData.content;
    if (updateData.priority) todos[todoIndex].priority = updateData.priority;
    if (updateData.category) todos[todoIndex].category = updateData.category;
    todos[todoIndex].updated = new Date().toISOString();

    // Save back to KV
    await env.APP_DATA.put('project_todos', JSON.stringify(todos));

    return new Response(JSON.stringify({ 
      success: true, 
      todo: todos[todoIndex],
      message: 'Todo updated successfully'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Todo update error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update todo', 
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Default todos with project tasks
function getDefaultTodos() {
  return [
    // Infrastructure & Deployment
    {
      id: "infra-1",
      content: "Configurer le domaine app.fata.plus dans Cloudflare",
      status: "completed",
      priority: "high",
      category: "infrastructure",
      created: "2025-09-17T03:00:00Z",
      completed: "2025-09-17T03:39:00Z"
    },
    {
      id: "infra-2", 
      content: "Déployer l'API Worker avec configuration AI et Vectorize",
      status: "completed",
      priority: "high",
      category: "infrastructure",
      created: "2025-09-17T03:00:00Z",
      completed: "2025-09-17T03:45:00Z"
    },
    {
      id: "infra-3",
      content: "Déployer le serveur MCP avec configuration AutoRAG",
      status: "completed",
      priority: "high", 
      category: "infrastructure",
      created: "2025-09-17T03:00:00Z",
      completed: "2025-09-17T03:46:00Z"
    },
    {
      id: "infra-4",
      content: "Tester l'accessibilité du domaine et la connectivité backend",
      status: "completed",
      priority: "medium",
      category: "infrastructure", 
      created: "2025-09-17T03:00:00Z",
      completed: "2025-09-17T03:47:00Z"
    },
    // AutoRAG & AI
    {
      id: "ai-1",
      content: "Configurer Cloudflare AI avec Workers AI",
      status: "completed",
      priority: "high",
      category: "ai",
      created: "2025-09-17T03:00:00Z",
      completed: "2025-09-17T03:40:00Z"
    },
    {
      id: "ai-2",
      content: "Créer et configurer l'index Vectorize pour AutoRAG",
      status: "completed", 
      priority: "high",
      category: "ai",
      created: "2025-09-17T03:00:00Z",
      completed: "2025-09-17T03:42:00Z"
    },
    {
      id: "ai-3",
      content: "Peupler la base de connaissances agricoles",
      status: "completed",
      priority: "medium",
      category: "ai", 
      created: "2025-09-17T03:00:00Z",
      completed: "2025-09-17T03:48:00Z"
    },
    {
      id: "ai-4",
      content: "Tester la recherche sémantique AutoRAG",
      status: "completed",
      priority: "medium",
      category: "ai",
      created: "2025-09-17T03:00:00Z", 
      completed: "2025-09-17T03:49:00Z"
    },
    // Frontend Development
    {
      id: "frontend-1",
      content: "Créer la page de progrès dans le frontend",
      status: "in_progress",
      priority: "high",
      category: "frontend",
      created: "2025-09-17T03:50:00Z"
    },
    {
      id: "frontend-2",
      content: "Créer l'API pour gérer les tâches",
      status: "in_progress", 
      priority: "high",
      category: "api",
      created: "2025-09-17T03:50:00Z"
    },
    {
      id: "frontend-3",
      content: "Intégrer la liste complète des tâches du projet",
      status: "pending",
      priority: "medium",
      category: "frontend",
      created: "2025-09-17T03:50:00Z"
    },
    {
      id: "frontend-4", 
      content: "Ajouter des fonctionnalités interactives (filtres, recherche)",
      status: "pending",
      priority: "medium",
      category: "frontend",
      created: "2025-09-17T03:50:00Z"
    },
    // Future Enhancements
    {
      id: "future-1",
      content: "Étendre la base de connaissances agricoles",
      status: "pending",
      priority: "medium", 
      category: "enhancement",
      created: "2025-09-17T03:50:00Z"
    },
    {
      id: "future-2",
      content: "Intégrer l'authentification utilisateur",
      status: "pending",
      priority: "low",
      category: "enhancement",
      created: "2025-09-17T03:50:00Z"
    },
    {
      id: "future-3",
      content: "Ajouter l'analytics et le monitoring",
      status: "pending",
      priority: "low",
      category: "enhancement", 
      created: "2025-09-17T03:50:00Z"
    },
    {
      id: "future-4",
      content: "Optimiser les performances et la mise en cache",
      status: "pending",
      priority: "low",
      category: "enhancement",
      created: "2025-09-17T03:50:00Z"
    }
  ];
}
