#!/bin/bash

echo "🚀 Updating Cloudron deployment to match local setup..."

# Set working directory
cd "/Users/fefe/Documents/Documents - MacBook Pro de Fenohery/Fataplus-Cloudron R&D/FP-09"

# Build the new Docker image
echo "📦 Building Docker image..."
docker build -f Dockerfile.cloudron -t fataplus-local-cloudron .

# Package for Cloudron
echo "📋 Creating Cloudron package..."
rm -rf fataplus-package
mkdir -p fataplus-package

# Copy necessary files
cp Dockerfile.cloudron fataplus-package/Dockerfile
cp local-server.js fataplus-package/
cp CloudronManifest.json fataplus-package/
cp icon.png fataplus-package/ 2>/dev/null || echo "Warning: icon.png not found"

# Create a simple start.sh script for Cloudron
cat > fataplus-package/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Fataplus AgriTech Platform (Cloudron)..."
exec node local-server.js
EOF

chmod +x fataplus-package/start.sh

# Package everything
echo "📦 Creating package archive..."
cd fataplus-package
tar -czf ../fataplus-local.tar.gz *
cd ..

echo "✅ Package created: fataplus-local.tar.gz"

# Uninstall existing app and install new one
echo "🔄 Updating Cloudron deployment..."

# First, try to uninstall the existing app
echo "Removing existing deployment..."
cloudron uninstall --app 6ed59bcd-e1ac-49be-bf44-073d34604eaa --force 2>/dev/null || echo "App removal skipped"

# Wait a moment for cleanup
sleep 5

# Install new version using the package
echo "Installing updated version..."
cloudron install --package fataplus-local.tar.gz --location app.yourdomain.com

echo "🎉 Cloudron update complete!"
echo "📍 Access your platform at: https://app.yourdomain.com"
echo "🏥 Health check: https://platform.fata.plus/health"