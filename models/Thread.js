// Thread model for threads/posts
class Thread {
    constructor({ 
        id, user, content, createdAt, likes = 0, likedBy = [], comments = [], 
        reposts = 0, repostedBy = [], replies = [], parentId = null,
        updatedAt = null, scheduledPost = false, originalScheduledFor = null,
        tags = [], mentions = [], readingTime = null, lastActivityAt = null,
        timeZone = null, editHistory = []
    }) {
        this.id = id;
        this.user = user;
        this.content = content;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt || createdAt;
        this.likes = likes;
        this.likedBy = likedBy;
        this.comments = comments;
        this.reposts = reposts;
        this.repostedBy = repostedBy;
        this.replies = replies;
        this.parentId = parentId;
        this.scheduledPost = scheduledPost;
        this.originalScheduledFor = originalScheduledFor;
        this.tags = tags;
        this.mentions = mentions;
        this.readingTime = readingTime;
        this.lastActivityAt = lastActivityAt || createdAt;
        this.timeZone = timeZone;
        this.editHistory = editHistory;
    }
    
    // Calculate reading time based on content
    calculateReadingTime() {
        const wordsPerMinute = 200;
        const words = this.content.trim().split(/\s+/).length;
        const minutes = Math.ceil(words / wordsPerMinute);
        this.readingTime = minutes;
        return minutes;
    }
    
    // Update last activity time
    updateActivity() {
        this.lastActivityAt = new Date().toISOString();
    }
    
    // Add to edit history when content is updated
    addEdit(newContent, editor) {
        this.editHistory.push({
            previousContent: this.content,
            editedAt: new Date().toISOString(),
            editedBy: editor,
            reason: 'content_update'
        });
        this.content = newContent;
        this.updatedAt = new Date().toISOString();
        this.calculateReadingTime();
    }
    
    // Get time statistics
    getTimeStats() {
        const created = new Date(this.createdAt);
        const now = new Date();
        const ageInHours = (now - created) / (1000 * 60 * 60);
        const ageInDays = ageInHours / 24;
        
        return {
            ageInHours: Math.round(ageInHours * 100) / 100,
            ageInDays: Math.round(ageInDays * 100) / 100,
            isRecent: ageInHours < 24,
            isNew: ageInHours < 1,
            readingTime: this.readingTime || this.calculateReadingTime(),
            hasBeenEdited: this.editHistory.length > 0,
            lastEdit: this.editHistory.length > 0 ? this.editHistory[this.editHistory.length - 1] : null
        };
    }
}

module.exports = Thread;
