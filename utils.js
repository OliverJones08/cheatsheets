// Shared utilities for all pages
class CheatSheetsUtils {
  constructor() {
    this.apiBase = '/api';
    this.init();
  }

  init() {
    this.setupDarkMode();
    this.setupServiceWorker();
    this.setupGlobalErrorHandling();
  }

  // Dark mode with persistence
  setupDarkMode() {
    const btn = document.createElement('button');
    btn.textContent = '🌙';
    btn.title = 'Toggle dark mode';
    btn.className = 'dark-mode-toggle';
    btn.style.cssText = `
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      z-index: 1000;
      background: #1da1f2;
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      font-size: 1.2rem;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
    `;
    
    btn.onclick = () => this.toggleDarkMode();
    document.body.appendChild(btn);
    
    // Restore saved preference
    if (localStorage.getItem('darkMode') === 'true') {
      this.enableDarkMode();
    }
  }

  toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    
    const btn = document.querySelector('.dark-mode-toggle');
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  }

  enableDarkMode() {
    document.body.classList.add('dark-mode');
    const btn = document.querySelector('.dark-mode-toggle');
    if (btn) {
      btn.textContent = '☀️';
      btn.title = 'Switch to light mode';
    }
  }

  // Toast notifications with queuing
  showToast(message, type = 'info', duration = 3000) {
    const toastContainer = this.getOrCreateToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      background: ${type === 'error' ? '#e0245e' : type === 'success' ? '#17bf63' : '#1da1f2'};
      color: #fff;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      margin-bottom: 0.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      cursor: pointer;
    `;
    toast.textContent = message;
    toast.onclick = () => this.removeToast(toast);
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
      this.removeToast(toast);
    }, duration);
  }

  getOrCreateToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 3000;
        max-width: 300px;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  removeToast(toast) {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  // Loading spinner
  showSpinner() {
    if (document.getElementById('global-spinner')) return;
    
    const spinner = document.createElement('div');
    spinner.id = 'global-spinner';
    spinner.innerHTML = '<div class="spinner-inner"></div>';
    spinner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(255,255,255,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    `;
    
    const spinnerInner = spinner.querySelector('.spinner-inner');
    spinnerInner.style.cssText = `
      border: 4px solid #f3f3f3;
      border-top: 4px solid #1da1f2;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
    `;
    
    document.body.appendChild(spinner);
    
    // Add CSS animation if not exists
    if (!document.getElementById('spinner-styles')) {
      const style = document.createElement('style');
      style.id = 'spinner-styles';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  hideSpinner() {
    const spinner = document.getElementById('global-spinner');
    if (spinner) {
      spinner.remove();
    }
  }

  // Service worker registration
  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('SW registered: ', registration);
          })
          .catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }

  // Global error handling
  setupGlobalErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.showToast('Something went wrong', 'error');
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.showToast('Network error occurred', 'error');
    });
  }

  // API helpers with error handling
  async apiCall(endpoint, options = {}) {
    this.showSpinner();
    
    try {
      const response = await fetch(`${this.apiBase}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      this.showToast(error.message || 'Network error', 'error');
      throw error;
    } finally {
      this.hideSpinner();
    }
  }

  // Form validation
  validateForm(form, rules = {}) {
    const errors = [];
    const formData = new FormData(form);
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = formData.get(field);
      
      if (rule.required && (!value || value.trim() === '')) {
        errors.push(`${field} is required`);
      }
      
      if (rule.minLength && value && value.length < rule.minLength) {
        errors.push(`${field} must be at least ${rule.minLength} characters`);
      }
      
      if (rule.maxLength && value && value.length > rule.maxLength) {
        errors.push(`${field} must be less than ${rule.maxLength} characters`);
      }
      
      if (rule.pattern && value && !rule.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
    }
    
    return errors;
  }

  // Debounce utility
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Back to top button
  setupBackToTop() {
    const btn = document.createElement('button');
    btn.textContent = '↑';
    btn.title = 'Back to top';
    btn.className = 'back-to-top';
    btn.style.cssText = `
      position: fixed;
      right: 1.2rem;
      bottom: 4.5rem;
      z-index: 999;
      display: none;
      background: #1da1f2;
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 45px;
      height: 45px;
      font-size: 1.2rem;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
    `;
    
    btn.onclick = () => window.scrollTo({top: 0, behavior: 'smooth'});
    document.body.appendChild(btn);
    
    window.addEventListener('scroll', () => {
      btn.style.display = window.scrollY > 300 ? 'block' : 'none';
    });
  }
}

// Initialize global utilities
window.utils = new CheatSheetsUtils();
