// Post Scheduler and Draft System
const storage = require('../storage');
const Thread = require('../models/Thread');

class PostScheduler {
    constructor() {
        this.scheduledPosts = this.loadScheduledPosts();
        this.drafts = this.loadDrafts();
        this.startScheduler();
    }
    
    loadScheduledPosts() {
        try {
            const fs = require('fs');
            if (fs.existsSync('./scheduled-posts.json')) {
                return JSON.parse(fs.readFileSync('./scheduled-posts.json', 'utf8'));
            }
        } catch (error) {
            console.error('Error loading scheduled posts:', error);
        }
        return [];
    }
    
    saveScheduledPosts() {
        try {
            const fs = require('fs');
            fs.writeFileSync('./scheduled-posts.json', JSON.stringify(this.scheduledPosts, null, 2));
        } catch (error) {
            console.error('Error saving scheduled posts:', error);
        }
    }
    
    loadDrafts() {
        try {
            const fs = require('fs');
            if (fs.existsSync('./drafts.json')) {
                return JSON.parse(fs.readFileSync('./drafts.json', 'utf8'));
            }
        } catch (error) {
            console.error('Error loading drafts:', error);
        }
        return [];
    }
    
    saveDrafts() {
        try {
            const fs = require('fs');
            fs.writeFileSync('./drafts.json', JSON.stringify(this.drafts, null, 2));
        } catch (error) {
            console.error('Error saving drafts:', error);
        }
    }
    
    // Schedule a post for future publication
    schedulePost(user, content, scheduledFor, options = {}) {
        const scheduledPost = {
            id: Date.now().toString(),
            user,
            content,
            scheduledFor: new Date(scheduledFor).toISOString(),
            createdAt: new Date().toISOString(),
            options: {
                tags: options.tags || [],
                mentions: options.mentions || [],
                visibility: options.visibility || 'public'
            },
            status: 'scheduled'
        };
        
        this.scheduledPosts.push(scheduledPost);
        this.saveScheduledPosts();
        
        return scheduledPost;
    }
    
    // Save a draft
    saveDraft(user, content, options = {}) {
        const existingDraftIndex = this.drafts.findIndex(d => d.user === user && d.id === options.draftId);
        
        if (existingDraftIndex !== -1) {
            // Update existing draft
            this.drafts[existingDraftIndex] = {
                ...this.drafts[existingDraftIndex],
                content,
                updatedAt: new Date().toISOString(),
                options: {
                    ...this.drafts[existingDraftIndex].options,
                    ...options
                }
            };
        } else {
            // Create new draft
            const draft = {
                id: Date.now().toString(),
                user,
                content,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                options: {
                    title: options.title || '',
                    tags: options.tags || [],
                    mentions: options.mentions || [],
                    visibility: options.visibility || 'public'
                }
            };
            this.drafts.push(draft);
        }
        
        this.saveDrafts();
        return this.drafts.find(d => d.user === user && (d.id === options.draftId || d.content === content));
    }
    
    // Get user's scheduled posts
    getUserScheduledPosts(user) {
        return this.scheduledPosts
            .filter(post => post.user === user)
            .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
    }
    
