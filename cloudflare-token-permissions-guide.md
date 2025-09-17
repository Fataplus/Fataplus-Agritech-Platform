# 🔑 Guide des Autorisations Token API Cloudflare

## 📋 Autorisations Recommandées pour Fataplus

### 🎯 **Option 1: Utiliser un Template Pré-configuré (RECOMMANDÉ)**

Dans la page de création de token, choisissez :
**"Edit Cloudflare Workers"** template

Cette option inclut automatiquement toutes les permissions nécessaires.

---

### ⚙️ **Option 2: Configuration Personnalisée**

Si vous préférez configurer manuellement, voici les autorisations exactes :

#### **🏢 Permissions Account (Compte)**
```
Account - Cloudflare Workers:Edit
Account - Account Settings:Read
Account - Page:Edit
Account - D1:Edit
Account - R2:Edit
Account - Stream:Edit (optionnel)
Account - Analytics:Read
```

#### **🌐 Permissions Zone (Domaine)**
```
Zone - Zone:Read
Zone - DNS:Edit
Zone - Page Rules:Edit (optionnel)
Zone - Cache Purge:Edit
```

#### **📊 Permissions User (Utilisateur)**
```
User - User Details:Read
```

---

## 🎯 **Configuration Étape par Étape**

### **Étape 1**: Aller à la création de token
- URL: https://dash.cloudflare.com/profile/api-tokens
- Cliquer sur **"Create Token"**

### **Étape 2**: Choisir le template
- Sélectionner **"Edit Cloudflare Workers"**
- OU cliquer **"Get started"** pour "Custom token"

### **Étape 3**: Vérifier les permissions
Si vous utilisez le template, vérifiez que ces permissions sont incluses :

#### **Account permissions:**
- ✅ `Cloudflare Workers:Edit`
- ✅ `Account Settings:Read`  
- ✅ `Page:Edit`
- ✅ `D1:Edit`
- ✅ `R2:Edit`

#### **Zone permissions:**
- ✅ `Zone:Read`
- ✅ `DNS:Edit`

### **Étape 4**: Configurer les restrictions (optionnel)
- **Account resources**: Inclure tous les comptes ou spécifier votre compte
- **Zone resources**: Inclure tous les domaines ou spécifier votre domaine

### **Étape 5**: Durée de vie du token
- Recommandé: **1 an** pour éviter les interruptions fréquentes
- Ou **Never expires** si c'est pour un environnement de développement

---

## 🔧 **Permissions Détaillées par Service**

### **Workers (API Backend)**
```
Account - Cloudflare Workers:Edit
```
**Pourquoi ?** Déployer et gérer les Workers pour votre API

### **Pages (Frontend)**  
```
Account - Page:Edit
Zone - Zone:Read
```
**Pourquoi ?** Déployer votre interface utilisateur

### **D1 (Base de données)**
```
Account - D1:Edit
```
**Pourquoi ?** Créer et gérer votre base de données

### **R2 (Stockage)**
```
Account - R2:Edit
```
**Pourquoi ?** Gérer le stockage de fichiers et modèles ML

### **DNS (Domaines)**
```
Zone - DNS:Edit
Zone - Zone:Read
```
**Pourquoi ?** Configurer vos domaines personnalisés

---

## ✅ **Validation des Permissions**

Après création du token, vous devriez pouvoir :

1. ✅ **Lister les ressources**
   ```bash
   wrangler kv:namespace list
   wrangler r2 bucket list  
   wrangler d1 list
   ```

2. ✅ **Déployer des services**
   ```bash
   wrangler deploy
   ```

3. ✅ **Gérer les domaines**
   ```bash
   wrangler whoami
   ```

---

## 🚨 **Erreurs Communes à Éviter**

### ❌ **Permissions Insuffisantes**
- Ne pas inclure `D1:Edit` → Impossible de gérer la base de données
- Ne pas inclure `R2:Edit` → Impossible de gérer le stockage
- Ne pas inclure `Page:Edit` → Impossible de déployer le frontend

### ❌ **Restrictions Trop Strictes**
- Restreindre à un seul domaine alors que vous en avez plusieurs
- Durée de vie trop courte → Token expire rapidement

### ❌ **Oublier les Permissions de Base**
- `Account Settings:Read` nécessaire pour `wrangler whoami`
- `Zone:Read` nécessaire pour lister les domaines

---

## 🎯 **Recommandation Finale**

**Pour Fataplus, utilisez le template "Edit Cloudflare Workers"** qui inclut automatiquement :

- ✅ Toutes les permissions Workers
- ✅ Permissions Pages  
- ✅ Permissions D1, R2, KV
- ✅ Permissions DNS et Zone
- ✅ Permissions Analytics

C'est la solution la plus simple et complète ! 🚀