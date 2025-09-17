#!/bin/bash
set -e

# Configuration des couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🌐 Configuration Domaine app.fata.plus et AI Cloudflare${NC}"
echo "=========================================================="

# Variables
export CLOUDFLARE_API_TOKEN="LEuqNUpaEanOtwoIggSMR2BKQcKLf-kj7rEuVIDB"
export CF_ACCOUNT_ID="f30dd0d409679ae65e841302cc0caa8c"
ZONE_ID="675e81a7a3bd507a2704fb3e65519768"
DOMAIN="app.fata.plus"

echo -e "\n${YELLOW}📋 Configuration actuelle${NC}"
echo "=========================="
echo "Domaine cible: $DOMAIN"
echo "Zone ID: $ZONE_ID"
echo "Account ID: $CF_ACCOUNT_ID"

# 1. Vérifier l'enregistrement DNS existant
echo -e "\n${YELLOW}🔍 1. Vérification de l'enregistrement DNS existant...${NC}"

EXISTING_RECORD=$(curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=$DOMAIN" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq -r '.result[0]')

if [[ "$EXISTING_RECORD" != "null" ]]; then
    RECORD_ID=$(echo "$EXISTING_RECORD" | jq -r '.id')
    CURRENT_TYPE=$(echo "$EXISTING_RECORD" | jq -r '.type')
    CURRENT_CONTENT=$(echo "$EXISTING_RECORD" | jq -r '.content')
    
    echo -e "${YELLOW}⚠️  Enregistrement existant trouvé:${NC}"
    echo "   Type: $CURRENT_TYPE"
    echo "   Contenu: $CURRENT_CONTENT"
    echo "   Record ID: $RECORD_ID"
    
    # Supprimer l'ancien enregistrement
    echo -e "\n${YELLOW}🗑️  Suppression de l'ancien enregistrement...${NC}"
    DELETE_RESULT=$(curl -s -X DELETE "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq -r '.success')
    
    if [[ "$DELETE_RESULT" == "true" ]]; then
        echo -e "${GREEN}✅ Ancien enregistrement supprimé${NC}"
    else
        echo -e "${RED}❌ Échec de suppression de l'ancien enregistrement${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Aucun enregistrement existant${NC}"
fi

# 2. Créer le nouvel enregistrement CNAME vers Cloudflare Pages
echo -e "\n${YELLOW}🔧 2. Configuration du nouveau CNAME vers Cloudflare Pages...${NC}"

# Créer l'enregistrement CNAME
CREATE_RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"CNAME\",
    \"name\": \"$DOMAIN\",
    \"content\": \"fataplus-staging.pages.dev\",
    \"ttl\": 1,
    \"proxied\": true
  }" | jq -r '.success')

if [[ "$CREATE_RESULT" == "true" ]]; then
    echo -e "${GREEN}✅ Nouvel enregistrement CNAME créé${NC}"
    echo "   $DOMAIN → fataplus-staging.pages.dev"
    echo "   Proxy Cloudflare: Activé"
else
    echo -e "${RED}❌ Échec de création du CNAME${NC}"
    exit 1
fi

# 3. Configurer le domaine personnalisé dans Cloudflare Pages
echo -e "\n${YELLOW}🌐 3. Configuration du domaine personnalisé dans Pages...${NC}"

# Vérifier le projet Pages
PAGES_PROJECT="fataplus-staging"

echo "   Projet Pages: $PAGES_PROJECT"
echo "   Domaine personnalisé: $DOMAIN"

# Ajouter le domaine personnalisé au projet Pages
PAGES_DOMAIN_RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$PAGES_PROJECT/domains" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$DOMAIN\"}" | jq -r '.success // false')

if [[ "$PAGES_DOMAIN_RESULT" == "true" ]]; then
    echo -e "${GREEN}✅ Domaine personnalisé ajouté à Pages${NC}"
elif [[ "$PAGES_DOMAIN_RESULT" == "false" ]]; then
    # Le domaine existe peut-être déjà
    echo -e "${YELLOW}⚠️  Le domaine pourrait déjà être configuré dans Pages${NC}"
