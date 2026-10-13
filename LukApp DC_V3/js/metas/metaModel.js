/* =========================================================
    LukApp · metaModel.js
    Abstrae la lógica de negocio asegurando aislamiento.
    ========================================================= */

import { getCurrentUser } from '../auth/authModel.js';
import * as GoalRepo from '../repositories/GoalRepository.js';
import { notifyGoalReached } from '../services/notificationService.js';

export function getAllGoals() {
    const user = getCurrentUser();
    if (!user) return [];
    return GoalRepo.findAllByUserId(user.id);
}

export function getGoalById(id) {
    const user = getCurrentUser();
    return user ? GoalRepo.findById(user.id, id) : null;
}

export function createGoal(data) {
    const user = getCurrentUser();
    if (!user) return null;

    const now = new Date().toISOString();
    const goal = {
        name: data.name,
        icon: data.icon || '🎯',
        target: Number(data.target),
        saved: Number(data.saved || 0),
        deadline: data.deadline || '',
        completedNotified: false, // evita notificar la meta más de una vez
        createdAt: now,
        updatedAt: now
    };
    return GoalRepo.create(user.id, goal);
}

// El ahorro ("saved") ya NO se edita aquí: solo cambia con abonos/retiros.
export function editGoal(id, data) {
    const user = getCurrentUser();
    if (!user) return false;

    return GoalRepo.update(user.id, id, {
        name: data.name,
        icon: data.icon,
        target: Number(data.target),
        deadline: data.deadline,
        updatedAt: new Date().toISOString()
    });
}

// Abonos y retiros. type: 'abonar' | 'retirar'
export function contributeToGoal(id, amount, type = 'abonar') {
    const user = getCurrentUser();
    if (!user) return null;

    const goal = GoalRepo.findById(user.id, id);
    if (!goal) return null;

    let nextSaved = Number(goal.saved || 0);
    const parsedAmount = Number(amount);

    if (type === 'abonar') nextSaved += parsedAmount;
    if (type === 'retirar') nextSaved -= parsedAmount;

    // REGLA: nunca permitir negativo
    if (nextSaved < 0) nextSaved = 0;

    const updates = { saved: nextSaved, updatedAt: new Date().toISOString() };

    // Notificar solo 1 vez al cruzar la meta
    if (nextSaved >= Number(goal.target) && !goal.completedNotified) {
        notifyGoalReached(goal.name);
        updates.completedNotified = true;
    } else if (nextSaved < Number(goal.target)) {
        // Si retira y baja del 100%, se reinicia la bandera
        updates.completedNotified = false;
    }

    GoalRepo.update(user.id, id, updates);
    return { ...goal, ...updates };
}

export function removeGoal(id) {
    const user = getCurrentUser();
    return user ? GoalRepo.remove(user.id, id) : false;
}

export function getGoalSummary(goals = getAllGoals()) {
    const saved = goals.reduce((sum, goal) => sum + Number(goal.saved || 0), 0);
    const target = goals.reduce((sum, goal) => sum + Number(goal.target || 0), 0);
    const progress = target ? (saved / target) * 100 : 0;

    return {
        saved,
        target,
        progress: Math.min(100, progress)
    };
}