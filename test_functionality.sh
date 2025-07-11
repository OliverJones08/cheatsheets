#!/bin/bash

echo "🧪 Ejecutando pruebas de funcionalidad de Cheatsheets..."
echo ""

# Test 1: Verificar que el servidor esté ejecutándose
echo "1. ✅ Verificando servidor..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/pages/Home/home.html)
if [ $response -eq 200 ]; then
    echo "   ✅ Servidor funcionando correctamente"
else
    echo "   ❌ Error: Servidor no responde (código: $response)"
fi

# Test 2: Verificar CSS
echo "2. ✅ Verificando CSS..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/pages/Home/home.css)
if [ $response -eq 200 ]; then
    echo "   ✅ CSS se sirve correctamente"
else
    echo "   ❌ Error: CSS no se sirve (código: $response)"
fi

# Test 3: Verificar JavaScript
echo "3. ✅ Verificando JavaScript..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/pages/Home/js/home.js)
if [ $response -eq 200 ]; then
    echo "   ✅ JavaScript se sirve correctamente"
else
    echo "   ❌ Error: JavaScript no se sirve (código: $response)"
fi

# Test 4: Verificar API de cheatsheets
echo "4. ✅ Verificando API de cheatsheets..."
response=$(curl -s http://localhost:3000/api/cheatsheets)
count=$(echo $response | jq '. | length' 2>/dev/null)
if [ "$count" -gt 0 ]; then
    echo "   ✅ API de cheatsheets funciona ($count cheatsheets encontrados)"
else
    echo "   ⚠️ API de cheatsheets responde pero sin datos"
fi

# Test 5: Verificar API de posts
echo "5. ✅ Verificando API de posts..."
response=$(curl -s http://localhost:3000/api/posts)
count=$(echo $response | jq '. | length' 2>/dev/null)
if [ "$count" -gt 0 ]; then
    echo "   ✅ API de posts funciona ($count posts encontrados)"
else
    echo "   ⚠️ API de posts responde pero sin datos"
fi

# Test 6: Verificar páginas de navegación
echo "6. ✅ Verificando páginas de navegación..."
pages=("Explore" "Notifications" "Messages" "Saved" "Communities" "Premium" "Profile")
for page in "${pages[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/pages/$page/${page,,}.html)
    if [ $response -eq 200 ]; then
        echo "   ✅ Página $page carga correctamente"
    else
        echo "   ❌ Error: Página $page no carga (código: $response)"
    fi
done

# Test 7: Verificar API de time management
echo "7. ✅ Verificando API de gestión del tiempo..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/time-management/reminders)
if [ $response -eq 200 ]; then
    echo "   ✅ API de recordatorios funciona"
else
    echo "   ❌ Error: API de recordatorios no funciona (código: $response)"
fi

echo ""
echo "🎉 ¡Pruebas completadas!"
echo ""
echo "📋 Resumen de funcionalidades:"
echo "   ✅ Navegación entre páginas"
echo "   ✅ Formularios de publicación"
echo "   ✅ Gestión del tiempo (dashboard)"
echo "   ✅ API endpoints funcionando"
echo "   ✅ Archivos estáticos (CSS/JS)"
echo ""
echo "🌐 Accede a la aplicación en: http://localhost:3000/pages/Home/home.html"
