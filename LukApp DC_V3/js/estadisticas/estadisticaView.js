
/* =========================================================
   LukApp · estadisticaView.js
   Renderiza KPIs, gráficos y ranking de categorías.
   Compatible con Chart.js y la estructura visual de LukApp.
   ========================================================= */

// Instancias de Chart.js para controlar su ciclo de vida.
let lineChartInstance = null;
let donutChartInstance = null;
let barChartInstance = null;

/* =========================================================
   RENDERIZADO GENERAL
   ========================================================= */

export function renderAll(data, periodStr) {
    if (!data || typeof data !== 'object') {
        console.error('LukApp: no se recibieron datos válidos para estadísticas.');
        return;
    }

    updateHeader(periodStr);

    renderKPIs(data);
    renderLineChart(data.monthlyData);
    renderDonutChart(data.categoryBreakdown);
    renderBarChart(data.dailyData);
    renderTopCategories(data.categoryBreakdown);
}

/* =========================================================
   ENCABEZADO
   ========================================================= */

function updateHeader(period) {
    const label = document.getElementById('statsPeriodLabel');
    const donutLabel = document.getElementById('donutPeriodLabel');

    let text = '';

    if (period === '6M') {
        text = 'Últimos 6 meses';
    } else if (period === '1A') {
        text = 'Últimos 12 meses';
    } else {
        text = 'Histórico completo';
    }

    if (label) {
        label.textContent = `Análisis financiero · ${text}`;
    }

    if (donutLabel) {
        donutLabel.textContent = `Por categoría · ${text}`;
    }
}

/* =========================================================
   KPI: INDICADORES FINANCIEROS
   ========================================================= */

function renderKPIs(data) {
    const income = toNumber(data.averageIncome);
    const expense = toNumber(data.averageExpense);
    const rate = toNumber(data.savingsRate);

    const best = data.bestMonth || {
        label: '--',
        income: 0
    };

    // Ingresos y gastos promedio.
    setText('kpiIngresoPromedio', currency(income));

    setText(
        'kpiGastoPromedio',
        expense > 0 ? `-${currency(expense)}` : currency(0)
    );

    // Tasa de ahorro y color dinámico.
    const rateEl = document.getElementById('kpiTasaAhorro');

    if (rateEl) {
        rateEl.textContent = `${rate.toFixed(0)}%`;

        if (rate >= 20) {
            rateEl.style.color = 'var(--success-color)';
        } else if (rate > 0) {
            rateEl.style.color = 'var(--warning-color)';
        } else {
            rateEl.style.color = 'var(--danger-color)';
        }
    }

    // Mejor mes del periodo.
    setText(
        'kpiMejorMes',
        best.label || '--'
    );

    setText(
        'kpiMejorMesMonto',
        `${currency(best.income)} ingresados`
    );
}

/* =========================================================
   GRÁFICO DE LÍNEAS: INGRESOS VS. GASTOS
   ========================================================= */

