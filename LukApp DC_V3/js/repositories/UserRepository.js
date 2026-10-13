import { getItem, setItem, STORAGE_KEYS } from '../services/storageService.js';

function getAll() { return getItem(STORAGE_KEYS.USERS) || []; }
function saveAll(data) { return setItem(STORAGE_KEYS.USERS, data); }

export function findUserByEmail(email) {
    return getAll().find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function findUserById(id) {
    return getAll().find(u => String(u.id) === String(id)) || null;
}

export function createUser(userData) {
    const all = getAll();
    const newUser = {
        id: crypto.randomUUID?.() || `u-${Date.now()}`,
        name: userData.name, // Nombre completo
        email: userData.email,
        phone: userData.phone || '',
        occupation: userData.occupation || '',
        avatar: userData.avatar || null,
        passwordHash: userData.passwordHash,
        plan: userData.plan || 'Usuario',
        fechaRegistro: new Date().toISOString()
    };
    all.push(newUser);
    saveAll(all);
    return newUser;
}

export function updateUser(id, changes) {
    const all = getAll();
    const index = all.findIndex(u => String(u.id) === String(id));
    if (index === -1) return null;
    all[index] = { ...all[index], ...changes };
    saveAll(all);
    return all[index];
}

export function deleteUser(id) {
    const all = getAll();
    saveAll(all.filter(u => String(u.id) !== String(id)));
}

// Agrega esta línea al final de cada archivo Repository
export function findAll() { return getAll(); }