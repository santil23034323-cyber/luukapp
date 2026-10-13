/* =========================================================
   LukApp · authModel.js
   ========================================================= */
import { setSession, getSession, clearSession } from '../services/storageService.js';
import * as UserRepo from '../repositories/UserRepository.js';
import * as SettingsRepo from '../repositories/SettingsRepository.js';
import { hashString } from '../services/cryptoService.js';

export async function login(email, password, remember = true) {
    const user = UserRepo.findUserByEmail(email);
    if (!user) return { success: false, message: 'Correo o contraseña incorrectos.' };
    
    if (user.blocked) return { success: false, message: 'Tu cuenta ha sido suspendida por un administrador.' };

    const hash = await hashString(password);
    if (user.passwordHash !== hash) return { success: false, message: 'Correo o contraseña incorrectos.' };
    
    UserRepo.updateUser(user.id, { lastAccess: new Date().toISOString() });

    const session = { id: user.id, name: user.name, email: user.email, role: user.role };
    setSession(session, remember);
    return { success: true, user: session };
}

export async function register({ name, email, phone, occupation, password }) {
    const existing = UserRepo.findUserByEmail(email);
    if (existing) return { success: false, message: 'El correo ya está registrado.' };
    
    const passwordHash = await hashString(password);
    const user = UserRepo.createUser({ 
        name, email, phone, occupation, passwordHash, plan: 'Usuario', blocked: false 
    });
    
    SettingsRepo.save(user.id, {
        appearance: { theme: 'light', currency: 'COP', language: 'es' },
        notifications: { notif_email: true, notif_push: true, notif_weekly: false, notif_monthly: true, notif_alerts: true, notif_goals: true },
        security: { twoFactorEnabled: false }
    });
    
    const session = { id: user.id, name: user.name, email: user.email, role: user.role };
    setSession(session, true);
    return { success: true, user: session };
}

export function getCurrentUser() {
    const session = getSession();
    if (!session) return null;
    
    const dbUser = UserRepo.findUserById(session.id);
    if (!dbUser) {
        clearSession();
        return null;
    }
    
    return { 
        id: dbUser.id, name: dbUser.name, email: dbUser.email, phone: dbUser.phone,
        occupation: dbUser.occupation, plan: dbUser.plan, avatar: dbUser.avatar, role: dbUser.role 
    };
}

export function isAuthenticated() { return Boolean(getCurrentUser()); }

export function logout() { clearSession(); }