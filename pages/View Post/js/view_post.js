// Shared: dark mode, toast
function setupDarkMode() {
  const btn = document.createElement('button');
  btn.textContent = '🌙 Modo oscuro';
  btn.style.position = 'fixed';
  btn.style.bottom = '1rem';
  btn.style.right = '1rem';
  btn.style.zIndex = 1000;
  btn.style.background = '#1da1f2';
  btn.style.color = '#fff';
  btn.style.border = 'none';
  btn.style.borderRadius = '50px';
  btn.style.padding = '0.7rem 1.2rem';
  btn.style.fontWeight = 'bold';
  btn.style.cursor = 'pointer';
  btn.onclick = () => {
    document.body.classList.toggle('dark-mode');
    btn.textContent = document.body.classList.contains('dark-mode') ? '☀️ Modo claro' : '🌙 Modo oscuro';
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
  };
  document.body.appendChild(btn);
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    btn.textContent = '☀️ Modo claro';
  }
}
document.addEventListener('DOMContentLoaded', setupDarkMode);
function showToast(message, type = 'info') {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '2rem';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = type === 'error' ? '#e0245e' : '#1da1f2';
    toast.style.color = '#fff';
    toast.style.padding = '1rem 2rem';
    toast.style.borderRadius = '8px';
    toast.style.fontWeight = 'bold';
    toast.style.zIndex = 3000;
    toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    toast.style.opacity = 0;
    toast.style.transition = 'opacity 0.3s';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = 1;
  setTimeout(() => { toast.style.opacity = 0; }, 2500);
}
// Utility: get thread id from URL (e.g., ?id=123)
function getThreadId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}
// Render thread, comments, replies, actions
async function renderThread() {
  const id = getThreadId();
  if (!id) return showToast('ID de publicación no encontrado', 'error');
  try {
    const res = await fetch(`/api/threads`);
    const threads = await res.json();
    const thread = threads.find(t => t.id === id);
    if (!thread) return showToast('Publicación no encontrada', 'error');
    const createdDate = new Date(thread.createdAt);
    const timeAgo = formatTimeAgo(thread.createdAt);
    const readingTime = estimateReadingTime(thread.content);
    document.getElementById('thread-content').innerHTML = `
      <div class="thread-header">
        <div class="thread-author">
          <img src="/placeholder.svg?height=40&width=40" alt="Avatar" class="author-avatar">
          <div class="author-info">
            <strong>${thread.user || 'anónimo'}</strong>
            <div class="thread-time">
              <span class="time-ago" title="${createdDate.toLocaleString()}">${timeAgo}</span>
              <span class="reading-time">📖 ${readingTime} min de lectura</span>
            </div>
          </div>
        </div>
        ${thread.updatedAt !== thread.createdAt ? 
          `<div class="edit-indicator">
            <small>✏️ Editado ${formatTimeAgo(thread.updatedAt)}</small>
          </div>` : ''
        }
      </div>
      
      <div class="thread-body">
        <div class="thread-content-text">${thread.content}</div>
        
        <div class="thread-meta">
          <div class="engagement-stats">
            <span>👀 ${calculateEngagementScore(thread)} puntos de engagement</span>
            <span>🔥 ${getViralityScore(thread)} viralidad</span>
          </div>
          <div class="time-stats">
            <span>📅 ${createdDate.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
            <span>🕐 ${createdDate.toLocaleTimeString('es-ES')}</span>
          </div>
        </div>
      </div>
    `;
    document.getElementById('thread-actions').innerHTML = `
      <div class="action-buttons">
        <button id="like-btn" class="action-btn">
          ❤️ <span>${thread.likes}</span>
        </button>
        <button id="repost-btn" class="action-btn">
          🔄 <span>${thread.reposts || 0}</span>
        </button>
        <button id="share-btn" class="action-btn" onclick="shareThread('${thread.id}')">
          🔗 Compartir
        </button>
      </div>
    `;
    // Comments
    const commentsHtml = (thread.comments || []).map(c => {
      const commentTime = formatTimeAgo(c.date);
      return `
        <div class="comment">
          <div class="comment-header">
            <strong>${c.user}:</strong>
            <span class="comment-time" title="${new Date(c.date).toLocaleString()}">${commentTime}</span>
          </div>
          <div class="comment-content">${c.text}</div>
        </div>
      `;
    }).join('');
    document.getElementById('comments-list').innerHTML = commentsHtml || '<p>No hay comentarios aún</p>';
    // Replies
    const repliesHtml = (thread.replies || []).map(rid => {
      const reply = threads.find(t => t.id === rid);
      if (!reply) return '';
      const replyTime = formatTimeAgo(reply.createdAt);
      return `
        <div class="reply">
          <div class="reply-header">
            <strong>${reply.user}:</strong>
            <span class="reply-time" title="${new Date(reply.createdAt).toLocaleString()}">${replyTime}</span>
          </div>
          <div class="reply-content">${reply.content}</div>
        </div>
      `;
    }).join('');
    document.getElementById('replies-list').innerHTML = repliesHtml || '<p>No hay respuestas aún</p>';
    // Set up action handlers
    setupActionHandlers(thread);
    // Start time updates
    startTimeUpdates();
  } catch (error) {
    showToast('Error al cargar la publicación', 'error');
    console.error(error);
  }
}
function renderReply(rid, threads) {
  const reply = threads.find(t => t.id === rid);
  if (!reply) return '';
  return `<b>${reply.user}:</b> <span>${reply.content}</span> <small>${new Date(reply.createdAt).toLocaleString()}</small>`;
}
document.addEventListener('DOMContentLoaded', () => {
  renderThread();
  // Comment form
  const commentForm = document.getElementById('comment-form');
  commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = getThreadId();
    const text = commentForm.querySelector('input').value.trim();
    if (!text) return showToast('Comentario vacío', 'error');
    const res = await fetch(`/api/threads/${id}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (res.ok) {
      showToast('¡Comentario publicado!');
      commentForm.reset();
      renderThread();
    } else if (res.status === 401) {
      showToast('Debes iniciar sesión', 'error');
    } else {
      showToast('Error al comentar', 'error');
    }
  });
  // Reply form
  const replyForm = document.getElementById('reply-form');
  replyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = getThreadId();
    const content = replyForm.querySelector('input').value.trim();
    if (!content) return showToast('Respuesta vacía', 'error');
    const res = await fetch(`/api/threads/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (res.ok) {
      showToast('¡Respuesta publicada!');
      replyForm.reset();
      renderThread();
    } else if (res.status === 401) {
      showToast('Debes iniciar sesión', 'error');
    } else {
      showToast('Error al responder', 'error');
    }
  });
});
// Enhanced View Post with Time Features
// Load TimeUtils
const timeUtilsScript = document.createElement('script');
timeUtilsScript.src = '/utils/timeUtils.js';
document.head.appendChild(timeUtilsScript);

