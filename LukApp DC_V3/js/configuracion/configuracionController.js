/* =========================================================
   LukApp · configuracionController.js
   Lógica real, persistencia y eventos globales.
   ========================================================= */
import { initTabs, populateProfileData, syncAppearanceUI, syncNotificationsUI, showInlineMessage, renderAvatar, openDeleteModal } from './configuracionView.js';
import { getSettings, updateProfile, changePassword, updateSettingCategory, deleteAccount } from './configuracionModel.js';
import { getCurrentUser } from '../auth/authModel.js';
import { applyTheme } from '../core/theme.js';

document.addEventListener('DOMContentLoaded', initializeSettings);

function initializeSettings() {
    initTabs();

    // 1. Cargar datos del usuario real
    const user = getCurrentUser();
    if (!user) return;
    populateProfileData(user);

    // 2. Cargar configuraciones (Apariencia y Notificaciones)
    const settings = getSettings();
    syncAppearanceUI(settings.appearance);
    syncNotificationsUI(settings.notifications);

    // 3. Bind Events
    setupProfileEvents();
    setupSecurityEvents();
    setupSettingsEvents();
}

function setupProfileEvents() {
    const form = document.getElementById('formProfile');
    const avatarBtn = document.getElementById('btnChangeAvatar');
    
    // Guardado de Perfil
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('inputName').value.trim();
        const phone = document.getElementById('inputPhone').value.trim();
        const occupation = document.getElementById('inputOccupation').value.trim();

        if (!name) {
            alert('El nombre completo es obligatorio.'); // Requisito mínimo
            return;
        }

        const updatedUser = updateProfile({ name, phone, occupation });
        if (updatedUser) {
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = '¡Guardado!';
            setTimeout(() => btn.textContent = originalText, 2000);
            
            // FASE 1: EVENTO GLOBAL
            document.dispatchEvent(new CustomEvent('lukapp:user-updated', { detail: updatedUser }));
        }
    });

    // FASE 2: Subida de Avatar (FileReader)
    avatarBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png, image/jpeg, image/jpg, image/webp';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validación: 5MB
            if (file.size > 5 * 1024 * 1024) {
                alert('La imagen no debe superar los 5 MB.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Avatar = event.target.result;
                const updatedUser = updateProfile({ avatar: base64Avatar });
                if (updatedUser) {
                    renderAvatar(updatedUser);
                    document.dispatchEvent(new CustomEvent('lukapp:user-updated', { detail: updatedUser }));
                }
            };
            reader.readAsDataURL(file);
        });

        input.click();
    });
}

function setupSecurityEvents() {
    const form = document.getElementById('formSecurity');
    
    // ---------------------------------------------------------
    // LÓGICA ROBUSTA: MOSTRAR / OCULTAR CONTRASEÑA
    // ---------------------------------------------------------
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // e.currentTarget garantiza que atrapamos el <button>, no importa dónde haga clic el usuario
            const targetId = e.currentTarget.dataset.target; 
            const input = document.getElementById(targetId);
            
            if (!input) return; // Si no encuentra el input por seguridad, no hace nada

            if (input.type === 'password') {
                input.type = 'text';
                e.currentTarget.textContent = 'Ocultar';
                e.currentTarget.classList.add('is-visible');
            } else {
                input.type = 'password';
                e.currentTarget.textContent = 'Mostrar';
                e.currentTarget.classList.remove('is-visible');
            }
        });
    });

    // ---------------------------------------------------------
    // LÓGICA DE ACTUALIZACIÓN DE CONTRASEÑA REAL
    // ---------------------------------------------------------
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const current = document.getElementById('currentPassword').value;
        const newPass = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;

        if (!current || !newPass || !confirm) {
            return showInlineMessage('securityMessage', 'Completa todos los campos de contraseña.', 'error');
        }
        if (newPass.length < 6) {
            return showInlineMessage('securityMessage', 'La nueva contraseña debe tener mínimo 6 caracteres.', 'error');
        }
        if (newPass !== confirm) {
            return showInlineMessage('securityMessage', 'Las nuevas contraseñas no coinciden.', 'error');
        }

        const btn = document.getElementById('btnUpdatePassword');
        btn.disabled = true;
        btn.textContent = 'Actualizando...';

        const result = await changePassword(current, newPass);
        
        btn.disabled = false;
        btn.textContent = 'Actualizar contraseña';

        if (result.success) {
            showInlineMessage('securityMessage', result.message, 'success');
            form.reset(); // Limpia los inputs al guardar exitosamente
            
            // Regresar los botones al estado "Mostrar"
            document.querySelectorAll('.password-toggle').forEach(toggleBtn => {
                const input = document.getElementById(toggleBtn.dataset.target);
                if (input) input.type = 'password';
                toggleBtn.textContent = 'Mostrar';
                toggleBtn.classList.remove('is-visible');
            });

        } else {
            showInlineMessage('securityMessage', result.message, 'error');
        }
    });

    // (El resto del código de la Fase 5: Eliminar cuenta, se mantiene igual...)
}

    // FASE 5: Eliminar cuenta
    document.getElementById('btnDeleteAccount')?.addEventListener('click', () => {
        openDeleteModal(() => {
            if (deleteAccount()) {
                window.location.replace('login.html');
            }
        });
    });


function setupSettingsEvents() {
    // FASE 6: Notificaciones
    document.querySelectorAll('#formNotifications input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            updateSettingCategory('notifications', e.target.name, e.target.checked);
            document.dispatchEvent(new CustomEvent('lukapp:settings-updated'));
        });
    });

    // FASE 7: Apariencia (Tema, Idioma, Moneda)
    document.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                updateSettingCategory('appearance', 'theme', e.target.value);
                applyTheme(e.target.value); // Propaga globalmente al instante
                document.dispatchEvent(new CustomEvent('lukapp:appearance-updated'));
            }
        });
    });

    document.querySelectorAll('#formAppearance select').forEach(select => {
        select.addEventListener('change', (e) => {
            updateSettingCategory('appearance', e.target.name, e.target.value);
            document.dispatchEvent(new CustomEvent('lukapp:appearance-updated'));
        });
    });
}

// Integración especial: Escuchar si alguien cambió el tema desde el Header
document.addEventListener('lukapp:theme-toggled-manually', (e) => {
    const newTheme = e.detail;
    updateSettingCategory('appearance', 'theme', newTheme);
    syncAppearanceUI({ theme: newTheme }); // Refresca los radios visualmente
});