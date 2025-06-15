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

// Loading spinner
function showSpinner() {
  let spinner = document.getElementById('global-spinner');
  if (!spinner) {
    spinner = document.createElement('div');
    spinner.id = 'global-spinner';
    spinner.innerHTML = '<div class="spinner"></div>';
    spinner.style.position = 'fixed';
    spinner.style.top = 0;
    spinner.style.left = 0;
    spinner.style.width = '100vw';
    spinner.style.height = '100vh';
    spinner.style.background = 'rgba(255,255,255,0.6)';
    spinner.style.display = 'flex';
    spinner.style.alignItems = 'center';
    spinner.style.justifyContent = 'center';
    spinner.style.zIndex = 2000;
    document.body.appendChild(spinner);
  }
  spinner.style.display = 'flex';
}
function hideSpinner() {
  const spinner = document.getElementById('global-spinner');
  if (spinner) spinner.style.display = 'none';
}
// Wrap fetchCheatsheets with spinner
const _fetchCheatsheets = fetchCheatsheets;
fetchCheatsheets = async function(...args) {
  showSpinner();
  try {
    await _fetchCheatsheets.apply(this, args);
  } finally {
    hideSpinner();
  }
};

// Back to top button
function setupBackToTop() {
  const btn = document.createElement('button');
  btn.textContent = '↑ Arriba';
  btn.id = 'back-to-top';
  btn.style.position = 'fixed';
  btn.style.right = '1.2rem';
  btn.style.bottom = '4.5rem';
  btn.style.zIndex = 999;
  btn.style.display = 'none';
  btn.style.background = '#1da1f2';
  btn.style.color = '#fff';
  btn.style.border = 'none';
  btn.style.borderRadius = '50px';
  btn.style.padding = '0.7rem 1.2rem';
  btn.style.fontWeight = 'bold';
  btn.style.cursor = 'pointer';
  btn.onclick = () => window.scrollTo({top: 0, behavior: 'smooth'});
  document.body.appendChild(btn);
  window.addEventListener('scroll', () => {
    btn.style.display = window.scrollY > 300 ? 'block' : 'none';
  });
}
document.addEventListener('DOMContentLoaded', setupBackToTop);

// Lazy load images in feed
function lazyLoadImages() {
  const imgs = document.querySelectorAll('img[loading="lazy"]');
  imgs.forEach(img => {
    if (img.complete) {
      img.setAttribute('data-loaded', 'true');
    } else {
      img.addEventListener('load', () => img.setAttribute('data-loaded', 'true'));
    }
  });
}
// Call after feed updates
const _fetchCheatsheets2 = fetchCheatsheets;
fetchCheatsheets = async function(...args) {
  await _fetchCheatsheets2.apply(this, args);
  lazyLoadImages();
};

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('js/sw.js');
  });
}

// Notification toast system
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
// Example: showToast('¡Bienvenido!');
