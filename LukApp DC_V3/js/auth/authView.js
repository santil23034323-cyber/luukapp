/* =========================================================
   LukApp · authView.js
   ========================================================= */

export function getLoginFormData() {
    return {
        email: document.getElementById('userEmail')?.value.trim() || '',
        password: document.getElementById('userPassword')?.value || '',
        remember: document.getElementById('rememberSession')?.checked ?? true
    };
}

export function setLoading(isLoading) {
    const button = document.getElementById('btnLogin');
    if (!button) return;
    button.disabled = isLoading;
    button.textContent = isLoading ? 'Ingresando...' : 'Ingresar a LukApp';
}

export function showMessage(message, type = 'error') {
    const box = document.getElementById('loginMessage');
    if (!box) return;
    box.hidden = false;
    box.className = `form-message ${type}`;
    box.textContent = message;
}

export function clearMessage() {
    const box = document.getElementById('loginMessage');
    if (!box) return;
    box.hidden = true;
    box.textContent = '';
    box.className = 'form-message';
}

export function togglePasswordVisibility() {
    const input = document.getElementById('userPassword');
    const button = document.getElementById('btnTogglePassword');
    if (!input || !button) return;

    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    button.textContent = showing ? 'Mostrar' : 'Ocultar';
    button.setAttribute('aria-pressed', String(!showing));
}