/* =========================================================
   LukApp · demoData.js
   Datos semilla para desarrollo (Apagado por defecto).
   ========================================================= */
const DEMO_MODE = false;

export function ensureDemoData() {
    if (!DEMO_MODE) return;
    
    // Esta función queda inhabilitada en producción gracias a DEMO_MODE = false.
    // Garantiza que los usuarios nuevos empiecen con sus paneles completamente limpios.
    console.info('LukApp: Demo Mode desactivado. El usuario iniciará desde cero.');
}