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
    document.getElementById('thread-content').innerHTML = `
      <div class="thread-meta">${new Date(thread.createdAt).toLocaleString()} por <b>${thread.user || 'anónimo'}</b></div>
      <div>${thread.content}</div>
    `;
    document.getElementById('thread-actions').innerHTML = `
      <button id="like-btn">❤️ ${thread.likes}</button>
      <button id="repost-btn">🔄 ${thread.reposts || 0}</button>
    `;
    // Comments
    document.getElementById('comments-list').innerHTML = (thread.comments||[]).map(c =>
      `<div class='comment'><b>${c.user}:</b> <span>${c.text}</span> <small>${new Date(c.date).toLocaleString()}</small></div>`
    ).join('');
    // Replies
    document.getElementById('replies-list').innerHTML = (thread.replies||[]).map(rid =>
      `<div class='reply'>${renderReply(rid, threads)}</div>`
    ).join('');
    // Like
    document.getElementById('like-btn').onclick = async () => {
      const res = await fetch(`/api/threads/${id}/like`, { method: 'POST' });
      if (res.ok) {
        showToast('¡Te gusta esta publicación!');
        renderThread();
      } else if (res.status === 401) {
        showToast('Debes iniciar sesión', 'error');
      } else {
        showToast('Ya le diste like', 'error');
      }
    };
    // Repost
    document.getElementById('repost-btn').onclick = async () => {
      const res = await fetch(`/api/threads/${id}/repost`, { method: 'POST' });
      if (res.ok) {
        showToast('¡Reposteado!');
        renderThread();
      } else if (res.status === 401) {
        showToast('Debes iniciar sesión', 'error');
      } else {
        showToast('Ya lo has compartido', 'error');
      }
    };
  } catch {
    showToast('Error al cargar publicación', 'error');
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
