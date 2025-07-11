// Backend Server with Scheduling Features
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { createServer } = require('http');
const { Server } = require('socket.io');
const fs = require('fs');

const storage = require('./storage');
const threadRoutes = require('./routes/threadRoutes');
const userRoutes = require('./routes/userRoutes');
const timeManagementRoutes = require('./routes/timeManagementRoutes');
const PostScheduler = require('./utils/postScheduler');
const TimeManagementService = require('./utils/timeManagementService');
const { router: schedulingRoutes, setPostScheduler } = require('./routes/schedulingRoutes');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3000;

// Initialize post scheduler
const postScheduler = new PostScheduler();
setPostScheduler(postScheduler);

// Initialize time management service
const timeManagementService = new TimeManagementService();

// Make services available globally
global.postScheduler = postScheduler;
global.timeManagementService = timeManagementService;

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
app.use(express.static(path.join(__dirname)));
app.use('/pages', express.static(path.join(__dirname, 'pages')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/utils', express.static(path.join(__dirname, 'utils')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));

// Middleware específico para archivos CSS y JS en páginas
app.use('/pages/Home', express.static(path.join(__dirname, 'pages', 'Home')));
app.use('/pages/Explore', express.static(path.join(__dirname, 'pages', 'Explore')));
app.use('/pages/Notifications', express.static(path.join(__dirname, 'pages', 'Notifications')));
app.use('/pages/Messages', express.static(path.join(__dirname, 'pages', 'Messages')));
app.use('/pages/Saved', express.static(path.join(__dirname, 'pages', 'Saved')));
app.use('/pages/Communities', express.static(path.join(__dirname, 'pages', 'Communities')));
app.use('/pages/Premium', express.static(path.join(__dirname, 'pages', 'Premium')));
app.use('/pages/Profile', express.static(path.join(__dirname, 'pages', 'Profile')));
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
        user = { 
            username: profile.displayName, 
            googleId: profile.id, 
            notifications: [],
            createdAt: new Date().toISOString(),
            timeZone: 'UTC'
        };
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
    const { username, password, timeZone } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Faltan campos' });
    if (users.find(u => u.username === username)) return res.status(400).json({ error: 'Usuario ya existe' });
    const hash = await bcrypt.hash(password, 10);
    const user = { 
        username, 
        password: hash, 
        notifications: [],
        createdAt: new Date().toISOString(),
        timeZone: timeZone || 'UTC'
    };
    users.push(user);
    saveAll();
    req.session.user = username;
    res.json({ username, timeZone: user.timeZone });
});

// API: Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Contraseña incorrecta' });
    req.session.user = username;
    res.json({ username, timeZone: user.timeZone || 'UTC' });
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

// API: Get user session info
app.get('/api/session', (req, res) => {
    if (!req.session.user) {
        return res.json({ user: null });
    }
    const user = users.find(u => u.username === req.session.user);
    res.json({ 
        user: req.session.user,
        timeZone: user ? user.timeZone : 'UTC'
    });
});

// API: Update user timezone
app.post('/api/user/timezone', requireLogin, (req, res) => {
    const { timeZone } = req.body;
    const user = users.find(u => u.username === req.session.user);
    if (user) {
        user.timeZone = timeZone;
        saveAll();
    }
    res.json({ timeZone });
});

// API: Obtener cheatsheets (con filtro por tema o título)
app.get('/api/cheatsheets', (req, res) => {
    const { search, sortBy = 'recent', timeFilter } = req.query;
    let filtered = cheatsheets;
    
    if (search) {
        const s = search.toLowerCase();
        filtered = cheatsheets.filter(cs =>
            cs.title.toLowerCase().includes(s) ||
            cs.theme.toLowerCase().includes(s)
        );
    }
    
    // Time-based filtering
    if (timeFilter) {
        const now = new Date();
        let cutoffDate;
        
        switch (timeFilter) {
            case 'today':
                cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
        }
        
        if (cutoffDate) {
            filtered = filtered.filter(cs => new Date(cs.createdAt) >= cutoffDate);
        }
    }
    
    // Sorting
    switch (sortBy) {
        case 'recent':
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'popular':
            filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            break;
        case 'commented':
            filtered.sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0));
            break;
    }
    
    res.json(filtered);
});

// API: Subir cheatsheet (solo autenticado)
app.post('/api/cheatsheets', upload.single('file'), (req, res) => {
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
        updatedAt: new Date().toISOString(),
        user: req.session.user || 'Usuario Demo',
        timeZone: getUserTimeZone(req.session.user) || 'UTC'
    };
    cheatsheets.push(cheatsheet);
    saveAll();
    res.status(201).json({ message: 'Cheatsheet subida', cheatsheet });
});

// Helper function to get user timezone
function getUserTimeZone(username) {
    const user = users.find(u => u.username === username);
    return user ? user.timeZone || 'UTC' : 'UTC';
}

