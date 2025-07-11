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

// Enhanced time features for Home page
// Load TimeUtils
const timeUtilsScript = document.createElement('script');
timeUtilsScript.src = '/utils/timeUtils.js';
document.head.appendChild(timeUtilsScript);

// Time-based filtering and display
let currentTimeFilter = 'all';
let lastUpdateTime = new Date();

// Add time filter controls
function createTimeFilterControls() {
  const filterContainer = document.createElement('div');
  filterContainer.className = 'time-filter-container';
  filterContainer.innerHTML = `
    <div class="filter-header">
      <h3>🕐 Filtros por Tiempo</h3>
      <div class="last-update">
        Última actualización: <span id="last-update-time">${new Date().toLocaleTimeString()}</span>
      </div>
    </div>
    <div class="filter-buttons">
      <button class="filter-btn active" onclick="setTimeFilter('all')">Todos</button>
      <button class="filter-btn" onclick="setTimeFilter('today')">Hoy</button>
      <button class="filter-btn" onclick="setTimeFilter('week')">Esta semana</button>
      <button class="filter-btn" onclick="setTimeFilter('month')">Este mes</button>
    </div>
    <div class="sort-options">
      <label for="sort-select">Ordenar por:</label>
      <select id="sort-select" onchange="changeSortOrder(this.value)">
        <option value="recent">Más reciente</option>
        <option value="popular">Más popular</option>
        <option value="commented">Más comentado</option>
        <option value="activity">Última actividad</option>
      </select>
    </div>
  `;
  
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.insertBefore(filterContainer, mainContent.firstChild);
  }
}

function setTimeFilter(filter) {
  currentTimeFilter = filter;
  
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // Refresh content
  fetchCheatsheets();
  showToast(`Filtro aplicado: ${getFilterDisplayName(filter)}`);
}

function getFilterDisplayName(filter) {
  const names = {
    'all': 'Todos los posts',
    'today': 'Posts de hoy',
    'week': 'Posts de esta semana',
    'month': 'Posts de este mes'
  };
  return names[filter] || filter;
}

function changeSortOrder(sortBy) {
  fetchCheatsheets(sortBy);
  showToast(`Ordenado por: ${getSortDisplayName(sortBy)}`);
}

function getSortDisplayName(sortBy) {
  const names = {
    'recent': 'Más reciente',
    'popular': 'Más popular',
    'commented': 'Más comentado',
    'activity': 'Última actividad'
  };
  return names[sortBy] || sortBy;
}

// Enhanced fetchCheatsheets with time filters
const originalFetchCheatsheets = fetchCheatsheets;
fetchCheatsheets = async function(sortBy = 'recent') {
  showSpinner();
  try {
    const params = new URLSearchParams();
    if (currentTimeFilter !== 'all') {
      params.append('timeFilter', currentTimeFilter);
    }
    params.append('sortBy', sortBy);
    
    const response = await fetch(`/api/cheatsheets?${params}`);
    const cheatsheets = await response.json();
    
    displayCheatsheets(cheatsheets);
    updateLastUpdateTime();
  } catch (error) {
    console.error('Error fetching cheatsheets:', error);
    showToast('Error al cargar publicaciones', 'error');
  } finally {
    hideSpinner();
  }
};