// Time-aware rendering
function enhanceTimeDisplay() {
  // Add real-time clock
  const clockContainer = document.createElement('div');
  clockContainer.className = 'time-display';
  clockContainer.innerHTML = `
    <div class="current-time">
      <span id="current-time-display"></span>
    </div>
  `;
  document.body.appendChild(clockContainer);
  
  // Update clock every second
  setInterval(() => {
    const timeEl = document.getElementById('current-time-display');
    if (timeEl) {
      timeEl.textContent = new Date().toLocaleTimeString('es-ES');
    }
  }, 1000);
}

// Enhanced thread rendering with better time display
const originalRenderThread = renderThread;
renderThread = async function() {
  const id = getThreadId();
  if (!id) return showToast('ID de publicación no encontrado', 'error');
  
  try {
    const res = await fetch(`/api/threads`);
    const threads = await res.json();
    const thread = threads.find(t => t.id === id);
    if (!thread) return showToast('Publicación no encontrada', 'error');
    
    const createdDate = new Date(thread.createdAt);
    const timeAgo = formatTimeAgo(thread.createdAt);
    const readingTime = estimateReadingTime(thread.content);
    
    document.getElementById('thread-content').innerHTML = `
      <div class="thread-header">
        <div class="thread-author">
          <img src="/placeholder.svg?height=40&width=40" alt="Avatar" class="author-avatar">
          <div class="author-info">
            <strong>${thread.user || 'anónimo'}</strong>
            <div class="thread-time">
              <span class="time-ago" title="${createdDate.toLocaleString()}">${timeAgo}</span>
              <span class="reading-time">📖 ${readingTime} min de lectura</span>
            </div>
          </div>
        </div>
        ${thread.updatedAt !== thread.createdAt ? 
          `<div class="edit-indicator">
            <small>✏️ Editado ${formatTimeAgo(thread.updatedAt)}</small>
          </div>` : ''
        }
      </div>
      
      <div class="thread-body">
        <div class="thread-content-text">${thread.content}</div>
        
        <div class="thread-meta">
          <div class="engagement-stats">
            <span>👀 ${calculateEngagementScore(thread)} puntos de engagement</span>
            <span>🔥 ${getViralityScore(thread)} viralidad</span>
          </div>
          <div class="time-stats">
            <span>📅 ${createdDate.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
            <span>🕐 ${createdDate.toLocaleTimeString('es-ES')}</span>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('thread-actions').innerHTML = `
      <div class="action-buttons">
        <button id="like-btn" class="action-btn">
          ❤️ <span>${thread.likes}</span>
        </button>
        <button id="repost-btn" class="action-btn">
          🔄 <span>${thread.reposts || 0}</span>
        </button>
        <button id="share-btn" class="action-btn" onclick="shareThread('${thread.id}')">
          🔗 Compartir
        </button>
      </div>
    `;
    
    // Enhanced comments with time display
    const commentsHtml = (thread.comments || []).map(c => {
      const commentTime = formatTimeAgo(c.date);
      return `
        <div class="comment">
          <div class="comment-header">
            <strong>${c.user}:</strong>
            <span class="comment-time" title="${new Date(c.date).toLocaleString()}">${commentTime}</span>
          </div>
          <div class="comment-content">${c.text}</div>
        </div>
      `;
    }).join('');
    
    document.getElementById('comments-list').innerHTML = commentsHtml || '<p>No hay comentarios aún</p>';
    
    // Replies with time display
    const repliesHtml = (thread.replies || []).map(rid => {
      const reply = threads.find(t => t.id === rid);
      if (!reply) return '';
      
      const replyTime = formatTimeAgo(reply.createdAt);
      return `
        <div class="reply">
          <div class="reply-header">
            <strong>${reply.user}:</strong>
            <span class="reply-time" title="${new Date(reply.createdAt).toLocaleString()}">${replyTime}</span>
          </div>
          <div class="reply-content">${reply.content}</div>
        </div>
      `;
    }).join('');
    
    document.getElementById('replies-list').innerHTML = repliesHtml || '<p>No hay respuestas aún</p>';
    
    // Set up action handlers
    setupActionHandlers(thread);
    
    // Start time updates
    startTimeUpdates();
    
  } catch (error) {
    showToast('Error al cargar la publicación', 'error');
    console.error(error);
  }
};

function formatTimeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  const intervals = [
    { name: 'año', seconds: 31536000 },
    { name: 'mes', seconds: 2592000 },
    { name: 'semana', seconds: 604800 },
    { name: 'día', seconds: 86400 },
    { name: 'hora', seconds: 3600 },
    { name: 'minuto', seconds: 60 }
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count > 0) {
      const plural = count === 1 ? interval.name : 
        (interval.name === 'mes' ? 'meses' : interval.name + 's');
      return `hace ${count} ${plural}`;
    }
  }
  
  return 'hace un momento';
}

function estimateReadingTime(text) {
  const words = text.split(/\s+/).length;
  return Math.ceil(words / 200);
}

function calculateEngagementScore(thread) {
  const likes = thread.likes || 0;
  const comments = thread.comments?.length || 0;
  const reposts = thread.reposts || 0;
  
  // Weighted score: likes=1, comments=2, reposts=3
  return likes + (comments * 2) + (reposts * 3);
}

function getViralityScore(thread) {
  const ageInHours = (new Date() - new Date(thread.createdAt)) / (1000 * 60 * 60);
  const engagementScore = calculateEngagementScore(thread);
  
  if (ageInHours === 0) return 0;
  
  const viralityScore = engagementScore / ageInHours;
  
  if (viralityScore > 10) return 'Alta';
  if (viralityScore > 5) return 'Media';
  if (viralityScore > 1) return 'Baja';
  return 'Mínima';
}

function setupActionHandlers(thread) {
  // Like button
  document.getElementById('like-btn').onclick = async () => {
    try {
      const res = await fetch(`/api/threads/${thread.id}/like`, { method: 'POST' });
      if (res.ok) {
        showToast('¡Te gusta esta publicación!');
        renderThread(); // Refresh to show updated counts
      } else if (res.status === 401) {
        showToast('Debes iniciar sesión', 'error');
      } else {
        showToast('Ya le diste like', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };
  
  // Repost button
  document.getElementById('repost-btn').onclick = async () => {
    try {
      const res = await fetch(`/api/threads/${thread.id}/repost`, { method: 'POST' });
      if (res.ok) {
        showToast('¡Publicación compartida!');
        renderThread();
      } else if (res.status === 401) {
        showToast('Debes iniciar sesión', 'error');
      } else {
        showToast('Ya lo has compartido', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };
}

function shareThread(threadId) {
  const url = `${window.location.origin}/pages/View Post/views/view_post.html?id=${threadId}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'Publicación en Cheatsheets',
      text: 'Mira esta publicación interesante',
      url: url
    });
  } else {
    // Fallback - copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      showToast('Enlace copiado al portapapeles');
    });
  }
}