// API: Like a cheatsheet (solo autenticado, una vez por usuario)
app.post('/api/cheatsheets/:id/like', requireLogin, (req, res) => {
    const cs = cheatsheets.find(c => c.id === req.params.id);
    if (!cs) return res.status(404).json({ error: 'No encontrado' });
    if (cs.likedBy.includes(req.session.user)) return res.status(400).json({ error: 'Ya le diste like' });
    cs.likes++;
    cs.likedBy.push(req.session.user);
    cs.lastActivityAt = new Date().toISOString();
    
    // Notificación
    if (cs.user && cs.user !== req.session.user) {
        const owner = users.find(u => u.username === cs.user);
        if (owner) {
            const notification = {
                type: 'like',
                from: req.session.user,
                cheatsheetId: cs.id,
                date: new Date().toISOString(),
                timeZone: getUserTimeZone(cs.user)
            };
            owner.notifications.push(notification);
            // Enviar notificación en tiempo real
            sendRealTimeNotification(cs.user, notification);
        }
    }
    saveAll();
    res.json({ likes: cs.likes, lastActivityAt: cs.lastActivityAt });
});

// API: Comentar cheatsheet (solo autenticado)
app.post('/api/cheatsheets/:id/comment', requireLogin, (req, res) => {
    const cs = cheatsheets.find(c => c.id === req.params.id);
    if (!cs) return res.status(404).json({ error: 'No encontrado' });
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Comentario vacío' });
    const comment = { 
        text, 
        user: req.session.user, 
        date: new Date().toISOString(),
        timeZone: getUserTimeZone(req.session.user)
    };
    cs.comments.push(comment);
    cs.lastActivityAt = new Date().toISOString();
    
    // Notificación
    if (cs.user && cs.user !== req.session.user) {
        const owner = users.find(u => u.username === cs.user);
        if (owner) {
            const notification = {
                type: 'comment',
                from: req.session.user,
                cheatsheetId: cs.id,
                text,
                date: new Date().toISOString(),
                timeZone: getUserTimeZone(cs.user)
            };
            owner.notifications.push(notification);
            // Enviar notificación en tiempo real
            sendRealTimeNotification(cs.user, notification);
        }
    }
    saveAll();
    res.json({ comments: cs.comments, lastActivityAt: cs.lastActivityAt });
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

// API: Time utilities
app.get('/api/time/current', (req, res) => {
    res.json({
        utc: new Date().toISOString(),
        local: new Date().toLocaleString(),
        timestamp: Date.now(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
});

app.get('/api/time/best-posting-times', requireLogin, (req, res) => {
    const threads = storage.loadCheatsheets();
    const userThreads = threads.filter(t => t.user === req.session.user);
    
    const hourlyEngagement = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);
    
    userThreads.forEach(thread => {
        const hour = new Date(thread.createdAt).getHours();
        const engagement = (thread.likes || 0) + (thread.comments?.length || 0);
        hourlyEngagement[hour] += engagement;
        hourlyCounts[hour]++;
    });
    
    const bestTimes = hourlyEngagement.map((total, hour) => ({
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        average: hourlyCounts[hour] > 0 ? (total / hourlyCounts[hour]).toFixed(2) : 0,
        posts: hourlyCounts[hour]
    }))
    .filter(h => h.posts > 0)
    .sort((a, b) => parseFloat(b.average) - parseFloat(a.average))
    .slice(0, 5);
    
    res.json(bestTimes);
});

// API endpoint para publicaciones rápidas
app.post('/api/posts', (req, res) => {
    try {
        const { content, type } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'El contenido es requerido' });
        }
        
        if (content.length > 280) {
            return res.status(400).json({ error: 'El contenido no puede exceder 280 caracteres' });
        }
        
        const post = {
            id: Date.now().toString(),
            content: content.trim(),
            type: type || 'quick_post',
            likes: 0,
            likedBy: [],
            comments: [],
            retweets: 0,
            retweetedBy: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            user: req.session.user || 'Usuario Demo',
            timeZone: getUserTimeZone(req.session.user) || 'UTC'
        };
        
        // Guardar en un archivo de posts (similar a cheatsheets)
        let posts = [];
        try {
            const postsData = fs.readFileSync(path.join(__dirname, 'posts.json'), 'utf-8');
            posts = JSON.parse(postsData);
        } catch (error) {
            // Si no existe el archivo, inicializamos con array vacío
            posts = [];
        }
        
        posts.unshift(post); // Agregar al principio
        
        // Mantener solo los últimos 100 posts
        if (posts.length > 100) {
            posts = posts.slice(0, 100);
        }
        
        fs.writeFileSync(path.join(__dirname, 'posts.json'), JSON.stringify(posts, null, 2));
        
        res.json({ success: true, post });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// API endpoint para obtener publicaciones
app.get('/api/posts', (req, res) => {
    try {
        let posts = [];
        try {
            const postsData = fs.readFileSync(path.join(__dirname, 'posts.json'), 'utf-8');
            posts = JSON.parse(postsData);
        } catch (error) {
            posts = [];
        }
        
        res.json(posts);
    } catch (error) {
        console.error('Error loading posts:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
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
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/time-management', timeManagementRoutes);

// Root route - redirect to home
app.get('/', (req, res) => {
    res.redirect('/Home/home.html');
});

// Home page route
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'Home', 'home.html'));
});

// Alternative home routes
app.get('/pages/Home/home.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'Home', 'home.html'));
});

// Iniciar servidor
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📅 Post scheduler initialized and checking every minute`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n📴 Shutting down server...');
    postScheduler.stopScheduler();
    server.close(() => {
        console.log('✅ Server shut down gracefully');
        process.exit(0);
    });
});