function displayCheatsheets(cheatsheets) {
  const container = document.querySelector('.posts') || document.createElement('div');
  container.className = 'posts';
  
  if (cheatsheets.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No hay publicaciones para mostrar</h3>
        <p>Prueba cambiando los filtros o crea una nueva publicación</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = cheatsheets.map(cs => `
    <div class="post-item" data-id="${cs.id}">
      <div class="post-header">
        <div class="post-user">
          <img src="/placeholder.svg?height=40&width=40" alt="Avatar" class="user-avatar">
          <div class="user-info">
            <strong>${cs.user || 'Anónimo'}</strong>
            <div class="post-time">
              <span class="time-ago" title="${new Date(cs.createdAt).toLocaleString()}">
                ${formatTimeAgo(cs.createdAt)}
              </span>
              ${cs.updatedAt !== cs.createdAt ? 
                `<span class="edited-indicator" title="Editado ${new Date(cs.updatedAt).toLocaleString()}">
                  (editado)
                </span>` : ''
              }
            </div>
          </div>
        </div>
        <div class="post-actions-menu">
          <button class="menu-btn" onclick="togglePostMenu('${cs.id}')">⋯</button>
        </div>
      </div>
      
      <div class="post-content">
        <h3>${cs.title}</h3>
        <p class="post-theme">Tema: ${cs.theme}</p>
        <p class="post-description">${cs.description}</p>
        ${cs.fileUrl ? `<img src="${cs.fileUrl}" alt="Cheatsheet" class="post-image" loading="lazy">` : ''}
        
        <div class="post-meta">
          <span class="reading-time">📖 ${estimateReadingTime(cs.description)} min de lectura</span>
          ${cs.lastActivityAt ? 
            `<span class="last-activity">🔄 Última actividad: ${formatTimeAgo(cs.lastActivityAt)}</span>` : ''
          }
        </div>
      </div>
      
      <div class="post-footer">
        <div class="post-stats">
          <button class="like-btn" onclick="likePost('${cs.id}')">
            ❤️ <span>${cs.likes || 0}</span>
          </button>
          <button class="comment-btn" onclick="viewPost('${cs.id}')">
            💬 <span>${cs.comments?.length || 0}</span>
          </button>
          <button class="share-btn" onclick="sharePost('${cs.id}')">
            🔗 Compartir
          </button>
        </div>
        <div class="post-timestamp">
          <small>${new Date(cs.createdAt).toLocaleDateString()}</small>
        </div>
      </div>
    </div>
  `).join('');
  
  // Update time displays every minute
  startTimeUpdateInterval();
}

function formatTimeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  if (diffInSeconds < 60) return 'hace un momento';
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)}d`;
  
  return past.toLocaleDateString();
}

function estimateReadingTime(text) {
  const words = text.split(/\s+/).length;
  return Math.ceil(words / 200);
}

function updateLastUpdateTime() {
  lastUpdateTime = new Date();
  const timeEl = document.getElementById('last-update-time');
  if (timeEl) {
    timeEl.textContent = lastUpdateTime.toLocaleTimeString();
  }
}

function startTimeUpdateInterval() {
  // Update relative times every minute
  setInterval(() => {
    document.querySelectorAll('.time-ago').forEach(el => {
      const fullDate = el.getAttribute('title');
      if (fullDate) {
        const originalDate = new Date(fullDate.split(' - ')[0]);
        el.textContent = formatTimeAgo(originalDate.toISOString());
      }
    });
    
    updateLastUpdateTime();
  }, 60000);
}

// Real-time activity indicator
function createActivityIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'activity-indicator';
  indicator.innerHTML = `
    <div class="indicator-content">
      <div class="online-status">
        <span class="status-dot"></span>
        <span id="online-count">0</span> usuarios activos
      </div>
      <div class="activity-stats">
        <span>📊 <span id="posts-today">0</span> posts hoy</span>
        <span>🔥 <span id="trending-topic">#JavaScript</span> tendencia</span>
      </div>
    </div>
  `;
  
  document.body.appendChild(indicator);
  
  // Update activity stats
  updateActivityStats();
  setInterval(updateActivityStats, 300000); // Every 5 minutes
}

async function updateActivityStats() {
  try {
    const response = await fetch('/api/analytics/global');
    if (response.ok) {
      const stats = await response.json();
      
      document.getElementById('posts-today').textContent = stats.postsToday || 0;
      
      if (stats.trendingTopics && stats.trendingTopics.length > 0) {
        document.getElementById('trending-topic').textContent = stats.trendingTopics[0].tag;
      }
    }
  } catch (error) {
    console.error('Error updating activity stats:', error);
  }
}

// Enhanced notification system with timestamps
function enhanceNotifications() {
  const originalShowToast = showToast;
  
  window.showToast = function(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const enhancedMessage = `${message} (${timestamp})`;
    originalShowToast(enhancedMessage, type);
  };
}

// Time-based auto-refresh
function setupAutoRefresh() {
  let refreshInterval;
  
  function startAutoRefresh() {
    refreshInterval = setInterval(() => {
      fetchCheatsheets();
    }, 300000); // Refresh every 5 minutes
  }
  
  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  }
  
  // Start auto-refresh when page is visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoRefresh();
    } else {
      startAutoRefresh();
      fetchCheatsheets(); // Immediate refresh when page becomes visible
    }
  });
  
  startAutoRefresh();
}

// Add time zone display
function displayTimeZone() {
  const timeZoneInfo = document.createElement('div');
  timeZoneInfo.className = 'timezone-info';
  timeZoneInfo.innerHTML = `
    <small>🌍 Zona horaria: ${Intl.DateTimeFormat().resolvedOptions().timeZone}</small>
  `;
  
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.appendChild(timeZoneInfo);
  }
}

// Initialize all time features
function initializeTimeFeatures() {
  createTimeFilterControls();
  createActivityIndicator();
  enhanceNotifications();
  setupAutoRefresh();
  displayTimeZone();
  
  // Load initial data
  fetchCheatsheets();
}

// Initialize time features on page load
document.addEventListener('DOMContentLoaded', () => {
  // Initialize existing features
  setupDarkMode();
  setupBackToTop();
  
  // Initialize form functionality
  setupQuickPostForm();
  setupCheatsheetForm();
  setupCheatsheetSearch();
  
  // Initialize new time features
  initializeTimeFeatures();
  
  // Initialize advanced time features
  initializeAdvancedTimeFeatures();
  
  // Start real-time updates
  startTimeUpdateInterval();
  
  // Load initial data
  loadCheatsheets();
  loadPosts();
});

// Load Advanced Time Manager
const advancedTimeManagerScript = document.createElement('script');
advancedTimeManagerScript.src = '/utils/advancedTimeManager.js';
advancedTimeManagerScript.onload = function() {
    console.log('AdvancedTimeManager loaded successfully');
};
advancedTimeManagerScript.onerror = function() {
    console.error('Failed to load AdvancedTimeManager');
};
document.head.appendChild(advancedTimeManagerScript);

// Load TimeUtils
const timeUtilsScript = document.createElement('script');
timeUtilsScript.src = '/utils/timeUtils.js';
timeUtilsScript.onload = function() {
    console.log('TimeUtils loaded successfully');
};
timeUtilsScript.onerror = function() {
    console.error('Failed to load TimeUtils');
};
document.head.appendChild(timeUtilsScript);

// Initialize Advanced Time Manager
let advancedTimeManager = null;
let pomodoroTimer = null;
let currentTimeInterval = null;
let worldClocksInterval = null;
let productivityInterval = null;

// Initialize advanced time features
function initializeAdvancedTimeFeatures() {
    // Initialize clock
    updateClock();
    
    // Initialize world clocks
    initializeWorldClocks();
    
    // Initialize Pomodoro
    initializePomodoro();
    
    // Initialize reminders
    loadReminders();
    
    // Initialize productivity tracker
    initializeProductivityTracker();
    
    // Initialize analytics
    initializeTimeAnalytics();
    
    // Request notification permission
    requestNotificationPermission();
    
    console.log('Advanced time features initialized');
}

// Update clock function
function updateClock() {
    const currentTimeEl = document.getElementById('current-time');
    const currentDateEl = document.getElementById('current-date');
    const timezoneInfoEl = document.getElementById('timezone-info');
    
    if (currentTimeEl && currentDateEl && timezoneInfoEl) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const dateString = now.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        currentTimeEl.textContent = timeString;
        currentDateEl.textContent = dateString;
        timezoneInfoEl.textContent = `Zona horaria: ${timezone}`;
    }
}

// Initialize world clocks
function initializeWorldClocks() {
    const worldClocksGrid = document.getElementById('world-clocks-grid');
    if (!worldClocksGrid) return;
    
    const timezones = [
        { name: 'Nueva York', timezone: 'America/New_York' },
        { name: 'Londres', timezone: 'Europe/London' },
        { name: 'Tokio', timezone: 'Asia/Tokyo' },
        { name: 'Sídney', timezone: 'Australia/Sydney' }
    ];
    
    worldClocksGrid.innerHTML = timezones.map(tz => `
        <div class="world-clock">
            <div class="clock-city">${tz.name}</div>
            <div class="clock-time" data-timezone="${tz.timezone}">--:--</div>
        </div>
    `).join('');
    
    updateWorldClocks();
}

// Update world clocks
function updateWorldClocks() {
    const worldClocks = document.querySelectorAll('.clock-time[data-timezone]');
    worldClocks.forEach(clock => {
        const timezone = clock.dataset.timezone;
        const time = new Date().toLocaleTimeString('es-ES', {
            timeZone: timezone,
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
        clock.textContent = time;
    });
}

// Initialize Pomodoro timer
function initializePomodoro() {
    window.pomodoroState = {
        isActive: false,
        currentSession: 'work',
        timeLeft: 25 * 60, // 25 minutes in seconds
        interval: null
    };
    
    updatePomodoroDisplay();
}

// Update Pomodoro display
function updatePomodoroDisplay() {
    const timerDisplay = document.getElementById('pomodoro-timer');
    const statusEl = document.getElementById('pomodoro-status');
    
    if (timerDisplay && statusEl) {
        const minutes = Math.floor(window.pomodoroState.timeLeft / 60);
        const seconds = window.pomodoroState.timeLeft % 60;
        
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        statusEl.textContent = window.pomodoroState.isActive ? 
            `${window.pomodoroState.currentSession === 'work' ? 'Trabajando' : 'Descanso'} - En progreso` : 
            'Detenido';
    }
}

// Start Pomodoro timer
function startPomodoro() {
    if (window.pomodoroState.isActive) return;
    
    window.pomodoroState.isActive = true;
    
    window.pomodoroState.interval = setInterval(() => {
        window.pomodoroState.timeLeft--;
        updatePomodoroDisplay();
        
        if (window.pomodoroState.timeLeft <= 0) {
            // Session completed
            if (window.pomodoroState.currentSession === 'work') {
                window.pomodoroState.currentSession = 'break';
                window.pomodoroState.timeLeft = 5 * 60; // 5 minute break
                showNotification('¡Hora del descanso!', 'Has completado una sesión de trabajo');
            } else {
                window.pomodoroState.currentSession = 'work';
                window.pomodoroState.timeLeft = 25 * 60; // 25 minute work session
                showNotification('¡Hora de trabajar!', 'El descanso ha terminado');
            }
            updatePomodoroDisplay();
        }
    }, 1000);
    
    updatePomodoroDisplay();
    showToast('Pomodoro iniciado');
}

// Stop Pomodoro timer
function stopPomodoro() {
    window.pomodoroState.isActive = false;
    if (window.pomodoroState.interval) {
        clearInterval(window.pomodoroState.interval);
        window.pomodoroState.interval = null;
    }
    updatePomodoroDisplay();
    showToast('Pomodoro detenido');
}

// Reset Pomodoro timer
function resetPomodoro() {
    stopPomodoro();
    window.pomodoroState.currentSession = 'work';
    window.pomodoroState.timeLeft = 25 * 60;
    updatePomodoroDisplay();
    showToast('Pomodoro reiniciado');
}

// Show notification
function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
    } else {
        showToast(`${title}: ${body}`);
    }
}

// Load reminders
async function loadReminders() {
    try {
        const response = await fetch('/api/time-management/reminders');
        if (response.ok) {
            const reminders = await response.json();
            displayReminders(reminders);
        }
    } catch (error) {
        console.error('Error loading reminders:', error);
    }
}

// Display reminders
function displayReminders(reminders) {
    const remindersList = document.getElementById('reminders-list');
    if (!remindersList) return;
    
    if (reminders.length === 0) {
        remindersList.innerHTML = '<p>No tienes recordatorios activos</p>';
        return;
    }
    
    remindersList.innerHTML = reminders.map(reminder => `
        <div class="reminder-item" data-id="${reminder.id}">
            <div class="reminder-content">
                <h4>${reminder.title}</h4>
                <span class="reminder-time">${new Date(reminder.time).toLocaleString()}</span>
            </div>
            <button class="delete-reminder" onclick="deleteReminder('${reminder.id}')">✖</button>
        </div>
    `).join('');
}

// Create reminder
async function createReminder() {
    const titleInput = document.getElementById('reminder-title');
    const timeInput = document.getElementById('reminder-time');
    const typeSelect = document.getElementById('reminder-type');
    
    if (!titleInput || !timeInput || !typeSelect) return;
    
    const title = titleInput.value.trim();
    const time = timeInput.value;
    const type = typeSelect.value;
    
    if (!title || !time) {
        showToast('Por favor completa todos los campos', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/time-management/reminders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, time, type })
        });
        
        if (response.ok) {
            showToast('Recordatorio creado');
            titleInput.value = '';
            timeInput.value = '';
            loadReminders();
        } else {
            showToast('Error al crear recordatorio', 'error');
        }
    } catch (error) {
        console.error('Error creating reminder:', error);
        showToast('Error al crear recordatorio', 'error');
    }
}

// Delete reminder
async function deleteReminder(id) {
    try {
        const response = await fetch(`/api/time-management/reminders/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Recordatorio eliminado');
            loadReminders();
        } else {
            showToast('Error al eliminar recordatorio', 'error');
        }
    } catch (error) {
        console.error('Error deleting reminder:', error);
        showToast('Error al eliminar recordatorio', 'error');
    }
}

