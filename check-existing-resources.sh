#!/bin/bash
set -e

# Configuration des couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔍 Audit des Ressources Cloudflare Existantes${NC}"
echo "================================================="

# Export des variables nécessaires
export CLOUDFLARE_API_TOKEN="LEuqNUpaEanOtwoIggSMR2BKQcKLf-kj7rEuVIDB"
export CF_ACCOUNT_ID="f30dd0d409679ae65e841302cc0caa8c"

# 1. Vérification de l'authentification
echo -e "\n${YELLOW}🔐 1. Authentification${NC}"
if wrangler whoami >/dev/null 2>&1; then
    ACCOUNT_ID=$(wrangler whoami | grep "Account ID" | awk '{print $4}' | tr -d '│' | head -1)
    echo -e "${GREEN}✅ Connecté - Account ID: $ACCOUNT_ID${NC}"
else
    echo -e "${RED}❌ Échec de l'authentification${NC}"
    exit 1
fi

# 2. KV Namespaces existants
echo -e "\n${YELLOW}📦 2. KV Namespaces existants${NC}"
KV_LIST=$(wrangler kv namespace list 2>/dev/null || echo "[]")
if [ "$KV_LIST" = "[]" ] || [ -z "$KV_LIST" ]; then
    echo -e "${RED}❌ Aucun KV namespace trouvé ou pas d'accès${NC}"
    echo "   Permissions KV requises dans votre token API"
else
    echo -e "${GREEN}✅ KV Namespaces trouvés:${NC}"
    echo "$KV_LIST" | jq -r '.[] | "   - \(.title) (ID: \(.id))"' 2>/dev/null || echo "$KV_LIST"
fi

# 3. R2 Buckets existants
echo -e "\n${YELLOW}🪣 3. R2 Buckets existants${NC}"
R2_LIST=$(wrangler r2 bucket list 2>/dev/null || echo "")
if [ -z "$R2_LIST" ]; then
    echo -e "${RED}❌ Aucun R2 bucket trouvé ou pas d'accès${NC}"
    echo "   Permissions R2 requises dans votre token API"
else
    echo -e "${GREEN}✅ R2 Buckets trouvés:${NC}"
    echo "$R2_LIST" | while read -r line; do
        if [ ! -z "$line" ]; then
            echo "   - $line"
        fi
    done
fi

# 4. D1 Databases existantes
echo -e "\n${YELLOW}🗄️ 4. D1 Databases existantes${NC}"
D1_LIST=$(wrangler d1 list 2>/dev/null || echo "[]")
if [ "$D1_LIST" = "[]" ] || [ -z "$D1_LIST" ]; then
    echo -e "${RED}❌ Aucune base D1 trouvée ou pas d'accès${NC}"
    echo "   Permissions D1 requises dans votre token API"
else
    echo -e "${GREEN}✅ D1 Databases trouvées:${NC}"
    echo "$D1_LIST" | jq -r '.[] | "   - \(.name) (ID: \(.uuid))"' 2>/dev/null || echo "$D1_LIST"
fi

# 5. Queues existantes (si disponible)
echo -e "\n${YELLOW}📬 5. Queues existantes${NC}"
QUEUE_LIST=$(wrangler queues list 2>/dev/null || echo "")
if [ -z "$QUEUE_LIST" ]; then
    echo -e "${YELLOW}⚠️  Aucune queue trouvée ou pas d'accès${NC}"
    echo "   (Normal si pas encore créées)"
else
    echo -e "${GREEN}✅ Queues trouvées:${NC}"
    echo "$QUEUE_LIST"
fi

# 6. Workers/Scripts existants
echo -e "\n${YELLOW}⚡ 6. Workers existants${NC}"
WORKERS_LIST=$(wrangler deployments list 2>/dev/null || echo "")
if [ -z "$WORKERS_LIST" ]; then
    echo -e "${YELLOW}⚠️  Aucun worker déployé${NC}"
else
    echo -e "${GREEN}✅ Workers déployés:${NC}"
    echo "$WORKERS_LIST"
fi

# 7. Analyse des permissions
echo -e "\n${YELLOW}🔐 7. Analyse des permissions du token${NC}"

# Test des permissions spécifiques
echo -n "   - KV Access: "
if wrangler kv namespace list >/dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

echo -n "   - R2 Access: "
if wrangler r2 bucket list >/dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

echo -n "   - D1 Access: "
if wrangler d1 list >/dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

echo -n "   - Workers Access: "
if wrangler deployments list >/dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

# 8. Recommandations
echo -e "\n${YELLOW}💡 8. Recommandations${NC}"
echo "================================================="

# Vérifier si toutes les permissions sont OK
KV_OK=$(wrangler kv namespace list >/dev/null 2>&1 && echo "1" || echo "0")
R2_OK=$(wrangler r2 bucket list >/dev/null 2>&1 && echo "1" || echo "0")
D1_OK=$(wrangler d1 list >/dev/null 2>&1 && echo "1" || echo "0")

if [ "$KV_OK" = "1" ] && [ "$R2_OK" = "1" ] && [ "$D1_OK" = "1" ]; then
    echo -e "${GREEN}🎉 Toutes les permissions nécessaires sont disponibles !${NC}"
    echo "   Vous pouvez procéder au déploiement complet"
    echo ""
    echo -e "${BLUE}📋 Prochaines étapes recommandées:${NC}"
    echo "   1. ./deploy-cloudflare.sh -e staging"
    echo "   2. Tester l'application en staging"
    echo "   3. ./deploy-cloudflare.sh -e production"
else
    echo -e "${YELLOW}⚠️  Permissions manquantes détectées${NC}"
    echo ""
    echo -e "${RED}❌ Permissions manquantes:${NC}"
    [ "$KV_OK" = "0" ] && echo "   - KV Namespaces (Workers KV:Edit)"
    [ "$R2_OK" = "0" ] && echo "   - R2 Storage (R2:Edit)"
    [ "$D1_OK" = "0" ] && echo "   - D1 Database (D1:Edit)"
    echo ""
    echo -e "${BLUE}🔧 Actions recommandées:${NC}"
    echo "   1. Aller sur: https://dash.cloudflare.com/$ACCOUNT_ID/api-tokens"
    echo "   2. Modifier votre token API pour inclure les permissions manquantes"
    echo "   3. Ou créer un nouveau token avec le template 'Edit Cloudflare Workers'"
fi

echo -e "\n${BLUE}🔗 Liens utiles:${NC}"
echo "   - Dashboard: https://dash.cloudflare.com/$ACCOUNT_ID"
echo "   - API Tokens: https://dash.cloudflare.com/$ACCOUNT_ID/api-tokens"
echo "   - Documentation: https://developers.cloudflare.com/workers/"

exit 0