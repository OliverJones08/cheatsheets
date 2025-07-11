const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Storage files
const remindersFile = path.join(__dirname, '..', 'data', 'reminders.json');
const timeTrackingFile = path.join(__dirname, '..', 'data', 'time-tracking.json');
const productivityFile = path.join(__dirname, '..', 'data', 'productivity.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Helper functions
function loadJSON(filePath, defaultValue = []) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return defaultValue;
    } catch (error) {
        console.error('Error loading JSON:', error);
        return defaultValue;
    }
}

function saveJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving JSON:', error);
        return false;
    }
}

// Reminders endpoints
router.get('/reminders', (req, res) => {
    const reminders = loadJSON(remindersFile, []);
    const userReminders = reminders.filter(r => r.userId === req.session?.userId);
    res.json(userReminders);
});

router.post('/reminders', (req, res) => {
    const { title, time, type, options = {} } = req.body;
    const userId = req.session?.userId;
    
    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    if (!title || !time) {
        return res.status(400).json({ error: 'Título y tiempo son requeridos' });
    }
    
    const reminder = {
        id: Date.now().toString(),
        userId,
        title,
        time: new Date(time).toISOString(),
        type: type || 'once',
        options,
        isActive: true,
        createdAt: new Date().toISOString(),
        notifications: []
    };
    
    const reminders = loadJSON(remindersFile, []);
    reminders.push(reminder);
    
    if (saveJSON(remindersFile, reminders)) {
        res.json(reminder);
    } else {
        res.status(500).json({ error: 'Error al guardar recordatorio' });
    }
});

router.put('/reminders/:id', (req, res) => {
    const { id } = req.params;
    const { title, time, type, isActive } = req.body;
    const userId = req.session?.userId;
    
    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    const reminders = loadJSON(remindersFile, []);
    const reminderIndex = reminders.findIndex(r => r.id === id && r.userId === userId);
    
    if (reminderIndex === -1) {
        return res.status(404).json({ error: 'Recordatorio no encontrado' });
    }
    
    const reminder = reminders[reminderIndex];
    if (title) reminder.title = title;
    if (time) reminder.time = new Date(time).toISOString();
    if (type) reminder.type = type;
    if (typeof isActive === 'boolean') reminder.isActive = isActive;
    
    if (saveJSON(remindersFile, reminders)) {
        res.json(reminder);
    } else {
        res.status(500).json({ error: 'Error al actualizar recordatorio' });
    }
});

router.delete('/reminders/:id', (req, res) => {
    const { id } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    const reminders = loadJSON(remindersFile, []);
    const filteredReminders = reminders.filter(r => !(r.id === id && r.userId === userId));
    
    if (filteredReminders.length === reminders.length) {
        return res.status(404).json({ error: 'Recordatorio no encontrado' });
    }
    
    if (saveJSON(remindersFile, filteredReminders)) {
        res.json({ message: 'Recordatorio eliminado' });
    } else {
        res.status(500).json({ error: 'Error al eliminar recordatorio' });
    }
});

// Time tracking endpoints
router.get('/time-tracking', (req, res) => {
    const timeTracking = loadJSON(timeTrackingFile, {});
    const userTracking = timeTracking[req.session?.userId] || {
        sessions: [],
        totalTime: 0,
        productivity: { focused: 0, distracted: 0, break: 0 }
    };
    res.json(userTracking);
});

router.post('/time-tracking/start', (req, res) => {
    const { activity = 'general' } = req.body;
    const userId = req.session?.userId;
    
    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    const timeTracking = loadJSON(timeTrackingFile, {});
    if (!timeTracking[userId]) {
        timeTracking[userId] = {
            sessions: [],
            totalTime: 0,
            activeSession: null,
            productivity: { focused: 0, distracted: 0, break: 0 }
        };
    }
    
    const session = {
        id: Date.now().toString(),
        activity,
        startTime: new Date().toISOString(),
        endTime: null,
        duration: 0,
        productivity: 'focused'
    };
    
    timeTracking[userId].activeSession = session;
    timeTracking[userId].sessions.push(session);
    
    if (saveJSON(timeTrackingFile, timeTracking)) {
        res.json(session);
    } else {
        res.status(500).json({ error: 'Error al iniciar seguimiento' });
    }
});

router.post('/time-tracking/stop', (req, res) => {
    const userId = req.session?.userId;
    
    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    const timeTracking = loadJSON(timeTrackingFile, {});
    const userTracking = timeTracking[userId];
    
    if (!userTracking || !userTracking.activeSession) {
        return res.status(400).json({ error: 'No hay sesión activa' });
    }
    
    const session = userTracking.activeSession;
    session.endTime = new Date().toISOString();
    session.duration = new Date(session.endTime) - new Date(session.startTime);
    
    userTracking.totalTime += session.duration;
    userTracking.productivity[session.productivity] += session.duration;
    userTracking.activeSession = null;
    
    if (saveJSON(timeTrackingFile, timeTracking)) {
        res.json(session);
    } else {
        res.status(500).json({ error: 'Error al detener seguimiento' });
    }
});