function renderLineChart(monthlyData = []) {
    const ctx = document.getElementById('chartComparativa');

    if (!ctx) return;

    if (lineChartInstance) {
        lineChartInstance.destroy();
        lineChartInstance = null;
    }

    if (!Array.isArray(monthlyData) || monthlyData.length === 0) {
        return;
    }

    const labels = monthlyData.map(item => item.label || '');

    const incomes = monthlyData.map(
        item => toNumber(item.income)
    );

    const expenses = monthlyData.map(
        item => toNumber(item.expense)
    );

    const context = ctx.getContext('2d');

    if (!context) return;

    // Gradiente para ingresos.
    const gradientGreen = context.createLinearGradient(
        0, 0, 0, 250
    );

    gradientGreen.addColorStop(
        0,
        'rgba(31, 163, 106, 0.2)'
    );

    gradientGreen.addColorStop(
        1,
        'rgba(31, 163, 106, 0)'
    );

    // Gradiente para gastos.
    const gradientRed = context.createLinearGradient(
        0, 0, 0, 250
    );

    gradientRed.addColorStop(
        0,
        'rgba(224, 72, 72, 0.2)'
    );

    gradientRed.addColorStop(
        1,
        'rgba(224, 72, 72, 0)'
    );

    lineChartInstance = new Chart(ctx, {
        type: 'line',

        data: {
            labels,

            datasets: [
                {
                    label: 'Ingresos',
                    data: incomes,
                    borderColor: '#1FA36A',
                    backgroundColor: gradientGreen,
                    borderWidth: 2,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#1FA36A',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Gastos',
                    data: expenses,
                    borderColor: '#E04848',
                    backgroundColor: gradientRed,
                    borderWidth: 2,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#E04848',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: 'index'
            },

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.96)',
                    titleColor: '#111111',
                    bodyColor: '#4F4F4F',
                    borderColor: '#E8E8E6',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,

                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${currency(context.raw)}`;
                        }
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true,

                    grid: {
                        color: '#F1F1EF',
                        drawBorder: false
                    },

                    ticks: {
                        color: '#9A9A9A',
                        font: {
                            size: 10
                        },

                        callback: value => formatCompact(value)
                    }
                },

                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },

                    ticks: {
                        color: '#9A9A9A',
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

/* =========================================================
   GRÁFICO DONUT: DISTRIBUCIÓN POR CATEGORÍAS
   ========================================================= */

function renderDonutChart(breakdown = []) {
    const ctx = document.getElementById('chartCategorias');
    const legendContainer = document.getElementById('donutLegend');

    if (!ctx || !legendContainer) return;

    // Destruir el gráfico anterior antes de crear uno nuevo.
    if (donutChartInstance) {
        donutChartInstance.destroy();
        donutChartInstance = null;
    }

    legendContainer.innerHTML = '';

    if (!Array.isArray(breakdown) || breakdown.length === 0) {
        legendContainer.innerHTML = `
            <li class="text-muted"
                style="text-align:center; font-size:12px;">
                No hay gastos en este periodo
            </li>
        `;

        return;
    }

    const labels = breakdown.map(
        item => item.category || 'Sin categoría'
    );

    const values = breakdown.map(
        item => toNumber(item.total)
    );

    const colors = breakdown.map(
        item => item.color || '#E8E8E6'
    );

    donutChartInstance = new Chart(ctx, {
        type: 'doughnut',

        data: {
            labels,

            datasets: [
                {
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#FFFFFF',
                    hoverOffset: 4
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const item = breakdown[context.dataIndex];

                            const percentage = toNumber(
                                item.percentage
                            );

                            return ` ${currency(context.raw)} (${percentage.toFixed(1)}%)`;
                        }
                    }
                }
            }
        }
    });

    // Generar la leyenda HTML.
    breakdown.forEach(item => {
        const li = document.createElement('li');

        li.className = 'legend-item';

        const color = item.color || '#E8E8E6';
        const category = item.category || 'Sin categoría';
        const percentage = toNumber(item.percentage);

        li.innerHTML = `
            <span class="legend-item__label">
                <span
                    class="legend-item__color"
                    style="background-color: ${escapeHTML(color)}">
                </span>

                ${escapeHTML(category)}
            </span>

            <span class="legend-item__value">
                ${percentage.toFixed(1)}%
            </span>
        `;

        legendContainer.appendChild(li);
    });
}

/* =========================================================
   GRÁFICO DE BARRAS: GASTOS DIARIOS
   ========================================================= */

function renderBarChart(dailyData = []) {
    const ctx = document.getElementById('chartGastosDia');

    if (!ctx) return;

    if (barChartInstance) {
        barChartInstance.destroy();
        barChartInstance = null;
    }

    if (!Array.isArray(dailyData) || dailyData.length === 0) {
        return;
    }

    const labels = dailyData.map(
        item => item.label || ''
    );

    const values = dailyData.map(
        item => toNumber(item.expense)
    );

    // Resaltar el último día disponible.
    const backgroundColors = values.map((_, index) => {
        return index === values.length - 1
            ? '#FFD233'
            : '#E8E8E6';
    });

    barChartInstance = new Chart(ctx, {
        type: 'bar',

        data: {
            labels,

            datasets: [
                {
                    label: 'Gastos',
                    data: values,
                    backgroundColor: backgroundColors,
                    borderRadius: 4,
                    barThickness: 20,
                    maxBarThickness: 32
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.96)',
                    titleColor: '#111111',
                    bodyColor: '#4F4F4F',
                    borderColor: '#E8E8E6',
                    borderWidth: 1,
                    displayColors: false,
                    padding: 10,

                    callbacks: {
                        title: context => context[0]?.label || '',

                        label: context => {
                            return `Gastos: ${currency(context.raw)}`;
                        }
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true,

                    grid: {
                        color: '#F1F1EF',
                        drawBorder: false
                    },

                    ticks: {
                        color: '#9A9A9A',

                        font: {
                            size: 10
                        },

                        callback: value => formatCompact(value)
                    }
                },

                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },

                    ticks: {
                        color: '#9A9A9A',

                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

/* =========================================================
   RANKING: TOP 8 CATEGORÍAS DE GASTO
   ========================================================= */

function renderTopCategories(breakdown = []) {
    const list = document.getElementById('categoryBreakdownList');

    if (!list) return;

    list.innerHTML = '';

    if (!Array.isArray(breakdown) || breakdown.length === 0) {
        list.innerHTML = `
            <li class="empty-state"
                style="min-height: 100px;">
                No hay gastos para mostrar ranking.
            </li>
        `;

        return;
    }

    // Ordenar por gasto de mayor a menor sin modificar el array original.
    const top = [...breakdown]
        .sort((a, b) => {
            return toNumber(b.total) - toNumber(a.total);
        })
        .slice(0, 8);

    // Evitar divisiones por cero.
    const maxVal = Math.max(
        ...top.map(item => toNumber(item.total)),
        1
    );

    top.forEach((item, index) => {
        const total = toNumber(item.total);
        const percentage = toNumber(item.percentage);

        const width = Math.min(
            100,
            Math.max((total / maxVal) * 100, 2)
        );

        const category = item.category || 'Sin categoría';
        const color = item.color || 'var(--primary-color)';

        const li = document.createElement('li');

        li.className = 'breakdown-item';

        li.style.setProperty(
            '--category-color',
            color
        );

        li.innerHTML = `
            <span class="breakdown-item__rank">
                ${index + 1}
            </span>

            <span class="breakdown-item__name">
                <span class="breakdown-item__dot"></span>
                ${escapeHTML(category)}
            </span>

            <span class="breakdown-item__bar progress-track">
                <span
                    class="progress-fill"
                    style="width: ${width.toFixed(1)}%;
                           background: var(--category-color)">
                </span>
            </span>

            <span class="breakdown-item__percent">
                ${percentage.toFixed(1)}%
            </span>

            <span class="breakdown-item__amount negative">
                -${currency(total)}
            </span>
        `;

        list.appendChild(li);
    });
}

/* =========================================================
   UTILITARIOS
   ========================================================= */

// Convertir valores a números seguros.
function toNumber(value) {
    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
}

// Formatear cantidades en pesos colombianos.
function currency(value) {
    return toNumber(value).toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    });
}

// Formatear valores compactos para los ejes de los gráficos.
function formatCompact(value) {
    const number = toNumber(value);

    if (number === 0) return '$0';

    return '$' + new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(number);
}

// Actualizar el texto de un elemento si existe.
function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value ?? '';
    }
}

// Escapar texto dinámico antes de insertarlo en HTML.
function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    })[character]);
}