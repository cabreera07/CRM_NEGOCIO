/***** PANEL WEB v3: BACKEND *****/
const STOCK_BAJO = 5;   // alerta de stock bajo
const RESPUESTAS_RAPIDAS = [
  'Hola 👋 con gusto te ayudo. ¿Me cuentas en qué puedo servirte?',
  'Ya revisé tu comprobante ✅ Gracias, en un momento te confirmo tu pedido.',
  'Tu pedido está en preparación, te aviso apenas salga 🚚',
  '¿Me confirmas tu dirección exacta y una referencia, por favor? 🏠',
  'Gracias por tu compra 💚 Escribe *menu* cuando quieras volver al menú.'
];

/***** AUTENTICACIÓN *****/






function rapidasActuales_() {
  const raw = PropertiesService.getScriptProperties().getProperty('RAPIDAS');
  if (raw) { try { const l = JSON.parse(raw); if (Array.isArray(l) && l.length) return l; } catch (e) {} }
  return RESPUESTAS_RAPIDAS;
}

/***** PUERTA ÚNICA *****/
function panelApi(token, accion, d) {
  d = d || {};
  if (accion === 'login')  return panelLogin_(d.usuario, d.pin);
  if (accion === 'config') return disenoLeer_();
  const ses = sesion_(token);
  AUTOR_ACTUAL_ = 'Sistema';
  switch (accion) {
    case 'init':            return { negocio: NEGOCIO, estados: ESTADOS_PEDIDO, ses: ses, rapidas: rapidasActuales_(), diseno: disenoLeer_() };
    case 'mi_sesion':       return panelMiSesion_(ses);
    case 'diseno_guardar':  requierePerm_(ses, 'diseno.editar'); return disenoGuardar_(d, ses);
    case 'diseno_imagen':   requierePerm_(ses, 'diseno.editar'); return disenoImagen_(d, ses);
    case 'torre':           return panelTorre_();
    case 'dashboard':       requierePerm_(ses, 'dashboard.ver'); return panelDashboard_(d);
    case 'equipo':          if (!tienePerm_(ses, 'equipo.ver') && !tienePerm_(ses, 'equipo.gestionar') && !tienePerm_(ses, 'permisos.delegar') && !tienePerm_(ses, 'roles.editar')) throw new Error('Sin permiso.'); return panelEquipo_(ses);
    case 'usuario_guardar': return panelUsuarioGuardar_(d, ses);
    case 'delegar':         return panelDelegar_(d, ses);
    case 'rol_guardar':     return panelRolGuardar_(d, ses);
    case 'rapidas_guardar': requierePerm_(ses, 'rapidas.editar'); return panelRapidasGuardar_(d);
    case 'respaldo':        requierePerm_(ses, 'respaldo.ejecutar'); return panelRespaldo_();
    case 'inventario':      requierePerm_(ses, 'inventario.ver'); return panelInventario_();
    case 'producto':        requierePerm_(ses, 'inventario.editar'); return panelProducto_(d);
    case 'foto':            requierePerm_(ses, 'inventario.editar'); return panelFoto_(d);
    case 'comprobantes':    requierePerm_(ses, 'pagos.verificar'); return panelComprobantes_();
    case 'chats':           requierePerm_(ses, 'chats.ver'); return panelChats_(ses);
    case 'chat':            requierePerm_(ses, 'chats.ver'); return panelChat_(d);
    case 'enviar':          requierePerm_(ses, 'chats.enviar'); AUTOR_ACTUAL_ = ses.n; return panelEnviar_(d, ses);
    case 'modo':            requierePerm_(ses, 'chats.modo'); return panelModo_(d, ses);
    case 'media':           return panelMedia_(d);
    case 'clientes':        requierePerm_(ses, 'clientes.ver'); return panelClientes_();
    case 'pedidos':         if (!tienePerm_(ses, 'pedidos.ver') && !tienePerm_(ses, 'ruta.ver')) throw new Error('Sin permiso.'); return panelPedidos_();
    case 'estado':          return panelEstado_(d, ses);
    case 'link':            requierePerm_(ses, 'pedidos.link'); return panelLink_(d);
  }
  throw new Error('Acción desconocida');
}

