/* =========================================================
   LukApp · authRegisterController.js
   Orquesta la validación de registro y conexión con el modelo.
   ========================================================= */

import { register } from './authModel.js';
import { getRegisterFormData, showMessage, setLoading } from './authRegisterView.js';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
});

async function handleRegister(event) {
    event.preventDefault();
    
    // Extracción completa (incluyendo los nuevos campos opcionales)
    const { name, email, phone, occupation, password, confirmPassword } = getRegisterFormData();

    // Validaciones estrictas
    if (!name || !email || !password) return showMessage('Completa los campos obligatorios (Nombre, Correo y Contraseña).');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showMessage('Ingresa un correo electrónico válido.');
    if (password.length < 6) return showMessage('La contraseña debe tener mínimo 6 caracteres.');
    if (password !== confirmPassword) return showMessage('Las contraseñas no coinciden.');

    setLoading(true);
    
    // Llamada al modelo usando el Patrón Parameter Object
    const result = await register({ name, email, phone, occupation, password });
    
    if (!result.success) {
        setLoading(false);
        return showMessage(result.message);
    }

    showMessage('Registro exitoso. Preparando tu panel...', 'success');
    
    // Retardo simulado para UX (evitar parpadeos bruscos)
    setTimeout(() => window.location.replace('dashboard.html'), 500);
}