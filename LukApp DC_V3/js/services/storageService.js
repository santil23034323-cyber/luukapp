/* =========================================================
   LukApp · storageService.js
   Optimizada con In-Memory Cache para prevenir bloqueos de I/O
   ========================================================= */

export const STORAGE_KEYS = {
    SESSION: 'lukapp_session',
    USERS: 'lukapp_users',
    MOVEMENTS: 'lukapp_movements_v2',
    GOALS: 'lukapp_goals_v2',
    SETTINGS: 'lukapp_settings_v2',
    NOTIFICATIONS: 'lukapp_notifications_v2'
};

// CACHÉ EN MEMORIA: Evita latencia de lectura del disco (localStorage)
const memoryCache = new Map();

function getStorage(useSession = false) {
    return useSession ? window.sessionStorage : window.localStorage;
}

export function getItem(key, useSession = false) {
    const cacheKey = `${useSession ? 'session_' : 'local_'}${key}`;
    
    // 1. Retorno instantáneo si está en memoria (0ms)
    if (memoryCache.has(cacheKey)) {
        return memoryCache.get(cacheKey);
    }

    // 2. Si no está en memoria, lee el disco y lo guarda en caché
    try {
        const raw = getStorage(useSession).getItem(key);
        const parsedData = raw ? JSON.parse(raw) : null;
        memoryCache.set(cacheKey, parsedData);
        return parsedData;
    } catch (error) {
        console.error(`LukApp · Error leyendo "${key}"`, error);
        return null;
    }
}

export function setItem(key, value, useSession = false) {
    const cacheKey = `${useSession ? 'session_' : 'local_'}${key}`;
    try {
        getStorage(useSession).setItem(key, JSON.stringify(value));
        // Mantiene la memoria sincronizada con el disco
        memoryCache.set(cacheKey, value); 
        return true;
    } catch (error) {
        console.error(`LukApp · Error guardando "${key}"`, error);
        return false;
    }
}

export function removeItem(key, useSession = false) {
    const cacheKey = `${useSession ? 'session_' : 'local_'}${key}`;
    try {
        getStorage(useSession).removeItem(key);
        memoryCache.delete(cacheKey); // Limpiar caché
        return true;
    } catch (error) {
        return false;
    }
}

// 11/10/2026

export function getSession() {
    return getItem(STORAGE_KEYS.SESSION) || getItem(STORAGE_KEYS.SESSION, true);
}

export function setSession(session, remember = true) {
    removeItem(STORAGE_KEYS.SESSION);
    removeItem(STORAGE_KEYS.SESSION, true);
    return setItem(STORAGE_KEYS.SESSION, session, !remember);
}

export function clearSession() {
    removeItem(STORAGE_KEYS.SESSION);
    removeItem(STORAGE_KEYS.SESSION, true);
}

/**
 * Garantiza que la cuenta de Administrador Maestro siempre exista en el storage.
 */
function ensureAdminUser() {
    let users = getItem(STORAGE_KEYS.USERS) || [];
    let adminUser = users.find(u => u.email === 'administrador@lukapp.com');
    
    if (!adminUser) {
        users.push({
            id: 'admin-root',
            name: 'Administrador del Sistema',
            email: 'administrador@lukapp.com',
            // Hash SHA-256 de "123456"
            passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 
            role: 'admin',
            plan: 'Admin',
            fechaRegistro: new Date().toISOString()
        });
        setItem(STORAGE_KEYS.USERS, users);
    }
}

// =========================================================
// MIGRACIÓN AUTOMÁTICA DE DATOS ANTIGUOS A LA ARQUITECTURA MULTIUSUARIO
// =========================================================
(function runMigrations() {
    // Asegurar siempre el admin maestro al cargar el servicio
    ensureAdminUser();

    if (getItem('lukapp_migrated_v2')) return;

    const oldUser = getItem('lukapp_user');
    const oldMovements = getItem('lukapp_movements');
    const oldGoals = getItem('lukapp_goals');
    const oldSettings = getItem('lukapp_settings');

    // Si detectamos datos antiguos, los asociamos a un usuario "legacy"
    if (oldUser || oldMovements || oldGoals || oldSettings) {
        console.info('LukApp: Ejecutando migración de datos a esquema Multiusuario...');
        
        let users = getItem(STORAGE_KEYS.USERS) || [];
        let legacyUser = users.find(u => u.email === 'usuario@lukapp.com');

        if (!legacyUser) {
            legacyUser = {
                id: 'legacy-user-1',
                name: oldUser?.name || 'Daniel',
                lastName: oldUser?.lastName || 'Gutiérrez',
                email: 'usuario@lukapp.com',
                passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', // hash(123456)
                plan: 'Premium',
                fechaRegistro: new Date().toISOString()
            };
            users.push(legacyUser);
            setItem(STORAGE_KEYS.USERS, users);
        }

        if (Array.isArray(oldMovements)) {
            setItem(STORAGE_KEYS.MOVEMENTS, oldMovements.map(m => ({ ...m, userId: legacyUser.id })));
        }
        
        if (Array.isArray(oldGoals)) {
            setItem(STORAGE_KEYS.GOALS, oldGoals.map(g => ({ ...g, userId: legacyUser.id })));
        }
        
        if (oldSettings && !Array.isArray(oldSettings)) {
            setItem(STORAGE_KEYS.SETTINGS, [{ userId: legacyUser.id, ...oldSettings }]);
        }

        // Limpiar el rastro de la versión 1
        localStorage.removeItem('lukapp_movements');
        localStorage.removeItem('lukapp_goals');
        localStorage.removeItem('lukapp_settings');
        localStorage.removeItem('lukapp_user');

        setItem('lukapp_migrated_v2', true);
    }
})();