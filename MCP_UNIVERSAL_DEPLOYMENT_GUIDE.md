# 🚀 Fataplus MCP Server - Guide de Déploiement Universel

Ce guide complet couvre le déploiement du serveur MCP (Model Context Protocol) de Fataplus sur **multiple plateformes** : Cloudflare Workers et Docker Universal.

## 📋 Vue d'ensemble

Le serveur MCP Fataplus fournit aux assistants IA un accès aux données agricoles via le protocole Model Context Protocol. Il expose des outils pour :

- **Données météorologiques** (`get_weather_data`)
- **Gestion du bétail** (`get_livestock_info`)
- **Prix des marchés** (`get_market_prices`)
- **Analytiques de fermes** (`get_farm_analytics`)
- **Gamification** (`get_gamification_status`)
- **Gestion des tâches** (`create_task_reminder`)

## 🎯 Options de Déploiement

### 1. 🌍 **Cloudflare Workers** (Recommandé pour la production)
- ✅ Distribution globale sur 300+ centres de données
- ✅ Mise à l'échelle automatique et zero cold start
- ✅ Intégration native R2, D1, KV
- ✅ HTTPS automatique et protection DDoS

### 2. 🐳 **Docker Universal** (Recommandé pour le développement/on-premise)
- ✅ Déploiement sur n'importe quel environnement Docker
- ✅ Base de données PostgreSQL complète
- ✅ Cache Redis intégré
- ✅ Monitoring Prometheus optionnel

## 🔧 Configuration Initiale

### Prérequis
- **Node.js 18+**
- **Docker & Docker Compose** (pour déploiement Docker)
- **Wrangler CLI** (pour déploiement Cloudflare)
- **Compte Cloudflare** (pour déploiement Cloudflare)

### Vérification de la Configuration
```bash
# Vérifier que tout est prêt
./test-mcp-config.sh
```

## 🚀 Déploiement Cloudflare Workers

### Étape 1 : Configuration Cloudflare
```bash
# Copier le template d'environnement
cp .env.cloudflare.example .env.cloudflare

# Éditer avec vos clés Cloudflare
nano .env.cloudflare
```

**Variables requises dans `.env.cloudflare` :**
```bash
CF_ACCOUNT_ID=your-cloudflare-account-id
CF_API_TOKEN=your-cloudflare-api-token
CF_ZONE_ID=your-cloudflare-zone-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
OPENWEATHER_API_KEY=your-openweather-api-key
JWT_SECRET_KEY=your-super-secure-jwt-secret-key
```

### Étape 2 : Authentification Wrangler
```bash
# Installer Wrangler CLI
npm install -g wrangler

# Se connecter à Cloudflare
wrangler login

# Vérifier l'authentification
wrangler whoami
```

### Étape 3 : Déploiement Automatisé
```bash
# Déploiement en production
./deploy-mcp-server.sh -e production

# Déploiement en staging
./deploy-mcp-server.sh -e staging

# Déploiement spécifique fata.plus
./deploy-mcp-fata-plus.sh production
```

### Étape 4 : Accès aux Services
Après déploiement, votre serveur MCP sera accessible via :
- **Production** : `https://mcp.yourdomain.com`
- **Staging** : `https://staging-mcp.yourdomain.com`
- **Health Check** : `https://mcp.yourdomain.com/health`

## 🐳 Déploiement Docker Universal

### Étape 1 : Configuration Docker
```bash
# Copier le template d'environnement Docker
cp .env.mcp.example .env.mcp

# Éditer avec vos configurations
nano .env.mcp
```

**Variables principales dans `.env.mcp` :**
```bash
NODE_ENV=production
MCP_PORT=3001
MCP_POSTGRES_PASSWORD=your-secure-postgres-password
JWT_SECRET_KEY=your-super-secure-jwt-secret-key
OPENWEATHER_API_KEY=your-openweather-api-key
```

### Étape 2 : Déploiement Automatisé
```bash
# Déploiement de développement
./deploy-mcp-docker.sh -e dev -v

# Déploiement de production
./deploy-mcp-docker.sh -e production

# Déploiement avec monitoring
./deploy-mcp-docker.sh -e production -m

# Reconstruction complète
./deploy-mcp-docker.sh -e production -b -f
```

### Étape 3 : Gestion des Services
```bash
# Voir les logs
docker compose -f docker-compose.mcp.yml logs -f fataplus-mcp-server

# Redémarrer le serveur
docker compose -f docker-compose.mcp.yml restart fataplus-mcp-server

# Arrêter tous les services
docker compose -f docker-compose.mcp.yml down

# Mise à jour du déploiement
./deploy-mcp-docker.sh -e production -f
```

### Étape 4 : Accès aux Services
Avec Docker, vos services seront accessibles via :
- **MCP Server** : `http://localhost:3001`
- **Health Check** : `http://localhost:3001/health`
- **PostgreSQL** : `localhost:5432`
- **Redis** : `localhost:6379`
- **Prometheus** (si activé) : `http://localhost:9090`

