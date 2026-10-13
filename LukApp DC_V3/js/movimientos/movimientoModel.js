/* =========================================================
   LukApp · movimientoModel.js
   Manejo de reglas de negocio y transiciones de estado por fecha.
   ========================================================= */
import { getCurrentUser } from '../auth/authModel.js';
import * as MovementRepo from '../repositories/MovementRepository.js';

// --- FUNCIONES HELPER (LÓGICA DE FECHAS) ---

// Obtiene la fecha de HOY en la zona horaria del usuario (Formato YYYY-MM-DD)
function getLocalTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Determina el estado evaluando la fecha de entrada contra el día de hoy
function determineStatus(movementDate) {
    const today = getLocalTodayString();
    // Si la fecha es estrictamente mayor a hoy, es pendiente. De lo contrario, completado.
    return movementDate > today ? 'pendiente' : 'completado';
}

// --- CRUD DE MOVIMIENTOS ---

export function getAllMovements() {
    const user = getCurrentUser();
    if (!user) return [];
    
    let movements = MovementRepo.findAllByUserId(user.id);
    
    // AUDITORÍA AUTOMÁTICA SILENCIOSA:
    // Al abrir la app, si pasó de día, actualizamos los "pendientes" a "completados" 
    // y viceversa si alguien manipuló datos antiguos.
    movements.forEach(m => {
        if (m.status === 'cancelado') return; // Ignorar cancelados
        
        const correctStatus = determineStatus(m.date);
        
        if (m.status !== correctStatus) {
            m.status = correctStatus;
            m.updatedAt = new Date().toISOString();
            MovementRepo.update(user.id, m.id, { status: correctStatus, updatedAt: m.updatedAt });
        }
    });

    // Ordenar del más reciente al más antiguo
    return movements.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getMovementById(id) {
    const user = getCurrentUser();
    return user ? MovementRepo.findById(user.id, id) : null;
}

export function createMovement(data) {
    const user = getCurrentUser();
    if (!user) return null;
    
    const movement = {
        description: data.description,
        type: data.type,
        category: data.category,
        date: data.date,
        amount: Number(data.amount),
        // FASE AUTOMATIZACIÓN: El estado lo decide el modelo, no el formulario
        status: determineStatus(data.date), 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    return MovementRepo.create(user.id, movement);
}

export function editMovement(id, data) {
    const user = getCurrentUser();
    if (!user) return false;
    
    return MovementRepo.update(user.id, id, {
        description: data.description,
        type: data.type,
        category: data.category,
        date: data.date,
        amount: Number(data.amount),
        // FASE AUTOMATIZACIÓN: Si cambian la fecha al futuro/pasado, el estado reacciona
        status: determineStatus(data.date),
        updatedAt: new Date().toISOString()
    });
}

export function removeMovement(id) {
    const user = getCurrentUser();
    return user ? MovementRepo.remove(user.id, id) : false;
}

export function removeMovements(ids) {
    const user = getCurrentUser();
    return user ? MovementRepo.removeMany(user.id, ids) : false;
}

export function getMovementTotals(movements = getAllMovements()) {
    return movements.reduce((total, movement) => {
        // En lógica financiera base, los pendientes y cancelados no suelen sumar al saldo actual.
        // Si quisieras que los pendientes SI sumen a tu saldo actual de dashboard, 
        // simplemente quita la condición `movement.status === 'pendiente'` de esta línea:
        if (movement.status === 'cancelado' || movement.status === 'pendiente') return total;
        
        const amount = Number(movement.amount || 0);
        if (movement.type === 'ingreso') total.income += amount;
        else total.expense += amount;
        
        return total;
    }, { income: 0, expense: 0 });
}