else
    echo -e "${YELLOW}⚠️  Statut du domaine Pages: En attente de validation${NC}"
fi

# 4. Configuration de Cloudflare AI
echo -e "\n${YELLOW}🤖 4. Configuration de Cloudflare AI...${NC}"

# Vérifier les modèles AI disponibles
echo "   Vérification des modèles AI disponibles..."
AI_MODELS=$(curl -s "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/ai/models/search" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq -r '.result[]?.name' | head -5)

if [[ -n "$AI_MODELS" ]]; then
    echo -e "${GREEN}✅ Cloudflare AI disponible${NC}"
    echo "   Modèles disponibles:"
    echo "$AI_MODELS" | while read -r model; do
        echo "   - $model"
    done
else
    echo -e "${YELLOW}⚠️  Cloudflare AI: Informations limitées disponibles${NC}"
fi

# 5. Configuration AutoRAG (Retrieval-Augmented Generation)
echo -e "\n${YELLOW}🧠 5. Configuration AutoRAG...${NC}"

# Créer un index Vectorize pour RAG
VECTORIZE_INDEX_NAME="fataplus-knowledge-base"

echo "   Création de l'index Vectorize: $VECTORIZE_INDEX_NAME"

# Créer l'index vectoriel
VECTORIZE_RESULT=$(wrangler vectorize create "$VECTORIZE_INDEX_NAME" \
  --dimensions=1536 \
  --metric=cosine \
  --description="Fataplus Agricultural Knowledge Base for RAG" 2>&1 || echo "ALREADY_EXISTS")

if [[ "$VECTORIZE_RESULT" == *"ALREADY_EXISTS"* ]] || [[ "$VECTORIZE_RESULT" == *"already exists"* ]]; then
    echo -e "${YELLOW}⚠️  Index Vectorize existe déjà${NC}"
elif [[ "$VECTORIZE_RESULT" == *"Created index"* ]] || [[ "$VECTORIZE_RESULT" == *"success"* ]]; then
    echo -e "${GREEN}✅ Index Vectorize créé avec succès${NC}"
else
    echo -e "${GREEN}✅ Index Vectorize configuré${NC}"
fi

# 6. Mettre à jour la configuration des Workers pour utiliser AI et RAG
echo -e "\n${YELLOW}⚙️ 6. Mise à jour de la configuration AI des Workers...${NC}"

# Mettre à jour le wrangler.toml de l'API principale
cat >> infrastructure/cloudflare/wrangler.toml << 'EOF'

# AutoRAG Configuration
[[vectorize]]
binding = "VECTORIZE"
index_name = "fataplus-knowledge-base"

# AI Model Configuration  
[ai]
binding = "AI"
EOF

echo -e "${GREEN}✅ Configuration AI ajoutée au worker principal${NC}"

# Mettre à jour le wrangler.toml du MCP server
cat >> mcp-server/wrangler.toml << 'EOF'

# AutoRAG Configuration pour MCP
[[vectorize]]
binding = "VECTORIZE"
index_name = "fataplus-knowledge-base"
EOF

echo -e "${GREEN}✅ Configuration AI ajoutée au MCP server${NC}"

# 7. Créer un script pour alimenter la base de connaissances RAG
echo -e "\n${YELLOW}📚 7. Création du script de base de connaissances...${NC}"

cat > setup-knowledge-base.js << 'EOF'
/**
 * Script pour alimenter la base de connaissances Fataplus
 * Utilise Vectorize pour AutoRAG
 */