## 🧪 Tests et Validation

### Tests de Base
```bash
# Test de configuration
./test-mcp-config.sh

# Test de santé (Cloudflare)
curl https://mcp.yourdomain.com/health

# Test de santé (Docker)
curl http://localhost:3001/health
```

### Tests MCP Fonctionnels
```bash
# Test des outils MCP
curl -X POST https://mcp.yourdomain.com/mcp/tools \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_weather_data",
      "arguments": {
        "location": "Antananarivo, Madagascar"
      }
    }
  }'

# Test des ressources MCP
curl -X POST https://mcp.yourdomain.com/mcp/resources \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "resources/read",
    "params": {
      "uri": "fataplus://weather/current"
    }
  }'
```

## 🔧 Configuration Claude Desktop

### Pour Cloudflare Deployment
```json
{
  "mcpServers": {
    "fataplus": {
      "command": "npx",
      "args": ["-y", "@fataplus/mcp-client"],
      "env": {
        "FATAPLUS_MCP_URL": "https://mcp.yourdomain.com",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Pour Docker Deployment
```json
{
  "mcpServers": {
    "fataplus": {
      "command": "npx",
      "args": ["-y", "@fataplus/mcp-client"],
      "env": {
        "FATAPLUS_MCP_URL": "http://localhost:3001",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

## 📊 Monitoring et Observabilité

### Cloudflare Analytics
- Accédez au dashboard Cloudflare → Workers → Analytics
- Métriques : temps de réponse, taux d'erreur, utilisation CPU/mémoire
- Logs en temps réel : `wrangler tail fataplus-mcp-server --env production`

### Docker Monitoring
```bash
# Logs des services
docker compose -f docker-compose.mcp.yml logs -f

# Métriques des conteneurs
docker stats

# Prometheus (si activé)
# Accès : http://localhost:9090
```

## 🛡️ Sécurité et Meilleures Pratiques

### Secrets et Clés
- ✅ Utilisez des clés JWT fortes (>32 caractères)
- ✅ Changez les mots de passe par défaut
- ✅ Utilisez HTTPS en production
- ✅ Configurez CORS appropriément

### Backup et Récupération
```bash
# Backup automatique (Docker)
# Configuré dans .env.mcp avec BACKUP_ENABLED=true

# Backup manuel (Docker)
docker run --rm \
  -v webapp_mcp-postgres-data:/backup-source:ro \
  -v ./backups:/backup \
  alpine:latest \
  tar czf /backup/mcp-backup-$(date +%Y%m%d).tar.gz -C /backup-source .
```

## 🚨 Dépannage

### Problèmes Courants

#### 1. Erreurs de Déploiement Cloudflare
```bash
# Vérifier l'authentification
wrangler whoami

# Vérifier les ressources
wrangler kv:namespace list
wrangler r2 bucket list
wrangler d1 list

# Logs d'erreurs
wrangler tail fataplus-mcp-server --env production
```

#### 2. Problèmes Docker
```bash
# Vérifier les conteneurs
docker compose -f docker-compose.mcp.yml ps

# Logs détaillés
docker compose -f docker-compose.mcp.yml logs fataplus-mcp-server

# Redémarrer les services
docker compose -f docker-compose.mcp.yml restart
```

#### 3. Problèmes de Connectivité
```bash
# Test réseau
curl -v http://localhost:3001/health

# Test base de données
docker compose -f docker-compose.mcp.yml exec mcp-postgres pg_isready

# Test cache
docker compose -f docker-compose.mcp.yml exec mcp-redis redis-cli ping
```

## 📚 Ressources Supplémentaires

### Documentation
- **Cloudflare Workers** : https://developers.cloudflare.com/workers/
- **Model Context Protocol** : https://modelcontextprotocol.io/
- **Docker Compose** : https://docs.docker.com/compose/

### Support
- **Issues GitHub** : https://github.com/fataplus/fataplus/issues
- **Documentation complète** : Voir `MCP_CLOUDFLARE_DEPLOYMENT.md`
- **Scripts disponibles** :
  - `deploy-mcp-server.sh` - Déploiement Cloudflare
  - `deploy-mcp-docker.sh` - Déploiement Docker Universal
  - `deploy-mcp-fata-plus.sh` - Déploiement fata.plus
  - `test-mcp-config.sh` - Validation de configuration

## 🎉 Félicitations !

Votre serveur MCP Fataplus est maintenant configuré pour un déploiement universel ! 

### Prochaines Étapes
1. ✅ Testez votre déploiement avec un assistant IA
2. ✅ Configurez la surveillance et les alertes
3. ✅ Planifiez les sauvegardes automatiques
4. ✅ Optimisez les performances selon vos besoins

---

**Fataplus** - Construire l'avenir de l'agriculture africaine avec l'IA 🌱