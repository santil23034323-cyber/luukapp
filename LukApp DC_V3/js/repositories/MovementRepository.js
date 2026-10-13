import { getItem, setItem, STORAGE_KEYS } from '../services/storageService.js';

function getAll() { return getItem(STORAGE_KEYS.MOVEMENTS) || []; }
function saveAll(data) { return setItem(STORAGE_KEYS.MOVEMENTS, data); }

export function findAllByUserId(userId) {
    return getAll().filter(item => String(item.userId) === String(userId));
}

export function findById(userId, id) {
    return findAllByUserId(userId).find(item => String(item.id) === String(id)) || null;
}

export function create(userId, data) {
    const all = getAll();
    const newItem = { id: crypto.randomUUID?.() || `m-${Date.now()}`, userId, ...data };
    all.push(newItem);
    saveAll(all);
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

export function remove(userId, id) {
    const all = getAll();
    const filtered = all.filter(item => !(String(item.userId) === String(userId) && String(item.id) === String(id)));
    if (all.length === filtered.length) return false;
    saveAll(filtered);
    return true;
}

export function removeMany(userId, ids) {
    const idSet = new Set(ids.map(id => String(id)));
    saveAll(getAll().filter(item => !(String(item.userId) === String(userId) && idSet.has(String(item.id)))));
    return true;
}

export function deleteAllByUserId(userId) {
    saveAll(getAll().filter(item => String(item.userId) !== String(userId)));
}

// Agrega esta línea al final de cada archivo Repository
export function findAll() { return getAll(); }