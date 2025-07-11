#!/bin/bash

echo "🔧 Probando funcionalidad de la navbar en todas las páginas..."
echo ""

# Array de páginas para probar
pages=(
    "Home/home.html"
    "Explore/explore.html"
    "Notifications/notifications.html"
    "Messages/messages.html"
    "Saved/saved.html"
    "Communities/communities.html"
    "Premium/premium.html"
    "Profile/profile.html"
)

# URL base
base_url="http://localhost:3000/pages"

echo "📋 Verificando que todas las páginas respondan correctamente:"
echo ""

for page in "${pages[@]}"; do
    url="$base_url/$page"
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status_code" = "200" ]; then
        echo "✅ $page - OK ($status_code)"
    else
        echo "❌ $page - ERROR ($status_code)"
    fi
done

echo ""
echo "📋 Verificando que todas las páginas tengan funciones de navbar:"
echo ""

for page in "${pages[@]}"; do
    url="$base_url/$page"
    has_toggle=$(curl -s "$url" | grep -q "toggleSidebar" && echo "✅" || echo "❌")
    has_css=$(curl -s "$url" | grep -q "home.css" && echo "✅" || echo "❌")
    has_main_js=$(curl -s "$url" | grep -q "main.js" && echo "✅" || echo "❌")
    
    echo "$page:"
    echo "  - toggleSidebar: $has_toggle"
    echo "  - CSS: $has_css"
    echo "  - main.js: $has_main_js"
    echo ""
done

echo "🎉 Prueba de funcionalidad completada!"
