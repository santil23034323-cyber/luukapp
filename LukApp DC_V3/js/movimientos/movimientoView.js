/* =========================================================
    LukApp · movimientoView.js
    ========================================================= */

export function renderSummary(totals, count) {
    setText('kpiIngresos', `+${currency(totals.income)}`);
    setText('kpiGastos', `-${currency(totals.expense)}`);
    setText('kpiBalance', currency(totals.income - totals.expense));
    setText('recordsCount', `${count} ${count === 1 ? 'registro encontrado' : 'registros encontrados'}`);
}

export function renderTable(movements) {
    const body = document.getElementById('movimientosTableBody');
    if (!body) return;

    if (!movements.length) {
        body.innerHTML = `<tr><td colspan="7" class="empty-state">No se encontraron movimientos.</td></tr>`;
        return;
    }

    let html = '';
    movements.forEach(item => {
        const sign = item.type === 'ingreso' ? '+' : '-';
        const iconType = item.type === 'ingreso' ? 'icon-income' : 'icon-expense';
        const iconChar = item.type === 'ingreso' ? '↗' : '↘';

        html += `
        <tr>
            <td class="th-checkbox"><input type="checkbox" class="row-checkbox" data-id="${escapeAttr(item.id)}"></td>
            <td>
                <div class="cell-description">
                    <span class="tx-icon ${iconType}">${iconChar}</span>
                    <span class="cell-description__text">${escapeHTML(item.description)}</span>
                </div>
            </td>
            <td><span class="badge-category">${escapeHTML(item.category)}</span></td>
            <td class="cell-date">${formatDate(item.date)}</td>
            <td class="amount-cell ${item.type === 'ingreso' ? 'positive' : 'negative'}">${sign}${currency(item.amount)}</td>
            <td><span class="status-pill ${statusClass(item.status)}">${escapeHTML(item.status)}</span></td>
            <td class="text-right">
                <div style="display:flex; justify-content:flex-end; gap:4px;">
                    <button type="button" class="btn-icon-sm" data-action="edit" data-id="${escapeAttr(item.id)}" aria-label="Editar" title="Editar">✏️</button>
                    <button type="button" class="btn-icon-sm" data-action="delete" data-id="${escapeAttr(item.id)}" aria-label="Eliminar" title="Eliminar">🗑️</button>
                </div>
            </td>
        </tr>
        `;
    });
    body.innerHTML = html;
}

export function renderPagination(currentPage, totalPages, total, start, end) {
    const info = document.getElementById('paginationInfo');
    const controls = document.getElementById('paginationControls');

    if (info) info.textContent = total ? `Mostrando ${start}-${end} de ${total}` : 'Mostrando 0 de 0';
    if (!controls) return;

    controls.innerHTML = '';
    for (let page = 1; page <= totalPages; page++) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `page-btn ${page === currentPage ? 'active' : ''}`;
        button.dataset.page = String(page);
        button.textContent = String(page);
        controls.appendChild(button);
    }
}

