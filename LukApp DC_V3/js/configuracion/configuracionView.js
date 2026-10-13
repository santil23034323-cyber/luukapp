/* =========================================================
   LukApp · configuracionView.js
   ========================================================= */

export function initTabs() {
    const tabs = document.querySelectorAll('.settings-tab');
    const sections = document.querySelectorAll('.settings-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`section-${tab.dataset.target}`)?.classList.add('active');
        });
    });
}

export function populateProfileData(user) {
    document.getElementById('inputName').value = user.name || '';
    document.getElementById('inputEmail').value = user.email || '';
    document.getElementById('inputPhone').value = user.phone || '';
    document.getElementById('inputOccupation').value = user.occupation || '';
    renderAvatar(user);
}

export function renderAvatar(user) {
    const avatarEl = document.getElementById('profileLargeAvatar');
    if (!avatarEl) return;

    if (user.avatar) {
        avatarEl.style.backgroundImage = `url('${user.avatar}')`;
        avatarEl.style.backgroundSize = 'cover';
        avatarEl.style.backgroundPosition = 'center';
        avatarEl.textContent = '';
    } else {
        const initials = user.name ? user.name.slice(0, 2).toUpperCase() : 'U';
        avatarEl.style.backgroundImage = 'none';
        avatarEl.textContent = initials;
    }
}

export function syncAppearanceUI(appearance) {
    if (appearance.theme) {
        const radio = document.querySelector(`input[name="theme"][value="${appearance.theme}"]`);
        if (radio) radio.checked = true;
    }
    if (appearance.currency) {
        const select = document.querySelector('select[name="currency"]');
        if (select) select.value = appearance.currency;
    }
    if (appearance.language) {
        const select = document.querySelector('select[name="language"]');
        if (select) select.value = appearance.language;
    }
}

export function syncNotificationsUI(notifs) {
    Object.keys(notifs).forEach(key => {
        const checkbox = document.querySelector(`input[name="${key}"]`);
        if (checkbox) checkbox.checked = notifs[key];
    });
}

export function showInlineMessage(containerId, message, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.textContent = message;
    container.className = `inline-message ${type}`;
    
    // Auto-ocultar después de 4 segundos si es success
    if (type === 'success') {
        setTimeout(() => { container.style.display = 'none'; container.className = 'inline-message'; }, 4000);
    }
}

// Creación Dinámica del Modal de Eliminación
export function openDeleteModal(onConfirm) {
    // Si ya hay un modal abierto, lo cerramos por seguridad
    document.querySelector('.modal-overlay')?.remove();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true">
            <div class="modal__body">
                <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 8px;">¿Eliminar cuenta?</h2>
                <p class="text-muted" style="font-size: 14px; margin-bottom: 24px;">
                    Esta acción borrará permanentemente todos tus movimientos, metas y configuraciones locales. 
                    <strong>No se puede deshacer.</strong>
                </p>
                <div style="display: grid; gap: 12px;">
                    <button type="button" class="btn-primary" style="background: var(--danger-color); color: #fff; border: none;" id="confirmDeleteBtn">Sí, eliminar todo</button>
                    <button type="button" class="btn-secondary" id="cancelDeleteBtn">Cancelar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);

    // Eventos para cerrar o confirmar
    modal.querySelector('#cancelDeleteBtn').addEventListener('click', () => modal.remove());
    
    // Si el usuario hace clic fuera de la caja blanca (en lo borroso), también se cancela
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    modal.querySelector('#confirmDeleteBtn').addEventListener('click', () => {
        modal.remove();
        onConfirm();
    });
}