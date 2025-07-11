// Real-time notifications client
class RealTimeNotifications {
    constructor() {
        this.socket = null;
        this.init();
    }

    init() {
        if (typeof io !== 'undefined') {
            this.socket = io();
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            // Authenticate if user is logged in
            const username = this.getCurrentUser();
            if (username) {
                this.socket.emit('authenticate', username);
            }
        });

        this.socket.on('notification', (notification) => {
            this.showNotification(notification);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });
    }

    getCurrentUser() {
        // Try to get current user from session or localStorage
        return localStorage.getItem('currentUser') || null;
    }

    showNotification(notification) {
        if (window.utils) {
            const message = this.formatNotificationMessage(notification);
            window.utils.showToast(message, 'info', 5000);
        }

        // Also show browser notification if permission granted
        if (Notification.permission === 'granted') {
            new Notification('CheatSheets', {
                body: this.formatNotificationMessage(notification),
                icon: '/favicon.ico'
            });
        }
    }

    formatNotificationMessage(notification) {
        switch (notification.type) {
            case 'like':
                return `${notification.from} liked your post`;
            case 'comment':
                return `${notification.from} commented: "${notification.text}"`;
            case 'follow':
                return `${notification.from} started following you`;
            case 'repost':
                return `${notification.from} reposted your content`;
            default:
                return notification.message || 'You have a new notification';
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}

// Infinite scroll implementation
class InfiniteScroll {
    constructor(container, loadMore, options = {}) {
        this.container = container;
        this.loadMore = loadMore;
        this.page = 1;
        this.loading = false;
        this.hasMore = true;
        this.options = {
            threshold: 200,
            ...options
        };
        
        this.init();
    }

    init() {
        this.setupScrollListener();
    }

    setupScrollListener() {
        window.addEventListener('scroll', this.debounce(() => {
            if (this.shouldLoadMore()) {
                this.load();
            }
        }, 100));
    }

    shouldLoadMore() {
        const scrollPosition = window.innerHeight + window.scrollY;
        const documentHeight = document.documentElement.offsetHeight;
        return !this.loading && this.hasMore && 
               (scrollPosition >= documentHeight - this.options.threshold);
    }

    async load() {
        if (this.loading || !this.hasMore) return;
        
        this.loading = true;
        this.showLoadingIndicator();
        
        try {
            const hasMore = await this.loadMore(this.page);
            this.hasMore = hasMore !== false;
            this.page++;
        } catch (error) {
            console.error('Error loading more content:', error);
            if (window.utils) {
                window.utils.showToast('Error loading more content', 'error');
            }
        } finally {
            this.loading = false;
            this.hideLoadingIndicator();
        }
    }

    showLoadingIndicator() {
        let indicator = document.getElementById('infinite-scroll-loader');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'infinite-scroll-loader';
            indicator.innerHTML = '<div class="spinner-small"></div><span>Loading more...</span>';
            indicator.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 1rem;
                color: #666;
            `;
            
            const spinnerSmall = indicator.querySelector('.spinner-small');
            spinnerSmall.style.cssText = `
                border: 2px solid #f3f3f3;
                border-top: 2px solid #1da1f2;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                animation: spin 1s linear infinite;
            `;
            
            this.container.appendChild(indicator);
        }
        indicator.style.display = 'flex';
    }

    hideLoadingIndicator() {
        const indicator = document.getElementById('infinite-scroll-loader');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

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
}

// Image upload with preview
class ImageUploader {
    constructor(options = {}) {
        this.options = {
            maxSize: 5 * 1024 * 1024, // 5MB
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            ...options
        };
    }

    createUploadButton(container, onUpload) {
        const button = document.createElement('button');
        button.type = 'button';
        button.innerHTML = '📷 Add Image';
        button.className = 'image-upload-btn';
        button.style.cssText = `
            background: none;
            border: 1px solid #1da1f2;
            color: #1da1f2;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
        `;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        input.multiple = this.options.multiple || false;

        button.onclick = () => input.click();
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            this.handleFiles(files, container, onUpload);
        };

        container.appendChild(button);
        container.appendChild(input);

        return { button, input };
    }

    async handleFiles(files, container, onUpload) {
        const validFiles = [];
        
        for (const file of files) {
            if (this.validateFile(file)) {
                validFiles.push(file);
            }
        }

        if (validFiles.length === 0) return;

        const previewContainer = this.getOrCreatePreviewContainer(container);
        
        for (const file of validFiles) {
            const preview = await this.createPreview(file);
            previewContainer.appendChild(preview);
            
            if (onUpload) {
                onUpload(file, preview);
            }
        }
    }

    validateFile(file) {
        if (!this.options.allowedTypes.includes(file.type)) {
            if (window.utils) {
                window.utils.showToast('Invalid file type', 'error');
            }
            return false;
        }

        if (file.size > this.options.maxSize) {
            if (window.utils) {
                window.utils.showToast('File too large', 'error');
            }
            return false;
        }

        return true;
    }

    async createPreview(file) {
        const preview = document.createElement('div');
        preview.className = 'image-preview';
        preview.style.cssText = `
            position: relative;
            display: inline-block;
            margin: 0.5rem;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;

        const img = document.createElement('img');
        img.style.cssText = `
            width: 100px;
            height: 100px;
            object-fit: cover;
            display: block;
        `;

        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '×';
        removeBtn.style.cssText = `
            position: absolute;
            top: 4px;
            right: 4px;
            background: rgba(0,0,0,0.5);
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
        `;

        removeBtn.onclick = () => preview.remove();

        // Load image
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);

        preview.appendChild(img);
        preview.appendChild(removeBtn);

        return preview;
    }

    getOrCreatePreviewContainer(container) {
        let previewContainer = container.querySelector('.image-previews');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.className = 'image-previews';
            previewContainer.style.cssText = `
                margin: 1rem 0;
                min-height: 20px;
            `;
            container.appendChild(previewContainer);
        }
        return previewContainer;
    }
}

// Initialize real-time notifications
window.notifications = new RealTimeNotifications();
window.notifications.requestNotificationPermission();
