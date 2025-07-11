// Advanced Time Management System
class AdvancedTimeManager {
    constructor() {
        this.timeZones = this.loadTimeZones();
        this.userPreferences = this.loadUserPreferences();
        this.timeTracking = this.initializeTimeTracking();
        this.reminders = this.loadReminders();
        this.workingHours = this.loadWorkingHours();
        this.timeBlocks = this.loadTimeBlocks();
        this.productivityMetrics = this.initializeProductivityMetrics();
        
        this.startAdvancedTimers();
    }
    
    // Time Zone Management
    loadTimeZones() {
        return {
            'America/New_York': { name: 'Eastern Time', offset: -5 },
            'America/Chicago': { name: 'Central Time', offset: -6 },
            'America/Denver': { name: 'Mountain Time', offset: -7 },
            'America/Los_Angeles': { name: 'Pacific Time', offset: -8 },
            'Europe/London': { name: 'British Time', offset: 0 },
            'Europe/Paris': { name: 'Central European Time', offset: 1 },
            'Asia/Tokyo': { name: 'Japan Time', offset: 9 },
            'Asia/Shanghai': { name: 'China Time', offset: 8 },
            'Australia/Sydney': { name: 'Australian Eastern Time', offset: 10 },
            'America/Sao_Paulo': { name: 'Brazil Time', offset: -3 },
            'Asia/Dubai': { name: 'Gulf Time', offset: 4 },
            'Africa/Cairo': { name: 'Egypt Time', offset: 2 }
        };
    }
    
    // Convert time between timezones
    convertTimezone(date, fromZone, toZone) {
        const utcTime = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
        const fromOffset = this.timeZones[fromZone]?.offset || 0;
        const toOffset = this.timeZones[toZone]?.offset || 0;
        
        return new Date(utcTime.getTime() + ((toOffset - fromOffset) * 3600000));
    }
    
    // World Clock Display
    getWorldClocks() {
        const now = new Date();
        const clocks = {};
        
        Object.entries(this.timeZones).forEach(([zone, info]) => {
            const zoneTime = this.convertTimezone(now, 'UTC', zone);
            clocks[zone] = {
                time: zoneTime.toLocaleTimeString(),
                name: info.name,
                date: zoneTime.toLocaleDateString(),
                isDaytime: this.isDaytime(zoneTime)
            };
        });
        
        return clocks;
    }
    
    isDaytime(date) {
        const hour = date.getHours();
        return hour >= 6 && hour < 18;
    }
    
    // User Preferences
    loadUserPreferences() {
        return {
            timeFormat: '24h', // '12h' or '24h'
            dateFormat: 'DD/MM/YYYY',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            workingHours: { start: 9, end: 17 },
            notifications: {
                reminders: true,
                schedules: true,
                analytics: true
            },
            theme: 'auto' // 'light', 'dark', 'auto'
        };
    }
    
    updateUserPreferences(preferences) {
        this.userPreferences = { ...this.userPreferences, ...preferences };
        localStorage.setItem('timePreferences', JSON.stringify(this.userPreferences));
    }
    
    // Time Tracking
    initializeTimeTracking() {
        return {
            sessions: [],
            totalTime: 0,
            activeSession: null,
            productivity: {
                focused: 0,
                distracted: 0,
                break: 0
            }
        };
    }
    
    startTimeTracking(activity = 'general') {
        const session = {
            id: Date.now().toString(),
            activity,
            startTime: new Date().toISOString(),
            endTime: null,
            duration: 0,
            productivity: 'focused'
        };
        
        this.timeTracking.activeSession = session;
        this.timeTracking.sessions.push(session);
        
        return session;
    }
    
    stopTimeTracking() {
        if (this.timeTracking.activeSession) {
            const session = this.timeTracking.activeSession;
            session.endTime = new Date().toISOString();
            session.duration = new Date(session.endTime) - new Date(session.startTime);
            
            this.timeTracking.totalTime += session.duration;
            this.timeTracking.productivity[session.productivity] += session.duration;
            this.timeTracking.activeSession = null;
            
            return session;
        }
        return null;
    }
    
