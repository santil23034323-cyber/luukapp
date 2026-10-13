/* =========================================================
   LukApp · adminController.js
   Maneja la lógica del Backoffice y sincronización de datos.
   ========================================================= */
import { verifyAdminAccess, getGlobalKPIs, getUsers, getUserDetails, toggleBlockUser, resetUserData, deleteUser, getGlobalStats, getSystemMetrics, toggleDemoMode } from './adminModel.js';
import { setupAdminNavigation, renderKPIs, renderUsersTable, openAdminModal, renderSystemMetrics, renderAdminCharts } from './adminView.js';

document.addEventListener('DOMContentLoaded', initializeAdmin);

// Sincronización Global
document.addEventListener('lukapp:user-blocked', refreshAllData);
document.addEventListener('lukapp:user-unblocked', refreshAllData);
document.addEventListener('lukapp:user-deleted', refreshAllData);
document.addEventListener('lukapp:user-reset', refreshAllData);
document.addEventListener('lukapp:admin-updated', refreshAllData);

function initializeAdmin() {
    if (!verifyAdminAccess()) {
        window.location.replace('dashboard.html');
        return;
    }

    setupAdminNavigation((section) => {
        // Cuando cambien a la pestaña de estadísticas, esperamos 50ms para que 
        // el CSS quite el display:none y el Canvas tenga dimensiones reales.
        if (section === 'estadisticas') {
            setTimeout(() => {
                renderAdminCharts(getGlobalStats());
            }, 50);
        }
    });

    refreshAllData();

    // Eventos del sistema (Modo Demo)
    document.addEventListener('click', (e) => {
        if (e.target.id === 'btnToggleDemo') {
            toggleDemoMode();
            document.dispatchEvent(new CustomEvent('lukapp:admin-updated'));
        }
    });

    // Buscador
    const searchInput = document.querySelector('.admin-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = getUsers().filter(u => {
                const safeName = (u.name || u.nombre || '').toLowerCase();
                const safeEmail = (u.email || '').toLowerCase();
                return safeName.includes(query) || safeEmail.includes(query);
            });
            renderUsersTable(filtered, handleUserAction);
        });
    }
}

function refreshAllData() {
    renderKPIs(getGlobalKPIs());
    renderUsersTable(getUsers(), handleUserAction);
    renderSystemMetrics(getSystemMetrics());
    
    // IMPORTANTE: También recalcular gráficos en segundo plano si hay modificaciones
    renderAdminCharts(getGlobalStats());
}

function handleUserAction(action, userId) {
    const user = getUserDetails(userId);
    if (!user) return;

    if (user.role === 'admin' && ['block', 'delete', 'reset'].includes(action)) {
        openAdminModal('Acción Denegada', '<p>Esta cuenta es una cuenta protegida del sistema. No puede ser alterada.</p>');
        return;
    }

    if (action === 'view') {
        const themeStr = user.settings?.appearance?.theme || 'Claro';
        const dateAccess = user.lastAccess ? new Date(user.lastAccess).toLocaleString('es-CO') : 'Nunca';
        const dateReg = new Date(user.fechaRegistro).toLocaleDateString('es-CO');
        
        const content = `
            <div style="display:flex; flex-direction:column; gap:16px; text-align:left;">
                <div style="background:var(--bg-muted); padding:16px; border-radius:8px;">
                    <h3 style="margin-bottom:4px; font-size:16px;">${user.name || user.nombre || 'Usuario'}</h3>
                    <p class="text-muted" style="font-size:13px;">${user.email} · Rol: ${user.role}</p>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:12px;">
                    <div style="border:1px solid var(--border-color); padding:12px; border-radius:8px;">
                        <span class="text-muted" style="display:block;">Registro:</span> <strong>${dateReg}</strong>
                    </div>
                    <div style="border:1px solid var(--border-color); padding:12px; border-radius:8px;">
                        <span class="text-muted" style="display:block;">Último acceso:</span> <strong>${dateAccess}</strong>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; font-size:12px; text-align:center;">
                    <div style="background:var(--bg-surface); border:1px solid var(--border-color); padding:12px; border-radius:8px;">
                        <strong style="font-size:18px;">${user.movementsCount}</strong><br><span class="text-muted">Movimientos</span>
                    </div>
                    <div style="background:var(--bg-surface); border:1px solid var(--border-color); padding:12px; border-radius:8px;">
                        <strong style="font-size:18px;">${user.goalsCount}</strong><br><span class="text-muted">Metas</span>
                    </div>
                    <div style="background:var(--bg-surface); border:1px solid var(--border-color); padding:12px; border-radius:8px;">
                        <strong style="font-size:18px;">${user.notifsCount}</strong><br><span class="text-muted">Notifs</span>
                    </div>
                </div>
                <div style="border:1px solid var(--border-color); padding:12px; border-radius:8px; font-size:12px;">
                    <span class="text-muted" style="display:block;">Tema UI:</span> <strong>${themeStr.toUpperCase()}</strong>
                </div>
                <button class="btn-danger-outline" id="btnResetData" style="margin-top:8px;">Resetear datos (Conserva cuenta)</button>
            </div>
        `;
        openAdminModal('Detalles de Usuario', content);
        
        setTimeout(() => {
            document.getElementById('btnResetData')?.addEventListener('click', () => {
                if (confirm('¿Eliminar todos los movimientos, metas y notificaciones de este usuario?')) {
                    resetUserData(userId);
                    document.querySelector('.modal-overlay')?.remove();
                    document.dispatchEvent(new CustomEvent('lukapp:user-reset'));
                }
            });
        }, 50);
    }

    if (action === 'block') {
        const isBlocked = user.blocked;
        const msg = isBlocked ? '¿Restaurar el acceso de este usuario?' : '¿Suspender cuenta? El usuario no podrá iniciar sesión.';
        openAdminModal('Seguridad de Cuenta', `<p>${msg}</p>`, () => {
            toggleBlockUser(userId);
            document.dispatchEvent(new CustomEvent(isBlocked ? 'lukapp:user-unblocked' : 'lukapp:user-blocked'));
        }, isBlocked ? 'Desbloquear' : 'Bloquear', !isBlocked);
    }

    if (action === 'delete') {
        openAdminModal('Eliminar Usuario', `<p>¿Borrar absolutamente todo el rastro de <strong>${user.name || 'este usuario'}</strong>? Esta acción no se puede deshacer.</p>`, () => {
            deleteUser(userId);
            document.dispatchEvent(new CustomEvent('lukapp:user-deleted'));
        }, 'Eliminar Permanentemente', true);
    }
}