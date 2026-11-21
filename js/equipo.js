/* ===== ETAPA 2: Jerarquías, Delegación y Simulador "Ver como..." ===== */
let PERMS = [], SIM = null, EQ_DATA = null, ETAB = 'usuarios', PERMS_VER = 0;

const JER_NOM = { admin: 'Administrador', supervisor: 'Supervisor', operario: 'Operario' };
const JER_COL = { admin: 'b-CONFIRMADO', supervisor: 'b-DESPACHADO', operario: 'b-ENTREGADO' };

function esAdminReal() { return !!(ME && ME.j === 'admin'); }
function esAdminEf() { const r = rolEfectivo(); return !!(r && r.j === 'admin'); }
function rolEfectivo() { return SIM || ME; }
function puede(perm) {
  if (SIM) return SIM.j === 'admin' || SIM.perms.indexOf(perm) > -1;
  if (!ME) return false;
  return ME.j === 'admin' || PERMS.indexOf(perm) > -1;
}

function renderSimBar() {
  const bar = $('#simbar');
  if (!bar) return;
  if (!SIM) { bar.classList.add('hide'); bar.innerHTML = ''; return; }
  bar.classList.remove('hide');
  bar.innerHTML = '<span>Viendo como <b>' + esc(SIM.n) + '</b> (' + esc(JER_NOM[SIM.j] || SIM.j) + ' · ' + esc(SIM.pNombre || SIM.p) + ')</span>' +
    '<button class="btn sm sec" id="sim-exit">Salir de vista previa</button>';
  $('#sim-exit').onclick = salirSim;
}

function entrarSim(info) {
  if (!esAdminReal()) return;
  SIM = info;
  renderSimBar();
  $('#quien').textContent = '👁 ' + SIM.n;
  armarNav();
  mostrarTab('inicio');
  toast('Vista previa activa: ' + SIM.n);
}

function salirSim() {
  SIM = null;
  renderSimBar();
  $('#quien').textContent = (ME.j === 'admin' ? '👑 ' : '') + ME.n;
  armarNav();
  mostrarTab('equipo');
}

function fechaLocalISO(horasMas) {
  const d = new Date(Date.now() + horasMas * 3600000);
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
}

function fmtExp(v) {
  if (!v || v === 'permanente') return 'Permanente';
  return 'Hasta ' + String(v).replace('T', ' ');
}

function agruparCat(cat) {
  const m = {};
  cat.forEach(x => { (m[x.g] = m[x.g] || []).push(x); });
  return m;
}

async function vistaEquipo() {
  if (!esAdminEf()) { pintar('<div class="empty">Solo el administrador puede ver esta sección.</div>'); return; }
  EQ_DATA = await api('equipo');
  if (TAB !== 'equipo') return;
  renderEquipo();
}

