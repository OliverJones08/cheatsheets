// home.js - Maneja la subida y visualización de cheatsheets

document.addEventListener('DOMContentLoaded', () => {
    fetchCheatsheets();
    checkAuth();

    // Búsqueda
    const searchInput = document.getElementById('cheatsheet-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            fetchCheatsheets(searchInput.value);
        });
    }

    // Subida
    const uploadForm = document.getElementById('cheatsheet-upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(uploadForm);
            const res = await fetch('/api/cheatsheets', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                uploadForm.reset();
                fetchCheatsheets();
                alert('¡Cheatsheet subida!');
            } else if (res.status === 401) {
                alert('Debes iniciar sesión para subir cheatsheets');
            } else {
                alert('Error al subir cheatsheet');
            }
        });
    }

    // Login/Register
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (res.ok) {
                loginForm.reset();
                checkAuth();
            } else {
                alert('Login incorrecto');
            }
        });
    }
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = registerForm.username.value;
            const password = registerForm.password.value;
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (res.ok) {
                registerForm.reset();
                checkAuth();
            } else {
                alert('Registro incorrecto');
            }
        });
    }
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('/api/logout', { method: 'POST' });
            checkAuth();
        });
    }
    // Notificaciones
    loadNotifications();
});

async function checkAuth() {
    // Simple check: try to upload (401 means not logged in)
    const res = await fetch('/api/cheatsheets', { method: 'POST' });
    const uploadSection = document.querySelector('.cheatsheet-upload');
    const authSection = document.getElementById('auth-section');
    if (res.status === 401) {
        if (uploadSection) uploadSection.style.display = 'none';
        if (authSection) authSection.style.display = 'block';
    } else {
        if (uploadSection) uploadSection.style.display = 'block';
        if (authSection) authSection.style.display = 'none';
    }
}

// ...existing code...
async function fetchCheatsheets(search = '') {
    const res = await fetch('/api/cheatsheets' + (search ? `?search=${encodeURIComponent(search)}` : ''));
    const data = await res.json();
    const container = document.getElementById('cheatsheets-list');
    if (!container) return;
    container.innerHTML = data.map(sheet => `
        <div class="cheatsheet-item">
            <h3>${sheet.title}</h3>
            <p><b>Tema:</b> ${sheet.theme}</p>
            <p>${sheet.description}</p>
            <a href="${sheet.fileUrl}" target="_blank">Descargar</a>
            <div class="cheatsheet-meta">
                <span>${new Date(sheet.createdAt).toLocaleString()} por <b>${sheet.user || 'anónimo'}</b></span>
                <button onclick="likeCheatsheet('${sheet.id}', this)">❤️ ${sheet.likes}</button>
            </div>
            <div class="cheatsheet-comments">
                <form onsubmit="return commentCheatsheet(event, '${sheet.id}')">
                    <input type="text" placeholder="Comentar..." required>
                    <button type="submit">Enviar</button>
                </form>
                <div class="comments-list">
                    ${(sheet.comments||[]).map(c => `<div class='comment'><b>${c.user}:</b> <span>${c.text}</span> <small>${new Date(c.date).toLocaleString()}</small></div>`).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

// ...existing code...
window.likeCheatsheet = async function(id, btn) {
    const res = await fetch(`/api/cheatsheets/${id}/like`, { method: 'POST' });
    if (res.ok) {
        const data = await res.json();
        btn.innerHTML = `❤️ ${data.likes}`;
    } else if (res.status === 401) {
        alert('Debes iniciar sesión para dar like');
    } else if (res.status === 400) {
        alert('Ya le diste like a este cheatsheet');
    }
};

window.commentCheatsheet = async function(e, id) {
    e.preventDefault();
    const input = e.target.querySelector('input');
    const text = input.value;
    const res = await fetch(`/api/cheatsheets/${id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
    if (res.ok) {
        input.value = '';
        fetchCheatsheets();
    } else if (res.status === 401) {
        alert('Debes iniciar sesión para comentar');
    }
    return false;
};

// Notificaciones
async function loadNotifications() {
    const notifPanel = document.getElementById('notifications-panel');
    if (!notifPanel) return;
    const res = await fetch('/api/notifications');
    if (res.status !== 200) {
        notifPanel.innerHTML = '<p>No autenticado.</p>';
        return;
    }
    const notifs = await res.json();
    notifPanel.innerHTML = notifs.length ? notifs.map(n =>
        `<div class='notif'>
            <b>${n.from}</b> ${n.type === 'like' ? 'le dio like a tu cheatsheet' : 'comentó: ' + n.text}
            <small>${new Date(n.date).toLocaleString()}</small>
        </div>`
    ).join('') : '<p>No tienes notificaciones.</p>';
}
window.markNotificationsRead = async function() {
    await fetch('/api/notifications/read', { method: 'POST' });
    loadNotifications();
};
