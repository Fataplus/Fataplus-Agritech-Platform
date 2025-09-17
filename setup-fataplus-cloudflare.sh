#!/bin/bash
set -e

# Configuration des couleurs pour l'affichage
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Configuration Complète Cloudflare pour Fataplus${NC}"
echo "================================================================="

# Vérifier l'authentification
echo -e "\n${YELLOW}🔐 1. Vérification de l'authentification...${NC}"
if ! wrangler whoami >/dev/null 2>&1; then
    echo -e "${RED}❌ Erreur: Non authentifié avec Cloudflare${NC}"
    echo "Exécutez 'wrangler login' ou configurez votre API token"
    exit 1
fi

# Afficher les infos du compte
echo -e "${GREEN}✅ Authentifié avec succès${NC}"
wrangler whoami

# Fonction pour créer les ressources avec gestion d'erreur
create_resource() {
    local resource_type=$1
    local resource_name=$2
    local command=$3
    
    echo -e "\n${YELLOW}🔧 Création ${resource_type}: ${resource_name}${NC}"
    
    if eval $command 2>/dev/null; then
        echo -e "${GREEN}✅ ${resource_type} '${resource_name}' créé avec succès${NC}"
        return 0
    else
        echo -e "${YELLOW}ℹ️  ${resource_type} '${resource_name}' existe déjà ou erreur de création${NC}"
        return 1
    fi
}

# 2. Configuration des KV Namespaces
echo -e "\n${YELLOW}📦 2. Configuration des KV Namespaces...${NC}"

# Cache principal
create_resource "KV Namespace" "fataplus-cache" "wrangler kv namespace create fataplus-cache"
create_resource "KV Namespace" "fataplus-cache-preview" "wrangler kv namespace create fataplus-cache --preview"

# Sessions utilisateur
create_resource "KV Namespace" "fataplus-sessions" "wrangler kv namespace create fataplus-sessions"
create_resource "KV Namespace" "fataplus-sessions-preview" "wrangler kv namespace create fataplus-sessions --preview"

# Configuration application
create_resource "KV Namespace" "fataplus-config" "wrangler kv namespace create fataplus-config"
create_resource "KV Namespace" "fataplus-config-preview" "wrangler kv namespace create fataplus-config --preview"

# Analytics et métriques
create_resource "KV Namespace" "fataplus-analytics" "wrangler kv namespace create fataplus-analytics"
create_resource "KV Namespace" "fataplus-analytics-preview" "wrangler kv namespace create fataplus-analytics --preview"

# 3. Configuration des R2 Buckets
echo -e "\n${YELLOW}🪣 3. Configuration des R2 Buckets...${NC}"

# Stockage principal
create_resource "R2 Bucket" "fataplus-storage" "wrangler r2 bucket create fataplus-storage"

# Modèles ML et AI
create_resource "R2 Bucket" "fataplus-ml-models" "wrangler r2 bucket create fataplus-ml-models"

# Sauvegardes
create_resource "R2 Bucket" "fataplus-backups" "wrangler r2 bucket create fataplus-backups"

# Logs
create_resource "R2 Bucket" "fataplus-logs" "wrangler r2 bucket create fataplus-logs"

# Uploads utilisateurs
create_resource "R2 Bucket" "fataplus-uploads" "wrangler r2 bucket create fataplus-uploads"

# 4. Configuration de la base de données D1
echo -e "\n${YELLOW}🗄️ 4. Configuration de la base de données D1...${NC}"

create_resource "D1 Database" "fataplus-db" "wrangler d1 create fataplus-db"

# 5. Configuration des Queues
echo -e "\n${YELLOW}📬 5. Configuration des Queues...${NC}"

# Queue pour emails
create_resource "Queue" "email-queue" "wrangler queues create email-queue"

# Queue pour analytics
create_resource "Queue" "analytics-queue" "wrangler queues create analytics-queue"

# Queue pour tâches ML/AI
create_resource "Queue" "ai-processing-queue" "wrangler queues create ai-processing-queue"

# Queue pour notifications
create_resource "Queue" "notification-queue" "wrangler queues create notification-queue"