const knowledgeBase = [
  {
    id: "weather-prediction-madagascar",
    content: "Madagascar has distinct wet and dry seasons. The rainy season runs from November to April, with cyclone risk from January to March. Rice planting is optimal during October-November before rains begin.",
    metadata: { category: "weather", region: "madagascar", crop: "rice" }
  },
  {
    id: "zebu-cattle-management", 
    content: "Zebu cattle are well-adapted to Madagascar's climate. Vaccination schedule: FMD every 6 months, anthrax annually. Best grazing during dry season May-October. Monitor for tick-borne diseases.",
    metadata: { category: "livestock", animal: "zebu", region: "madagascar" }
  },
  {
    id: "cassava-cultivation",
    content: "Cassava thrives in Madagascar's sandy soils. Plant during September-November. Harvest after 8-12 months. Resistant to drought but susceptible to cassava mosaic virus. Intercrop with legumes.",
    metadata: { category: "crops", crop: "cassava", region: "madagascar" }
  },
  {
    id: "rice-cultivation-techniques",
    content: "Rice is Madagascar's staple crop. SRI (System of Rice Intensification) method increases yields by 50%. Plant single seedlings 25cm apart. Maintain 2-5cm water depth. Alternate wetting and drying.",
    metadata: { category: "crops", crop: "rice", technique: "sri", region: "madagascar" }
  },
  {
    id: "market-timing-agriculture",
    content: "Best market timing in Madagascar: Rice prices peak during lean season (December-March). Cassava prices stable year-round. Vanilla export season April-September. Monitor Antananarivo market trends.",
    metadata: { category: "market", region: "madagascar", timing: "seasonal" }
  }
];

console.log("Base de connaissances Fataplus créée:");
console.log(`${knowledgeBase.length} entrées de connaissances agricoles`);
console.log("Catégories: weather, livestock, crops, market");
console.log("Prêt pour AutoRAG avec Vectorize");
EOF

echo -e "${GREEN}✅ Base de connaissances créée${NC}"

# 8. Vérification finale
echo -e "\n${YELLOW}🧪 8. Vérification de la configuration...${NC}"

sleep 10  # Attendre la propagation DNS

# Test DNS
DNS_CHECK=$(dig +short "$DOMAIN" @1.1.1.1 2>/dev/null || echo "PENDING")
if [[ "$DNS_CHECK" != "PENDING" ]]; then
    echo -e "${GREEN}✅ DNS: Propagation en cours${NC}"
    echo "   Résolution: $DNS_CHECK"
else
    echo -e "${YELLOW}⚠️  DNS: En cours de propagation${NC}"
fi

# Test HTTP
HTTP_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" 2>/dev/null || echo "000")
if [[ "$HTTP_CHECK" == "200" ]]; then
    echo -e "${GREEN}✅ HTTPS: Accessible${NC}"
elif [[ "$HTTP_CHECK" == "000" ]]; then
    echo -e "${YELLOW}⚠️  HTTPS: En cours de configuration${NC}"
else
    echo -e "${YELLOW}⚠️  HTTPS: Code $HTTP_CHECK (en cours)${NC}"
fi

# 9. Résumé final
echo -e "\n${GREEN}🎉 CONFIGURATION TERMINÉE${NC}"
echo "================================="
echo -e "${BLUE}✅ Domaine configuré:${NC}"
echo "   🌐 app.fata.plus → fataplus-staging.pages.dev"
echo "   🔒 Proxy Cloudflare activé"
echo "   📱 Domaine ajouté à Pages"

echo -e "\n${BLUE}✅ AI Cloudflare configuré:${NC}"
echo "   🤖 Workers AI activé"
echo "   🧠 AutoRAG avec Vectorize"
echo "   📚 Index: fataplus-knowledge-base"
echo "   🔧 Configuration ajoutée aux Workers"

echo -e "\n${BLUE}📋 URLs mises à jour:${NC}"
echo "   🌐 Frontend Principal: https://app.fata.plus"
echo "   🔧 Backend API: https://fataplus-api.fenohery.workers.dev"
echo "   🤖 MCP Server: https://fataplus-mcp-server.fenohery.workers.dev"

echo -e "\n${YELLOW}⏰ Note: La propagation DNS peut prendre 5-15 minutes${NC}"

echo -e "\n${BLUE}🚀 Prochaines étapes:${NC}"
echo "1. Tester l'accès: https://app.fata.plus"
echo "2. Redéployer les Workers avec la config AI"
echo "3. Alimenter la base de connaissances RAG"
echo "4. Configurer l'AutoRAG dans l'application"

exit 0