/* ---------- MODAL tipo Figma (colores dinámicos Ingreso / Gasto) ---------- */
export function openMovementModal(movement = null) {
    closeMovementModal();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'movementModal';

    const type = movement?.type || 'gasto';

    modal.innerHTML = `
      <div class="modal" data-type="${escapeAttr(type)}" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <div class="modal__header">
          <h2 class="modal__title" id="modalTitle">${movement ? 'Editar movimiento' : 'Agregar movimiento'}</h2>
          <button type="button" class="modal__close" id="closeModalBtn" aria-label="Cerrar">×</button>
        </div>

        <div class="modal__body">
          <div class="modal__tabs">
            <button type="button" class="modal__tab ${type === 'ingreso' ? 'active' : ''}" data-target-type="ingreso" aria-selected="${type === 'ingreso'}">↑ Ingreso</button>
            <button type="button" class="modal__tab ${type === 'gasto' ? 'active' : ''}" data-target-type="gasto" aria-selected="${type === 'gasto'}">↓ Gasto</button>
          </div>

          <form id="movementForm">
            <input type="hidden" name="type" id="inputType" value="${escapeAttr(type)}">

            <div class="input-group">
              <label>MONTO</label>
              <div class="modal__amount">
                <span>$</span>
                <input type="number" name="amount" required min="0.01" step="0.01" placeholder="0.00" value="${escapeAttr(movement?.amount || '')}">
              </div>
            </div>

            <div class="modal__row">
              <div class="input-group">
                <label>CATEGORÍA</label>
                <select name="category" id="inputCategory" required>
                  ${categoryOptions(movement?.category, type)}
                </select>
              </div>
              <div class="input-group">
                <label>FECHA</label>
                <input type="date" name="date" required value="${escapeAttr(movement?.date || today())}">
              </div>
            </div>

            <div class="input-group">
              <label>DESCRIPCIÓN</label>
              <input type="text" name="description" required maxlength="80" placeholder="Ej. Supermercado La Colonia..." value="${escapeAttr(movement?.description || '')}">
            </div>

            <!-- El estado se conserva (oculto) para no perderlo al editar -->
            <div class="input-group" style="display:none;">
              <select name="status"><option value="${escapeAttr(movement?.status || 'completado')}"></option></select>
            </div>

            <div class="modal__actions">
              <button type="button" class="btn-secondary" id="cancelModalBtn">Cancelar</button>
              <button type="submit" class="btn-primary modal__submit" id="submitModalBtn">${movement ? 'Guardar cambios' : (type === 'ingreso' ? 'Registrar ingreso' : 'Registrar gasto')}</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // UI dinámica: cambia colores y categorías al cambiar de pestaña
    const tabs = modal.querySelectorAll('.modal__tab');
    const modalContainer = modal.querySelector('.modal');
    const inputType = modal.querySelector('#inputType');
    const inputCategory = modal.querySelector('#inputCategory');
    const submitBtn = modal.querySelector('#submitModalBtn');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            const newType = tab.dataset.targetType;
            modalContainer.dataset.type = newType;
            inputType.value = newType;
            inputCategory.innerHTML = categoryOptions('', newType);

            if (!movement) {
                submitBtn.textContent = newType === 'ingreso' ? 'Registrar ingreso' : 'Registrar gasto';
            }
        });
    });

    modal.querySelector('#closeModalBtn').addEventListener('click', closeMovementModal);
    modal.querySelector('#cancelModalBtn').addEventListener('click', closeMovementModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeMovementModal(); });

    return modal.querySelector('#movementForm');
}

export function closeMovementModal() {
    document.getElementById('movementModal')?.remove();
}

export function getMovementFormData(form) {
    return Object.fromEntries(new FormData(form).entries());
}

function categoryOptions(selected = '', type = 'gasto') {
    const categories = type === 'ingreso'
        ? ['Salario', 'Freelance', 'Ventas', 'Inversiones', 'Otros ingresos']
        : ['Alimentación', 'Vivienda', 'Transporte', 'Servicios', 'Educación', 'Entretenimiento', 'Salud', 'Otros gastos'];

    // Si el movimiento viejo tiene una categoría que ya no está en la lista, se conserva
    if (selected && !categories.includes(selected)) categories.unshift(selected);

    return categories.map(category => `<option value="${escapeAttr(category)}" ${category === selected ? 'selected' : ''}>${escapeHTML(category)}</option>`).join('');
}

function statusClass(status) {
    if (status === 'completado') return 'status-completed';
    if (status === 'pendiente') return 'status-pending';
    return 'status-cancelled';
}

function currency(value) {
    return Number(value || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

function formatDate(value) {
    return new Date(value + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function escapeHTML(value) {
    return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function escapeAttr(value) {
    return escapeHTML(value);
}