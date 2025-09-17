#!/bin/bash

# Nettoyer le fichier wrangler.toml des caractères ANSI et duplications
cd /home/user/webapp/infrastructure/cloudflare

# Backup
cp wrangler.toml wrangler.toml.backup.$(date +%Y%m%d_%H%M%S)

# Nettoyer le fichier des caractères ANSI et reconstruire la fin
head -n 73 wrangler.toml > wrangler.toml.clean

cat >> wrangler.toml.clean << 'EOF'
binding = "AI"

# AutoRAG Configuration
[[vectorize]]
binding = "VECTORIZE_INDEX"
index_name = "fataplus-autorag"

# Staging Vectorize
[[env.staging.vectorize]]
binding = "VECTORIZE_INDEX"
index_name = "fataplus-autorag"
EOF

# Remplacer le fichier
mv wrangler.toml.clean wrangler.toml

echo "✅ wrangler.toml nettoyé"