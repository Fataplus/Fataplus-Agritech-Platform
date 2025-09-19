# 🚀 Déploiement MCP Fataplus sur mcp.fata.plus

## Vue d'ensemble

Ce guide explique comment configurer et déployer le serveur MCP Fataplus sur le domaine personnalisé `mcp.fata.plus` avec Cloudflare Workers.

## 📋 Configuration DNS

### Domaines configurés

| Environnement | Domaine | Worker |
|---------------|---------|---------|
| **Production** | `mcp.fata.plus` | `fataplus-mcp-server` |
| **Staging** | `staging-mcp.fata.plus` | `fataplus-mcp-staging` |
| **Development** | `dev-mcp.fata.plus` | `fataplus-mcp-dev` |

### Enregistrements DNS requis

```dns
# Production
mcp.fata.plus.          CNAME   fataplus-mcp-server.workers.dev.

# Staging  
staging-mcp.fata.plus.  CNAME   fataplus-mcp-staging.workers.dev.

# Development
dev-mcp.fata.plus.      CNAME   fataplus-mcp-dev.workers.dev.
```

## 🛠️ Déploiement automatique

### Déploiement rapide

```bash
# Déploiement complet en production
./deploy-mcp-fata-plus.sh production

# Déploiement avec tests
./deploy-mcp-fata-plus.sh --test production

# Configuration DNS seulement
./deploy-mcp-fata-plus.sh --config production

# Déploiement seulement (sans DNS)
./deploy-mcp-fata-plus.sh --deploy production
```

### Déploiement par environnement

#### Production
```bash
# Déploiement complet
./deploy-mcp-fata-plus.sh production

# Accès: https://mcp.fata.plus
```

#### Staging
```bash
# Déploiement staging
./deploy-mcp-fata-plus.sh staging

# Accès: https://staging-mcp.fata.plus
```

#### Development
```bash
# Déploiement développement  
./deploy-mcp-fata-plus.sh development

# Accès: https://dev-mcp.fata.plus
```

## 🔧 Configuration manuelle

### 1. Configuration DNS Cloudflare

Utilisez le script automatique ou configurez manuellement :

```bash
# Configuration DNS automatique
./scripts/configure-mcp-dns.sh production
```

**Configuration manuelle via l'interface Cloudflare :**

1. Connectez-vous à Cloudflare Dashboard
2. Sélectionnez la zone `fata.plus`
3. Ajoutez les enregistrements DNS :
   - Type: `CNAME`
   - Nom: `mcp`
   - Cible: `fataplus-mcp-server.workers.dev`
   - Proxy: ✅ Activé

### 2. Configuration Wrangler

Le fichier `wrangler.toml` est déjà configuré avec les domaines :

```toml
[env.production]
name = "fataplus-mcp-server"
vars = {
  ENVIRONMENT = "production",
  LOG_LEVEL = "warn", 
  CORS_ORIGINS = "https://fata.plus,https://app.fata.plus,https://mcp.fata.plus"
}

[[routes]]
pattern = "mcp.fata.plus/*"
zone_name = "fata.plus"
custom_domain = true
```

### 3. Déploiement manuel

```bash
# Naviguer vers le serveur MCP
cd mcp-server

# Installer les dépendances
npm install

# Construire pour Cloudflare Workers
npm run build:worker

# Déployer en production
wrangler deploy --env production

# Ajouter le domaine personnalisé
wrangler custom-domains add mcp.fata.plus --name fataplus-mcp-server --env production
```

## 🔐 Configuration SSL

### SSL automatique

Cloudflare configure automatiquement :
- ✅ Certificat SSL/TLS gratuit
- ✅ Redirection HTTPS forcée
- ✅ TLS 1.3 activé
- ✅ HSTS activé

### Vérification SSL

```bash
# Tester le certificat SSL
curl -I https://mcp.fata.plus/health

# Vérifier les détails SSL
openssl s_client -connect mcp.fata.plus:443 -servername mcp.fata.plus
```

## 📊 Monitoring et validation

### Tests de santé

```bash
# Test de base
curl https://mcp.fata.plus/health

# Test des outils MCP
curl -X POST https://mcp.fata.plus/mcp/tools \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

### Monitoring en temps réel

```bash
# Logs en temps réel
wrangler tail fataplus-mcp-server --env production

