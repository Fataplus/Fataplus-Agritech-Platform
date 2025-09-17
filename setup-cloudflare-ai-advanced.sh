#!/bin/bash
set -e

# Configuration des couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🤖 Configuration avancée Cloudflare AI & AutoRAG${NC}"
echo "=================================================="

# Variables
export CLOUDFLARE_API_TOKEN="LEuqNUpaEanOtwoIggSMR2BKQcKLf-kj7rEuVIDB"
export CF_ACCOUNT_ID="f30dd0d409679ae65e841302cc0caa8c"
VECTORIZE_INDEX_NAME="fataplus-autorag"

echo "Account ID: $CF_ACCOUNT_ID"

# 1. Créer l'index Vectorize pour AutoRAG
echo -e "\n${YELLOW}📊 1. Création de l'index Vectorize pour AutoRAG${NC}"

# Configuration de l'index Vectorize
VECTORIZE_CONFIG='{
  "name": "'$VECTORIZE_INDEX_NAME'",
  "config": {
    "dimensions": 768,
    "metric": "cosine",
    "metadata_config": {
      "indexed": ["source", "category", "timestamp"]
    }
  }
}'

# Créer l'index
VECTORIZE_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/vectorize/indexes" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$VECTORIZE_CONFIG")

if echo "$VECTORIZE_RESPONSE" | jq -e '.success' >/dev/null; then
    echo -e "${GREEN}✅ Index Vectorize créé: $VECTORIZE_INDEX_NAME${NC}"
    VECTORIZE_ID=$(echo "$VECTORIZE_RESPONSE" | jq -r '.result.id // "none"')
    echo "   ID: $VECTORIZE_ID"
else
    echo -e "${YELLOW}⚠️  Index existe peut-être déjà ou erreur: $(echo "$VECTORIZE_RESPONSE" | jq -r '.errors[0].message // "Vérification en cours"')${NC}"
    
    # Lister les index existants
    EXISTING_INDEXES=$(curl -s "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/vectorize/indexes" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq -r '.result[]? | select(.name=="'$VECTORIZE_INDEX_NAME'") | .id // empty')
    
    if [ -n "$EXISTING_INDEXES" ]; then
        VECTORIZE_ID="$EXISTING_INDEXES"
        echo -e "${GREEN}✅ Index existant trouvé: $VECTORIZE_ID${NC}"
    fi
fi

# 2. Tester les modèles AI disponibles
echo -e "\n${YELLOW}🧠 2. Test des modèles AI disponibles${NC}"

AI_MODELS=$(curl -s "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/ai/models" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")

if echo "$AI_MODELS" | jq -e '.success' >/dev/null; then
    echo -e "${GREEN}✅ Modèles AI accessibles${NC}"
    
    # Lister quelques modèles clés
    TEXT_MODELS=$(echo "$AI_MODELS" | jq -r '.result[] | select(.task.name=="Text Generation") | .name' | head -3)
    EMBEDDING_MODELS=$(echo "$AI_MODELS" | jq -r '.result[] | select(.task.name=="Text Embeddings") | .name' | head -3)
    
    echo "   Modèles de texte disponibles:"
    echo "$TEXT_MODELS" | while read model; do
        if [ -n "$model" ]; then
            echo "   - $model"
        fi
    done
    
    echo "   Modèles d'embeddings disponibles:"
    echo "$EMBEDDING_MODELS" | while read model; do
        if [ -n "$model" ]; then
            echo "   - $model"
        fi
    done
else
    echo -e "${YELLOW}⚠️  Modèles AI non accessibles directement. Utilisation des modèles configurés.${NC}"
fi

# 3. Configurer AutoRAG dans wrangler.toml
echo -e "\n${YELLOW}⚙️  3. Configuration AutoRAG dans wrangler.toml${NC}"

# Backup de la configuration existante
if [ -f "infrastructure/cloudflare/wrangler.toml" ]; then
    cp infrastructure/cloudflare/wrangler.toml infrastructure/cloudflare/wrangler.toml.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${BLUE}📋 Sauvegarde de wrangler.toml créée${NC}"
fi

# Vérifier si la configuration AI existe déjà
if ! grep -q "\[\[vectorize\]\]" infrastructure/cloudflare/wrangler.toml 2>/dev/null; then
    echo -e "\n${BLUE}# Configuration AutoRAG${NC}" >> infrastructure/cloudflare/wrangler.toml
    
    if [ -n "$VECTORIZE_ID" ]; then
        cat >> infrastructure/cloudflare/wrangler.toml << EOF

# AutoRAG Configuration
[[vectorize]]
binding = "VECTORIZE_INDEX"
index_name = "$VECTORIZE_INDEX_NAME"

# AI Configuration for RAG
[ai]
binding = "AI"

EOF
    fi
    echo -e "${GREEN}✅ Configuration AutoRAG ajoutée à wrangler.toml${NC}"
else
    echo -e "${YELLOW}⚠️  Configuration Vectorize déjà présente dans wrangler.toml${NC}"
fi

# 4. Créer un exemple d'utilisation AutoRAG
echo -e "\n${YELLOW}📝 4. Création d'exemple AutoRAG pour l'agriculture${NC}"

cat > agricultural-rag-example.js << 'EOF'
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
EOF

echo -e "${GREEN}✅ Exemple AutoRAG créé: agricultural-rag-example.js${NC}"

# 5. Configuration finale et résumé
echo -e "\n${YELLOW}📋 5. Configuration finale${NC}"

# Créer un fichier de configuration complète pour AutoRAG
cat > autorag-config.json << EOF
{
  "autorag": {
    "enabled": true,
    "vectorize_index": "$VECTORIZE_INDEX_NAME",
    "models": {
      "text_generation": "@cf/meta/llama-3.1-8b-instruct",
      "embeddings": "@cf/baai/bge-base-en-v1.5",
      "fallback_text": "@cf/microsoft/DialoGPT-medium"
    },
    "agricultural_categories": [
      "agronomie",
      "météo", 
      "élevage",
      "marché",
      "techniques",
      "sustainability"
    ],
    "search_config": {
      "topK": 5,
      "threshold": 0.7,
      "return_metadata": true
    }
  },
  "domain": "app.fata.plus",
  "deployment": {
    "worker_url": "https://fataplus-worker.fata-plus.workers.dev",
    "pages_url": "https://app.fata.plus",
    "mcp_url": "https://fataplus-mcp.fata-plus.workers.dev"
  }
}
EOF

echo -e "${GREEN}✅ Configuration AutoRAG complète créée: autorag-config.json${NC}"

echo -e "\n${GREEN}🎉 CONFIGURATION AI & AUTORAG TERMINÉE${NC}"
echo "==============================================="
echo -e "${BLUE}📊 Index Vectorize:${NC} $VECTORIZE_INDEX_NAME"
echo -e "${BLUE}🤖 Modèles configurés:${NC} Llama 3.1 8B + BGE Embeddings"
echo -e "${BLUE}🌐 Domaine principal:${NC} https://app.fata.plus"
echo -e "${BLUE}📝 Exemple AutoRAG:${NC} agricultural-rag-example.js"
echo ""
echo -e "${YELLOW}📋 Prochaines étapes:${NC}"
echo "1. Déployer le worker avec la nouvelle configuration"
echo "2. Tester l'exemple AutoRAG"
echo "3. Intégrer dans votre application frontend"
echo "4. Indexer vos données agricoles spécifiques"

exit 0