#!/bin/bash
set -e

# Configuration des couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🌐 Configuration app.fata.plus${NC}"
echo "====================================="

# Variables
export CLOUDFLARE_API_TOKEN="LEuqNUpaEanOtwoIggSMR2BKQcKLf-kj7rEuVIDB"
export CF_ACCOUNT_ID="f30dd0d409679ae65e841302cc0caa8c"
ZONE_ID="675e81a7a3bd507a2704fb3e65519768"
DOMAIN_NAME="app.fata.plus"
PROJECT_NAME="fataplus-staging"

echo "Domaine cible: $DOMAIN_NAME"
echo "Projet Pages: $PROJECT_NAME"

# 1. Ajouter le domaine personnalisé au projet Pages
echo -e "\n${YELLOW}📍 1. Configuration du domaine personnalisé${NC}"

# Méthode via API Cloudflare
CUSTOM_DOMAIN_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$PROJECT_NAME/domains" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$DOMAIN_NAME\"}")

echo "Réponse API: $(echo "$CUSTOM_DOMAIN_RESPONSE" | jq -r '.success // "false"')"

# 2. Créer l'enregistrement CNAME
echo -e "\n${YELLOW}📝 2. Création/Mise à jour de l'enregistrement DNS${NC}"

# La cible pour Cloudflare Pages est généralement le sous-domaine pages.dev
CNAME_TARGET="$PROJECT_NAME.pages.dev"

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
    echo -e "${GREEN}✅ Enregistrement CNAME créé/mis à jour${NC}"
    echo "   $DOMAIN_NAME -> $CNAME_TARGET"
else
    echo -e "${YELLOW}⚠️  Réponse DNS: $(echo "$CREATE_RESPONSE" | jq -r '.errors[0].message // "Configuration en cours"')${NC}"
fi

# 3. Configuration AI simple
echo -e "\n${YELLOW}🤖 3. Activation de Cloudflare AI${NC}"

# Vérifier la disponibilité AI
AI_CHECK=$(curl -s "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/ai/models" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq -r '.success // false')

if [ "$AI_CHECK" = "true" ]; then
    echo -e "${GREEN}✅ Cloudflare AI accessible${NC}"
else
    echo -e "${YELLOW}⚠️  AI non accessible avec les permissions actuelles${NC}"
fi

# Créer configuration AI pour les Workers
cat > ai-config.json << EOF
{
  "ai_enabled": true,
  "models": {
    "text": "@cf/meta/llama-3.1-8b-instruct",
    "embeddings": "@cf/baai/bge-base-en-v1.5"
  },
  "features": {
    "autorag": true,
    "agricultural_insights": true,
    "weather_analysis": true
  }
}
EOF

echo -e "${GREEN}✅ Configuration AI créée (ai-config.json)${NC}"

# 4. Test de connectivité
echo -e "\n${YELLOW}🧪 4. Tests de configuration${NC}"

echo "Test DNS en cours..."
sleep 5

# Test simple de connectivité
if curl -s -I "https://$DOMAIN_NAME" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Domaine accessible via HTTPS${NC}"
else
    echo -e "${YELLOW}⚠️  Domaine en cours de propagation (normal, attendre 5-10 min)${NC}"
fi

echo -e "\n${GREEN}🎉 CONFIGURATION TERMINÉE${NC}"
echo "==============================="
echo -e "${BLUE}📍 Votre domaine principal:${NC} https://$DOMAIN_NAME"
echo -e "${BLUE}🔗 Fallback:${NC} https://$PROJECT_NAME.pages.dev"
echo -e "${BLUE}🤖 AI:${NC} Configuré dans ai-config.json"
echo ""
echo -e "${YELLOW}📋 Prochaines étapes:${NC}"
echo "1. Attendre propagation DNS (5-10 minutes)"
echo "2. Tester https://$DOMAIN_NAME"
echo "3. Mettre à jour les configurations frontend"

exit 0