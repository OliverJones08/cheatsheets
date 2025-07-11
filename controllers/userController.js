// User Profile Controller
const storage = require('../storage');

let users = storage.loadUsers();

function saveUsers() {
    storage.saveUsers(users);
}

exports.getProfile = (req, res) => {
    const { username } = req.params;
    const user = users.find(u => u.username === username);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // Return public profile data
    const profile = {
        username: user.username,
        bio: user.bio || '',
        avatar: user.avatar || '',
        followers: user.followers || [],
        following: user.following || [],
        joinDate: user.joinDate || new Date().toISOString(),
        postCount: user.postCount || 0,
        likesReceived: user.likesReceived || 0
    };
    
    res.json(profile);
};

exports.updateProfile = (req, res) => {
    const user = users.find(u => u.username === req.session.user);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const { bio, avatar } = req.body;
    
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    
    saveUsers();
    res.json({ message: 'Profile updated successfully' });
};

exports.followUser = (req, res) => {
    const { username } = req.params;
    const currentUser = users.find(u => u.username === req.session.user);
    const targetUser = users.find(u => u.username === username);
    
    if (!currentUser || !targetUser) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    if (currentUser.username === targetUser.username) {
        return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    // Initialize arrays if they don't exist
    if (!currentUser.following) currentUser.following = [];
    if (!targetUser.followers) targetUser.followers = [];
    
    // Check if already following
    if (currentUser.following.includes(username)) {
        return res.status(400).json({ error: 'Already following this user' });
    }
    
    // Add to following/followers
    currentUser.following.push(username);
    targetUser.followers.push(currentUser.username);
    
    saveUsers();
    
    // Send real-time notification
    if (global.sendRealTimeNotification) {
        global.sendRealTimeNotification(username, {
            type: 'follow',
            from: currentUser.username,
            date: new Date().toISOString()
        });
    }
    
    res.json({ message: 'Successfully followed user' });
};

exports.unfollowUser = (req, res) => {
    const { username } = req.params;
    const currentUser = users.find(u => u.username === req.session.user);
    const targetUser = users.find(u => u.username === username);
    
    if (!currentUser || !targetUser) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove from following/followers
    if (currentUser.following) {
        currentUser.following = currentUser.following.filter(u => u !== username);
    }
    if (targetUser.followers) {
        targetUser.followers = targetUser.followers.filter(u => u !== currentUser.username);
    }
    
    saveUsers();
    res.json({ message: 'Successfully unfollowed user' });
};

exports.getFollowers = (req, res) => {
    const { username } = req.params;
    const user = users.find(u => u.username === username);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const followers = (user.followers || []).map(followerUsername => {
        const follower = users.find(u => u.username === followerUsername);
        return follower ? {
            username: follower.username,
            avatar: follower.avatar || '',
            bio: follower.bio || ''
        } : null;
    }).filter(Boolean);
    
    res.json(followers);
};

exports.getFollowing = (req, res) => {
    const { username } = req.params;
    const user = users.find(u => u.username === username);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const following = (user.following || []).map(followingUsername => {
        const followedUser = users.find(u => u.username === followingUsername);
        return followedUser ? {
            username: followedUser.username,
            avatar: followedUser.avatar || '',
            bio: followedUser.bio || ''
        } : null;
    }).filter(Boolean);
    
    res.json(following);
};

exports.searchUsers = (req, res) => {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
        return res.json([]);
    }
    
    const searchTerm = q.toLowerCase();
    const matchingUsers = users
        .filter(user => 
            user.username.toLowerCase().includes(searchTerm) ||
            (user.bio && user.bio.toLowerCase().includes(searchTerm))
        )
        .slice(0, 10) // Limit results
        .map(user => ({
            username: user.username,
            avatar: user.avatar || '',
            bio: user.bio || ''
        }));
    
    res.json(matchingUsers);
};
