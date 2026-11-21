const FLUJO = { PENDIENTE_PAGO:'CONFIRMADO', CONFIRMADO:'PREPARANDO', PREPARANDO:'EMPACADO', EMPACADO:'DESPACHADO', DESPACHADO:'EN_RUTA', EN_RUTA:'ENTREGADO' };
const SIG_TXT = { PENDIENTE_PAGO:'✅ Confirmar pago', CONFIRMADO:'🛠️ Preparar', PREPARANDO:'📦 Empacado', EMPACADO:'🚚 Despachar', DESPACHADO:'🛵 En ruta', EN_RUTA:'🎉 Entregado' };
const ESTADO_COL = { PENDIENTE_PAGO:'#ffc247', CONFIRMADO:'#22d3ff', PREPARANDO:'#3b82f6', EMPACADO:'#6366f1', DESPACHADO:'#a78bfa', EN_RUTA:'#c084fc', ENTREGADO:'#2ef2a5', INCIDENCIA:'#ff9f43', CANCELADO:'#ff5c8a' };
const ICON = { photo:'📸', clock:'⏰', truck:'🚚', 'message-circle':'💬', package:'📦' };
const NAV = [['inicio','🏠','Inicio'],['chats','💬','Chats'],['pedidos','📦','Pedidos'],['clientes','👥','Clientes'],['mas','🧰','Más']];
const SUB = { inventario:1, pagos:1, ruta:1, equipo:1, rapidas:1, diseno:1, preferencias:1, configuracion:1 };
const TITULOS = { chats:'Chats', pedidos:'Pedidos', clientes:'Clientes', mas:'Herramientas', inventario:'Inventario', pagos:'Verificar pagos', ruta:'Ruta del día', equipo:'Equipo y permisos', rapidas:'Respuestas rápidas', diseno:'Diseño y marca', preferencias:'Mis preferencias', configuracion:'Configuración' };
const RUTA_DE = { inicio:'inicio', chats:'chats', pedidos:'pedidos', clientes:'clientes', mas:'mas', preferencias:'preferencias', configuracion:'configuracion', equipo:'configuracion/equipo', diseno:'configuracion/diseno', inventario:'inventario', pagos:'pagos', ruta:'ruta', rapidas:'rapidas' };
const TAB_DE = {}; Object.keys(RUTA_DE).forEach(k => { TAB_DE[RUTA_DE[k]] = k; });
const PERIODOS = [['hoy','Hoy'],['7d','7 días'],['30d','30 días'],['mes','Este mes']];
const TEMAS = { azul:'Azul neón', violeta:'Violeta neón', claro:'Claro' };

let TOKEN='', ME=null, ADMIN=false, ESTADOS=[], RAPIDAS=[], TAB='inicio', TORRE=null, PERIODO='7d';
let PEDIDOS=[], PRODS=[], CLIENTES=[], CHATS=[], CHAT=null, POLL_BUSY=false, TICK=0, PREV_SL=null;
let FCHAT='todos', QCHAT='';
const PF = { estado:'activos', pago:'todos', muni:'todos', rango:'todos', q:'', orden:'recientes', vista:'lista' };
const CF = { seg:'todos', q:'', orden:'gasto', vista:'tarjetas' };
const IF = { q:'', f:'todos', vista:'tarjetas' };
const MEDIA = {}, MEDIA_PEND = {};
let SONIDO = true;
try { SONIDO = localStorage.getItem('sonido') !== '0'; } catch (e) {}

/* ================= Utilidades ================= */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const fmt = t => esc(t).replace(/\*([^*\n]+)\*/g,'<b>$1</b>').replace(/(^|[\s(])_([^_\n]+)_(?=$|[\s).,!?])/g,'$1<i>$2</i>');
const Q = n => 'Q' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
const Q0 = n => 'Q' + Math.round(Number(n || 0)).toLocaleString('en-US');
const pintar = h => { $('#main').innerHTML = h; escalonar(); };
function escalonar() { $$('#main .anim').forEach((el, i) => el.style.setProperty('--i', Math.min(i, 16))); }
function skeleton() { return '<div class="g g2">' + [1,2,3,4].map(() => '<div class="card"><div class="sk" style="width:50%"></div><div class="sk" style="width:80%;height:26px;margin-top:10px"></div></div>').join('') + '</div>'; }
function avColor(s) { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) % 360; return 'hsl(' + h + ' 85% 62%)'; }
function avatar(nom) { const ini = (String(nom).replace(/[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ]/g,'')[0] || '#').toUpperCase(); return '<div class="av" style="background:' + avColor(nom) + ';color:#06101f">' + esc(ini) + '</div>'; }

/* ================= Preferencias personales, saludo, reloj y frases ================= */
const P = k => { const v = Tema.pref(k); return (v !== undefined && v !== null && v !== '') ? v : Tema.cfg()[k]; };

const FRASES = [
  'Un buen servicio empieza con una respuesta a tiempo.',
  'Cada pedido bien entregado es un cliente que vuelve.',
  'La constancia le gana al talento cuando el talento no es constante.',
  'Haz hoy lo que tu yo de mañana te agradecerá.',
  'Lo pequeño bien hecho se convierte en grande.',
  'Un cliente atendido con calidez es la mejor publicidad.',
  'No tienes que ser perfecto, tienes que ser constante.',
  'El orden de hoy es la tranquilidad de mañana.',
  'Trabajar en equipo es multiplicar lo que cada uno sabe hacer.',
  'Los detalles no son detalles: hacen la diferencia.',
  'Respira, prioriza y avanza una tarea a la vez.',
  'Cuando todo parezca urgente, empieza por lo importante.',
  'Cada mensaje respondido es una venta que puede nacer.',
  'La disciplina es hacer lo que toca aunque no haya ganas.',
  'Un paso a la vez también llega lejos.',
  'Hoy es buen día para mejorar algo que ayer salió regular.',
  'La confianza se construye cumpliendo lo que se promete.',
  'Tu trabajo ordena el día de muchas personas.',
  'Pregunta, escucha, resuelve. Así de simple.',
  'Los buenos resultados son la suma de días ordinarios bien trabajados.',
  'Gracias por cuidar cada detalle del negocio.',
  'Un equipo coordinado vale más que mil esfuerzos aislados.',
  'Lo que se mide, se mejora.',
  'Un problema bien explicado ya está medio resuelto.'
];
const NOTA_DIA = { 0: 'Domingo: gracias por estar disponible.', 1: 'Empieza la semana con buena energía.', 5: 'Último empujón de la semana.', 6: 'Sábado: ritmo tranquilo y buen servicio.' };

function ahoraGT(op) { return new Date().toLocaleString('es-GT', Object.assign({ timeZone: 'America/Guatemala' }, op)); }
function textoHora() { return ahoraGT({ hour: 'numeric', minute: '2-digit', hour12: P('formatoHora') !== '24h' }); }
function textoFecha(largo) {
  return ahoraGT(largo ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } : { weekday: 'short', day: 'numeric', month: 'short' });
}
function saludoHora() {
  const h = Number(ahoraGT({ hour: 'numeric', hourCycle: 'h23' })) % 24;
  return h >= 5 && h < 12 ? 'Buenos días' : (h >= 12 && h < 19 ? 'Buenas tardes' : 'Buenas noches');
}
function fraseDelMomento() {
  const custom = String(Tema.cfg().frasesTxt || '').split(/\s*[|\n]\s*/).filter(Boolean);
  const lista = custom.length ? custom : FRASES;
  const d = new Date(), slot = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate() + '-' + Math.floor(d.getHours() / 3);
  let h = 0; for (const ch of ((ME ? ME.u : '') + slot)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return lista[h % lista.length];
}
function bloqueBienvenida() {
  const sal = P('saludo'), rel = P('reloj'), fr = P('frases');
  if (!sal && !rel && fr !== 'siempre') return '';
  const nombre = String((ME && ME.n) || '').split(' ')[0];
  const f = textoFecha(true), nota = NOTA_DIA[new Date().getDay()] || '';
  return '<div class="card hello anim"><div class="hrow"><div>' +
    (sal ? '<div class="hsal">' + saludoHora() + ', <b>' + esc(nombre) + '</b></div><div class="mut">' + esc(f.charAt(0).toUpperCase() + f.slice(1)) + (nota ? ' · ' + esc(nota) : '') + '</div>' : '') +
    '</div>' + (rel ? '<div class="hclock" id="hclock">' + esc(textoHora()) + '</div>' : '') + '</div>' +
    (fr === 'siempre' ? '<div class="hq">“' + esc(fraseDelMomento()) + '”</div>' : '') + '</div>';
}
function actualizarReloj() {
  const h = $('#hreloj'); if (h) h.textContent = (TOKEN && P('reloj')) ? textoFecha(false) + ' · ' + textoHora() : '';
  const c = $('#hclock'); if (c) c.textContent = textoHora();
}
setInterval(actualizarReloj, 15000);

/* ================= Cabecera compacta, indicador de sync y caché SWR ================= */
function cabeceraCompacta(pills) {
  const nombre = String((ME && ME.n) || '').split(' ')[0];
  const f = textoFecha(false);
  return '<div class="dhead"><div class="dsal"><span>' + saludoHora() + ', <b>' + esc(nombre) + '</b></span>' +
    '<span class="dfecha"> · ' + esc(f.charAt(0).toUpperCase() + f.slice(1)) + '</span></div>' + (pills || '') + '</div>';
}

let SYNC_N = 0;
function setSync(on) {
  SYNC_N = Math.max(0, SYNC_N + (on ? 1 : -1));
  const s = $('#sync'); if (s) s.classList.toggle('hide', SYNC_N === 0);
}

const DASH_PREFIX = 'dash_swr_v1_', DASH_MAX_EDAD = 6 * 3600000;
function dashKey() { return DASH_PREFIX + (ME ? ME.u : '') + '_' + PERIODO; }
function leerCacheDash() {
  try {
    const r = JSON.parse(localStorage.getItem(dashKey()) || 'null');
    return (r && r.d && r.t && r.e && Date.now() - r.ts < DASH_MAX_EDAD) ? r : null;
  } catch (e) { return null; }
}
function guardarCacheDash(d, t, e) {
  try { localStorage.setItem(dashKey(), JSON.stringify({ ts: Date.now(), d: d, t: t, e: e })); } catch (x) {}
}
function limpiarCacheDash() {
  try { Object.keys(localStorage).filter(k => k.indexOf(DASH_PREFIX) === 0).forEach(k => localStorage.removeItem(k)); } catch (e) {}
}

function frasesOcasional() {
  if (!TOKEN || P('frases') !== 'ocasional') return;
  let ult = 0; try { ult = Number(sessionStorage.getItem('fr_t')) || 0; } catch (e) {}
  if (Date.now() - ult < 90 * 60000) return;
  try { sessionStorage.setItem('fr_t', String(Date.now())); } catch (e) {}
  const t = $('#toast'); t.textContent = '💡 ' + fraseDelMomento(); t.className = 'frase'; t.style.display = 'block';
  clearTimeout(toast.h); toast.h = setTimeout(() => { t.style.display = 'none'; }, 8000);
}

async function pedirSalir() {
  if (!Tema.cfg().confirmarSalir) return cerrarSesion('');
  const nombre = String((ME && ME.n) || '').split(' ')[0];
  const r = await modal({ titulo: 'Cerrar sesión', texto: '¿Seguro que quieres salir' + (nombre ? ', ' + nombre : '') + '? Tendrás que volver a ingresar tu usuario y PIN.', ok: 'Salir', peligro: true, sinFoco: true });
  if (r) cerrarSesion('');
}

async function abrirPrefs() {
  const bs = k => { const v = Tema.pref(k); return v === true ? '1' : (v === false ? '0' : ''); };
  const pre = [['', 'Predeterminado']];
  const r = await modal({ titulo: 'Mis preferencias', texto: 'Solo cambian en este dispositivo. “Predeterminado” usa lo que definió el administrador.', campos: [
    { id: 'vistaPedidos', label: 'Vista de pedidos', tipo: 'select', opciones: pre.concat([['lista', 'Lista'], ['tablero', 'Tablero'], ['tabla', 'Tabla']]), valor: Tema.pref('vistaPedidos') || '' },
    { id: 'vistaClientes', label: 'Vista de clientes', tipo: 'select', opciones: pre.concat([['tarjetas', 'Tarjetas'], ['tabla', 'Tabla']]), valor: Tema.pref('vistaClientes') || '' },
    { id: 'vistaInventario', label: 'Vista de inventario', tipo: 'select', opciones: pre.concat([['tarjetas', 'Tarjetas'], ['tabla', 'Tabla']]), valor: Tema.pref('vistaInventario') || '' },
    { id: 'densidad', label: 'Densidad', tipo: 'select', opciones: pre.concat([['comoda', 'Cómoda'], ['compacta', 'Compacta']]), valor: Tema.pref('densidad') || '' },
    { id: 'saludo', label: 'Saludo y fecha', tipo: 'select', opciones: pre.concat([['1', 'Mostrar'], ['0', 'Ocultar']]), valor: bs('saludo') },
    { id: 'reloj', label: 'Reloj', tipo: 'select', opciones: pre.concat([['1', 'Mostrar'], ['0', 'Ocultar']]), valor: bs('reloj') },
    { id: 'formatoHora', label: 'Formato de hora', tipo: 'select', opciones: pre.concat([['12h', '12 horas'], ['24h', '24 horas']]), valor: Tema.pref('formatoHora') || '' },
    { id: 'frases', label: 'Frases motivadoras', tipo: 'select', opciones: pre.concat([['siempre', 'En la bienvenida'], ['ocasional', 'Aviso ocasional'], ['nunca', 'No mostrar']]), valor: Tema.pref('frases') || '' }
  ], ok: 'Guardar' });
  if (!r) return;
  ['vistaPedidos', 'vistaClientes', 'vistaInventario', 'densidad', 'formatoHora', 'frases'].forEach(k => Tema.setPref(k, r[k]));
  ['saludo', 'reloj'].forEach(k => Tema.setPref(k, r[k] === '1' ? true : (r[k] === '0' ? false : '')));
  PF.vista = P('vistaPedidos'); CF.vista = P('vistaClientes'); IF.vista = P('vistaInventario');
  actualizarReloj(); toast('✅ Preferencias guardadas'); vistaMas();
}


function ping() {
  if (!SONIDO) return;
  try {
    if (navigator.vibrate) navigator.vibrate(60);
    const a = new (window.AudioContext || window.webkitAudioContext)();
    const o = a.createOscillator(), g = a.createGain();
    o.frequency.value = 880; g.gain.value = 0.06; o.connect(g); g.connect(a.destination); o.start();
    setTimeout(() => { o.stop(); a.close(); }, 140);
  } catch (e) {}
}

async function api(accion, datos) {
  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ origen: 'panel', token: TOKEN, accion: accion, datos: datos || {} })
    });
  } catch (e) {
    throw new Error('Sin conexión con el servidor. Revisa API_URL y que la implementación sea "Cualquier persona".');
  }
  if (!res.ok) throw new Error('Error de red (' + res.status + ')');
  const txt = await res.text();
  let json;
  try { json = JSON.parse(txt); }
  catch (e) { throw new Error('El servidor no devolvió JSON (¿falta autorizar permisos o implementar nueva versión?).'); }
  if (!json.ok) {
    const m = String(json.error || 'Error de conexión').replace(/^Error:\s*/, '');
    if (m.indexOf('SESION') > -1) cerrarSesion('Tu sesión venció. Entra otra vez.');
    throw new Error(m);
  }
  return json.data;
}

