/* =========================================================
    LukApp · dashboardController.js
    ========================================================= */

import { ensureDemoData } from '../../data/demoData.js';
import { getDashboardData } from './dashboardModel.js';
import { renderDashboard } from './dashboardView.js';

document.addEventListener('DOMContentLoaded', initializeDashboard);

// Sincronización global sin recargar (evento viejo + evento nuevo)
document.addEventListener('lukapp:user-updated', refreshDashboard);
document.addEventListener('lukapp:data-updated', refreshDashboard);

function refreshDashboard() {
    renderDashboard(getDashboardData());
}

function initializeDashboard() {
    ensureDemoData();
    refreshDashboard();

    // Redirección automática a movimientos.html con el modal abierto
    document.getElementById('btnAgregarMovimiento')?.addEventListener('click', () => {
        window.location.href = 'movimientos.html?action=new';
    });
}