/***** ETAPA 2: 3 JERARQUÍAS, ROLES Y DELEGACIÓN *****/
const H_ROLES = 'Roles';
const H_USUARIOS = 'Usuarios';

const PERMISOS_CAT = [
  { k: 'dashboard.ver',     g: 'Inicio y Finanzas',     n: 'Ver dashboard financiero y métricas' },
  { k: 'torre.ver',         g: 'Inicio y Finanzas',     n: 'Ver torre de control y alertas' },
  { k: 'chats.ver',         g: 'Chats / WhatsApp',      n: 'Ver chats propios y libres' },
  { k: 'chats.ver_todos',   g: 'Chats / WhatsApp',      n: 'Ver chats asignados a otros empleados' },
  { k: 'chats.enviar',      g: 'Chats / WhatsApp',      n: 'Responder mensajes de WhatsApp' },
  { k: 'chats.modo',        g: 'Chats / WhatsApp',      n: 'Tomar, devolver al bot o reasignar chats' },
  { k: 'rapidas.editar',    g: 'Chats / WhatsApp',      n: 'Editar respuestas rápidas' },
  { k: 'pedidos.ver',       g: 'Pedidos y Logística',   n: 'Ver lista y tablero de pedidos' },
  { k: 'pedidos.estado',    g: 'Pedidos y Logística',   n: 'Cambiar estados de pedidos' },
  { k: 'pedidos.cancelar',  g: 'Pedidos y Logística',   n: 'Cancelar pedidos (devuelve stock)' },
  { k: 'pedidos.link',      g: 'Pedidos y Logística',   n: 'Enviar o reenviar links de pago' },
  { k: 'pagos.verificar',   g: 'Pedidos y Logística',   n: 'Verificar comprobantes y confirmar pagos' },
  { k: 'ruta.ver',          g: 'Pedidos y Logística',   n: 'Ver ruta del día y entregas por zona' },
  { k: 'clientes.ver',      g: 'Clientes e Inventario', n: 'Ver directorio de clientes y puntos' },
  { k: 'inventario.ver',    g: 'Clientes e Inventario', n: 'Consultar catálogo e inventario' },
  { k: 'inventario.editar', g: 'Clientes e Inventario', n: 'Editar productos, precios, stock y fotos' },
  { k: 'equipo.ver',        g: 'Administración',        n: 'Ver equipo y actividad de mensajes' },
  { k: 'equipo.gestionar',  g: 'Administración',        n: 'Crear, editar y pausar usuarios' },
  { k: 'permisos.delegar',  g: 'Administración',        n: 'Delegar permisos individuales o temporales' },
  { k: 'roles.editar',      g: 'Administración',        n: 'Editar matriz de perfiles y roles' },
  { k: 'diseno.editar',     g: 'Administración',        n: 'Centralizador de diseño y marca global' },
  { k: 'respaldo.ejecutar', g: 'Administración',        n: 'Ejecutar respaldo manual en Drive' }
];

const PERMISOS_VALIDOS = PERMISOS_CAT.map(function (x) { return x.k; });
const PERMISOS_SENSIBLES = ['diseno.editar', 'roles.editar', 'respaldo.ejecutar', 'permisos.delegar'];

const ROLES_DEFAULT = [
  { id: 'admin', nombre: 'Administrador', jerarquia: 'admin', desc: 'Control total del sistema, diseño, finanzas y permisos', perms: PERMISOS_VALIDOS.slice() },
  { id: 'supervisor', nombre: 'Supervisor', jerarquia: 'supervisor', desc: 'Coordina equipo, todos los chats, pedidos, pagos e inventario',
    perms: ['dashboard.ver','torre.ver','chats.ver','chats.ver_todos','chats.enviar','chats.modo','rapidas.editar','pedidos.ver','pedidos.estado','pedidos.cancelar','pedidos.link','pagos.verificar','ruta.ver','clientes.ver','inventario.ver','inventario.editar','equipo.ver','equipo.gestionar'] },
  { id: 'op_ventas', nombre: 'Ventas y Atención', jerarquia: 'operario', desc: 'Atiende chats propios/libres, pedidos, links y clientes',
    perms: ['torre.ver','chats.ver','chats.enviar','chats.modo','pedidos.ver','pedidos.estado','pedidos.link','clientes.ver','inventario.ver'] },
  { id: 'op_bodega', nombre: 'Operaciones y Bodega', jerarquia: 'operario', desc: 'Prepara y despacha pedidos, gestiona stock y rutas',
    perms: ['torre.ver','pedidos.ver','pedidos.estado','ruta.ver','inventario.ver','inventario.editar'] },
  { id: 'op_reparto', nombre: 'Campo y Repartidor', jerarquia: 'operario', desc: 'Consulta ruta del día y actualiza entregas',
    perms: ['torre.ver','ruta.ver','pedidos.ver','pedidos.estado'] },
  { id: 'op_caja', nombre: 'Caja y Finanzas', jerarquia: 'operario', desc: 'Verifica pagos, consulta dashboard y clientes',
    perms: ['dashboard.ver','torre.ver','pedidos.ver','pedidos.link','pagos.verificar','clientes.ver'] }
];