// Initialize productivity tracker
function initializeProductivityTracker() {
    window.productivityState = {
        isTracking: false,
        startTime: null,
        totalTime: 0,
        currentActivity: 'none'
    };
    
    updateProductivityDisplay();
}

// Start time tracking
function startTimeTracking() {
    if (window.productivityState.isTracking) return;
    
    const activitySelect = document.getElementById('activity-type');
    if (!activitySelect) return;
    
    window.productivityState.isTracking = true;
    window.productivityState.startTime = Date.now();
    window.productivityState.currentActivity = activitySelect.value;
    
    updateProductivityDisplay();
    showToast('Seguimiento iniciado');
}

// Stop time tracking
function stopTimeTracking() {
    if (!window.productivityState.isTracking) return;
    
    const sessionTime = Date.now() - window.productivityState.startTime;
    window.productivityState.totalTime += sessionTime;
    window.productivityState.isTracking = false;
    window.productivityState.startTime = null;
    window.productivityState.currentActivity = 'none';
    
    updateProductivityDisplay();
    showToast('Seguimiento detenido');
}

// Update productivity display
function updateProductivityDisplay() {
    const totalTimeEl = document.getElementById('total-time');
    const currentSessionEl = document.getElementById('current-session');
    const currentActivityEl = document.getElementById('current-activity');
    
    if (totalTimeEl) {
        const hours = Math.floor(window.productivityState.totalTime / (1000 * 60 * 60));
        const minutes = Math.floor((window.productivityState.totalTime % (1000 * 60 * 60)) / (1000 * 60));
        totalTimeEl.textContent = `${hours}h ${minutes}m`;
    }
    
    if (currentSessionEl) {
        if (window.productivityState.isTracking) {
            const sessionTime = Date.now() - window.productivityState.startTime;
            const hours = Math.floor(sessionTime / (1000 * 60 * 60));
            const minutes = Math.floor((sessionTime % (1000 * 60 * 60)) / (1000 * 60));
            currentSessionEl.textContent = `${hours}h ${minutes}m`;
        } else {
            currentSessionEl.textContent = '0h 0m';
        }
    }
    
    if (currentActivityEl) {
        const activityNames = {
            'coding': 'Programación',
            'writing': 'Escritura',
            'learning': 'Aprendizaje',
            'planning': 'Planificación',
            'meeting': 'Reunión',
            'none': 'Ninguna'
        };
        currentActivityEl.textContent = activityNames[window.productivityState.currentActivity] || 'Ninguna';
    }
}

