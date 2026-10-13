/* =========================================================
   LukApp · app.js
   Lógica transversal del panel y Route Guards estrictos.
   ========================================================= */
import { getSession, clearSession } from '../services/storageService.js';
import { getCurrentUser } from '../auth/authModel.js';
import { ensureDemoData } from '../../data/demoData.js';
import {
    getUnreadCount,
    getNotifications,
    markAllAsRead,
    markAsRead
} from '../services/notificationService.js';

const PROTECTED_PAGES = [
    'dashboard.html',
    'movimientos.html',
    'estadisticas.html',
    'metas.html',
    'configuracion.html',
    'admin.html'
];

function initializeApp() {
    const currentPage = window.location.pathname.split('/').pop().toLowerCase();
    const session = getSession();

    if (PROTECTED_PAGES.includes(currentPage)) {
        if (!session) {
            window.location.replace('login.html');
            return;
        }

        // GUARD: Admin estricto
        if (session.role === 'admin' && currentPage !== 'admin.html') {
            window.location.replace('admin.html');
            return;
        }
        
        // GUARD: Usuario estricto
        if (session.role !== 'admin' && currentPage === 'admin.html') {
            window.location.replace('dashboard.html');
            return;
        }

        ensureDemoData();
    }

    initializeSidebar();
    initializeLogout();
    refreshUserUI();
    initializeGlobalSearch();
    initializeNotifications();

    // REVEAL APP: Revelar la aplicación de forma segura tras el pintado inicial
    revealApp();
}

document.addEventListener('DOMContentLoaded', initializeApp);
document.addEventListener('lukapp:user-updated', refreshUserUI);


/* =========================================================
   REVEAL APP (Control de FOUC y Fade-in)
   ========================================================= */
function revealApp() {
    setTimeout(() => {
        const layout = document.querySelector('.app-layout');
        if (layout) {
            layout.classList.add('app-loaded');
        }
    }, 15);
}


/* =========================================================
   SIDEBAR
   ========================================================= */

export function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');
    if (!sidebar || !toggle || toggle.dataset.bound) return;
    
    toggle.dataset.bound = 'true';
    toggle.addEventListener('click', () => {
        const isOpen = sidebar.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', event => {
        if (window.matchMedia('(max-width: 900px)').matches && sidebar.classList.contains('is-open')) {
            if (!sidebar.contains(event.target) && !toggle.contains(event.target)) {
                sidebar.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        }
    });

    sidebar.addEventListener('click', event => {
        const link = event.target.closest('a');
        if (!link) return;
        if (window.matchMedia('(max-width: 900px)').matches) {
            sidebar.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });
}


/* =========================================================
   CIERRE DE SESIÓN
   ========================================================= */

export function initializeLogout() {
    const logout = document.getElementById('btnLogout');
    if (!logout || logout.dataset.bound) return;
    logout.dataset.bound = 'true';
    logout.addEventListener('click', event => {
        event.preventDefault();
        clearSession();
        window.location.replace('login.html');
    });
}


/* =========================================================
   PERFIL DEL USUARIO
   ========================================================= */

export function refreshUserUI() {
    const user = getCurrentUser();
    if (!user) return;

    const nameElements = document.querySelectorAll('.user-name, #userName, #userNameTopbar');
    const avatarElements = document.querySelectorAll('.user-avatar, #userAvatar, #userAvatarTopbar');
    const planElements = document.querySelectorAll('.user-plan, #userPlan, #userPlanTopbar');

    nameElements.forEach(el => el.textContent = user.name || user.nombre || 'Usuario');
    planElements.forEach(el => el.textContent = user.plan || (user.role === 'admin' ? 'Root Access' : 'Premium'));

    avatarElements.forEach(avatar => {
        if (user.avatar) {
            avatar.style.backgroundImage = `url('${user.avatar}')`;
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';
            avatar.textContent = '';
        } else {
            avatar.style.backgroundImage = 'none';
            avatar.textContent = (user.name || user.nombre || 'U').slice(0, 2).toUpperCase();
        }
    });
}


/* =========================================================
   BÚSQUEDA GLOBAL
   ========================================================= */

export function initializeGlobalSearch() {
    const input = document.getElementById('globalSearch');
    if (!input || input.dataset.bound) return;
    input.dataset.bound = 'true';

    input.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        const query = input.value.trim();
        if (!query) return;

        if (window.location.pathname.includes('movimientos.html')) {
            document.dispatchEvent(
                new CustomEvent('lukapp:search', {
                    detail: { query }
                })
            );
        } else {
            window.location.href = `movimientos.html?search=${encodeURIComponent(query)}`;
        }
    });
}