function fechaCorta_(v) {
  return v instanceof Date ? Utilities.formatDate(v, TZ, 'dd/MM HH:mm') : '';
}
function inicioDia_(ms) {
  return Utilities.parseDate(Utilities.formatDate(new Date(ms), TZ, 'yyyy-MM-dd'), TZ, 'yyyy-MM-dd');
}

/***** CHATS *****/
function panelChats_(ses) {
  const h = hojaChat_();
  const last = h.getLastRow();
  const estados = leerChats_();
  const porTel = {};
  if (last >= 2) {
    const desde = Math.max(2, last - 1499);
    h.getRange(desde, 1, last - desde + 1, 10).getValues().forEach(function (r) {
      const t = soloDigitos_(r[1]);
      if (!t || !(r[0] instanceof Date)) return;
      const c = porTel[t] = porTel[t] || { tel: t, nombre: '', ult: null, ultDir: '', ultTxt: '', sinLeer: 0 };
      if (r[3] === 'IN' && r[2]) c.nombre = String(r[2]);
      c.ult = r[0]; c.ultDir = String(r[3]);
      c.ultTxt = String(r[6] || '') || (r[7] ? (r[5] === 'image' ? '📷 Foto' : '📄 Archivo') : '');
      const e = estados[t];
      const leido = e && e.leido ? e.leido.getTime() : 0;
      if (r[3] === 'IN' && r[0].getTime() > leido) c.sinLeer++;
    });
  }
  const verTodos = !ses || tienePerm_(ses, 'chats.ver_todos');
  const lista = Object.keys(porTel).map(function (t) {
    const c = porTel[t], e = estados[t];
    const humano = modoEfectivo_(e) === 'HUMANO';
    return {
      tel: t, nombre: c.nombre, ultDir: c.ultDir, ultTxt: recortar_(c.ultTxt.replace(/\s+/g, ' '), 90),
      fecha: fechaCorta_(c.ult), ts: c.ult.getTime(), sinLeer: c.sinLeer,
      humano: humano, motivo: humano && e ? e.motivo : '', asignado: humano && e ? e.asignado : ''
    };
  }).filter(function (c) {
    return verTodos || !c.humano || !c.asignado || c.asignado === ses.n;
  }).sort(function (a, b) { return b.ts - a.ts; }).slice(0, 150);
  return { chats: lista };
}

function panelChat_(d) {
  const tel = soloDigitos_(d.tel);
  if (tel.length < 8) throw new Error('Teléfono inválido');
  const h = hojaChat_();
  const last = h.getLastRow();
  const desde = parseInt(d.desde, 10) || 0;
  const completo = desde < 1 || desde > last;
  const ini = completo ? Math.max(2, last - 1499) : desde + 1;
  const msgs = [];
  let nombre = '';
  if (last >= ini) {
    h.getRange(ini, 1, last - ini + 1, 10).getValues().forEach(function (r) {
      if (soloDigitos_(r[1]) !== tel || !(r[0] instanceof Date)) return;
      if (r[3] === 'IN' && r[2]) nombre = String(r[2]);
      msgs.push({
        ts: r[0].getTime(),
        dia: Utilities.formatDate(r[0], TZ, 'dd/MM/yyyy'),
        hora: Utilities.formatDate(r[0], TZ, 'HH:mm'),
        dir: String(r[3]), autor: String(r[4]), tipo: String(r[5]),
        texto: String(r[6] === null || r[6] === undefined ? '' : r[6]),
        media: String(r[7] || ''),
        cod: r[9] === '' ? 200 : Number(r[9])
      });
    });
  }
  const est = leerChats_()[tel];
  const modo = modoEfectivo_(est);
  const out = {
    completo: completo, fila: last, msgs: completo ? msgs.slice(-150) : msgs,
    modo: modo, asignado: est && modo === 'HUMANO' ? est.asignado : '', motivo: est && modo === 'HUMANO' ? est.motivo : ''
  };
  if (completo) {
    const cli = buscarCliente_(hojaClientes_(), tel);
    out.info = { nombre: nombre, compras: cli ? cli.compras : 0, puntos: cli ? cli.puntos : 0, pend: cli ? cli.pend : 0 };
    out.pedidos = ultimosPedidos_(tel, 4).reverse().map(function (f) {
      return { id: String(f[PED.ID]), total: moneda_(f[PED.TOTAL]), estado: String(f[PED.ESTADO]).trim().toUpperCase() };
    });
  }
  if (d.leer && (completo || msgs.some(function (m) { return m.dir === 'IN'; }))) actualizarChat_(tel, { leido: true });
  return out;
}

