/***** PREFERENCIAS POR USUARIO (hoja "Preferencias") *****/
const H_PREFS = 'Preferencias';
const PREFS_ENUM = {
  vistaPedidos: ['lista', 'tablero', 'tabla'],
  vistaClientes: ['tarjetas', 'tabla'],
  vistaInventario: ['tarjetas', 'tabla'],
  densidad: ['comoda', 'compacta'],
  formatoHora: ['12h', '24h'],
  frases: ['siempre', 'ocasional', 'nunca'],
  periodo: ['hoy', '7d', '30d', 'mes'],
  modo: ['claro', 'oscuro'],
  acento: ['azul', 'violeta', 'esmeralda', 'ambar', 'rosa', 'pizarra', 'vino']
};
const PREFS_BOOL = ['saludo', 'reloj'];

function hojaPrefs_() {
  return hojaConEncabezado_(H_PREFS, ['Usuario', 'Preferencias', 'Actualizado'], function (h) {
    h.getRange('A:A').setNumberFormat('@');
  });
}

function prefsFila_(h, u) {
  const last = h.getLastRow();
  if (last < 2) return 0;
  const us = h.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < us.length; i++) if (String(us[i][0]).trim().toLowerCase() === u) return i + 2;
  return 0;
}

function prefsLeer_(ses) {
  const h = hojaPrefs_();
  const f = prefsFila_(h, ses.u);
  return f ? parseJsonSeg_(h.getRange(f, 2).getValue(), {}) : {};
}

function prefsLimpiar_(p) {
  const o = {};
  Object.keys(PREFS_ENUM).forEach(function (k) {
    if (p[k] !== undefined && PREFS_ENUM[k].indexOf(p[k]) > -1) o[k] = p[k];
  });
  PREFS_BOOL.forEach(function (k) { if (typeof p[k] === 'boolean') o[k] = p[k]; });
  const ts = Number(p._ts);
  o._ts = (isFinite(ts) && ts > 0) ? ts : Date.now();
  return o;
}

// SIEMPRE se guarda bajo ses.u (el usuario de la sesión): nadie puede escribir preferencias ajenas ni globales
function prefsGuardar_(d, ses) {
  const limpio = prefsLimpiar_((d && d.prefs && typeof d.prefs === 'object') ? d.prefs : {});
  conLock_(function () {
    const h = hojaPrefs_();
    const f = prefsFila_(h, ses.u);
    const fila = [[ses.u, JSON.stringify(limpio), new Date()]];
    if (f) h.getRange(f, 1, 1, 3).setValues(fila);
    else {
      const n = Math.max(h.getLastRow(), 1) + 1;
      h.getRange(n, 1).setNumberFormat('@');
      h.getRange(n, 1, 1, 3).setValues(fila);
    }
  }, 30000);
  return { ok: true };
}

function requiereAdmin_(ses) {
  if (!ses || ses.j !== 'admin') throw new Error('Solo el administrador puede hacer esto.');
}