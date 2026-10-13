/* =========================================================
    LukApp · metaView.js
    ========================================================= */

export function renderSummary(summary, count) {
    setText('kpiAhorradoTotal', currency(summary.saved));
    setText('kpiObjetivoTotal', currency(summary.target));
    setText('kpiProgresoGlobal', `${summary.progress.toFixed(1)}%`);
    setText('metasSummaryText', `${count} ${count === 1 ? 'meta registrada' : 'metas registradas'}`);
}

export function renderGoals(goals) {
    const container = document.getElementById('metasGridContainer');
    if (!container) return;

    if (!goals.length) {
        container.innerHTML = '<div class="empty-state">Aún no tienes metas. Crea la primera desde “Nueva meta”.</div>';
        return;
    }

    let html = '';
    goals.forEach(goal => {
        // El texto puede pasar de 100%; la barra se limita a 100% para no desbordarse
        const percentageRaw = (Number(goal.saved) / Number(goal.target || 1)) * 100;
        const percentageText = percentageRaw.toFixed(0);
        const percentageWidth = Math.min(100, percentageRaw);
        const isCompleted = percentageRaw >= 100;
        const remaining = Math.max(0, Number(goal.target) - Number(goal.saved));

        html += `
        <article class="meta-card ${isCompleted ? 'meta-card--completed' : 'meta-card--primary'}">
            <header class="meta-card__header">
                <span class="meta-card__icon">${escapeHTML(goal.icon || '🎯')}</span>
                <div class="meta-card__heading">
                    <h3 class="meta-card__title">${escapeHTML(goal.name)}</h3>
                    <span class="meta-card__deadline">${goal.deadline ? `Límite: ${formatDate(goal.deadline)}` : 'Sin fecha'}</span>
                </div>
                ${isCompleted ? '<span class="meta-card__badge">✓ Completada</span>' : ''}
            </header>
            <p class="meta-card__amount">
                <strong class="mono">${currency(goal.saved)}</strong>
                <span>de ${currency(goal.target)}</span>
            </p>
            <div class="progress-track">
                <div class="progress-fill" style="width:${percentageWidth}%; background:${isCompleted ? 'var(--success-color)' : 'var(--info-color)'}"></div>
            </div>
            <div class="meta-card__progress">
                <span class="meta-card__percent" style="color:${isCompleted ? 'var(--success-color)' : 'inherit'}">${percentageText}%</span>
                ${!isCompleted ? `<span class="meta-card__remaining">Faltan ${currency(remaining)}</span>` : '<span class="meta-card__remaining">¡Meta alcanzada!</span>'}
            </div>
            <footer class="meta-card__actions">
                <button type="button" class="btn-primary" data-goal-action="contribute" data-id="${escapeAttr(goal.id)}">Abonar</button>
                <button type="button" class="btn-secondary" data-goal-action="edit" data-id="${escapeAttr(goal.id)}">Editar</button>
            </footer>
        </article>
        `;
    });

    // Inserción única en el DOM
    container.innerHTML = html;
}