function hashPin_(usuario, pin) {
  const raw = String(usuario || '').trim().toLowerCase() + '::' + String(pin || '') + '::CRM_V2';
  const dig = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return 'sha256:' + dig.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function verificarPin_(usuario, pinIngresado, guardado) {
  const g = String(guardado || '').trim();
  if (!g) return false;
  if (g.indexOf('sha256:') === 0) return hashPin_(usuario, pinIngresado) === g;
  return String(pinIngresado) === g; // respaldo por si editas un PIN manual en la hoja
}

function parseJsonSeg_(raw, def) {
  if (!raw) return def;
  try { const v = JSON.parse(String(raw)); return v !== null && v !== undefined ? v : def; }
  catch (e) { return def; }
}

function invalidarRolesCache_() {
  const c = CacheService.getScriptCache();
  c.removeAll(['roles_v2', 'usuarios_v2']);
  c.put('perms_ver', String(Date.now()), 21600);
}

function versionPerms_() {
  const c = CacheService.getScriptCache();
  let v = c.get('perms_ver');
  if (!v) { v = String(Date.now()); c.put('perms_ver', v, 21600); }
  return Number(v) || 0;
}

function hojaRoles_() {
  const h = hojaConEncabezado_(H_ROLES, ['ID', 'Nombre', 'Jerarquia', 'Descripcion', 'Permisos', 'Actualizado']);
  if (h.getLastRow() < 2) {
    const ahora = new Date();
    const filas = ROLES_DEFAULT.map(function (r) {
      return [r.id, r.nombre, r.jerarquia, r.desc, JSON.stringify(r.perms), ahora];
    });
    h.getRange(2, 1, filas.length, 6).setValues(filas);
  }
  return h;
}

function empleadosLegacy_() {
  const p = PropertiesService.getScriptProperties();
  const raw = p.getProperty('EMPLEADOS');
  if (raw) { try { const l = JSON.parse(raw); if (Array.isArray(l) && l.length) return l; } catch (e) {} }
  const pin = p.getProperty('PANEL_PIN');
  if (pin) return [{ u: 'admin', pin: pin, n: 'Administrador', r: 'admin' }];
  return [];
}

function hojaUsuarios_() {
  const h = hojaConEncabezado_(H_USUARIOS, ['Usuario', 'PIN_Hash', 'Nombre', 'Jerarquia', 'Perfil', 'Activo', 'Permisos_Extra', 'Permisos_Bloqueados', 'Creado', 'Actualizado']);
  if (h.getLastRow() < 2) {
    const legacy = empleadosLegacy_();
    if (!legacy.length) throw new Error('Configura EMPLEADOS en Propiedades del script para la importación inicial.');
    const ahora = new Date();
    const filas = legacy.map(function (e) {
      const u = String(e.u || '').trim().toLowerCase();
      const esAdmin = e.r === 'admin';
      const j = esAdmin ? 'admin' : (e.r === 'supervisor' ? 'supervisor' : 'operario');
      const p = esAdmin ? 'admin' : (j === 'supervisor' ? 'supervisor' : 'op_ventas');
      return [seguro_(u), hashPin_(u, e.pin), seguro_(e.n || u), j, p, 'SI', '{}', '[]', ahora, ahora];
    });
    h.getRange(2, 1, filas.length, 10).setValues(filas);
  }
  return h;
}

function rolesMapa_() {
  const cache = CacheService.getScriptCache();
  const c = cache.get('roles_v2');
  if (c) { try { return JSON.parse(c); } catch (e) {} }
  const h = hojaRoles_();
  const last = h.getLastRow();
  const lista = [], porId = {};
  if (last >= 2) {
    h.getRange(2, 1, last - 1, 5).getValues().forEach(function (r) {
      const id = String(r[0] || '').trim();
      if (!id) return;
      const perms = id === 'admin'
        ? PERMISOS_VALIDOS.slice()
        : parseJsonSeg_(r[4], []).filter(function (k) { return PERMISOS_VALIDOS.indexOf(k) > -1; });
      const obj = { id: id, nombre: String(r[1] || id), jerarquia: String(r[2] || 'operario'), desc: String(r[3] || ''), perms: perms };
      lista.push(obj); porId[id] = obj;
    });
  }
  const out = { lista: lista, porId: porId };
  cache.put('roles_v2', JSON.stringify(out), 300);
  return out;
}

function usuariosLista_() {
  const cache = CacheService.getScriptCache();
  const c = cache.get('usuarios_v2');
  if (c) { try { return JSON.parse(c); } catch (e) {} }
  const h = hojaUsuarios_();
  const last = h.getLastRow();
  const out = [];
  if (last >= 2) {
    h.getRange(2, 1, last - 1, 10).getValues().forEach(function (r, idx) {
      const u = String(r[0] || '').trim().toLowerCase();
      if (!u) return;
      const j = ['admin', 'supervisor', 'operario'].indexOf(String(r[3])) > -1 ? String(r[3]) : 'operario';
      const p = String(r[4] || (j === 'operario' ? 'op_ventas' : j));
      out.push({
        fila: idx + 2, u: u, pinHash: String(r[1] || ''), n: String(r[2] || u),
        j: j, p: p, activo: String(r[5] || 'SI').toUpperCase() !== 'NO',
        extra: parseJsonSeg_(r[6], {}), blq: parseJsonSeg_(r[7], []),
        creado: fechaCorta_(r[8])
      });
    });
  }
  cache.put('usuarios_v2', JSON.stringify(out), 120);
  return out;
}

function parseExpMs_(v) {
  if (!v || v === 'permanente') return Infinity;
  const s = String(v).trim();
  try {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
      return Utilities.parseDate(s.substring(0, 16), TZ, "yyyy-MM-dd'T'HH:mm").getTime();
    }
  } catch (e) {}
  const ms = new Date(s).getTime();
  return isFinite(ms) ? ms : 0;
}

