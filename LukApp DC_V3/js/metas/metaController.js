import '../core/app.js';
/* =========================================================
    LukApp · metaController.js
    ========================================================= */

import { getAllGoals, getGoalById, createGoal, editGoal, contributeToGoal, removeGoal, getGoalSummary } from './metaModel.js';
import { renderSummary, renderGoals, openGoalModal, openContributeModal, closeModals, getFormData } from './metaView.js';

let goals = [];

document.addEventListener('DOMContentLoaded', initializeGoals);

// Sincronización global (evento viejo + evento nuevo)
document.addEventListener('lukapp:data-changed', render);
document.addEventListener('lukapp:data-updated', render);

function initializeGoals() {
    load();
    document.getElementById('btnNuevaMeta')?.addEventListener('click', () => showForm());
    document.getElementById('metasGridContainer')?.addEventListener('click', handleGoalAction);
    render();
}

function load() {
    goals = getAllGoals();
}

function render() {
    load();
    renderSummary(getGoalSummary(goals), goals.length);
    renderGoals(goals);
}

function showForm(goal = null) {
    const { form, deleteBtn } = openGoalModal(goal);
    if (!form) return;

    // Sin { once: true }: si la validación falla, el formulario sigue funcionando
    form.addEventListener('submit', event => {
        event.preventDefault();
        const data = getFormData(form);

        if (!data.name || Number(data.target) <= 0) {
            alert('Completa el nombre y un objetivo válido.');
            return;
        }

        if (goal) editGoal(goal.id, data);
        else createGoal(data);

        closeModals();
        emitDataChanged();
    });

    if (deleteBtn && goal) {
        deleteBtn.addEventListener('click', () => {
            if (confirm('¿Eliminar esta meta? Se perderá el registro de ahorro.')) {
                removeGoal(goal.id);
                closeModals();
                emitDataChanged();
            }
        });
    }
}

function handleGoalAction(event) {
    const button = event.target.closest('[data-goal-action]');
    if (!button) return;

    const goal = getGoalById(button.dataset.id);
    if (!goal) return;

    const action = button.dataset.goalAction;

    if (action === 'edit' || action === 'menu') showForm(goal);

    if (action === 'contribute') {
        const form = openContributeModal(goal);
        if (!form) return;

        form.addEventListener('submit', e => {
            e.preventDefault();
            const data = getFormData(form);

            if (Number(data.amount) <= 0) {
                alert('Monto inválido.');
                return;
            }

            // La notificación de "meta alcanzada" ya se dispara dentro del Model (solo 1 vez)
            contributeToGoal(goal.id, data.amount, data.type);
            closeModals();
            emitDataChanged();
        });
    }
}

// Emite ambos eventos: el viejo (por si otros módulos lo escuchan) y el nuevo
function emitDataChanged() {
    document.dispatchEvent(new CustomEvent('lukapp:data-changed'));
    document.dispatchEvent(new CustomEvent('lukapp:data-updated'));
}