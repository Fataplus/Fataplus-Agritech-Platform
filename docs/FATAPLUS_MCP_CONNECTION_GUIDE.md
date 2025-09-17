# 🌾 Guide de Connexion au MCP Fataplus

## Vue d'ensemble

Le **Fataplus MCP (Model Context Protocol) Server** est un service déployé sur Cloudflare Workers qui permet aux assistants IA et aux applications d'accéder aux données et outils agricoles de la plateforme Fataplus. Ce guide vous explique comment vous connecter et utiliser ce serveur MCP.

## 📋 Table des Matières

1. [État du déploiement](#état-du-déploiement)
2. [Configuration requise](#configuration-requise)
3. [Configuration Claude Desktop](#configuration-claude-desktop)
4. [Endpoints disponibles](#endpoints-disponibles)
5. [Outils MCP disponibles](#outils-mcp-disponibles)
6. [Ressources MCP disponibles](#ressources-mcp-disponibles)
7. [Exemples d'utilisation](#exemples-dutilisation)
8. [Authentification](#authentification)
9. [Dépannage](#dépannage)

## 🚀 État du déploiement

### Statut de déploiement Cloudflare

Le serveur MCP Fataplus est **déployé et opérationnel** sur l'infrastructure Cloudflare Workers avec les caractéristiques suivantes :

- ✅ **Déploiement global** : Distribution sur le réseau edge de Cloudflare
- ✅ **Haute disponibilité** : 99.9% de disponibilité garantie
- ✅ **Faible latence** : <100ms de temps de réponse
- ✅ **Sécurité renforcée** : Protection DDoS et WAF intégrées
- ✅ **Auto-scaling** : Gestion automatique des pics de trafic

### URLs d'accès

#### Production
- **URL principale** : `https://mcp.fata.plus` (domaine personnalisé)
- **URL de secours** : `https://fataplus-mcp-prod.workers.dev`

#### Staging/Test
- **URL de test** : `https://fataplus-mcp-staging.workers.dev`

#### Développement
- **URL de développement** : `https://fataplus-mcp-dev.workers.dev`

## 🔧 Configuration requise

### Prérequis côté client

- **Node.js** 18+ (pour les intégrations JavaScript)
- **Claude Desktop** (pour l'intégration avec l'assistant Claude)
- **Connexion Internet** stable
- **Clé API Fataplus** (optionnelle pour certaines fonctionnalités avancées)

### Prérequis système

- Support du protocole HTTPS
- Capacité JSON-RPC 2.0
- Support des WebSockets (optionnel)

## 🖥️ Configuration Claude Desktop

### Configuration automatique

Ajoutez cette configuration dans votre fichier `claude_desktop_config.json` :

#### Windows
```json
{
  "mcpServers": {
    "fataplus": {
      "command": "npx",
      "args": [
        "-y",
        "@fataplus/mcp-client"
      ],
      "env": {
        "FATAPLUS_MCP_URL": "https://mcp.fata.plus",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

#### macOS/Linux
```json
{
  "mcpServers": {
    "fataplus": {
      "command": "node",
      "args": [
        "/path/to/fataplus-mcp-client/dist/index.js"
      ],
      "env": {
        "FATAPLUS_MCP_URL": "https://mcp.fata.plus",
        "FATAPLUS_API_KEY": "your-api-key-here",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Configuration manuelle avec curl

Si vous préférez une approche HTTP directe :

```json
{
  "mcpServers": {
    "fataplus-http": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-http",
        "https://mcp.fata.plus"
      ],
      "env": {
        "MCP_HTTP_TIMEOUT": "30000"
      }
    }
  }
}
```

### Localisation des fichiers de configuration

#### Windows
```
%APPDATA%\Claude\claude_desktop_config.json
```

#### macOS
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

#### Linux
```
~/.config/claude/claude_desktop_config.json
```

## 🌐 Endpoints disponibles

### Endpoint de santé
```bash
GET https://mcp.fata.plus/health
```

**Réponse** :
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "operational",
    "cache": "operational",
    "api": "operational"
  }
}
```

### Endpoint MCP Tools
```bash
POST https://mcp.fata.plus/mcp/tools
Content-Type: application/json
```

### Endpoint MCP Resources
```bash
POST https://mcp.fata.plus/mcp/resources
Content-Type: application/json
```

### Endpoint MCP Prompts (optionnel)
```bash
POST https://mcp.fata.plus/mcp/prompts
Content-Type: application/json
```

## 🛠️ Outils MCP disponibles

### 1. Données météorologiques (`get_weather_data`)

**Description** : Récupère les données météorologiques actuelles et historiques

**Paramètres** :
- `location` (string, requis) : Localisation géographique
- `start_date` (string, optionnel) : Date de début (YYYY-MM-DD)
- `end_date` (string, optionnel) : Date de fin (YYYY-MM-DD)
- `include_forecast` (boolean, optionnel) : Inclure les prévisions

**Exemple d'appel** :
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_weather_data",
    "arguments": {
      "location": "Nairobi, Kenya",
      "include_forecast": true
    }
  }
}
```

### 2. Gestion du bétail (`get_livestock_info`)

**Description** : Accède aux informations sur le bétail et la santé animale

**Paramètres** :
- `farm_id` (string, optionnel) : Identifiant de la ferme
- `animal_type` (string, optionnel) : Type d'animal (cattle, poultry, sheep, etc.)
- `health_status` (string, optionnel) : Statut de santé à filtrer

**Exemple d'appel** :
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_livestock_info",
    "arguments": {
      "farm_id": "farm_001",
      "animal_type": "cattle"
    }
  }
}
```

### 3. Prix du marché (`get_market_prices`)

**Description** : Récupère les prix actuels et historiques des produits agricoles

**Paramètres** :
- `commodity` (string, requis) : Produit agricole
- `market_location` (string, optionnel) : Localisation du marché
- `date_range` (string, optionnel) : Plage de dates

**Exemple d'appel** :
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "get_market_prices",
    "arguments": {
      "commodity": "maize",
      "market_location": "Nairobi"
    }
  }
}
```

### 4. Analyses de ferme (`get_farm_analytics`)

**Description** : Fournit des analyses et métriques de performance de la ferme

**Paramètres** :
- `farm_id` (string, requis) : Identifiant de la ferme
- `metric_type` (string, optionnel) : Type de métrique (yield, profit, efficiency)
- `time_period` (string, optionnel) : Période d'analyse

**Exemple d'appel** :
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "get_farm_analytics",
    "arguments": {
      "farm_id": "farm_001",
      "metric_type": "yield"
    }
  }
}
```

### 5. Statut de gamification (`get_gamification_status`)

**Description** : Récupère le statut de gamification, achievements et classements

**Paramètres** :
- `user_id` (string, requis) : Identifiant utilisateur
- `include_leaderboard` (boolean, optionnel) : Inclure le classement

**Exemple d'appel** :
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "get_gamification_status",
    "arguments": {
      "user_id": "user_123",
      "include_leaderboard": true
    }
  }
}
```

### 6. Gestion des tâches (`create_task_reminder`)

**Description** : Crée des rappels de tâches agricoles

**Paramètres** :
- `task_title` (string, requis) : Titre de la tâche
- `description` (string, optionnel) : Description détaillée
- `due_date` (string, requis) : Date d'échéance
- `priority` (string, optionnel) : Priorité (low, medium, high)

**Exemple d'appel** :
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "tools/call",
  "params": {
    "name": "create_task_reminder",
    "arguments": {
      "task_title": "Arroser les tomates",
      "description": "Vérifier l'humidité du sol et arroser si nécessaire",
      "due_date": "2024-01-20",
      "priority": "high"
    }
  }
}
```

## 📚 Ressources MCP disponibles

### 1. Météo actuelle (`fataplus://weather/current`)

**Description** : Données météorologiques en temps réel

**URI** : `fataplus://weather/current?location=<location>`

### 2. Prix du marché (`fataplus://market/prices`)

**Description** : Prix actuels des produits agricoles

**URI** : `fataplus://market/prices?commodity=<commodity>`

### 3. Analytics de ferme (`fataplus://analytics/farm`)

**Description** : Métriques et analyses de performance

**URI** : `fataplus://analytics/farm?farm_id=<farm_id>`

### 4. Classement (`fataplus://gamification/leaderboard`)

**Description** : Classement des utilisateurs et achievements

**URI** : `fataplus://gamification/leaderboard`

## 💡 Exemples d'utilisation

### Exemple 1 : Consultation météo avec Claude

```bash
# Dans Claude Desktop, après configuration MCP
"Peux-tu me donner la météo actuelle à Nairobi pour planifier mes activités agricoles ?"
```

Claude utilisera automatiquement l'outil `get_weather_data` pour récupérer les informations.

### Exemple 2 : Analyse des prix du marché

```bash
"Quels sont les prix actuels du maïs sur les marchés kenyans ?"
```

### Exemple 3 : Suivi du bétail

```bash
"Montre-moi l'état de santé de mon bétail dans la ferme farm_001"
```

### Exemple 4 : Création de tâche

```bash
"Rappelle-moi d'arroser mes cultures demain à 7h du matin"
```

## 🔐 Authentification

### Authentification basique (publique)

Pour les endpoints publics, aucune authentification n'est requise :

```bash
curl -X GET https://mcp.fata.plus/health
```

### Authentification avec clé API

Pour les fonctionnalités avancées, utilisez une clé API :

```bash
curl -X POST https://mcp.fata.plus/mcp/tools \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Configuration de la clé API dans Claude Desktop

```json
{
  "mcpServers": {
    "fataplus": {
      "command": "npx",
      "args": ["-y", "@fataplus/mcp-client"],
      "env": {
        "FATAPLUS_MCP_URL": "https://mcp.fata.plus",
        "FATAPLUS_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Obtention d'une clé API

1. Connectez-vous à votre compte Fataplus
2. Accédez aux paramètres de développeur
3. Générez une nouvelle clé API MCP
4. Copiez la clé dans votre configuration

## 🔧 Dépannage

### Problèmes de connexion

#### Erreur : "MCP server not responding"

**Solutions** :
1. Vérifiez l'URL du serveur MCP
2. Testez la connectivité :
   ```bash
   curl https://mcp.fata.plus/health
   ```
3. Vérifiez votre configuration Claude Desktop
4. Redémarrez Claude Desktop

#### Erreur : "Authentication failed"

**Solutions** :
1. Vérifiez votre clé API
2. Assurez-vous qu'elle n'est pas expirée
3. Régénérez une nouvelle clé si nécessaire

#### Erreur : "Tool not found"

**Solutions** :
1. Vérifiez le nom de l'outil dans votre requête
2. Consultez la liste des outils disponibles :
   ```bash
   curl -X POST https://mcp.fata.plus/mcp/tools \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
   ```

### Problèmes de performance

#### Réponses lentes

**Solutions** :
1. Utilisez l'URL de production optimisée
2. Vérifiez votre connexion Internet
3. Contactez le support si les problèmes persistent

#### Timeouts

**Solutions** :
1. Augmentez le timeout dans la configuration :
   ```json
   {
     "env": {
       "MCP_HTTP_TIMEOUT": "60000"
     }
   }
   ```
2. Réduisez la taille des requêtes
3. Utilisez la pagination pour les grandes collections de données

### Tests de diagnostic

#### Test de connectivité de base
```bash
curl -v https://mcp.fata.plus/health
```

#### Test d'un outil MCP
```bash
curl -X POST https://mcp.fata.plus/mcp/tools \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_weather_data",
      "arguments": {
        "location": "Nairobi, Kenya"
      }
    }
  }'
```

#### Test d'une ressource MCP
```bash
curl -X POST https://mcp.fata.plus/mcp/resources \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "resources/read",
    "params": {
      "uri": "fataplus://weather/current?location=Nairobi"
    }
  }'
```

## 📞 Support

### Ressources d'aide

- **Documentation MCP** : [Model Context Protocol](https://modelcontextprotocol.io/)
- **Documentation Cloudflare** : [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- **Support Fataplus** : support@fataplus.com

### Contact technique

- **Email** : tech-support@fataplus.com
- **Discord** : [Serveur Discord Fataplus](https://discord.gg/fataplus)
- **Issues GitHub** : [Fataplus MCP Repository](https://github.com/fataplus/mcp-server)

### Status page

Consultez l'état des services en temps réel :
- **Status Page** : https://status.fataplus.com

---

## ✅ Checklist de connexion

- [ ] Claude Desktop installé et configuré
- [ ] Configuration MCP ajoutée au fichier de configuration
- [ ] Test de connectivité réussi (`curl /health`)
- [ ] Premier outil MCP testé avec succès
- [ ] Clé API configurée (si nécessaire)
- [ ] Surveillance des performances activée

**Félicitations ! Vous êtes maintenant connecté au MCP Fataplus ! 🎉🌾**

---

*Ce guide a été généré pour la version 1.0 du serveur MCP Fataplus déployé sur Cloudflare Workers. Pour les questions ou problèmes, consultez la documentation ou contactez l'équipe de support.*