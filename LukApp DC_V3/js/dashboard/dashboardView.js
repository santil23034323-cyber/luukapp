/* =========================================================
   LukApp · dashboardView.js
   ========================================================= */

export function renderDashboard(data) {
    renderGreeting(data.user);
    renderKpis(data);
    renderTransactions(data.recent);
    renderGoals(data.goals);
    renderExpenseMiniChart(data.expensesByMonth);
    renderTrendSummary(data.expenses);
}

export function renderGreeting(user) {
    const month = document.getElementById('currentMonth');
    const greeting = document.getElementById('dashboardGreeting');

    const now = new Date();
    if (month) {
        month.textContent = now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    }

    if (greeting) greeting.textContent = `Hola, ${user?.name || 'Usuario'} 👋`;
}

export function renderKpis(data) {
    setText('kpiSaldoTotal', currency(data.balance));
    setText('kpiIngresos', currency(data.incomes));
    setText('kpiGastos', currency(data.expenses));
    setText('kpiAhorros', currency(data.savings));

    const savingsRate = data.incomes ? (data.savings / data.incomes) * 100 : 0;
    setText('kpiSaldoTrend', `${savingsRate >= 0 ? '↑' : '↓'} ${Math.abs(savingsRate).toFixed(1)}% ahorro`);
    setText('kpiIngresosTrend', 'Periodo actual');
    setText('kpiGastosTrend', 'Periodo actual');
    setText('kpiAhorrosTrend', 'Ingresos - gastos');
}

export function renderTransactions(movements) {
    const list = document.getElementById('recentTransactionsList');
    if (!list) return;

    list.innerHTML = '';

    if (!movements.length) {
        list.innerHTML = '<li class="empty-state">No hay movimientos registrados.</li>';
        return;
    }

    movements.forEach(item => {
        const li = document.createElement('li');
        li.className = 'transaction-item';

        const iconClass = item.type === 'ingreso' ? 'icon-income' : 'icon-expense';
        const sign = item.type === 'ingreso' ? '+' : '-';

        li.innerHTML = `
            <div class="tx-icon ${iconClass}">${item.type === 'ingreso' ? '↗' : '↘'}</div>
            <div class="tx-details">
                <span class="tx-title">${escapeHTML(item.description)}</span>
                <span class="tx-category">${escapeHTML(item.category)} · ${formatDate(item.date)}</span>
            </div>
            <span class="tx-amount ${item.type === 'ingreso' ? 'positive' : 'negative'}">${sign}${currency(item.amount)}</span>
        `;

        list.appendChild(li);
    });
}

export function renderGoals(goals) {
    const list = document.getElementById('activeGoalsList');
    if (!list) return;

    list.innerHTML = '';

    const active = goals.filter(goal => Number(goal.saved) < Number(goal.target)).slice(0, 3);

    if (!active.length) {
        list.innerHTML = '<li class="empty-state">No hay metas activas.</li>';
        return;
    }

    active.forEach(goal => {
        const percentage = Math.min(100, Math.round((goal.saved / goal.target) * 100));
        const li = document.createElement('li');
        li.className = 'goal-mini-item';
        li.innerHTML = `
            <div class="goal-info">
                <span class="goal-title">${escapeHTML(goal.icon || '◎')} ${escapeHTML(goal.name)}</span>
                <span class="goal-percentage">${percentage}%</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width:${percentage}%;background:${goal.color || 'var(--primary-color)'}"></div>
            </div>
        `;
        list.appendChild(li);
    });
}

export function renderTrendSummary(expenses) {
    setText('trendExpensesTotal', currency(expenses));
    setText('trendExpensesComparison', 'Total de gastos registrados');
}

function renderExpenseMiniChart(data) {
    const canvas = document.getElementById('dashboardExpenseChart');
    const placeholder = document.getElementById('miniChartPlaceholder');
    if (!canvas) return;

    if (placeholder) placeholder.style.display = 'none';

    const ctx = canvas.getContext('2d');
    const width = canvas.width = Math.max(canvas.clientWidth, 500);
    const height = canvas.height = 210;
    ctx.clearRect(0, 0, width, height);

    const max = Math.max(...data.map(item => item.value), 1);
    const padX = 22;
    const padY = 25;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2 - 20;
    const step = data.length > 1 ? usableW / (data.length - 1) : usableW;

    ctx.strokeStyle = '#E8E8E6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, height - padY - 20);
    ctx.lineTo(width - padX, height - padY - 20);
    ctx.stroke();

    ctx.strokeStyle = '#FFD233';
    ctx.lineWidth = 3;
    ctx.beginPath();

    data.forEach((item, index) => {
        const x = padX + step * index;
        const y = height - padY - 20 - (item.value / max) * usableH;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.stroke();

    data.forEach((item, index) => {
        const x = padX + step * index;
        const y = height - padY - 20 - (item.value / max) * usableH;

        ctx.fillStyle = '#FFD233';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#777';
        ctx.font = '11px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.label, x, height - 8);
    });
}

function currency(value) {
    return Number(value || 0).toLocaleString('es-CO', {
        style: 'currency', currency: 'COP', maximumFractionDigits: 0
    });
}

function formatDate(value) {
    return new Date(value + 'T00:00:00').toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short'
    });
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function escapeHTML(value) {
    return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}