// Enhanced Make Post with Advanced Time Features
// Load TimeUtils
const timeUtilsScript = document.createElement('script');
timeUtilsScript.src = '/utils/timeUtils.js';
document.head.appendChild(timeUtilsScript);

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

// Global variables for time features
let scheduledDateTime = null;
let currentDraftId = null;
let autoSaveInterval = null;
let lastSaveTime = null;

// Enhanced form initialization
document.addEventListener('DOMContentLoaded', function() {
  createTimeUI();
  createSchedulingUI();
  createDraftUI();
  setupAutoSave();
  setupFormHandler();
  loadBestPostingTimes();
  startRealTimeClock();
  loadAutoSavedDraft();
});

// Create real-time clock and time info
function createTimeUI() {
  const timeContainer = document.createElement('div');
  timeContainer.className = 'time-container';
  timeContainer.innerHTML = `
    <div class="time-header">
      <h3>🕐 Información de Tiempo</h3>
    </div>
    <div class="time-info">
      <div class="current-time">
        <strong>Hora actual:</strong> <span id="current-time"></span>
      </div>
      <div class="timezone-info">
        <strong>Zona horaria:</strong> <span id="timezone"></span>
      </div>
      <div class="post-stats">
        <strong>Mejor hora para publicar:</strong> <span id="best-time">Cargando...</span>
      </div>
      <div class="activity-indicator">
        <strong>Actividad actual:</strong> <span id="activity-level"></span>
      </div>
    </div>
  `;
  
  document.body.appendChild(timeContainer);
}

// Create scheduling interface
function createSchedulingUI() {
  const form = document.getElementById('make-post-form');
  if (!form) return;
  
  const schedulingContainer = document.createElement('div');
  schedulingContainer.className = 'scheduling-container';
  schedulingContainer.innerHTML = `
    <div class="scheduling-header">
      <h3>📅 Programación de Publicación</h3>
      <label class="schedule-toggle">
        <input type="checkbox" id="schedule-checkbox"> 
        <span>Programar para más tarde</span>
      </label>
    </div>
    
    <div class="schedule-options" id="schedule-options" style="display: none;">
      <div class="datetime-input">
        <label for="schedule-datetime">Fecha y hora:</label>
        <input type="datetime-local" id="schedule-datetime" 
               min="${new Date().toISOString().slice(0, 16)}">
      </div>
      
      <div class="quick-schedule">
        <label>Opciones rápidas:</label>
        <div class="quick-buttons">
          <button type="button" onclick="setQuickSchedule(1)">1 hora</button>
          <button type="button" onclick="setQuickSchedule(3)">3 horas</button>
          <button type="button" onclick="setQuickSchedule(6)">6 horas</button>
          <button type="button" onclick="setQuickSchedule(24)">Mañana</button>
        </div>
      </div>
      
      <div class="optimal-times">
        <label>Mejores horarios:</label>
        <div id="optimal-times-list">Cargando...</div>
      </div>
      
      <div class="schedule-preview" id="schedule-preview"></div>
    </div>
  `;
  
  form.insertBefore(schedulingContainer, form.firstChild);
  
  // Event listeners
  document.getElementById('schedule-checkbox').addEventListener('change', toggleScheduling);
  document.getElementById('schedule-datetime').addEventListener('change', updateSchedulePreview);
}

