/* =========================================================
   LukApp · estadisticaModel.js
   Aísla datos por usuario, calcula KPIs y prepara datos de gráficos.
   ========================================================= */
import { getAllMovements } from '../movimientos/movimientoModel.js';

// Colores constantes para mantener coherencia entre gráficos
export const CATEGORY_COLORS = {
    'Vivienda': '#FDE047',
    'Alimentación': '#EF4444',
    'Educación': '#3B82F6',
    'Transporte': '#10B981',
    'Salud': '#F59E0B',
    'Entretenimiento': '#EC4899',
    'Servicios': '#A855F7',
    'Otros': '#6B7280'
};

/* ---------- Utilitarios de fecha (siempre en hora local) ---------- */

// 'YYYY-MM-DD' (o ISO con hora) -> Date local a medianoche. Evita el desfase UTC.
function parseLocalDate(value) {
    if (value instanceof Date) {
        return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }
    const [y, m, d] = String(value || '').slice(0, 10).split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}

function pad(n) { return String(n).padStart(2, '0'); }
function toMonthKey(date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`; }
function toDateKey(date) { return `${toMonthKey(date)}-${pad(date.getDate())}`; }
function capitalize(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : str; }

/* ---------- Modelo ---------- */

export function getStatisticsData(periodFilter = '6M') {
    // 1. Movimientos reales del usuario activo (sin cancelados y con fecha válida)
    const allMovements = getAllMovements()
        .filter(m => m.status !== 'cancelado')
        .map(m => ({ ...m, _date: parseLocalDate(m.date) }))
        .filter(m => m._date);

    // 2. Rango de fechas según filtro
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let startDate;
    if (periodFilter === '6M') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    } else if (periodFilter === '1A') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    } else { // TODO
        if (allMovements.length > 0) {
            const oldest = new Date(Math.min(...allMovements.map(m => m._date.getTime())));
            startDate = new Date(oldest.getFullYear(), oldest.getMonth(), 1);
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        }
    }

    const monthsToAnalyze = Math.max(
        1,
        (now.getFullYear() - startDate.getFullYear()) * 12 +
        (now.getMonth() - startDate.getMonth()) + 1
    );
    const showYear = monthsToAnalyze > 12;

    // 3. Movimientos del periodo (hasta el fin del mes actual, igual que el gráfico mensual)
    const scopedMovements = allMovements.filter(
        m => m._date >= startDate && m._date <= endOfMonth
    );

    // 4. KPIs generales
    let totalIncome = 0;
    let totalExpense = 0;

    scopedMovements.forEach(m => {
        if (m.type === 'ingreso') totalIncome += Number(m.amount) || 0;
        else if (m.type === 'gasto') totalExpense += Number(m.amount) || 0;
    });

    const averageIncome = totalIncome / monthsToAnalyze;
    const averageExpense = totalExpense / monthsToAnalyze;
    const savingsRate = totalIncome > 0
        ? ((totalIncome - totalExpense) / totalIncome) * 100
        : 0;

    // 5. Agrupación mensual (gráfico de líneas y mejor mes)
    const monthlyDataMap = new Map();
    for (let i = 0; i < monthsToAnalyze; i++) {
        const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        let label = capitalize(
            d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')
        );
        if (showYear) label += ` ${String(d.getFullYear()).slice(-2)}`;

        const key = toMonthKey(d);
        monthlyDataMap.set(key, { key, label, income: 0, expense: 0 });
    }

    scopedMovements.forEach(m => {
        const bucket = monthlyDataMap.get(toMonthKey(m._date));
        if (!bucket) return;
        if (m.type === 'ingreso') bucket.income += Number(m.amount) || 0;
        else if (m.type === 'gasto') bucket.expense += Number(m.amount) || 0;
    });

    const monthlyArray = Array.from(monthlyDataMap.values());

    // Mejor mes (mayor ingreso)
    let bestMonth = { label: '--', income: 0 };
    monthlyArray.forEach(m => {
        if (m.income > bestMonth.income) {
            bestMonth = { label: m.label, income: m.income };
        }
    });

    // 6. Agrupación por categoría (dona y ranking)
    const categoryMap = new Map();
    scopedMovements
        .filter(m => m.type === 'gasto')
        .forEach(m => {
            const cat = m.category || 'Otros';
            categoryMap.set(cat, (categoryMap.get(cat) || 0) + (Number(m.amount) || 0));
        });

    const breakdown = Array.from(categoryMap.entries())
        .map(([category, total]) => ({
            category,
            total,
            percentage: totalExpense > 0 ? (total / totalExpense) * 100 : 0,
            color: CATEGORY_COLORS[category] || CATEGORY_COLORS['Otros']
        }))
        .sort((a, b) => b.total - a.total);

    // 7. Últimos 7 días (independiente del filtro de meses). Hoy queda al final.
    const last7DaysMap = new Map();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        const dateStr = toDateKey(d);
        last7DaysMap.set(dateStr, {
            dateStr,
            label: capitalize(
                d.toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', '')
            ),
            expense: 0
        });
    }

    allMovements
        .filter(m => m.type === 'gasto')
        .forEach(m => {
            const bucket = last7DaysMap.get(toDateKey(m._date));
            if (bucket) bucket.expense += Number(m.amount) || 0;
        });

    return {
        isEmpty: allMovements.length === 0,
        averageIncome,
        averageExpense,
        savingsRate,
        bestMonth,
        monthlyData: monthlyArray,
        categoryBreakdown: breakdown,
        dailyData: Array.from(last7DaysMap.values())
    };
}