function panelEnviar_(d, ses) {
  const tel = soloDigitos_(d.tel);
  const texto = String(d.texto || '').trim();
  if (tel.length < 8) throw new Error('Teléfono inválido');
  if (!texto) throw new Error('Escribe un mensaje.');
  if (texto.length > 1500) throw new Error('El mensaje es muy largo (máximo 1500 caracteres).');
  const code = texto_(tel, texto);
  if (code !== 200) throw new Error(errorWhatsApp_(code));
  actualizarChat_(tel, { modo: 'HUMANO', asignado: ses.n, motivo: '' });
  return { ok: true };
}

function panelModo_(d, ses) {
  const tel = soloDigitos_(d.tel);
  if (tel.length < 8) throw new Error('Teléfono inválido');
  const m = d.modo === 'HUMANO' ? 'HUMANO' : 'BOT';
  actualizarChat_(tel, { modo: m, motivo: '', asignado: m === 'HUMANO' ? ses.n : '' });
  bitacora_('MODO', '', tel, m + ' · ' + ses.n);
  return { ok: true };
}

function panelMedia_(d) {
  const id = String(d.id || '').trim();
  if (!/^[A-Za-z0-9_-]{10,}$/.test(id)) throw new Error('Archivo inválido');
  const file = DriveApp.getFileById(id);
  const carpeta = carpetaMedia_().getId();
  const padres = file.getParents();
  let ok = false;
  while (padres.hasNext()) { if (padres.next().getId() === carpeta) ok = true; }
  if (!ok) throw new Error('Archivo no permitido');
  const blob = file.getBlob();
  const bytes = blob.getBytes();
  if (bytes.length > 4000000) throw new Error('El archivo es muy grande para mostrarlo aquí.');
  return { mime: blob.getContentType(), b64: Utilities.base64Encode(bytes), nombre: file.getName() };
}

/***** CLIENTES *****/
function panelClientes_() {
  const h = hojaClientes_();
  const last = h.getLastRow();
  if (last < 2) return { clientes: [] };
  const out = h.getRange(2, 1, last - 1, CLI.REGISTRO + 1).getValues()
    .filter(function (r) { return soloDigitos_(r[CLI.TEL]); })
    .map(function (r) {
      return {
        tel: soloDigitos_(r[CLI.TEL]), nombre: String(r[CLI.NOMBRE] || ''),
        compras: parseInt(r[CLI.COMPRAS], 10) || 0,
        puntos: Math.max(0, Math.floor(aNumero_(r[CLI.PUNTOS]))),
        pend: parseInt(r[CLI.PEND], 10) || 0,
        t: aNumero_(r[CLI.TOTAL]),
        proxima: String(r[CLI.PROXIMA] || ''), registro: fechaCorta_(r[CLI.REGISTRO]),
        regTs: r[CLI.REGISTRO] instanceof Date ? r[CLI.REGISTRO].getTime() : 0
      };
    });
  return { clientes: out.slice(0, 800) };
}