// Initialize time analytics
function initializeTimeAnalytics() {
    // Simple analytics initialization
    console.log('Time analytics initialized');
}

// Start time update interval
function startTimeUpdateInterval() {
    // Update clock every second
    setInterval(() => {
        updateClock();
        updateWorldClocks();
        updateProductivityDisplay();
    }, 1000);
}

// Widget toggle functions
function toggleTimeDashboard() {
    const content = document.getElementById('time-dashboard-content');
    const icon = document.getElementById('dashboard-toggle-icon');
    
    if (content && icon) {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'grid' : 'none';
        icon.textContent = isHidden ? '▼' : '▶';
    }
}

function toggleWidget(widgetName) {
    const content = document.getElementById(`${widgetName}-content`);
    const button = event.target;
    
    if (content && button) {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'block' : 'none';
        button.textContent = isHidden ? '−' : '+';
    }
}

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showToast('Notificaciones habilitadas');
            }
        });
    }
}

// Add focus mode styles
const focusModeStyles = `
    .focus-mode {
        filter: contrast(1.2) brightness(0.95);
    }
    
    .focus-mode .time-management-dashboard {
        box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
        border: 2px solid #667eea;
    }
    
    .focus-mode .sidebar,
    .focus-mode .right-panel {
        opacity: 0.3;
        transition: opacity 0.3s ease;
    }
    
    .focus-mode .sidebar:hover,
    .focus-mode .right-panel:hover {
        opacity: 1;
    }
`;

