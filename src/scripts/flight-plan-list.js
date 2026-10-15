import { findPlan, loadPlans, removePlan, routeLabel } from '../data/flight-plan.js';

const list = document.querySelector('#fp-list');
const empty = document.querySelector('#fp-empty');
const dialog = document.querySelector('#fp-delete');
const status = document.querySelector('#fp-status');

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[char]));

const when = (stamp) => new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}).format(new Date(stamp));

function render() {
  const plans = loadPlans().sort((a, b) => b.updatedAt - a.updatedAt);
  empty.hidden = plans.length > 0;
  list.hidden = plans.length === 0;
  list.innerHTML = plans.map((plan) => {
    const id = escapeHtml(plan.id);
    const flightDate = /^\d{4}-\d{2}-\d{2}$/.test(plan.fecha || '')
      ? new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${plan.fecha}T12:00:00`))
      : '';
    const meta = [plan.identificacion, flightDate].filter(Boolean).join(' · ');
    return `<li class="fp-row">
      <a class="fp-row-main" href="/editar?id=${id}">
        <span class="fp-route">${escapeHtml(routeLabel(plan))}</span>
        <span class="fp-meta">${escapeHtml(meta || 'Sin matrícula')}</span>
        <span class="fp-meta">${escapeHtml(when(plan.updatedAt))}</span>
      </a>
      <button class="button-quiet" type="button" data-delete="${id}">Eliminar</button>
    </li>`;
  }).join('');
}

function askDelete() {
  dialog.returnValue = '';
  dialog.showModal();
  return new Promise((resolve) => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), { once: true });
  });
}

list.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-delete]');
  if (!button) return;
  const plan = findPlan(button.dataset.delete);
  if (!plan) {
    render();
    return;
  }
  dialog.querySelector('p').textContent = `Se borra ${routeLabel(plan)} de este navegador.`;
  if (!(await askDelete())) return;
  removePlan(plan.id);
  status.textContent = 'Plan eliminado.';
  render();
});

window.addEventListener('storage', render);
render();
