/* =========================================================
   LukApp · theme.js
   Sistema de temas (Claro, Oscuro, Automático) global.
   Fuente única de verdad: localStorage['lukapp_theme_setting']
   ========================================================= */

const THEMES = { LIGHT: 'light', DARK: 'dark', AUTO: 'auto' };
const STORAGE_KEY = 'lukapp_theme_setting';
const LEGACY_SETTINGS_KEY = 'lukapp_settings_v2';

function isValidTheme(value) {
    return Object.values(THEMES).includes(value);
}

function readLegacyTheme() {
    try {
        const raw = localStorage.getItem(LEGACY_SETTINGS_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            const found = parsed.find(s => isValidTheme(s?.appearance?.theme));
            return found ? found.appearance.theme : null;
        }
    } catch (e) { /* ignorar */ }
    return null;
}

function getSavedThemeSetting() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (isValidTheme(saved)) return saved;

        // Migración única desde la configuración antigua
        const legacy = readLegacyTheme();
        if (legacy) {
            localStorage.setItem(STORAGE_KEY, legacy);
            return legacy;
        }
    } catch (e) { /* localStorage no disponible */ }

    return THEMES.LIGHT;
}

function resolveTheme(setting) {
    if (setting === THEMES.AUTO) {
        const hour = new Date().getHours();
        // Oscuro entre 18:00 y 05:59
        return (hour >= 18 || hour < 6) ? THEMES.DARK : THEMES.LIGHT;
    }
    return setting === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
}

function updateThemeButton(resolvedTheme) {
    const button = document.getElementById('btnTheme');
    if (!button) return;

    const dark = resolvedTheme === THEMES.DARK;
    button.textContent = dark ? '☀' : '◐';
    button.setAttribute('aria-label', dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
}

function render(themeSetting, emit) {
    const setting = isValidTheme(themeSetting) ? themeSetting : THEMES.LIGHT;
    const resolved = resolveTheme(setting);
    const root = document.documentElement;
    const changed = root.dataset.theme !== resolved || root.dataset.themePreference !== setting;

    root.dataset.theme = resolved;
    root.dataset.themePreference = setting;
    root.style.colorScheme = resolved; // scrollbars e inputs nativos acordes al tema

    updateThemeButton(resolved);

    if (emit && changed) {
        document.dispatchEvent(new CustomEvent('lukapp:theme-changed', {
            detail: { preference: setting, resolved }
        }));
    }
}

/* ---------- API pública ---------- */

export function getThemePreference() {
    return document.documentElement.dataset.themePreference || getSavedThemeSetting();
}

export function applyTheme(themeSetting, persist = true) {
    const setting = isValidTheme(themeSetting) ? themeSetting : THEMES.LIGHT;

    if (persist) {
        try { localStorage.setItem(STORAGE_KEY, setting); } catch (e) { /* ignorar */ }
    }
    render(setting, true);
}

export function toggleTheme() {
    const current = document.documentElement.dataset.theme || THEMES.LIGHT;
    applyTheme(current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK, true);
}

export function initializeTheme() {
    render(getSavedThemeSetting(), false);

    const button = document.getElementById('btnTheme');
    if (button && !button.dataset.bound) {
        button.dataset.bound = 'true';
        button.addEventListener('click', toggleTheme);
    }
}

/* ---------- Ejecución ---------- */

// Aplicación inmediata (el script del <head> ya evita el parpadeo)
render(getSavedThemeSetting(), false);

document.addEventListener('DOMContentLoaded', initializeTheme);

// Volver con "atrás" (caché del navegador): reaplicar el tema guardado
window.addEventListener('pageshow', (e) => {
    if (e.persisted) render(getSavedThemeSetting(), true);
});

// Cambio hecho en otra pestaña
window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) render(getSavedThemeSetting(), true);
});

// Modo automático: reevaluar cada minuto por si cambia la hora
setInterval(() => {
    if (document.documentElement.dataset.themePreference === THEMES.AUTO) {
        render(THEMES.AUTO, true);
    }
}, 60000);