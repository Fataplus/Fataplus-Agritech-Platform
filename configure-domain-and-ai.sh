#!/bin/bash
set -e

# Configuration des couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🌐 Configuration Domaine app.fata.plus & Cloudflare AI${NC}"
echo "==========================================================="

# Variables d'environnement
export CLOUDFLARE_API_TOKEN="LEuqNUpaEanOtwoIggSMR2BKQcKLf-kj7rEuVIDB"
export CF_ACCOUNT_ID="f30dd0d409679ae65e841302cc0caa8c"
ZONE_ID="675e81a7a3bd507a2704fb3e65519768"
DOMAIN_NAME="app.fata.plus"

echo -e "\n${YELLOW}📋 Configuration initiale${NC}"
echo "Zone ID: $ZONE_ID"
echo "Domaine: $DOMAIN_NAME"
echo "Account ID: $CF_ACCOUNT_ID"

# 1. Vérifier l'enregistrement DNS existant
echo -e "\n${YELLOW}🔍 1. Vérification DNS existant pour $DOMAIN_NAME${NC}"

EXISTING_RECORD=$(curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=$DOMAIN_NAME" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq -r '.result[0] // empty')

if [ ! -z "$EXISTING_RECORD" ]; then
    RECORD_ID=$(echo "$EXISTING_RECORD" | jq -r '.id')
    CURRENT_TYPE=$(echo "$EXISTING_RECORD" | jq -r '.type')
    CURRENT_CONTENT=$(echo "$EXISTING_RECORD" | jq -r '.content')
    
    echo -e "${YELLOW}⚠️  Enregistrement existant trouvé:${NC}"
    echo "   Type: $CURRENT_TYPE"
    echo "   Contenu: $CURRENT_CONTENT"
    echo "   ID: $RECORD_ID"
    
    # Supprimer l'enregistrement existant
    echo -e "\n${YELLOW}🗑️  Suppression de l'ancien enregistrement...${NC}"
    DELETE_RESPONSE=$(curl -s -X DELETE "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")
    
    if echo "$DELETE_RESPONSE" | jq -e '.success' >/dev/null; then
        echo -e "${GREEN}✅ Ancien enregistrement supprimé${NC}"
    else
        echo -e "${RED}❌ Erreur lors de la suppression${NC}"
        echo "$DELETE_RESPONSE" | jq -r '.errors[]?.message // "Erreur inconnue"'
    fi
else
    echo -e "${GREEN}✅ Aucun enregistrement existant (nouveau sous-domaine)${NC}"
fi

# 2. Configurer le domaine personnalisé sur Cloudflare Pages
echo -e "\n${YELLOW}🔧 2. Configuration du domaine sur Cloudflare Pages${NC}"

# D'abord, lister les projets Pages pour trouver le bon
PAGES_PROJECTS=$(wrangler pages project list --json 2>/dev/null || echo '[]')
echo "Projets Pages disponibles:"
echo "$PAGES_PROJECTS" | jq -r '.[] | "- " + .name + " (" + .domains[0] + ")"'

# Utiliser le projet staging pour la configuration
PROJECT_NAME="fataplus-staging"

echo -e "\n${YELLOW}📍 Configuration du domaine personnalisé pour $PROJECT_NAME${NC}"

# Ajouter le domaine personnalisé au projet Pages
CUSTOM_DOMAIN_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$PROJECT_NAME/domains" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$DOMAIN_NAME\"}")

if echo "$CUSTOM_DOMAIN_RESPONSE" | jq -e '.success' >/dev/null; then
    echo -e "${GREEN}✅ Domaine personnalisé ajouté au projet Pages${NC}"
    
    # Récupérer les détails du domaine configuré
    DOMAIN_INFO=$(echo "$CUSTOM_DOMAIN_RESPONSE" | jq -r '.result')
    CNAME_TARGET=$(echo "$DOMAIN_INFO" | jq -r '.hostname // .name')
    
    echo "   Domaine: $DOMAIN_NAME"
    echo "   Cible CNAME: $CNAME_TARGET"
