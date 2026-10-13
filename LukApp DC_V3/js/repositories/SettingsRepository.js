import { getItem, setItem, STORAGE_KEYS } from '../services/storageService.js';

function getAll() { return getItem(STORAGE_KEYS.SETTINGS) || []; }
function saveAll(data) { return setItem(STORAGE_KEYS.SETTINGS, data); }

export function findByUserId(userId) {
    return getAll().find(item => String(item.userId) === String(userId)) || null;
}

export function save(userId, settingsData) {
    const all = getAll();
    const index = all.findIndex(item => String(item.userId) === String(userId));
    if (index !== -1) {
        all[index] = { ...all[index], ...settingsData };
    } else {
        all.push({ userId, ...settingsData });
    }
    saveAll(all);
}

export function deleteByUserId(userId) {
    saveAll(getAll().filter(item => String(item.userId) !== String(userId)));
}