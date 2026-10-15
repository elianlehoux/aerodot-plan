/** Plan de vuelo guardado en el navegador. Sin cuenta y sin servidor. */

export const STORAGE_KEY = 'aerodot:flight-plans';

const PAGE_H = 841.89;

/** Baseline en coordenadas PDF (origen abajo a la izquierda), Helvetica 11. */
export const textSlots = [
  ['identificacion', 223.75, 635.14],
  ['reglas', 400.33, 635.14],
  ['tipoVuelo', 506.72, 635.14],
  ['numero', 62, 593.14],
  ['tipoAeronave', 165.86, 593.14],
  ['estela', 301.64, 593.14],
  ['equipo', 408.33, 593.14],
  ['transponder', 518.83, 593.14],
  ['salida', 182.03, 556.14],
  ['eobt', 383.77, 556.14],
  ['velocidad', 64.8, 514.14],
  ['nivel', 193.86, 514.14],
  ['ruta', 292, 514.64],
  ['destino', 108.72, 414.14],
  ['ete', 239.27, 414.14],
  ['alt1', 361, 414.14],
  ['alt2', 486, 414.14],
  ['autonomia', 77.27, 269.64],
  ['personas', 221.94, 269.64],
  ['balsaNumero', 78, PAGE_H - 670],
  ['balsaCapacidad', 150, PAGE_H - 670],
  ['balsaColor', 332, PAGE_H - 670],
  ['color', 73, PAGE_H - 708.75],
  ['observaciones', 78, PAGE_H - 737],
  ['piloto', 73, PAGE_H - 769.75],
];

/** Centro de cada casilla que se tacha cuando no aplica. */
export const crossSlots = [
  ['radioU', 440, PAGE_H - 568],
  ['radioV', 474, PAGE_H - 568],
  ['radioE', 510, PAGE_H - 568],
  ['supS', 80, PAGE_H - 618],
  ['supP', 116, PAGE_H - 618],
  ['supD', 152, PAGE_H - 618],
  ['supM', 186, PAGE_H - 618],
  ['supJ', 220, PAGE_H - 618],
  ['chaJ', 298, PAGE_H - 618],
  ['chaL', 352, PAGE_H - 618],
  ['chaF', 404, PAGE_H - 618],
  ['chaU', 458, PAGE_H - 618],
  ['chaV', 512, PAGE_H - 618],
  ['balsaD', 46, PAGE_H - 669],
  ['balsaC', 262, PAGE_H - 669],
];

export const checkboxNames = crossSlots.map(([name]) => name);

export function emptyPlan(id) {
  const today = new Date();
  const fecha = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return {
    id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    fecha,
    identificacion: '',
    reglas: 'V',
    tipoVuelo: 'G',
    numero: '1',
    tipoAeronave: '',
    estela: 'L',
    equipo: 'S',
    transponder: 'S',
    salida: '',
    eobt: '',
    velocidad: '',
    nivel: '',
    ruta: 'DCT',
    destino: '',
    ete: '',
    alt1: '',
    alt2: '',
    opr: '',
    per: 'A',
    otra: '',
    autonomia: '',
    personas: '1',
    radioU: false,
    radioV: false,
    radioE: false,
    supS: false,
    supP: false,
    supD: false,
    supM: false,
    supJ: false,
    chaJ: false,
    chaL: false,
    chaF: false,
    chaU: false,
    chaV: false,
    balsaD: false,
    balsaNumero: '',
    balsaCapacidad: '',
    balsaC: false,
    balsaColor: '',
    color: '',
    observaciones: '',
    piloto: '',
    firma: '',
  };
}

export function loadPlans() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((plan) => plan && typeof plan.id === 'string');
  } catch {
    return [];
  }
}

export function savePlans(plans) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function findPlan(id) {
  return loadPlans().find((plan) => plan.id === id) || null;
}

export function upsertPlan(plan) {
  const plans = loadPlans().filter((item) => item.id !== plan.id);
  plans.push({ ...plan, updatedAt: Date.now() });
  savePlans(plans);
}

export function removePlan(id) {
  savePlans(loadPlans().filter((plan) => plan.id !== id));
}

export function routeLabel(plan) {
  const from = plan.salida || '····';
  const to = plan.destino || '····';
  return `${from} → ${to}`;
}

export function item18(plan) {
  const parts = [];
  if (plan.fecha && /^\d{4}-\d{2}-\d{2}$/.test(plan.fecha)) {
    const [year, month, day] = plan.fecha.split('-');
    parts.push(`DOF/${year.slice(2)}${month}${day}`);
  }
  if (plan.opr) parts.push(`OPR/${plan.opr}`);
  if (plan.per) parts.push(`PER/${plan.per}`);
  if (plan.otra) parts.push(plan.otra);
  return parts.join(' ');
}

export function pdfFileName(plan) {
  const id = (plan.identificacion || 'PLAN').replace(/[^\w.-]+/g, '');
  const from = plan.salida || 'XXXX';
  const to = plan.destino || 'XXXX';
  const time = plan.eobt ? `(${plan.eobt})` : '';
  const date = plan.fecha && /^\d{4}-\d{2}-\d{2}$/.test(plan.fecha)
    ? `_${plan.fecha.slice(8, 10)}${plan.fecha.slice(5, 7)}${plan.fecha.slice(2, 4)}`
    : '';
  return `${id}-${from}${time}-${to}${date}.pdf`;
}