# 6. Lister toutes les ressources créées
echo -e "\n${YELLOW}📋 6. Récapitulatif des ressources...${NC}"

echo -e "\n${BLUE}KV Namespaces:${NC}"
wrangler kv namespace list 2>/dev/null || echo "Aucun KV namespace trouvé"

echo -e "\n${BLUE}R2 Buckets:${NC}"
wrangler r2 bucket list 2>/dev/null || echo "Aucun R2 bucket trouvé"

echo -e "\n${BLUE}D1 Databases:${NC}"
wrangler d1 list 2>/dev/null || echo "Aucune base de données D1 trouvée"

echo -e "\n${BLUE}Queues:${NC}"
wrangler queues list 2>/dev/null || echo "Aucune queue trouvée"

# 7. Configuration du wrangler.toml
echo -e "\n${YELLOW}⚙️ 7. Mise à jour du fichier wrangler.toml...${NC}"

# Obtenir les IDs des ressources créées
if [ -f "infrastructure/cloudflare/wrangler.toml" ]; then
    echo -e "${GREEN}✅ Configuration wrangler.toml trouvée${NC}"
    
    # Backup du fichier existant
    cp infrastructure/cloudflare/wrangler.toml infrastructure/cloudflare/wrangler.toml.backup
    echo -e "${GREEN}✅ Sauvegarde créée: wrangler.toml.backup${NC}"
else
    echo -e "${YELLOW}⚠️  Fichier wrangler.toml non trouvé${NC}"
fi

# 8. Mise à jour du .env.cloudflare
echo -e "\n${YELLOW}📝 8. Mise à jour du fichier .env.cloudflare...${NC}"

if [ -f ".env.cloudflare" ]; then
    # Obtenir l'Account ID depuis wrangler
    ACCOUNT_ID=$(wrangler whoami | grep "Account ID" | awk '{print $4}' | tr -d '│')
    
    if [ ! -z "$ACCOUNT_ID" ]; then
        sed -i "s/CF_ACCOUNT_ID=.*/CF_ACCOUNT_ID=$ACCOUNT_ID/" .env.cloudflare
        echo -e "${GREEN}✅ Account ID mis à jour: $ACCOUNT_ID${NC}"
    fi
    
    echo -e "${GREEN}✅ Fichier .env.cloudflare configuré${NC}"
else
    echo -e "${RED}❌ Fichier .env.cloudflare non trouvé${NC}"
fi

# 9. Test de connectivité
echo -e "\n${YELLOW}🧪 9. Test de connectivité aux services...${NC}"

# Test KV
echo -n "Test KV... "
if wrangler kv namespace list >/dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

# Test R2
echo -n "Test R2... "
if wrangler r2 bucket list >/dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

# Test D1
echo -n "Test D1... "
if wrangler d1 list >/dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

# 10. Résumé final
echo -e "\n${GREEN}🎉 CONFIGURATION CLOUDFLARE TERMINÉE !${NC}"
echo "================================================"
echo -e "${BLUE}Services configurés pour Fataplus:${NC}"
echo "✅ KV Namespaces - Cache, sessions, config, analytics"
echo "✅ R2 Buckets - Stockage, modèles ML, backups, logs"
echo "✅ D1 Database - Base de données principale"
echo "✅ Queues - Email, analytics, AI, notifications"
echo "✅ Variables d'environnement - Mises à jour"

echo -e "\n${YELLOW}📋 Prochaines étapes:${NC}"
echo "1. Vérifiez les IDs générés dans les ressources"
echo "2. Mettez à jour infrastructure/cloudflare/wrangler.toml si nécessaire"
echo "3. Lancez le déploiement: ./deploy-cloudflare.sh -e staging"
echo "4. Testez l'application déployée"

echo -e "\n${BLUE}🔗 URLs utiles:${NC}"
echo "- Dashboard Cloudflare: https://dash.cloudflare.com/$ACCOUNT_ID"
echo "- Workers: https://dash.cloudflare.com/$ACCOUNT_ID/workers"
echo "- R2: https://dash.cloudflare.com/$ACCOUNT_ID/r2"
echo "- D1: https://dash.cloudflare.com/$ACCOUNT_ID/d1"

exit 0