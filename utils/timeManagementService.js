// Advanced Time Management Background Service
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class TimeManagementService extends EventEmitter {
    constructor() {
        super();
        this.remindersFile = path.join(__dirname, '..', 'data', 'reminders.json');
        this.activeTimers = new Map();
        this.checkInterval = null;
        
        this.startService();
    }
    
    startService() {
        console.log('🕐 Time Management Service started');
        
        // Check for due reminders every minute
        this.checkInterval = setInterval(() => {
            this.checkDueReminders();
        }, 60000);
        
        // Initial check
        this.checkDueReminders();
    }
    
    stopService() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        
        // Clear all active timers
        this.activeTimers.forEach((timer, id) => {
            clearTimeout(timer);
        });
        this.activeTimers.clear();
        
        console.log('🕐 Time Management Service stopped');
    }
    
    loadReminders() {
        try {
            if (fs.existsSync(this.remindersFile)) {
                const data = fs.readFileSync(this.remindersFile, 'utf8');
                return JSON.parse(data);
            }
            return [];
        } catch (error) {
            console.error('Error loading reminders:', error);
            return [];
        }
    }
    
    saveReminders(reminders) {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.remindersFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            fs.writeFileSync(this.remindersFile, JSON.stringify(reminders, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving reminders:', error);
            return false;
        }
    }
    
    checkDueReminders() {
        const reminders = this.loadReminders();
        const now = new Date();
        let hasUpdates = false;
        
        reminders.forEach(reminder => {
            if (!reminder.isActive) return;
            
            const reminderTime = new Date(reminder.time);
            
            // Check if reminder is due (within the last minute)
            if (reminderTime <= now && !reminder.triggered) {
                this.triggerReminder(reminder);
                reminder.triggered = true;
                hasUpdates = true;
                
                // Handle recurring reminders
                if (reminder.type !== 'once') {
                    this.scheduleNextRecurrence(reminder);
                    reminder.triggered = false; // Reset for next occurrence
                }
            }
        });
        
        if (hasUpdates) {
            this.saveReminders(reminders);
        }
    }
    
    triggerReminder(reminder) {
        console.log(`⏰ Triggering reminder: ${reminder.title}`);
        
        // Add notification to reminder
        const notification = {
            id: Date.now().toString(),
            title: reminder.title,
            time: new Date().toISOString(),
            read: false
        };
        
        if (!reminder.notifications) {
            reminder.notifications = [];
        }
        reminder.notifications.push(notification);
        
        // Emit event for real-time updates
        this.emit('reminderTriggered', {
            reminder,
            notification,
            userId: reminder.userId
        });
        
        // Send real-time notification if available
        if (global.sendRealTimeNotification) {
            global.sendRealTimeNotification(reminder.userId, {
                type: 'reminder',
                title: 'Recordatorio',
                message: reminder.title,
                data: reminder
            });
        }
    }
    
    scheduleNextRecurrence(reminder) {
        const currentTime = new Date(reminder.time);
        let nextTime;
        
        switch (reminder.type) {
            case 'daily':
                nextTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);
                break;
            case 'weekly':
                nextTime = new Date(currentTime.getTime() + 7 * 24 * 60 * 60 * 1000);
                break;
            case 'monthly':
                nextTime = new Date(currentTime);
                nextTime.setMonth(nextTime.getMonth() + 1);
                break;
            default:
                return; // No recurrence
        }
        
        if (nextTime) {
            reminder.time = nextTime.toISOString();
            console.log(`📅 Scheduled next occurrence for ${reminder.title}: ${nextTime.toLocaleString()}`);
        }
    }
    
    createReminder(userId, title, time, type = 'once', options = {}) {
        const reminder = {
            id: Date.now().toString(),
            userId,
            title,
            time: new Date(time).toISOString(),
            type,
            options,
            isActive: true,
            triggered: false,
            createdAt: new Date().toISOString(),
            notifications: []
        };
        
        const reminders = this.loadReminders();
        reminders.push(reminder);
        
        if (this.saveReminders(reminders)) {
            console.log(`✅ Created reminder: ${title} for user ${userId}`);
            return reminder;
        }
        
        return null;
    }
    
    updateReminder(userId, reminderId, updates) {
        const reminders = this.loadReminders();
        const reminderIndex = reminders.findIndex(r => r.id === reminderId && r.userId === userId);
        
        if (reminderIndex === -1) {
            return null;
        }
        
        const reminder = reminders[reminderIndex];
        Object.assign(reminder, updates);
        
        if (this.saveReminders(reminders)) {
            console.log(`📝 Updated reminder: ${reminder.title}`);
            return reminder;
        }
        
        return null;
    }
    
    deleteReminder(userId, reminderId) {
        const reminders = this.loadReminders();
        const filteredReminders = reminders.filter(r => !(r.id === reminderId && r.userId === userId));
        
        if (filteredReminders.length < reminders.length) {
            if (this.saveReminders(filteredReminders)) {
                console.log(`🗑️ Deleted reminder: ${reminderId}`);
                return true;
            }
        }
        
        return false;
    }
    
    getUserReminders(userId) {
        const reminders = this.loadReminders();
        return reminders.filter(r => r.userId === userId);
    }
    
    getActiveReminders(userId) {
        const reminders = this.getUserReminders(userId);
        return reminders.filter(r => r.isActive);
    }
    
    // Analytics methods
    getProductivityMetrics(userId, period = 'daily') {
        const timeTrackingFile = path.join(__dirname, '..', 'data', 'time-tracking.json');
        
        try {
            if (!fs.existsSync(timeTrackingFile)) {
                return this.getDefaultMetrics();
            }
            
            const data = fs.readFileSync(timeTrackingFile, 'utf8');
            const timeTracking = JSON.parse(data);
            const userTracking = timeTracking[userId];
            
            if (!userTracking) {
                return this.getDefaultMetrics();
            }
            
            return this.calculateMetrics(userTracking, period);
        } catch (error) {
            console.error('Error getting productivity metrics:', error);
            return this.getDefaultMetrics();
        }
    }
    
    getDefaultMetrics() {
        return {
            totalTime: 0,
            sessions: 0,
            avgSession: 0,
            productivity: 0,
            activities: {},
            trends: {
                daily: [],
                weekly: [],
                monthly: []
            }
        };
    }
    
    calculateMetrics(userTracking, period) {
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
        
        return {
            totalTime: Math.floor(totalTime / 60000), // Convert to minutes
            sessions: filteredSessions.length,
            avgSession: Math.floor(avgSession / 60000), // Convert to minutes
            productivity: Math.round(productivityScore),
            activities,
            trends: this.calculateTrends(userTracking.sessions)
        };
    }
    
    calculateTrends(sessions) {
        // Calculate productivity trends over time
        const now = new Date();
        const trends = {
            daily: [],
            weekly: [],
            monthly: []
        };
        
        // Daily trend (last 7 days)
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
            
            const daySessions = sessions.filter(s => {
                const sessionDate = new Date(s.startTime);
                return sessionDate >= dayStart && sessionDate < dayEnd && s.endTime;
            });
            
            const dayTotal = daySessions.reduce((sum, s) => sum + s.duration, 0);
            trends.daily.push({
                date: dayStart.toISOString().split('T')[0],
                time: Math.floor(dayTotal / 60000),
                sessions: daySessions.length
            });
        }
        
        return trends;
    }
}

module.exports = TimeManagementService;
