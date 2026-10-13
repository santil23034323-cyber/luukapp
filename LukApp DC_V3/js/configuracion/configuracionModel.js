/* =========================================================
   LukApp · configuracionModel.js
   Manejo estricto de datos del usuario actual.
   ========================================================= */
import { getCurrentUser, logout } from '../auth/authModel.js';
import * as SettingsRepo from '../repositories/SettingsRepository.js';
import * as UserRepo from '../repositories/UserRepository.js';
import * as MovementRepo from '../repositories/MovementRepository.js';
import * as GoalRepo from '../repositories/GoalRepository.js';
import * as NotificationRepo from '../repositories/NotificationRepository.js';
import { hashString } from '../services/cryptoService.js';

const DEFAULT_SETTINGS = {
    appearance: { theme: 'light', currency: 'COP', language: 'es' },
    notifications: { notif_email: true, notif_push: true, notif_weekly: false, notif_monthly: true, notif_alerts: true, notif_goals: true }
};

export function getSettings() {
    const user = getCurrentUser();
    if (!user) return DEFAULT_SETTINGS;
    
    const userSettings = SettingsRepo.findByUserId(user.id) || {};
    return {
        appearance: { ...DEFAULT_SETTINGS.appearance, ...(userSettings.appearance || {}) },
        notifications: { ...DEFAULT_SETTINGS.notifications, ...(userSettings.notifications || {}) }
    };
}

export function updateSettingCategory(category, key, value) {
    const user = getCurrentUser();
    if (!user) return false;

    const currentSettings = getSettings();
    currentSettings[category][key] = value;
    SettingsRepo.save(user.id, currentSettings);
    return currentSettings;
}

export function updateProfile(data) {
    const user = getCurrentUser();
    if (!user) return null;
    
    const updated = UserRepo.updateUser(user.id, {
        name: data.name,
        phone: data.phone,
        occupation: data.occupation,
        avatar: data.avatar !== undefined ? data.avatar : user.avatar
    });
    
    return updated;
}

export async function changePassword(currentPass, newPass) {
    const user = getCurrentUser();
    if (!user) return { success: false, message: 'No autenticado.' };

    const dbUser = UserRepo.findUserById(user.id);
    const currentHash = await hashString(currentPass);
    
    if (dbUser.passwordHash !== currentHash) {
        return { success: false, message: 'La contraseña actual es incorrecta.' };
    }

    const newHash = await hashString(newPass);
    UserRepo.updateUser(user.id, { passwordHash: newHash });

    return { success: true, message: 'Contraseña actualizada correctamente.' };
}

export function deleteAccount() {
    const user = getCurrentUser();
    if (!user) return false;

    // ELIMINACIÓN AISLADA DE TODO EL RASTRO DEL USUARIO
    MovementRepo.deleteAllByUserId(user.id);
    GoalRepo.deleteAllByUserId(user.id);
    NotificationRepo.deleteAllByUserId(user.id);
    SettingsRepo.deleteByUserId(user.id);
    UserRepo.deleteUser(user.id);
    
    logout();
    return true;
}