/***** PEDIDOS *****/
function panelPedidos_() {
  const h = hoja_(H_PED);
  const last = h.getLastRow();
  if (last < 2) return { pedidos: [] };
  const d = h.getRange(2, 1, last - 1, PED_COLS).getValues();
  const out = [];
  for (let i = d.length - 1; i >= 0 && out.length < 500; i--) {
    const f = d[i];
    if (!f[PED.ID]) continue;
    out.push({
      id: String(f[PED.ID]),
      fecha: fechaCorta_(f[PED.FECHA]),
      ts: f[PED.FECHA] instanceof Date ? f[PED.FECHA].getTime() : 0,
      tel: soloDigitos_(f[PED.TELEFONO]),
      nombre: String(f[PED.NOMBRE] || ''),
      productos: String(f[PED.PRODUCTO] || ''),
      total: moneda_(f[PED.TOTAL]),
      totalN: aNumero_(f[PED.TOTAL]),
      descuento: aNumero_(f[PED.DESCUENTO]) > 0 ? moneda_(f[PED.DESCUENTO]) : '',
      pago: String(f[PED.PAGO] || ''),
      estado: String(f[PED.ESTADO] || '').trim().toUpperCase(),
      dir: String(f[PED.DIRECCION] || ''),
      zona: String(f[PED.ZONA] || ''),
      muni: String(f[PED.MUNICIPIO] || ''),
      depto: String(f[PED.DEPARTAMENTO] || ''),
      transp: String(f[PED.TRANSPORTISTA] || ''),
      guia: String(f[PED.GUIA] || ''),
      link: String(f[PED.LINK] || ''),
      comprobante: fechaCorta_(f[PED.COMPROBANTE])
    });
  }
  return { pedidos: out };
}

function panelFilaPedido_(id) {
  const h = hoja_(H_PED);
  const last = h.getLastRow();
  if (last < 2) return 0;
  const ids = h.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return 0;
}

function panelEstado_(d, ses) {
  const estado = String(d.estado || '').trim().toUpperCase();
  if (ESTADOS_PEDIDO.indexOf(estado) < 0) throw new Error('Estado inválido');
  const hoja = hoja_(H_PED);
  const fila = panelFilaPedido_(d.id);
  if (!fila) throw new Error('No encontré el pedido (¿ya se archivó?).');
  const actual = String(hoja.getRange(fila, PED.ESTADO + 1).getValue() || '').trim().toUpperCase();
  if (estado === 'CANCELADO') requierePerm_(ses, 'pedidos.cancelar');
  else if (actual === 'PENDIENTE_PAGO' && estado === 'CONFIRMADO') requierePerm_(ses, 'pagos.verificar');
  else requierePerm_(ses, 'pedidos.estado');
  return aplicarCambioEstado_(hoja, fila, estado, '', {
    escribir: true,
    transp: limpiar_(d.transp, 40),
    guia: limpiar_(d.guia, 60)
  });
}

