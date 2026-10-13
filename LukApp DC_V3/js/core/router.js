/* =========================================================
   LukApp · router.js
   Manejo de rutas y renderizado optimizado sin parpadeos (FOUC).
   ========================================================= */

import { getSession } from '../services/storageService.js';
import { getCurrentUser } from '../auth/authModel.js';

/**
 * Función central para renderizar vistas sin parpadeos visuales (FOUC).
 * 
 * @param {string} htmlString El HTML crudo de la nueva vista.
 * @param {HTMLElement} container El contenedor principal del DOM (ej. main o #app-root).
 */
export function renderRouteWithoutFlash(htmlString, container) {
    if (!container) return;

    // 1. Crear un contenedor temporal en memoria (OFF-DOM)
    const virtualDOM = document.createElement('div');
    virtualDOM.innerHTML = htmlString;

    // 2. PRE-SINCRONIZAR DATOS DE USUARIO ANTES DE PINTAR
    // Esto reemplaza el texto genérico en el HTML por la información real del usuario.
    const user = getCurrentUser();
    if (user) {
        // Nombres
        virtualDOM.querySelectorAll('.user-name, #userNameTopbar').forEach(el => {
            el.textContent = user.name || 'Usuario';
        });
        
        // Roles / Planes
        virtualDOM.querySelectorAll('.user-plan').forEach(el => {
            el.textContent = user.role === 'admin' ? 'Root Access' : (user.plan || 'Premium');
        });
        
        // Avatares
        virtualDOM.querySelectorAll('.user-avatar, .topbar-avatar').forEach(avatar => {
            if (user.avatar) {
                avatar.style.backgroundImage = `url('${user.avatar}')`;
                avatar.style.backgroundSize = 'cover';
                avatar.style.backgroundPosition = 'center';
                avatar.textContent = '';
            } else {
                avatar.style.backgroundImage = 'none';
                avatar.textContent = (user.name || 'U').slice(0, 2).toUpperCase();
            }
        });
    }

    // 3. LIMPIEZA DE PLACEHOLDERS
    // Borra valores iniciales temporales para evitar parpadeos antes del cálculo del Controller.
    virtualDOM.querySelectorAll('.kpi-value, .summary-value, .records-count').forEach(el => {
        if (el.textContent.includes('$0') || el.textContent === '0') {
            el.textContent = '...'; 
        }
    });

    // 4. INYECCIÓN AL DOM REAL
    // Se inserta de un solo golpe con los datos ya precargados. Cero destellos.
    container.innerHTML = virtualDOM.innerHTML;
}