// Create draft management UI
function createDraftUI() {
  const draftContainer = document.createElement('div');
  draftContainer.className = 'draft-container';
  draftContainer.innerHTML = `
    <div class="draft-header">
      <h3>📝 Gestión de Borradores</h3>
      <button type="button" id="save-draft-btn">Guardar borrador</button>
    </div>
    <div class="draft-info">
      <div class="auto-save-status" id="auto-save-status">
        <span>💾 Guardado automático: <span id="last-save">Nunca</span></span>
      </div>
      <div class="draft-list" id="draft-list">
        <p>Cargando borradores...</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(draftContainer);
  
  document.getElementById('save-draft-btn').addEventListener('click', saveDraft);
  loadDrafts();
}

// Setup auto-save functionality
function setupAutoSave() {
  const textarea = document.querySelector('#make-post-form textarea');
  if (!textarea) return;
  
  let autoSaveTimeout;
  
  textarea.addEventListener('input', () => {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      autoSaveDraft();
    }, 3000); // Auto-save after 3 seconds of inactivity
  });
  
  // Auto-save every 30 seconds if there's content
  autoSaveInterval = setInterval(() => {
    if (textarea.value.trim()) {
      autoSaveDraft();
    }
  }, 30000);
}

// Enhanced form handler with time features
function setupFormHandler() {
  const form = document.getElementById('make-post-form');
  if (!form) return;
  
  // Add character count and reading time
  const textarea = form.querySelector('textarea');
  if (textarea) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'text-info';
    infoDiv.innerHTML = `
      <div class="char-count">
        <span id="char-count">0</span> caracteres
      </div>
      <div class="reading-time">
        <span id="reading-time">0 min de lectura</span>
      </div>
      <div class="word-count">
        <span id="word-count">0</span> palabras
      </div>
    `;
    textarea.parentNode.appendChild(infoDiv);
    
    textarea.addEventListener('input', updateTextStats);
    updateTextStats(); // Initial update
  }
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = textarea.value.trim();
    
    if (!content) {
      showToast('El contenido no puede estar vacío', 'error');
      return;
    }
    
    try {
      if (scheduledDateTime) {
        await schedulePost(content);
      } else {
        await publishPost(content);
      }
    } catch (error) {
      showToast('Error al procesar la publicación', 'error');
      console.error(error);
    }
  });
}

// Real-time clock and activity tracking
function startRealTimeClock() {
  updateClock();
  setInterval(updateClock, 1000);
  
  // Update activity level every 5 minutes
  updateActivityLevel();
  setInterval(updateActivityLevel, 300000);
}

function updateClock() {
  const now = new Date();
  const timeEl = document.getElementById('current-time');
  const timezoneEl = document.getElementById('timezone');
  
  if (timeEl) {
    timeEl.textContent = now.toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  
  if (timezoneEl) {
    timezoneEl.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
}

function updateActivityLevel() {
  const hour = new Date().getHours();
  let activity = 'Baja';
  let color = '#666';
  
  if (hour >= 9 && hour <= 12) {
    activity = 'Alta (mañana)';
    color = '#00ba7c';
  } else if (hour >= 14 && hour <= 17) {
    activity = 'Media (tarde)';
    color = '#ff6b35';
  } else if (hour >= 19 && hour <= 22) {
    activity = 'Alta (noche)';
    color = '#00ba7c';
  }
  
  const activityEl = document.getElementById('activity-level');
  if (activityEl) {
    activityEl.textContent = activity;
    activityEl.style.color = color;
  }
}

// Text statistics
function updateTextStats() {
  const textarea = document.querySelector('#make-post-form textarea');
  if (!textarea) return;
  
  const text = textarea.value;
  const charCount = text.length;
  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200) || 0;
  
  const charCountEl = document.getElementById('char-count');
  const wordCountEl = document.getElementById('word-count');
  const readingTimeEl = document.getElementById('reading-time');
  
  if (charCountEl) {
    charCountEl.textContent = charCount;
    charCountEl.style.color = charCount > 280 ? '#e0245e' : '#666';
  }
  
  if (wordCountEl) {
    wordCountEl.textContent = wordCount;
  }
  
  if (readingTimeEl) {
    readingTimeEl.textContent = readingTime === 1 ? '1 min de lectura' : `${readingTime} min de lectura`;
  }
}

// Scheduling functions
function toggleScheduling(e) {
  const scheduleOptions = document.getElementById('schedule-options');
  const submitBtn = document.querySelector('#make-post-form button[type="submit"]');
  
  if (e.target.checked) {
    scheduleOptions.style.display = 'block';
    submitBtn.textContent = '📅 Programar Publicación';
  } else {
    scheduleOptions.style.display = 'none';
    submitBtn.textContent = '📤 Publicar';
    scheduledDateTime = null;
    updateSchedulePreview();
  }
}

function setQuickSchedule(hours) {
  const now = new Date();
  const scheduledDate = new Date(now.getTime() + hours * 60 * 60 * 1000);
  
  document.getElementById('schedule-datetime').value = scheduledDate.toISOString().slice(0, 16);
  scheduledDateTime = scheduledDate.toISOString();
  updateSchedulePreview();
}

function updateSchedulePreview() {
  const preview = document.getElementById('schedule-preview');
  if (!preview) return;
  
  if (scheduledDateTime) {
    const now = new Date();
    const scheduled = new Date(scheduledDateTime);
    const diff = scheduled - now;
    
    let timeUntil = '';
    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) timeUntil = `${days}d ${hours}h ${minutes}m`;
      else if (hours > 0) timeUntil = `${hours}h ${minutes}m`;
      else timeUntil = `${minutes}m`;
    } else {
      timeUntil = 'Pasado';
    }
    
    preview.innerHTML = `
      <div class="schedule-preview-content">
        <strong>📅 Programado para:</strong> ${scheduled.toLocaleString('es-ES')}<br>
        <strong>⏱️ En:</strong> ${timeUntil}
      </div>
    `;
  } else {
    preview.innerHTML = '';
  }
}

// Load best posting times
async function loadBestPostingTimes() {
  try {
    const response = await fetch('/api/time/best-posting-times');
    if (response.ok) {
      const times = await response.json();
      displayOptimalTimes(times);
      displayBestTime(times);
    }
  } catch (error) {
    console.error('Error loading best posting times:', error);
  }
}

function displayOptimalTimes(times) {
  const container = document.getElementById('optimal-times-list');
  if (!container) return;
  
  if (times.length === 0) {
    container.innerHTML = '<small>No hay datos suficientes</small>';
    return;
  }
  
  container.innerHTML = times.map(time => `
    <button type="button" class="optimal-time-btn" onclick="setOptimalTime('${time.time}')">
      ${time.time} (${time.average} engagement)
    </button>
  `).join('');
}

function displayBestTime(times) {
  const bestTimeEl = document.getElementById('best-time');
  if (!bestTimeEl) return;
  
  if (times.length > 0) {
    bestTimeEl.textContent = `${times[0].time} (${times[0].average} engagement promedio)`;
  } else {
    bestTimeEl.textContent = 'No hay datos suficientes';
  }
}

function setOptimalTime(time) {
  const [hours, minutes] = time.split(':').map(Number);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hours, minutes, 0, 0);
  
  document.getElementById('schedule-datetime').value = tomorrow.toISOString().slice(0, 16);
  scheduledDateTime = tomorrow.toISOString();
  updateSchedulePreview();
}

// Auto-save and draft functions
function autoSaveDraft() {
  const textarea = document.querySelector('#make-post-form textarea');
  if (!textarea || !textarea.value.trim()) return;
  
  const draftData = {
    content: textarea.value,
    timestamp: new Date().toISOString(),
    autoSaved: true
  };
  
  localStorage.setItem('autoSavedDraft', JSON.stringify(draftData));
  lastSaveTime = new Date();
  updateAutoSaveStatus();
}

function updateAutoSaveStatus() {
  const statusEl = document.getElementById('last-save');
  if (statusEl && lastSaveTime) {
    const timeAgo = Math.floor((new Date() - lastSaveTime) / 1000);
    let display = '';
    
    if (timeAgo < 60) {
      display = `hace ${timeAgo}s`;
    } else if (timeAgo < 3600) {
      display = `hace ${Math.floor(timeAgo / 60)}m`;
    } else {
      display = `hace ${Math.floor(timeAgo / 3600)}h`;
    }
    
    statusEl.textContent = display;
  }
}

function loadAutoSavedDraft() {
  const autoSaved = localStorage.getItem('autoSavedDraft');
  if (autoSaved) {
    try {
      const draft = JSON.parse(autoSaved);
      const textarea = document.querySelector('#make-post-form textarea');
      
      if (textarea && confirm(`Hay un borrador guardado automáticamente. ¿Restaurar?`)) {
        textarea.value = draft.content;
        updateTextStats();
        showToast('Borrador restaurado');
      }
    } catch (error) {
      console.error('Error loading auto-saved draft:', error);
    }
  }
}

async function saveDraft() {
  const textarea = document.querySelector('#make-post-form textarea');
  if (!textarea || !textarea.value.trim()) {
    showToast('No hay contenido para guardar', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/scheduling/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: textarea.value,
        options: { draftId: currentDraftId }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      currentDraftId = result.draft.id;
      showToast('💾 Borrador guardado');
      loadDrafts();
    } else {
      showToast('Error al guardar borrador', 'error');
    }
  } catch (error) {
    showToast('Error de conexión', 'error');
  }
}

async function loadDrafts() {
  try {
    const response = await fetch('/api/scheduling/drafts');
    if (response.ok) {
      const drafts = await response.json();
      displayDrafts(drafts);
    }
  } catch (error) {
    console.error('Error loading drafts:', error);
  }
}

function displayDrafts(drafts) {
  const container = document.getElementById('draft-list');
  if (!container) return;
  
  if (drafts.length === 0) {
    container.innerHTML = '<p>No hay borradores guardados</p>';
    return;
  }
  
  container.innerHTML = drafts.map(draft => `
    <div class="draft-item">
      <div class="draft-preview">
        ${draft.content.substring(0, 100)}${draft.content.length > 100 ? '...' : ''}
      </div>
      <div class="draft-meta">
        <small>Guardado ${getTimeAgo(draft.updatedAt)}</small>
      </div>
      <div class="draft-actions">
        <button onclick="loadDraft('${draft.id}')">Cargar</button>
        <button onclick="deleteDraft('${draft.id}')">Eliminar</button>
      </div>
    </div>
  `).join('');
}

function getTimeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diff = now - past;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
  if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  return 'hace un momento';
}

async function loadDraft(draftId) {
  try {
    const response = await fetch('/api/scheduling/drafts');
    if (response.ok) {
      const drafts = await response.json();
      const draft = drafts.find(d => d.id === draftId);
      
      if (draft) {
        const textarea = document.querySelector('#make-post-form textarea');
        if (textarea) {
          textarea.value = draft.content;
          currentDraftId = draftId;
          updateTextStats();
          showToast('Borrador cargado');
        }
      }
    }
  } catch (error) {
    showToast('Error al cargar borrador', 'error');
  }
}

async function deleteDraft(draftId) {
  if (!confirm('¿Eliminar este borrador?')) return;
  
  try {
    const response = await fetch(`/api/scheduling/drafts/${draftId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showToast('Borrador eliminado');
      loadDrafts();
    } else {
      showToast('Error al eliminar borrador', 'error');
    }
  } catch (error) {
    showToast('Error de conexión', 'error');
  }
}