# Logs avec recherche
wrangler tail --search="ERROR" fataplus-mcp-server
```

### Analytics Cloudflare

Accès aux métriques dans le Dashboard Cloudflare :
- Requêtes par seconde
- Temps de réponse
- Codes d'erreur
- Géolocalisation des utilisateurs

## 🎯 Configuration Claude Desktop

### Configuration de production

```json
{
  "mcpServers": {
    "fataplus": {
      "command": "npx",
      "args": ["-y", "@fataplus/mcp-client"],
      "env": {
        "FATAPLUS_MCP_URL": "https://mcp.fata.plus",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Configuration avec clé API

```json
{
  "mcpServers": {
    "fataplus": {
      "command": "npx", 
      "args": ["-y", "@fataplus/mcp-client"],
      "env": {
        "FATAPLUS_MCP_URL": "https://mcp.fata.plus",
        "FATAPLUS_API_KEY": "your-api-key-here",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Localisation du fichier de configuration

| OS | Chemin |
|----|--------|
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Linux** | `~/.config/claude/claude_desktop_config.json` |

## 🔧 Dépannage

### Problèmes DNS

#### DNS non résolu
```bash
# Vérifier la résolution DNS
nslookup mcp.fata.plus

# Vérifier les enregistrements DNS
dig mcp.fata.plus CNAME
```

**Solution :** Attendre la propagation DNS (jusqu'à 24h) ou vider le cache DNS local.

#### Erreur SSL

```bash
# Tester SSL
curl -I https://mcp.fata.plus
```

**Solution :** Attendre la provisioning du certificat SSL (quelques minutes).

### Problèmes de déploiement

#### Erreur d'authentification Wrangler
```bash
# Vérifier l'authentification
wrangler whoami

# Se reconnecter si nécessaire
wrangler login
```

#### Erreur de zone Cloudflare
```bash
# Vérifier les zones disponibles
wrangler zone list

# Vérifier l'ID de zone dans config/.env.cloudflare
```

### Problèmes de connectivité

#### MCP non accessible
1. Vérifier le déploiement : `wrangler tail fataplus-mcp-server`
2. Tester l'endpoint de santé : `curl https://mcp.fata.plus/health`
3. Vérifier la configuration Claude Desktop

#### Erreurs CORS
Vérifier la configuration CORS dans `wrangler.toml` :
```toml
CORS_ORIGINS = "https://fata.plus,https://app.fata.plus,https://mcp.fata.plus"
```

## 📈 Performance et optimisation

### Cache Cloudflare

Configuration automatique :
- ✅ Cache edge pour les ressources statiques
- ✅ Compression Brotli/Gzip
- ✅ Minification automatique (CSS, JS, HTML)

### Optimisations Workers

- ✅ Exécution à la périphérie (edge computing)
- ✅ Mise en cache KV pour les données fréquentes
- ✅ Compression des réponses JSON
- ✅ Limitation du taux de requêtes

## 💰 Coûts estimés

### Usage gratuit Cloudflare

- **Workers** : 100 000 requêtes/jour gratuites
- **DNS** : Résolution DNS gratuite
- **SSL** : Certificats SSL gratuits
- **CDN** : Cache edge gratuit

### Usage payant

Pour un trafic important :
- **Workers** : $5/mois pour 10M de requêtes
- **R2 Storage** : $0.015/Go/mois
- **D1 Database** : $5/mois pour 25M de requêtes

## ✅ Checklist de déploiement

### Pré-déploiement
- [ ] Compte Cloudflare configuré
- [ ] Domaine `fata.plus` géré par Cloudflare  
- [ ] Wrangler CLI installé et authentifié
- [ ] Variables d'environnement configurées
- [ ] Code MCP testé localement

### Déploiement
- [ ] Configuration DNS créée
- [ ] Worker déployé avec succès
- [ ] Domaine personnalisé ajouté
- [ ] Certificat SSL provisionné
- [ ] Tests de santé passés

### Post-déploiement  
- [ ] Configuration Claude Desktop mise à jour
- [ ] Tests d'intégration MCP réussis
- [ ] Monitoring configuré
- [ ] Documentation mise à jour
- [ ] Équipe informée des nouveaux endpoints

## 📞 Support

### Ressources utiles

- **Documentation Cloudflare** : [workers.cloudflare.com](https://workers.cloudflare.com)
- **Documentation MCP** : [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Wrangler CLI** : [developers.cloudflare.com/workers/wrangler/](https://developers.cloudflare.com/workers/wrangler/)

### Contact

- **Email technique** : tech-support@fataplus.com
- **Status page** : https://status.fata.plus
- **Discord** : [Serveur Discord Fataplus](https://discord.gg/fataplus)

---

## 🎉 Félicitations !

Votre serveur MCP Fataplus est maintenant déployé et accessible sur `mcp.fata.plus` ! 

Les utilisateurs peuvent maintenant se connecter au MCP via Claude Desktop en utilisant la configuration fournie dans ce guide.

---

*Guide de déploiement généré pour Fataplus MCP Server v1.0*