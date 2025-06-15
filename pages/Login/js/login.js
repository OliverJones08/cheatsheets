// Dark mode toggle
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