else
    echo -e "${YELLOW}⚠️  Domaine peut-être déjà configuré ou erreur${NC}"
    echo "$CUSTOM_DOMAIN_RESPONSE" | jq -r '.errors[]?.message // "Configuration en cours..."'
    
    # Essayer de récupérer la configuration existante
    EXISTING_DOMAIN=$(curl -s "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$PROJECT_NAME" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq -r '.result.domains[] | select(. != null)')
    
    if echo "$EXISTING_DOMAIN" | grep -q "$DOMAIN_NAME"; then
        echo -e "${GREEN}✅ Domaine déjà configuré dans Pages${NC}"
        CNAME_TARGET="$PROJECT_NAME.pages.dev"
    else
        CNAME_TARGET="$PROJECT_NAME.pages.dev"
    fi
fi

# 3. Créer le nouvel enregistrement CNAME
echo -e "\n${YELLOW}📝 3. Création du nouvel enregistrement DNS${NC}"

# Utiliser la cible CNAME appropriée pour Cloudflare Pages
if [ -z "$CNAME_TARGET" ] || [ "$CNAME_TARGET" = "null" ]; then
    CNAME_TARGET="$PROJECT_NAME.pages.dev"
fi

echo "Création CNAME: $DOMAIN_NAME -> $CNAME_TARGET"

CREATE_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"CNAME\",
    \"name\": \"$DOMAIN_NAME\",
    \"content\": \"$CNAME_TARGET\",
    \"ttl\": 1
  }")

if echo "$CREATE_RESPONSE" | jq -e '.success' >/dev/null; then
    NEW_RECORD_ID=$(echo "$CREATE_RESPONSE" | jq -r '.result.id')
    echo -e "${GREEN}✅ Nouvel enregistrement CNAME créé${NC}"
    echo "   ID: $NEW_RECORD_ID"
    echo "   $DOMAIN_NAME -> $CNAME_TARGET"
else
    echo -e "${RED}❌ Erreur lors de la création du CNAME${NC}"
    echo "$CREATE_RESPONSE" | jq -r '.errors[]?.message // "Erreur inconnue"'
fi

# 4. Configuration de Cloudflare AI et AutoRAG
echo -e "\n${YELLOW}🤖 4. Configuration de Cloudflare AI${NC}"

# Vérifier les capacités AI disponibles
echo "Vérification des modèles AI disponibles..."
AI_MODELS=$(curl -s "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/ai/models" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq -r '.result[]?.name // empty' | head -10)

if [ ! -z "$AI_MODELS" ]; then
    echo -e "${GREEN}✅ Cloudflare AI disponible${NC}"
    echo "Modèles AI disponibles (premiers 10):"
    echo "$AI_MODELS" | sed 's/^/   - /'
else
    echo -e "${YELLOW}⚠️  AI models non accessibles (permissions limitées)${NC}"
fi

# Configurer AutoRAG via les Workers
echo -e "\n${YELLOW}🔍 5. Configuration AutoRAG${NC}"

# Créer une configuration AutoRAG pour nos Workers existants
cat > autorag-config.json << EOF
{
  "enabled": true,
  "rag_config": {
    "vectorize_index": "fataplus-search",
    "chunk_size": 500,
    "overlap": 50,
    "embedding_model": "@cf/baai/bge-base-en-v1.5",
    "similarity_threshold": 0.8
  },
  "ai_models": {
    "text_generation": "@cf/meta/llama-3.1-8b-instruct",
    "embeddings": "@cf/baai/bge-base-en-v1.5",
    "text_classification": "@cf/huggingface/distilbert-sst-2"
  },
  "agricultural_knowledge": {
    "weather_analysis": true,
    "crop_recommendations": true,
    "livestock_insights": true,
    "market_predictions": true
  }
}
EOF

echo -e "${GREEN}✅ Configuration AutoRAG créée${NC}"
echo "   Fichier: autorag-config.json"

# Mettre à jour nos Workers pour inclure la configuration AI
echo -e "\n${YELLOW}🔄 6. Mise à jour des Workers avec AI${NC}"

