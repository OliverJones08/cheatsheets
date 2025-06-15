// Controller for thread actions
const storage = require('../storage');
const Thread = require('../models/Thread');

let threads = storage.loadCheatsheets(); // For now, reuse cheatsheets.json for threads

function saveThreads() {
    storage.saveCheatsheets(threads);
}

exports.getAll = (req, res) => {
    res.json(threads.filter(t => !t.parentId));
};

exports.getTop10 = (req, res) => {
    const top = threads.filter(t => !t.parentId).sort((a, b) => b.likes - a.likes).slice(0, 10);
    res.json(top);
};

exports.search = (req, res) => {
    const { q } = req.query;
    const result = threads.filter(t => t.content && t.content.toLowerCase().includes((q||'').toLowerCase()));
    res.json(result);
};

exports.create = (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Contenido vacío' });
    const thread = new Thread({
        id: Date.now().toString(),
        user: req.session.user,
        content,
        createdAt: new Date().toISOString()
    });
    threads.push(thread);
    saveThreads();
    res.status(201).json(thread);
};

exports.like = (req, res) => {
    const thread = threads.find(t => t.id === req.params.id);
    if (!thread) return res.status(404).json({ error: 'No encontrado' });
    if (thread.likedBy.includes(req.session.user)) return res.status(400).json({ error: 'Ya le diste like' });
    thread.likes++;
    thread.likedBy.push(req.session.user);
    saveThreads();
    res.json({ likes: thread.likes });
};

exports.comment = (req, res) => {
    const thread = threads.find(t => t.id === req.params.id);
    if (!thread) return res.status(404).json({ error: 'No encontrado' });
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Comentario vacío' });
    thread.comments.push({ user: req.session.user, text, date: new Date().toISOString() });
    saveThreads();
    res.json(thread.comments);
};

exports.repost = (req, res) => {
    const thread = threads.find(t => t.id === req.params.id);
    if (!thread) return res.status(404).json({ error: 'No encontrado' });
    if (thread.repostedBy.includes(req.session.user)) return res.status(400).json({ error: 'Ya lo has compartido' });
    thread.reposts++;
    thread.repostedBy.push(req.session.user);
    saveThreads();
    res.json({ reposts: thread.reposts });
};

exports.reply = (req, res) => {
    const parent = threads.find(t => t.id === req.params.id);
    if (!parent) return res.status(404).json({ error: 'No encontrado' });
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Respuesta vacía' });
    const reply = new Thread({
        id: Date.now().toString(),
        user: req.session.user,
        content,
        createdAt: new Date().toISOString(),
        parentId: parent.id
    });
    threads.push(reply);
    parent.replies.push(reply.id);
    saveThreads();
    res.status(201).json(reply);
};
