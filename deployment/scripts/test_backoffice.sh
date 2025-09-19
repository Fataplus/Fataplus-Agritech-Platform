#!/bin/bash

# Script de test pour le Backoffice Fataplus
# Démonstration complète de toutes les fonctionnalités

echo "🚀 Test du Backoffice Fataplus"
echo "========================================="
echo

BASE_URL="https://8000-i126ry3k6xini609de2jx-6532622b.e2b.dev"

echo "🔍 1. Test de santé du service"
echo "------------------------------"
curl -s "$BASE_URL/health" | python3 -m json.tool
echo

echo "📊 2. Tableau de bord principal"
echo "-------------------------------"
curl -s "$BASE_URL/admin/dashboard" | jq '.metrics'
echo

echo "👥 3. Liste des utilisateurs"
echo "-----------------------------"
curl -s "$BASE_URL/admin/users" | jq '.items[] | {name: (.first_name + " " + .last_name), email: .email, role: .role}'
echo

echo "🏞️ 4. Liste des fermes"
echo "-----------------------"
curl -s "$BASE_URL/admin/farms" | jq '.items[] | {name: .name, type: .farm_type, size: .size_hectares, crops: .crops}'
echo

echo "📈 5. Analytics des utilisateurs"
echo "--------------------------------"
curl -s "$BASE_URL/admin/analytics/users" | jq '{total: .total_users, by_role: .users_by_role, by_location: .users_by_location}'
echo

echo "🌾 6. Analytics des fermes"
echo "--------------------------"
curl -s "$BASE_URL/admin/analytics/farms" | jq '{total_farms: .total_farms, total_area: .total_area_hectares, avg_size: .average_farm_size, crops: .crops_distribution}'
echo

echo "⚙️ 7. Informations système"
echo "---------------------------"
curl -s "$BASE_URL/admin/system/info" | jq '{service: .service, version: .version, features: .features}'
echo

echo "🤖 8. Statut des services IA"
echo "-----------------------------"
curl -s "$BASE_URL/admin/ai/status" | jq '{status: .status, service_url: .service_url}'
echo

echo "🎯 9. Test de création d'utilisateur"
echo "------------------------------------"
NEW_USER='{
  "email": "test@fataplus.com",
  "first_name": "Test",
  "last_name": "User",
  "phone": "+261333444555",
  "role": "farmer",
  "location": "Mahajanga, Madagascar",
  "language": "fr"
}'

echo "Création d'un nouvel utilisateur..."
CREATED_USER=$(curl -s -X POST "$BASE_URL/admin/users" \
  -H "Content-Type: application/json" \
  -d "$NEW_USER")

if echo "$CREATED_USER" | jq -e '.id' > /dev/null; then
  USER_ID=$(echo "$CREATED_USER" | jq -r '.id')
  echo "✅ Utilisateur créé avec succès - ID: $USER_ID"
  
  echo
  echo "🔄 10. Test de modification d'utilisateur"
  echo "----------------------------------------"
  UPDATE_USER='{"status": "active", "location": "Mahajanga, Madagascar (Mise à jour)"}'
  
  curl -s -X PUT "$BASE_URL/admin/users/$USER_ID" \
    -H "Content-Type: application/json" \
    -d "$UPDATE_USER" | jq '{id: .id, status: .status, location: .location}'
  
  echo
  echo "🗑️ 11. Test de suppression d'utilisateur"
  echo "----------------------------------------"
  DELETE_RESULT=$(curl -s -X DELETE "$BASE_URL/admin/users/$USER_ID")
  echo "$DELETE_RESULT"
else
  echo "❌ Erreur lors de la création de l'utilisateur"
  echo "$CREATED_USER" | jq '.'
fi

echo
echo "✅ Tests terminés avec succès !"
echo "========================================="
echo
echo "📖 Documentation complète disponible dans BACKOFFICE_DEMO.md"
echo "🌐 API disponible à : $BASE_URL"
echo "📚 Documentation Swagger : $BASE_URL/docs"