    // Pomodoro Timer
    createPomodoroTimer(workMinutes = 25, breakMinutes = 5) {
        return {
            id: Date.now().toString(),
            workDuration: workMinutes * 60 * 1000,
            breakDuration: breakMinutes * 60 * 1000,
            currentSession: 'work',
            startTime: new Date(),
            isActive: false,
            completedCycles: 0,
            
            start() {
                this.isActive = true;
                this.startTime = new Date();
                return this;
            },
            
            pause() {
                this.isActive = false;
                return this;
            },
            
            reset() {
                this.isActive = false;
                this.completedCycles = 0;
                this.currentSession = 'work';
                return this;
            },
            
            getTimeRemaining() {
                if (!this.isActive) return 0;
                
                const elapsed = new Date() - this.startTime;
                const sessionDuration = this.currentSession === 'work' ? 
                    this.workDuration : this.breakDuration;
                
                return Math.max(0, sessionDuration - elapsed);
            },
            
            switchSession() {
                if (this.currentSession === 'work') {
                    this.currentSession = 'break';
                    this.completedCycles++;
                } else {
                    this.currentSession = 'work';
                }
                this.startTime = new Date();
                return this;
            }
        };
    }
    
    // Reminders System
    loadReminders() {
        return JSON.parse(localStorage.getItem('timeReminders') || '[]');
    }
    
    saveReminders() {
        localStorage.setItem('timeReminders', JSON.stringify(this.reminders));
    }
    
    createReminder(title, time, type = 'once', options = {}) {
        const reminder = {
            id: Date.now().toString(),
            title,
            time: new Date(time).toISOString(),
            type, // 'once', 'daily', 'weekly', 'monthly'
            options,
            isActive: true,
            createdAt: new Date().toISOString(),
            notifications: []
        };
        
        this.reminders.push(reminder);
        this.saveReminders();
        this.scheduleReminder(reminder);
        
        return reminder;
    }
    
    scheduleReminder(reminder) {
        const now = new Date();
        const reminderTime = new Date(reminder.time);
        const delay = reminderTime - now;
        
        if (delay > 0) {
            setTimeout(() => {
                this.triggerReminder(reminder);
            }, delay);
        }
    }
    
    triggerReminder(reminder) {
        if (!reminder.isActive) return;
        
        const notification = {
            id: Date.now().toString(),
            title: reminder.title,
            time: new Date().toISOString(),
            read: false
        };
        
        reminder.notifications.push(notification);
        
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(reminder.title, {
                body: `Recordatorio: ${reminder.title}`,
                icon: '/favicon.ico'
            });
        }
        
        // Reschedule recurring reminders
        if (reminder.type !== 'once') {
            this.rescheduleRecurringReminder(reminder);
        }
        
