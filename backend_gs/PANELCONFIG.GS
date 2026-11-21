/***** CENTRALIZADOR DE DISEÑO (hoja Config_Global) *****/
const H_CONFIG = 'Config_Global';
const DISENO_PRESETS = ['aurora', 'marmol', 'medianoche', 'arquitectura', 'oceano', 'atardecer', 'grafito', 'esmeralda', 'minimal', 'pizarra', 'niebla'];
const DISENO_SECCIONES = ['inicio', 'chats', 'pedidos', 'clientes', 'mas'];
const DISENO_DEFAULT = {
  negocio: 'Mi Tienda', eslogan: 'Centro de atención',
  loginTitulo: 'Panel de atención', loginTexto: 'Entra con tu usuario y PIN',
  logo: '', logoForma: 'redondeado',
  modo: 'oscuro', acento: 'azul', colorA: '#3f7ad9', colorB: '#2f5fb0',
  fondoLogin: { t: 'preset', v: 'pizarra' }, fondoApp: { t: 'preset', v: 'pizarra' }, fondosSec: {},
  blur: 10, opacidad: 88, velo: 40, radio: 12, brillo: false,
  fuente: 'inter', anim: 'equilibrado', permitirModo: true,
  neon: false,iconos: 'solar', neon: false, densidad: 'comoda', densidad: 'comoda',
  vistaPedidos: 'lista', vistaClientes: 'tarjetas', vistaInventario: 'tarjetas',
  saludo: true, reloj: true, formatoHora: '12h', confirmarSalir: true,
  frases: 'siempre', frasesTxt: ''
};

function hojaConfig_() { return hojaConEncabezado_(H_CONFIG, ['Clave', 'Valor', 'Actualizado', 'Por']); }

function disenoParsear_(def, raw) {
  if (typeof def === 'boolean') return raw === true || String(raw).toLowerCase() === 'true';
  if (typeof def === 'number') { const n = Number(raw); return isFinite(n) ? n : def; }
  if (typeof def === 'object') {
    try { const o = JSON.parse(String(raw)); return (o && typeof o === 'object') ? o : def; } catch (e) { return def; }
  }
  return String(raw === null || raw === undefined ? '' : raw).trim();
}