function toast(msg, tipo) {
  const t = $('#toast'); t.textContent = msg; t.className = tipo || ''; t.style.display = 'block';
  clearTimeout(toast.h); toast.h = setTimeout(() => { t.style.display = 'none'; }, tipo ? 6000 : 3000);
}
function busy(v) { $('#busy').style.display = v ? 'flex' : 'none'; }

function copiarViejo(t, ok) {
  const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select();
  try { document.execCommand('copy'); ok(); } catch (e) { toast('No pude copiar; selecciona el texto.', 'warn'); }
  a.remove();
}
function copiar(t) {
  const ok = () => toast('📋 Copiado');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok).catch(() => copiarViejo(t, ok));
  else copiarViejo(t, ok);
}

function modal(o) {
  return new Promise(res => {
    const ov = document.createElement('div'); ov.className = 'ov';
    const box = document.createElement('div'); box.className = 'modal';
    const campos = o.campos || [];
    box.innerHTML = '<h3>' + esc(o.titulo) + '</h3>' + (o.texto ? '<p class="mut">' + esc(o.texto) + '</p>' : '') +
      campos.map(c => {
        let inp;
        if (c.tipo === 'select') {
          inp = '<select id="f_' + c.id + '">' + c.opciones.map(x => {
            const v = Array.isArray(x) ? x[0] : x, t = Array.isArray(x) ? x[1] : x;
            return '<option value="' + esc(v) + '"' + (v === c.valor ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select>';
        } else if (c.tipo === 'area') {
          inp = '<textarea id="f_' + c.id + '" rows="' + (c.filas || 7) + '">' + esc(c.valor == null ? '' : c.valor) + '</textarea>';
        } else {
          inp = '<input id="f_' + c.id + '" type="' + (c.tipo || 'text') + '" value="' + esc(c.valor == null ? '' : c.valor) + '" placeholder="' + esc(c.ph || '') + '"' +
                (c.lista ? ' list="' + c.lista + '"' : '') + (c.modo ? ' inputmode="' + c.modo + '"' : '') + '>';
        }
        return '<label>' + esc(c.label) + inp + '</label>';
      }).join('') +
      '<div class="row"><button class="btn sec" id="m_no">Cancelar</button><button class="btn ' + (o.peligro ? 'red' : '') + '" id="m_ok">' + esc(o.ok || 'Aceptar') + '</button></div>';
    ov.appendChild(box); document.body.appendChild(ov);
    const cerrar = v => { ov.remove(); res(v); };
    box.querySelector('#m_no').onclick = () => cerrar(null);
    box.querySelector('#m_ok').onclick = () => {
      const v = {}; campos.forEach(c => { v[c.id] = box.querySelector('#f_' + c.id).value.trim(); }); cerrar(v);
    };
    const f = box.querySelector('input,select,textarea'); if (f && !o.sinFoco) f.focus();
  });
}

/* ================= Gráficas (SVG / CSS) ================= */
function areaChart(labels, vals) {
  const W = 600, H = 150, P = 8, n = vals.length;
  const max = Math.max(...vals, 1);
  const x = i => n === 1 ? W / 2 : P + i * (W - 2 * P) / (n - 1);
  const y = v => H - P - (v / max) * (H - 2 * P - 14);
  const pts = vals.map((v, i) => [x(i), y(v)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ' L' + pts[n - 1][0].toFixed(1) + ' ' + (H - P) + ' L' + pts[0][0].toFixed(1) + ' ' + (H - P) + ' Z';
  const dots = n <= 31 ? pts.map((p, i) => '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4" style="fill:var(--bg2);stroke:var(--pri);stroke-width:2"><title>' + esc(labels[i]) + ' · ' + Q0(vals[i]) + '</title></circle>').join('') : '';
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;margin-top:8px"><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--pri);stop-opacity:.45"/><stop offset="1" style="stop-color:var(--pri);stop-opacity:0"/></linearGradient></defs>' +
    '<path d="' + area + '" fill="url(#ga)"/><path class="draw" pathLength="1" d="' + line + '" fill="none" style="stroke:var(--pri);stroke-width:2.5;filter:drop-shadow(0 0 6px var(--glow))" stroke-linejoin="round"/>' + dots + '</svg>';
}
function barrasHoras(h) {
  const max = Math.max(...h, 1);
  return '<div class="hb">' + h.map((v, i) => '<div class="hc" title="' + i + ':00 · ' + v + ' pedido(s)"><i class="' + (v === max && v > 0 ? 'top' : '') + '" style="height:' + Math.max(4, v / max * 88) + '%"></i><span>' + (i % 3 === 0 ? i : '') + '</span></div>').join('') + '</div>';
}
function donut(items, total, unidad) {
  let acc = 0;
  const seg = items.filter(i => i.v > 0).map(i => { const a = acc / total * 360; acc += i.v; return i.c + ' ' + a.toFixed(1) + 'deg ' + (acc / total * 360).toFixed(1) + 'deg'; }).join(',');
  return '<div style="display:flex;gap:14px;align-items:center;margin-top:10px"><div class="donut" style="background:conic-gradient(' + (seg || 'var(--bd) 0deg 360deg') + ')"><div><b>' + total + '</b><span>' + unidad + '</span></div></div>' +
    '<div class="leg">' + (items.filter(i => i.v > 0).map(i => '<div><i style="background:' + i.c + '"></i><span class="nm">' + esc(i.n) + '</span><b style="margin-left:auto">' + i.v + '</b></div>').join('') || '<span class="mut">Sin datos</span>') + '</div></div>';
}
function rank(items, f) {
  const max = Math.max(...items.map(i => i.v), 1);
  return items.length ? items.map(i => '<div class="rk"><div class="top"><span class="nm">' + esc(i.n) + '</span><b>' + f(i) + '</b></div><div class="bar"><i style="width:' + Math.max(3, i.v / max * 100) + '%"></i></div></div>').join('')
                      : '<div class="empty" style="padding:14px 0">Sin datos en este período</div>';
}
function animarContadores(quieto) {
  $('#main').classList.toggle('quieto', !!quieto);
  $$('[data-n]').forEach(el => {
    const fin = Number(el.dataset.n), f = el.dataset.f;
    const fv = v => f === 'q' ? Q0(v) : f === 'q2' ? Q(v) : Math.round(v).toLocaleString('en-US');
    if (quieto) { el.textContent = fv(fin); return; }
    const t0 = performance.now();
    const paso = t => { const k = Math.min(1, (t - t0) / 700); el.textContent = fv(fin * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(paso); };
    requestAnimationFrame(paso);
  });
}

/* ================= Sesión y navegación ================= */
function cerrarSesion(msg) {
  TOKEN = ''; CHAT = null; PREV_SL = null; PERMS = []; SIM = null; ME = null;
  PEDIDOS = []; CLIENTES = []; PRODS = []; CHATS = []; EQ_DATA = null;
  renderSimBar();
  try { sessionStorage.removeItem('tok'); } catch (e) {}
  if (typeof salirDiseno === 'function' && TAB === 'diseno') salirDiseno();
  Tema.setUser('');
  $('#app').classList.add('hide'); $('#login').classList.remove('hide');
  Tema.modoLogin(true);
  $('#lg-err').textContent = msg || ''; $('#pin').value = '';
}

function aplicarPrefsUsuario() {
  PF.vista = P('vistaPedidos') || 'lista';
  CF.vista = P('vistaClientes') || 'tarjetas';
  IF.vista = P('vistaInventario') || 'tarjetas';
  PERIODO = P('periodo') || 'hoy';
  actualizarReloj();
}



function armarNav() {
  const vis = NAV.filter(n => n[0] === 'inicio' || n[0] === 'mas' ||
    (n[0] === 'chats' && puede('chats.ver')) ||
    (n[0] === 'pedidos' && puede('pedidos.ver')) ||
    (n[0] === 'clientes' && puede('clientes.ver')));
  $('#nav').innerHTML = '<div id="navind"></div><div class="brand">' + Tema.logoHtml(40) + '</div>' +
    vis.map(n => '<button data-tab="' + n[0] + '"><span>' + n[1] + '<i id="b_' + n[0] + '" class="bdg hide">0</i></span>' + n[2] + '</button>').join('') +
    '<div class="nf"><button id="nsalir"><span>⎋</span>Salir</button></div>';
  $$('#nav button[data-tab]').forEach(b => { b.onclick = () => mostrarTab(b.dataset.tab); });
  $('#nsalir').onclick = () => cerrarSesion('');
  requestAnimationFrame(moverIndicador);
}
function badge(id, n) { const b = $('#b_' + id); if (b) { b.textContent = n; b.classList.toggle('hide', !n); } }

async function arrancar() {
  const r = await api('init');
  ME = r.ses; PERMS = ME.perms || []; ADMIN = ME.j === 'admin'; SIM = null;
  ESTADOS = r.estados; RAPIDAS = r.rapidas || [];
  Tema.setUser(ME.u);
  if (r.diseno) Tema.aplicar(r.diseno);
  Tema.mergeRemote(r.prefs || {});
  aplicarPrefsUsuario();
  $('#login').classList.add('hide'); $('#app').classList.remove('hide');
  Tema.modoLogin(false); renderSimBar();
  $('#quien').textContent = (ADMIN ? '👑 ' : '') + ME.n;
  armarNav();
  rutear();
}

$('#lg-ok').onclick = async () => {
  $('#lg-err').textContent = '';
  try {
    const r = await api('login', { usuario: $('#usr').value.trim(), pin: $('#pin').value.trim() });
    TOKEN = r.token;
    try { sessionStorage.setItem('tok', TOKEN); } catch (e) {}
    await arrancar();
  } catch (e) { TOKEN = ''; $('#lg-err').textContent = e.message; }
};
$('#pin').addEventListener('keydown', e => { if (e.key === 'Enter') $('#lg-ok').click(); });
$('#hback').onclick = () => mostrarTab(TAB === 'equipo' || TAB === 'diseno' ? 'configuracion' : 'mas');
$('#refrescar').onclick = () => { if (TAB === 'chats') { cargarChats().catch(() => {}); pollChat(true); } else mostrarTab(TAB); };
try { TOKEN = sessionStorage.getItem('tok') || ''; } catch (e) {}
if (TOKEN) arrancar().catch(() => {});

/* ================= Router por hash ================= */
const hashDe = (t, arg) => '#/' + (RUTA_DE[t] || 'inicio') + (t === 'chats' && arg ? '/' + arg : '');

function leerHash() {
  const p = (location.hash || '').replace(/^#\/?/, '').split('?')[0].replace(/\/+$/, '');
  const seg = p.split('/');
  if (seg[0] === 'chats') return { tab: 'chats', arg: seg[1] || '' };
  return { tab: TAB_DE[p] || null, arg: '' };
}

function permisoTab(t) {
  switch (t) {
    case 'chats':      return puede('chats.ver');
    case 'pedidos':    return puede('pedidos.ver');
    case 'clientes':   return puede('clientes.ver');
    case 'inventario': return puede('inventario.ver');
    case 'pagos':      return puede('pagos.verificar');
    case 'ruta':       return puede('ruta.ver');
    case 'rapidas':    return puede('rapidas.editar');
    case 'configuracion': case 'equipo': case 'diseno': return esAdminEf();
    default: return true;
  }
}

// Navegar = cambiar el hash. Si ya estamos en ese hash, solo se vuelve a pintar (refrescar).
function mostrarTab(t, arg) {
  if (!TOKEN) return;
  const h = hashDe(t, arg);
  if (location.hash !== h) { location.hash = h; return; }
  return renderTab(t, arg);
}

function rutear() {
  if (!TOKEN || !ME) return;
  const r = leerHash();
  if (!r.tab) { try { history.replaceState(null, '', hashDe('inicio')); } catch (e) {} return renderTab('inicio'); }
  if (!permisoTab(r.tab)) {
    toast('No tienes acceso a esa sección.', 'warn');
    try { history.replaceState(null, '', hashDe('inicio')); } catch (e) {}
    return renderTab('inicio');
  }
  return renderTab(r.tab, r.arg);
}
window.addEventListener('hashchange', rutear);

async function renderTab(t, arg) {
  const prev = TAB;
  if (prev === 'diseno' && t !== 'diseno') salirDiseno();
  TAB = t;
  const base = SUB[t] ? 'mas' : t;
  $$('#nav button[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === base));
  moverIndicador();
  Tema.seccion(base);
  const mainEl = $('#main'); mainEl.classList.remove('enter'); void mainEl.offsetWidth; mainEl.classList.add('enter');
  $('#htitle').textContent = t === 'inicio' ? (puede('dashboard.ver') ? '⚡ Centro de mando' : '⚡ Mi turno') : (TITULOS[t] || '');
  $('#hback').classList.toggle('hide', !SUB[t]);
  try {
    if (t === 'chats') { armarChats(); await cargarChats(); if (arg) await abrirChat(arg); else if (CHAT) pollChat(false); return; }
    pintar(skeleton());
    if (t === 'inicio')        return puede('dashboard.ver') ? await vistaInicioAdmin() : await vistaInicioOp();
    if (t === 'pedidos')       return await vistaPedidos();
    if (t === 'clientes')      return await vistaClientes();
    if (t === 'mas')           return vistaMas();
    if (t === 'inventario')    return await vistaInventario();
    if (t === 'pagos')         return await vistaPagos();
    if (t === 'ruta')          return await vistaRuta();
    if (t === 'equipo')        return await vistaEquipo();
    if (t === 'rapidas')       return vistaRapidas();
    if (t === 'diseno')        return await vistaDiseno();
    if (t === 'preferencias')  return vistaPrefs();
    if (t === 'configuracion') return vistaConfig();
  } catch (e) { if (TAB === t && TOKEN) pintar('<div class="empty">' + esc(e.message) + '</div>'); }
}

function moverIndicador() {
  const nav = $('#nav'), ind = $('#navind'), on = nav && nav.querySelector('button[data-tab].on');
  if (!ind || !on) return;
  ind.style.width = on.offsetWidth + 'px'; ind.style.height = on.offsetHeight + 'px';
  ind.style.transform = 'translate(' + on.offsetLeft + 'px,' + on.offsetTop + 'px)';
}
window.addEventListener('resize', moverIndicador);

/* ================= INICIO ================= */
function htmlTorre(t) {
  const it = t.alertas;
  return '<div class="card anim"><div class="top"><b>🚨 Torre de control</b><span class="mut">' + (it.length ? it.length + ' pendiente(s)' : 'Todo en orden') + '</span></div>' +
    (it.length ? it.map((a, i) => {
      const ped = a.id ? { id: a.id, estado: a.est, nombre: a.nom, tel: a.tel } : null;
      return '<div class="al ' + a.n + '" data-al="' + i + '"><div class="ic">' + (ICON[a.ic] || '•') + '</div><div class="cb"><div class="nm">' + esc(a.t) + '</div><div class="mut nm">' + esc(a.d) + '</div></div>' +
        (ped ? '<div class="al-acc">' + (a.tel && puede('chats.ver') ? '<button class="btn xs" data-ach="' + esc(a.tel) + '">💬 Chat</button>' : '') + ctrlEstado(ped) + '</div>' : '<span>›</span>') + '</div>';
    }).join('') : '<div class="empty" style="padding:18px 0">Nada urgente por ahora ✨</div>') + '</div>';
}
function ligarTorre() {
  $$('[data-al]').forEach(x => {
    x.onclick = e => {
      const b = e.target.closest('[data-ach]');
      if (b) { mostrarTab('chats', b.dataset.ach); return; }
      if (e.target.closest('select')) return;
      accionAlerta(TORRE.alertas[x.dataset.al].a);
    };
  });
}
function accionAlerta(a) {
  if (a.t === 'chat') mostrarTab('chats', a.tel);
  else if (a.t === 'pagos') mostrarTab('pagos');
  else if (a.t === 'inv') { if (ADMIN) mostrarTab('inventario'); else toast('El inventario lo revisa el administrador.', 'warn'); }
}
function actualizarBadgeInicio() { badge('inicio', TORRE ? TORRE.alertas.filter(a => a.n === 'rojo').length : 0); }

async function vistaInicioAdmin(quieto) {
  const periodo = PERIODO;
  const cache = leerCacheDash();
  if (cache && TAB === 'inicio') {            // 1) pinta al instante lo último guardado
    TORRE = cache.t; actualizarBadgeInicio();
    renderInicioAdmin(cache.d, cache.t, cache.e, true);
  }
  setSync(true);
  try {                                        // 2) pide lo real en segundo plano
    const [d, t, e] = await Promise.all([
      api('dashboard', { periodo: periodo }),
      api('torre'),
      puede('equipo.ver') ? api('equipo') : Promise.resolve({ equipo: [] })
    ]);
    if (TAB !== 'inicio' || periodo !== PERIODO) return;
    guardarCacheDash(d, t, e);
    TORRE = t; actualizarBadgeInicio();
    renderInicioAdmin(d, t, e, !!cache || !!quieto);   // 3) actualiza sin parpadeo
  } catch (err) {
    if (!cache) throw err;
    if (!quieto) toast('Sin conexión: mostrando los últimos datos guardados.', 'warn');
  } finally { setSync(false); }
}

function renderInicioAdmin(d, t, e, quieto) {
  const k = d.kpi;
  const dl = v => v == null ? '' : '<span class="dl ' + (v >= 0 ? 'up' : 'dn') + '">' + (v >= 0 ? '▲' : '▼') + ' ' + Math.abs(v) + '%</span> ';
  const kp = (lab, n, f, sub, tono) => '<div class="card kpi anim"><p class="l">' + lab + '</p><p class="v' + (tono && n > 0 ? ' ' + tono : '') + '" data-n="' + n + '" data-f="' + f + '">0</p><p class="l sub">' + sub + '</p></div>';
  const pctEnt = k.pedidos ? Math.round(k.entregados / k.pedidos * 100) : 0;
  const est = Object.keys(ESTADO_COL).map(n => ({ n: n.replace('_', ' '), v: d.estados[n] || 0, c: ESTADO_COL[n] })).filter(x => x.v > 0);
  const totE = est.reduce((a, x) => a + x.v, 0);
  const pc = { 'Link / transferencia':'#22d3ff', 'Contra entrega':'#F59E0B', 'Pagado con puntos':'#a78bfa' };
  const pg = Object.keys(d.pagos).map(n => ({ n: n, v: d.pagos[n], c: pc[n] || '#9CA3AF' }));
  const totP = pg.reduce((a, x) => a + x.v, 0);
  const sv = d.serie, totS = sv.ventas.reduce((a, b) => a + b, 0);
  const eq = e.equipo || [];
  const pills = '<div class="chips">' + PERIODOS.map(p => '<button class="chip' + (p[0] === PERIODO ? ' on' : '') + '" data-p="' + p[0] + '">' + p[1] + '</button>').join('') + '</div>';

  pintar(
    cabeceraCompacta(pills) +
    '<div class="g dkpi">' +
      kp('Ventas', k.ventas, 'q', dl(k.dVentas) + 'vs período anterior', 'ok') +
      kp('Pedidos', k.pedidos, 'n', dl(k.dPedidos) + k.unidades + ' unidades') +
      kp('Ticket promedio', k.ticket, 'q2', 'por pedido') +
      kp('Por cobrar', t.porCobrar, 'q', t.cnt.pagos + ' link(s) pendientes', 'wa') +
      kp('Entregados', k.entregados, 'n', pctEnt + '% de los pedidos', 'ok') +
      kp('Cancelados', k.cancelados, 'n', 'en el período', 'ba') +
      kp('Descuentos', k.descuentos, 'q', 'regalados a clientes') +
      kp('Clientes activos', k.clientes, 'n', 'compraron en el período') +
    '</div>' +
    '<div class="g dgrid3 dtop">' + htmlTorre(t) +
      '<div class="card anim"><div class="top"><b>📈 ' + (PERIODO === 'hoy' ? 'Ventas · últimos 7 días' : 'Ventas por día') + '</b><span class="mut">' + Q0(totS) + '</span></div>' + areaChart(sv.labels, sv.ventas) +
        '<div class="top mut" style="font-size:11px"><span>' + esc(sv.labels[0]) + '</span><span>' + esc(sv.labels[sv.labels.length - 1]) + '</span></div></div>' +
      '<div class="card anim"><div class="top"><b>🕒 Pedidos por hora</b><span class="mut">hora del día</span></div>' + barrasHoras(d.horas) + '</div>' +
    '</div>' +
    '<div class="g dgrid3">' +
      '<div class="card anim"><b>📊 Estados</b>' + donut(est, totE, 'pedidos') + '</div>' +
      '<div class="card anim"><b>💳 Métodos de pago</b>' + donut(pg, totP, 'pedidos') + '</div>' +
      '<div class="card anim"><b>🏆 Más vendidos</b>' + rank(d.productos.map(p => ({ n: p.n, v: p.v, u: p.u })), i => Q0(i.v) + ' · ' + i.u + ' u') + '</div>' +
    '</div>' +
    '<div class="g dgrid2">' +
      '<div class="card anim"><b>📍 Municipios</b>' + rank(d.munis.map(m => ({ n: m.n, v: m.v, c: m.c })), i => Q0(i.v) + ' · ' + i.c + ' ped.') + '</div>' +
      '<div class="card anim"><b>🧑‍💼 Equipo</b>' + eq.map(m => '<div class="top" style="padding:8px 0;align-items:center"><div style="display:flex;gap:10px;align-items:center">' + avatar(m.n) + '<div><div class="id">' + esc(m.n) + '</div><div class="mut">' + (m.r === 'admin' ? 'Administrador' : 'Operador') + (m.ult ? ' · último ' + esc(m.ult) : '') + '</div></div></div><b>' + m.msgs + ' msg</b></div>').join('') +
        '<p class="mut" style="margin-top:6px">Mensajes enviados desde el panel (últimos ~1,500 del chat).</p></div>' +
    '</div>');
  $$('[data-p]').forEach(c => { c.onclick = () => { PERIODO = c.dataset.p; pintar(skeleton()); vistaInicioAdmin(); }; });
  ligarTorre(); animarContadores(quieto);
}

async function vistaInicioOp(quieto) {
  const t = await api('torre');
  if (TAB !== 'inicio') return;
  TORRE = t; actualizarBadgeInicio();
  const c = t.cnt;
  const big = (e, n, lab, go) => '<div class="card hv big anim" data-go="' + go + '"><div class="em">' + e + '</div><p class="v" data-n="' + n + '" data-f="n">0</p><p class="l">' + lab + '</p></div>';
    pintar(cabeceraCompacta('') +
    '<div class="g g2">' + big('📸', c.comprobantes, 'Comprobantes por verificar', 'pagos') + big('💬', c.sinResp, 'Chats sin responder', 'sinresp') +
      big('📦', c.despachar, 'Por despachar', 'despacho') + big('🚚', c.camino, 'En camino', 'ruta') + '</div>' + htmlTorre(t));
  $$('[data-go]').forEach(x => {
    x.onclick = () => {
      const g = x.dataset.go;
      if (g === 'pagos') mostrarTab('pagos');
      else if (g === 'ruta') mostrarTab('ruta');
      else if (g === 'sinresp') { FCHAT = 'sinresp'; mostrarTab('chats'); }
      else if (g === 'despacho') { PF.estado = 'despacho'; mostrarTab('pedidos'); }
    };
  });
  ligarTorre(); animarContadores(quieto);
}

/* ================= CHATS ================= */
async function cargarChats() {
  const r = await api('chats');
  CHATS = r.chats;
  if (CHAT) CHATS.forEach(c => { if (c.tel === CHAT.tel) c.sinLeer = 0; });
  const sl = CHATS.filter(c => c.sinLeer > 0).length;
  badge('chats', sl);
  if (PREV_SL !== null && sl > PREV_SL) { ping(); toast('💬 Mensaje nuevo'); }
  PREV_SL = sl;
  if (TAB === 'chats') renderLista();
}

function armarChats() {
  pintar('<div class="chatwrap' + (CHAT ? ' abierto' : '') + '" id="cw"><div class="lista"><input id="qchat" type="search" placeholder="🔎 Buscar nombre o teléfono" value="' + esc(QCHAT) + '">' +
    '<div class="chips" id="fchips" style="margin-top:10px"></div><div id="items"></div></div><div class="conv" id="conv"></div></div>');
  $('#qchat').oninput = function () { QCHAT = this.value; renderLista(); };
  renderLista(); renderConv();
}

function renderLista() {
  if (!$('#items')) return;
  const q = QCHAT.toLowerCase();
  const fs = [['todos','Todos'],['sinleer','Sin leer'],['sinresp','Sin responder'],['mios','Míos'],['asesor','Piden asesor']];
  $('#fchips').innerHTML = fs.map(f => '<button class="chip' + (f[0] === FCHAT ? ' on' : '') + '" data-f="' + f[0] + '">' + f[1] + '</button>').join('');
  $$('#fchips .chip').forEach(c => { c.onclick = () => { FCHAT = c.dataset.f; renderLista(); }; });
  const ahora = Date.now();
  const lista = CHATS.filter(c => {
    if (FCHAT === 'sinleer' && !c.sinLeer) return false;
    if (FCHAT === 'sinresp' && !(c.ultDir === 'IN' && ahora - c.ts >= 300000 && ahora - c.ts <= 86400000)) return false;
    if (FCHAT === 'mios' && !(c.humano && c.asignado === ME.n)) return false;
    if (FCHAT === 'asesor' && !(c.humano && c.motivo)) return false;
    return !q || (c.nombre + ' ' + c.tel).toLowerCase().indexOf(q) > -1;
  });
  let h = lista.length ? '' : '<div class="empty">No hay conversaciones aquí</div>';
  lista.forEach(c => {
    const nom = c.nombre || ('+' + c.tel);
    h += '<div class="ci' + (CHAT && CHAT.tel === c.tel ? ' act' : '') + '" data-tel="' + esc(c.tel) + '">' + avatar(nom) +
      '<div class="cb"><div class="top"><b class="nm">' + esc(nom) + '</b><span class="mut" style="white-space:nowrap">' + esc(c.fecha) + '</span></div>' +
      '<div class="top"><span class="mut prev">' + (c.ultDir === 'OUT' ? 'Tú: ' : '') + esc(c.ultTxt) + '</span>' + (c.sinLeer ? '<span class="nbadge">' + c.sinLeer + '</span>' : '') + '</div>' +
      ((c.humano || c.motivo) ? '<div style="margin-top:4px">' + (c.motivo ? '<span class="badge b-INCIDENCIA">🙋 ' + esc(c.motivo) + '</span> ' : '') + (c.humano ? '<span class="badge">🧑 ' + esc(c.asignado || 'Empleado') + '</span>' : '') + '</div>' : '') +
      '</div></div>';
  });
  $('#items').innerHTML = h;
  $$('#items .ci').forEach(x => { x.onclick = () => abrirChat(x.dataset.tel); });
}

async function abrirChat(tel) {
  const c = CHATS.filter(x => x.tel === tel)[0];
  CHAT = { tel: tel, nombre: c ? c.nombre : '', msgs: [], fila: 0, modo: 'BOT', asignado: '', motivo: '', info: null, pedidos: [] };
  if (c) c.sinLeer = 0;
  if ($('#cw')) $('#cw').classList.add('abierto');
  renderLista(); renderConv();
  await pollChat(true);
  cargarChats().catch(() => {});
}
function cerrarChat() {
  CHAT = null;
  if ($('#cw')) $('#cw').classList.remove('abierto');
  renderLista(); renderConv();
}

function renderConv() {
  const el = $('#conv'); if (!el) return;
  if (!CHAT) { el.innerHTML = '<div class="empty" style="margin:auto">Elige una conversación 💬</div>'; return; }
  el.innerHTML =
    '<div class="chead"><button class="btn sec sm back" id="cback">←</button><div style="flex:1;min-width:0"><div class="id nm" id="cnom"></div><div class="mut nm" id="csub"></div></div><button class="btn sec sm" id="cmodo"></button></div>' +
    '<details class="cinfo"><summary>👤 Cliente y pedidos</summary><div id="cinfob" class="mut">Cargando…</div></details>' +
    '<div class="msgs" id="msgs"></div><div class="aviso hide" id="aviso"></div><div class="chips" id="rap"></div>' +
    '<div class="compose"><textarea id="txt" rows="1" placeholder="Escribe un mensaje…"></textarea><button class="btn sm" id="send" style="min-width:64px">➤</button></div>';
  $('#cback').onclick = cerrarChat; $('#cmodo').onclick = cambiarModo; $('#send').onclick = enviar;
  const t = $('#txt');
  t.oninput = () => autoAlto(t);
  t.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer:fine)').matches) { e.preventDefault(); enviar(); } };
  $('#rap').innerHTML = RAPIDAS.map((r, i) => '<button class="chip" data-r="' + i + '">' + esc(r.length > 30 ? r.slice(0, 30) + '…' : r) + '</button>').join('');
  $$('#rap .chip').forEach(c => { c.onclick = () => { t.value = RAPIDAS[c.dataset.r]; autoAlto(t); t.focus(); }; });
  renderHead(); renderMsgs(true); renderInfo();
}
function autoAlto(t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'; }

function ventanaAbierta() {
  if (!CHAT) return false;
  for (let i = CHAT.msgs.length - 1; i >= 0; i--) if (CHAT.msgs[i].dir === 'IN') return (Date.now() - CHAT.msgs[i].ts) < 86400000;
  return false;
}
function renderHead() {
  if (!CHAT || !$('#cnom')) return;
  $('#cnom').textContent = CHAT.nombre || ('+' + CHAT.tel);
  $('#csub').textContent = '+' + CHAT.tel + (CHAT.motivo ? ' · 🙋 ' + CHAT.motivo : '');
  $('#cmodo').textContent = CHAT.modo === 'HUMANO' ? '🧑 ' + (CHAT.asignado || 'Empleado') : '🤖 Bot';
  renderAviso();
}
function renderAviso() {
  const a = $('#aviso'); if (!a || !CHAT) return;
  const ab = ventanaAbierta();
  const sinEnv = !puede('chats.enviar');
  $('#txt').disabled = !ab || sinEnv; $('#send').disabled = !ab || sinEnv;
  if (!$('#cmodo')) return;
  $('#cmodo').classList.toggle('hide', !puede('chats.modo'));
  if (sinEnv) { a.className = 'aviso'; a.textContent = 'Modo solo lectura: no tienes permiso para enviar mensajes.'; return; }
  $('#txt').disabled = !ab; $('#send').disabled = !ab;
  if (!ab) { a.className = 'aviso red'; a.textContent = '⏰ Pasaron más de 24 h desde el último mensaje del cliente. WhatsApp no permite enviar texto libre; solo plantillas aprobadas.'; }
  else if (CHAT.modo !== 'HUMANO') { a.className = 'aviso'; a.textContent = '🤖 El bot está atendiendo. Si respondes, tomas la conversación y el bot se calla.'; }
  else a.className = 'aviso hide';
}
async function cambiarModo() {
  if (!CHAT) return;
  const aH = CHAT.modo !== 'HUMANO';
  const r = await modal({ titulo: aH ? 'Tomar la conversación' : 'Devolver al bot',
    texto: aH ? 'El bot dejará de responderle a este cliente mientras tú lo atiendes (hasta 12 h).' : 'El bot volverá a responderle al cliente.', ok: 'Confirmar', sinFoco: true });
  if (!r) return;
  try { await api('modo', { tel: CHAT.tel, modo: aH ? 'HUMANO' : 'BOT' }); await pollChat(false); cargarChats().catch(() => {}); } catch (e) { toast(e.message, 'err'); }
}

function burbuja(m) {
  const out = m.dir === 'OUT', bot = out && m.autor === 'BOT';
  let c = '';
  if (m.media && m.tipo === 'image') {
    const ch = MEDIA[m.media];
    c += '<div class="media" data-id="' + esc(m.media) + '"' + (ch ? ' data-ok="1"' : '') + '>' + (ch ? '<img src="data:' + ch.mime + ';base64,' + ch.b64 + '" alt="imagen">' : '📷 Cargando imagen…') + '</div>';
    if (m.texto) c += '<div>' + fmt(m.texto) + '</div>';
  } else if (m.media) c += '<button class="btn sec sm" data-doc="' + esc(m.media) + '">📄 ' + esc(m.texto || 'Abrir archivo') + '</button>';
  else if (m.tipo === 'interactive' && !out) c += '<i>🔘 ' + esc(m.texto) + '</i>';
  else c += '<div>' + fmt(m.texto || '[' + m.tipo + ']') + '</div>';
  const fallo = out && m.cod !== 200;
  return '<div class="m ' + (out ? 'out' : 'in') + (bot ? ' bot' : '') + '">' + c + '<div class="meta' + (fallo ? ' fail' : '') + '">' + (out ? esc(m.autor) + ' · ' : '') + esc(m.hora) + (fallo ? ' · ⚠ no entregado' : '') + '</div></div>';
}
function renderMsgs(abajo) {
  const box = $('#msgs'); if (!box || !CHAT) return;
  const cerca = abajo || (box.scrollHeight - box.scrollTop - box.clientHeight < 80);
  let h = '', dia = '';
  CHAT.msgs.forEach(m => { if (m.dia !== dia) { dia = m.dia; h += '<div class="dia">' + esc(dia) + '</div>'; } h += burbuja(m); });
  box.innerHTML = h || '<div class="empty">Aún no hay mensajes con este cliente.</div>';
  if (cerca) box.scrollTop = box.scrollHeight;
  cargarMediasVisibles();
}
function renderInfo() {
  const el = $('#cinfob'); if (!el || !CHAT) return;
  if (!CHAT.info) { el.textContent = 'Cargando…'; return; }
  const i = CHAT.info;
  el.innerHTML = 'Compras recibidas: <b>' + esc(i.compras) + '</b> · Puntos: <b>' + esc(i.puntos) + '</b> · En proceso: <b>' + esc(i.pend) + '</b>' +
    (CHAT.pedidos.length ? '<div style="margin-top:8px">' + CHAT.pedidos.map(p => '<div class="top" style="padding:4px 0;align-items:center;gap:8px"><span>' + esc(p.id) + ' · ' + esc(p.total) + '</span><span style="display:flex;gap:6px;align-items:center"><span class="badge b-' + esc(p.estado) + '">' + esc(p.estado.replace('_', ' ')) + '</span>' + ctrlEstado({ id: p.id, estado: p.estado, nombre: CHAT.nombre, tel: CHAT.tel }) + '</span></div>').join('') + '</div><div class="row"><button class="btn xs" id="verped">Ver pedidos de este cliente</button></div>' : '<div style="margin-top:6px">Sin pedidos todavía.</div>');
  const b = $('#verped'); if (b) b.onclick = () => { PF.q = CHAT.tel; PF.estado = 'todos'; mostrarTab('pedidos'); };
}
async function pollChat(completo) {
  if (!CHAT || (POLL_BUSY && !completo)) return;
  const tel = CHAT.tel; POLL_BUSY = true;
  try {
    const r = await api('chat', { tel: tel, desde: completo ? 0 : CHAT.fila, leer: true });
    if (!CHAT || CHAT.tel !== tel) return;
    CHAT.msgs = r.completo ? r.msgs : CHAT.msgs.concat(r.msgs);
    CHAT.fila = r.fila; CHAT.modo = r.modo; CHAT.asignado = r.asignado; CHAT.motivo = r.motivo;
    if (r.info) { CHAT.info = r.info; CHAT.pedidos = r.pedidos; if (r.info.nombre) CHAT.nombre = r.info.nombre; }
    renderHead();
    if (r.completo || r.msgs.length) renderMsgs(r.completo);
    if (r.info) renderInfo();
  } catch (e) { if (completo && TOKEN) toast(e.message, 'err'); }
  finally { POLL_BUSY = false; }
}
async function enviar() {
  if (!CHAT) return;
  const t = $('#txt'), b = $('#send'), texto = t.value.trim();
  if (!texto) return;
  b.disabled = true;
  try { await api('enviar', { tel: CHAT.tel, texto: texto }); t.value = ''; autoAlto(t); await pollChat(false); cargarChats().catch(() => {}); }
  catch (e) { toast(e.message, 'err'); }
  if ($('#send')) renderAviso();
}

function cargarMedia(id) {
  if (MEDIA[id]) return Promise.resolve(MEDIA[id]);
  if (!MEDIA_PEND[id]) MEDIA_PEND[id] = api('media', { id: id }).then(r => { MEDIA[id] = r; delete MEDIA_PEND[id]; return r; }).catch(e => { delete MEDIA_PEND[id]; throw e; });
  return MEDIA_PEND[id];
}
async function cargarMediasVisibles() {
  for (const el of $$('.media[data-id]:not([data-ok])')) {
    try {
      const r = await cargarMedia(el.dataset.id);
      if (!el.isConnected) continue;
      const img = new Image(); img.src = 'data:' + r.mime + ';base64,' + r.b64; img.alt = 'imagen';
      el.innerHTML = ''; el.appendChild(img); el.dataset.ok = '1';
    } catch (e) { if (el.isConnected) el.textContent = '📷 No se pudo cargar la imagen'; }
  }
}
async function abrirDoc(id) {
  busy(true);
  try {
    const r = await cargarMedia(id);
    const bin = atob(r.b64), arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([arr], { type: r.mime }));
    const a = document.createElement('a'); a.href = url; a.download = r.nombre || 'archivo'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch (e) { toast(e.message, 'err'); }
  busy(false);
}
document.addEventListener('click', e => {
  const im = e.target.closest && e.target.closest('.media img');
  if (im) {
    const ov = document.createElement('div'); ov.className = 'ov'; ov.style.alignItems = 'center';
    const big = new Image(); big.src = im.src; big.style.cssText = 'max-width:96vw;max-height:92vh;border-radius:10px';
    ov.appendChild(big); ov.onclick = () => ov.remove(); document.body.appendChild(ov); return;
  }
  const dc = e.target.closest && e.target.closest('[data-doc]');
  if (dc) abrirDoc(dc.dataset.doc);
});

/* ================= PEDIDOS ================= */
const ESTADO_FILTROS = [['activos','Activos'],['pago','Por pagar'],['despacho','Por despachar'],['ruta','En camino'],['entregados','Entregados'],['cancelados','Cancelados'],['todos','Todos']];
const COLS = ['PENDIENTE_PAGO','CONFIRMADO','PREPARANDO','EMPACADO','DESPACHADO','EN_RUTA'];
const tipoPago = p => p.pago.indexOf('Zigi') > -1 ? 'link' : (p.pago.indexOf('puntos') > -1 ? 'puntos' : 'efectivo');
function limiteRango(r) {
  const h0 = new Date(); h0.setHours(0, 0, 0, 0); const d0 = h0.getTime(), dia = 86400000;
  return { hoy:{ d:d0, h:Infinity }, ayer:{ d:d0 - dia, h:d0 }, '7d':{ d:d0 - 6 * dia, h:Infinity }, '30d':{ d:d0 - 29 * dia, h:Infinity } }[r];
}
function pasaPed(p) {
  const e = p.estado, f = PF.estado;
  if (f === 'activos' && (e === 'ENTREGADO' || e === 'CANCELADO')) return false;
  if (f === 'pago' && e !== 'PENDIENTE_PAGO') return false;
  if (f === 'despacho' && ['CONFIRMADO','PREPARANDO','EMPACADO'].indexOf(e) < 0) return false;
  if (f === 'ruta' && e !== 'DESPACHADO' && e !== 'EN_RUTA') return false;
  if (f === 'entregados' && e !== 'ENTREGADO') return false;
  if (f === 'cancelados' && e !== 'CANCELADO') return false;
  if (PF.pago !== 'todos' && tipoPago(p) !== PF.pago) return false;
  if (PF.muni !== 'todos' && p.muni !== PF.muni) return false;
  if (PF.rango !== 'todos') { const l = limiteRango(PF.rango); if (p.ts < l.d || p.ts >= l.h) return false; }
  const q = PF.q.toLowerCase();
  return !q || (p.id + ' ' + p.nombre + ' ' + p.tel + ' ' + p.productos).toLowerCase().indexOf(q) > -1;
}

async function vistaPedidos() {
  const r = await api('pedidos');
  if (TAB !== 'pedidos') return;
  PEDIDOS = r.pedidos; armarPedidos();
}
function armarPedidos() {
  const munis = Array.from(new Set(PEDIDOS.map(p => p.muni).filter(Boolean))).sort();
  const sel = (id, val, opts) => '<select id="' + id + '">' + opts.map(o => '<option value="' + esc(o[0]) + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>';
  pintar('<input id="busq" type="search" placeholder="🔎 Buscar pedido, cliente, teléfono o producto" value="' + esc(PF.q) + '">' +
    '<div class="chips" id="pchips" style="margin-top:10px"></div>' +
    '<div class="fgrid">' +
      sel('f_rango', PF.rango, [['todos','📅 Todas las fechas'],['hoy','Hoy'],['ayer','Ayer'],['7d','Últimos 7 días'],['30d','Últimos 30 días']]) +
      sel('f_pago', PF.pago, [['todos','💳 Todos los pagos'],['link','Link / transferencia'],['efectivo','Contra entrega'],['puntos','Pagado con puntos']]) +
      sel('f_muni', PF.muni, [['todos','📍 Todos los municipios']].concat(munis.map(m => [m, m]))) +
      sel('f_orden', PF.orden, [['recientes','↓ Más recientes'],['antiguos','↑ Más antiguos'],['total','💰 Mayor total']]) +
    '</div><div class="top" style="margin:10px 0;align-items:center"><span class="mut" id="pres"></span><div style="display:flex;gap:6px"><button class="chip" data-v="lista">☰ Lista</button><button class="chip" data-v="tablero">▦ Tablero</button><button class="chip" data-v="tabla">▤ Tabla</button><button class="chip" id="plimpiar">🧹 Limpiar filtros</button></div></div><div id="plista"></div>');
    ligarDnD($('#plista'));
  renderPedLista();
}
function renderPedLista() {
  $('#pchips').innerHTML = ESTADO_FILTROS.map(f => '<button class="chip' + (f[0] === PF.estado ? ' on' : '') + '" data-f="' + f[0] + '">' + f[1] + '</button>').join('');
  $$('#pchips .chip').forEach(c => { c.onclick = () => { PF.estado = c.dataset.f; renderPedLista(); }; });
  $$('[data-v]').forEach(c => c.classList.toggle('on', c.dataset.v === PF.vista));
  let lista = PEDIDOS.filter(pasaPed);
  if (PF.orden === 'antiguos') lista = lista.slice().reverse();
  else if (PF.orden === 'total') lista = lista.slice().sort((a, b) => b.totalN - a.totalN);
  $('#pres').textContent = lista.length + ' pedido(s) · ' + Q(lista.reduce((a, p) => a + p.totalN, 0));
  $('#plista').innerHTML = !lista.length ? '<div class="empty">No hay pedidos con estos filtros 🎉</div>'
    : (PF.vista === 'tablero' ? tableroHtml(lista) : PF.vista === 'tabla' ? tablaPedidos(lista) : lista.map(cardPedido).join(''));
}
function tablaPedidos(lista) {
  return '<div class="card tblwrap"><table class="tbl"><thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Municipio</th><th>Pago</th><th class="r">Total</th><th>Estado</th><th></th></tr></thead><tbody>' +
    lista.map(p => {
      const sig = FLUJO[p.estado], id = esc(p.id);
      return '<tr><td><b>' + id + '</b></td><td>' + esc(p.fecha) + '</td><td>' + esc(p.nombre || ('+' + p.tel)) + '</td><td>' + esc(p.muni) + '</td><td>' + esc(p.pago) + '</td>' +
        '<td class="r"><b>' + esc(p.total) + '</b></td><td><span class="badge b-' + esc(p.estado) + '">' + esc(p.estado.replace('_', ' ')) + '</span></td>' +
        '<td class="acc">' + (sig ? '<button class="btn sm" data-a="sig" data-id="' + id + '">' + SIG_TXT[p.estado] + '</button>' : '') +
        '<button class="btn sec sm" data-a="otro" data-id="' + id + '">⋯</button><button class="btn sec sm" data-a="chat" data-id="' + id + '">💬</button></td></tr>';
    }).join('') + '</tbody></table></div>';
}

function tableroHtml(lista) {
  return '<div class="board">' + COLS.map(e => {
    const items = lista.filter(p => p.estado === e);
    return '<div class="col" data-col="' + e + '"><div class="top" style="align-items:center"><span class="badge b-' + e + '">' + e.replace('_', ' ') + '</span><b>' + items.length + '</b></div>' +
      (items.map(p => '<div class="mini" draggable="true" data-drag="' + esc(p.id) + '"><div class="top"><b>' + esc(p.id) + '</b><span>' + esc(p.total) + '</span></div><div class="mut nm">' + esc(p.nombre || ('+' + p.tel)) + '</div><div class="mut nm">📍 ' + esc(p.muni) + '</div>' +
        '<div class="row"><button class="btn sm" style="flex:1" data-a="sig" data-id="' + esc(p.id) + '">' + SIG_TXT[e] + '</button><button class="btn sec sm" data-a="chat" data-id="' + esc(p.id) + '">💬</button></div></div>').join('') || '<div class="mut" style="padding:12px 0;text-align:center">—</div>') + '</div>';
  }).join('') + '</div>';
}

// Arrastrar tarjetas entre columnas (computadora). Al soltar, pide confirmar el cambio de estado.
function ligarDnD(el) {
  let arrastrando = null;
  el.addEventListener('dragstart', e => {
    const m = e.target.closest && e.target.closest('.mini'); if (!m) return;
    arrastrando = m.dataset.drag; m.classList.add('drag');
    e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', arrastrando);
  });
  el.addEventListener('dragend', e => {
    const m = e.target.closest && e.target.closest('.mini'); if (m) m.classList.remove('drag');
    $$('.col.sobre').forEach(c => c.classList.remove('sobre'));
  });
  el.addEventListener('dragover', e => {
    const c = e.target.closest && e.target.closest('.col'); if (!c || !arrastrando) return;
    e.preventDefault();
    $$('.col.sobre').forEach(x => { if (x !== c) x.classList.remove('sobre'); });
    c.classList.add('sobre');
  });
  el.addEventListener('drop', e => {
    const c = e.target.closest && e.target.closest('.col'); if (!c || !arrastrando) return;
    e.preventDefault(); c.classList.remove('sobre');
    const p = PEDIDOS.filter(q => q.id === arrastrando)[0], destino = c.dataset.col;
    arrastrando = null;
    if (p && destino && destino !== p.estado) cambiarEstado(p, destino);
  });
}
function accionPedido(e) {
  const x = e.target.closest('[data-a]'); if (!x) return;
  const p = PEDIDOS.filter(q => q.id === x.dataset.id)[0]; if (!p) return;
  if (x.dataset.a === 'sig') cambiarEstado(p, FLUJO[p.estado]);
  if (x.dataset.a === 'otro') elegirEstado(p);
  if (x.dataset.a === 'link') enviarLink(p);
  if (x.dataset.a === 'chat') mostrarTab('chats', p.tel);
  if (x.dataset.a === 'etq') etiqueta(p);
}
function vistaMas() {
  const c = TORRE ? TORRE.cnt : {};
  const tiles = [
    ['pagos','📸','Verificar pagos', c.comprobantes ? c.comprobantes + ' por revisar' : 'Comprobantes de clientes', puede('pagos.verificar')],
    ['ruta','🗺️','Ruta del día','Entregas por zona', puede('ruta.ver')],
    ['inventario','🏷️','Inventario', puede('inventario.editar') ? 'Stock, precios y fotos' : 'Consulta de catálogo', puede('inventario.ver')],
    ['rapidas','⚡','Respuestas rápidas','Mensajes guardados', puede('rapidas.editar')],
    ['configuracion','🧰','Configuración','Equipo, diseño y respaldo (admin)', esAdminEf()],
    ['preferencias','👤','Mis preferencias','Vistas, reloj, saludo y tema', true],
    ['modo','🌙','Modo ' + (Tema.modo() === 'claro' ? 'claro' : 'oscuro'),'Solo para ti', Tema.cfg().permitirModo],
    ['sonido','🔔','Sonido', SONIDO ? 'Activado' : 'Apagado', true],
    ['salir','⎋','Cerrar sesión', rolEfectivo().n, true]
  ].filter(x => x[4]);
  pintar('<div class="g g2">' + tiles.map(x => '<div class="card hv tile anim" data-t="' + x[0] + '"><div class="em">' + x[1] + '</div><div class="id" style="margin-top:6px">' + x[2] + '</div><div class="mut">' + esc(x[3]) + '</div></div>').join('') + '</div>');
  $$('[data-t]').forEach(x => {
    x.onclick = () => {
      const t = x.dataset.t;
      if (['pagos','ruta','inventario','rapidas','configuracion','preferencias'].indexOf(t) > -1) return mostrarTab(t);
      if (t === 'salir') return pedirSalir();
      if (t === 'modo') { Tema.setModo(Tema.modo() === 'claro' ? 'oscuro' : 'claro'); return vistaMas(); }
      if (t === 'sonido') { SONIDO = !SONIDO; try { localStorage.setItem('sonido', SONIDO ? '1' : '0'); } catch (e) {} if (SONIDO) ping(); return vistaMas(); }
    };
  });
}

async function respaldoAhora() {
  const r = await modal({ titulo: 'Respaldo ahora', texto: 'Se guardará una copia completa de la hoja en tu Drive (se conservan las últimas 14).', ok: 'Hacer respaldo', sinFoco: true });
  if (!r) return;
  busy(true);
  try { await api('respaldo'); toast('💾 Respaldo listo en Drive'); } catch (e) { toast(e.message, 'err'); }
  busy(false);
}

function vistaConfig() {
  if (!esAdminEf()) { pintar('<div class="empty">Solo el administrador puede ver la configuración.</div>'); return; }
  const tiles = [
    ['equipo','🧑‍💼','Equipo y permisos','Usuarios, perfiles y delegación'],
    ['diseno','🎨','Diseño y marca','Logo, fondos y colores para todos'],
    ['respaldo','💾','Respaldo ahora','Copia de la hoja en Drive']
  ];
  pintar('<p class="mut" style="margin-bottom:12px">Estos ajustes afectan a todo el equipo. Tus gustos personales están en “Mis preferencias”.</p><div class="g g2">' +
    tiles.map(x => '<div class="card hv tile anim" data-c="' + x[0] + '"><div class="em">' + x[1] + '</div><div class="id" style="margin-top:6px">' + x[2] + '</div><div class="mut">' + x[3] + '</div></div>').join('') + '</div>');
  $$('[data-c]').forEach(x => { x.onclick = () => { if (x.dataset.c === 'respaldo') respaldoAhora(); else mostrarTab(x.dataset.c); }; });
}

function vistaPrefs() {
  const bs = k => { const v = Tema.pref(k); return v === true ? '1' : (v === false ? '0' : ''); };
  const pre = [['', 'Predeterminado']];
  const sel = (k, label, ops, val) => '<label>' + label + '<select data-pk="' + k + '">' + pre.concat(ops).map(o => '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select></label>';
  const mo = [['1', 'Mostrar'], ['0', 'Ocultar']];
  const acentos = Object.keys(Tema.ACENTOS).map(k => [k, k.charAt(0).toUpperCase() + k.slice(1)]);
  pintar('<div class="card anim" id="prefs-w"><b>Mis preferencias</b>' +
    '<p class="mut" style="margin:4px 0 8px">Solo te afectan a ti. Se guardan en tu usuario y te acompañan en cualquier computadora.</p>' +
    '<div class="fgrid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">' +
      sel('vistaPedidos', 'Vista de pedidos', [['lista', 'Lista'], ['tablero', 'Tablero'], ['tabla', 'Tabla']], Tema.pref('vistaPedidos') || '') +
      sel('vistaClientes', 'Vista de clientes', [['tarjetas', 'Tarjetas'], ['tabla', 'Tabla']], Tema.pref('vistaClientes') || '') +
      sel('vistaInventario', 'Vista de inventario', [['tarjetas', 'Tarjetas'], ['tabla', 'Tabla']], Tema.pref('vistaInventario') || '') +
      sel('periodo', 'Período inicial del dashboard', PERIODOS, Tema.pref('periodo') || '') +
      sel('densidad', 'Densidad', [['comoda', 'Cómoda'], ['compacta', 'Compacta']], Tema.pref('densidad') || '') +
      sel('saludo', 'Saludo y fecha', mo, bs('saludo')) +
      sel('reloj', 'Reloj', mo, bs('reloj')) +
      sel('formatoHora', 'Formato de hora', [['12h', '12 horas'], ['24h', '24 horas']], Tema.pref('formatoHora') || '') +
      sel('frases', 'Frases motivadoras', [['siempre', 'En la bienvenida'], ['ocasional', 'Aviso ocasional'], ['nunca', 'No mostrar']], Tema.pref('frases') || '') +
      sel('modo', 'Modo', [['oscuro', 'Oscuro'], ['claro', 'Claro']], Tema.pref('modo') || '') +
      sel('acento', 'Color de acento', acentos, Tema.pref('acento') || '') +
    '</div><div class="row"><button class="btn xs" id="pr-reset">Restablecer mis preferencias</button></div></div>');
  $('#prefs-w').onchange = e => {
    const s = e.target.closest('select[data-pk]'); if (!s) return;
    const k = s.dataset.pk; let v = s.value;
    if (k === 'saludo' || k === 'reloj') v = v === '1' ? true : (v === '0' ? false : '');
    Tema.setPref(k, v); aplicarPrefsUsuario(); toast('Preferencia guardada');
  };
  $('#pr-reset').onclick = () => { Tema.limpiarPrefs(); aplicarPrefsUsuario(); vistaPrefs(); toast('Preferencias restablecidas'); };
}
async function cambiarEstado(p, estado) {
  const campos = [];
  if (estado === 'DESPACHADO') {
    campos.push({ id: 'transp', label: 'Transportista', valor: p.transp || 'Cargo Expreso', lista: 'transps' });
    campos.push({ id: 'guia', label: 'Número de guía (opcional)', valor: p.guia || '' });
  }
  const r = await modal({ titulo: 'Pasar a ' + estado.replace('_', ' '),
    texto: p.id + ' · ' + (p.nombre || p.tel) + '. Se avisará al cliente por WhatsApp.' + (estado === 'CANCELADO' ? ' El stock se devolverá al inventario.' : ''),
    campos: campos, ok: 'Confirmar', peligro: estado === 'CANCELADO', sinFoco: !campos.length });
  if (!r) return;
  busy(true);
  try {
    const res = await api('estado', { id: p.id, estado: estado, transp: r.transp || '', guia: r.guia || '' });
    if (res.duplicado) toast('Ese pedido ya estaba en ese estado.', 'warn');
    else toast(res.enviado ? '✅ Listo. ' + res.detalle : '⚠️ ' + res.detalle, res.enviado ? '' : 'warn');
  } catch (e) { toast(e.message, 'err'); }
  busy(false); mostrarTab(TAB);
}
async function enviarLink(p) {
  const r = await modal({ titulo: 'Enviar link de pago', texto: p.id + ' · ' + p.total + ' · ' + (p.nombre || p.tel),
    campos: [{ id: 'link', label: 'Link de Zigi', tipo: 'url', valor: p.link || '', ph: 'https://…' }], ok: 'Enviar al cliente' });
  if (!r) return;
  busy(true);
  try { const res = await api('link', { id: p.id, link: r.link }); toast(res.enviado ? '✅ Link enviado al cliente' : '⚠️ ' + res.detalle, res.enviado ? '' : 'warn'); }
  catch (e) { toast(e.message, 'err'); }
  busy(false); mostrarTab(TAB);
}
async function etiqueta(p) {
  const cobrar = p.pago.indexOf('Contra') === 0 ? '\n💵 COBRAR AL ENTREGAR: ' + p.total : '';
  const txt = '📦 PEDIDO ' + p.id + '\n👤 ' + (p.nombre || 'Cliente') + ' · +' + p.tel + '\n📍 ' + p.muni + (p.zona ? ', zona ' + p.zona : '') + ', ' + p.depto +
    '\n🏠 ' + p.dir + '\n🛍️ ' + p.productos.split(' | ').join(', ') + '\n💰 Total: ' + p.total + ' · ' + p.pago + cobrar;
  const r = await modal({ titulo: 'Etiqueta de envío', texto: 'Cópiala y pégala donde la necesites.', campos: [{ id: 't', label: 'Etiqueta', tipo: 'area', valor: txt }], ok: '📋 Copiar' });
  if (r) copiar(txt);
}

/* ================= CLIENTES ================= */
const SEGS = [['todos','Todos'],['vip','⭐ VIP (3+ compras)'],['puntos','Con puntos'],['nuevos','Nuevos (7 días)'],['proceso','Pedido en proceso'],['sin','Sin compras']];
function pasaCli(c) {
  if (CF.seg === 'vip' && c.compras < 3) return false;
  if (CF.seg === 'puntos' && c.puntos < 1) return false;
  if (CF.seg === 'nuevos' && !(c.regTs && Date.now() - c.regTs <= 7 * 86400000)) return false;
  if (CF.seg === 'proceso' && c.pend < 1) return false;
  if (CF.seg === 'sin' && c.compras > 0) return false;
  const q = CF.q.toLowerCase();
  return !q || (c.nombre + ' ' + c.tel).toLowerCase().indexOf(q) > -1;
}
async function vistaClientes() {
  const r = await api('clientes');
  if (TAB !== 'clientes') return;
  CLIENTES = r.clientes;
  pintar('<input id="qcli" type="search" placeholder="🔎 Buscar cliente por nombre o teléfono" value="' + esc(CF.q) + '"><div class="chips" id="cchips" style="margin-top:10px"></div>' +
    '<div class="fgrid"><select id="c_orden">' + [['gasto','💰 Mayor gasto'],['compras','Más compras'],['puntos','Más puntos'],['recientes','Más recientes']].map(o => '<option value="' + o[0] + '"' + (o[0] === CF.orden ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div>' +
    '<div class="mut" id="cres" style="margin:10px 0"></div><div id="clista" class="g g3"></div>');
  $('#qcli').oninput = function () { CF.q = this.value; renderCli(); };
  $('#c_orden').onchange = function () { CF.orden = this.value; renderCli(); };
  $('#clista').onclick = e => { const x = e.target.closest('[data-chat]'); if (x) mostrarTab('chats', x.dataset.chat); };
  renderCli();
}
function renderCli() {
  $('#cchips').innerHTML = SEGS.map(s => '<button class="chip' + (s[0] === CF.seg ? ' on' : '') + '" data-s="' + s[0] + '">' + s[1] + '</button>').join('') +
    '<span style="flex:1"></span>' + [['tarjetas', '▦ Tarjetas'], ['tabla', '▤ Tabla']].map(v => '<button class="chip' + (CF.vista === v[0] ? ' on' : '') + '" data-cv="' + v[0] + '">' + v[1] + '</button>').join('');
  $$('#cchips .chip[data-s]').forEach(c => { c.onclick = () => { CF.seg = c.dataset.s; renderCli(); }; });
  $$('#cchips .chip[data-cv]').forEach(c => { c.onclick = () => { CF.vista = c.dataset.cv; renderCli(); }; });
  const lista = CLIENTES.filter(pasaCli).sort((a, b) => CF.orden === 'compras' ? b.compras - a.compras : CF.orden === 'puntos' ? b.puntos - a.puntos : CF.orden === 'recientes' ? b.regTs - a.regTs : b.t - a.t);
  $('#cres').textContent = lista.length + ' cliente(s) · ' + lista.reduce((a, c) => a + c.puntos, 0).toLocaleString('en-US') + ' puntos en circulación';
  const cont = $('#clista');
  if (CF.vista === 'tabla') {
    cont.className = '';
    cont.innerHTML = lista.length ? '<div class="card tblwrap"><table class="tbl"><thead><tr><th>Cliente</th><th>Teléfono</th><th class="r">Compras</th><th class="r">Puntos</th><th class="r">Total</th><th>En proceso</th><th>Registro</th><th></th></tr></thead><tbody>' +
      lista.slice(0, 300).map(c => '<tr><td><b>' + esc(c.nombre || 'Sin nombre') + '</b></td><td>+' + esc(c.tel) + '</td><td class="r">' + c.compras + '</td><td class="r">' + c.puntos + '</td><td class="r">' + Q(c.t) + '</td><td>' + (c.pend || '—') + '</td><td>' + esc(c.registro) + '</td>' +
        '<td class="acc"><button class="btn sm" data-chat="' + esc(c.tel) + '">💬 Chat</button></td></tr>').join('') + '</tbody></table></div>'
      : '<div class="empty">No hay clientes con estos filtros</div>';
    return;
  }
  cont.className = 'g g3';
  cont.innerHTML = lista.slice(0, 120).map(c => '<div class="card hv"><div class="top" style="align-items:center"><div style="display:flex;gap:10px;align-items:center;min-width:0">' + avatar(c.nombre || c.tel) + '<div style="min-width:0"><div class="id nm">' + esc(c.nombre || 'Sin nombre') + '</div><div class="mut">+' + esc(c.tel) + '</div></div></div><span class="badge">' + c.compras + ' compra(s)</span></div>' +
    '<div class="mut" style="margin-top:8px">⭐ ' + c.puntos + ' puntos · 💰 ' + Q(c.t) + (c.pend ? ' · 📦 ' + c.pend + ' en proceso' : '') + '</div><div class="mut">🎁 ' + esc(c.proxima) + (c.registro ? ' · Registro ' + esc(c.registro) : '') + '</div>' +
    '<div class="row"><button class="btn" data-chat="' + esc(c.tel) + '">💬 Abrir chat</button><a class="btn sec" href="https://wa.me/' + esc(c.tel) + '" target="_blank" rel="noopener">WhatsApp</a></div></div>').join('') || '<div class="empty">No hay clientes con estos filtros</div>';
}

/* ================= MÁS (herramientas) ================= */
function vistaMas() {
  const c = TORRE ? TORRE.cnt : {};
  const verEq = puede('equipo.ver') || puede('equipo.gestionar') || puede('permisos.delegar') || puede('roles.editar');
  const tiles = [
    ['pagos','📸','Verificar pagos', c.comprobantes ? c.comprobantes + ' por revisar' : 'Comprobantes de clientes', puede('pagos.verificar')],
    ['ruta','🗺️','Ruta del día','Entregas por zona', puede('ruta.ver')],
    ['inventario','🏷️','Inventario', puede('inventario.editar') ? 'Stock, precios y fotos' : 'Consulta de catálogo', puede('inventario.ver')],
    ['equipo','🧑‍💼','Equipo y permisos','Jerarquías, perfiles y delegación', verEq],
    ['rapidas','⚡','Respuestas rápidas','Mensajes guardados', puede('rapidas.editar')],
    ['diseno','🎨','Diseño y marca','Logo, fondos y colores para todos', puede('diseno.editar')],
    ['respaldo','💾','Respaldo ahora','Copia de la hoja en Drive', puede('respaldo.ejecutar')],
    ['modo','🌙','Modo ' + (Tema.modo() === 'claro' ? 'claro' : 'oscuro'),'Tu preferencia personal', Tema.cfg().permitirModo],
    ['pref','👤','Mis preferencias','Vistas, reloj y saludo', true],
    ['sonido','🔔','Sonido', SONIDO ? 'Activado' : 'Apagado', true],
    ['salir','⎋','Cerrar sesión', rolEfectivo().n, true]
  ].filter(x => x[4]);
  pintar('<div class="g g2">' + tiles.map(x => '<div class="card hv tile anim" data-t="' + x[0] + '"><div class="em">' + x[1] + '</div><div class="id" style="margin-top:6px">' + x[2] + '</div><div class="mut">' + esc(x[3]) + '</div></div>').join('') + '</div>');
  $$('[data-t]').forEach(x => {
    x.onclick = async () => {
      const t = x.dataset.t;
      if (['pagos','ruta','inventario','equipo','rapidas','diseno'].indexOf(t) > -1) return mostrarTab(t);
      if (t === 'pref') return abrirPrefs();
      if (t === 'salir') return pedirSalir();
      if (t === 'modo') { Tema.setModo(Tema.modo() === 'claro' ? 'oscuro' : 'claro'); return vistaMas(); }
      if (t === 'sonido') { SONIDO = !SONIDO; try { localStorage.setItem('sonido', SONIDO ? '1' : '0'); } catch (e) {} if (SONIDO) ping(); return vistaMas(); }
      if (t === 'respaldo') {
        const r = await modal({ titulo: 'Respaldo ahora', texto: 'Se guardará una copia completa de la hoja en tu Drive (se conservan las últimas 14).', ok: 'Hacer respaldo', sinFoco: true });
        if (!r) return;
        busy(true);
        try { await api('respaldo'); toast('💾 Respaldo listo en Drive'); } catch (e) { toast(e.message, 'err'); }
        busy(false);
      }
    };
  });
}

/* ================= VERIFICAR PAGOS ================= */
async function vistaPagos() {
  const r = await api('comprobantes');
  if (TAB !== 'pagos') return;
  const l = r.pedidos;
  pintar((l.length ? '<p class="mut" style="margin-bottom:10px">Pedidos esperando pago. Revisa la foto del comprobante y confirma con un toque.</p>' : '') +
    (l.length ? '<div class="g g3">' + l.map(p => '<div class="card hv"><div class="top"><div><div class="id">' + esc(p.id) + '</div><div class="mut">' + esc(p.nombre || ('+' + p.tel)) + ' · ' + esc(p.fecha) + '</div></div><b style="color:var(--pri)">' + esc(p.total) + '</b></div>' +
      (p.media ? '<div class="media" data-id="' + esc(p.media) + '" style="margin-top:10px">📷 Cargando imagen…</div>' : '<div class="mut" style="margin-top:10px">Sin foto de comprobante todavía.</div>') +
      (p.comp ? '<div class="warn">📸 Comprobante recibido ' + esc(p.comp) + '</div>' : '') +
      '<div class="row"><button class="btn" data-ok="' + esc(p.id) + '">✅ Confirmar pago</button><button class="btn sec" data-ch="' + esc(p.tel) + '">💬 Chat</button></div></div>').join('') + '</div>'
      : '<div class="empty">No hay pagos pendientes 🎉</div>'));
  $$('[data-ok]').forEach(b => { b.onclick = () => { const p = l.filter(x => x.id === b.dataset.ok)[0]; cambiarEstado({ id: p.id, nombre: p.nombre, tel: p.tel, transp: '', guia: '' }, 'CONFIRMADO'); }; });
  $$('[data-ch]').forEach(b => { b.onclick = () => mostrarTab('chats', b.dataset.ch); });
  cargarMediasVisibles();
}

/* ================= RUTA DEL DÍA ================= */
let RUTA_SOLO_EFECTIVO = false;
async function vistaRuta() {
  const r = await api('pedidos');
  if (TAB !== 'ruta') return;
  PEDIDOS = r.pedidos; pintarRuta();
}
function pintarRuta() {
  const act = ['CONFIRMADO','PREPARANDO','EMPACADO','DESPACHADO','EN_RUTA'];
  const lista = PEDIDOS.filter(p => act.indexOf(p.estado) > -1 && (!RUTA_SOLO_EFECTIVO || tipoPago(p) === 'efectivo'));
  const grupos = {};
  lista.forEach(p => { const k = p.muni + (p.zona && p.zona !== 'N/A' ? ' · zona ' + p.zona : ''); (grupos[k] = grupos[k] || []).push(p); });
  const claves = Object.keys(grupos).sort((a, b) => grupos[b].length - grupos[a].length);
  const cobrar = lista.filter(p => tipoPago(p) === 'efectivo').reduce((a, p) => a + p.totalN, 0);
  pintar('<div class="chips"><button class="chip' + (!RUTA_SOLO_EFECTIVO ? ' on' : '') + '" data-r="0">Todas las entregas</button><button class="chip' + (RUTA_SOLO_EFECTIVO ? ' on' : '') + '" data-r="1">Solo contra entrega</button></div>' +
    '<div class="g g2"><div class="card"><p class="l">Entregas pendientes</p><p class="v">' + lista.length + '</p></div><div class="card"><p class="l">Efectivo por cobrar</p><p class="v">' + Q0(cobrar) + '</p></div></div>' +
    (claves.length ? claves.map(k => {
      const g = grupos[k], q = encodeURIComponent(g[0].muni + (g[0].zona && g[0].zona !== 'N/A' ? ', zona ' + g[0].zona : '') + ', ' + (g[0].depto || 'Guatemala') + ', Guatemala');
      return '<div class="card"><div class="top" style="align-items:center"><b>📍 ' + esc(k) + ' (' + g.length + ')</b><a class="btn sm" href="https://www.google.com/maps/search/?api=1&query=' + q + '" target="_blank" rel="noopener">🗺️ Maps</a></div>' +
        g.map(p => '<div class="top" style="padding:8px 0;border-top:1px solid var(--bd);margin-top:8px"><div class="cb"><div class="id">' + esc(p.nombre || ('+' + p.tel)) + ' · ' + esc(p.id) + '</div><div class="mut">🏠 ' + esc(p.dir) + '</div><div class="mut">' + esc(p.pago) + '</div></div><div style="text-align:right"><b>' + esc(p.total) + '</b><div><span class="badge b-' + esc(p.estado) + '">' + esc(p.estado.replace('_', ' ')) + '</span></div></div></div>').join('') + '</div>';
    }).join('') + '<div class="row"><button class="btn sec" id="rcopiar">📋 Copiar ruta</button></div>' : '<div class="empty">No hay entregas pendientes 🎉</div>'));
  $$('[data-r]').forEach(c => { c.onclick = () => { RUTA_SOLO_EFECTIVO = c.dataset.r === '1'; pintarRuta(); }; });
  const bc = $('#rcopiar');
  if (bc) bc.onclick = () => copiar(claves.map(k => '📍 ' + k + '\n' + grupos[k].map(p => '  • ' + (p.nombre || p.tel) + ' — ' + p.dir + ' — ' + p.total + ' (' + p.pago + ')').join('\n')).join('\n\n'));
}

/* ================= INVENTARIO (admin) ================= */
async function vistaInventario() {
  const r = await api('inventario');
  if (TAB !== 'inventario') return;
  PRODS = r.productos; armarInventario();
}
function armarInventario() {
  pintar('<div class="row" style="margin:0 0 10px"><button class="btn" id="nuevo">＋ Nuevo producto</button></div><input id="qinv" type="search" placeholder="🔎 Buscar producto o SKU" value="' + esc(IF.q) + '">' +
    '<div class="chips" id="ichips" style="margin-top:10px"></div><div class="mut" id="ires" style="margin-bottom:8px"></div><div id="ilista" class="g g3"></div>');
  $('#nuevo').onclick = nuevoProducto;
  $('#qinv').oninput = function () { IF.q = this.value; renderInv(); };
  $('#ilista').onclick = async e => {
    const g = e.target.closest('[data-g]'), f = e.target.closest('[data-f]');
    if (g) {
      const c = g.closest('.card'); busy(true);
      try { await api('producto', { sku: g.dataset.g, producto: c.querySelector('.i-nom').value, descripcion: c.querySelector('.i-desc').value, precio: c.querySelector('.i-precio').value, stock: c.querySelector('.i-stock').value, activo: c.querySelector('.i-activo').value === '1' }); toast('✅ Producto actualizado'); }
      catch (er) { toast(er.message, 'err'); }
      busy(false); vistaInventario();
    }
    if (f) {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = async () => {
        if (!inp.files[0]) return;
        busy(true);
        try { const b64 = await reducirImagen(inp.files[0], 1280); await api('foto', { sku: f.dataset.f, b64: b64 }); toast('📷 Foto guardada y enlazada'); }
        catch (er) { toast(er.message, 'err'); }
        busy(false); vistaInventario();
      };
      inp.click();
    }
  };
  renderInv();
}
function renderInv() {
  const fs = [['todos', 'Todos'], ['bajo', 'Stock bajo'], ['agotado', 'Agotados'], ['oculto', 'Ocultos'], ['sinfoto', 'Sin foto']];
  $('#ichips').innerHTML = fs.map(f => '<button class="chip' + (f[0] === IF.f ? ' on' : '') + '" data-f2="' + f[0] + '">' + f[1] + '</button>').join('') +
    '<span style="flex:1"></span>' + [['tarjetas', '▦ Tarjetas'], ['tabla', '▤ Tabla']].map(v => '<button class="chip' + (IF.vista === v[0] ? ' on' : '') + '" data-iv="' + v[0] + '">' + v[1] + '</button>').join('');
  $$('#ichips .chip[data-f2]').forEach(c => { c.onclick = () => { IF.f = c.dataset.f2; renderInv(); }; });
  $$('#ichips .chip[data-iv]').forEach(c => { c.onclick = () => { IF.vista = c.dataset.iv; renderInv(); }; });
  const q = IF.q.toLowerCase();
  const lista = PRODS.filter(p => {
    if (IF.f === 'bajo' && !(p.stock > 0 && p.stock <= 5)) return false;
    if (IF.f === 'agotado' && p.stock > 0) return false;
    if (IF.f === 'oculto' && p.activo) return false;
    if (IF.f === 'sinfoto' && p.foto) return false;
    return !q || (p.producto + ' ' + p.sku).toLowerCase().indexOf(q) > -1;
  });
  $('#ires').textContent = lista.length + ' producto(s)';
  const cont = $('#ilista');
  if (IF.vista === 'tabla') {
    cont.className = '';
    cont.innerHTML = lista.length ? '<div class="card tblwrap"><table class="tbl"><thead><tr><th>SKU</th><th>Producto</th><th class="r">Precio</th><th class="r">Stock</th><th>Visible</th><th></th></tr></thead><tbody>' +
      lista.map(p => '<tr><td>' + esc(p.sku) + '</td><td><b>' + esc(p.producto) + '</b><div class="mut">' + esc(p.descripcion) + '</div></td><td class="r">' + Q(p.precio) + '</td>' +
        '<td class="r"><span class="badge ' + (p.stock === 0 ? 'b-CANCELADO' : p.stock <= 5 ? 'b-PENDIENTE_PAGO' : 'b-ENTREGADO') + '">' + p.stock + '</span></td>' +
        '<td><span class="badge ' + (p.activo ? 'b-ENTREGADO' : 'b-CANCELADO') + '">' + (p.activo ? 'ACTIVO' : 'OCULTO') + '</span></td>' +
        '<td class="acc"><button class="btn sec sm" data-f="' + esc(p.sku) + '">' + (p.foto ? '📷 Cambiar' : '📷 Subir') + '</button><button class="btn sm" data-e="' + esc(p.sku) + '">Editar</button></td></tr>').join('') + '</tbody></table></div>'
      : '<div class="empty">No hay productos con estos filtros</div>';
    $$('#ilista [data-e]').forEach(b => { b.onclick = () => editarProducto(PRODS.filter(x => x.sku === b.dataset.e)[0]); });
    return;
  }
  cont.className = 'g g3';
  cont.innerHTML = lista.map(p => '<div class="card hv"><div class="top"><div class="mut">' + esc(p.sku) + '</div><span class="badge ' + (p.activo ? 'b-ENTREGADO' : 'b-CANCELADO') + '">' + (p.activo ? 'ACTIVO' : 'OCULTO') + '</span></div>' +
    '<label>Nombre<input class="i-nom" value="' + esc(p.producto) + '"></label><label>Descripción<input class="i-desc" value="' + esc(p.descripcion) + '"></label>' +
    '<div class="fgrid"><label>Precio<input class="i-precio" type="number" inputmode="decimal" step="0.01" min="0" value="' + esc(p.precio) + '"></label><label>Stock<input class="i-stock" type="number" inputmode="numeric" step="1" min="0" value="' + esc(p.stock) + '"></label></div>' +
    '<label>Visible en el catálogo<select class="i-activo"><option value="1"' + (p.activo ? ' selected' : '') + '>Sí</option><option value="0"' + (!p.activo ? ' selected' : '') + '>No</option></select></label>' +
    '<div class="row"><button class="btn sec" data-f="' + esc(p.sku) + '">' + (p.foto ? '📷 Cambiar foto' : '📷 Subir foto') + '</button><button class="btn" data-g="' + esc(p.sku) + '">Guardar</button></div></div>').join('') || '<div class="empty">No hay productos con estos filtros</div>';
}
async function editarProducto(p) {
  if (!p) return;
  const r = await modal({ titulo: 'Editar ' + p.sku, campos: [
    { id: 'producto', label: 'Nombre', valor: p.producto }, { id: 'descripcion', label: 'Descripción', valor: p.descripcion },
    { id: 'precio', label: 'Precio', tipo: 'number', modo: 'decimal', valor: p.precio }, { id: 'stock', label: 'Stock', tipo: 'number', modo: 'numeric', valor: p.stock },
    { id: 'activo', label: 'Visible en el catálogo', tipo: 'select', opciones: [['1', 'Sí'], ['0', 'No']], valor: p.activo ? '1' : '0' }], ok: 'Guardar' });
  if (!r) return;
  busy(true);
  try { await api('producto', { sku: p.sku, producto: r.producto, descripcion: r.descripcion, precio: r.precio, stock: r.stock, activo: r.activo === '1' }); toast('✅ Producto actualizado'); }
  catch (e) { toast(e.message, 'err'); }
  busy(false); vistaInventario();
}
function reducirImagen(file, max) {
  return new Promise((ok, fail) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        ok(c.toDataURL('image/jpeg', 0.85).split(',')[1]);
      };
      img.onerror = () => fail(new Error('No pude leer esa imagen.'));
      img.src = fr.result;
    };
    fr.onerror = () => fail(new Error('No pude leer ese archivo.'));
    fr.readAsDataURL(file);
  });
}
async function nuevoProducto() {
  const r = await modal({ titulo: 'Nuevo producto', campos: [
    { id: 'sku', label: 'SKU (ej. P003)' }, { id: 'producto', label: 'Nombre' }, { id: 'descripcion', label: 'Descripción (opcional)' },
    { id: 'precio', label: 'Precio', tipo: 'number', modo: 'decimal' }, { id: 'stock', label: 'Stock', tipo: 'number', modo: 'numeric' }], ok: 'Crear' });
  if (!r) return;
  busy(true);
  try { await api('producto', { nuevo: true, sku: r.sku, producto: r.producto, descripcion: r.descripcion, precio: r.precio, stock: r.stock, activo: true }); toast('✅ Producto creado · ahora sube su foto'); }
  catch (e) { toast(e.message, 'err'); }
  busy(false); vistaInventario();
}

/* ================= EQUIPO y RÁPIDAS (admin) ================= */

function vistaRapidas() {
  pintar('<div class="card"><b>⚡ Respuestas rápidas</b><p class="mut" style="margin:4px 0 10px">Una por línea (máximo 15). Aparecen sobre la caja de mensaje en cada chat.</p><textarea id="rtxt" rows="10">' + esc(RAPIDAS.join('\n')) + '</textarea><div class="row"><button class="btn" id="rguardar">Guardar</button></div></div>');
  $('#rguardar').onclick = async () => {
    busy(true);
    try { const r = await api('rapidas_guardar', { lista: $('#rtxt').value.split('\n') }); RAPIDAS = r.lista; toast('✅ Respuestas guardadas'); }
    catch (e) { toast(e.message, 'err'); }
    busy(false);
  };
}

/* ================= Actualización automática ================= */
setInterval(() => {
  if (!TOKEN || document.hidden || document.querySelector('.ov')) return;
    if (document.activeElement && document.activeElement.tagName === 'SELECT') return;
  frasesOcasional();
  TICK++;
  if (TAB === 'chats' && CHAT && puede('chats.ver')) pollChat(false);
  if (TICK % 3 === 0 && puede('chats.ver')) cargarChats().catch(() => {});
  if (TICK % 6 === 0) {
    api('config').then(r => Tema.aplicar(r)).catch(() => {});
    api('mi_sesion').then(r => {
      if (PERMS_VER && r.version !== PERMS_VER) {
        ME = r.ses; PERMS = ME.perms || []; ADMIN = ME.j === 'admin';
        if (!SIM) { armarNav(); toast('Tus permisos fueron actualizados'); }
      }
      PERMS_VER = r.version;
    }).catch(() => {});
  }
  if (TICK % 8 === 0) {
    if (TAB === 'inicio') (puede('dashboard.ver') ? vistaInicioAdmin(true) : vistaInicioOp(true)).catch(() => {});
    if (TAB === 'pedidos' && puede('pedidos.ver') && !(document.activeElement && /INPUT|SELECT/.test(document.activeElement.tagName)))
      api('pedidos').then(r => { if (TAB === 'pedidos' && !document.querySelector('.ov')) { PEDIDOS = r.pedidos; renderPedLista(); } }).catch(() => {});
  }
}, 8000);

/* Diseño global: tema.js ya aplicó la copia guardada; aquí se sincroniza con el servidor (también antes de entrar) */
api('config').then(r => Tema.aplicar(r)).catch(() => {});

// Persistir preferencias del usuario en la hoja "Preferencias" (con retardo para agrupar cambios)
let _prefTimer = 0;
Tema.alGuardar(o => {
  clearTimeout(_prefTimer);
  _prefTimer = setTimeout(() => { if (TOKEN) api('prefs_guardar', { prefs: o }).catch(() => {}); }, 700);
});