function calcularPerms_(uObj, rolesPorId) {
  if (uObj.j === 'admin') return { perms: PERMISOS_VALIDOS.slice(), extraActivos: {} };
  const base = (rolesPorId[uObj.p] || rolesPorId[uObj.j] || { perms: [] }).perms;
  const set = {};
  base.forEach(function (k) { set[k] = true; });
  const ahora = Date.now(), extraActivos = {};
  const extra = (uObj.extra && typeof uObj.extra === 'object') ? uObj.extra : {};
  Object.keys(extra).forEach(function (k) {
    if (PERMISOS_VALIDOS.indexOf(k) < 0) return;
    if (parseExpMs_(extra[k]) > ahora) { set[k] = true; extraActivos[k] = extra[k]; }
  });
  (Array.isArray(uObj.blq) ? uObj.blq : []).forEach(function (k) { delete set[k]; });
  return { perms: Object.keys(set), extraActivos: extraActivos };
}

function panelLogin_(usuario, pin) {
  const cache = CacheService.getScriptCache();
  const u = String(usuario || '').trim().toLowerCase().substring(0, 40);
  const kf = 'login_fallos_' + u;
  const fallos = parseInt(cache.get(kf), 10) || 0;
  if (fallos >= 5) throw new Error('Demasiados intentos. Espera 15 minutos.');
  const usr = usuariosLista_().filter(function (x) { return x.u === u; })[0];
  if (!usr || !verificarPin_(u, pin, usr.pinHash)) {
    cache.put(kf, String(fallos + 1), 900);
    throw new Error('Usuario o PIN incorrecto');
  }
  if (!usr.activo) throw new Error('Tu usuario está pausado. Contacta al administrador.');
  cache.remove(kf);
  const token = Utilities.getUuid() + Utilities.getUuid();
  cache.put('ses_' + token, JSON.stringify({ u: u }), 21600);
  bitacora_('LOGIN', '', '', usr.n + ' (' + usr.j + ')');
  return { token: token };
}