const focusStyleSheet = document.createElement('style');
focusStyleSheet.textContent = focusModeStyles;
document.head.appendChild(focusStyleSheet);

// Funcionalidad del formulario de publicación rápida
function setupQuickPostForm() {
    const textarea = document.getElementById('post-textarea');
    const charCount = document.getElementById('char-count');
    const submitBtn = document.querySelector('.post-submit');
    
    if (textarea && charCount && submitBtn) {
        textarea.addEventListener('input', function() {
            const remaining = 280 - this.value.length;
            charCount.textContent = remaining;
            
            // Cambiar color según caracteres restantes
            if (remaining < 20) {
                charCount.style.color = '#e0245e';
            } else if (remaining < 50) {
                charCount.style.color = '#ff6600';
            } else {
                charCount.style.color = '#657786';
            }
            
            // Habilitar/deshabilitar botón
            submitBtn.disabled = this.value.trim().length === 0 || remaining < 0;
        });
    }
}

// Manejar envío del formulario rápido
async function handleQuickPost(event) {
    event.preventDefault();
    
    const textarea = document.getElementById('post-textarea');
    const content = textarea.value.trim();
    
    if (!content) {
        showToast('Por favor escribe algo antes de publicar', 'error');
        return;
    }
    
    if (content.length > 280) {
        showToast('El contenido no puede exceder 280 caracteres', 'error');
        return;
    }
    
    try {
        showToast('Publicando...');
        
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: content,
                type: 'quick_post'
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Agregar el post al feed actual
            publishQuickPost(result.post);
            
            // Limpiar formulario
            textarea.value = '';
            document.getElementById('char-count').textContent = '280';
            document.querySelector('.post-submit').disabled = true;
            
            showToast('¡Publicación creada exitosamente!');
        } else {
            const error = await response.json();
            showToast(error.error || 'Error al publicar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    }
}

// Publicar post rápido
function publishQuickPost(post) {
    // Agregar el post al feed actual
    const postsSection = document.querySelector('.posts');
    if (postsSection) {
        const newPostHTML = `
            <article class="post" role="article" tabindex="0">
                <header class="post-header">
                    <img src="/placeholder.svg?height=48&width=48" alt="Tu avatar" class="user-avatar">
                    <div class="user-info">
                        <h3 class="username">Tú</h3>
                        <span class="handle">@tu_usuario</span>
                        <span class="timestamp" aria-label="Publicado ahora">ahora</span>
                    </div>
                </header>
                
                <div class="post-content">
                    <p>${post.content}</p>
                </div>
                
                <footer class="post-actions-bar" role="toolbar" aria-label="Acciones de publicación">
                    <button class="action-btn" aria-label="Comentar" tabindex="0">
                        <span aria-hidden="true">💬</span>
                        <span>0</span>
                    </button>
                    <button class="action-btn" aria-label="Retwittear" tabindex="0">
                        <span aria-hidden="true">🔄</span>
                        <span>0</span>
                    </button>
                    <button class="action-btn" aria-label="Me gusta" tabindex="0">
                        <span aria-hidden="true">❤️</span>
                        <span>0</span>
                    </button>
                    <button class="action-btn" aria-label="Compartir" tabindex="0">
                        <span aria-hidden="true">📤</span>
                    </button>
                </footer>
            </article>
        `;
        
        postsSection.insertAdjacentHTML('afterbegin', newPostHTML);
    }
}

// Cargar posts existentes
async function loadPosts() {
    try {
        const response = await fetch('/api/posts');
        if (response.ok) {
            const posts = await response.json();
            displayPosts(posts);
        }
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// Mostrar posts en el feed
function displayPosts(posts) {
    const postsSection = document.querySelector('.posts');
    if (!postsSection) return;
    
    if (posts.length === 0) {
        postsSection.innerHTML = '<p style="text-align: center; color: #657786; margin: 2rem 0;">No hay publicaciones aún. ¡Sé el primero en publicar!</p>';
        return;
    }
    
    postsSection.innerHTML = posts.map(post => `
        <article class="post" role="article" tabindex="0">
            <header class="post-header">
                <img src="/placeholder.svg?height=48&width=48" alt="Avatar de ${post.user}" class="user-avatar">
                <div class="user-info">
                    <h3 class="username">${post.user}</h3>
                    <span class="handle">@${post.user.toLowerCase().replace(' ', '_')}</span>
                    <span class="timestamp" aria-label="Publicado ${formatTimeAgo(post.createdAt)}">${formatTimeAgo(post.createdAt)}</span>
                </div>
            </header>
            
            <div class="post-content">
                <p>${post.content}</p>
            </div>
            
            <footer class="post-actions-bar" role="toolbar" aria-label="Acciones de publicación">
                <button class="action-btn" aria-label="Comentar" tabindex="0">
                    <span aria-hidden="true">💬</span>
                    <span>${post.comments.length}</span>
                </button>
                <button class="action-btn" aria-label="Retwittear" tabindex="0">
                    <span aria-hidden="true">🔄</span>
                    <span>${post.retweets}</span>
                </button>
                <button class="action-btn" aria-label="Me gusta" tabindex="0">
                    <span aria-hidden="true">❤️</span>
                    <span>${post.likes}</span>
                </button>
                <button class="action-btn" aria-label="Compartir" tabindex="0">
                    <span aria-hidden="true">📤</span>
                </button>
            </footer>
        </article>
    `).join('');
}

// Formatear tiempo relativo
function formatTimeAgo(dateString) {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMinutes = Math.floor((now - postDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return postDate.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}

// Cargar cheatsheets
async function loadCheatsheets() {
    try {
        const response = await fetch('/api/cheatsheets');
        if (response.ok) {
            const cheatsheets = await response.json();
            displayCheatsheets(cheatsheets);
        }
    } catch (error) {
        console.error('Error loading cheatsheets:', error);
    }
}

// Mostrar cheatsheets
function displayCheatsheets(cheatsheets) {
    const container = document.getElementById('cheatsheets-list');
    
    if (!container) return;
    
    if (cheatsheets.length === 0) {
        container.innerHTML = '<p>No se encontraron cheatsheets.</p>';
        return;
    }
    
    container.innerHTML = cheatsheets.map(cs => `
        <div class="cheatsheet-item" data-id="${cs.id}">
            <h3>${cs.title}</h3>
            <p><strong>Tema:</strong> ${cs.theme}</p>
            <p>${cs.description}</p>
            ${cs.fileUrl ? `<img src="${cs.fileUrl}" alt="Cheatsheet" style="max-width: 200px; height: auto;">` : ''}
            <div class="cheatsheet-meta">
                <span>Por: ${cs.user || 'Anónimo'}</span>
                <span>Subido: ${new Date(cs.createdAt).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
}

// Mejorar la funcionalidad del formulario de cheatsheet
function setupCheatsheetForm() {
    const cheatsheetForm = document.getElementById('cheatsheet-upload-form');
    
    if (cheatsheetForm) {
        cheatsheetForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const formData = new FormData(this);
            
            try {
                showToast('Subiendo cheatsheet...');
                
                const response = await fetch('/api/cheatsheets', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    showToast('¡Cheatsheet subido exitosamente!');
                    this.reset();
                    // Recargar la lista de cheatsheets
                    loadCheatsheets();
                } else {
                    const error = await response.text();
                    showToast(`Error al subir cheatsheet: ${error}`, 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('Error de conexión', 'error');
            }
        });
    }
}

// Mejorar la búsqueda de cheatsheets
function setupCheatsheetSearch() {
    const searchInput = document.getElementById('cheatsheet-search');
    
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', function(event) {
            clearTimeout(searchTimeout);
            const query = event.target.value.trim();
            
            searchTimeout = setTimeout(() => {
                if (query.length > 0) {
                    searchCheatsheets(query);
                } else {
                    loadCheatsheets();
                }
            }, 300);
        });
    }
}

// Buscar cheatsheets
async function searchCheatsheets(query) {
    try {
        const response = await fetch(`/api/cheatsheets/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
            const results = await response.json();
            displayCheatsheets(results);
        }
    } catch (error) {
        console.error('Error searching cheatsheets:', error);
    }
}

// Cargar posts existentes
async function loadPosts() {
    try {
        const response = await fetch('/api/posts');
        if (response.ok) {
            const posts = await response.json();
            displayPosts(posts);
        }
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// Mostrar posts en el feed
function displayPosts(posts) {
    const postsSection = document.querySelector('.posts');
    if (!postsSection) return;
    
    if (posts.length === 0) {
        postsSection.innerHTML = '<p style="text-align: center; color: #657786; margin: 2rem 0;">No hay publicaciones aún. ¡Sé el primero en publicar!</p>';
        return;
    }
    
    postsSection.innerHTML = posts.map(post => `
        <article class="post" role="article" tabindex="0">
            <header class="post-header">
                <img src="/placeholder.svg?height=48&width=48" alt="Avatar de ${post.user}" class="user-avatar">
                <div class="user-info">
                    <h3 class="username">${post.user}</h3>
                    <span class="handle">@${post.user.toLowerCase().replace(' ', '_')}</span>
                    <span class="timestamp" aria-label="Publicado ${formatTimeAgo(post.createdAt)}">${formatTimeAgo(post.createdAt)}</span>
                </div>
            </header>
            
            <div class="post-content">
                <p>${post.content}</p>
            </div>
            
            <footer class="post-actions-bar" role="toolbar" aria-label="Acciones de publicación">
                <button class="action-btn" aria-label="Comentar" tabindex="0">
                    <span aria-hidden="true">💬</span>
                    <span>${post.comments.length}</span>
                </button>
                <button class="action-btn" aria-label="Retwittear" tabindex="0">
                    <span aria-hidden="true">🔄</span>
                    <span>${post.retweets}</span>
                </button>
                <button class="action-btn" aria-label="Me gusta" tabindex="0">
                    <span aria-hidden="true">❤️</span>
                    <span>${post.likes}</span>
                </button>
                <button class="action-btn" aria-label="Compartir" tabindex="0">
                    <span aria-hidden="true">📤</span>
                </button>
            </footer>
        </article>
    `).join('');
}

// Formatear tiempo relativo
function formatTimeAgo(dateString) {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMinutes = Math.floor((now - postDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return postDate.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}
