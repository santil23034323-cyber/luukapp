import '../core/app.js';
/* =========================================================
    LukApp · movimientoController.js
    ========================================================= */

import { getAllMovements, createMovement, editMovement, removeMovement, removeMovements, getMovementById, getMovementTotals } from './movimientoModel.js';
import { renderSummary, renderTable, renderPagination, openMovementModal, closeMovementModal, getMovementFormData } from './movimientoView.js';
import { exportMovementsToCSV, printTableAsPDF } from '../services/exportService.js';
import { notifyIncome, notifyExpense } from '../services/notificationService.js';

const PAGE_SIZE = 8;

const state = { all: [], filtered: [], page: 1, filter: 'todos', query: '' };

document.addEventListener('DOMContentLoaded', initializeMovements);

// Sincronización global sin recargar
document.addEventListener('lukapp:data-updated', () => {
    load();
    render();
});

function initializeMovements() {
    load();

    document.getElementById('btnNuevoMovimiento')?.addEventListener('click', () => showForm());
    document.getElementById('btnExportCSV')?.addEventListener('click', exportCSV);
    document.getElementById('btnExportPDF')?.addEventListener('click', exportPDF);
    document.getElementById('tableSearchInput')?.addEventListener('input', event => { state.query = event.target.value.toLowerCase().trim(); state.page = 1; render(); });

    document.querySelectorAll('.filter-tabs .tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.filter-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            state.filter = button.dataset.filter;
            state.page = 1;
            render();
        });
    });

    document.getElementById('selectAllCheckbox')?.addEventListener('change', event => {
        document.querySelectorAll('.row-checkbox').forEach(box => { box.checked = event.target.checked; });
        updateSelection();
    });

    document.getElementById('movimientosTableBody')?.addEventListener('change', event => {
        if (event.target.classList.contains('row-checkbox')) updateSelection();
    });

    document.getElementById('movimientosTableBody')?.addEventListener('click', event => {
        const btnEdit = event.target.closest('[data-action="edit"]');
        const btnDel = event.target.closest('[data-action="delete"]');

        if (btnEdit) {
            const movement = getMovementById(btnEdit.dataset.id);
            if (movement) showForm(movement);
        }
        if (btnDel) {
            if (confirm('¿Eliminar este movimiento?')) {
                removeMovement(btnDel.dataset.id);
                emitDataUpdated(); // el listener global recarga y renderiza
            }
        }
    });

    document.getElementById('paginationControls')?.addEventListener('click', event => {
        const pageButton = event.target.closest('[data-page]');
        if (!pageButton) return;
        state.page = Number(pageButton.dataset.page);
        render();
    });

    document.getElementById('btnDeleteSelected')?.addEventListener('click', deleteSelected);

    document.addEventListener('lukapp:search', event => {
        const input = document.getElementById('tableSearchInput');
        if (input) input.value = event.detail.query;
        state.query = event.detail.query.toLowerCase();
        render();
    });

    const params = new URLSearchParams(location.search);
    const initialSearch = params.get('search');
    if (initialSearch) {
        const input = document.getElementById('tableSearchInput');
        if (input) input.value = initialSearch;
        state.query = initialSearch.toLowerCase();
    }

    // Fuerza el renderizado siempre, haya búsqueda o no.
    render();

    // Redirección desde el Dashboard: abre el modal y limpia la URL
    if (params.get('action') === 'new') {
        showForm();
        window.history.replaceState(null, '', 'movimientos.html');
    }
}

function load() {
    state.all = getAllMovements();
    applyFilters();
}

function applyFilters() {
    state.filtered = state.all.filter(item => {
        const typeOk = state.filter === 'todos' || item.type === state.filter;
        const text = `${item.description} ${item.category} ${item.date}`.toLowerCase();
        const queryOk = !state.query || text.includes(state.query);
        return typeOk && queryOk;
    });
}

function render() {
    applyFilters();
    const totals = getMovementTotals(state.filtered);
    const totalPages = Math.max(1, Math.ceil(state.filtered.length / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;

    const startIndex = (state.page - 1) * PAGE_SIZE;
    const pageItems = state.filtered.slice(startIndex, startIndex + PAGE_SIZE);
    const start = state.filtered.length ? startIndex + 1 : 0;
    const end = Math.min(startIndex + PAGE_SIZE, state.filtered.length);

    renderSummary(totals, state.filtered.length);
    renderTable(pageItems);
    renderPagination(state.page, totalPages, state.filtered.length, start, end);
    updateSelection();
}

function showForm(movement = null) {
    const form = openMovementModal(movement);
    if (!form) return;

    // Sin { once: true }: si la validación falla, el formulario sigue funcionando
    form.addEventListener('submit', event => {
        event.preventDefault();
        const data = getMovementFormData(form);

        if (Number(data.amount) <= 0) {
            alert('El monto debe ser mayor a 0.');
            return;
        }
        if (!data.description || !data.category || !data.date) {
            alert('Completa correctamente los datos del movimiento.');
            return;
        }

        if (movement) {
            editMovement(movement.id, data);
        } else {
            const created = createMovement(data);
            if (created) {
                if (created.type === 'ingreso') notifyIncome(created.amount, created.description);
                else notifyExpense(created.amount, created.description);
            }
        }

        closeMovementModal();
        emitDataUpdated(); // el listener global recarga y renderiza
    });
}

function emitDataUpdated() {
    document.dispatchEvent(new CustomEvent('lukapp:data-updated'));
}

function updateSelection() {
    const selected = document.querySelectorAll('.row-checkbox:checked');
    const group = document.getElementById('batchActionGroup');
    const count = document.getElementById('selectedCountText');

    if (group) group.classList.toggle('hidden', selected.length === 0);
    if (count) count.textContent = `${selected.length} seleccionado${selected.length === 1 ? '' : 's'}`;
}

function deleteSelected() {
    const ids = [...document.querySelectorAll('.row-checkbox:checked')].map(box => box.dataset.id);
    if (!ids.length) return;
    if (!confirm(`¿Eliminar ${ids.length} movimiento${ids.length === 1 ? '' : 's'}?`)) return;

    removeMovements(ids);
    const selectAll = document.getElementById('selectAllCheckbox');
    if (selectAll) selectAll.checked = false;
    emitDataUpdated();
}

function exportCSV() {
    try {
        exportMovementsToCSV(state.filtered, `lukapp-movimientos-${Date.now()}.csv`);
    } catch (error) {
        alert(error.message);
    }
}

function exportPDF() {
    try {
        printTableAsPDF({
            title: 'Movimientos financieros · LukApp',
            subtitle: `${state.filtered.length} registros encontrados`,
            filename: 'lukapp-movimientos'
        });
    } catch (error) {
        alert(error.message);
    }
}