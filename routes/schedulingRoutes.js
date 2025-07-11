// Scheduling and Draft Routes
const express = require('express');
const router = express.Router();

// Middleware to check if user is logged in
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Debes iniciar sesión' });
    }
    next();
}

// Get PostScheduler instance (will be set from main.js)
let postScheduler;

function setPostScheduler(scheduler) {
    postScheduler = scheduler;
}

// Schedule a new post
router.post('/schedule', requireLogin, (req, res) => {
    try {
        const { content, scheduledFor, options } = req.body;
        
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Contenido vacío' });
        }
        
        if (!scheduledFor) {
            return res.status(400).json({ error: 'Fecha de programación requerida' });
        }
        
        const scheduledDate = new Date(scheduledFor);
        if (scheduledDate <= new Date()) {
            return res.status(400).json({ error: 'La fecha debe ser en el futuro' });
        }
        
        const scheduledPost = postScheduler.schedulePost(
            req.session.user,
            content,
            scheduledFor,
            options || {}
        );
        
        res.status(201).json({
            message: 'Publicación programada exitosamente',
            scheduledPost
        });
        
    } catch (error) {
        console.error('Error scheduling post:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get user's scheduled posts
router.get('/scheduled', requireLogin, (req, res) => {
    try {
        const scheduledPosts = postScheduler.getUserScheduledPosts(req.session.user);
        res.json(scheduledPosts);
    } catch (error) {
        console.error('Error getting scheduled posts:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Cancel a scheduled post
router.delete('/scheduled/:id', requireLogin, (req, res) => {
    try {
        const cancelled = postScheduler.cancelScheduledPost(req.params.id, req.session.user);
        
        if (!cancelled) {
            return res.status(404).json({ error: 'Publicación programada no encontrada' });
        }
        
        res.json({
            message: 'Publicación programada cancelada',
            cancelled
        });
        
    } catch (error) {
        console.error('Error cancelling scheduled post:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Save a draft
router.post('/drafts', requireLogin, (req, res) => {
    try {
        const { content, options } = req.body;
        
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Contenido vacío' });
        }
        
        const draft = postScheduler.saveDraft(
            req.session.user,
            content,
            options || {}
        );
        
        res.status(201).json({
            message: 'Borrador guardado',
            draft
        });
        
    } catch (error) {
        console.error('Error saving draft:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get user's drafts
router.get('/drafts', requireLogin, (req, res) => {
    try {
        const drafts = postScheduler.getUserDrafts(req.session.user);
        res.json(drafts);
    } catch (error) {
        console.error('Error getting drafts:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Delete a draft
router.delete('/drafts/:id', requireLogin, (req, res) => {
    try {
        const deleted = postScheduler.deleteDraft(req.params.id, req.session.user);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Borrador no encontrado' });
        }
        
        res.json({
            message: 'Borrador eliminado',
            deleted
        });
        
    } catch (error) {
        console.error('Error deleting draft:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Publish a draft immediately
router.post('/drafts/:id/publish', requireLogin, (req, res) => {
    try {
        const thread = postScheduler.publishDraft(req.params.id, req.session.user);
        
        if (!thread) {
            return res.status(404).json({ error: 'Borrador no encontrado' });
        }
        
        res.status(201).json({
            message: 'Borrador publicado exitosamente',
            thread
        });
        
    } catch (error) {
        console.error('Error publishing draft:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get scheduling analytics
router.get('/analytics', requireLogin, (req, res) => {
    try {
        const analytics = postScheduler.getSchedulingAnalytics(req.session.user);
        res.json(analytics);
    } catch (error) {
        console.error('Error getting scheduling analytics:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get optimal posting times
router.get('/optimal-times', requireLogin, (req, res) => {
    try {
        const optimalTimes = postScheduler.getOptimalPostingTimes(req.session.user);
        res.json(optimalTimes);
    } catch (error) {
        console.error('Error getting optimal times:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get quick schedule suggestions
router.get('/schedule-suggestions', requireLogin, (req, res) => {
    try {
        const now = new Date();
        const suggestions = [
            {
                label: 'En 1 hora',
                value: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
                description: 'Publicar en 1 hora'
            },
            {
                label: 'En 3 horas',
                value: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
                description: 'Publicar en 3 horas'
            },
            {
                label: 'Mañana mismo horario',
                value: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                description: 'Mañana a la misma hora'
            },
            {
                label: 'Próximo lunes 9:00 AM',
                value: (() => {
                    const nextMonday = new Date(now);
                    nextMonday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7);
                    nextMonday.setHours(9, 0, 0, 0);
                    return nextMonday.toISOString();
                })(),
                description: 'Lunes por la mañana'
            },
            {
                label: 'Fin de semana',
                value: (() => {
                    const nextSaturday = new Date(now);
                    nextSaturday.setDate(now.getDate() + (6 - now.getDay()));
                    nextSaturday.setHours(10, 0, 0, 0);
                    return nextSaturday.toISOString();
                })(),
                description: 'Sábado por la mañana'
            }
        ];
        
        res.json(suggestions);
    } catch (error) {
        console.error('Error getting schedule suggestions:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = { router, setPostScheduler };