function panelLink_(d) {
  const link = String(d.link || '').trim();
  if (!/^https?:\/\//i.test(link)) throw new Error('El link debe empezar con http:// o https://');
  const hoja = hoja_(H_PED);
  const fila = panelFilaPedido_(d.id);
  if (!fila) throw new Error('No encontré el pedido.');
  const celda = hoja.getRange(fila, PED.LINK + 1);
  celda.setValue(link);
  celda.clearNote();
  enviarLinkZigi_(hoja, fila);
  const nota = String(celda.getNote());
  return { enviado: nota.indexOf('Link enviado') === 0, detalle: nota || 'Sin respuesta del envío.' };
}

/***** INVENTARIO (admin) *****/
function panelInventario_() {
  const d = hoja_(H_INV).getDataRange().getValues();
  const out = [];
  for (let i = 1; i < d.length; i++) {
    if (!d[i][INV.SKU]) continue;
    out.push({
      sku: String(d[i][INV.SKU]),
      producto: String(d[i][INV.PRODUCTO] || ''),
      descripcion: String(d[i][INV.DESC] || ''),
      precio: aNumero_(d[i][INV.PRECIO]),
      stock: parseInt(d[i][INV.STOCK], 10) || 0,
      activo: String(d[i][INV.ACTIVO]).toUpperCase() === 'SI',
      foto: String(d[i][INV.IMAGEN] || '').trim() !== ''
    });
  }
  return { productos: out };
}

function panelProducto_(d) {
  const sku = limpiar_(d.sku, 30);
  const precio = aNumero_(d.precio);
  const stock = parseInt(d.stock, 10);
  if (!sku) throw new Error('Falta el SKU.');
  if (!(precio >= 0)) throw new Error('Precio inválido.');
  if (isNaN(stock) || stock < 0) throw new Error('Stock inválido.');
  const activo = d.activo ? 'SI' : 'NO';

  conLock_(function () {
    const h = hoja_(H_INV);
    const datos = h.getDataRange().getValues();
    let fila = 0;
    for (let i = 1; i < datos.length; i++) if (String(datos[i][INV.SKU]) === sku) { fila = i + 1; break; }

    if (d.nuevo) {
      if (fila) throw new Error('Ya existe un producto con ese SKU.');
      if (!limpiar_(d.producto, 80)) throw new Error('Falta el nombre del producto.');
      h.appendRow([sku, limpiar_(d.producto, 80), limpiar_(d.descripcion, 200), precio, stock, '', activo]);
    } else {
      if (!fila) throw new Error('No encontré el producto ' + sku + '.');
      const nom = limpiar_(d.producto, 80);
      if (nom) h.getRange(fila, INV.PRODUCTO + 1).setValue(nom);
      if (d.descripcion !== undefined) h.getRange(fila, INV.DESC + 1).setValue(limpiar_(d.descripcion, 200));
      h.getRange(fila, INV.PRECIO + 1).setValue(precio);
      h.getRange(fila, INV.STOCK + 1).setValue(stock);
      h.getRange(fila, INV.ACTIVO + 1).setValue(activo);
    }
    invalidarInv_();
  }, 30000);

  bitacora_('INVENTARIO', '', '', sku + ' · precio ' + precio + ' · stock ' + stock + ' · ' + activo);
  return { ok: true };
}

function carpetaProductos_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('CARPETA_PRODUCTOS');
  if (id) { try { return DriveApp.getFolderById(id); } catch (x) {} }
  const f = DriveApp.createFolder('Productos ' + NEGOCIO);
  props.setProperty('CARPETA_PRODUCTOS', f.getId());
  return f;
}

// La foto llega ya reducida (JPEG) desde el celular; se guarda en Drive y se enlaza en la columna URL_Imagen
function panelFoto_(d) {
  const sku = limpiar_(d.sku, 30);
  const b64 = String(d.b64 || '');
  if (!sku || !b64) throw new Error('Falta la foto.');
  if (b64.length > 3000000) throw new Error('La foto es muy pesada.');
  const carpeta = carpetaProductos_();
  const previos = carpeta.getFilesByName(sku + '.jpg');
  while (previos.hasNext()) previos.next().setTrashed(true);
  const file = carpeta.createFile(Utilities.newBlob(Utilities.base64Decode(b64), 'image/jpeg', sku + '.jpg'));
  const url = 'https://drive.google.com/file/d/' + file.getId() + '/view';
  conLock_(function () {
    const h = hoja_(H_INV);
    const datos = h.getDataRange().getValues();
    for (let i = 1; i < datos.length; i++) {
      if (String(datos[i][INV.SKU]) === sku) { h.getRange(i + 1, INV.IMAGEN + 1).setValue(url); invalidarInv_(); return; }
    }
    throw new Error('No encontré el producto ' + sku + '.');
  }, 30000);
  bitacora_('FOTO', '', '', sku);
  return { ok: true };
}

