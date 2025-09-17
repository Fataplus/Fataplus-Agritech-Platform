#!/bin/bash
set -e

# Configuration des couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔍 Vérification du statut du domaine app.fata.plus${NC}"
echo "=================================================="

# Variables
export CLOUDFLARE_API_TOKEN="LEuqNUpaEanOtwoIggSMR2BKQcKLf-kj7rEuVIDB"
export CF_ACCOUNT_ID="f30dd0d409679ae65e841302cc0caa8c"
ZONE_ID="675e81a7a3bd507a2704fb3e65519768"
DOMAIN_NAME="app.fata.plus"
PROJECT_NAME="fataplus-staging"

# 1. Vérifier le statut du projet Pages
echo -e "\n${YELLOW}📄 1. Statut du projet Pages${NC}"

PAGES_STATUS=$(curl -s "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$PROJECT_NAME" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")

if echo "$PAGES_STATUS" | jq -e '.success' >/dev/null; then
    echo -e "${GREEN}✅ Projet Pages actif${NC}"
    PROJECT_URL=$(echo "$PAGES_STATUS" | jq -r '.result.canonical_deployment.url // "N/A"')
    echo "   URL: $PROJECT_URL"
else
    echo -e "${RED}❌ Erreur projet Pages${NC}"
    echo "$PAGES_STATUS" | jq -r '.errors[0].message // "Erreur inconnue"'
fi

# 2. Vérifier les domaines personnalisés
echo -e "\n${YELLOW}🌐 2. Domaines personnalisés configurés${NC}"

CUSTOM_DOMAINS=$(curl -s "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$PROJECT_NAME/domains" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")

if echo "$CUSTOM_DOMAINS" | jq -e '.success' >/dev/null; then
    echo -e "${GREEN}✅ Domaines configurés:${NC}"
    echo "$CUSTOM_DOMAINS" | jq -r '.result[] | "   - " + .name + " (Status: " + .status + ")"'
    
    # Vérifier le statut spécifique de notre domaine
    DOMAIN_STATUS=$(echo "$CUSTOM_DOMAINS" | jq -r '.result[] | select(.name=="'$DOMAIN_NAME'") | .status // "not_found"')
    echo -e "\n${BLUE}Statut app.fata.plus: $DOMAIN_STATUS${NC}"
    
    if [ "$DOMAIN_STATUS" = "pending_dns" ] || [ "$DOMAIN_STATUS" = "pending" ]; then
        echo -e "${YELLOW}⚠️  Domaine en attente de propagation DNS${NC}"
    elif [ "$DOMAIN_STATUS" = "active" ]; then
        echo -e "${GREEN}✅ Domaine actif et prêt${NC}"
    elif [ "$DOMAIN_STATUS" = "not_found" ]; then
        echo -e "${RED}❌ Domaine non configuré, réajout nécessaire${NC}"
    fi
else
    echo -e "${RED}❌ Erreur récupération domaines${NC}"
fi

# 3. Vérifier les enregistrements DNS
echo -e "\n${YELLOW}📋 3. Enregistrements DNS${NC}"

DNS_RECORDS=$(curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=$DOMAIN_NAME" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")

if echo "$DNS_RECORDS" | jq -e '.success' >/dev/null; then
    RECORD_COUNT=$(echo "$DNS_RECORDS" | jq '.result | length')
    if [ "$RECORD_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ Enregistrements DNS trouvés:${NC}"
        echo "$DNS_RECORDS" | jq -r '.result[] | "   - " + .type + ": " + .name + " -> " + .content'
    else
        echo -e "${YELLOW}⚠️  Aucun enregistrement DNS trouvé pour $DOMAIN_NAME${NC}"
    fi
else
    echo -e "${RED}❌ Erreur récupération DNS${NC}"
fi

# 4. Test de connectivité
echo -e "\n${YELLOW}🧪 4. Tests de connectivité${NC}"

# Test du domaine principal
echo "Test app.fata.plus..."
if curl -s -I "https://$DOMAIN_NAME" --connect-timeout 10 >/dev/null 2>&1; then
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN_NAME" --connect-timeout 10)
    echo -e "${GREEN}✅ app.fata.plus accessible (HTTP $STATUS_CODE)${NC}"
else
    echo -e "${YELLOW}⚠️  app.fata.plus non accessible (propagation en cours)${NC}"
fi

# Test du domaine de fallback
echo "Test fataplus-staging.pages.dev..."
if curl -s -I "https://$PROJECT_NAME.pages.dev" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ fataplus-staging.pages.dev accessible${NC}"
else
    echo -e "${RED}❌ fataplus-staging.pages.dev non accessible${NC}"
fi

# 5. Actions correctives si nécessaire
echo -e "\n${YELLOW}🔧 5. Actions correctives${NC}"

if [ "$DOMAIN_STATUS" = "not_found" ]; then
    echo -e "${BLUE}Réajout du domaine personnalisé...${NC}"
    
    READD_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$PROJECT_NAME/domains" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"name\": \"$DOMAIN_NAME\"}")
    
    if echo "$READD_RESPONSE" | jq -e '.success' >/dev/null; then
        echo -e "${GREEN}✅ Domaine réajouté avec succès${NC}"
    else
        echo -e "${RED}❌ Erreur lors du réajout: $(echo "$READD_RESPONSE" | jq -r '.errors[0].message // "Erreur inconnue"')${NC}"
    fi
fi

# 6. Vérification finale et résumé
echo -e "\n${GREEN}📊 RÉSUMÉ DE LA CONFIGURATION${NC}"
echo "================================="
echo -e "${BLUE}🌐 Domaine principal:${NC} https://$DOMAIN_NAME"
echo -e "${BLUE}🔗 Domaine de secours:${NC} https://$PROJECT_NAME.pages.dev"
echo -e "${BLUE}📊 Projet Pages:${NC} $PROJECT_NAME"
echo -e "${BLUE}🏷️  Statut domaine:${NC} $DOMAIN_STATUS"

echo -e "\n${YELLOW}⏰ Temps d'attente estimé:${NC}"
echo "- Propagation DNS: 5-15 minutes"
echo "- Certificat SSL: 10-30 minutes"
echo "- Activation complète: 15-45 minutes"

echo -e "\n${YELLOW}🔗 Liens de test:${NC}"
echo "- Frontend: https://$DOMAIN_NAME"
echo "- API Worker: https://fataplus-worker.fata-plus.workers.dev" 
echo "- MCP Server: https://fataplus-mcp.fata-plus.workers.dev"

exit 0