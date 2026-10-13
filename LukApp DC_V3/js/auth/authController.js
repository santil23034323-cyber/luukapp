/* =========================================================
   LukApp · authController.js
   Controlador para el inicio de sesión.
   ========================================================= */
import { login, isAuthenticated } from './authModel.js';
import { getLoginFormData, setLoading, showMessage, clearMessage, togglePasswordVisibility } from './authView.js';

function initializeAuth() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    if (isAuthenticated()) {
        window.location.replace('dashboard.html');
        return;
    }

    form.addEventListener('submit', handleLogin);
    document.getElementById('btnTogglePassword')?.addEventListener('click', togglePasswordVisibility);

    // Redirección directa al registro
    document.getElementById('btnRegister')?.addEventListener('click', () => {
        window.location.href = 'registro.html';
    });

    document.getElementById('btnForgotPassword')?.addEventListener('click', () => {
        showMessage('Por seguridad local, si olvidaste la clave debes borrar los datos del navegador.', 'info');
    });

    document.getElementById('btnGoogleLogin')?.addEventListener('click', () => {
        showMessage('La integración OAuth se habilitará tras conectar el Backend.', 'info');
    });
}

async function handleLogin(event) {
    event.preventDefault();
    clearMessage();

    const { email, password, remember } = getLoginFormData();

    if (!email) return showMessage('Ingresa tu correo electrónico.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showMessage('Ingresa un correo electrónico válido.');
    if (!password) return showMessage('Ingresa tu contraseña.');

    setLoading(true);
    
    // Retardo simulado para UX (evitar parpadeos bruscos)
    await new Promise(res => setTimeout(res, 350));

    const result = await login(email, password, remember);

    if (!result.success) {
        setLoading(false);
        showMessage(result.message);
        return;
    }

    showMessage('Sesión iniciada. Redirigiendo...', 'success');
    
    // Redirección inteligente basada en el rol
    setTimeout(() => {
        const userRole = result.user.role || 'user';
        if (userRole === 'admin') {
            window.location.replace('admin.html');
        } else {
            window.location.replace('dashboard.html');
        }
    }, 300);
}

document.addEventListener('DOMContentLoaded', initializeAuth);