        this.saveReminders();
    }
    
    rescheduleRecurringReminder(reminder) {
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
        }
        
        if (nextTime) {
            reminder.time = nextTime.toISOString();
            this.scheduleReminder(reminder);
        }
    }
    
    // Working Hours Management
    loadWorkingHours() {
        return JSON.parse(localStorage.getItem('workingHours') || JSON.stringify({
            monday: { start: '09:00', end: '17:00', enabled: true },
            tuesday: { start: '09:00', end: '17:00', enabled: true },
            wednesday: { start: '09:00', end: '17:00', enabled: true },
            thursday: { start: '09:00', end: '17:00', enabled: true },
            friday: { start: '09:00', end: '17:00', enabled: true },
            saturday: { start: '10:00', end: '14:00', enabled: false },
            sunday: { start: '10:00', end: '14:00', enabled: false }
        }));
    }
    
    saveWorkingHours() {
        localStorage.setItem('workingHours', JSON.stringify(this.workingHours));
    }
    
    isWorkingHours(date = new Date()) {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[date.getDay()];
        const workingDay = this.workingHours[dayName];
        
        if (!workingDay.enabled) return false;
        
        const currentTime = date.getHours() * 60 + date.getMinutes();
        const [startHour, startMinute] = workingDay.start.split(':').map(Number);
        const [endHour, endMinute] = workingDay.end.split(':').map(Number);
        
        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;
        
        return currentTime >= startTime && currentTime <= endTime;
    }
    
    getNextWorkingTime() {
        const now = new Date();
        const nextWorkingTime = new Date(now);
        
        // Check next 7 days
        for (let i = 0; i < 7; i++) {
            const checkDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = dayNames[checkDate.getDay()];
            const workingDay = this.workingHours[dayName];
            
            if (workingDay.enabled) {
                const [startHour, startMinute] = workingDay.start.split(':').map(Number);
                nextWorkingTime.setDate(checkDate.getDate());
                nextWorkingTime.setHours(startHour, startMinute, 0, 0);
                
                if (nextWorkingTime > now) {
                    return nextWorkingTime;
                }
            }
        }
        
        return null;
    }
    
    // Time Blocks
    loadTimeBlocks() {
        return JSON.parse(localStorage.getItem('timeBlocks') || '[]');
    }
    
    saveTimeBlocks() {
        localStorage.setItem('timeBlocks', JSON.stringify(this.timeBlocks));
    }
    
    createTimeBlock(title, startTime, endTime, type = 'work', options = {}) {
        const timeBlock = {
            id: Date.now().toString(),
            title,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            type, // 'work', 'break', 'meeting', 'focus', 'personal'
            options,
            isActive: true,
            createdAt: new Date().toISOString()
        };
        
        this.timeBlocks.push(timeBlock);
        this.saveTimeBlocks();
        
        return timeBlock;
    }
    
    getCurrentTimeBlock() {
        const now = new Date();
        
        return this.timeBlocks.find(block => {
            const startTime = new Date(block.startTime);
            const endTime = new Date(block.endTime);
            return now >= startTime && now <= endTime && block.isActive;
        });
    }
    
    getUpcomingTimeBlocks(hours = 24) {
        const now = new Date();
        const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
        
        return this.timeBlocks
            .filter(block => {
                const startTime = new Date(block.startTime);
                return startTime > now && startTime <= futureTime && block.isActive;
            })
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }
    
    // Productivity Metrics
    initializeProductivityMetrics() {
        return {
            dailyGoals: {},
            weeklyGoals: {},
            monthlyGoals: {},
            streaks: {},
            achievements: []
        };
    }
    
    setDailyGoal(date, goal) {
        const dateKey = new Date(date).toISOString().split('T')[0];
        this.productivityMetrics.dailyGoals[dateKey] = goal;
        this.saveProductivityMetrics();
    }
    
    updateDailyProgress(date, progress) {
        const dateKey = new Date(date).toISOString().split('T')[0];
        if (this.productivityMetrics.dailyGoals[dateKey]) {
            this.productivityMetrics.dailyGoals[dateKey].progress = progress;
            this.checkAchievements(dateKey);
        }
        this.saveProductivityMetrics();
    }
    
    checkAchievements(dateKey) {
        const goal = this.productivityMetrics.dailyGoals[dateKey];
        if (goal && goal.progress >= goal.target) {
            this.unlockAchievement('daily_goal_completed', dateKey);
        }
    }
    
    unlockAchievement(type, context) {
        const achievement = {
            id: Date.now().toString(),
            type,
            context,
            unlockedAt: new Date().toISOString()
        };
        
        this.productivityMetrics.achievements.push(achievement);
        this.saveProductivityMetrics();
    }
    
    saveProductivityMetrics() {
        localStorage.setItem('productivityMetrics', JSON.stringify(this.productivityMetrics));
    }
    
    // Advanced Timers
    startAdvancedTimers() {
        // Check reminders every minute
        setInterval(() => {
            this.checkReminders();
        }, 60000);
        
        // Update productivity metrics every hour
        setInterval(() => {
            this.updateProductivityMetrics();
        }, 3600000);
        
        // Check time blocks every 5 minutes
        setInterval(() => {
            this.checkTimeBlocks();
        }, 300000);
    }
    
    checkReminders() {
        const now = new Date();
        
        this.reminders.forEach(reminder => {
            const reminderTime = new Date(reminder.time);
            if (reminder.isActive && now >= reminderTime) {
                this.triggerReminder(reminder);
            }
        });
    }
    
    updateProductivityMetrics() {
        const today = new Date().toISOString().split('T')[0];
        const todayGoal = this.productivityMetrics.dailyGoals[today];
        
        if (todayGoal) {
            // Update progress based on time tracking
            const todaySessions = this.timeTracking.sessions.filter(session => 
                session.startTime.startsWith(today)
            );
            
            const totalProductiveTime = todaySessions.reduce((sum, session) => {
                return sum + (session.productivity === 'focused' ? session.duration : 0);
            }, 0);
            
            this.updateDailyProgress(today, totalProductiveTime);
        }
    }
    
    checkTimeBlocks() {
        const currentBlock = this.getCurrentTimeBlock();
        const upcomingBlocks = this.getUpcomingTimeBlocks(1); // Next hour
        
        // Notify about current block
        if (currentBlock) {
            this.notifyTimeBlock(currentBlock, 'current');
        }
        
        // Notify about upcoming blocks
        upcomingBlocks.forEach(block => {
            const startTime = new Date(block.startTime);
            const now = new Date();
            const minutesUntil = (startTime - now) / (1000 * 60);
            
            if (minutesUntil <= 15 && minutesUntil > 10) {
                this.notifyTimeBlock(block, 'upcoming');
            }
        });
    }
    
    notifyTimeBlock(block, type) {
        const message = type === 'current' ? 
            `Bloque de tiempo actual: ${block.title}` :
            `Próximo bloque: ${block.title} en ${Math.floor((new Date(block.startTime) - new Date()) / (1000 * 60))} minutos`;
        
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(message, {
                body: `Tipo: ${block.type}`,
                icon: '/favicon.ico'
            });
        }
    }
    
    // Analytics and Reports
    generateTimeReport(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const sessionsInRange = this.timeTracking.sessions.filter(session => {
            const sessionDate = new Date(session.startTime);
            return sessionDate >= start && sessionDate <= end;
        });
        
        const totalTime = sessionsInRange.reduce((sum, session) => sum + session.duration, 0);
        const focusedTime = sessionsInRange
            .filter(session => session.productivity === 'focused')
            .reduce((sum, session) => sum + session.duration, 0);
        
        const dailyBreakdown = {};
        sessionsInRange.forEach(session => {
            const day = session.startTime.split('T')[0];
            if (!dailyBreakdown[day]) {
                dailyBreakdown[day] = { total: 0, focused: 0, sessions: 0 };
            }
            dailyBreakdown[day].total += session.duration;
            dailyBreakdown[day].sessions++;
            if (session.productivity === 'focused') {
                dailyBreakdown[day].focused += session.duration;
            }
        });
        
        return {
            period: { start: start.toISOString(), end: end.toISOString() },
            totalTime,
            focusedTime,
            productivityRate: totalTime > 0 ? (focusedTime / totalTime) * 100 : 0,
            averageSessionLength: sessionsInRange.length > 0 ? totalTime / sessionsInRange.length : 0,
            dailyBreakdown,
            topActivities: this.getTopActivities(sessionsInRange)
        };
    }
    
    getTopActivities(sessions) {
        const activities = {};
        
        sessions.forEach(session => {
            if (!activities[session.activity]) {
                activities[session.activity] = { time: 0, sessions: 0 };
            }
            activities[session.activity].time += session.duration;
            activities[session.activity].sessions++;
        });
        
        return Object.entries(activities)
            .sort(([,a], [,b]) => b.time - a.time)
            .slice(0, 10)
            .map(([activity, data]) => ({ activity, ...data }));
    }
    
    // Export/Import
    exportData() {
        return {
            timeTracking: this.timeTracking,
            reminders: this.reminders,
            workingHours: this.workingHours,
            timeBlocks: this.timeBlocks,
            productivityMetrics: this.productivityMetrics,
            userPreferences: this.userPreferences,
            exportDate: new Date().toISOString()
        };
    }
    
    importData(data) {
        if (data.timeTracking) this.timeTracking = data.timeTracking;
        if (data.reminders) this.reminders = data.reminders;
        if (data.workingHours) this.workingHours = data.workingHours;
        if (data.timeBlocks) this.timeBlocks = data.timeBlocks;
        if (data.productivityMetrics) this.productivityMetrics = data.productivityMetrics;
        if (data.userPreferences) this.userPreferences = data.userPreferences;
        
        // Save to localStorage
        this.saveReminders();
        this.saveWorkingHours();
        this.saveTimeBlocks();
        this.saveProductivityMetrics();
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedTimeManager;
} else {
    window.AdvancedTimeManager = AdvancedTimeManager;
}