function startTimeUpdates() {
  // Update relative times every minute
  setInterval(() => {
    document.querySelectorAll('.time-ago, .comment-time, .reply-time').forEach(el => {
      const fullDate = el.getAttribute('title');
      if (fullDate) {
        const originalDate = new Date(fullDate);
        el.textContent = formatTimeAgo(originalDate.toISOString());
      }
    });
  }, 60000);
}

// Add activity timeline
function createActivityTimeline(thread) {
  const timeline = document.createElement('div');
  timeline.className = 'activity-timeline';
  
  const events = [];
  
  // Add creation event
  events.push({
    type: 'created',
    date: thread.createdAt,
    description: 'Publicación creada'
  });
  
  // Add like events (sample - you might want to track actual like timestamps)
  if (thread.likes > 0) {
    events.push({
      type: 'likes',
      date: thread.createdAt, // This would be actual like timestamps
      description: `${thread.likes} like${thread.likes > 1 ? 's' : ''}`
    });
  }
  
  // Add comment events
  (thread.comments || []).forEach(comment => {
    events.push({
      type: 'comment',
      date: comment.date,
      description: `Comentario de ${comment.user}`
    });
  });
  
  // Sort events by date
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  timeline.innerHTML = `
    <h4>📊 Línea de tiempo de actividad</h4>
    <div class="timeline-events">
      ${events.map(event => `
        <div class="timeline-event ${event.type}">
          <div class="event-time">${formatTimeAgo(event.date)}</div>
          <div class="event-description">${event.description}</div>
        </div>
      `).join('')}
    </div>
  `;
  
  return timeline;
}

// Initialize time features
document.addEventListener('DOMContentLoaded', () => {
  enhanceTimeDisplay();
  renderThread();
});