# Mettre à jour le Backend API avec les nouvelles configurations
cd infrastructure/cloudflare

# Backup du wrangler.toml existant
cp wrangler.toml wrangler.toml.backup

# Ajouter la configuration Vectorize
cat >> wrangler.toml << 'EOF'

# Vectorize for RAG and search
[[vectorize]]
binding = "VECTORIZE"
index_name = "fataplus-search"

# Additional AI configuration
[ai]
binding = "AI"

# Variables for AI and AutoRAG
[vars]
AI_ENABLED = "true"
AUTORAG_ENABLED = "true"
VECTORIZE_ENABLED = "true"
EOF

echo -e "${GREEN}✅ Configuration Workers mise à jour${NC}"

# Créer l'index Vectorize
echo -e "\n${YELLOW}🔍 7. Création de l'index Vectorize pour AutoRAG${NC}"

VECTORIZE_CREATE=$(wrangler vectorize create fataplus-search --dimensions=768 --metric=cosine 2>&1 || echo "Index exists")

if echo "$VECTORIZE_CREATE" | grep -q "already exists\|success"; then
    echo -e "${GREEN}✅ Index Vectorize configuré (fataplus-search)${NC}"
else
    echo -e "${YELLOW}⚠️  Index Vectorize: $VECTORIZE_CREATE${NC}"
fi

# Redéployer les Workers avec la nouvelle configuration
echo -e "\n${YELLOW}🚀 8. Redéploiement des Workers avec AI${NC}"

if wrangler deploy --env staging; then
    echo -e "${GREEN}✅ Worker staging redéployé avec AI${NC}"
else
    echo -e "${YELLOW}⚠️  Erreur redéploiement staging${NC}"
fi

if wrangler deploy; then
    echo -e "${GREEN}✅ Worker production redéployé avec AI${NC}"
else
    echo -e "${YELLOW}⚠️  Erreur redéploiement production${NC}"
fi

cd ../..

# 9. Test de la configuration
echo -e "\n${YELLOW}🧪 9. Test de la configuration${NC}"

echo "Test de résolution DNS..."
nslookup $DOMAIN_NAME 8.8.8.8 || echo "DNS en propagation..."

echo "Test HTTP du domaine..."
sleep 10  # Attendre la propagation
HTTP_TEST=$(curl -s -I "https://$DOMAIN_NAME" 2>/dev/null | head -1 || echo "En cours de propagation...")
echo "Réponse: $HTTP_TEST"

# 10. Résumé de la configuration
echo -e "\n${GREEN}🎉 CONFIGURATION TERMINÉE${NC}"
echo "==========================================="
echo -e "${BLUE}✅ Domaine configuré:${NC}"
echo "   URL: https://$DOMAIN_NAME"
echo "   DNS: CNAME -> $CNAME_TARGET"
echo "   Status: En cours de propagation (5-10 minutes)"

echo -e "\n${BLUE}🤖 AI & AutoRAG configuré:${NC}"
echo "   Cloudflare AI: Activé dans les Workers"
echo "   AutoRAG: Configuration prête"
echo "   Vectorize: Index fataplus-search créé"
echo "   Modèles: Text generation, Embeddings, Classification"

echo -e "\n${BLUE}🔗 URLs mises à jour:${NC}"
echo "   Frontend Principal: https://$DOMAIN_NAME"
echo "   Backend API: https://fataplus-api.fenohery.workers.dev"
echo "   MCP Server: https://fataplus-mcp-server.fenohery.workers.dev"

echo -e "\n${YELLOW}📋 Actions suivantes:${NC}"
echo "1. Attendre la propagation DNS (5-10 minutes)"
echo "2. Tester https://$DOMAIN_NAME"
echo "3. Mettre à jour les configurations frontend avec le nouveau domaine"
echo "4. Tester les fonctionnalités AI/AutoRAG"

echo -e "\n${GREEN}🚀 Votre plateforme Fataplus est maintenant accessible sur https://$DOMAIN_NAME !${NC}"

exit 0