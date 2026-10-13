/* =========================================================
   LukApp · cryptoService.js
   Hash local para modo demo con soporte para entornos sin HTTPS.
   ========================================================= */

export async function hashString(value) {
    if (window.crypto && crypto.subtle) {
        try {
            const data = new TextEncoder().encode(value);
            const buffer = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(buffer))
                .map(byte => byte.toString(16).padStart(2, '0'))
                .join('');
        } catch (error) {
            return fallbackHash(value);
        }
    } else {
        // Fallback robusto para evitar bloqueo de login si se abre desde file:// o HTTP
        return fallbackHash(value);
    }
}

function fallbackHash(value) {
    let hash = 5381;
    for (let i = 0; i < value.length; i++) {
        hash = (hash * 33) ^ value.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
}