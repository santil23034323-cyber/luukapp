/* =========================================================
   LukApp · authRegisterView.js
   Extrae y manipula el DOM para la pantalla de Registro
   ========================================================= */

export function getRegisterFormData() {
    return {
        name: document.getElementById('userName')?.value.trim() || '',
        email: document.getElementById('userEmail')?.value.trim() || '',
        phone: document.getElementById('userPhone')?.value.trim() || '',
        occupation: document.getElementById('userOccupation')?.value.trim() || '',
        password: document.getElementById('userPassword')?.value || '',
        confirmPassword: document.getElementById('userConfirmPassword')?.value || ''
    };
}

export function setLoading(isLoading) {
    const btn = document.getElementById('btnRegisterSubmit');
    if (btn) {
        btn.disabled = isLoading;
        btn.textContent = isLoading ? 'Registrando...' : 'Crear cuenta en LukApp';
    }
}

export function showMessage(msg, type = 'error') {
    const box = document.getElementById('registerMessage');
    if (!box) return;
    box.hidden = false;
    box.className = `form-message ${type}`;
    box.textContent = msg;
}