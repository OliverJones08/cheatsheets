const express = require('express');
const router = express.Router();
const threadController = require('../controllers/threadController');

// Middleware: require login
function requireLogin(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
    next();
}

router.get('/', threadController.getAll);
router.get('/top', threadController.getTop10);
router.get('/search', threadController.search);
router.post('/', requireLogin, threadController.create);
router.post('/:id/like', requireLogin, threadController.like);
router.post('/:id/comment', requireLogin, threadController.comment);
router.post('/:id/repost', requireLogin, threadController.repost);
router.post('/:id/reply', requireLogin, threadController.reply);

module.exports = router;