/***** HERRAMIENTAS DEL ADMIN *****/
function panelRapidasGuardar_(d) {
  const lista = (Array.isArray(d.lista) ? d.lista : []).map(function (x) { return String(x || '').trim().substring(0, 500); })
    .filter(String).slice(0, 15);
  if (!lista.length) throw new Error('Deja al menos una respuesta.');
  PropertiesService.getScriptProperties().setProperty('RAPIDAS', JSON.stringify(lista));
  return { ok: true, lista: lista };
}

function panelRespaldo_() {
  if (typeof respaldoDiario !== 'function') throw new Error('Falta pegar la función respaldoDiario en appscript.js.');
  respaldoDiario();
  return { ok: true };
}



/***** TORRE DE CONTROL (todos los roles) *****/
function panelTorre_() {
  const ahora = Date.now();
  const al = [];
  const cnt = { pagos: 0, comprobantes: 0, despachar: 0, camino: 0, sinResp: 0, stock: 0 };
  let porCobrar = 0;

  const h = hoja_(H_PED);
  const last = h.getLastRow();
  if (last >= 2) {
    h.getRange(2, 1, last - 1, PED_COLS).getValues().forEach(function (f) {
      if (!f[PED.ID]) return;
      const est = String(f[PED.ESTADO]).trim().toUpperCase();
      const fecha = f[PED.FECHA] instanceof Date ? f[PED.FECHA].getTime() : ahora;
      const horas = (ahora - fecha) / 3600000;
      const tel = soloDigitos_(f[PED.TELEFONO]);
      const nom = String(f[PED.NOMBRE] || ('+' + tel));
      if (est === 'PENDIENTE_PAGO') {
        cnt.pagos++; porCobrar += aNumero_(f[PED.TOTAL]);
        if (f[PED.COMPROBANTE] instanceof Date) {
          cnt.comprobantes++;
          al.push({ n: 'rojo', ic: 'photo', t: 'Comprobante por verificar · ' + f[PED.ID], d: nom + ' · ' + moneda_(f[PED.TOTAL]), a: { t: 'pagos' } });
        } else if (horas > HORAS_ALERTA_PAGO) {
          al.push({ n: 'amarillo', ic: 'clock', t: 'Pago pendiente hace ' + Math.round(horas) + ' h · ' + f[PED.ID], d: nom + ' · ' + moneda_(f[PED.TOTAL]), a: { t: 'chat', tel: tel } });
        }
      }
      if (['CONFIRMADO', 'PREPARANDO', 'EMPACADO'].indexOf(est) > -1) cnt.despachar++;
      if (est === 'DESPACHADO' || est === 'EN_RUTA') {
        cnt.camino++;
        if (horas > 72) al.push({ n: 'amarillo', ic: 'truck', t: 'Sin entregar hace ' + Math.round(horas / 24) + ' días · ' + f[PED.ID], d: nom, a: { t: 'chat', tel: tel } });
      }
    });
  }

  panelChats_().chats.forEach(function (c) {
    const min = Math.round((ahora - c.ts) / 60000);
    if (c.ultDir === 'IN' && min >= 5 && min <= 1440) {
      cnt.sinResp++;
      al.push({ n: min >= 15 ? 'rojo' : 'amarillo', ic: 'message-circle', t: (c.nombre || ('+' + c.tel)) + ' espera respuesta (' + min + ' min)', d: c.ultTxt, a: { t: 'chat', tel: c.tel } });
    }
  });

  hoja_(H_INV).getDataRange().getValues().slice(1).forEach(function (r) {
    if (!r[INV.SKU] || String(r[INV.ACTIVO]).toUpperCase() !== 'SI') return;
    const s = parseInt(r[INV.STOCK], 10) || 0;
    if (s <= STOCK_BAJO) {
      cnt.stock++;
      al.push({ n: s === 0 ? 'rojo' : 'amarillo', ic: 'package', t: (s === 0 ? 'Agotado: ' : 'Stock bajo: ') + r[INV.PRODUCTO], d: 'Quedan ' + s, a: { t: 'inv' } });
    }
  });

  al.sort(function (a, b) { return (a.n === 'rojo' ? 0 : 1) - (b.n === 'rojo' ? 0 : 1); });
  return { cnt: cnt, porCobrar: round2_(porCobrar), alertas: al.slice(0, 15) };
}

