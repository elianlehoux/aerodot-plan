import {
  crossSlots,
  emptyPlan,
  findPlan,
  item18,
  pdfFileName,
  removePlan,
  textSlots,
  upsertPlan,
} from '../data/flight-plan.js';

const form = document.querySelector('#fp-form');
const missing = document.querySelector('#fp-missing');
const status = document.querySelector('#fp-status');
const pdfButton = document.querySelector('#fp-pdf');
const deleteButton = document.querySelector('#fp-delete-open');
const dialog = document.querySelector('#fp-delete');
const canvas = document.querySelector('#fp-sign');
const clearSign = document.querySelector('#fp-sign-clear');
const title = document.querySelector('#fp-title');

const upperNames = new Set([
  'identificacion', 'tipoAeronave', 'equipo', 'transponder', 'salida', 'eobt',
  'velocidad', 'nivel', 'ruta', 'destino', 'ete', 'alt1', 'alt2', 'opr', 'otra',
  'autonomia', 'balsaNumero', 'balsaCapacidad', 'balsaColor', 'color',
  'observaciones', 'piloto',
]);

let planId = '';
let firma = '';
let timer = 0;
let known = false;
let dirty = false;

const context = canvas.getContext('2d');

function sizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth || 640;
  const height = canvas.clientHeight || 140;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.lineWidth = 2.2;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = '#1a1a18';
}

function drawStoredSignature() {
  sizeCanvas();
  if (!firma) return;
  const image = new Image();
  image.onload = () => {
    context.drawImage(image, 0, 0, canvas.clientWidth || 640, canvas.clientHeight || 140);
  };
  image.src = firma;
}

function pointerPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

let drawing = false;

canvas.addEventListener('pointerdown', (event) => {
  canvas.setPointerCapture(event.pointerId);
  drawing = true;
  const point = pointerPoint(event);
  context.beginPath();
  context.moveTo(point.x, point.y);
});

canvas.addEventListener('pointermove', (event) => {
  if (!drawing) return;
  const point = pointerPoint(event);
  context.lineTo(point.x, point.y);
  context.stroke();
});

function finishStroke(event) {
  if (!drawing) return;
  drawing = false;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  firma = canvas.toDataURL('image/png');
  scheduleSave();
}

canvas.addEventListener('pointerup', finishStroke);
canvas.addEventListener('pointercancel', finishStroke);

clearSign.addEventListener('click', () => {
  firma = '';
  sizeCanvas();
  scheduleSave();
});

function collect() {
  const data = {};
  for (const element of form.elements) {
    if (!element.name || element.disabled) continue;
    if (element.type === 'radio') {
      if (element.checked) data[element.name] = element.value;
    } else if (element.type === 'checkbox') {
      data[element.name] = element.checked;
    } else {
      data[element.name] = element.value.trim();
    }
  }
  if (data.supP || data.supD || data.supM || data.supJ) data.supS = true;
  if (data.chaL || data.chaF || data.chaU || data.chaV) data.chaJ = true;
  if (data.balsaNumero || data.balsaCapacidad || data.balsaColor || data.balsaC) data.balsaD = true;
  form.elements.supS.checked = Boolean(data.supS);
  form.elements.chaJ.checked = Boolean(data.chaJ);
  form.elements.balsaD.checked = Boolean(data.balsaD);
  return data;
}

function fill(plan) {
  for (const element of form.elements) {
    if (!element.name || !(element.name in plan)) continue;
    if (element.type === 'radio') element.checked = element.value === plan[element.name];
    else if (element.type === 'checkbox') element.checked = Boolean(plan[element.name]);
    else if (element.type !== 'button' && element.type !== 'submit') element.value = plan[element.name] ?? '';
  }
  firma = plan.firma || '';
  drawStoredSignature();
  title.textContent = plan.salida && plan.destino ? `${plan.salida} → ${plan.destino}` : 'Plan nuevo';
}

function currentPlan() {
  return {
    ...emptyPlan(planId),
    ...collect(),
    id: planId,
    firma,
    createdAt: findPlan(planId)?.createdAt || Date.now(),
  };
}

function scheduleSave() {
  dirty = true;
  window.clearTimeout(timer);
  timer = window.setTimeout(persist, 250);
}