function sesion_(token) {
  const raw = CacheService.getScriptCache().get('ses_' + String(token || ''));
  if (!raw) throw new Error('SESION');
  const s = JSON.parse(raw);
  const usr = usuariosLista_().filter(function (x) { return x.u === s.u; })[0];
  if (!usr || !usr.activo) throw new Error('SESION');
  const rm = rolesMapa_();
  const calc = calcularPerms_(usr, rm.porId);
  const rol = rm.porId[usr.p] || { nombre: usr.j };
  return { u: usr.u, n: usr.n, r: usr.j === 'admin' ? 'admin' : usr.j, j: usr.j, p: usr.p, pNombre: rol.nombre, perms: calc.perms };
}

function tienePerm_(ses, perm) {
  return ses.j === 'admin' || (ses.perms && ses.perms.indexOf(perm) > -1);
}

function requierePerm_(ses, perm) {
  if (!tienePerm_(ses, perm)) throw new Error('No tienes permiso para esta acción.');
}

function panelMiSesion_(ses) {
  return { ses: ses, version: versionPerms_() };
}

function panelEquipo_(ses) {
  const h = hojaChat_();
  const last = h.getLastRow();
  const cont = {};
  if (last >= 2) {
    const ini = Math.max(2, last - 1499);
    h.getRange(ini, 1, last - ini + 1, 10).getValues().forEach(function (r) {
      if (r[3] !== 'OUT') return;
      const a = String(r[4]);
      if (a === 'BOT' || a === 'Sistema') return;
      const c = cont[a] = cont[a] || { msgs: 0, ult: null };
      c.msgs++;
      if (r[0] instanceof Date) c.ult = r[0];
    });
  }
  const rm = rolesMapa_();
  const equipo = usuariosLista_().map(function (u) {
    const c = cont[u.n] || { msgs: 0, ult: null };
    const calc = calcularPerms_(u, rm.porId);
    const rol = rm.porId[u.p] || { nombre: u.j };
    return {
      u: u.u, n: u.n, r: u.j === 'admin' ? 'admin' : u.j, j: u.j, p: u.p, pNombre: rol.nombre,
      activo: u.activo, extra: calc.extraActivos, blq: u.blq, permsEf: calc.perms,
      msgs: c.msgs, ult: c.ult ? fechaCorta_(c.ult) : ''
    };
  });
  return { equipo: equipo, roles: rm.lista, catalogo: PERMISOS_CAT, sensibles: PERMISOS_SENSIBLES };
}

function panelUsuarioGuardar_(d, ses) {
  requierePerm_(ses, 'equipo.gestionar');
  const esAdmin = ses.j === 'admin';
  const u = limpiar_(d.u, 32).toLowerCase().replace(/[^a-z0-9._-]/g, '');
  const n = limpiar_(d.n, 50);
  const j = ['admin', 'supervisor', 'operario'].indexOf(d.j) > -1 ? d.j : 'operario';
  const rm = rolesMapa_();
  const p = j === 'admin' ? 'admin' : (j === 'supervisor' ? 'supervisor' : (rm.porId[d.p] ? d.p : 'op_ventas'));
  const activo = d.activo !== false;
  const pin = String(d.pin || '').trim();
  if (u.length < 3) throw new Error('El usuario debe tener al menos 3 caracteres (letras o números).');
  if (!n) throw new Error('Falta el nombre.');
  if (!esAdmin && j !== 'operario') throw new Error('Solo el administrador puede crear o editar Administradores o Supervisores.');

  conLock_(function () {
    const h = hojaUsuarios_();
    const lista = usuariosLista_();
    const ex = lista.filter(function (x) { return x.u === u; })[0];
    const ahora = new Date();
    if (d.nuevo) {
      if (ex) throw new Error('Ya existe un usuario con ese nombre.');
      if (pin.length < 4) throw new Error('El PIN debe tener al menos 4 caracteres.');
      h.appendRow([seguro_(u), hashPin_(u, pin), seguro_(n), j, p, activo ? 'SI' : 'NO', '{}', '[]', ahora, ahora]);
    } else {
      if (!ex) throw new Error('No encontré el usuario.');
      if (!esAdmin && ex.j !== 'operario') throw new Error('Solo el administrador puede modificar a este usuario.');
      if (ex.u === ses.u && !activo) throw new Error('No puedes pausar tu propio usuario.');
      const adminsActivos = lista.filter(function (x) { return x.j === 'admin' && x.activo && x.u !== ex.u; }).length;
      if (ex.j === 'admin' && (j !== 'admin' || !activo) && adminsActivos < 1) {
        throw new Error('Debe quedar al menos un administrador activo.');
      }
      if (pin && pin.length < 4) throw new Error('El nuevo PIN debe tener al menos 4 caracteres.');
      const hash = pin ? hashPin_(u, pin) : ex.pinHash;
      h.getRange(ex.fila, 2, 1, 5).setValues([[hash, seguro_(n), j, p, activo ? 'SI' : 'NO']]);
      h.getRange(ex.fila, 10).setValue(ahora);
    }
    invalidarRolesCache_();
  }, 30000);

  bitacora_('USUARIO', '', u, (d.nuevo ? 'Creado' : 'Editado') + ' · ' + j + '/' + p + ' · por ' + ses.n);
  return { ok: true };
}

