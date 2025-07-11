// Demo script to showcase enhanced time features
console.log('🕐 Cheatsheets Time Features Demo');
console.log('================================');

// Simulate loading TimeUtils
const TimeUtils = {
    timeAgo: (date) => {
        const now = new Date();
        const past = new Date(date);
        const diffInSeconds = Math.floor((now - past) / 1000);
        
        if (diffInSeconds < 60) return 'hace un momento';
        if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)}h`;
        if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)}d`;
        
        return past.toLocaleDateString();
    },
    
    formatDate: (date, format = 'relative') => {
        const dateObj = new Date(date);
        
        switch (format) {
            case 'relative':
                return TimeUtils.timeAgo(date);
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
            default:
                return dateObj.toLocaleString('es-ES');
        }
    },
    
    estimateReadingTime: (text) => {
        const words = text.split(/\s+/).length;
        return Math.ceil(words / 200);
    },
    
    createScheduledDate: (days = 0, hours = 0, minutes = 0) => {
        const future = new Date();
        future.setDate(future.getDate() + days);
        future.setHours(future.getHours() + hours);
        future.setMinutes(future.getMinutes() + minutes);
        return future;
    }
};

// Demo 1: Time formatting
console.log('\n📅 Time Formatting Demo:');
console.log('------------------------');

const now = new Date();
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

console.log(`Now: ${TimeUtils.formatDate(now, 'long')}`);
console.log(`1 hour ago: ${TimeUtils.timeAgo(oneHourAgo)}`);
console.log(`1 day ago: ${TimeUtils.timeAgo(oneDayAgo)}`);
console.log(`1 week ago: ${TimeUtils.timeAgo(oneWeekAgo)}`);

// Demo 2: Reading time estimation
console.log('\n📖 Reading Time Demo:');
console.log('---------------------');

const sampleTexts = [
    'Hola mundo',
    'Este es un texto más largo que demuestra cómo funciona la estimación de tiempo de lectura.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
];

sampleTexts.forEach((text, index) => {
    const readingTime = TimeUtils.estimateReadingTime(text);
    console.log(`Text ${index + 1}: ${readingTime} min (${text.split(' ').length} palabras)`);
});

// Demo 3: Schedule dates
console.log('\n⏰ Scheduling Demo:');
console.log('-------------------');

const scheduleIn1Hour = TimeUtils.createScheduledDate(0, 1, 0);
const scheduleIn1Day = TimeUtils.createScheduledDate(1, 0, 0);
const scheduleIn1Week = TimeUtils.createScheduledDate(7, 0, 0);

console.log(`Schedule in 1 hour: ${scheduleIn1Hour.toLocaleString()}`);
console.log(`Schedule in 1 day: ${scheduleIn1Day.toLocaleString()}`);
console.log(`Schedule in 1 week: ${scheduleIn1Week.toLocaleString()}`);

// Demo 4: Mock post data with time features
console.log('\n📝 Mock Post Data:');
console.log('------------------');

const mockPosts = [
    {
        id: '1',
        content: 'Mi primer post programado con las nuevas características de tiempo!',
        createdAt: oneHourAgo.toISOString(),
        likes: 5,
        comments: 2,
        user: 'usuario1'
    },
    {
        id: '2',
        content: 'Guía completa de JavaScript: Variables, funciones, objetos y más. Todo lo que necesitas saber para empezar a programar.',
        createdAt: oneDayAgo.toISOString(),
        likes: 15,
        comments: 8,
        user: 'usuario2'
    },
    {
        id: '3',
        content: 'Tips rápidos para CSS Grid y Flexbox',
        createdAt: oneWeekAgo.toISOString(),
        likes: 8,
        comments: 3,
        user: 'usuario3'
    }
];

mockPosts.forEach(post => {
    console.log(`\nPost ID: ${post.id}`);
    console.log(`Usuario: ${post.user}`);
    console.log(`Contenido: ${post.content.substring(0, 50)}...`);
    console.log(`Creado: ${TimeUtils.timeAgo(post.createdAt)}`);
    console.log(`Tiempo de lectura: ${TimeUtils.estimateReadingTime(post.content)} min`);
    console.log(`Engagement: ${post.likes + post.comments} interacciones`);
});

// Demo 5: Activity simulation
console.log('\n🔥 Activity Simulation:');
console.log('-----------------------');

function simulateActivity() {
    const hours = Array.from({length: 24}, (_, i) => i);
    const activityData = hours.map(hour => {
        let activity = 'Baja';
        if (hour >= 9 && hour <= 12) activity = 'Alta (mañana)';
        else if (hour >= 14 && hour <= 17) activity = 'Media (tarde)';
        else if (hour >= 19 && hour <= 22) activity = 'Alta (noche)';
        
        return { hour, activity };
    });
    
    console.log('Actividad por horas:');
    activityData.forEach(data => {
        if (data.activity !== 'Baja') {
            console.log(`${data.hour.toString().padStart(2, '0')}:00 - ${data.activity}`);
        }
    });
}

simulateActivity();

// Demo 6: Timezone info
console.log('\n🌍 Timezone Information:');
console.log('------------------------');

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const offset = new Date().getTimezoneOffset();

console.log(`Timezone: ${timeZone}`);
console.log(`Offset: ${offset} minutes`);
console.log(`Local time: ${new Date().toLocaleString()}`);
console.log(`UTC time: ${new Date().toISOString()}`);

console.log('\n✅ Demo completed! Check the server at http://localhost:3000');
console.log('🎯 Try the new time features:');
console.log('   - Post scheduling in Make Post page');
console.log('   - Time filters in Home page');
console.log('   - Enhanced time display in View Post page');
console.log('   - Draft management with auto-save');
console.log('   - Real-time activity indicators');
