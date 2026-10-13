/* =========================================================
   LukApp · NotificationRepository.js
   Aísla las notificaciones por usuario.
   ========================================================= */
import { getItem, setItem, STORAGE_KEYS } from '../services/storageService.js';

function getAll() { return getItem(STORAGE_KEYS.NOTIFICATIONS) || []; }
function saveAll(data) { return setItem(STORAGE_KEYS.NOTIFICATIONS, data); }

export function findAllByUserId(userId) {
    return getAll().filter(item => String(item.userId) === String(userId));
}

export function create(userId, data) {
    const all = getAll();
    const newItem = { id: crypto.randomUUID?.() || `n-${Date.now()}`, userId, ...data };
    // Mantiene un límite de 50 notificaciones globales (para no saturar el storage)
    const updated = [newItem, ...all].slice(0, 500); 
    saveAll(updated);
    return newItem;
}

export function update(userId, id, changes) {
    const all = getAll();
    const index = all.findIndex(item => String(item.userId) === String(userId) && String(item.id) === String(id));
    if (index === -1) return false;
    all[index] = { ...all[index], ...changes };
    saveAll(all);
    return true;
}

export function markAllAsReadByUserId(userId) {
    const all = getAll();
    let changed = false;
    all.forEach(item => {
        if (String(item.userId) === String(userId) && !item.read) {
            item.read = true;
            changed = true; 
        }
    });
    if (changed) saveAll(all);
    return changed;
}

export function remove(userId, id) {
    const all = getAll();
    const filtered = all.filter(item => !(String(item.userId) === String(userId) && String(item.id) === String(id)));
    if (all.length === filtered.length) return false;
    saveAll(filtered);
    return true;
}

export function deleteAllByUserId(userId) {
    saveAll(getAll().filter(item => String(item.userId) !== String(userId)));
}

// Agrega esta línea al final de cada archivo Repository
export function findAll() { return getAll(); }