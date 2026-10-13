/* =========================================================
   LukApp · notificationService.js
   Abstrae la creación y lectura de notificaciones aisladas por usuario.
   ========================================================= */
import { getCurrentUser } from '../auth/authModel.js';
import * as NotificationRepo from '../repositories/NotificationRepository.js';

export function getNotifications() {
    const user = getCurrentUser();
    if (!user) return [];
    
    // Devolvemos ordenado por fecha descendente
    return NotificationRepo.findAllByUserId(user.id).sort((a, b) => new Date(b.createdAt) < new Date(a.createdAt) ? 1 : -1);
}

export function getUnreadNotifications() {
    return getNotifications().filter(item => !item.read);
}

export function getUnreadCount() {
    return getUnreadNotifications().length;
}

export function createNotification(data = {}) {
    const user = getCurrentUser();
    if (!user) return null;

    const notification = {
        title: data.title || 'Notificación',
        message: data.message || '',
        type: data.type || 'info',
        read: Boolean(data.read),
        createdAt: data.createdAt || new Date().toISOString(),
        link: data.link || null
    };

    const created = NotificationRepo.create(user.id, notification);
    emit('created', created);
    return created;
}

export function markAsRead(id) {
    const user = getCurrentUser();
    if (!user) return false;

    if (NotificationRepo.update(user.id, id, { read: true })) {
        emit('updated', { id, read: true });
        return true;
    }
    return false;
}

export function markAllAsRead() {
    const user = getCurrentUser();
    if (!user) return false;

    if (NotificationRepo.markAllAsReadByUserId(user.id)) {
        emit('all-read');
        return true;
    }
    return false;
}

export function deleteNotification(id) {
    const user = getCurrentUser();
    if (!user) return false;

    if (NotificationRepo.remove(user.id, id)) {
        emit('deleted', id);
        return true;
    }
    return false;
}

export function clearNotifications() {
    const user = getCurrentUser();
    if (!user) return false;

    NotificationRepo.deleteAllByUserId(user.id);
    emit('cleared');
    return true;
}

export function notifyGoalReached(goalName) {
    return createNotification({
        title: 'Meta alcanzada',
        message: `Has alcanzado tu meta "${goalName}".`,
        type: 'success'
    });
}

export function notifySpendingAlert(category, amount) {
    return createNotification({
        title: 'Alerta de gasto',
        message: `Tus gastos en ${category} han alcanzado $${Number(amount).toLocaleString('es-CO')}.`,
        type: 'warning'
    });
}

export function notifyIncome(amount, description = 'Nuevo ingreso') {
    return createNotification({
        title: 'Nuevo ingreso',
        message: `${description}: +$${Number(amount).toLocaleString('es-CO')}.`,
        type: 'success'
    });
}

export function notifyExpense(amount, description = 'Nuevo gasto') {
    return createNotification({
        title: 'Nuevo gasto',
        message: `${description}: -$${Number(amount).toLocaleString('es-CO')}.`,
        type: 'info'
    });
}

function emit(action, data = null) {
    document.dispatchEvent(new CustomEvent('lukapp:notification', {
        detail: {
            action,
            data,
            unreadCount: getUnreadCount()
        }
    }));
}