function persist() {
  const next = currentPlan();
  try {
    upsertPlan(next);
    known = true;
    status.textContent = 'Guardado en este navegador.';
    title.textContent = next.salida && next.destino ? `${next.salida} → ${next.destino}` : 'Plan nuevo';
  } catch {
    status.textContent = 'No se pudo guardar. El navegador bloqueó el almacenamiento.';
  }
}

form.addEventListener('submit', (event) => event.preventDefault());

form.addEventListener('input', (event) => {
  const element = event.target;
  if (element instanceof HTMLInputElement && upperNames.has(element.name) && element.type !== 'checkbox') {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    element.value = element.value.toUpperCase();
    if (start != null && end != null) element.setSelectionRange(start, end);
  }
  scheduleSave();
});

form.addEventListener('change', scheduleSave);

function bytesFromDataUrl(dataUrl) {
  const binary = atob(dataUrl.split(',')[1]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function drawCross(page, x, y, color) {
  page.drawLine({
    start: { x: x - 8, y: y - 6.5 },
    end: { x: x + 8, y: y + 6.5 },
    thickness: 1.4,
    color,
  });
  page.drawLine({
    start: { x: x - 8, y: y + 6.5 },
    end: { x: x + 8, y: y - 6.5 },
    thickness: 1.4,
    color,
  });
}

async function downloadPdf() {
  persist();
  const plan = findPlan(planId) || currentPlan();
  pdfButton.disabled = true;
  status.textContent = 'Armando el PDF…';
  try {
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    const response = await fetch('/forms/plan-de-vuelo-eana.pdf');
    if (!response.ok) throw new Error('formulario');
    const pdf = await PDFDocument.load(await response.arrayBuffer());
    const page = pdf.getPages()[0];
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    for (const [name, x, y] of textSlots) {
      const value = String(plan[name] || '').toUpperCase();
      if (!value) continue;
      page.drawText(value, { x, y, size: 11, font: bold, color: rgb(0, 0, 0) });
    }
    const extra = item18(plan).toUpperCase();
    if (extra) {
      let size = 11;
      while (size > 8 && regular.widthOfTextAtSize(extra, size) > 470) size -= 0.5;
      page.drawText(extra, { x: 56, y: 378.04, size, font: regular, color: rgb(0, 0, 0) });
    }
    for (const [name, x, y] of crossSlots) {
      if (!plan[name]) drawCross(page, x, y, rgb(0, 0, 0));
    }
    if (plan.firma?.startsWith('data:image/png')) {
      const image = await pdf.embedPng(bytesFromDataUrl(plan.firma));
      page.drawImage(image, { x: 285, y: 21.89, width: 300, height: 40 });
    }
    const blob = new Blob([await pdf.save()], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = pdfFileName(plan);
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    status.textContent = 'PDF descargado. Guardado en este navegador.';
  } catch {
    status.textContent = 'No se pudo armar el PDF. El plan sigue guardado.';
  } finally {
    pdfButton.disabled = false;
  }
}

pdfButton.addEventListener('click', downloadPdf);

deleteButton.addEventListener('click', () => {
  dialog.returnValue = '';
  dialog.showModal();
});

dialog.addEventListener('close', () => {
  if (dialog.returnValue !== 'confirm') return;
  try {
    if (known) removePlan(planId);
  } catch {
    status.textContent = 'No se pudo eliminar.';
    return;
  }
  location.assign('/');
});

function boot() {
  const params = new URLSearchParams(location.search);
  const requested = params.get('id');
  if (requested && requested !== 'nuevo') {
    const stored = findPlan(requested);
    if (!stored) {
      form.hidden = true;
      document.querySelector('.fp-bar').hidden = true;
      missing.hidden = false;
      return;
    }
    planId = stored.id;
    known = true;
    fill(stored);
    status.textContent = 'Guardado en este navegador.';
    return;
  }
  planId = crypto.randomUUID();
  const url = new URL(location.href);
  url.searchParams.set('id', planId);
  history.replaceState(null, '', url);
  fill(emptyPlan(planId));
  status.textContent = 'Todavía no está guardado. Al completar un dato queda en este navegador.';
}

boot();
window.addEventListener('pagehide', () => {
  if (dirty) persist();
});
