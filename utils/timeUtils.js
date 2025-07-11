// Time Utilities for enhanced time functionality
class TimeUtils {
    
    /**
     * Format a date to relative time (e.g., "2 hours ago", "3 days ago")
     */
    static timeAgo(date) {
        const now = new Date();
        const past = new Date(date);
        const diffInSeconds = Math.floor((now - past) / 1000);
        
        const intervals = [
            { name: 'año', seconds: 31536000 },
            { name: 'mes', seconds: 2592000 },
            { name: 'semana', seconds: 604800 },
            { name: 'día', seconds: 86400 },
            { name: 'hora', seconds: 3600 },
            { name: 'minuto', seconds: 60 },
            { name: 'segundo', seconds: 1 }
        ];
        
        for (const interval of intervals) {
            const count = Math.floor(diffInSeconds / interval.seconds);
            if (count > 0) {
                const plural = count === 1 ? interval.name : 
                    (interval.name === 'mes' ? 'meses' : interval.name + 's');
                return `hace ${count} ${plural}`;
            }
        }
        
        return 'ahora mismo';
    }
    
    /**
     * Format date for display with multiple options
     */
    static formatDate(date, format = 'relative') {
        const dateObj = new Date(date);
        
        switch (format) {
            case 'relative':
                return this.timeAgo(date);
            case 'short':
                return dateObj.toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            case 'long':
                return dateObj.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            case 'time':
                return dateObj.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            case 'iso':
                return dateObj.toISOString();
            default:
                return dateObj.toLocaleString('es-ES');
        }
    }
    
    /**
     * Check if a date is today
     */
    static isToday(date) {
        const today = new Date();
        const checkDate = new Date(date);
        return today.toDateString() === checkDate.toDateString();
    }
    
    /**
     * Check if a date is this week
     */
    static isThisWeek(date) {
        const now = new Date();
        const checkDate = new Date(date);
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        
        return checkDate >= weekStart && checkDate < weekEnd;
    }
    
    /**
     * Get time zone offset and name
     */
    static getTimeZoneInfo() {
        const date = new Date();
        return {
            offset: date.getTimezoneOffset(),
            name: Intl.DateTimeFormat().resolvedOptions().timeZone,
            abbr: date.toLocaleTimeString('en-us', {timeZoneName:'short'}).split(' ')[2]
        };
    }
    
    /**
     * Create a scheduled date for posting
     */
    static createScheduledDate(days = 0, hours = 0, minutes = 0) {
        const future = new Date();
        future.setDate(future.getDate() + days);
        future.setHours(future.getHours() + hours);
        future.setMinutes(future.getMinutes() + minutes);
        return future.toISOString();
    }
    
    /**
     * Check if a scheduled date is ready to post
     */
    static isReadyToPost(scheduledDate) {
        return new Date() >= new Date(scheduledDate);
    }
    
    /**
     * Get time until scheduled post
     */
    static timeUntilScheduled(scheduledDate) {
        const now = new Date();
        const scheduled = new Date(scheduledDate);
        const diff = scheduled - now;
        
        if (diff <= 0) return 'Listo para publicar';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `En ${days} día${days > 1 ? 's' : ''} y ${hours} hora${hours !== 1 ? 's' : ''}`;
        if (hours > 0) return `En ${hours} hora${hours !== 1 ? 's' : ''} y ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        return `En ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    }
    
    /**
     * Get activity periods for analytics
     */
    static getActivityPeriods() {
        const now = new Date();
        
        return {
            today: {
                start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
            },
            yesterday: {
                start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
                end: new Date(now.getFullYear(), now.getMonth(), now.getDate())
            },
            thisWeek: {
                start: new Date(now.setDate(now.getDate() - now.getDay())),
                end: new Date(now.setDate(now.getDate() - now.getDay() + 7))
            },
            lastWeek: {
                start: new Date(now.setDate(now.getDate() - now.getDay() - 7)),
                end: new Date(now.setDate(now.getDate() - now.getDay()))
            },
            thisMonth: {
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
            },
            lastMonth: {
                start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                end: new Date(now.getFullYear(), now.getMonth(), 1)
            }
        };
    }
    
    /**
     * Get best posting times based on user activity
     */
    static getBestPostingTimes(threads) {
        const hourlyEngagement = new Array(24).fill(0);
        const hourlyCounts = new Array(24).fill(0);
        
        threads.forEach(thread => {
            const hour = new Date(thread.createdAt).getHours();
            const engagement = (thread.likes || 0) + (thread.comments?.length || 0) + (thread.reposts || 0);
            hourlyEngagement[hour] += engagement;
            hourlyCounts[hour]++;
        });
        
        const averageEngagement = hourlyEngagement.map((total, hour) => ({
            hour,
            average: hourlyCounts[hour] > 0 ? total / hourlyCounts[hour] : 0,
            count: hourlyCounts[hour]
        }));
        
        return averageEngagement
            .filter(h => h.count > 0)
            .sort((a, b) => b.average - a.average)
            .slice(0, 3)
            .map(h => ({
                time: `${h.hour}:00`,
                score: h.average.toFixed(1),
                posts: h.count
            }));
    }
    
    /**
     * Generate time-based analytics
     */
    static generateTimeAnalytics(threads, period = 'week') {
        const periods = this.getActivityPeriods();
        const selectedPeriod = periods[period] || periods.week;
        
        const filteredThreads = threads.filter(thread => {
            const date = new Date(thread.createdAt);
            return date >= selectedPeriod.start && date < selectedPeriod.end;
        });
        
        const dailyStats = {};
        filteredThreads.forEach(thread => {
            const day = new Date(thread.createdAt).toDateString();
            if (!dailyStats[day]) {
                dailyStats[day] = { posts: 0, engagement: 0 };
            }
            dailyStats[day].posts++;
            dailyStats[day].engagement += (thread.likes || 0) + (thread.comments?.length || 0) + (thread.reposts || 0);
        });
        
        return {
            totalPosts: filteredThreads.length,
            totalEngagement: Object.values(dailyStats).reduce((sum, day) => sum + day.engagement, 0),
            dailyBreakdown: dailyStats,
            averagePostsPerDay: Object.keys(dailyStats).length > 0 ? 
                filteredThreads.length / Object.keys(dailyStats).length : 0,
            bestPostingTimes: this.getBestPostingTimes(filteredThreads)
        };
    }
    
    /**
     * Format duration (for reading time, video length, etc.)
     */
    static formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    /**
     * Calculate reading time estimate
     */
    static estimateReadingTime(text) {
        const wordsPerMinute = 200;
        const words = text.trim().split(/\s+/).length;
        const minutes = Math.ceil(words / wordsPerMinute);
        return minutes === 1 ? '1 minuto de lectura' : `${minutes} minutos de lectura`;
    }
    
    /**
     * Get local time in different formats
     */
    static getLocalTime(format = 'full') {
        const now = new Date();
        
        switch (format) {
            case 'time':
                return now.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            case 'date':
                return now.toLocaleDateString('es-ES');
            case 'datetime':
                return now.toLocaleString('es-ES');
            case 'iso':
                return now.toISOString();
            default:
                return now.toLocaleString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
        }
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimeUtils;
} else {
    window.TimeUtils = TimeUtils;
}