// Publishing functions
async function schedulePost(content) {
  try {
    const response = await fetch('/api/scheduling/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        scheduledFor: scheduledDateTime
      })
    });
    
    if (response.ok) {
      showToast('📅 Publicación programada exitosamente');
      clearForm();
    } else {
      const error = await response.json();
      showToast(error.error || 'Error al programar', 'error');
    }
  } catch (error) {
    showToast('Error de conexión', 'error');
  }
}

async function publishPost(content) {
  try {
    const response = await fetch('/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    
    if (response.ok) {
      showToast('✅ Publicación creada exitosamente');
      clearForm();
      setTimeout(() => {
        window.location.href = '../../Home/views/home.html';
      }, 1500);
    } else if (response.status === 401) {
      showToast('Debes iniciar sesión', 'error');
    } else {
      showToast('Error al publicar', 'error');
    }
  } catch (error) {
    showToast('Error de red', 'error');
  }
}

function clearForm() {
  const form = document.getElementById('make-post-form');
  if (form) {
    form.reset();
    scheduledDateTime = null;
    currentDraftId = null;
    
    document.getElementById('schedule-checkbox').checked = false;
    document.getElementById('schedule-options').style.display = 'none';
    document.querySelector('#make-post-form button[type="submit"]').textContent = '📤 Publicar';
    
    updateTextStats();
    updateSchedulePreview();
    
    localStorage.removeItem('autoSavedDraft');
  }
}

// Update auto-save status every minute
setInterval(updateAutoSaveStatus, 60000);
