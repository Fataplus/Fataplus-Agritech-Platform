// Exemple d'utilisation AutoRAG pour l'agriculture avec Cloudflare AI
export default {
  async fetch(request, env) {
    const { AI, VECTORIZE_INDEX } = env;
    
    // Données agricoles de base à indexer
    const agriculturalData = [
      {
        id: "crop_rotation_1",
        content: "La rotation des cultures améliore la fertilité du sol et réduit les maladies. Alternez légumineuses, céréales et cultures sarclées.",
        metadata: { category: "agronomie", source: "best_practices", timestamp: Date.now() }
      },
      {
        id: "weather_impact_1", 
        content: "Les précipitations insuffisantes pendant la floraison réduisent le rendement de 20-30% chez les céréales.",
        metadata: { category: "météo", source: "research", timestamp: Date.now() }
      },
      {
        id: "livestock_nutrition_1",
        content: "Les bovins ont besoin de 2-3% de leur poids corporel en matière sèche quotidiennement pour maintenir leur production.",
        metadata: { category: "élevage", source: "nutrition", timestamp: Date.now() }
      }
    ];
    
    // Fonction pour créer des embeddings
    async function createEmbeddings(texts) {
      const embeddings = [];
      for (const text of texts) {
        const response = await AI.run("@cf/baai/bge-base-en-v1.5", {
          text: text.content
        });
        embeddings.push({
          id: text.id,
          values: response.data[0],
          metadata: text.metadata
        });
      }
      return embeddings;
    }
    
    // Fonction RAG
    async function performRAG(query) {
      try {
        // 1. Créer embedding pour la requête
        const queryEmbedding = await AI.run("@cf/baai/bge-base-en-v1.5", {
          text: query
        });
        
        // 2. Recherche dans l'index vectoriel
        const searchResults = await VECTORIZE_INDEX.query(queryEmbedding.data[0], {
          topK: 3,
          returnMetadata: true
        });
        
        // 3. Construire le contexte
        const context = searchResults.matches
          .map(match => match.metadata?.content || "")
          .join("\n\n");
        
        // 4. Générer la réponse avec le contexte
        const response = await AI.run("@cf/meta/llama-3.1-8b-instruct", {
          messages: [
            {
              role: "system",
              content: "Vous êtes un expert agricole. Utilisez le contexte fourni pour répondre aux questions sur l'agriculture."
            },
            {
              role: "user", 
              content: `Contexte: ${context}\n\nQuestion: ${query}`
            }
          ]
        });
        
        return {
          answer: response.response,
          sources: searchResults.matches.map(m => m.metadata),
          context_used: context.length > 0
        };
        
      } catch (error) {
        return {
          error: "Erreur lors du traitement RAG: " + error.message,
          answer: "Désolé, je ne peux pas répondre à cette question pour le moment."
        };
      }
    }
    
    // Routes API
    const url = new URL(request.url);
    
    if (url.pathname === "/rag/index" && request.method === "POST") {
      // Indexer les données agricoles
      try {
        const embeddings = await createEmbeddings(agriculturalData);
        await VECTORIZE_INDEX.upsert(embeddings);
        
        return Response.json({
          success: true,
          message: "Données agricoles indexées avec succès",
          indexed_count: embeddings.length
        });
      } catch (error) {
        return Response.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }
    }
    
    if (url.pathname === "/rag/query" && request.method === "POST") {
      // Effectuer une requête RAG
      try {
        const { query } = await request.json();
        const result = await performRAG(query);
        
        return Response.json({
          success: true,
          ...result
        });
      } catch (error) {
        return Response.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }
    }
    
    // Page de démonstration
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>AutoRAG Agricole - Démonstration</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .container { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 10px 0; }
          button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
          button:hover { background: #0056b3; }
          textarea { width: 100%; height: 100px; margin: 10px 0; padding: 10px; }
          .result { background: #e8f4f8; padding: 15px; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>🤖 AutoRAG Agricole - Cloudflare AI</h1>
        
        <div class="container">
          <h3>1. Indexer les données agricoles</h3>
          <button onclick="indexData()">Indexer les données</button>
          <div id="indexResult"></div>
        </div>
        
        <div class="container">
          <h3>2. Poser une question agricole</h3>
          <textarea id="queryInput" placeholder="Ex: Comment améliorer le rendement des céréales ?"></textarea>
          <button onclick="queryRAG()">Rechercher</button>
          <div id="queryResult"></div>
        </div>
        
        <script>
          async function indexData() {
            const result = await fetch('/rag/index', { method: 'POST' });
            const data = await result.json();
            document.getElementById('indexResult').innerHTML = 
              '<div class="result">' + JSON.stringify(data, null, 2) + '</div>';
          }
          
          async function queryRAG() {
            const query = document.getElementById('queryInput').value;
            if (!query) return alert('Veuillez saisir une question');
            
            const result = await fetch('/rag/query', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query })
            });
            const data = await result.json();
            document.getElementById('queryResult').innerHTML = 
              '<div class="result"><strong>Réponse:</strong><br>' + 
              (data.answer || data.error) + '</div>';
          }
        </script>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
};