function renderEquipo() {
  const d = EQ_DATA;
  const totalDel = d.equipo.reduce((acc, u) => acc + Object.keys(u.extra || {}).length + (u.blq || []).length, 0);
  const tabs = [
    ['usuarios', 'Usuarios (' + d.equipo.length + ')'],
    ['roles', 'Perfiles y Roles (' + d.roles.length + ')'],
    ['delegaciones', 'Delegaciones activas' + (totalDel ? ' (' + totalDel + ')' : '')]
  ];
  let body = '';
  if (ETAB === 'usuarios') body = htmlUsuarios(d);
  else if (ETAB === 'roles') body = htmlRoles(d);
  else body = htmlDelegaciones(d);

  pintar(
    '<div class="chips" id="etabs">' + tabs.map(t => '<button class="chip' + (t[0] === ETAB ? ' on' : '') + '" data-et="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' +
    body
  );
  $$('#etabs .chip').forEach(c => { c.onclick = () => { ETAB = c.dataset.et; renderEquipo(); }; });
  ligarEventosEquipo();
}

function htmlUsuarios(d) {
  const puedeCrear = puede('equipo.gestionar');
  const puedeDel = puede('permisos.delegar');
  const cards = d.equipo.map(u => {
    const nExt = Object.keys(u.extra || {}).length, nBlq = (u.blq || []).length;
    const puedeEditarEste = puedeCrear && (esAdminReal() || u.j === 'operario');
    const puedeDelegarEste = puedeDel && u.j !== 'admin' && (esAdminReal() || u.j === 'operario');
    const puedeSim = esAdminReal() && u.u !== ME.u;
    return '<div class="card hv anim">' +
      '<div class="top" style="align-items:center">' +
        '<div style="display:flex;gap:10px;align-items:center;min-width:0">' + avatar(u.n) +
          '<div style="min-width:0"><div class="id nm">' + esc(u.n) + '</div><div class="mut">@' + esc(u.u) + '</div></div>' +
        '</div>' +
        '<span class="badge ' + (u.activo ? (JER_COL[u.j] || '') : 'b-CANCELADO') + '">' + (u.activo ? esc(JER_NOM[u.j] || u.j) : 'PAUSADO') + '</span>' +
      '</div>' +
      '<div class="mut" style="margin-top:8px">Perfil: <b>' + esc(u.pNombre) + '</b> · ' + u.permsEf.length + ' permisos</div>' +
      '<div class="mut">' + u.msgs + ' msg enviados' + (u.ult ? ' · último ' + esc(u.ult) : '') + '</div>' +
      ((nExt || nBlq) ? '<div class="row" style="margin-top:6px">' +
        (nExt ? '<span class="badge b-ENTREGADO">+' + nExt + ' delegado(s)</span>' : '') +
        (nBlq ? '<span class="badge b-CANCELADO">-' + nBlq + ' bloqueado(s)</span>' : '') +
      '</div>' : '') +
      '<div class="row">' +
        (puedeEditarEste ? '<button class="btn sec sm" data-uedit="' + esc(u.u) + '">Editar</button>' : '') +
        (puedeDelegarEste ? '<button class="btn sm" data-udel="' + esc(u.u) + '">Delegar</button>' : '') +
        (puedeSim ? '<button class="btn sec sm" data-usim="' + esc(u.u) + '">👁 Ver como</button>' : '') +
      '</div></div>';
  }).join('');
  return (puedeCrear ? '<div class="row" style="margin:0 0 12px"><button class="btn" id="unuevo">＋ Nuevo usuario</button></div>' : '') +
    '<div class="g g3">' + cards + '</div>';
}

function htmlRoles(d) {
  const editar = puede('roles.editar');
  const catPorK = {}; d.catalogo.forEach(c => { catPorK[c.k] = c.n; });
  return '<div class="g g3">' + d.roles.map(r => {
    return '<div class="card hv anim">' +
      '<div class="top"><div><div class="id">' + esc(r.nombre) + '</div><div class="mut">' + esc(r.desc) + '</div></div>' +
      '<span class="badge ' + (JER_COL[r.jerarquia] || '') + '">' + esc(JER_NOM[r.jerarquia] || r.jerarquia) + '</span></div>' +
      '<div class="mut" style="margin-top:8px"><b>' + r.perms.length + '</b> de ' + d.catalogo.length + ' permisos activos</div>' +
      '<div class="row" style="margin-top:10px">' +
        (editar && r.id !== 'admin' ? '<button class="btn sm" data-redit="' + esc(r.id) + '">Editar permisos</button>' : '') +
        (esAdminReal() && r.id !== 'admin' ? '<button class="btn sec sm" data-rsim="' + esc(r.id) + '">👁 Ver como perfil</button>' : '') +
      '</div></div>';
  }).join('') + '</div>';
}

function htmlDelegaciones(d) {
  const catPorK = {}; d.catalogo.forEach(c => { catPorK[c.k] = c.n; });
  const items = [];
  d.equipo.forEach(u => {
    Object.keys(u.extra || {}).forEach(k => items.push({ u, k, tipo: 'extra', exp: u.extra[k] }));
    (u.blq || []).forEach(k => items.push({ u, k, tipo: 'blq', exp: '' }));
  });
  if (!items.length) return '<div class="empty">No hay delegaciones ni restricciones individuales activas.</div>';
  const puedeDel = puede('permisos.delegar');
  return '<div class="g g3">' + items.map(it => {
    const revocar = puedeDel && (esAdminReal() || it.u.j === 'operario');
    return '<div class="card hv anim">' +
      '<div class="top"><div><div class="id">' + esc(it.u.n) + '</div><div class="mut">@' + esc(it.u.u) + ' · ' + esc(it.u.pNombre) + '</div></div>' +
      '<span class="badge ' + (it.tipo === 'extra' ? 'b-ENTREGADO' : 'b-CANCELADO') + '">' + (it.tipo === 'extra' ? '+ Delegado' : '- Bloqueado') + '</span></div>' +
      '<div style="margin-top:8px;font-weight:600">' + esc(catPorK[it.k] || it.k) + '</div>' +
      (it.tipo === 'extra' ? '<div class="mut">' + esc(fmtExp(it.exp)) + '</div>' : '<div class="mut">Retirado de su perfil base</div>') +
      (revocar ? '<div class="row"><button class="btn red sm" data-rev-u="' + esc(it.u.u) + '" data-rev-k="' + esc(it.k) + '" data-rev-t="' + it.tipo + '">Revocar</button></div>' : '') +
    '</div>';
  }).join('') + '</div>';
}

function ligarEventosEquipo() {
  const bn = $('#unuevo'); if (bn) bn.onclick = () => abrirModalUsuario(null);
  $$('[data-uedit]').forEach(b => { b.onclick = () => abrirModalUsuario(EQ_DATA.equipo.filter(x => x.u === b.dataset.uedit)[0]); });
  $$('[data-udel]').forEach(b => { b.onclick = () => abrirDrawerDelegar(EQ_DATA.equipo.filter(x => x.u === b.dataset.udel)[0]); });
  $$('[data-usim]').forEach(b => {
    b.onclick = () => {
      const u = EQ_DATA.equipo.filter(x => x.u === b.dataset.usim)[0];
      if (u) entrarSim({ n: u.n, j: u.j, p: u.p, pNombre: u.pNombre, perms: u.permsEf });
    };
  });
  $$('[data-redit]').forEach(b => { b.onclick = () => abrirDrawerRol(EQ_DATA.roles.filter(x => x.id === b.dataset.redit)[0]); });
  $$('[data-rsim]').forEach(b => {
    b.onclick = () => {
      const r = EQ_DATA.roles.filter(x => x.id === b.dataset.rsim)[0];
      if (r) entrarSim({ n: 'Perfil ' + r.nombre, j: r.jerarquia, p: r.id, pNombre: r.nombre, perms: r.perms });
    };
  });
  $$('[data-rev-u]').forEach(b => {
    b.onclick = async () => {
      const u = EQ_DATA.equipo.filter(x => x.u === b.dataset.revU)[0]; if (!u) return;
      const extra = Object.assign({}, u.extra || {});
      const blq = (u.blq || []).slice();
      if (b.dataset.revT === 'extra') delete extra[b.dataset.revK];
      else { const idx = blq.indexOf(b.dataset.revK); if (idx > -1) blq.splice(idx, 1); }
      busy(true);
      try { await api('delegar', { u: u.u, extra: extra, blq: blq }); toast('Permiso revocado'); }
      catch (e) { toast(e.message, 'err'); }
      busy(false); vistaEquipo();
    };
  });
}

async function abrirModalUsuario(u) {
  const nuevo = !u;
  const perfilesOp = EQ_DATA.roles.filter(r => r.jerarquia === 'operario').map(r => [r.id, r.nombre]);
  const jers = esAdminReal() ? [['operario', 'Operario (por perfil)'], ['supervisor', 'Supervisor'], ['admin', 'Administrador']] : [['operario', 'Operario (por perfil)']];
  const campos = [];
  if (nuevo) campos.push({ id: 'u', label: 'Usuario (sin espacios, ej. sofia)', ph: 'ej. sofia' });
  campos.push({ id: 'n', label: 'Nombre visible', valor: u ? u.n : '' });
  campos.push({ id: 'pin', label: nuevo ? 'PIN de acceso (mínimo 4 dígitos)' : 'Nuevo PIN (dejar vacío para no cambiar)', tipo: 'password' });
  campos.push({ id: 'j', label: 'Jerarquía', tipo: 'select', opciones: jers, valor: u ? u.j : 'operario' });
  campos.push({ id: 'p', label: 'Perfil operativo (aplica si es Operario)', tipo: 'select', opciones: perfilesOp, valor: (u && u.j === 'operario') ? u.p : 'op_ventas' });
  if (!nuevo) campos.push({ id: 'activo', label: 'Estado de la cuenta', tipo: 'select', opciones: [['1', 'Activo'], ['0', 'Pausado (sin acceso)']], valor: u.activo ? '1' : '0' });

  const r = await modal({ titulo: nuevo ? 'Nuevo usuario' : 'Editar a ' + u.n, campos: campos, ok: nuevo ? 'Crear usuario' : 'Guardar cambios' });
  if (!r) return;
  busy(true);
  try {
    await api('usuario_guardar', {
      nuevo: nuevo, u: nuevo ? r.u : u.u, n: r.n, pin: r.pin, j: r.j, p: r.p,
      activo: nuevo ? true : r.activo === '1'
    });
    toast(nuevo ? 'Usuario creado' : 'Usuario actualizado');
  } catch (e) { toast(e.message, 'err'); }
  busy(false); vistaEquipo();
}

function abrirDrawerDelegar(u) {
  const rol = EQ_DATA.roles.filter(r => r.id === u.p)[0] || { perms: [] };
  const baseSet = {}; rol.perms.forEach(k => { baseSet[k] = true; });
  const extra = Object.assign({}, u.extra || {});
  const blq = {}; (u.blq || []).forEach(k => { blq[k] = true; });
  const grupos = agruparCat(EQ_DATA.catalogo);
  const sens = EQ_DATA.sensibles || [];

  const ov = document.createElement('div'); ov.className = 'ov';
  const box = document.createElement('div'); box.className = 'modal';
  box.innerHTML = '<h3>Delegar permisos · ' + esc(u.n) + '</h3>' +
    '<p class="mut">Perfil base: <b>' + esc(u.pNombre) + '</b>. Agrega permisos extra (permanentes o temporales) o bloquea alguno de su perfil.</p>' +
    '<div id="del-list">' + Object.keys(grupos).map(g => {
      return '<div class="pgrp"><div class="pgt">' + esc(g) + '</div>' + grupos[g].map(c => {
        const esBase = !!baseSet[c.k];
        const esSens = sens.indexOf(c.k) > -1;
        const bloqueadoSub = !esAdminReal() && (esSens || !puede(c.k));
        const activo = esBase ? !blq[c.k] : !!extra[c.k];
        const expVal = extra[c.k] || 'permanente';
        return '<div class="prow">' +
          '<label class="pchk"><input type="checkbox" data-pk="' + c.k + '" data-base="' + (esBase ? '1' : '0') + '"' + (activo ? ' checked' : '') + (bloqueadoSub ? ' disabled' : '') + '> ' +
            '<span>' + esc(c.n) + (esBase ? ' <i class="ptag">Rol</i>' : '') + (esSens ? ' <i class="ptag warn">Llave maestra</i>' : '') + '</span></label>' +
          (!esBase ? '<div class="pexp' + (activo ? '' : ' hide') + '" data-expbox="' + c.k + '">' +
            '<select data-expsel="' + c.k + '">' +
              '<option value="permanente"' + (expVal === 'permanente' ? ' selected' : '') + '>Permanente</option>' +
              '<option value="24h">Por 24 horas</option>' +
              '<option value="72h">Por 3 días</option>' +
              '<option value="168h">Por 7 días</option>' +
              '<option value="fecha"' + (expVal !== 'permanente' ? ' selected' : '') + '>Fecha exacta…</option>' +
            '</select>' +
            '<input type="datetime-local" data-expdt="' + c.k + '" class="' + (expVal !== 'permanente' ? '' : 'hide') + '" value="' + esc(expVal !== 'permanente' ? expVal : fechaLocalISO(24)) + '">' +
          '</div>' : '') +
        '</div>';
      }).join('') + '</div>';
    }).join('') + '</div>' +
    '<div class="row" style="margin-top:14px"><button class="btn sec" id="dl_no">Cancelar</button><button class="btn" id="dl_ok">Guardar delegación</button></div>';

  ov.appendChild(box); document.body.appendChild(ov);
  box.querySelector('#dl_no').onclick = () => ov.remove();

  box.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.pk && t.dataset.base === '0') {
      const eb = box.querySelector('[data-expbox="' + t.dataset.pk + '"]');
      if (eb) eb.classList.toggle('hide', !t.checked);
    }
    if (t.dataset.expsel) {
      const dt = box.querySelector('[data-expdt="' + t.dataset.expsel + '"]');
      if (dt) dt.classList.toggle('hide', t.value !== 'fecha');
    }
  });

  box.querySelector('#dl_ok').onclick = async () => {
    const nuevoExtra = {}, nuevoBlq = [];
    box.querySelectorAll('[data-pk]').forEach(ch => {
      const k = ch.dataset.pk, esBase = ch.dataset.base === '1';
      if (esBase && !ch.checked) nuevoBlq.push(k);
      if (!esBase && ch.checked) {
        const sel = box.querySelector('[data-expsel="' + k + '"]').value;
        if (sel === 'permanente') nuevoExtra[k] = 'permanente';
        else if (sel === '24h') nuevoExtra[k] = fechaLocalISO(24);
        else if (sel === '72h') nuevoExtra[k] = fechaLocalISO(72);
        else if (sel === '168h') nuevoExtra[k] = fechaLocalISO(168);
        else nuevoExtra[k] = box.querySelector('[data-expdt="' + k + '"]').value || 'permanente';
      }
    });
    ov.remove(); busy(true);
    try { await api('delegar', { u: u.u, extra: nuevoExtra, blq: nuevoBlq }); toast('Delegación guardada'); }
    catch (e) { toast(e.message, 'err'); }
    busy(false); vistaEquipo();
  };
}

