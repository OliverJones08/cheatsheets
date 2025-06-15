// Thread model for threads/posts
class Thread {
    constructor({ id, user, content, createdAt, likes = 0, likedBy = [], comments = [], reposts = 0, repostedBy = [], replies = [], parentId = null }) {
        this.id = id;
        this.user = user;
        this.content = content;
        this.createdAt = createdAt;
        this.likes = likes;
        this.likedBy = likedBy;
        this.comments = comments;
        this.reposts = reposts;
        this.repostedBy = repostedBy;
        this.replies = replies;
        this.parentId = parentId;
    }
}

module.exports = Thread;
