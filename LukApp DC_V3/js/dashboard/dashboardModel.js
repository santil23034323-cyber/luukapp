/* =========================================================
   LukApp · dashboardModel.js
   El modelo consolida los datos de distintos repositorios,
   pero ahora todo está aislado por usuario desde el origen.
   ========================================================= */
import { getAllMovements } from '../movimientos/movimientoModel.js';
import { getAllGoals } from '../metas/metaModel.js';
import { getCurrentUser } from '../auth/authModel.js';
import { MOVEMENT_TYPES } from '../core/constants.js';

export function getDashboardData() {
    // Al usar getAllMovements() del modelo de Movimientos, este internamente 
    // ya filtra por el usuario conectado.
    const allMovements = getAllMovements();
    const goals = getAllGoals();
    const user = getCurrentUser();

    // Ignoramos transacciones canceladas en los cálculos matemáticos
    const validMovements = allMovements.filter(item => item.status !== 'cancelado');

    const incomes = validMovements
        .filter(item => item.type === MOVEMENT_TYPES.INCOME)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const expenses = validMovements
        .filter(item => item.type === MOVEMENT_TYPES.EXPENSE)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const savings = incomes - expenses;
    const balance = savings;

    const recent = [...allMovements]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    const expensesByMonth = buildMonthlyExpenses(validMovements);

    return {
        user,
        movements: allMovements,
        goals,
        incomes,
        expenses,
        savings,
        balance,
        recent,
        expensesByMonth
    };
}

function buildMonthlyExpenses(movements) {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
            label: date.toLocaleDateString('es-CO', { month: 'short' }),
            value: 0
        });
    }

    movements
        .filter(item => item.type === MOVEMENT_TYPES.EXPENSE)
        .forEach(item => {
            const date = new Date(item.date + 'T00:00:00');
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const month = months.find(item => item.key === key);
            if (month) month.value += Number(item.amount || 0);
        });

    return months;
}