    // Get user's drafts
    getUserDrafts(user) {
        return this.drafts
            .filter(draft => draft.user === user)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    
    // Cancel a scheduled post
    cancelScheduledPost(postId, user) {
        const index = this.scheduledPosts.findIndex(post => post.id === postId && post.user === user);
        if (index !== -1) {
            const cancelled = this.scheduledPosts.splice(index, 1)[0];
            this.saveScheduledPosts();
            return cancelled;
        }
        return null;
    }
    
    // Delete a draft
    deleteDraft(draftId, user) {
        const index = this.drafts.findIndex(draft => draft.id === draftId && draft.user === user);
        if (index !== -1) {
            const deleted = this.drafts.splice(index, 1)[0];
            this.saveDrafts();
            return deleted;
        }
        return null;
    }
    
    // Publish a draft immediately
    publishDraft(draftId, user) {
        const draft = this.drafts.find(d => d.id === draftId && d.user === user);
        if (!draft) return null;
        
        // Create thread from draft
        const thread = new Thread({
            id: Date.now().toString(),
            user: draft.user,
            content: draft.content,
            createdAt: new Date().toISOString(),
            tags: draft.options.tags,
            mentions: draft.options.mentions
        });
        
        // Add to threads (would normally go through threadController)
        const threads = storage.loadCheatsheets();
        threads.push(thread);
        storage.saveCheatsheets(threads);
        
        // Remove from drafts
        this.deleteDraft(draftId, user);
        
        return thread;
    }
    
    // Start the scheduler that checks for posts ready to publish
    startScheduler() {
        this.schedulerInterval = setInterval(() => {
            this.checkAndPublishScheduledPosts();
        }, 60000); // Check every minute
        
        console.log('Post scheduler started - checking every minute for scheduled posts');
    }
    
    // Check for posts ready to publish and publish them
    checkAndPublishScheduledPosts() {
        const now = new Date();
        const readyPosts = this.scheduledPosts.filter(post => 
            post.status === 'scheduled' && new Date(post.scheduledFor) <= now
        );
        
        readyPosts.forEach(post => {
            this.publishScheduledPost(post);
        });
    }
    
    // Publish a scheduled post
    publishScheduledPost(scheduledPost) {
        try {
            // Create thread from scheduled post
            const thread = new Thread({
                id: Date.now().toString(),
                user: scheduledPost.user,
                content: scheduledPost.content,
                createdAt: new Date().toISOString(),
                tags: scheduledPost.options.tags,
                mentions: scheduledPost.options.mentions,
                scheduledPost: true,
                originalScheduledFor: scheduledPost.scheduledFor
            });
            
            // Add to threads
            const threads = storage.loadCheatsheets();
            threads.push(thread);
            storage.saveCheatsheets(threads);
            
            // Update scheduled post status
            scheduledPost.status = 'published';
            scheduledPost.publishedAt = new Date().toISOString();
            scheduledPost.publishedThreadId = thread.id;
            
            this.saveScheduledPosts();
            
            // Send notification to user if real-time notifications are available
            if (global.sendRealTimeNotification) {
                global.sendRealTimeNotification(scheduledPost.user, {
                    type: 'scheduled_post_published',
                    threadId: thread.id,
                    originalScheduledFor: scheduledPost.scheduledFor,
                    publishedAt: thread.createdAt,
                    date: new Date().toISOString()
                });
            }
            
            console.log(`Published scheduled post ${scheduledPost.id} for user ${scheduledPost.user}`);
            return thread;
            
        } catch (error) {
            console.error('Error publishing scheduled post:', error);
            // Mark as failed
            scheduledPost.status = 'failed';
            scheduledPost.error = error.message;
            this.saveScheduledPosts();
        }
    }
    
    // Get analytics for scheduling
    getSchedulingAnalytics(user) {
        const userScheduled = this.getUserScheduledPosts(user);
        const userDrafts = this.getUserDrafts(user);
        
        const published = userScheduled.filter(p => p.status === 'published');
        const pending = userScheduled.filter(p => p.status === 'scheduled');
        const failed = userScheduled.filter(p => p.status === 'failed');
        
        return {
            totalScheduled: userScheduled.length,
            published: published.length,
            pending: pending.length,
            failed: failed.length,
            totalDrafts: userDrafts.length,
            nextScheduled: pending.length > 0 ? pending[0] : null,
            recentDrafts: userDrafts.slice(0, 5)
        };
    }
    
    // Get optimal posting times based on user's historical engagement
    getOptimalPostingTimes(user) {
        const threads = storage.loadCheatsheets();
        const userThreads = threads.filter(t => t.user === user);
        
        const hourlyEngagement = new Array(24).fill(0);
        const hourlyCounts = new Array(24).fill(0);
        
        userThreads.forEach(thread => {
            const hour = new Date(thread.createdAt).getHours();
            const engagement = (thread.likes || 0) + (thread.comments?.length || 0) + (thread.reposts || 0);
            hourlyEngagement[hour] += engagement;
            hourlyCounts[hour]++;
        });
        
        const averageEngagement = hourlyEngagement.map((total, hour) => ({
            hour,
            time: `${hour.toString().padStart(2, '0')}:00`,
            average: hourlyCounts[hour] > 0 ? (total / hourlyCounts[hour]).toFixed(2) : 0,
            posts: hourlyCounts[hour]
        }));
        
        return averageEngagement
            .filter(h => h.posts > 0)
            .sort((a, b) => parseFloat(b.average) - parseFloat(a.average))
            .slice(0, 5);
    }
    
    // Stop the scheduler
    stopScheduler() {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            console.log('Post scheduler stopped');
        }
    }
}

module.exports = PostScheduler;