function panelDelegar_(d, ses) {
  requierePerm_(ses, 'permisos.delegar');
  const esAdmin = ses.j === 'admin';
  const u = String(d.u || '').trim().toLowerCase();
  const extraIn = (d.extra && typeof d.extra === 'object') ? d.extra : {};
  const blqIn = Array.isArray(d.blq) ? d.blq : [];

  conLock_(function () {
    const h = hojaUsuarios_();
    const ex = usuariosLista_().filter(function (x) { return x.u === u; })[0];
    if (!ex) throw new Error('No encontré el usuario.');
    if (ex.j === 'admin') throw new Error('Un administrador ya tiene acceso total.');
    if (!esAdmin && ex.j !== 'operario') throw new Error('Solo el administrador puede delegar permisos a un Supervisor.');

    const extraLimpio = {};
    Object.keys(extraIn).forEach(function (k) {
      if (PERMISOS_VALIDOS.indexOf(k) < 0) return;
      if (!esAdmin && (PERMISOS_SENSIBLES.indexOf(k) > -1 || !tienePerm_(ses, k))) {
        throw new Error('No puedes delegar el permiso: ' + k);
      }
      const v = String(extraIn[k] || 'permanente').trim();
      if (v === 'permanente') extraLimpio[k] = 'permanente';
      else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) extraLimpio[k] = v.substring(0, 16);
    });
    const blqLimpio = blqIn.filter(function (k) { return PERMISOS_VALIDOS.indexOf(k) > -1; });

    h.getRange(ex.fila, 7, 1, 2).setValues([[JSON.stringify(extraLimpio), JSON.stringify(blqLimpio)]]);
    h.getRange(ex.fila, 10).setValue(new Date());
    invalidarRolesCache_();
  }, 30000);

  bitacora_('DELEGAR', '', u, 'Permisos actualizados por ' + ses.n);
  return { ok: true };
}

function panelRolGuardar_(d, ses) {
  requierePerm_(ses, 'roles.editar');
  const id = String(d.id || '').trim();
  if (!id || id === 'admin') throw new Error('Ese perfil no se puede modificar.');
  const perms = (Array.isArray(d.perms) ? d.perms : []).filter(function (k) { return PERMISOS_VALIDOS.indexOf(k) > -1; });

  conLock_(function () {
    const h = hojaRoles_();
    const last = h.getLastRow();
    let fila = 0;
    if (last >= 2) {
      const ids = h.getRange(2, 1, last - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) if (String(ids[i][0]).trim() === id) { fila = i + 2; break; }
    }
    if (!fila) throw new Error('No encontré ese perfil.');
    if (d.nombre) h.getRange(fila, 2).setValue(seguro_(limpiar_(d.nombre, 40)));
    if (d.desc !== undefined) h.getRange(fila, 4).setValue(seguro_(limpiar_(d.desc, 120)));
    h.getRange(fila, 5, 1, 2).setValues([[JSON.stringify(perms), new Date()]]);
    invalidarRolesCache_();
  }, 30000);

  bitacora_('ROL', '', id, 'Perfil editado por ' + ses.n + ' (' + perms.length + ' permisos)');
  return { ok: true };
}