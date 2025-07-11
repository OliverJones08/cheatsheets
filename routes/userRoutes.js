const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Middleware: require login
function requireLogin(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
    next();
}

router.get('/search', userController.searchUsers);
router.get('/:username', userController.getProfile);
router.put('/profile', requireLogin, userController.updateProfile);
router.post('/:username/follow', requireLogin, userController.followUser);
router.delete('/:username/follow', requireLogin, userController.unfollowUser);
router.get('/:username/followers', userController.getFollowers);
router.get('/:username/following', userController.getFollowing);

module.exports = router;