/* =========================================================
   NOTIFICACIONES
   ========================================================= */

export function initializeNotifications() {
    const button = document.getElementById('btnNotifications');
    if (!button || button.dataset.bound) return;
    button.dataset.bound = 'true';

    renderNotificationBadge(button);

    button.addEventListener('click', () => {
        toggleNotificationPanel(button);
    });

    document.addEventListener('lukapp:notification', () => {
        renderNotificationBadge(button);
        renderNotificationPanelIfOpen();
    });
}

function renderNotificationBadge(button) {
    if (!button) return;
    const count = getUnreadCount();
    let badge = button.querySelector('.notification-badge');

    if (count <= 0) {
        badge?.remove();
        return;
    }

    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'notification-badge';
        badge.style.cssText = `
            position: absolute;
            top: 3px;
            right: 3px;
            min-width: 16px;
            height: 16px;
            padding: 0 4px;
            border-radius: 999px;
            background: #E04848;
            color: #fff;
            font-size: 9px;
            font-weight: 800;
            display: grid;
            place-items: center;
            line-height: 1;
        `;
        button.style.position = 'relative';
        button.appendChild(badge);
    }
    badge.textContent = count > 99 ? '99+' : String(count);
}

function toggleNotificationPanel(button) {
    let panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.remove();
        return;
    }
    panel = createNotificationPanel();
    document.body.appendChild(panel);
    const rect = button.getBoundingClientRect();
    panel.style.top = `${rect.bottom + 10}px`;
    panel.style.right = `${Math.max(12, window.innerWidth - rect.right)}px`;
}

function renderNotificationPanelIfOpen() {
    const old = document.getElementById('notificationPanel');
    if (!old) return;
    const replacement = createNotificationPanel();
    replacement.style.top = old.style.top;
    replacement.style.right = old.style.right;
    old.replaceWith(replacement);
}

function createNotificationPanel() {
    const panel = document.createElement('div');
    panel.id = 'notificationPanel';
    panel.style.cssText = `
        position: fixed;
        z-index: 500;
        width: min(360px, calc(100vw - 24px));
        max-height: 480px;
        overflow: auto;
        background: var(--bg-surface);
        color: var(--text-color);
        border: 1px solid var(--border-color);
        border-radius: 14px;
        box-shadow: var(--shadow-pop);
        padding: 14px;
    `;

    const notifications = getNotifications();

    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 12px;
    `;
    header.innerHTML = `
        <strong>Notificaciones</strong>
        <button type="button" id="markNotificationsRead" style="font-size:11px;color:var(--text-muted)">Marcar leídas</button>
    `;
    panel.appendChild(header);

    const list = document.createElement('div');
    list.style.cssText = `display: flex; flex-direction: column; gap: 8px;`;

    if (!notifications.length) {
        const empty = document.createElement('div');
        empty.textContent = 'No tienes notificaciones.';
        empty.style.cssText = `padding: 24px 8px; text-align: center; color: var(--text-subtle); font-size: 12px;`;
        list.appendChild(empty);
    }

    notifications.forEach(notification => {
        const item = document.createElement('button');
        item.type = 'button';
        item.style.cssText = `
            display: block;
            width: 100%;
            padding: 11px;
            text-align: left;
            border: 1px solid ${notification.read ? 'var(--border-color)' : 'var(--primary-color)'};
            border-radius: 10px;
            background: ${notification.read ? 'var(--bg-surface)' : 'var(--primary-soft)'};
            color: var(--text-color);
        `;
        item.innerHTML = `
            <div style="font-weight:700;font-size:12px;margin-bottom:3px">${escapeHTML(notification.title)}</div>
            <div style="font-size:11px;color:var(--text-muted)">${escapeHTML(notification.message)}</div>
        `;
        item.addEventListener('click', () => {
            markAsRead(notification.id);
            renderNotificationPanelIfOpen();
            renderNotificationBadge(document.getElementById('btnNotifications'));
        });
        list.appendChild(item);
    });

    panel.appendChild(list);

    panel.querySelector('#markNotificationsRead')?.addEventListener('click', () => {
        markAllAsRead();
        renderNotificationPanelIfOpen();
        renderNotificationBadge(document.getElementById('btnNotifications'));
    });

    return panel;
}

function escapeHTML(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}