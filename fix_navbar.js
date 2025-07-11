// Script para estandarizar las navbars
const fs = require('fs');
const path = require('path');

const standardNavbar = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}} - Cheatsheets</title>
    <link rel="stylesheet" href="/pages/Home/home.css">
</head>
<body role="application">
    <!-- Skip to main content para accesibilidad -->
    <a href="#main-content" class="skip-link">Saltar al contenido principal</a>

    <!-- Header móvil -->
    <header class="mobile-header" role="banner"> 
        <button 
            class="menu-toggle" 
            onclick="toggleSidebar()" 
            aria-label="Abrir menú de navegación"
            aria-expanded="false"
            aria-controls="sidebar">
            <span class="hamburger"></span>
            <span class="hamburger"></span>
            <span class="hamburger"></span>
        </button>
        <h1 class="logo-mobile">Cheatsheets</h1>
        <button class="post-btn-mobile" aria-label="Crear nueva publicación">
            <span class="sr-only">Crear</span>
            <span aria-hidden="true">✏️</span>
        </button>
    </header>

    <!-- Overlay para móvil -->
    <div class="overlay" id="overlay" onclick="closeSidebar()" aria-hidden="true"></div>

    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar" role="navigation" aria-label="Navegación principal">
        <div class="sidebar-content">
            <div class="logo" role="img" aria-label="Logo de Cheatsheets">Cheatsheets</div>
            
            <nav>
                <ul class="menu" role="menubar">
                    <li role="none">
                        <a href="/pages/Home/home.html" role="menuitem" class="menu-item {{HOME_ACTIVE}}">
                            <span class="icon" aria-hidden="true">🏠</span>
                            <span>Inicio</span>
                        </a>
                    </li>
                    <li role="none">
                        <a href="/pages/Explore/explore.html" role="menuitem" class="menu-item {{EXPLORE_ACTIVE}}">
                            <span class="icon" aria-hidden="true">🔍</span>
                            <span>Explorar</span>
                        </a>
                    </li>
                    <li role="none">
                        <a href="/pages/Notifications/notifications.html" role="menuitem" class="menu-item {{NOTIFICATIONS_ACTIVE}}">
                            <span class="icon" aria-hidden="true">🔔</span>
                            <span>Notificaciones</span>
                        </a>
                    </li>
                    <li role="none">
                        <a href="/pages/Messages/messages.html" role="menuitem" class="menu-item {{MESSAGES_ACTIVE}}">
                            <span class="icon" aria-hidden="true">💬</span>
                            <span>Mensajes</span>
                        </a>
                    </li>
                    <li role="none">
                        <a href="/pages/Saved/saved.html" role="menuitem" class="menu-item {{SAVED_ACTIVE}}">
                            <span class="icon" aria-hidden="true">📖</span>
                            <span>Guardados</span>
                        </a>
                    </li>
                    <li role="none">
                        <a href="/pages/Communities/communities.html" role="menuitem" class="menu-item {{COMMUNITIES_ACTIVE}}">
                            <span class="icon" aria-hidden="true">👥</span>
                            <span>Comunidades</span>
                        </a>
                    </li>
                    <li role="none">
                        <a href="/pages/Premium/premium.html" role="menuitem" class="menu-item {{PREMIUM_ACTIVE}}">
                            <span class="icon" aria-hidden="true">⭐</span>
                            <span>Premium</span>
                        </a>
                    </li>
                    <li role="none">
                        <a href="/pages/Profile/profile.html" role="menuitem" class="menu-item {{PROFILE_ACTIVE}}">
                            <span class="icon" aria-hidden="true">👤</span>
                            <span>Perfil</span>
                        </a>
                    </li>
                    <li role="none">
                        <a href="#" role="menuitem" class="menu-item">
                            <span class="icon" aria-hidden="true">⋯</span>
                            <span>Más</span>
                        </a>
                    </li>
                </ul>
            </nav>
            
            <button class="post-btn" aria-label="Crear nueva publicación">Publicar</button>
        </div>
        
        <div class="user-box" id="userBox" role="region" aria-label="Información del usuario"></div>
    </aside>

    <!-- Contenido principal -->
    <main class="main-content" id="main-content" role="main" tabindex="-1">`;

const standardJSFunctions = `
    <script>
        // Funciones para el sidebar móvil
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('overlay');
            const menuToggle = document.querySelector('.menu-toggle');
            
            if (sidebar && overlay && menuToggle) {
                const isOpen = sidebar.classList.contains('active');
                
                if (isOpen) {
                    closeSidebar();
                } else {
                    sidebar.classList.add('active');
                    overlay.classList.add('active');
                    menuToggle.setAttribute('aria-expanded', 'true');
                    document.body.style.overflow = 'hidden';
                }
            }
        }

        function closeSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('overlay');
            const menuToggle = document.querySelector('.menu-toggle');
            
            if (sidebar && overlay && menuToggle) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        }

        // Cerrar sidebar al hacer clic en un enlace del menú
        document.addEventListener('DOMContentLoaded', function() {
            const menuLinks = document.querySelectorAll('.menu-item');
            menuLinks.forEach(link => {
                link.addEventListener('click', function() {
                    // Solo cerrar en móvil
                    if (window.innerWidth <= 768) {
                        closeSidebar();
                    }
                });
            });

            // Cerrar sidebar al redimensionar la ventana
            window.addEventListener('resize', function() {
                if (window.innerWidth > 768) {
                    closeSidebar();
                }
            });
        });
    </script>`;

const pages = [
    { name: 'Messages', path: './pages/Messages/messages.html', title: 'Mensajes' },
    { name: 'Saved', path: './pages/Saved/saved.html', title: 'Guardados' },
    { name: 'Communities', path: './pages/Communities/communities.html', title: 'Comunidades' },
    { name: 'Premium', path: './pages/Premium/premium.html', title: 'Premium' },
    { name: 'Profile', path: './pages/Profile/profile.html', title: 'Perfil' }
];

function updatePage(pageInfo) {
    try {
        // Leer el archivo existente
        const content = fs.readFileSync(pageInfo.path, 'utf-8');
        
        // Encontrar donde empieza el contenido principal
        const mainContentStart = content.indexOf('<main class="main-content">');
        if (mainContentStart === -1) {
            console.log(`❌ No se encontró main-content en ${pageInfo.name}`);
            return;
        }
        
        // Extraer el contenido principal
        const mainContent = content.substring(mainContentStart);
        
        // Encontrar donde termina el contenido (antes de scripts o </body>)
        let endIndex = mainContent.indexOf('<script>');
        if (endIndex === -1) {
            endIndex = mainContent.indexOf('</body>');
        }
        if (endIndex === -1) {
            endIndex = mainContent.length;
        }
        
        const extractedMainContent = mainContent.substring(0, endIndex);
        
        // Crear la nueva navbar
        let newNavbar = standardNavbar.replace('{{TITLE}}', pageInfo.title);
        
        // Marcar como activo el elemento correspondiente
        newNavbar = newNavbar.replace('{{HOME_ACTIVE}}', pageInfo.name === 'Home' ? 'active" aria-current="page' : '');
        newNavbar = newNavbar.replace('{{EXPLORE_ACTIVE}}', pageInfo.name === 'Explore' ? 'active" aria-current="page' : '');
        newNavbar = newNavbar.replace('{{NOTIFICATIONS_ACTIVE}}', pageInfo.name === 'Notifications' ? 'active" aria-current="page' : '');
        newNavbar = newNavbar.replace('{{MESSAGES_ACTIVE}}', pageInfo.name === 'Messages' ? 'active" aria-current="page' : '');
        newNavbar = newNavbar.replace('{{SAVED_ACTIVE}}', pageInfo.name === 'Saved' ? 'active" aria-current="page' : '');
        newNavbar = newNavbar.replace('{{COMMUNITIES_ACTIVE}}', pageInfo.name === 'Communities' ? 'active" aria-current="page' : '');
        newNavbar = newNavbar.replace('{{PREMIUM_ACTIVE}}', pageInfo.name === 'Premium' ? 'active" aria-current="page' : '');
        newNavbar = newNavbar.replace('{{PROFILE_ACTIVE}}', pageInfo.name === 'Profile' ? 'active" aria-current="page' : '');
        
        // Crear el nuevo contenido completo
        const newContent = newNavbar + '\n' + extractedMainContent + standardJSFunctions + '\n</body>\n</html>';
        
        // Escribir el archivo actualizado
        fs.writeFileSync(pageInfo.path, newContent, 'utf-8');
        console.log(`✅ ${pageInfo.name} actualizado correctamente`);
        
    } catch (error) {
        console.error(`❌ Error actualizando ${pageInfo.name}:`, error.message);
    }
}

// Actualizar todas las páginas
console.log('🔧 Actualizando navbars de todas las páginas...\n');
pages.forEach(updatePage);
console.log('\n🎉 ¡Actualización de navbars completada!');