/* ---------- MODAL: crear / editar meta (con selector de iconos) ---------- */
// Devuelve { form, deleteBtn }
export function openGoalModal(goal = null) {
    closeModals();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'goalModal';

    const icons = ['🏖️', '🚗', '🏠', '📱', '✈️', '🎓', '💻', '💍', '🏋️', '💰'];
    const currentIcon = goal?.icon || icons[0];
    // Si la meta tiene un icono antiguo que no está en la lista, se conserva
    if (!icons.includes(currentIcon)) icons.unshift(currentIcon);

    modal.innerHTML = `
      <div class="modal modal--meta" role="dialog" aria-modal="true">
        <div class="modal__header">
          <h2 class="modal__title">${goal ? 'Editar meta' : 'Crear nueva meta'}</h2>
          <button type="button" class="modal__close" id="closeGoalBtn" aria-label="Cerrar">×</button>
        </div>
        <div class="modal__body">
          <form id="goalForm">
            <div class="input-group">
              <label>ÍCONO</label>
              <div class="icon-picker">
                ${icons.map(i => `<button type="button" class="icon-option ${i === currentIcon ? 'is-selected' : ''}" data-icon="${escapeAttr(i)}">${escapeHTML(i)}</button>`).join('')}
              </div>
              <input type="hidden" name="icon" id="inputGoalIcon" value="${escapeAttr(currentIcon)}">
            </div>

            <div class="input-group">
              <label>NOMBRE DE LA META</label>
              <input type="text" name="name" required maxlength="70" value="${escapeAttr(goal?.name || '')}" placeholder="Ej. Celular Nuevo">
            </div>

            <div class="modal__row">
              <div class="input-group">
                <label>MONTO OBJETIVO</label>
                <input type="number" name="target" required min="1" step="0.01" value="${escapeAttr(goal?.target || '')}">
              </div>
              <div class="input-group">
                <label>AHORRO ACTUAL</label>
                <input type="number" name="saved" min="0" step="0.01" value="${escapeAttr(goal?.saved || 0)}" ${goal ? 'readonly style="background:var(--bg-muted)"' : ''}>
              </div>
            </div>

            <div class="input-group">
              <label>FECHA LÍMITE</label>
              <input type="date" name="deadline" value="${escapeAttr(goal?.deadline || '')}">
            </div>

            <div class="modal__actions">
              <button type="button" class="btn-secondary" id="cancelGoalBtn">Cancelar</button>
              <button type="submit" class="btn-primary modal__submit">${goal ? 'Guardar' : 'Crear meta'}</button>
            </div>

            ${goal ? '<button type="button" class="btn-danger-outline" id="deleteGoalBtn">Eliminar meta</button>' : ''}
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Lógica del selector de iconos
    modal.querySelectorAll('.icon-option').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.querySelectorAll('.icon-option').forEach(b => b.classList.remove('is-selected'));
            btn.classList.add('is-selected');
            modal.querySelector('#inputGoalIcon').value = btn.dataset.icon;
        });
    });

    modal.querySelector('#closeGoalBtn').addEventListener('click', closeModals);
    modal.querySelector('#cancelGoalBtn').addEventListener('click', closeModals);
    modal.addEventListener('click', e => { if (e.target === modal) closeModals(); });

    return {
        form: modal.querySelector('#goalForm'),
        deleteBtn: modal.querySelector('#deleteGoalBtn')
    };
}

/* ---------- MODAL: abonar / retirar (independiente) ---------- */
export function openContributeModal(goal) {
    closeModals();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'contributeModal';

    modal.innerHTML = `
      <div class="modal" data-type="ingreso" role="dialog" aria-modal="true">
        <div class="modal__header">
          <h2 class="modal__title">Abonar a ${escapeHTML(goal.name)}</h2>
          <button type="button" class="modal__close" id="closeContributeBtn" aria-label="Cerrar">×</button>
        </div>
        <div class="modal__body">
          <form id="contributeForm">
            <div class="modal__tabs">
              <button type="button" class="modal__tab active" data-type="abonar" aria-selected="true">↑ Abonar</button>
              <button type="button" class="modal__tab" data-type="retirar" aria-selected="false">↓ Retirar</button>
            </div>
            <input type="hidden" name="type" id="contributeType" value="abonar">

            <div class="input-group">
              <label>MONTO</label>
              <div class="modal__amount">
                <span>$</span>
                <input type="number" name="amount" required min="0.01" step="0.01" placeholder="0.00">
              </div>
            </div>

            <div class="input-group">
              <label>COMENTARIO (Opcional)</label>
              <input type="text" name="comment" maxlength="50" placeholder="Ej. Ahorro quincena">
            </div>

            <div class="modal__actions">
              <button type="button" class="btn-secondary" id="cancelContributeBtn">Cancelar</button>
              <button type="submit" class="btn-primary modal__submit" id="submitContributeBtn">Abonar a meta</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const tabs = modal.querySelectorAll('.modal__tab');
    const inputType = modal.querySelector('#contributeType');
    const modalDiv = modal.querySelector('.modal');
    const submitBtn = modal.querySelector('#submitContributeBtn');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            inputType.value = tab.dataset.type;

            if (tab.dataset.type === 'abonar') {
                modalDiv.dataset.type = 'ingreso'; // verde
                submitBtn.textContent = 'Abonar a meta';
            } else {
                modalDiv.dataset.type = 'gasto';   // rojo
                submitBtn.textContent = 'Retirar de meta';
            }
        });
    });

    modal.querySelector('#closeContributeBtn').addEventListener('click', closeModals);
    modal.querySelector('#cancelContributeBtn').addEventListener('click', closeModals);
    modal.addEventListener('click', e => { if (e.target === modal) closeModals(); });

    return modal.querySelector('#contributeForm');
}

export function closeModals() {
    document.getElementById('goalModal')?.remove();
    document.getElementById('contributeModal')?.remove();
}

export function getFormData(form) {
    return Object.fromEntries(new FormData(form).entries());
}

function currency(value) {
    return Number(value || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function formatDate(value) {
    return new Date(value + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function escapeHTML(value) {
    return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function escapeAttr(value) { return escapeHTML(value); }