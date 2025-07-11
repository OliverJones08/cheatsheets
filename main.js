// Variables globales
const userBox = document.getElementById("userBox");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const menuToggle = document.querySelector(".menu-toggle");
const postTextarea = document.getElementById("post-textarea");
const charCount = document.getElementById("char-count");
const postSubmit = document.querySelector(".post-submit");

// Estado de la aplicación
let isLoggedIn = false;
let sidebarOpen = false;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    updateUserBox();
    setupEventListeners();
    updateCharCount();
});

// Configurar event listeners
function setupEventListeners() {
    // Textarea de publicación
    if (postTextarea) {
        postTextarea.addEventListener('input', updateCharCount);
        postTextarea.addEventListener('input', updatePostButton);
    }

    // Cerrar sidebar con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebarOpen) {
            closeSidebar();
        }
    });

    // Navegación por teclado en el menú
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach((item, index) => {
        item.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextItem = menuItems[index + 1] || menuItems[0];
                nextItem.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevItem = menuItems[index - 1] || menuItems[menuItems.length - 1];
                prevItem.focus();
            }
        });
    });

    // Redimensionar ventana
    window.addEventListener('resize', handleResize);
}

// Actualizar información del usuario
function updateUserBox() {
    if (isLoggedIn) {
        userBox.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center;">
                    <img src="/placeholder.svg?height=40&width=40" alt="Avatar del usuario" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 12px;">
                    <div>
                        <p style="font-weight: bold; margin-bottom: 2px; color: #fff;">John Doe</p>
                        <p style="font-size: 14px; color: #71767b;">@usuario_logueado</p>
                    </div>
                </div>
                <button onclick="logout()" style="background: none; border: none; color: #71767b; cursor: pointer; padding: 8px; border-radius: 50%; transition: background-color 0.2s;" aria-label="Opciones de usuario">⋯</button>
            </div>
        `;
    } else {
        userBox.innerHTML = `
            <div style="text-align: center;">
                <p style="margin-bottom: 12px; color: #71767b;">No has iniciado sesión</p>
                <button onclick="login()" style="background-color: #1DA1F2; border: none; color: #fff; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: bold; transition: background-color 0.2s;">Iniciar sesión</button>
            </div>
        `;
    }
}

// Funciones de autenticación
function login() {
    isLoggedIn = true;
    updateUserBox();
    showNotification("¡Sesión iniciada correctamente!");
}

function logout() {
    isLoggedIn = false;
    updateUserBox();
    showNotification("Sesión cerrada correctamente");
}

// Funciones del menú móvil
function toggleSidebar() {
    if (sidebarOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('show');
    menuToggle.classList.add('active');
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    sidebarOpen = true;
    
    // Focus en el primer elemento del menú
    const firstMenuItem = sidebar.querySelector('.menu-item');
    if (firstMenuItem) {
        firstMenuItem.focus();
    }
}

function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
    menuToggle.classList.remove('active');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = 'auto';
    sidebarOpen = false;
    
    // Devolver focus al botón de menú
    menuToggle.focus();
}

// Manejar redimensionamiento
function handleResize() {
    if (window.innerWidth > 768 && sidebarOpen) {
        closeSidebar();
    }
}

// Contador de caracteres
function updateCharCount() {
    if (!postTextarea || !charCount) return;
    
    const currentLength = postTextarea.value.length;
    const maxLength = 280;
    const remaining = maxLength - currentLength;
    
    charCount.textContent = remaining;
    
    // Cambiar color según caracteres restantes
    charCount.className = 'char-count';
    if (remaining < 20) {
        charCount.classList.add('warning');
    }
    if (remaining < 0) {
        charCount.classList.add('error');
    }
    
    // Anunciar cambios para lectores de pantalla
    if (remaining === 20) {
        announceToScreenReader("Quedan 20 caracteres");
    } else if (remaining === 0) {
        announceToScreenReader("Límite de caracteres alcanzado");
    }
}

// Actualizar estado del botón de publicar
function updatePostButton() {
    if (!postTextarea || !postSubmit) return;
    
    const hasContent = postTextarea.value.trim().length > 0;
    const withinLimit = postTextarea.value.length <= 280;
    
    postSubmit.disabled = !hasContent || !withinLimit;
}

// Manejar envío de publicación
function handlePostSubmit(event) {
    event.preventDefault();
    
    if (!postTextarea) return;
    
    const content = postTextarea.value.trim();
    
    if (content && content.length <= 280) {
        // Simular envío
        showNotification("¡Publicación enviada!");
        postTextarea.value = '';
        updateCharCount();
        updatePostButton();
        
        // Agregar la publicación al feed (simulado)
        addPostToFeed(content);
    }
}

// Agregar publicación al feed
function addPostToFeed(content) {
    const postsContainer = document.querySelector('.posts');
    if (!postsContainer) return;
    
    const newPost = document.createElement('article');
    newPost.className = 'post';
    newPost.role = 'article';
    
    newPost.innerHTML = `
        <header class="post-header">
            <img src="/placeholder.svg?height=48&width=48" alt="Tu avatar" class="user-avatar">
            <div class="user-info">
                <h3 class="username">${isLoggedIn ? 'Tú' : 'Usuario'}</h3>
                <span class="handle">@${isLoggedIn ? 'usuario_logueado' : 'usuario'}</span>
                <span class="timestamp" aria-label="Publicado ahora">ahora</span>
            </div>
        </header>
        
        <div class="post-content">
            <p>${escapeHtml(content)}</p>
        </div>
        
        <footer class="post-actions-bar" role="toolbar" aria-label="Acciones de publicación">
            <button class="action-btn" aria-label="Comentar">
                <span aria-hidden="true">💬</span>
                <span>0</span>
            </button>
            <button class="action-btn" aria-label="Retwittear">
                <span aria-hidden="true">🔄</span>
                <span>0</span>
            </button>
            <button class="action-btn" aria-label="Me gusta">
                <span aria-hidden="true">❤️</span>
                <span>0</span>
            </button>
            <button class="action-btn" aria-label="Compartir">
                <span aria-hidden="true">📤</span>
            </button>
        </footer>
    `;
    
    // Insertar al principio del feed
    postsContainer.insertBefore(newPost, postsContainer.firstChild);
    
    // Configurar event listeners para los nuevos botones
    setupPostActionListeners(newPost);
}

// Configurar listeners para acciones de posts
function setupPostActionListeners(postElement) {
    const actionButtons = postElement.querySelectorAll('.action-btn');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const action = this.getAttribute('aria-label');
            handlePostAction(action, this);
        });
    });
}

// Manejar acciones de posts
function handlePostAction(action, button) {
    const countSpan = button.querySelector('span:last-child');
    
    if (action.includes('Me gusta')) {
        const currentCount = parseInt(countSpan.textContent) || 0;
        countSpan.textContent = currentCount + 1;
        button.style.color = '#f91880';
        showNotification("¡Te gusta esta publicación!");
    } else if (action.includes('Retwittear')) {
        const currentCount = parseInt(countSpan.textContent) || 0;
        countSpan.textContent = currentCount + 1;
        button.style.color = '#00ba7c';
        showNotification("¡Publicación retwitteada!");
    } else if (action.includes('Comentar')) {
        showNotification("Función de comentarios próximamente");
    } else if (action.includes('Compartir')) {
        showNotification("Función de compartir próximamente");
    }
}

// Mostrar notificaciones
function showNotification(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #1DA1F2;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Anunciar a lectores de pantalla
    announceToScreenReader(message);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Anunciar a lectores de pantalla
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Configurar listeners para posts existentes
document.addEventListener('DOMContentLoaded', function() {
    const existingPosts = document.querySelectorAll('.post');
    existingPosts.forEach(setupPostActionListeners);
});

// Manejar clicks en enlaces del menú
document.addEventListener('click', function(e) {
    if (e.target.closest('.menu-item')) {
        e.preventDefault();
        const menuItem = e.target.closest('.menu-item');
        const text = menuItem.textContent.trim();
        
        // Remover clase active de todos los elementos
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
            item.removeAttribute('aria-current');
        });
        
        // Agregar clase active al elemento clickeado
        menuItem.classList.add('active');
        menuItem.setAttribute('aria-current', 'page');
        
        showNotification(`Navegando a ${text}`);
        
        // Cerrar sidebar en móvil
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    }
});

// Backend Express
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const storage = require('./storage');
const threadRoutes = require('./routes/threadRoutes');
const userRoutes = require('./routes/userRoutes');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3000;

// Configuración de Multer para subir archivos a /uploads
const uploadConfig = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: uploadConfig });

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'pages')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(session({
    secret: 'cheatsheets-secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth config
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'GOOGLE_CLIENT_ID_HERE',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'GOOGLE_CLIENT_SECRET_HERE',
    callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    let user = users.find(u => u.googleId === profile.id);
    if (!user) {
        user = { username: profile.displayName, googleId: profile.id, notifications: [] };
        users.push(user);
        saveAll();
    }
    return done(null, user);
}));

passport.serializeUser((user, done) => {
    done(null, user.googleId || user.username);
});
passport.deserializeUser((id, done) => {
    let user = users.find(u => u.googleId === id || u.username === id);
    done(null, user);
});

// Google Auth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));
app.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: '/pages/Login/views/login.html',
    successRedirect: '/pages/Home/views/home.html'
}));

// Persistent users and cheatsheets
let users = storage.loadUsers();
let cheatsheets = storage.loadCheatsheets();

function saveAll() {
    storage.saveUsers(users);
    storage.saveCheatsheets(cheatsheets);
}

// API: Register
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Faltan campos' });
    if (users.find(u => u.username === username)) return res.status(400).json({ error: 'Usuario ya existe' });
    const hash = await bcrypt.hash(password, 10);
    const user = { username, password: hash, notifications: [] };
    users.push(user);
    saveAll();
    req.session.user = username;
    res.json({ username });
});

// API: Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Contraseña incorrecta' });
    req.session.user = username;
    res.json({ username });
});

// API: Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
});

// Middleware: require login
function requireLogin(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
    next();
}

// API: Obtener cheatsheets (con filtro por tema o título)
app.get('/api/cheatsheets', (req, res) => {
    const { search } = req.query;
    let filtered = cheatsheets;
    if (search) {
        const s = search.toLowerCase();
        filtered = cheatsheets.filter(cs =>
            cs.title.toLowerCase().includes(s) ||
            cs.theme.toLowerCase().includes(s)
        );
    }
    res.json(filtered);
});

// API: Subir cheatsheet (solo autenticado)
app.post('/api/cheatsheets', requireLogin, upload.single('file'), (req, res) => {
    const { title, theme, description } = req.body;
    if (!req.file || !title || !theme || !description) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    const cheatsheet = {
        id: Date.now().toString(),
        title,
        theme,
        description,
        fileUrl,
        likes: 0,
        likedBy: [],
        comments: [],
        createdAt: new Date().toISOString(),
        user: req.session.user
    };
    cheatsheets.push(cheatsheet);
    saveAll();
    res.status(201).json({ message: 'Cheatsheet subida', cheatsheet });
});

// API: Like a cheatsheet (solo autenticado, una vez por usuario)
app.post('/api/cheatsheets/:id/like', requireLogin, (req, res) => {
    const cs = cheatsheets.find(c => c.id === req.params.id);
    if (!cs) return res.status(404).json({ error: 'No encontrado' });
    if (cs.likedBy.includes(req.session.user)) return res.status(400).json({ error: 'Ya le diste like' });
    cs.likes++;
    cs.likedBy.push(req.session.user);
    // Notificación
    if (cs.user && cs.user !== req.session.user) {
        const owner = users.find(u => u.username === cs.user);
        if (owner) {
            owner.notifications.push({
                type: 'like',
                from: req.session.user,
                cheatsheetId: cs.id,
                date: new Date().toISOString()
            });
            // Enviar notificación en tiempo real
            sendRealTimeNotification(cs.user, {
                type: 'like',
                from: req.session.user,
                cheatsheetId: cs.id,
                date: new Date().toISOString()
            });
        }
    }
    saveAll();
    res.json({ likes: cs.likes });
});

// API: Comentar cheatsheet (solo autenticado)
app.post('/api/cheatsheets/:id/comment', requireLogin, (req, res) => {
    const cs = cheatsheets.find(c => c.id === req.params.id);
    if (!cs) return res.status(404).json({ error: 'No encontrado' });
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Comentario vacío' });
    const comment = { text, user: req.session.user, date: new Date().toISOString() };
    cs.comments.push(comment);
    // Notificación
    if (cs.user && cs.user !== req.session.user) {
        const owner = users.find(u => u.username === cs.user);
        if (owner) {
            owner.notifications.push({
                type: 'comment',
                from: req.session.user,
                cheatsheetId: cs.id,
                text,
                date: new Date().toISOString()
            });
            // Enviar notificación en tiempo real
            sendRealTimeNotification(cs.user, {
                type: 'comment',
                from: req.session.user,
                cheatsheetId: cs.id,
                text,
                date: new Date().toISOString()
            });
        }
    }
    saveAll();
    res.json({ comments: cs.comments });
});

// API: Obtener notificaciones (solo autenticado)
app.get('/api/notifications', requireLogin, (req, res) => {
    const user = users.find(u => u.username === req.session.user);
    if (!user) return res.status(404).json({ error: 'No encontrado' });
    res.json(user.notifications || []);
});

// API: Marcar notificaciones como leídas
app.post('/api/notifications/read', requireLogin, (req, res) => {
    const user = users.find(u => u.username === req.session.user);
    if (user) user.notifications = [];
    saveAll();
    res.json({ ok: true });
});

// Socket.IO real-time notifications
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('authenticate', (username) => {
        connectedUsers.set(username, socket.id);
        socket.username = username;
        console.log(`User ${username} authenticated`);
    });
    
    socket.on('disconnect', () => {
        if (socket.username) {
            connectedUsers.delete(socket.username);
            console.log(`User ${socket.username} disconnected`);
        }
    });
});

// Helper function to send real-time notification
function sendRealTimeNotification(username, notification) {
    const socketId = connectedUsers.get(username);
    if (socketId) {
        io.to(socketId).emit('notification', notification);
    }
}

// Hacer sendRealTimeNotification global
global.sendRealTimeNotification = sendRealTimeNotification;

// Rutas de la API
app.use('/api/threads', threadRoutes);
app.use('/api/users', userRoutes);

// Iniciar servidor
server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});