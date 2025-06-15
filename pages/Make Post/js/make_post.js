// Dark mode toggle (shared)
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
  // Restore mode
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    btn.textContent = '☀️ Modo claro';
  }
}
document.addEventListener('DOMContentLoaded', setupDarkMode);
// Notification toast system (shared)
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
// Form handler
const form = document.getElementById('make-post-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = form.content.value.trim();
    if (!content) return showToast('El contenido no puede estar vacío', 'error');
    try {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        showToast('¡Publicación creada!');
        setTimeout(() => window.location.href = '../../Home/views/home.html', 1200);
      } else if (res.status === 401) {
        showToast('Debes iniciar sesión', 'error');
      } else {
        showToast('Error al publicar', 'error');
      }
    } catch {
      showToast('Error de red', 'error');
    }
  });
}
