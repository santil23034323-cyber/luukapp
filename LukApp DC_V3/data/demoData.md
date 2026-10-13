/* =========================================================
   LukApp · demoData.js
   Datos iniciales para trabajar sin API (esquema multiusuario V2).
   Todo se asocia a un userId, igual que hace la migración
   de storageService.js.
   ========================================================= */

import { getItem, setItem, STORAGE_KEYS } from '../js/services/storageService.js';

// Mismo email/id que usa la migración, para no duplicar el usuario demo
const DEMO_USER = {
    id: 'legacy-user-1',
    name: 'Daniel',
    lastName: 'Gutiérrez',
    email: 'usuario@lukapp.com',
    passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', // SHA-256 de "123456"
    plan: 'Premium',
    avatar: null,
    fechaRegistro: new Date().toISOString()
};

const now = new Date().toISOString();

const DEMO_MOVEMENTS = [
    { id: 'mov-1', description: 'Salario mensual', type: 'ingreso', category: 'Salario', date: '2026-09-25', amount: 4200000, status: 'completado' },
    { id: 'mov-2', description: 'Proyecto freelance', type: 'ingreso', category: 'Freelance', date: '2026-09-22', amount: 850000, status: 'completado' },
    { id: 'mov-3', description: 'Supermercado', type: 'gasto', category: 'Alimentación', date: '2026-09-20', amount: 248000, status: 'completado' },
    { id: 'mov-4', description: 'Arriendo', type: 'gasto', category: 'Vivienda', date: '2026-09-18', amount: 1200000, status: 'completado' },
    { id: 'mov-5', description: 'Transporte', type: 'gasto', category: 'Transporte', date: '2026-09-17', amount: 186000, status: 'completado' },
    { id: 'mov-6', description: 'Internet', type: 'gasto', category: 'Servicios', date: '2026-09-15', amount: 95000, status: 'completado' },
    { id: 'mov-7', description: 'Netflix', type: 'gasto', category: 'Entretenimiento', date: '2026-09-12', amount: 31900, status: 'completado' },
    { id: 'mov-8', description: 'Restaurante', type: 'gasto', category: 'Alimentación', date: '2026-09-11', amount: 72000, status: 'completado' },
    { id: 'mov-9', description: 'Venta de producto', type: 'ingreso', category: 'Ventas', date: '2026-09-09', amount: 350000, status: 'completado' },
    { id: 'mov-10', description: 'Curso online', type: 'gasto', category: 'Educación', date: '2026-09-07', amount: 120000, status: 'completado' },
    { id: 'mov-11', description: 'Farmacia', type: 'gasto', category: 'Salud', date: '2026-09-04', amount: 64000, status: 'completado' },
    { id: 'mov-12', description: 'Taxi', type: 'gasto', category: 'Transporte', date: '2026-09-03', amount: 28000, status: 'completado' }
].map(m => ({ ...m, createdAt: now, updatedAt: now }));

const DEMO_GOALS = [
    { id: 'goal-1', name: 'Viaje a Europa', icon: '✈️', target: 6000000, saved: 2400000, deadline: '2027-06-30' },
    { id: 'goal-2', name: 'Computador', icon: '💻', target: 4500000, saved: 3330000, deadline: '2027-02-15' },
    { id: 'goal-3', name: 'Fondo de emergencia', icon: '💰', target: 3000000, saved: 1050000, deadline: '2027-12-31' }
].map(g => ({ ...g, completedNotified: false, createdAt: now, updatedAt: now }));

const DEMO_SETTINGS = {
    currency: 'COP',
    notifications: {
        financialSummary: true,
        goals: true,
        spendingAlerts: true,
        updates: false
    },
    appearance: {
        theme: 'light',
        animations: true
    },
    security: {
        twoFactorEnabled: false,
        passwordHash: null
    }
};

const DEMO_NOTIFICATIONS = [
    {
        id: 'welcome',
        title: 'Bienvenido a LukApp',
        message: 'Tu panel financiero ya está listo para usar.',
        type: 'info',
        read: false,
        createdAt: now,
        link: null
    }
];

// Agrega los datos demo solo si el usuario demo no tiene ninguno todavía
function seedCollection(key, items, userId) {
    const all = getItem(key);
    const list = Array.isArray(all) ? all : [];
    if (list.some(item => item.userId === userId)) return;
    setItem(key, [...list, ...items.map(item => ({ ...item, userId }))]);
}

export function ensureDemoData() {
    // 1. Usuario demo (la lista de usuarios es un arreglo)
    const users = getItem(STORAGE_KEYS.USERS);
    const userList = Array.isArray(users) ? users : [];
    let user = userList.find(u => u.email === DEMO_USER.email);

    if (!user) {
        user = DEMO_USER;
        setItem(STORAGE_KEYS.USERS, [...userList, user]);
    }

    // 2. Datos asociados a ese usuario
    seedCollection(STORAGE_KEYS.MOVEMENTS, DEMO_MOVEMENTS, user.id);
    seedCollection(STORAGE_KEYS.GOALS, DEMO_GOALS, user.id);
    seedCollection(STORAGE_KEYS.NOTIFICATIONS, DEMO_NOTIFICATIONS, user.id);

    // 3. Configuración: arreglo de { userId, ...ajustes }
    const settings = getItem(STORAGE_KEYS.SETTINGS);
    const settingsList = Array.isArray(settings) ? settings : [];
    if (!settingsList.some(s => s.userId === user.id)) {
        setItem(STORAGE_KEYS.SETTINGS, [...settingsList, { userId: user.id, ...DEMO_SETTINGS }]);
    }
}

export { DEMO_USER, DEMO_MOVEMENTS, DEMO_GOALS, DEMO_SETTINGS };