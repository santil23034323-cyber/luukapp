/* =========================================================
   LukApp · adminModel.js
   Lógica de negocio y consultas de datos para el Backoffice.
   ========================================================= */
import { getCurrentUser } from '../auth/authModel.js';
import * as UserRepo from '../repositories/UserRepository.js';
import * as MovementRepo from '../repositories/MovementRepository.js';
import * as GoalRepo from '../repositories/GoalRepository.js';
import * as NotificationRepo from '../repositories/NotificationRepository.js';
import * as SettingsRepo from '../repositories/SettingsRepository.js';

export function verifyAdminAccess() {
    const user = getCurrentUser();
    return (user && user.role === 'admin') ? user : false;
}

export function getGlobalKPIs() {
    const users = UserRepo.findAll().filter(u => u.role !== 'admin');
    return {
        totalUsers: users.length,
        totalMovements: MovementRepo.findAll().length,
        totalGoals: GoalRepo.findAll().length,
        totalNotifs: NotificationRepo.findAll().length
    };
}

export function getUsers() {
    return UserRepo.findAll()
        .filter(u => u.role !== 'admin')
        .sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
}

// FASE 2: VER USUARIO (Datos integrales)
export function getUserDetails(userId) {
    const user = UserRepo.findUserById(userId);
    if (!user) return null;
    return {
        ...user,
        movementsCount: MovementRepo.findAllByUserId(userId).length,
        goalsCount: GoalRepo.findAllByUserId(userId).length,
        notifsCount: NotificationRepo.findAllByUserId(userId).length,
        settings: SettingsRepo.findByUserId(userId) || {}
    };
}

// FASE 3 & 4: BLOQUEAR / DESBLOQUEAR
export function toggleBlockUser(userId) {
    const user = UserRepo.findUserById(userId);
    if (!user || user.role === 'admin') return false;
    const newStatus = !user.blocked;
    UserRepo.updateUser(userId, { blocked: newStatus });
    return newStatus;
}

// FASE 7: ELIMINAR / RESETEAR (Borrado en Cascada)
export function resetUserData(userId) {
    MovementRepo.deleteAllByUserId(userId);
    GoalRepo.deleteAllByUserId(userId);
    NotificationRepo.deleteAllByUserId(userId);
    return true;
}

export function deleteUser(userId) {
    const user = UserRepo.findUserById(userId);
    if (!user || user.role === 'admin') return false;

    resetUserData(userId);
    SettingsRepo.deleteByUserId(userId);
    UserRepo.deleteUser(userId);
    return true;
}

export function getGlobalStats() {
    const movements = MovementRepo.findAll() || [];
    const users = UserRepo.findAll().filter(u => u.role !== 'admin');
    
    // 1. Cálculos de Ingresos vs Gastos Globales
    let totalIncome = 0; 
    let totalExpense = 0;
    
    movements.forEach(m => {
        if (m.status !== 'cancelado' && m.amount) {
            if (m.type === 'ingreso') totalIncome += Number(m.amount);
            else totalExpense += Number(m.amount);
        }
    });

    // 2. Cálculo de Usuarios por mes (Últimos 6 meses)
    const usersByMonth = Array(6).fill(0);
    const labels = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
        // Obtenemos el mes restando desde hoy hacia atrás
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        
        // Etiqueta del mes (Ej: "Sep", "Oct")
        const monthLabel = d.toLocaleDateString('es-CO', { month: 'short' });
        labels.push(monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1));
        
        // Contamos usuarios cuyo registro coincida con ese mes y año (Tolerante a fallos)
        const count = users.filter(u => {
            if (!u.fechaRegistro) return false;
            
            const ud = new Date(u.fechaRegistro);
            if (isNaN(ud)) return false; 

            return ud.getMonth() === d.getMonth() && ud.getFullYear() === d.getFullYear();
        }).length;
        
        usersByMonth[5 - i] = count;
    }

    return { totalIncome, totalExpense, userLabels: labels, usersByMonth };
}

export function getSystemMetrics() {
    let totalBytes = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalBytes += localStorage[key].length * 2; // Aproximación en bytes (UTF-16)
        }
    }
    return {
        sizeKB: Math.round(totalBytes / 1024),
        demoStatus: window.localStorage.getItem('lukapp_demo_active') === 'true'
    };
}

export function toggleDemoMode() {
    const current = window.localStorage.getItem('lukapp_demo_active') === 'true';
    window.localStorage.setItem('lukapp_demo_active', (!current).toString());
    return !current;
}