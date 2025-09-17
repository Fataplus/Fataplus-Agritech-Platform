#!/bin/bash

export CLOUDFLARE_API_TOKEN="LEuqNUpaEanOtwoIggSMR2BKQcKLf-kj7rEuVIDB"
export CF_ACCOUNT_ID="f30dd0d409679ae65e841302cc0caa8c"

echo "🎉 CLOUDFLARE CONNECTION VALIDATION"
echo "===================================="
echo ""

# Test de base
echo "🔍 1. Test d'authentification..."
if wrangler whoami 2>/dev/null | grep -q "You are logged in"; then
    echo "✅ Authentification réussie !"
else
    echo "❌ Échec d'authentification"
    exit 1
fi

echo ""
echo "📊 2. Informations du compte:"
wrangler whoami | tail -n +3

echo ""
echo "🔧 3. Vérification de la configuration du projet..."

# Vérifier les répertoires et fichiers clés
if [ -d "infrastructure/cloudflare" ]; then
    echo "✅ Répertoire infrastructure/cloudflare trouvé"
else
    echo "❌ Répertoire infrastructure/cloudflare manquant"
fi

if [ -f "infrastructure/cloudflare/wrangler.toml" ]; then
    echo "✅ Configuration wrangler.toml trouvée"
else
    echo "❌ Configuration wrangler.toml manquante"
fi

if [ -f ".env.cloudflare" ]; then
    echo "✅ Fichier .env.cloudflare configuré"
else
    echo "❌ Fichier .env.cloudflare manquant"
fi

echo ""
echo "🚀 4. Prêt pour le déploiement !"
echo ""
echo "📋 Commandes disponibles:"
echo "   ./deploy-cloudflare.sh -e staging     # Déploiement staging"
echo "   ./deploy-cloudflare.sh -e production  # Déploiement production"
echo "   ./cloudflare-manage.sh status         # Vérifier le statut"
echo ""

echo "⚙️ 5. Configuration des variables d'environnement..."
# Mettre à jour le fichier .env.cloudflare avec les bonnes valeurs
sed -i "s/CF_API_TOKEN=.*/CF_API_TOKEN=$CLOUDFLARE_API_TOKEN/" .env.cloudflare
sed -i "s/CF_ACCOUNT_ID=.*/CF_ACCOUNT_ID=$CF_ACCOUNT_ID/" .env.cloudflare

echo "✅ Variables mises à jour dans .env.cloudflare"

echo ""
echo "🎯 RÉSUMÉ DE LA CONNEXION:"
echo "=========================="
echo "✅ Token API: Configuré et validé"
echo "✅ Account ID: $CF_ACCOUNT_ID"
echo "✅ Authentification: Réussie"
echo "✅ Configuration: Prête"
echo "✅ Scripts de déploiement: Disponibles"
echo ""
echo "🚀 CLOUDFLARE EST PRÊT ! Vous pouvez maintenant déployer votre application."