function panelComprobantes_() {
  const imgs = {};
  const hc = hojaChat_();
  const lc = hc.getLastRow();
  if (lc >= 2) {
    const ini = Math.max(2, lc - 1499);
    hc.getRange(ini, 1, lc - ini + 1, 10).getValues().forEach(function (r) {
      if (r[3] === 'IN' && r[5] === 'image' && r[7]) imgs[soloDigitos_(r[1])] = String(r[7]);
    });
  }
  const out = [];
  const h = hoja_(H_PED);
  const last = h.getLastRow();
  if (last >= 2) {
    h.getRange(2, 1, last - 1, PED_COLS).getValues().forEach(function (f) {
      if (!f[PED.ID] || String(f[PED.ESTADO]).trim().toUpperCase() !== 'PENDIENTE_PAGO') return;
      const tel = soloDigitos_(f[PED.TELEFONO]);
      out.push({
        id: String(f[PED.ID]), tel: tel, nombre: String(f[PED.NOMBRE] || ''), total: moneda_(f[PED.TOTAL]),
        fecha: fechaCorta_(f[PED.FECHA]), comp: f[PED.COMPROBANTE] instanceof Date ? fechaCorta_(f[PED.COMPROBANTE]) : '',
        media: imgs[tel] || ''
      });
    });
  }
  out.sort(function (a, b) { return (b.media ? 1 : 0) - (a.media ? 1 : 0); });
  return { pedidos: out };
}

/***** DASHBOARD (admin) *****/
// Pedidos vivos + últimos 3000 del Historial, desde la fecha indicada
function filasPedidos_(desde) {
  const out = [];
  [[H_PED, 0], [H_HIST, 3000]].forEach(function (par) {
    const h = hoja_(par[0]);
    if (!h || h.getLastRow() < 2) return;
    const last = h.getLastRow();
    const ini = par[1] ? Math.max(2, last - par[1] + 1) : 2;
    h.getRange(ini, 1, last - ini + 1, PED_COLS).getValues().forEach(function (f) {
      if (!f[PED.ID] || !(f[PED.FECHA] instanceof Date) || f[PED.FECHA].getTime() < desde.getTime()) return;
      out.push(f);
    });
  });
  return out;
}

