// Analytics Controller
const storage = require('../storage');

let users = storage.loadUsers();
let threads = storage.loadCheatsheets();

exports.getUserAnalytics = (req, res) => {
    const user = users.find(u => u.username === req.session.user);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const userThreads = threads.filter(t => t.user === req.session.user);
    const totalLikes = userThreads.reduce((sum, t) => sum + (t.likes || 0), 0);
    const totalComments = userThreads.reduce((sum, t) => sum + (t.comments?.length || 0), 0);
    const totalReposts = userThreads.reduce((sum, t) => sum + (t.reposts || 0), 0);

    // Engagement over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentThreads = userThreads.filter(t => 
        new Date(t.createdAt) >= thirtyDaysAgo
    );

    const analytics = {
        totalPosts: userThreads.length,
        totalLikes,
        totalComments,
        totalReposts,
        totalEngagement: totalLikes + totalComments + totalReposts,
        followers: user.followers?.length || 0,
        following: user.following?.length || 0,
        recentPosts: recentThreads.length,
        averageLikesPerPost: userThreads.length > 0 ? (totalLikes / userThreads.length).toFixed(1) : 0,
        mostLikedPost: userThreads.sort((a, b) => (b.likes || 0) - (a.likes || 0))[0] || null,
        engagementByDay: this.getEngagementByDay(userThreads),
        topHashtags: this.getTopHashtags(userThreads)
    };

    res.json(analytics);
};

exports.getGlobalAnalytics = (req, res) => {
    // Only allow admins or for public stats
    const totalUsers = users.length;
    const totalThreads = threads.length;
    const totalLikes = threads.reduce((sum, t) => sum + (t.likes || 0), 0);
    const totalComments = threads.reduce((sum, t) => sum + (t.comments?.length || 0), 0);

    const analytics = {
        totalUsers,
        totalThreads,
        totalLikes,
        totalComments,
        averagePostsPerUser: totalUsers > 0 ? (totalThreads / totalUsers).toFixed(1) : 0,
        mostActiveUsers: this.getMostActiveUsers(5),
        trendingTopics: this.getTrendingTopics(10),
        activityByHour: this.getActivityByHour()
    };

    res.json(analytics);
};

exports.getEngagementByDay = (userThreads) => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayKey = date.toISOString().split('T')[0];
        
        const dayThreads = userThreads.filter(t => 
            t.createdAt.startsWith(dayKey)
        );
        
        const engagement = dayThreads.reduce((sum, t) => 
            sum + (t.likes || 0) + (t.comments?.length || 0) + (t.reposts || 0), 0
        );
        
        last7Days.push({
            date: dayKey,
            posts: dayThreads.length,
            engagement
        });
    }
    return last7Days;
};

exports.getTopHashtags = (userThreads) => {
    const hashtagCount = {};
    
    userThreads.forEach(thread => {
        const hashtags = thread.content?.match(/#\w+/g) || [];
        hashtags.forEach(tag => {
            const normalizedTag = tag.toLowerCase();
            hashtagCount[normalizedTag] = (hashtagCount[normalizedTag] || 0) + 1;
        });
    });
    
    return Object.entries(hashtagCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));
};

exports.getMostActiveUsers = (limit) => {
    const userActivity = users.map(user => {
        const userThreads = threads.filter(t => t.user === user.username);
        const totalEngagement = userThreads.reduce((sum, t) => 
            sum + (t.likes || 0) + (t.comments?.length || 0) + (t.reposts || 0), 0
        );
        
        return {
            username: user.username,
            posts: userThreads.length,
            engagement: totalEngagement,
            followers: user.followers?.length || 0
        };
    });
    
    return userActivity
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, limit);
};

exports.getTrendingTopics = (limit) => {
    const topicCount = {};
    
    threads.forEach(thread => {
        const hashtags = thread.content?.match(/#\w+/g) || [];
        hashtags.forEach(tag => {
            const normalizedTag = tag.toLowerCase();
            topicCount[normalizedTag] = (topicCount[normalizedTag] || 0) + 1;
        });
    });
    
    return Object.entries(topicCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }));
};

exports.getActivityByHour = () => {
    const hourlyActivity = new Array(24).fill(0);
    
    threads.forEach(thread => {
        const hour = new Date(thread.createdAt).getHours();
        hourlyActivity[hour]++;
    });
    
    return hourlyActivity.map((count, hour) => ({
        hour: `${hour}:00`,
        posts: count
    }));
};