function disenoCelda_(v) {
  if (typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return typeof v === 'number' ? v : seguro_(String(v));
}

// Devuelve { version, cfg }. Se guarda 10 min en caché; al guardar se invalida.
function disenoLeer_() {
  const cache = CacheService.getScriptCache();
  const c = cache.get('diseno_v1');
  if (c) { try { return JSON.parse(c); } catch (e) {} }
  const out = JSON.parse(JSON.stringify(DISENO_DEFAULT));
  let version = 0;
  const h = hojaConfig_();
  const last = h.getLastRow();
  if (last >= 2) {
    h.getRange(2, 1, last - 1, 2).getValues().forEach(function (r) {
      const k = String(r[0]);
      if (k === 'version') { version = Number(r[1]) || 0; return; }
      if (Object.prototype.hasOwnProperty.call(DISENO_DEFAULT, k)) out[k] = disenoParsear_(DISENO_DEFAULT[k], r[1]);
    });
  }
  const res = { version: version, cfg: out };
  cache.put('diseno_v1', JSON.stringify(res), 600);
  return res;
}

function hex_(v, def) { return /^#[0-9a-fA-F]{6}$/.test(String(v || '')) ? String(v).toLowerCase() : def; }
function numRango_(v, min, max, def) { const n = Number(v); return isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : def; }
function idDrive_(v) { return /^[A-Za-z0-9_-]{10,}$/.test(String(v || '')) ? String(v) : ''; }
function enLista_(v, lista, def) { return lista.indexOf(v) > -1 ? v : def; }

function fondoValido_(f, def) {
  if (!f || typeof f !== 'object') return def;
  if (f.t === 'preset' && DISENO_PRESETS.indexOf(f.v) > -1) return { t: 'preset', v: f.v };
  if (f.t === 'imagen' && idDrive_(f.v)) return { t: 'imagen', v: String(f.v) };
  if (f.t === 'color' && /^#[0-9a-fA-F]{6}$/.test(String(f.v || ''))) return { t: 'color', v: String(f.v).toLowerCase() };
  return def;
}

function disenoValidar_(c) {
  const D = DISENO_DEFAULT, o = {};
  const txt = function (k, max) { o[k] = limpiar_(c[k] !== undefined ? c[k] : D[k], max); };
  const bool = function (k) { o[k] = c[k] === undefined ? D[k] : !(c[k] === false || String(c[k]) === 'false'); };
  txt('negocio', 40); txt('eslogan', 60); txt('loginTitulo', 50); txt('loginTexto', 90);
  if (!o.negocio) o.negocio = D.negocio;
  o.logo = idDrive_(c.logo);
  o.logoForma = enLista_(c.logoForma, ['redondo', 'redondeado', 'libre'], D.logoForma);
  o.modo = c.modo === 'claro' ? 'claro' : 'oscuro';
  o.acento = enLista_(c.acento, ['azul', 'violeta', 'esmeralda', 'ambar', 'rosa', 'pizarra', 'vino', 'custom'], D.acento);
  o.colorA = hex_(c.colorA, D.colorA); o.colorB = hex_(c.colorB, D.colorB);
  o.fondoLogin = fondoValido_(c.fondoLogin, D.fondoLogin);
  o.fondoApp = fondoValido_(c.fondoApp, D.fondoApp);
  o.fondosSec = {};
  DISENO_SECCIONES.forEach(function (s) {
    const f = fondoValido_((c.fondosSec || {})[s], null);
    if (f) o.fondosSec[s] = f;
  });
  o.blur = numRango_(c.blur, 0, 28, D.blur);
  o.opacidad = numRango_(c.opacidad, 20, 100, D.opacidad);
  o.velo = numRango_(c.velo, 15, 75, D.velo);
  o.radio = numRango_(c.radio, 4, 28, D.radio);
  bool('brillo'); bool('permitirModo'); bool('neon');
  bool('saludo'); bool('reloj'); bool('confirmarSalir');
  o.fuente = enLista_(c.fuente, ['sistema', 'inter', 'jakarta', 'poppins'], D.fuente);
  o.iconos = enLista_(c.iconos, ['solar', 'corporativo', 'animado'], D.iconos);
  o.anim = enLista_(c.anim, ['cine', 'equilibrado', 'ahorro'], D.anim);
  o.densidad = enLista_(c.densidad, ['comoda', 'compacta'], D.densidad);
  o.vistaPedidos = enLista_(c.vistaPedidos, ['lista', 'tablero', 'tabla'], D.vistaPedidos);
  o.vistaClientes = enLista_(c.vistaClientes, ['tarjetas', 'tabla'], D.vistaClientes);
  o.vistaInventario = enLista_(c.vistaInventario, ['tarjetas', 'tabla'], D.vistaInventario);
  o.formatoHora = enLista_(c.formatoHora, ['12h', '24h'], D.formatoHora);
  o.frases = enLista_(c.frases, ['siempre', 'ocasional', 'nunca'], D.frases);
  o.frasesTxt = String(c.frasesTxt || '').split(/\n|\|/)
    .map(function (x) { return limpiar_(x, 140); }).filter(String).slice(0, 25).join(' | ');
  return o;
}

function disenoGuardar_(d, ses) {
  requiereAdmin_(ses)
  const limpio = disenoValidar_(d.cfg || {});
  const h = hojaConfig_();
  const ahora = new Date();
  conLock_(function () {
    const filas = Object.keys(DISENO_DEFAULT).map(function (k) { return [k, disenoCelda_(limpio[k]), ahora, ses.n]; });
    filas.push(['version', Date.now(), ahora, ses.n]);
    h.getRange(2, 1, filas.length, 4).setValues(filas);
    const sobran = h.getLastRow() - 1 - filas.length;
    if (sobran > 0) h.getRange(2 + filas.length, 1, sobran, 4).clearContent();
  }, 30000);
  CacheService.getScriptCache().remove('diseno_v1');
  bitacora_('DISENO', '', '', 'Diseño actualizado por ' + ses.n);
  return disenoLeer_();
}

function carpetaDiseno_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('CARPETA_DISENO');
  if (id) { try { return DriveApp.getFolderById(id); } catch (x) {} }
  const f = DriveApp.createFolder('Diseño ' + NEGOCIO);
  props.setProperty('CARPETA_DISENO', f.getId());
  return f;
}

// Sube el logo o un fondo a Drive (enlace público de solo lectura) y devuelve su id
function disenoImagen_(d, ses) {
  requiereAdmin_(ses);
  const tipo = d.tipo === 'logo' ? 'logo' : 'fondo';
  const mime = d.mime === 'image/png' ? 'image/png' : 'image/jpeg';
  const b64 = String(d.b64 || '');
  if (!b64) throw new Error('Falta la imagen.');
  if (b64.length > 4500000) throw new Error('La imagen es muy pesada (máximo ~3 MB).');
  const blob = Utilities.newBlob(Utilities.base64Decode(b64), mime, tipo + '_' + Date.now() + (mime === 'image/png' ? '.png' : '.jpg'));
  const file = carpetaDiseno_().createFile(blob);
  let publico = true;
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }
  catch (e) { publico = false; registrarError_(e); }
  bitacora_('DISENO_IMG', '', '', ses.n + ' · ' + tipo);
  return { id: file.getId(), publico: publico };
}