// Productivity analytics
router.get('/productivity/analytics', (req, res) => {
    const { period = 'daily' } = req.query;
    const userId = req.session?.userId;
    
    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    const timeTracking = loadJSON(timeTrackingFile, {});
    const userTracking = timeTracking[userId];
    
    if (!userTracking) {
        return res.json({
            totalTime: 0,
            sessions: 0,
            avgSession: 0,
            productivity: 0,
            activities: {}
        });
    }
    
    // Filter sessions by period
    const now = new Date();
    let startDate;
    
    switch (period) {
        case 'daily':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'weekly':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        default:
            startDate = new Date(0);
    }
    
    const filteredSessions = userTracking.sessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate >= startDate && session.endTime;
    });
    
    const totalTime = filteredSessions.reduce((sum, session) => sum + session.duration, 0);
    const avgSession = filteredSessions.length > 0 ? totalTime / filteredSessions.length : 0;
    
    // Calculate productivity score
    const focusedTime = filteredSessions
        .filter(s => s.productivity === 'focused')
        .reduce((sum, s) => sum + s.duration, 0);
    const productivityScore = totalTime > 0 ? (focusedTime / totalTime) * 100 : 0;
    
    // Group by activity
    const activities = {};
    filteredSessions.forEach(session => {
        if (!activities[session.activity]) {
            activities[session.activity] = { time: 0, sessions: 0 };
        }
        activities[session.activity].time += session.duration;
        activities[session.activity].sessions++;
    });
    
    res.json({
        totalTime: Math.floor(totalTime / 60000), // Convert to minutes
        sessions: filteredSessions.length,
        avgSession: Math.floor(avgSession / 60000), // Convert to minutes
        productivity: Math.round(productivityScore),
        activities
    });
});

// World clock data
router.get('/world-clocks', (req, res) => {
    const timeZones = {
        'America/New_York': { name: 'New York', offset: -5 },
        'America/Los_Angeles': { name: 'Los Angeles', offset: -8 },
        'Europe/London': { name: 'London', offset: 0 },
        'Europe/Paris': { name: 'Paris', offset: 1 },
        'Asia/Tokyo': { name: 'Tokyo', offset: 9 },
        'Asia/Shanghai': { name: 'Shanghai', offset: 8 },
        'Australia/Sydney': { name: 'Sydney', offset: 10 }
    };
    
    const worldClocks = {};
    const now = new Date();
    
    Object.entries(timeZones).forEach(([zone, info]) => {
        const utcTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
        const zoneTime = new Date(utcTime.getTime() + (info.offset * 3600000));
        
        worldClocks[zone] = {
            time: zoneTime.toLocaleTimeString(),
            name: info.name,
            date: zoneTime.toLocaleDateString(),
            isDaytime: zoneTime.getHours() >= 6 && zoneTime.getHours() < 18
        };
    });
    
    res.json(worldClocks);
});

// Pomodoro timer endpoints
router.get('/pomodoro/settings', (req, res) => {
    const userId = req.session?.userId;
    
    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    const settings = loadJSON(path.join(__dirname, '..', 'data', 'pomodoro-settings.json'), {});
    const userSettings = settings[userId] || {
        workMinutes: 25,
        breakMinutes: 5,
        longBreakMinutes: 15,
        longBreakInterval: 4
    };
    
    res.json(userSettings);
});

router.put('/pomodoro/settings', (req, res) => {
    const userId = req.session?.userId;
    const { workMinutes, breakMinutes, longBreakMinutes, longBreakInterval } = req.body;
    
    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    const settings = loadJSON(path.join(__dirname, '..', 'data', 'pomodoro-settings.json'), {});
    settings[userId] = {
        workMinutes: workMinutes || 25,
        breakMinutes: breakMinutes || 5,
        longBreakMinutes: longBreakMinutes || 15,
        longBreakInterval: longBreakInterval || 4
    };
    
    if (saveJSON(path.join(__dirname, '..', 'data', 'pomodoro-settings.json'), settings)) {
        res.json(settings[userId]);
    } else {
        res.status(500).json({ error: 'Error al guardar configuración' });
    }
});

// Export data
router.get('/export', (req, res) => {
    const userId = req.session?.userId;
    
    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    const reminders = loadJSON(remindersFile, []).filter(r => r.userId === userId);
    const timeTracking = loadJSON(timeTrackingFile, {})[userId] || {};
    const settings = loadJSON(path.join(__dirname, '..', 'data', 'pomodoro-settings.json'), {})[userId] || {};
    
    const exportData = {
        reminders,
        timeTracking,
        settings,
        exportDate: new Date().toISOString()
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="time-management-data.json"');
    res.json(exportData);
});

module.exports = router;