function abrirDrawerRol(rol) {
  const set = {}; rol.perms.forEach(k => { set[k] = true; });
  const grupos = agruparCat(EQ_DATA.catalogo);
  const ov = document.createElement('div'); ov.className = 'ov';
  const box = document.createElement('div'); box.className = 'modal';
  box.innerHTML = '<h3>Perfil · ' + esc(rol.nombre) + '</h3>' +
    '<label>Nombre del perfil<input id="rn_nom" value="' + esc(rol.nombre) + '"></label>' +
    '<label>Descripción<input id="rn_desc" value="' + esc(rol.desc) + '"></label>' +
    Object.keys(grupos).map(g => '<div class="pgrp"><div class="pgt">' + esc(g) + '</div>' +
      grupos[g].map(c => '<div class="prow"><label class="pchk"><input type="checkbox" data-rk="' + c.k + '"' + (set[c.k] ? ' checked' : '') + '> <span>' + esc(c.n) + '</span></label></div>').join('') +
    '</div>').join('') +
    '<div class="row" style="margin-top:14px"><button class="btn sec" id="rl_no">Cancelar</button><button class="btn" id="rl_ok">Guardar perfil</button></div>';

  ov.appendChild(box); document.body.appendChild(ov);
  box.querySelector('#rl_no').onclick = () => ov.remove();
  box.querySelector('#rl_ok').onclick = async () => {
    const perms = Array.from(box.querySelectorAll('[data-rk]:checked')).map(x => x.dataset.rk);
    const nombre = box.querySelector('#rn_nom').value.trim();
    const desc = box.querySelector('#rn_desc').value.trim();
    ov.remove(); busy(true);
    try { await api('rol_guardar', { id: rol.id, nombre: nombre, desc: desc, perms: perms }); toast('Perfil actualizado para el equipo'); }
    catch (e) { toast(e.message, 'err'); }
    busy(false); vistaEquipo();
  };
}