function panelDashboard_(d) {
  const ahora = new Date();
  const hoy0 = inicioDia_(ahora.getTime());
  const DIA = 86400000;
  const periodo = ['hoy', '7d', '30d', 'mes'].indexOf(d.periodo) > -1 ? d.periodo : 'hoy';
  let desde;
  if (periodo === 'hoy') desde = hoy0;
  else if (periodo === '7d') desde = new Date(hoy0.getTime() - 6 * DIA);
  else if (periodo === '30d') desde = new Date(hoy0.getTime() - 29 * DIA);
  else desde = Utilities.parseDate(Utilities.formatDate(ahora, TZ, 'yyyy-MM') + '-01', TZ, 'yyyy-MM-dd');

  const span = ahora.getTime() - desde.getTime();
  const L = { hoy: 1, '7d': 7, '30d': 30, mes: 30 }[periodo] * DIA;
  const prevIni = new Date(desde.getTime() - L);
  const prevFin = prevIni.getTime() + span;
  const serieDesde = periodo === 'hoy' ? new Date(hoy0.getTime() - 6 * DIA) : desde;
  const baseDesde = new Date(Math.min(prevIni.getTime(), serieDesde.getTime()));

  const cur = { ventas: 0, pedidos: 0, entregados: 0, cancelados: 0, descuentos: 0, unidades: 0 };
  const prev = { ventas: 0, pedidos: 0 };
  const serie = {}, prods = {}, munis = {}, estados = {}, pagos = {}, tels = {}, horas = [];
  for (let i = 0; i < 24; i++) horas.push(0);

  filasPedidos_(baseDesde).forEach(function (f) {
    const t = f[PED.FECHA].getTime();
    const est = String(f[PED.ESTADO]).trim().toUpperCase();
    const total = aNumero_(f[PED.TOTAL]);
    if (t >= serieDesde.getTime() && est !== 'CANCELADO') {
      const key = Utilities.formatDate(f[PED.FECHA], TZ, 'yyyy-MM-dd');
      const s = serie[key] = serie[key] || { v: 0, p: 0 };
      s.v += total; s.p++;
    }
    if (t < desde.getTime()) {
      if (t >= prevIni.getTime() && t <= prevFin && est !== 'CANCELADO') { prev.ventas += total; prev.pedidos++; }
      return;
    }
    estados[est] = (estados[est] || 0) + 1;
    if (est === 'CANCELADO') { cur.cancelados++; return; }
    cur.ventas += total; cur.pedidos++; cur.descuentos += aNumero_(f[PED.DESCUENTO]);
    if (est === 'ENTREGADO') cur.entregados++;
    horas[parseInt(Utilities.formatDate(f[PED.FECHA], TZ, 'H'), 10)]++;
    const pg = String(f[PED.PAGO]);
    const pk = pg.indexOf('Zigi') > -1 ? 'Link / transferencia' : (pg.indexOf('puntos') > -1 ? 'Pagado con puntos' : 'Contra entrega');
    pagos[pk] = (pagos[pk] || 0) + 1;
    const mk = String(f[PED.MUNICIPIO] || '').trim() || 'Sin municipio';
    const m = munis[mk] = munis[mk] || { n: mk, v: 0, c: 0 };
    m.v += total; m.c++;
    tels[soloDigitos_(f[PED.TELEFONO])] = 1;
    carritoDePedido_(f).forEach(function (it) {
      const cant = parseInt(it.cant, 10) || 0;
      const nombre = String(it.producto || it.sku || f[PED.PRODUCTO]);
      const p = prods[nombre] = prods[nombre] || { n: nombre, u: 0, v: 0 };
      p.u += cant;
      p.v += (it.precio !== undefined ? aNumero_(it.precio) : aNumero_(f[PED.PRECIO_UNIT])) * cant;
      cur.unidades += cant;
    });
  });

  const labels = [], vv = [], pp = [];
  for (let t = serieDesde.getTime(); t <= ahora.getTime(); t += DIA) {
    const k = Utilities.formatDate(new Date(t), TZ, 'yyyy-MM-dd');
    labels.push(Utilities.formatDate(new Date(t), TZ, 'dd/MM'));
    vv.push(round2_((serie[k] || {}).v || 0));
    pp.push((serie[k] || {}).p || 0);
  }
  const top = function (obj, n) {
    return Object.keys(obj).map(function (k) { return obj[k]; })
      .sort(function (a, b) { return b.v - a.v; }).slice(0, n)
      .map(function (x) { x.v = round2_(x.v); return x; });
  };
  const pct = function (a, b) { return b > 0 ? Math.round((a - b) / b * 100) : null; };

  return {
    periodo: periodo,
    kpi: {
      ventas: round2_(cur.ventas), pedidos: cur.pedidos, ticket: cur.pedidos ? round2_(cur.ventas / cur.pedidos) : 0,
      entregados: cur.entregados, cancelados: cur.cancelados, descuentos: round2_(cur.descuentos), unidades: cur.unidades,
      clientes: Object.keys(tels).length, dVentas: pct(cur.ventas, prev.ventas), dPedidos: pct(cur.pedidos, prev.pedidos)
    },
    serie: { labels: labels, ventas: vv, pedidos: pp },
    horas: horas, productos: top(prods, 6), munis: top(munis, 6), estados: estados, pagos: pagos
  };
}