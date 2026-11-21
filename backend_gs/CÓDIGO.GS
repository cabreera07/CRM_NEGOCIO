// @ts-nocheck
/***** appscript.js *****/

/***** CONFIGURACIÓN *****/
const VERIFY_TOKEN    = 'miBot_2026_xyz';
const WA_TOKEN        = 'EAAZAsyCz0jREBTLX7vGC2o5xOY69p0UfsuPx2pwacw2R1ZClg1At5tvbDvuTVXxplWEPTsiN3MYqjSZBmExAoMNgddvPqEy76JwMHZABXJ3LAjcUyiYf8SBZBxO6LeWHD4U1zRE36tf5b6TIhDHmR4tHJvPHsnfJO4zyZBiqbwW07FeDIXYTcZBRWOGYZBdVTAZDZD';
const PHONE_NUMBER_ID = '1406488385881114';
const API_VERSION     = 'v20.0';
const SHEET_ID        = '1Lka18EJb-53l9z4fStfyNDdVODDg9ypc45Pqz3rR7gk';

/***** CONFIGURACIÓN DE NEGOCIO *****/
const NEGOCIO          = 'Mi Tienda';
const EMAIL_ADMIN      = 'cabreera07walter@gmail.com';  // recibe avisos, comprobantes y el corte diario
const CARPETA_DRIVE_ID = '';                    // opcional: ID de carpeta de Drive (pedidos y comprobantes)
const CREAR_EVENTO     = true;                  // crea evento de entrega en Calendar
const DIAS_ENTREGA     = 2;
const MONEDA           = 'Q';
const TZ               = 'America/Guatemala';
const BANNER_CATALOGO  = '';                    // opcional: enlace de Drive o URL de una imagen publicitaria que se envía al abrir el catálogo (1 vez cada 6 h por cliente)
const H_MSG = 'Mensajes', H_INV = 'Inventario', H_PED = 'Pedidos', H_ERR = 'Errores', H_CLIENTES = 'Clientes';
const H_HIST = 'Historial', H_ITEMS = 'Detalle_Items', H_RES = 'Resumen_Diario', H_BIT = 'Bitacora';

/***** REGLAS DE NEGOCIO *****/
const PROGRAMA            = 'Club de Puntos';
const TICKET_PROMEDIO     = 300;                                            // ajústalo con el Ticket_Promedio de Resumen_Diario
const COMPRA1_MIN         = Math.ceil(TICKET_PROMEDIO * 1.15 / 10) * 10;    // mínimo = ticket promedio + 15%
const COMPRA1_DESC        = 50;                                             // descuento directo en la primera compra
const PUNTOS_CADA_Q       = 10;                                             // desde la 2da compra: 1 punto (Q1) por cada Q10 pagados
const MAX_EFECTIVO        = 700;                                            // máximo para pago contra entrega
const DEPTO_DEFAULT       = 'Guatemala';
const HORA_NOCHE_INICIO   = 20;                                             // 8 PM
const HORA_NOCHE_FIN      = 8;                                              // 8 AM
const BLOQUEAR_CON_PENDIENTES = true;   // con un pedido en proceso (sin entregar) no aplica el regalo de bienvenida

const H_CHAT = 'Conversaciones', H_CHATS = 'Chats';
const CHAT_HEADERS  = ['Fecha', 'Telefono', 'Nombre', 'Dir', 'Autor', 'Tipo', 'Texto', 'Media_Drive', 'WAMID', 'Codigo'];
const CHATS_HEADERS = ['Telefono', 'Modo', 'Motivo', 'Asignado', 'Actualizado', 'Leido_Hasta'];
const HORAS_MODO_HUMANO = 12;   // el bot se calla tanto tiempo cuando un empleado atiende
const DIAS_GUARDAR_CHAT = 60;   // la hoja Conversaciones conserva X días (las fotos quedan en Drive)
let AUTOR_ACTUAL_ = 'BOT';      // quién envía: BOT, Sistema o el nombre del empleado
let WA_ULTIMO_ERROR_ = '';

/***** ZIGI Y TRANSFERENCIAS *****/
const ZIGI_CODIGO         = '';         // tu código de referido de Zigi (vacío = no se muestra)
const ZIGI_URL            = '';         // opcional: tu enlace de referido
const DATOS_TRANSFERENCIA = '';         // ejemplo: 'Banco X\nCuenta monetaria 123456\nA nombre de: Fulano'
const PLANTILLA_LINK      = '';         // opcional: plantilla aprobada en Meta (3 variables: pedido, total, link)

/***** PROTECCIONES *****/
const MAX_EDAD_MENSAJE_MIN = 30;        // mensajes más viejos que esto se ignoran (reintentos atrasados de Meta)
const MAX_MSG_POR_MIN      = 20;        // tope de mensajes por minuto hacia un mismo cliente

/***** CORTE DIARIO Y LIMPIEZA *****/
const HORA_CORTE        = 2;            // el corte corre entre las 2:00 y las 3:00 AM
const DIAS_ARCHIVAR     = 7;            // pedidos ENTREGADO/CANCELADO con más de X días pasan a Historial (mínimo 1)
const DIAS_GUARDAR_LOGS = 30;           // Mensajes y Errores conservan X días
const HORAS_ALERTA_PAGO = 6;           // avisa si un PENDIENTE_PAGO lleva más de X horas

function carpetaRespaldos_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('CARPETA_RESPALDOS');
  if (id) { try { return DriveApp.getFolderById(id); } catch (x) {} }
  const f = DriveApp.createFolder('Respaldos ' + NEGOCIO);
  props.setProperty('CARPETA_RESPALDOS', f.getId());
  return f;
}

function respaldoDiario() {
  const hoy = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  const carpeta = carpetaRespaldos_();
  DriveApp.getFileById(SHEET_ID).makeCopy('Respaldo ' + NEGOCIO + ' ' + hoy, carpeta);
  const arch = [];
  const it = carpeta.getFiles();
  while (it.hasNext()) arch.push(it.next());
  arch.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  arch.slice(14).forEach(function (f) { f.setTrashed(true); });   // conserva los 14 más recientes
  bitacora_('RESPALDO', '', '', 'Copia ' + hoy + ' · guardadas ' + Math.min(arch.length, 14));
}

/***** IMÁGENES DE PRODUCTO *****/
function driveIdDe_(txt) {
  const s = String(txt || '').trim();
  let m = s.match(/\/folders\/([A-Za-z0-9_-]{10,})/);
  if (m) return { id: m[1], carpeta: true };
  m = s.match(/\/d\/([A-Za-z0-9_-]{10,})/) || s.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  if (m) return { id: m[1], carpeta: false };
  if (/^[A-Za-z0-9_-]{25,}$/.test(s)) return { id: s, carpeta: false };   // solo el ID
  return null;
}

// Devuelve { id: mediaIdDeMeta } o { link: url } o null
function imagenProducto_(ref) {
  ref = String(ref || '').trim();
  if (!ref) return null;
  const d = driveIdDe_(ref);
  if (!d) return /^https:\/\//i.test(ref) ? { link: ref } : null;

  let file = null;
  if (d.carpeta) {
    const it = DriveApp.getFolderById(d.id).getFiles();
    const arr = [];
    while (it.hasNext()) {
      const f = it.next();
      if (/^image\/(jpeg|png)$/.test(f.getMimeType())) arr.push(f);
    }
    arr.sort(function (a, b) { return a.getName().localeCompare(b.getName()); });
    file = arr[0] || null;
  } else {
    file = DriveApp.getFileById(d.id);
  }
  if (!file) return null;

  const mime = file.getMimeType();
  if (!/^image\/(jpeg|png)$/.test(mime)) return null;      // WhatsApp solo acepta JPG y PNG
  if (file.getSize() > 5 * 1024 * 1024) return null;       // máximo 5 MB

  const props = PropertiesService.getScriptProperties();
  const clave = 'img_' + PHONE_NUMBER_ID + '_' + file.getId();
  const version = String(file.getLastUpdated().getTime());
  const guardado = props.getProperty(clave);
  if (guardado) {
    try {
      const g = JSON.parse(guardado);
      if (g.v === version && Date.now() - g.t < 25 * 86400000) return { id: g.id };   // el id de Meta dura 30 días
    } catch (x) {}
  }

  const res = UrlFetchApp.fetch('https://graph.facebook.com/' + API_VERSION + '/' + PHONE_NUMBER_ID + '/media', {
    method: 'post', headers: { Authorization: 'Bearer ' + WA_TOKEN }, muteHttpExceptions: true,
    payload: { messaging_product: 'whatsapp', type: mime, file: file.getBlob() }
  });
  if (res.getResponseCode() !== 200) {
    registrarError_(new Error('Subida de imagen ' + res.getResponseCode() + ': ' + res.getContentText()));
    return null;
  }
  const mediaId = JSON.parse(res.getContentText()).id;
  props.setProperty(clave, JSON.stringify({ id: mediaId, v: version, t: Date.now() }));
  return { id: mediaId };
}

function enviarImagen_(to, ref, caption) {
  let img = null;
  try { img = imagenProducto_(ref); } catch (e) { registrarError_(e); }
  if (!img) return 0;
  return wa_({ to: to, type: 'image', image: Object.assign({ caption: recortar_(caption, 1024) }, img) });
}

/***** ÍNDICES (base 0) *****/
// Inventario: A SKU, B Producto, C Descripcion, D Precio, E Stock, F URL_Imagen, G Activo
const INV = { SKU: 0, PRODUCTO: 1, DESC: 2, PRECIO: 3, STOCK: 4, IMAGEN: 5, ACTIVO: 6 };

// Clientes (una fila por número de WhatsApp). C a G son FÓRMULAS sobre Pedidos + Historial.
const CLI = { TEL: 0, NOMBRE: 1, COMPRAS: 2, PUNTOS: 3, PEND: 4, PROXIMA: 5, TOTAL: 6, REGISTRO: 7 };
const CLI_HEADERS = ['Teléfono', 'Nombre', 'Numero_Compras', 'Puntos_Actuales', 'Pedidos_Pendientes',
                     'Proxima_Compra', 'Total_Comprado', 'Registro'];

// Pedidos: A..AA (un pedido = una fila, aunque tenga varios productos)
const PED = {
  ID: 0, FECHA: 1, TELEFONO: 2, NOMBRE: 3, SKU: 4, PRODUCTO: 5, CANTIDAD: 6,
  PRECIO_UNIT: 7, TOTAL: 8, DIRECCION: 9, ZONA: 10, MUNICIPIO: 11, DEPARTAMENTO: 12,
  REFERENCIAS: 13, PAGO: 14, TRANSPORTISTA: 15, ESTADO: 16, GUIA: 17,
  CARRITO: 18, SUBTOTAL: 19, DESCUENTO: 20, TIPO_DESC: 21, PTS_USADOS: 22, PTS_GANADOS: 23, CONTROL: 24,
  LINK: 25, COMPROBANTE: 26
};
const PED_COLS = 27;
const PED_HEADERS = ['ID_Pedido', 'Fecha', 'Telefono', 'Nombre', 'SKU', 'Producto', 'Cantidad', 'Precio_Unitario', 'Total',
                     'Direccion', 'Zona', 'Municipio', 'Departamento', 'Referencias', 'Pago', 'Transportista', 'Estado', 'Guia',
                     'Carrito_JSON', 'Subtotal', 'Descuento', 'Tipo_Descuento', 'Puntos_Usados', 'Puntos_Ganados', 'Control',
                     'Link_Zigi', 'Comprobante'];
const ESTADOS_PEDIDO = ['PENDIENTE_PAGO', 'CONFIRMADO', 'PREPARANDO', 'EMPACADO', 'DESPACHADO', 'EN_RUTA',
                        'ENTREGADO', 'INCIDENCIA', 'CANCELADO'];

// Hojas de datos para dashboards
const ITEMS_HEADERS = ['ID_Pedido', 'Fecha', 'Telefono', 'Estado', 'SKU', 'Producto', 'Cantidad', 'Precio_Unitario', 'Subtotal_Linea', 'Mes'];
const RES_HEADERS   = ['Fecha', 'Pedidos', 'Entregados', 'Cancelados', 'Ventas_Entregadas', 'Descuentos_Entregados', 'Unidades_Entregadas', 'Ticket_Promedio'];
const BIT_HEADERS   = ['Fecha', 'Evento', 'Pedido', 'Telefono', 'Detalle'];

/***** CONCURRENCIA *****/
// Ejecuta fn dentro del lock global. Mantén fn lo más corta posible.
function conLock_(fn, esperaMs) {
  const lock = LockService.getScriptLock();
  lock.waitLock(esperaMs || 30000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/***** WEBHOOK *****/
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p['hub.mode']) {
    if (p['hub.mode'] === 'subscribe' && p['hub.verify_token'] === VERIFY_TOKEN) {
      return ContentService.createTextOutput(p['hub.challenge']);
    }
    return ContentService.createTextOutput('Verificación fallida');
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true, servicio: NEGOCIO }))
    .setMimeType(ContentService.MimeType.JSON);
}

function responderPanel_(req) {
  const salida = function (o) {
    return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
  };
  try {
    return salida({ ok: true, data: panelApi(req.token || '', req.accion || '', req.datos || {}) });
  } catch (err) {
    return salida({ ok: false, error: err.message || String(err) });
  }
}

function doPost(e) {
  const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
  let body = null;
  try { body = JSON.parse(raw); } catch (err) {}
  if (body && body.origen === 'panel') return responderPanel_(body);

  try {
    PropertiesService.getScriptProperties().setProperty('ULTIMO_POST',
      new Date().toISOString() + ' | ' + raw.substring(0, 500));
  } catch (x) {}

  const ok = ContentService.createTextOutput('OK');
  try {
    if (!body || body.object !== 'whatsapp_business_account') return ok;
    (body.entry || []).forEach(function (entry) {
      (entry.changes || []).forEach(function (change) {
        const v = change.value || {};
        if (!v.messages) return;
        v.messages.forEach(function (m) {
          try { procesar_(m, v.contacts || []); } catch (x) { registrarError_(x); }
        });
      });
    });
  } catch (err) { registrarError_(err); }
  return ok;
}

// Ejecútala a mano DESPUÉS de mandar "hola" desde tu celular
function verUltimoPost() {
  Logger.log(PropertiesService.getScriptProperties().getProperty('ULTIMO_POST') || 'Nunca llegó ningún POST');
}

/***** PROCESAMIENTO *****/
function procesar_(msg, contactos) {
  if (!msg || !msg.id || !msg.from) return;

  // 1) Reintentos atrasados de Meta: no se reprocesan
  const ts = parseInt(msg.timestamp, 10);
  if (ts && (Date.now() / 1000 - ts) > MAX_EDAD_MENSAJE_MIN * 60) return;

  // 2) Deduplicación atómica
  if (yaProcesado_(msg.id)) return;

  const num = String(msg.from);
  const nombre = (contactos[0] && contactos[0].profile && contactos[0].profile.name) || '';
  const ent = entrada_(msg);

  try { guardarLog_([new Date(), num, nombre, ent.texto || ent.id, msg.type, msg.id]); } catch (e1) { registrarError_(e1); }
  try { registrarEntrante_(num, nombre, ent, msg.id); } catch (e2) { registrarError_(e2); }
  try { enrutar_(num, nombre, ent); } catch (err) {
    registrarError_(err);
    avisarError_(num);
  }
}

function yaProcesado_(id) {
  const cache = CacheService.getScriptCache();
  const lock = LockService.getScriptLock();
  const tiene = lock.tryLock(5000);
  try {
    if (cache.get('m_' + id)) return true;
    cache.put('m_' + id, '1', 21600);
    return false;
  } finally { if (tiene) lock.releaseLock(); }
}

// El aviso de error al cliente sale como máximo una vez por minuto
function avisarError_(num) {
  const cache = CacheService.getScriptCache();
  if (cache.get('err_' + num)) return;
  cache.put('err_' + num, '1', 60);
  texto_(num, '😕 Estamos con mucho movimiento y no pude procesar eso. Espera unos segundos y escribe *menu* para seguir.');
}

function entrada_(msg) {
  if (msg.type === 'text') return { texto: msg.text.body, id: '', tipo: 'text' };
  if (msg.type === 'interactive') {
    const i = msg.interactive || {};
    const r = i.button_reply || i.list_reply || {};
    return { texto: r.title || '', id: r.id || '', tipo: 'interactive' };
  }
  if (msg.type === 'button') return { texto: msg.button.text, id: msg.button.payload || '', tipo: 'button' };
  if (msg.type === 'image') {
    return { texto: '[imagen]', id: '', tipo: 'image', media: (msg.image || {}).id || '', caption: (msg.image || {}).caption || '' };
  }
  if (msg.type === 'document') {
    return { texto: '[documento]', id: '', tipo: 'document', media: (msg.document || {}).id || '', caption: (msg.document || {}).filename || '' };
  }
  return { texto: '[' + msg.type + ']', id: '', tipo: msg.type };
}

function enrutar_(num, nombre, e) {
  if (e.tipo === 'reaction') return;
  // Foto o PDF del comprobante: siempre se atrapa, sin importar el paso
  if (e.tipo === 'image' || e.tipo === 'document') return imagenRecibida_(num, nombre, e);
  // Si un empleado tiene la conversación, el bot calla con texto libre.
  // Si el cliente toca un botón o escribe "menu", el bot retoma.
  if (getModo_(num) === 'HUMANO') {
    const tt = String(e.texto || '').trim().toLowerCase();
    if (e.tipo === 'text' && tt !== 'menu' && tt !== 'menú') return;
    actualizarChat_(num, { modo: 'BOT', motivo: '', asignado: '' });
  }
  if (['text', 'interactive', 'button'].indexOf(e.tipo) < 0) {
    return botones_(num, '😊 Por ahora solo puedo leer texto y fotos de comprobantes. ¿Seguimos desde el menú o prefieres un asesor?',
      [{ id: 'menu', title: '📋 Menú' }, { id: 'asesor', title: '💬 Asesor' }]);
  }

  const t = String(e.texto || '').trim().toLowerCase();
  const id = e.id || '';
  const ses = getSes_(num);

  // Saludo / menú: el carrito se conserva si ya había uno
  if (['hola', 'menu', 'menú', 'inicio', 'buenas', 'buenos dias', 'buenas tardes'].indexOf(t) > -1 || id === 'menu') {
    if (ses.carrito && ses.carrito.length) setSes_(num, { carrito: ses.carrito, estado: 'CARRITO' });
    else delSes_(num);
    return menu_(num, nombre);
  }

  // Atajos de texto
  if (['mi cuenta', 'cuenta', 'puntos'].indexOf(t) > -1) return miCuenta_(num, nombre);
  if (['premios', 'beneficios', 'club'].indexOf(t) > -1) return premios_(num, nombre);
  if (['ayuda', 'faq', 'dudas'].indexOf(t) > -1) return faq_(num, nombre);

  // Cancelar: solo la compra en curso (antes de confirmar)
  if (id === 'cancelar' || (ses.estado && t === 'cancelar')) {
    if (ses.estado) {
      delSes_(num);
      return navegacion_(num, '👌 Listo, dejamos esto por aquí. Cuando quieras retomamos 😊');
    }
    return botones_(num, 'Si ya confirmaste un pedido y necesitas cambiarlo o cancelarlo, un asesor te ayuda con gusto 🙌',
      [{ id: 'asesor', title: '💬 Hablar con asesor' }, { id: 'menu', title: '📋 Menú' }]);
  }

  if (id === 'catalogo')       return catalogo_(num);
  if (id === 'mis_pedidos')    return misPedidos_(num);
  if (id === 'mi_cuenta')      return miCuenta_(num, nombre);
  if (id === 'premios')        return premios_(num, nombre);
  if (id === 'faq')            return faq_(num, nombre);
  if (id === 'asesor')         return asesor_(num, nombre);
  if (id === 'ver_carrito' || id === 'volver_carrito') return mostrarCarrito_(num, nombre);
  if (id === 'agregar_otro')   return agregarOtro_(num, nombre);
  if (id === 'ir_pagar')       return irAPagar_(num, nombre, false);
  if (id === 'seguir_pago')    return irAPagar_(num, nombre, true);
  if (id === 'modificar')      return modificar_(num, nombre);
  if (id === 'vaciar')         return vaciarCarrito_(num, nombre);
  if (id === 'desc_si')        return respuestaDescuento_(num, nombre, true);
  if (id === 'desc_no')        return respuestaDescuento_(num, nombre, false);
  if (id === 'pagar_link')     return confirmar_(num, nombre, 'LINK');
  if (id === 'pagar_efectivo') return confirmar_(num, nombre, 'EFECTIVO');
  if (id === 'transferir')     return transferir_(num, nombre);
  if (id === 'ya_pague')       return yaPague_(num, nombre);
  if (id.indexOf('prod_') === 0) return elegir_(num, id.substring(5));

  switch (ses.estado) {
    case 'CANTIDAD':   return recibirCantidad_(num, e.texto);
    case 'ELIGIENDO':  return catalogo_(num);
    case 'CARRITO':
      return botones_(num, 'Usa los botones para seguir con tu pedido 👇', botonesCarrito_());
    case 'MODIFICAR':
      return botones_(num, 'Elige cómo quieres arreglarlo 👇', botonesModificar_());
    case 'DESCUENTO':
      return botones_(num, 'Toca uno de los botones para decidir 👇',
        [{ id: 'desc_si', title: '✅ Sí, aplicar' }, { id: 'desc_no', title: 'No, gracias' }]);
    case 'ZONA':       return recibirZona_(num, e.texto);
    case 'DIRECCION':  return recibirDireccion_(num, e.texto, nombre);
    case 'CONFIRMAR':
      return botones_(num, 'Elige cómo prefieres pagar 👇\n_Si quieres salir, escribe *cancelar*._',
        botonesPago_(totalSesion_(num, nombre)));
  }
  return menu_(num, nombre);
}

/***** MENÚ, CUENTA Y PREMIOS *****/
function menu_(n, nombre) {
  const reg = asegurarCliente_(n, nombre, false);   // crea la cuenta en el primer contacto
  const s = getSes_(n);
  const hayCarrito = !!(s.carrito && s.carrito.length);
  const primero = nombre ? ' ' + nombre.split(' ')[0] : '';
  if (reg.nuevo) {
    texto_(n, '👋 ¡Hola' + primero + '! Qué gusto tenerte por aquí, soy el asistente de *' + NEGOCIO + '* ✨\n\n' + textoBienvenida_());
    return menuLista_(n, '¿Qué te preparamos hoy? 🛍️', hayCarrito);
  }
  menuLista_(n, '👋 ¡Hola' + primero + '! ¿Qué te preparamos hoy? 😊' + (hayCarrito ? '\n\n🛒 Tu carrito sigue guardado.' : ''), hayCarrito);
}

function menuLista_(n, cuerpo, conCarrito) {
  const rows = [];
  if (conCarrito) rows.push({ id: 'ver_carrito', title: '🛒 Ver mi carrito', description: 'Retoma tu pedido donde lo dejaste' });
  rows.push(
    { id: 'catalogo',    title: '🛍️ Ver catálogo',      description: 'Elige tus productos' },
    { id: 'mis_pedidos', title: '📦 Mis pedidos',        description: 'Revisa cómo van tus pedidos' },
    { id: 'mi_cuenta',   title: '👤 Mi cuenta',          description: 'Tus puntos y tu próxima compra' },
    { id: 'premios',     title: '🎁 Premios y puntos',   description: 'Cómo ganas descuentos' },
    { id: 'faq',         title: '❓ Envíos y pagos',      description: 'Cómo funcionan tus pedidos' },
    { id: 'asesor',      title: '💬 Hablar con asesor',  description: 'Te escribimos lo antes posible' }
  );
  wa_({
    to: n, type: 'interactive',
    interactive: {
      type: 'list', body: { text: recortar_(cuerpo, 1024) },
      action: { button: 'Ver opciones', sections: [{ title: 'Menú', rows: rows }] }
    }
  });
}

function navegacion_(n, cuerpo) {
  botones_(n, cuerpo, [
    { id: 'catalogo',  title: '🛍️ Catálogo' },
    { id: 'mi_cuenta', title: '👤 Mi cuenta' },
    { id: 'menu',      title: '📋 Menú' }
  ]);
}

function textoBienvenida_() {
  return '🎁 *Regalo por tu primera compra*\n' +
         moneda_(COMPRA1_DESC) + ' de descuento si tu pedido es de ' + moneda_(COMPRA1_MIN) + ' o más.\n\n' +
         '⭐ *Puntos desde tu segunda compra*\n' +
         'Ganas 1 punto (' + moneda_(1) + ') por cada ' + MONEDA + PUNTOS_CADA_Q + ' que pagas, y los usas cuando quieras.\n\n' +
         '_Escribe *premios* para ver los detalles._ 😉';
}

function premios_(n, nombre) {
  asegurarCliente_(n, nombre, false);
  textoYBotones_(n,
    '🎁 *' + PROGRAMA + '*\n\n' +
    '🥇 *Tu primera compra*\n' +
    moneda_(COMPRA1_DESC) + ' de descuento directo si tu pedido es de ' + moneda_(COMPRA1_MIN) + ' o más. ' +
    'Si no llegas al mínimo, el regalo no se guarda para otra compra.\n\n' +
    '⭐ *Desde tu segunda compra*\n' +
    'Ganas 1 punto por cada ' + MONEDA + PUNTOS_CADA_Q + ' que pagas. Cada punto vale ' + moneda_(1) +
    ' y lo puedes usar cuando quieras, sin mínimo ni límite.\n\n' +
    '📌 *Tomar en cuenta*\n' +
    '• Los puntos se suman cuando recibes tu pedido.\n' +
    '• Si usas puntos, se descuentan al instante. Si el pedido se cancela, te los devolvemos.\n' +
    (BLOQUEAR_CON_PENDIENTES ? '• Si ya tienes un pedido en proceso, la nueva compra no incluye el regalo de bienvenida.\n' : ''),
    '¿Qué deseas hacer?',
    [{ id: 'mi_cuenta', title: '👤 Mi cuenta' }, { id: 'catalogo', title: '🛍️ Catálogo' }, { id: 'menu', title: '📋 Menú' }]);
}

function faq_(n, nombre) {
  asegurarCliente_(n, nombre, false);
  texto_(n,
    '❓ *Cómo funcionan tus pedidos*\n\n' +
    '📦 *Envíos*\n' +
    'Despachamos con Cargo Expreso o Forza. Cuando tu paquete sale, te mando la guía por aquí.\n\n' +
    '💳 *Pago con link (Zigi)*\n' +
    'Te mando un link por WhatsApp, entras desde tu celular y pagas ahí mismo. No compartes datos de tu tarjeta por el chat. ' +
    'Después me mandas la foto de tu comprobante y lo revisamos.\n\n' +
    '🏦 *Transferencia*\n' +
    'Si prefieres transferir, dímelo y te paso los datos de la cuenta.\n\n' +
    '💵 *Contra entrega*\n' +
    'Disponible en pedidos de hasta ' + moneda_(MAX_EFECTIVO) + ' (por seguridad de los motoristas no manejamos más efectivo).\n\n' +
    '✅ Tus productos quedan apartados desde que confirmas el pedido.');
  const s = getSes_(n);
  if (s.estado === 'CONFIRMAR') {
    return botones_(n, '¿Cómo prefieres pagar? 👇', botonesPago_(totalSesion_(n, nombre)));
  }
  navegacion_(n, '¿Te ayudo con algo más? 😊');
}

function puntosPorAcreditar_(n) {
  const key = soloDigitos_(n);
  const d = hoja_(H_PED).getDataRange().getValues();
  let s = 0;
  for (let i = 1; i < d.length; i++) {
    const est = String(d[i][PED.ESTADO]).toUpperCase();
    if (soloDigitos_(d[i][PED.TELEFONO]) === key && est !== 'ENTREGADO' && est !== 'CANCELADO') {
      s += parseInt(d[i][PED.PTS_GANADOS], 10) || 0;
    }
  }
  return s;
}

// Referido de Zigi (se usa en "Mi cuenta" y en el mensaje de pedido entregado)
function bloqueZigi_() {
  if (!ZIGI_CODIGO) return '';
  return '\n\n💡 *¿Tienes tu propio negocio?*\n' +
         'Yo cobro con links de Zigi y me funciona muy bien. Si te registras con mi código *' + ZIGI_CODIGO + '*' +
         (ZIGI_URL ? ' (' + ZIGI_URL + ')' : '') + ' me ayudas con un extra 💸';
}

function miCuenta_(n, nombre) {
  const cli = asegurarCliente_(n, nombre, false).cli;
  const etapa = etapaDe_(cli);
  const porAcreditar = puntosPorAcreditar_(n);

  let proxima;
  if (etapa === 0) {
    proxima = 'Tienes un pedido en proceso. Cuando lo recibas, empiezas a ganar puntos 🙌';
  } else if (etapa === 1) {
    proxima = 'Tienes *' + moneda_(COMPRA1_DESC) + ' de descuento* si tu pedido es de ' + moneda_(COMPRA1_MIN) + ' o más 🎉';
  } else if (cli.puntos > 0) {
    proxima = 'Puedes usar tus ' + cli.puntos + ' puntos (' + moneda_(cli.puntos) + ') cuando quieras. ' +
              'Además ganas 1 punto por cada ' + MONEDA + PUNTOS_CADA_Q + ' que pagues.';
  } else {
    proxima = 'Ganas 1 punto por cada ' + MONEDA + PUNTOS_CADA_Q + ' que pagues ⭐';
  }

  textoYBotones_(n,
    '👤 *Mi cuenta*\n' +
    '📱 WhatsApp: +' + n + '\n\n' +
    '🛍️ Compras recibidas: *' + cli.compras + '*\n' +
    '⭐ Puntos disponibles: *' + cli.puntos + '* (valen ' + moneda_(cli.puntos) + ')\n' +
    (porAcreditar > 0 ? '⏳ Puntos por acreditar: *' + porAcreditar + '* (al recibir tu pedido)\n' : '') +
    (cli.pend > 0 ? '📦 Pedidos en proceso: *' + cli.pend + '*\n' : '') +
    '\n🎁 *Tu próxima compra*\n' + proxima + bloqueZigi_(),
    '¿Qué deseas hacer?',
    [{ id: 'catalogo', title: '🛍️ Catálogo' }, { id: 'mis_pedidos', title: '📦 Mis pedidos' }, { id: 'premios', title: '🎁 Premios' }]);
}

/***** FLUJO DE COMPRA *****/
function botonesCarrito_() {
  return [
    { id: 'agregar_otro', title: '➕ Agregar otro' },
    { id: 'ir_pagar',     title: '💳 Ir a pagar' },
    { id: 'modificar',    title: '✏️ Modificar pedido' }
  ];
}
function botonesModificar_() {
  return [
    { id: 'asesor',          title: '💬 Hablar con asesor' },
    { id: 'vaciar',          title: '🔄 Empezar de nuevo' },
    { id: 'volver_carrito',  title: '↩️ Volver al carrito' }
  ];
}

function catalogo_(n) {
  const prods = inventario_().filter(function (p) { return p.stock > 0 && p.precio > 0; }).slice(0, 10);
  if (!prods.length) return texto_(n, 'Por ahora no tenemos productos disponibles 😔 Vuelve pronto.');

  // Banner publicitario opcional (1 vez cada 6 h por cliente)
  if (BANNER_CATALOGO && !CacheService.getScriptCache().get('ban_' + n)) {
    CacheService.getScriptCache().put('ban_' + n, '1', 21600);
    enviarImagen_(n, BANNER_CATALOGO, '🔥 Novedades de ' + NEGOCIO);
  }

  wa_({
    to: n, type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: '🛍️ ¿Qué te preparamos? Elige el producto que te guste 👇' },
      action: {
        button: 'Ver productos',
        sections: [{
          title: 'Disponibles',
          rows: prods.map(function (p) {
            return {
              id: 'prod_' + p.sku,
              title: recortar_(p.producto, 24),
              description: recortar_(p.descripcion ? moneda_(p.precio) + ' · ' + p.descripcion : moneda_(p.precio), 72)
            };
          })
        }]
      }
    }
  });
}

function elegir_(n, sku) {
  const p = buscar_(sku);
  if (!p || p.stock < 1) { texto_(n, 'Ese producto se nos agotó 😕 Mira estas otras opciones:'); return catalogo_(n); }
  if (!(p.precio > 0)) {
    return texto_(n, 'Este producto no tiene precio por el momento. Escribe *menu* para ver otras opciones.');
  }

  const s = getSes_(n);
  s.carrito = s.carrito || [];
  const disp = p.stock - cantEnCarrito_(s.carrito, p.sku);
  if (disp < 1) {
    s.estado = 'ELIGIENDO'; setSes_(n, s);
    texto_(n, 'Ya tienes en tu carrito la cantidad máxima permitida de *' + p.producto + '* 🙈 Elige otro producto:');
    return catalogo_(n);
  }

  s.estado = 'CANTIDAD'; s.sku = String(p.sku); setSes_(n, s);

  const mensaje =
    '✨ *' + p.producto + '*\n' +
    (p.descripcion ? '_' + p.descripcion + '_\n\n' : '\n') +
    '💰 Precio: ' + moneda_(p.precio) + '\n\n' +
    '¿Cuántas quieres? Escríbeme el número 🔢\n_Si prefieres salir, escribe *cancelar*._';

  const code = p.imagen ? enviarImagen_(n, p.imagen, mensaje) : 0;   // foto con el mensaje como pie
  if (code !== 200) texto_(n, mensaje);                               // sin foto o si falla: solo texto
}

function recibirCantidad_(n, txt) {
  const s = getSes_(n);
  const p = buscar_(s.sku);
  if (!p || !(p.precio > 0)) {
    s.estado = 'ELIGIENDO'; setSes_(n, s);
    texto_(n, 'Ese producto ya no está disponible 😕 Elige otro:');
    return catalogo_(n);
  }

  const m = String(txt || '').match(/\d+/);
  const c = m ? parseInt(m[0], 10) : 0;
  if (!c || c < 1) return texto_(n, 'Escríbeme solo el número, por ejemplo: 2 😊');

  const v = valorarCarrito_(s.carrito || []);
  s.carrito = v.items;
  const disp = p.stock - cantEnCarrito_(s.carrito, p.sku);
  if (c > disp) {
    return texto_(n, 'Esa cantidad supera el límite permitido 🙈 Prueba con menos artículos.');
  }

  // Agregar al carrito (si el producto ya estaba, se suma). Sin bloqueos por monto.
  const linea = s.carrito.filter(function (it) { return String(it.sku) === String(p.sku); })[0];
  if (linea) linea.cant += c; else s.carrito.push({ sku: String(p.sku), nombre: p.producto, cant: c });
  s.estado = 'CARRITO'; setSes_(n, s);

  const v2 = valorarCarrito_(s.carrito);
  textoYBotones_(n,
    '✅ Agregué *' + p.producto + '* x' + c + '\n\n🛒 *Tu carrito:*\n' + lineasTexto_(v2.lineas) +
    '\n\n💰 *Subtotal:* ' + moneda_(v2.subtotal),
    'Llevas ' + v2.unidades + (v2.unidades === 1 ? ' artículo' : ' artículos') +
    ' en tu carrito. ¿Deseas agregar otro producto o ir a pagar?',
    botonesCarrito_());
}

function mostrarCarrito_(n, nombre) {
  const s = getSes_(n);
  const v = valorarCarrito_(s.carrito || []);
  if (!v.items.length) {
    texto_(n, 'Tu carrito está vacío 🛒 Elige algo del catálogo:');
    return catalogo_(n);
  }
  s.carrito = v.items; s.estado = 'CARRITO'; setSes_(n, s);
  if (v.avisos.length) texto_(n, '⚠️ *Ajustamos tu carrito:*\n' + v.avisos.map(function (a) { return '• ' + a; }).join('\n'));
  textoYBotones_(n, '🛒 *Tu carrito:*\n' + lineasTexto_(v.lineas) + '\n\n💰 *Subtotal:* ' + moneda_(v.subtotal),
    'Llevas ' + v.unidades + (v.unidades === 1 ? ' artículo' : ' artículos') +
    ' en tu carrito. ¿Deseas agregar otro producto o ir a pagar?', botonesCarrito_());
}

function agregarOtro_(n, nombre) {
  const s = getSes_(n);
  if (['CARRITO', 'ELIGIENDO', 'MODIFICAR'].indexOf(s.estado) < 0) return menu_(n, nombre);
  s.estado = 'ELIGIENDO'; setSes_(n, s);
  catalogo_(n);
}

function modificar_(n, nombre) {
  const s = getSes_(n);
  if (['CARRITO', 'ELIGIENDO', 'MODIFICAR'].indexOf(s.estado) < 0) return menu_(n, nombre);
  s.estado = 'MODIFICAR'; setSes_(n, s);
  botones_(n, 'Claro, sin problema 🙌 ¿Cómo lo arreglamos?\n\n' +
              'Si tu pedido es más complejo, un asesor lo ajusta contigo y tu carrito queda guardado mientras tanto.',
           botonesModificar_());
}

function vaciarCarrito_(n, nombre) {
  const s = getSes_(n);
  if (['CARRITO', 'ELIGIENDO', 'MODIFICAR'].indexOf(s.estado) < 0) return menu_(n, nombre);
  s.carrito = []; s.estado = 'ELIGIENDO'; setSes_(n, s);
  texto_(n, '🔄 Listo, empezamos de nuevo. ¿Qué te preparamos?');
  catalogo_(n);
}

function irAPagar_(n, nombre, omitirAviso) {
  const s = getSes_(n);
  if (['CARRITO', 'ELIGIENDO', 'MODIFICAR'].indexOf(s.estado) < 0) return menu_(n, nombre);
  if (!s.carrito || !s.carrito.length) {
    texto_(n, 'Tu carrito está vacío 🛒 Elige algo del catálogo:');
    return catalogo_(n);
  }

  const v = valorarCarrito_(s.carrito);
  s.carrito = v.items;
  if (v.avisos.length) texto_(n, '⚠️ *Ajustamos tu carrito:*\n' + v.avisos.map(function (a) { return '• ' + a; }).join('\n'));
  if (!v.items.length) { s.estado = 'ELIGIENDO'; setSes_(n, s); return catalogo_(n); }

  const cli = asegurarCliente_(n, nombre, false).cli;
  const etapa = etapaDe_(cli);
  const oferta = ofertaDisponible_(cli, v.subtotal);

  // Si está cerca del regalo de bienvenida, se lo decimos antes de pagar
  if (!oferta && !omitirAviso) {
    const aviso = avisoMeta_(etapa, v.subtotal);
    if (aviso) {
      s.estado = 'CARRITO'; setSes_(n, s);
      return textoYBotones_(n, aviso, 'Tu subtotal es ' + moneda_(v.subtotal) + '. ¿Qué prefieres?',
        [{ id: 'agregar_otro', title: '➕ Agregar otro' }, { id: 'seguir_pago', title: '➡️ Continuar' }]);
    }
  }
  if (etapa === 0) {
    texto_(n, 'ℹ️ Como ya tienes un pedido en proceso, esta compra no incluye el regalo de bienvenida. ' +
              'Cuando recibas ese pedido empiezas a ganar puntos ⭐');
  }

  s.desc = null; s.oferta = oferta;
  if (oferta) {
    s.estado = 'DESCUENTO'; setSes_(n, s);
    return mostrarOferta_(n, v.subtotal, oferta, cli);
  }
  pedirZona_(n, s);
}

function avisoMeta_(etapa, subtotal) {
  if (etapa === 1 && subtotal < COMPRA1_MIN) {
    return '🎁 Te faltan ' + moneda_(COMPRA1_MIN - subtotal) + ' para llevarte ' + moneda_(COMPRA1_DESC) +
           ' de descuento en tu primera compra. Ese regalo solo aplica en tu primera compra.';
  }
  return '';
}

function mostrarOferta_(n, subtotal, oferta, cli) {
  if (oferta.tipo === 'BIENVENIDA') {
    botones_(n,
      '🎁 ¡Buenas noticias! Por ser tu primera compra tienes *' + moneda_(oferta.monto) + '* de descuento 🎉\n\n' +
      'Tu pedido bajaría de ' + moneda_(subtotal) + ' a *' + moneda_(subtotal - oferta.monto) + '*.\n\n' +
      'Ojo: si no lo usas ahora, no se guarda para otra compra. ¿Lo aplico?',
      [{ id: 'desc_si', title: '✅ Sí, aplícalo' }, { id: 'desc_no', title: 'No, gracias' }]);
  } else {
    botones_(n,
      '⭐ Tienes *' + cli.puntos + ' puntos* (valen ' + moneda_(cli.puntos) + ').\n\n' +
      'Puedo usar *' + oferta.puntos + '* en este pedido y bajaría de ' + moneda_(subtotal) + ' a *' +
      moneda_(subtotal - oferta.monto) + '*. ¿Los uso?',
      [{ id: 'desc_si', title: '✅ Sí, usar puntos' }, { id: 'desc_no', title: '💾 Guardarlos' }]);
  }
}

function respuestaDescuento_(n, nombre, acepta) {
  const s = getSes_(n);
  if (s.estado !== 'DESCUENTO') return menu_(n, nombre);
  const of = s.oferta;
  s.desc = (acepta && of) ? { tipo: of.tipo, monto: of.monto } : null;
  s.oferta = null;
  if (acepta) texto_(n, '✅ Listo, ya quedó aplicado 🎉');
  else texto_(n, of && of.tipo === 'PUNTOS' ? 'Sin problema, tus puntos se quedan guardados 😉' : 'Sin problema, seguimos sin descuento.');
  pedirZona_(n, s);
}

/***** ENTREGA: 2 MENSAJES (municipio y zona / dirección y referencias) *****/
function pedirZona_(n, s) {
  s.estado = 'ZONA'; setSes_(n, s);
  texto_(n, '📍 Ahora tu entrega. ¿En qué *municipio y zona* estás?\n\n' +
            'Escríbelo así: *Mixco, zona 4, Guatemala*\n_(municipio, zona y departamento; si no sabes la zona, pon N/A)_');
}

function recibirZona_(n, txt) {
  const s = getSes_(n);
  const partes = String(txt || '').split(/[,;\n]+/).map(function (x) { return limpiar_(x, 60); }).filter(String);
  if (!partes.length || partes[0].length < 3) {
    return texto_(n, 'Necesito al menos tu municipio 🙏 Por ejemplo: *Mixco, zona 4, Guatemala*');
  }
  s.muni = partes[0]; s.zona = partes[1] || 'N/A'; s.depto = partes[2] || DEPTO_DEFAULT;
  s.estado = 'DIRECCION'; setSes_(n, s);
  texto_(n, '🏠 Perfecto. Ahora escríbeme en un solo mensaje tu *dirección exacta y una referencia*.\n\n' +
            'Ejemplo: _5a avenida 10-20, casa azul con portón negro, frente al parque_\n\n' +
            '📞 Te escribiremos a este mismo WhatsApp (+' + n + '). Si prefieres otro número, agrégalo al final.');
}

function recibirDireccion_(n, txt, nombre) {
  const s = getSes_(n);
  const v = limpiar_(txt, 300);
  if (v.length < 10) return texto_(n, 'Cuéntame un poquito más: dirección exacta y alguna referencia para ubicarte 🙏');
  s.dir = v;

  const val = valorarCarrito_(s.carrito || []);
  if (!val.items.length) {
    s.estado = 'ELIGIENDO'; s.carrito = []; setSes_(n, s);
    texto_(n, 'Los productos de tu carrito ya no están disponibles 😕 Mira otras opciones:');
    return catalogo_(n);
  }
  s.carrito = val.items;
  if (val.avisos.length) texto_(n, '⚠️ *Ajustamos tu carrito:*\n' + val.avisos.map(function (a) { return '• ' + a; }).join('\n'));

  const cli = asegurarCliente_(n, nombre, false).cli;
  const t = calcularTotales_(cli, val.subtotal, s.desc);
  s.estado = 'CONFIRMAR'; setSes_(n, s);

  const resumen =
    '🛒 *RESUMEN*\n\n' +
    '📦 *Productos:*\n' + lineasTexto_(val.lineas) + '\n\n' +
    '📍 *Entrega en:*\n' + s.muni + ', zona ' + s.zona + ', ' + s.depto + '\n\n' +
    '🏠 *Dirección y referencia:*\n' + s.dir + '\n\n' +
    '💰 *Subtotal:* ' + moneda_(t.subtotal) + '\n' +
    '🎁 *Descuento:* ' + descuentoTexto_(t) + '\n' +
    '✅ *TOTAL A PAGAR:* ' + moneda_(t.total) +
    (t.total > MAX_EFECTIVO
      ? '\n\n💡 Como tu pedido pasa de ' + moneda_(MAX_EFECTIVO) + ', por seguridad de nuestros motoristas no manejamos tanto efectivo. ' +
        'Puedes pagar con link o transferencia, o hablar con un asesor.'
      : '');

  textoYBotones_(n, resumen, t.total <= 0 ? '¿Confirmamos tu pedido?' : '¿Cómo prefieres pagar?', botonesPago_(t.total));
}

function botonesPago_(total) {
  if (total <= 0) {   // pedido cubierto 100% con puntos
    return [{ id: 'pagar_efectivo', title: '✅ Confirmar pedido' }, { id: 'faq', title: '❓ ¿Cómo funcionan?' }];
  }
  return [
    { id: 'pagar_link', title: '💳 Pagar con link' },
    total > MAX_EFECTIVO ? { id: 'asesor', title: '💬 Hablar con asesor' } : { id: 'pagar_efectivo', title: '💵 Contra entrega' },
    { id: 'faq', title: '❓ ¿Cómo funcionan?' }
  ];
}

// Total actual del carrito en sesión (para volver a mostrar los botones de pago)
function totalSesion_(n, nombre) {
  const s = getSes_(n);
  const val = valorarCarrito_(s.carrito || []);
  const cli = asegurarCliente_(n, nombre, false).cli;
  return calcularTotales_(cli, val.subtotal, s.desc).total;
}

/***** CONFIRMACIÓN DEL PEDIDO *****/
function confirmar_(n, nombre, metodo) {
  let pedido = null, falla = '', fallaPago = false, totalFalla = 0, s = null, motivo = '';
  const cache = CacheService.getScriptCache();

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    s = getSes_(n);                                   // la sesión se lee DENTRO del lock
    if (s.estado !== 'CONFIRMAR') motivo = 'ESTADO';
    else if (!s.carrito || !s.carrito.length) motivo = 'VACIO';
    else if (!s.muni || !s.dir) motivo = 'SINDIR';
    else {
      // 1) Revalidar el carrito contra el inventario real
      const hInv = hoja_(H_INV);
      const d = hInv.getDataRange().getValues();
      const filaDeSku = {};
      for (let k = 1; k < d.length; k++) filaDeSku[String(d[k][INV.SKU])] = k;

      const lineas = [];
      let subtotal = 0, unidades = 0;
      for (let j = 0; j < s.carrito.length; j++) {
        const it = s.carrito[j];
        const k = filaDeSku[String(it.sku)];
        if (k === undefined) { falla = 'Uno de los productos ya no existe.'; break; }
        const fila = d[k];
        const nom = fila[INV.PRODUCTO];
        const precio = aNumero_(fila[INV.PRECIO]);
        const stock = parseInt(fila[INV.STOCK], 10) || 0;
        const cant = parseInt(it.cant, 10) || 0;

        if (String(fila[INV.ACTIVO]).toUpperCase() !== 'SI') { falla = '*' + nom + '* se nos agotó.'; break; }
        if (!(precio > 0)) { falla = '*' + nom + '* no tiene precio por el momento.'; break; }
        if (cant < 1) { falla = 'Hay una cantidad inválida en *' + nom + '*.'; break; }
        if (stock < cant) { falla = 'La cantidad de *' + nom + '* supera el límite permitido.'; break; }

        const sub = round2_(precio * cant);
        subtotal += sub; unidades += cant;
        lineas.push({ sku: String(it.sku), producto: nom, cant: cant, precio: precio, subtotal: sub, fila: k, stock: stock });
      }
      subtotal = round2_(subtotal);

      if (!falla) {
        // 2) Cliente, totales y método de pago
        const cli = asegurarCliente_(n, nombre, true).cli;
        const t = calcularTotales_(cli, subtotal, s.desc);
        const sinPago = t.total <= 0;                    // cubierto 100% con puntos
        const esLink = metodo === 'LINK' && !sinPago;

        if (!esLink && !sinPago && t.total > MAX_EFECTIVO) {
          falla = 'Para pedidos de más de ' + moneda_(MAX_EFECTIVO) + ' no tenemos contra entrega, pero puedes pagar con link o transferencia 🙌';
          fallaPago = true; totalFalla = t.total;
        } else {
          // 3) Registrar el pedido
          const id = 'P' + Utilities.formatDate(new Date(), TZ, 'yyMMddHHmmss');
          const pagoTxt = sinPago ? 'Pagado con puntos' : (esLink ? 'Zigi / transferencia' : 'Contra entrega');
          const estado = esLink ? 'PENDIENTE_PAGO' : 'CONFIRMADO';

          const fila = new Array(PED_COLS).fill('');
          fila[PED.ID]            = id;
          fila[PED.FECHA]         = new Date();
          fila[PED.TELEFONO]      = String(n);
          fila[PED.NOMBRE]        = nombre;
          fila[PED.SKU]           = lineas.map(function (l) { return l.sku; }).join(', ');
          fila[PED.PRODUCTO]      = lineas.map(function (l) { return l.producto + ' x' + l.cant; }).join(' | ');
          fila[PED.CANTIDAD]      = unidades;
          fila[PED.PRECIO_UNIT]   = lineas.length === 1 ? lineas[0].precio : 'Varios';
          fila[PED.TOTAL]         = t.total;
          fila[PED.DIRECCION]     = s.dir;
          fila[PED.ZONA]          = s.zona || '';
          fila[PED.MUNICIPIO]     = s.muni;
          fila[PED.DEPARTAMENTO]  = s.depto || '';
          fila[PED.REFERENCIAS]   = 'Contacto: +' + n;
          fila[PED.PAGO]          = pagoTxt;
          fila[PED.ESTADO]        = estado;
          fila[PED.CARRITO]       = JSON.stringify(lineas.map(function (l) {
            return { sku: l.sku, producto: l.producto, cant: l.cant, precio: l.precio };
          }));
          fila[PED.SUBTOTAL]      = t.subtotal;
          fila[PED.DESCUENTO]     = t.descuento;
          fila[PED.TIPO_DESC]     = t.tipo;               // BIENVENIDA | PUNTOS | (vacío)
          fila[PED.PTS_USADOS]    = t.puntosUsados;
          fila[PED.PTS_GANADOS]   = t.puntosGanados;      // se acredita al marcar ENTREGADO
          hoja_(H_PED).appendRow(fila);

          // 4) Descontar el stock de inmediato (iterando el carrito)
          lineas.forEach(function (l) {
            hInv.getRange(l.fila + 1, INV.STOCK + 1).setValue(l.stock - l.cant);
          });
          invalidarInv_();

          // 5) Cerrar la sesión DENTRO del lock: un segundo toque no puede duplicar el pedido
          delSes_(n);
          cache.put('conf_' + n, '1', 30);

          pedido = { id: id, lineas: lineas, unidades: unidades, t: t, esLink: esLink, sinPago: sinPago, pago: pagoTxt, estado: estado,
                     subtotal: t.subtotal, total: t.total, dir: s.dir, zona: s.zona, muni: s.muni, depto: s.depto };
        }
      }
    }
  } finally { lock.releaseLock(); }

  // --- Fuera del lock: mensajes al cliente ---
  if (!pedido) {
    if (motivo === 'ESTADO') {
      if (cache.get('conf_' + n)) return;                // doble toque sobre un pedido recién confirmado: se ignora
      return menu_(n, nombre);
    }
    if (motivo === 'VACIO') { delSes_(n); return texto_(n, 'Tu carrito está vacío 🛒 Escribe *menu* para empezar.'); }
    if (motivo === 'SINDIR') return texto_(n, 'Me falta tu dirección de entrega 🙏 Escribe *menu* para retomar.');
    if (fallaPago) {
      texto_(n, 'ℹ️ ' + falla);
      return botones_(n, '¿Cómo prefieres pagar? 👇', botonesPago_(totalFalla));
    }
    // El carrito NO se pierde: lo ajustamos y se lo devolvemos
    const v = valorarCarrito_(s.carrito);
    s.carrito = v.items; s.estado = 'CARRITO'; setSes_(n, s);
    return textoYBotones_(n, '😕 ' + falla, 'Revisa tu carrito y seguimos:', botonesCarrito_());
  }

  const t = pedido.t;
  const primero = nombre ? ' ' + nombre.split(' ')[0] : '';
  const noche = esNoche_();

  let lineaPts = '';
  if (t.puntosUsados > 0) lineaPts += '⭐ Usaste ' + t.puntosUsados + ' puntos en este pedido.\n';
  if (t.puntosGanados > 0) lineaPts += '🌟 Cuando recibas tu pedido se sumarán *' + t.puntosGanados + ' puntos* a tu cuenta.\n';
  if (t.etapa === 1) lineaPts += '🌟 Desde tu próxima compra empiezas a ganar puntos.\n';

  const detalle =
    '🧾 Pedido: *' + pedido.id + '*\n\n' +
    lineasTexto_(pedido.lineas) + '\n\n' +
    '💰 Subtotal: ' + moneda_(pedido.subtotal) + '\n' +
    '🎁 Descuento: ' + descuentoTexto_(t) + '\n' +
    '✅ *Total: ' + moneda_(pedido.total) + '*\n\n' +
    lineaPts;

  if (pedido.esLink) {
    texto_(n, '🙌 ¡Listo' + primero + '! Tus cosas ya quedaron apartadas.\n\n' + detalle + '\n' +
              (noche
                ? '🌙 Ya es tarde, pero tranquilo: tu pedido está apartado. A primera hora (8:00 AM) te genero tu link de pago.'
                : '⏳ Dame un ratito, ahorita te genero tu link de pago y te lo mando por aquí.') +
              '\n\n📸 Cuando pagues, mándame la foto de tu comprobante.');
    botones_(n, '¿Necesitas algo mientras tanto?', [
      { id: 'transferir', title: '🏦 Prefiero transferir' },
      { id: 'asesor',     title: '💬 Hablar con asesor' },
      { id: 'menu',       title: '📋 Menú' }
    ]);
  } else {
    texto_(n, '🎉 ¡Pedido confirmado' + primero + '! Tus cosas ya quedaron apartadas.\n\n' + detalle +
              (pedido.sinPago ? '✅ Tu pedido quedó cubierto con puntos, no tienes que pagar nada.\n\n'
                              : '💵 Pagas ' + moneda_(pedido.total) + ' al recibir.\n\n') +
              '📞 Te escribimos por este WhatsApp para coordinar la entrega.' +
              (noche ? '\n\n🌙 Como ya es tarde, las guías se generan a partir de las 8:00 AM. Tu pedido está protegido.' : ''));
    navegacion_(n, '¿Te ayudo con algo más? 😊');
  }

  bitacora_('PEDIDO_CREADO', pedido.id, n, pedido.estado + ' · ' + pedido.pago + ' · ' + moneda_(pedido.total) +
            (t.tipo ? ' · ' + t.tipo : ''));
  try { notificar_(pedido, n, nombre); } catch (err) { registrarError_(err); }
}

function misPedidos_(n) {
  const filas = ultimosPedidos_(n, 5);
  if (!filas.length) return navegacion_(n, 'Todavía no tienes pedidos 🛍️ ¿Empezamos con el primero?');
  textoYBotones_(n, '📦 *Tus últimos pedidos:*\n\n' + filas.map(function (r) {
    const legacy = !r[PED.CARRITO];   // pedidos anteriores al carrito
    return '🧾 ' + r[PED.ID] +
           '\n   ' + r[PED.PRODUCTO] + (legacy ? ' x' + r[PED.CANTIDAD] : '') +
           '\n   💰 ' + moneda_(r[PED.TOTAL]) +
           '\n   📍 Estado: ' + r[PED.ESTADO];
  }).join('\n\n'), '¿Qué deseas hacer?', [
    { id: 'mi_cuenta', title: '👤 Mi cuenta' }, { id: 'catalogo', title: '🛍️ Catálogo' }, { id: 'menu', title: '📋 Menú' }]);
}

// Últimos pedidos del cliente: primero en Pedidos y, si faltan, en Historial. Lee solo las filas necesarias.
function ultimosPedidos_(n, max) {
  const key = soloDigitos_(n);
  const out = [];
  [H_PED, H_HIST].forEach(function (nombre) {
    if (out.length >= max) return;
    const h = hoja_(nombre);
    if (!h || h.getLastRow() < 2) return;
    const tels = h.getRange(2, PED.TELEFONO + 1, h.getLastRow() - 1, 1).getValues();
    const filas = [];
    for (let i = tels.length - 1; i >= 0 && filas.length < max - out.length; i--) {
      if (soloDigitos_(tels[i][0]) === key) filas.push(i + 2);
    }
    filas.forEach(function (f) { out.push(h.getRange(f, 1, 1, PED_COLS).getValues()[0]); });
  });
  return out.reverse();    // del más antiguo al más reciente
}

function asesor_(n, nombre) {
  const s = getSes_(n);
  const tieneCarrito = !!(s.carrito && s.carrito.length);
  texto_(n, '💬 Listo, ya le avisé a un asesor y te escribe lo antes posible.' +
            (tieneCarrito ? '\n\n🛒 Tu carrito queda guardado mientras tanto.' : ''));
  try { actualizarChat_(n, { modo: 'HUMANO', motivo: 'Pidió asesor', asignado: '' }); } catch (e3) { registrarError_(e3); }
  try {
    let extra = '';
    if (tieneCarrito) {
      const v = valorarCarrito_(s.carrito);
      extra = '\n\nCarrito actual:\n' + v.lineas.map(function (l) { return '- ' + l.producto + ' x' + l.cant + ' (' + moneda_(l.subtotal) + ')'; }).join('\n') +
              '\nSubtotal: ' + moneda_(v.subtotal);
    }
    MailApp.sendEmail(EMAIL_ADMIN, '[' + NEGOCIO + '] Cliente pide asesor',
      'Cliente: ' + nombre + '\nWhatsApp: +' + n + '\nhttps://wa.me/' + n + extra);
  } catch (err) { registrarError_(err); }
}

/***** PAGOS: TRANSFERENCIA, "YA PAGUÉ" Y CAPTURA DE COMPROBANTES *****/
function transferir_(n, nombre) {
  if (DATOS_TRANSFERENCIA) {
    texto_(n, '🏦 *Datos para transferir*\n\n' + DATOS_TRANSFERENCIA +
              '\n\n📸 Cuando la hagas, mándame por aquí la foto de tu boleta y la revisamos.');
  } else {
    texto_(n, '🏦 Claro. Un asesor te manda los datos de la cuenta en un momento. Cuando transfieras, mándame por aquí la foto de tu boleta 📸');
    try { MailApp.sendEmail(EMAIL_ADMIN, '[' + NEGOCIO + '] Cliente quiere transferir',
      'Cliente: ' + nombre + '\nWhatsApp: +' + n + '\nhttps://wa.me/' + n); } catch (err) { registrarError_(err); }
  }
}

function yaPague_(n, nombre) {
  texto_(n, '¡Perfecto! 🙌 Mándame por aquí la foto de tu comprobante 📸 y lo revisamos.');
}

function esNoche_() {
  const h = parseInt(Utilities.formatDate(new Date(), TZ, 'H'), 10);
  return h >= HORA_NOCHE_INICIO || h < HORA_NOCHE_FIN;
}

// Último pedido en PENDIENTE_PAGO de este cliente
function pedidoPendientePago_(n) {
  const key = soloDigitos_(n);
  const d = hoja_(H_PED).getDataRange().getValues();
  for (let i = d.length - 1; i >= 1; i--) {
    if (soloDigitos_(d[i][PED.TELEFONO]) === key && String(d[i][PED.ESTADO]).toUpperCase() === 'PENDIENTE_PAGO') {
      return { fila: i + 1, id: d[i][PED.ID], total: aNumero_(d[i][PED.TOTAL]) };
    }
  }
  return null;
}

// Image Catcher: responde al instante y avisa al administrador
function imagenRecibida_(n, nombre, e) {
  let ped = null;
  try { ped = pedidoPendientePago_(n); } catch (x) { registrarError_(x); }

  let msg = '📸 *¡Imagen recibida!*\n\n';
  if (ped) {
    msg += 'Ya se la pasé a nuestro equipo para verificar el pago de tu pedido *' + ped.id + '* ✅ En cuanto lo confirmemos te aviso por aquí.';
    try { hoja_(H_PED).getRange(ped.fila, PED.COMPROBANTE + 1).setValue(new Date()); } catch (x2) { registrarError_(x2); }
  } else {
    msg += 'Ya se la pasé a un asesor para que la revise y te escriba 🙌';
  }
  if (esNoche_()) {
    msg += '\n\n🌙 Como ya es tarde, la verificación y las guías se retoman a las 8:00 AM. Tu pedido sigue apartado, no te preocupes.';
  }
  texto_(n, msg);
  bitacora_('COMPROBANTE', ped ? ped.id : '', n, e.tipo + (ped ? '' : ' (sin pedido pendiente de pago)'));

  try { notificarImagen_(n, nombre, e, ped); } catch (err) { registrarError_(err); }
}

let MEDIA_MEMO_ = {};
function descargarMedia_(mediaId) {
  if (!mediaId) return null;
  if (MEDIA_MEMO_[mediaId]) return MEDIA_MEMO_[mediaId];
  const h = { Authorization: 'Bearer ' + WA_TOKEN };
  const meta = UrlFetchApp.fetch('https://graph.facebook.com/' + API_VERSION + '/' + mediaId, { headers: h, muteHttpExceptions: true });
  if (meta.getResponseCode() !== 200) return null;
  const url = JSON.parse(meta.getContentText()).url;
  const r = UrlFetchApp.fetch(url, { headers: h, muteHttpExceptions: true });
  const b = r.getResponseCode() === 200 ? r.getBlob() : null;
  if (b) MEDIA_MEMO_[mediaId] = b;
  return b;
}

function notificarImagen_(n, nombre, e, ped) {
  let blob = null;
  try { blob = descargarMedia_(e.media); } catch (x) { registrarError_(x); }

  const opts = {
    to: EMAIL_ADMIN,
    subject: '[' + NEGOCIO + '] ' + (ped ? 'Comprobante recibido · pedido ' + ped.id : 'Imagen recibida') + ' · +' + n,
    body: 'Cliente: ' + nombre + '\nWhatsApp: +' + n + '\nhttps://wa.me/' + n +
          (ped ? '\nPedido: ' + ped.id + '\nTotal: ' + moneda_(ped.total) + '\n\nVerifícalo y cambia el estado a CONFIRMADO en la hoja Pedidos.'
               : '\n\nNo tiene un pedido en PENDIENTE_PAGO.') +
          (e.caption ? '\nTexto: ' + e.caption : '') +
          (blob ? '' : '\n\n(No se pudo adjuntar la imagen; revísala en WhatsApp.)')
  };
  if (blob) {
    const ext = String(blob.getContentType() || 'image/jpeg').split('/')[1] || 'jpg';
    blob.setName('comprobante_' + n + '_' + Utilities.formatDate(new Date(), TZ, 'yyMMdd_HHmmss') + '.' + ext);
    opts.attachments = [blob];
  }
  MailApp.sendEmail(opts);
}

/***** FIDELIZACIÓN Y CARRITO: LÓGICA *****/
// Etapa: 0 = pedido en proceso sin entregar (sin regalo), 1 = primera compra, 2 = ya compró (puntos)
function etapaDe_(cli) {
  if (cli.compras >= 1) return 2;
  if (BLOQUEAR_CON_PENDIENTES && cli.pend > 0) return 0;
  return 1;
}

// Oferta disponible en este pedido (o null)
function ofertaDisponible_(cli, subtotal) {
  const etapa = etapaDe_(cli);
  if (etapa === 1 && subtotal >= COMPRA1_MIN) return { tipo: 'BIENVENIDA', monto: COMPRA1_DESC, puntos: 0 };
  if (etapa === 2 && cli.puntos > 0) {
    const pts = Math.min(cli.puntos, Math.floor(subtotal));   // 1 punto = Q1, sin tope salvo el valor del pedido
    return pts > 0 ? { tipo: 'PUNTOS', monto: pts, puntos: pts } : null;
  }
  return null;
}

// Aplica el descuento solo si el cliente lo aceptó y sigue siendo válido.
// Desde la 2da compra se gana 1 punto por cada Q10 pagados (usando puntos o no).
function calcularTotales_(cli, subtotal, eleccion) {
  const etapa = etapaDe_(cli);
  const of = ofertaDisponible_(cli, subtotal);
  let tipo = '', desc = 0, pts = 0;
  if (eleccion && of && of.tipo === eleccion.tipo) { tipo = of.tipo; desc = of.monto; pts = of.puntos; }
  const total = round2_(subtotal - desc);
  const ganados = etapa === 2 ? Math.floor(total / PUNTOS_CADA_Q) : 0;
  return { etapa: etapa, subtotal: subtotal, descuento: desc, tipo: tipo, puntosUsados: pts, total: total, puntosGanados: ganados };
}

function descuentoTexto_(t) {
  if (!(t.descuento > 0)) return moneda_(0);
  const et = t.tipo === 'BIENVENIDA' ? 'Regalo de bienvenida 🎁' : 'Canje de ' + t.puntosUsados + ' puntos ⭐';
  return '-' + moneda_(t.descuento) + ' (' + et + ')';
}

// Recalcula el carrito con precios y stock actuales del inventario
function valorarCarrito_(carrito) {
  const inv = {};
  inventario_().forEach(function (p) { inv[p.sku] = p; });
  const items = [], lineas = [], avisos = [];
  let subtotal = 0, unidades = 0;
  (carrito || []).forEach(function (it) {
    const p = inv[String(it.sku)];
    const nom = p ? p.producto : (it.nombre || it.sku);
    if (!p || !(p.precio > 0) || p.stock < 1) { avisos.push('*' + nom + '* se nos agotó y lo quitamos.'); return; }
    let cant = parseInt(it.cant, 10) || 0;
    if (cant > p.stock) { cant = p.stock; avisos.push('La cantidad de *' + nom + '* superaba el límite permitido, la ajustamos.'); }
    if (cant < 1) return;
    const sub = round2_(p.precio * cant);
    subtotal += sub; unidades += cant;
    items.push({ sku: p.sku, nombre: p.producto, cant: cant });
    lineas.push({ sku: p.sku, producto: p.producto, cant: cant, precio: p.precio, subtotal: sub });
  });
  return { items: items, lineas: lineas, avisos: avisos, subtotal: round2_(subtotal), unidades: unidades };
}

function cantEnCarrito_(carrito, sku) {
  return (carrito || []).filter(function (it) { return String(it.sku) === String(sku); })
    .reduce(function (a, it) { return a + (parseInt(it.cant, 10) || 0); }, 0);
}

function lineasTexto_(lineas) {
  return lineas.map(function (l) { return '🔹 ' + l.producto + ' x' + l.cant + ' — ' + moneda_(l.subtotal); }).join('\n');
}

/***** NOTIFICACIONES AL ADMINISTRADOR *****/
function notificar_(p, num, nombre) {
  const entrega = new Date();
  entrega.setDate(entrega.getDate() + DIAS_ENTREGA);

  const direccionCompleta = p.dir + ', Zona ' + p.zona + ', ' + p.muni + ', ' + p.depto;
  const productos = p.lineas.map(function (l) { return l.producto + ' x' + l.cant; }).join('\n   ');

  const detalle = 'Pedido: ' + p.id +
                  '\nEstado: ' + p.estado + (p.esLink ? '  → pega el link de Zigi en la columna Link_Zigi' : '') +
                  '\nPago: ' + p.pago +
                  '\nCliente: ' + nombre + ' (+' + num + ')' +
                  '\nProductos:\n   ' + productos +
                  '\nSubtotal: ' + moneda_(p.subtotal) +
                  '\nDescuento: ' + descuentoTexto_(p.t) +
                  '\nTotal: ' + moneda_(p.total) +
                  '\nPuntos a acreditar al entregar: ' + p.t.puntosGanados +
                  '\nEntrega en: ' + p.muni + ', zona ' + p.zona + ', ' + p.depto +
                  '\nDirección y referencia: ' + p.dir;

  if (CREAR_EVENTO) {
    try {
      CalendarApp.getDefaultCalendar().createAllDayEvent(
        'Entrega ' + p.id + ' - ' + nombre + ' (' + p.unidades + ' art.)' + (p.esLink ? ' [PAGO PENDIENTE]' : ''), entrega,
        { description: detalle, location: direccionCompleta });
    } catch (x) { registrarError_(x); }
  }
  if (CARPETA_DRIVE_ID) {
    try { DriveApp.getFolderById(CARPETA_DRIVE_ID).createFile('Pedido ' + p.id + '.txt', detalle, MimeType.PLAIN_TEXT); }
    catch (x2) { registrarError_(x2); }
  }
  MailApp.sendEmail(EMAIL_ADMIN, '[' + NEGOCIO + '] Nuevo pedido ' + p.id + (p.esLink ? ' · PENDIENTE DE LINK' : ''), detalle);
}

/***** TRIGGER ÚNICO: CAMBIOS DE ESTADO Y LINK_ZIGI EN EL SHEET *****/
// Instalar con instalarActivadores(). Debe existir UN SOLO activador de notificarEstado.
// Compras, puntos y pendientes NO se tocan aquí: son fórmulas en Clientes.
// Estado: maneja stock (cancelar devuelve, reactivar vuelve a descontar) y avisa al cliente.
// Link_Zigi: al pegar un enlace, se lo manda al cliente por WhatsApp.
function notificarEstado(e) {
  try {
    if (!e || !e.range) return;
    const hoja = e.range.getSheet();
    const fila = e.range.getRow();
    if (hoja.getName() !== H_PED || fila < 2) return;
    if (e.range.getNumRows() > 1 || e.range.getNumColumns() > 1) return;

    const col = e.range.getColumn();
    if (col === PED.LINK + 1) return enviarLinkZigi_(hoja, fila);
    if (col !== PED.ESTADO + 1) return;

    const estado = String(e.range.getValue() || '').trim().toUpperCase();
    if (ESTADOS_PEDIDO.indexOf(estado) < 0) return;
    if (e.oldValue && String(e.oldValue).trim().toUpperCase() === estado) return;

    try {
      aplicarCambioEstado_(hoja, fila, estado, e.oldValue, { escribir: false });
    } catch (errLock) {
      registrarError_(errLock);
      e.range.setNote('⚠️ No se pudo procesar el cambio (sistema ocupado). Vuelve a elegir el estado.');
      return;
    }
    if (String(e.range.getNote()).indexOf('No se pudo procesar') > -1) e.range.clearNote();
  } catch (err) { registrarError_(err); }
}

function aplicarCambioEstado_(hoja, fila, estado, anterior, op) {
  op = op || {};
  let f = null, faltantes = [], duplicado = false;

  conLock_(function () {
    if (op.escribir) {
      const actual = String(hoja.getRange(fila, PED.ESTADO + 1).getValue() || '').trim().toUpperCase();
      if (actual === estado) { duplicado = true; return; }   // doble toque: no repite nada
      anterior = actual;
      if (op.transp) hoja.getRange(fila, PED.TRANSPORTISTA + 1).setValue(op.transp);
      if (op.guia)   hoja.getRange(fila, PED.GUIA + 1).setValue(op.guia);
      hoja.getRange(fila, PED.ESTADO + 1).setValue(estado);
    }

    f = hoja.getRange(fila, 1, 1, PED_COLS).getValues()[0];
    let control = String(f[PED.CONTROL] || '');
    const devuelto = control.indexOf('CAN') > -1;

    if (estado === 'CANCELADO' && !devuelto) {
      ajustarStock_(carritoDePedido_(f), 1);
      control += ' CAN';
    } else if (estado !== 'CANCELADO' && devuelto) {
      faltantes = ajustarStock_(carritoDePedido_(f), -1);
      control = control.replace('CAN', '');
    }
    hoja.getRange(fila, PED.CONTROL + 1).setValue(control.trim());

    if (estado === 'ENTREGADO' && String(f[PED.PAGO]).indexOf('Contra') === 0) {
      hoja.getRange(fila, PED.PAGO + 1).setValue('Cobrado');
    }
  }, 30000);

  if (duplicado) return { duplicado: true, enviado: false, detalle: 'Ya estaba en ese estado.' };

  if (faltantes.length) {
    try {
      MailApp.sendEmail(EMAIL_ADMIN, '[' + NEGOCIO + '] Stock insuficiente al reactivar ' + f[PED.ID],
        'Al reactivar el pedido ' + f[PED.ID] + ' no alcanzó el stock de:\n' + faltantes.join('\n') +
        '\nEl stock quedó en 0 para esos productos. Revisa el inventario.');
    } catch (x) { registrarError_(x); }
  }

  const id = f[PED.ID];
  const tel = soloDigitos_(f[PED.TELEFONO]);
  bitacora_('ESTADO', id, tel, (anterior || '?') + ' → ' + estado);
  if (tel.length < 8) {
    registrarError_(new Error('Pedido ' + id + ' sin teléfono válido: no se avisó al cliente'));
    return { enviado: false, detalle: 'El pedido no tiene un teléfono válido; no se avisó al cliente.' };
  }

  const total = moneda_(f[PED.TOTAL]);
  const guia = f[PED.GUIA] ? '\nGuía: *' + f[PED.GUIA] + '*' : '';
  const transp = f[PED.TRANSPORTISTA] ? '\nTransportista: *' + f[PED.TRANSPORTISTA] + '*' : '';
  const pts = parseInt(f[PED.PTS_GANADOS], 10) || 0;
  const pagoOnline = String(f[PED.PAGO]).indexOf('Zigi') > -1;

  const msgs = {
    'PENDIENTE_PAGO': '⏳ Tu pedido *' + id + '* sigue apartado, estamos esperando tu pago. Si ya pagaste, mándame la foto de tu comprobante 📸',
    'CONFIRMADO':  pagoOnline ? '✅ ¡Pago verificado! Tu pedido *' + id + '* quedó confirmado, ya empezamos a prepararlo 🙌'
                              : '✅ Tu pedido *' + id + '* quedó confirmado. Pronto empezamos a prepararlo 🙌',
    'PREPARANDO':  '🛠️ Estamos preparando tu pedido *' + id + '* con mucho cariño.',
    'EMPACADO':    '📦 Tu pedido *' + id + '* ya está empacado y listo para salir.',
    'DESPACHADO':  '🚚 ¡Tu pedido *' + id + '* ya salió!' + transp + guia,
    'EN_RUTA':     '🛵 Tu pedido *' + id + '* va en camino.' + (pagoOnline ? '' : ' Ten listo el pago contra entrega: *' + total + '* 💵'),
    'ENTREGADO':   '🎉 ¡Tu pedido *' + id + '* fue entregado! Gracias por confiar en nosotros 💚' +
                   (pts > 0 ? '\n\n⭐ Se sumaron *' + pts + ' puntos* a tu cuenta.' : '') + bloqueZigi_(),
    'INCIDENCIA':  '⚠️ Tuvimos una incidencia con tu pedido *' + id + '*. Un asesor te escribe pronto para resolverla 🙏',
    'CANCELADO':   '❌ Tu pedido *' + id + '* fue cancelado. Si tienes dudas, escríbenos y con gusto te ayudamos.'
  };

  let code;
  if (estado === 'ENTREGADO') {
    code = botones_(tel, msgs[estado], [{ id: 'mi_cuenta', title: '👤 Mi cuenta' }, { id: 'catalogo', title: '🛍️ Catálogo' }]);
  } else {
    code = texto_(tel, msgs[estado]);
  }
  return {
    enviado: code === 200,
    detalle: code === 200 ? 'Cliente avisado por WhatsApp.'
      : 'El estado cambió, pero no se pudo avisar al cliente: ' + errorWhatsApp_(code)
  };
}

// Al pegar el link en la columna Link_Zigi, se envía al cliente
function enviarLinkZigi_(hoja, fila) {
  const f = hoja.getRange(fila, 1, 1, PED_COLS).getValues()[0];
  const celda = hoja.getRange(fila, PED.LINK + 1);
  const link = String(f[PED.LINK] || '').trim();
  if (!link) return;
  if (!/^https?:\/\//i.test(link)) { celda.setNote('No se envió: el link debe empezar con http:// o https://'); return; }
  if (String(celda.getNote()).indexOf(link) > -1) return;            // este mismo link ya se envió

  const estado = String(f[PED.ESTADO]).toUpperCase();
  if (estado === 'CANCELADO' || estado === 'ENTREGADO') { celda.setNote('No se envió: el pedido está ' + estado); return; }

  const tel = soloDigitos_(f[PED.TELEFONO]);
  if (tel.length < 8) { celda.setNote('No se envió: este pedido no tiene un teléfono válido en la columna Telefono.'); return; }

  const id = f[PED.ID];
  const total = moneda_(f[PED.TOTAL]);
  const cuerpo = '💳 *Aquí está tu link de pago*\n\n' +
                 '🧾 Pedido: *' + id + '*\n💰 Total: *' + total + '*\n\n' + link + '\n\n' +
                 'Entras desde tu celular y pagas ahí mismo. Cuando termines, mándame la foto de tu comprobante por este chat 📸';

  let code = botones_(tel, cuerpo, [
    { id: 'ya_pague',   title: '✅ Ya pagué' },
    { id: 'transferir', title: '🏦 Prefiero transferir' },
    { id: 'asesor',     title: '💬 Hablar con asesor' }
  ]);
  if (code !== 200 && PLANTILLA_LINK) {          // fuera de la ventana de 24 h: se usa la plantilla aprobada
    code = wa_({ to: tel, type: 'template', template: { name: PLANTILLA_LINK, language: { code: 'es' },
      components: [{ type: 'body', parameters: [
        { type: 'text', text: String(id) }, { type: 'text', text: total }, { type: 'text', text: link }] }] } });
  }
  if (code === 200) {
    celda.setNote('Link enviado ' + Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm') + ': ' + link);
    bitacora_('LINK_ENVIADO', id, tel, link);
  } else {
    celda.setNote('NO se pudo enviar (revisa la hoja Errores). Código ' + code);
  }
}

// Reconstruye el carrito de un pedido (con compatibilidad para pedidos viejos de 1 producto)
function carritoDePedido_(f) {
  try {
    const c = JSON.parse(f[PED.CARRITO]);
    if (Array.isArray(c) && c.length) return c;
  } catch (x) {}
  const cant = parseInt(f[PED.CANTIDAD], 10) || 0;
  return (f[PED.SKU] && cant) ? [{ sku: String(f[PED.SKU]), cant: cant }] : [];
}

// signo = +1 devuelve stock, -1 descuenta. SIN lock propio: llamar dentro de un lock ya tomado.
// Devuelve la lista de productos cuyo stock no alcanzó al descontar.
function ajustarStock_(carrito, signo) {
  const faltantes = [];
  if (!carrito || !carrito.length) return faltantes;
  const h = hoja_(H_INV);
  const d = h.getDataRange().getValues();
  carrito.forEach(function (it) {
    const cant = parseInt(it.cant, 10) || 0;
    if (cant < 1) return;
    for (let k = 1; k < d.length; k++) {
      if (String(d[k][INV.SKU]) === String(it.sku)) {
        const actual = parseInt(d[k][INV.STOCK], 10) || 0;
        let nuevo = actual + signo * cant;
        if (nuevo < 0) { faltantes.push(d[k][INV.PRODUCTO] + ' (faltaron ' + (-nuevo) + ')'); nuevo = 0; }
        h.getRange(k + 1, INV.STOCK + 1).setValue(nuevo);
        d[k][INV.STOCK] = nuevo;
        break;
      }
    }
  });
  invalidarInv_();
  return faltantes;
}

/***** ENVÍO WHATSAPP (con freno anti-bucle) *****/
function wa_(payload) {
  const to = soloDigitos_(payload.to);
  if (to.length < 8) {
    registrarError_(new Error('Envío omitido: destinatario vacío o inválido (tipo ' + (payload.type || '?') + ')'));
    return 0;
  }
  payload.to = to;

  const cache = CacheService.getScriptCache();
  if (cache.get('rl_' + to)) return 429;
  const kc = 'o_' + to;
  const cnt = parseInt(cache.get(kc), 10) || 0;
  if (cnt >= MAX_MSG_POR_MIN) {
    cache.put('rl_' + to, '1', 60);
    registrarError_(new Error('Freno anti-bucle: más de ' + MAX_MSG_POR_MIN + ' mensajes por minuto a +' + to));
    return 429;
  }
  cache.put(kc, String(cnt + 1), 60);

  const url = 'https://graph.facebook.com/' + API_VERSION + '/' + PHONE_NUMBER_ID + '/messages';
  const res = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + WA_TOKEN },
    payload: JSON.stringify(Object.assign({ messaging_product: 'whatsapp' }, payload)),
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  const cuerpo = res.getContentText();
  let wamid = '';
  if (code !== 200) {
    WA_ULTIMO_ERROR_ = cuerpo;
    registrarError_(new Error('Graph ' + code + ' (+' + to + '): ' + cuerpo));
    if (cuerpo.indexOf('131056') > -1) cache.put('rl_' + to, '1', 60);
  } else {
    WA_ULTIMO_ERROR_ = '';
    try { wamid = ((JSON.parse(cuerpo).messages || [])[0] || {}).id || ''; } catch (x) {}
  }
  registrarMsg_('OUT', to, '', AUTOR_ACTUAL_, payload.type, resumenSaliente_(payload), '', wamid, code);
  return code;
}

function resumenSaliente_(p) {
  if (p.type === 'image') return '📷 ' + ((p.image || {}).caption || '');
  if (p.type === 'text') return (p.text && p.text.body) || '';
  if (p.type === 'interactive') {
    const i = p.interactive || {};
    let t = (i.body && i.body.text) || '';
    if (i.type === 'button') t += '\n' + i.action.buttons.map(function (b) { return '[' + b.reply.title + ']'; }).join(' ');
    if (i.type === 'list') t += '\n[Lista: ' + i.action.button + ']';
    return t;
  }
  if (p.type === 'template') return '[Plantilla ' + ((p.template || {}).name || '') + ']';
  return '[' + p.type + ']';
}

// Traduce el error de Meta a algo que un empleado entienda
function errorWhatsApp_(code) {
  const b = String(WA_ULTIMO_ERROR_ || '');
  if (code === 401) return 'WhatsApp rechazó el token (401). Hay que renovar WA_TOKEN.';
  if (b.indexOf('131047') > -1) return 'Pasaron más de 24 h desde el último mensaje del cliente. WhatsApp solo permite plantillas aprobadas.';
  if (b.indexOf('131030') > -1) return 'Ese número no está en la lista de destinatarios permitidos (cuenta de prueba de Meta).';
  if (b.indexOf('131056') > -1) return 'Demasiados mensajes seguidos a este cliente. Espera un minuto.';
  if (code === 0) return 'Destinatario inválido.';
  return 'WhatsApp no aceptó el mensaje (código ' + code + '). Revisa la hoja Errores.';
}
function texto_(to, body) { return wa_({ to: to, type: 'text', text: { body: body } }); }
function botones_(to, body, btns) {
  return wa_({
    to: to, type: 'interactive',
    interactive: {
      type: 'button', body: { text: recortar_(body, 1024) },
      action: { buttons: btns.slice(0, 3).map(function (b) { return { type: 'reply', reply: { id: b.id, title: recortar_(b.title, 20) } }; }) }
    }
  });
}
// El cuerpo de un mensaje con botones admite máx. 1024 caracteres.
// Si el contenido es largo, va como texto y los botones con una pregunta corta.
function textoYBotones_(to, cuerpo, pregunta, btns) {
  const junto = cuerpo + '\n\n' + pregunta;
  if (junto.length <= 1000) return botones_(to, junto, btns);
  texto_(to, cuerpo);
  return botones_(to, pregunta, btns);
}
// Recorta sin partir emojis a la mitad
function recortar_(s, max) {
  const a = Array.from(String(s === null || s === undefined ? '' : s));
  return a.length > max ? a.slice(0, max).join('') : a.join('');
}

/***** DATOS *****/
let SS_MEMO_ = null;
function ss_() { return SS_MEMO_ || (SS_MEMO_ = SpreadsheetApp.openById(SHEET_ID)); }
function hoja_(nombre) { return ss_().getSheetByName(nombre); }

function aNumero_(v) {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  const limpio = String(v === null || v === undefined ? '' : v).replace(/[^0-9.\-]/g, '');
  const n = parseFloat(limpio) || 0;
  return isFinite(n) ? n : 0;
}
function round2_(x) { return Math.round((Number(x) + Number.EPSILON) * 100) / 100; }
function soloDigitos_(v) { return String(v === null || v === undefined ? '' : v).replace(/\D/g, ''); }

// Formato de moneda: Q1,000.00 · Q15.50 · Q700.00
function moneda_(v) {
  const num = round2_(aNumero_(v));
  const neg = num < 0;
  const p = Math.abs(num).toFixed(2).split('.');
  p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '-' : '') + MONEDA + p[0] + '.' + p[1];
}

function limpiar_(txt, max) {
  return String(txt === null || txt === undefined ? '' : txt).replace(/\s+/g, ' ').trim().substring(0, max || 200);
}

// El inventario se lee una sola vez por ejecución (se invalida cuando se escribe stock)
let INV_MEMO_ = null;
function invalidarInv_() { INV_MEMO_ = null; }
function inventario_() {
  if (INV_MEMO_) return INV_MEMO_;
  const d = hoja_(H_INV).getDataRange().getValues();
  const out = [];
  for (let i = 1; i < d.length; i++) {
    if (!d[i][INV.SKU]) continue;
    if (String(d[i][INV.ACTIVO]).toUpperCase() !== 'SI') continue;
    out.push({
      sku: String(d[i][INV.SKU]),
      producto: d[i][INV.PRODUCTO],
      descripcion: d[i][INV.DESC] || '',
      precio: aNumero_(d[i][INV.PRECIO]),
      stock: parseInt(d[i][INV.STOCK], 10) || 0,
      imagen: d[i][INV.IMAGEN]
    });
  }
  INV_MEMO_ = out;
  return out;
}
function buscar_(sku) {
  const l = inventario_().filter(function (p) { return p.sku === String(sku); });
  return l.length ? l[0] : null;
}

/***** CLIENTES: columnas C a G son FÓRMULAS sobre Pedidos + Historial *****/
function letra_(i) {   // índice base 0 → letra de columna
  let s = ''; i++;
  while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
  return s;
}

function formulasCliente_(r) {
  const col = function (hoja, idx) { return "'" + hoja + "'!$" + letra_(idx) + ':$' + letra_(idx); };
  const A = '$' + letra_(CLI.TEL) + r;
  const cCompras = '$' + letra_(CLI.COMPRAS) + r;
  const cPend = '$' + letra_(CLI.PEND) + r;
  const enDos = function (fn) { return fn(H_PED) + '+' + fn(H_HIST); };    // suma lo vivo + lo archivado

  const compras = enDos(function (h) {
    return 'COUNTIFS(' + col(h, PED.TELEFONO) + ',' + A + ',' + col(h, PED.ESTADO) + ',"ENTREGADO")'; });
  const ganados = enDos(function (h) {
    return 'SUMIFS(' + col(h, PED.PTS_GANADOS) + ',' + col(h, PED.TELEFONO) + ',' + A + ',' + col(h, PED.ESTADO) + ',"ENTREGADO")'; });
  const usados = enDos(function (h) {
    return 'SUMIFS(' + col(h, PED.PTS_USADOS) + ',' + col(h, PED.TELEFONO) + ',' + A + ',' + col(h, PED.ESTADO) + ',"<>CANCELADO")'; });
  const total = enDos(function (h) {
    return 'SUMIFS(' + col(h, PED.TOTAL) + ',' + col(h, PED.TELEFONO) + ',' + A + ',' + col(h, PED.ESTADO) + ',"ENTREGADO")'; });
  // Pendientes: solo existen en Pedidos (Historial guarda únicamente pedidos cerrados)
  const pend = 'COUNTIFS(' + col(H_PED, PED.TELEFONO) + ',' + A + ',' + col(H_PED, PED.ESTADO) + ',"<>CANCELADO")-COUNTIFS(' +
               col(H_PED, PED.TELEFONO) + ',' + A + ',' + col(H_PED, PED.ESTADO) + ',"ENTREGADO")';

  return [
    '=' + compras,
    '=MAX(0,(' + ganados + ')-(' + usados + '))',
    '=' + pend,
    '=IF(' + cCompras + '>=1,"Compra "&(' + cCompras + '+1)&": puntos",IF(' + cPend + '>0,"Pedido en proceso","Compra 1: regalo de bienvenida"))',
    '=' + total
  ];
}

function hojaClientes_() {
  let h = hoja_(H_CLIENTES);
  if (!h) { h = ss_().insertSheet(H_CLIENTES); h.appendRow(CLI_HEADERS); h.setFrozenRows(1); formatoClientes_(h); }
  return h;
}

function formatoClientes_(h) {
  // Migración: la primera versión tenía la columna Vale_Usado en E
  if (String(h.getRange(1, 5).getValue()) === 'Vale_Usado') h.deleteColumn(5);
  for (let c = 0; c < CLI_HEADERS.length; c++) {
    const cell = h.getRange(1, c + 1);
    if (String(cell.getValue()) !== CLI_HEADERS[c]) cell.setValue(CLI_HEADERS[c]);
  }
  const filas = Math.max(h.getMaxRows() - 1, 1);
  h.getRange(2, CLI.TEL + 1, filas, 1).setNumberFormat('@');
  h.getRange(2, CLI.TOTAL + 1, filas, 1).setNumberFormat('"Q"#,##0.00');
  h.getRange(2, CLI.REGISTRO + 1, filas, 1).setNumberFormat('dd/MM/yyyy HH:mm');
}

function buscarCliente_(h, tel) {
  const key = soloDigitos_(tel);
  const last = h.getLastRow();
  if (last < 2) return null;
  const d = h.getRange(2, 1, last - 1, CLI.PEND + 1).getValues();
  for (let i = 0; i < d.length; i++) {
    if (soloDigitos_(d[i][CLI.TEL]) === key) {
      return {
        fila: i + 2, tel: key, nombre: d[i][CLI.NOMBRE],
        compras: parseInt(d[i][CLI.COMPRAS], 10) || 0,
        puntos: Math.max(0, Math.floor(aNumero_(d[i][CLI.PUNTOS]))),
        pend: parseInt(d[i][CLI.PEND], 10) || 0
      };
    }
  }
  return null;
}

function tienePedidos_(tel) {
  const key = soloDigitos_(tel);
  return [H_PED, H_HIST].some(function (nombre) {
    const h = hoja_(nombre);
    if (!h || h.getLastRow() < 2) return false;
    return h.getRange(2, PED.TELEFONO + 1, h.getLastRow() - 1, 1).getValues()
      .some(function (r) { return soloDigitos_(r[0]) === key; });
  });
}

// Devuelve { cli, nuevo }. Camino rápido SIN lock si el cliente ya existe; el lock solo se usa para crearlo.
function asegurarCliente_(n, nombre, yaBloqueado) {
  const h = hojaClientes_();
  let cli = buscarCliente_(h, n);
  if (cli) return { cli: cli, nuevo: false };

  let lock = null;
  if (!yaBloqueado) { lock = LockService.getScriptLock(); lock.waitLock(30000); }
  try {
    cli = buscarCliente_(h, n);                       // otro mensaje pudo crearlo mientras esperábamos
    if (cli) return { cli: cli, nuevo: false };

    hojaHistorial_();                                 // las fórmulas necesitan que Historial exista
    const nuevo = !tienePedidos_(n);
    const fila = Math.max(h.getLastRow(), 1) + 1;
    h.getRange(fila, CLI.TEL + 1).setNumberFormat('@').setValue(soloDigitos_(n));
    h.getRange(fila, CLI.NOMBRE + 1).setValue(nombre || '');
    h.getRange(fila, CLI.COMPRAS + 1, 1, 5).setFormulas([formulasCliente_(fila)]);
    h.getRange(fila, CLI.REGISTRO + 1).setValue(new Date());
    SpreadsheetApp.flush();
    cli = buscarCliente_(h, n);
    return { cli: cli, nuevo: nuevo };
  } finally { if (lock) lock.releaseLock(); }
}

/***** SESIÓN (estado de la conversación) *****/
// La sesión guarda: estado, sku, carrito [{sku, nombre, cant}], desc, oferta, muni, zona, depto, dir
function getSes_(n) { const r = CacheService.getScriptCache().get('s_' + n); return r ? JSON.parse(r) : {}; }
function setSes_(n, o) { CacheService.getScriptCache().put('s_' + n, JSON.stringify(o), 21600); }
function delSes_(n) { CacheService.getScriptCache().remove('s_' + n); }

/***** LOGS Y BITÁCORA (sin lock: appendRow es atómico) *****/
function guardarLog_(fila) {
  let h = hoja_(H_MSG);
  if (!h) {
    h = ss_().insertSheet(H_MSG);
    h.appendRow(['Fecha', 'Número', 'Nombre', 'Mensaje', 'Tipo', 'ID Mensaje', 'Respuesta enviada']);
    h.setFrozenRows(1);
  }
  if (fila.length === 6) fila.push('OK');
  h.appendRow(fila);
}

// Un mismo error se registra una sola vez por minuto (evita inundar la hoja en un bucle)
function registrarError_(err) {
  try {
    const msg = String((err && err.message) || err);
    const cache = CacheService.getScriptCache();
    const key = 'e_' + Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, msg.substring(0, 200))).substring(0, 24);
    if (cache.get(key)) return;
    cache.put(key, '1', 60);
    let h = hoja_(H_ERR);
    if (!h) { h = ss_().insertSheet(H_ERR); h.appendRow(['Fecha', 'Error']); }
    h.appendRow([new Date(), msg]);
  } catch (e) {}
}

function bitacora_(evento, pedido, tel, detalle) {
  try {
    hojaBitacora_().appendRow([new Date(), evento, pedido || '', tel ? soloDigitos_(tel) : '', String(detalle || '').substring(0, 500)]);
  } catch (e) {}
}

/***** HOJAS DE DATOS: HISTORIAL, DETALLE, RESUMEN, BITÁCORA *****/
function hojaConEncabezado_(nombre, headers, formatoFn) {
  let h = hoja_(nombre);
  if (!h) {
    h = ss_().insertSheet(nombre);
    h.appendRow(headers);
    h.setFrozenRows(1);
    if (formatoFn) formatoFn(h);
  }
  return h;
}
function hojaHistorial_() {
  return hojaConEncabezado_(H_HIST, PED_HEADERS.concat(['Fecha_Archivo']), function (h) {
    h.getRange(2, PED.TELEFONO + 1, Math.max(h.getMaxRows() - 1, 1), 1).setNumberFormat('@');
  });
}
function hojaItems_() {
  return hojaConEncabezado_(H_ITEMS, ITEMS_HEADERS, function (h) {
    h.getRange(2, 3, Math.max(h.getMaxRows() - 1, 1), 1).setNumberFormat('@');
  });
}
function hojaResumen_() { return hojaConEncabezado_(H_RES, RES_HEADERS); }
function hojaBitacora_() {
  return hojaConEncabezado_(H_BIT, BIT_HEADERS, function (h) {
    h.getRange(2, 4, Math.max(h.getMaxRows() - 1, 1), 1).setNumberFormat('@');
  });
}

/***** CORTE DIARIO: ARCHIVAR, LIMPIAR Y RESUMIR *****/
// Se ejecuta solo cada noche (instalarActivadores) o a mano desde el menú de la hoja.
// 1) Mueve pedidos ENTREGADO/CANCELADO viejos a Historial (y sus productos a Detalle_Items)
// 2) Actualiza Resumen_Diario  3) Limpia datos  4) Depura Mensajes y Errores  5) Te manda el resumen por correo
function corteDiario() {
  const ahora = new Date();
  const dias = Math.max(1, DIAS_ARCHIVAR);
  const limite = new Date(ahora.getTime() - dias * 86400000);
  const limitePago = new Date(ahora.getTime() - HORAS_ALERTA_PAGO * 3600000);
  const rep = { archivados: 0, items: 0, pedidosAyer: 0, ventasAyer: 0, sinTel: [], pagoViejo: [], dupClientes: [],
                logs: 0, errs: 0, errs24h: 0, arreglos: 0 };

  conLock_(function () {
    const hP = hoja_(H_PED);
    const last = hP.getLastRow();
    if (last < 2) return;
    const datos = hP.getRange(2, 1, last - 1, PED_COLS).getValues();

    const mover = [];
    datos.forEach(function (f, i) {
      if (!f[PED.ID]) return;
      const est = String(f[PED.ESTADO]).trim().toUpperCase();
      const fecha = f[PED.FECHA] instanceof Date ? f[PED.FECHA] : null;
      if (soloDigitos_(f[PED.TELEFONO]).length < 8) rep.sinTel.push(f[PED.ID]);
      if (est === 'PENDIENTE_PAGO' && fecha && fecha < limitePago) rep.pagoViejo.push(f[PED.ID] + ' (' + moneda_(f[PED.TOTAL]) + ')');
      if ((est === 'ENTREGADO' || est === 'CANCELADO') && fecha && fecha < limite) mover.push(i);
    });

    actualizarResumen_(datos, ahora, rep, dias);       // antes de mover, con la foto completa

    if (mover.length) {
      const hH = hojaHistorial_(), hI = hojaItems_();
      const filasH = mover.map(function (i) { return datos[i].concat([ahora]); });
      const items = [];
      mover.forEach(function (i) { itemsDePedido_(datos[i]).forEach(function (x) { items.push(x); }); });

      const antesH = hH.getLastRow();
      hH.getRange(antesH + 1, 1, filasH.length, PED_COLS + 1).setValues(filasH);
      if (items.length) hI.getRange(hI.getLastRow() + 1, 1, items.length, ITEMS_HEADERS.length).setValues(items);
      SpreadsheetApp.flush();
      if (hH.getLastRow() !== antesH + filasH.length) throw new Error('Corte abortado: Historial no recibió todas las filas. No se borró nada.');

      // Borrar de abajo hacia arriba, en bloques contiguos
      if (hP.getMaxRows() - 1 <= mover.length) hP.insertRowsAfter(hP.getMaxRows(), mover.length + 10);
      const filasSheet = mover.map(function (i) { return i + 2; }).sort(function (a, b) { return b - a; });
      let k = 0;
      while (k < filasSheet.length) {
        const ini = filasSheet[k];
        let cnt = 1;
        while (k + cnt < filasSheet.length && filasSheet[k + cnt] === ini - cnt) cnt++;
        hP.deleteRows(ini - cnt + 1, cnt);
        k += cnt;
      }
      rep.archivados = mover.length;
      rep.items = items.length;
    }

    limpiarDatos_(rep);
    formatoPedidos_(hP);
  }, 30000);

  // Depuración de logs (fuera del lock)
  rep.errs24h = contarRecientes_(H_ERR, 86400000);
  rep.logs = purgarLog_(H_MSG, DIAS_GUARDAR_LOGS);
  rep.errs = purgarLog_(H_ERR, DIAS_GUARDAR_LOGS);
  purgarLog_(H_CHAT, DIAS_GUARDAR_CHAT);

  bitacora_('CORTE', '', '', 'archivados ' + rep.archivados + ' · items ' + rep.items + ' · arreglos ' + rep.arreglos);
  try { enviarResumenCorte_(rep, ahora); } catch (x) { registrarError_(x); }
}

function itemsDePedido_(f) {
  const fecha = f[PED.FECHA];
  const mes = fecha instanceof Date ? Utilities.formatDate(fecha, TZ, 'yyyy-MM') : '';
  return carritoDePedido_(f).map(function (it) {
    const precio = it.precio !== undefined ? aNumero_(it.precio) : aNumero_(f[PED.PRECIO_UNIT]);
    const cant = parseInt(it.cant, 10) || 0;
    return [f[PED.ID], fecha, String(f[PED.TELEFONO]), String(f[PED.ESTADO]).trim().toUpperCase(),
            String(it.sku || ''), it.producto || f[PED.PRODUCTO], cant, precio, round2_(precio * cant), mes];
  });
}

// Resumen por día. Solo se refrescan los días que aún tienen TODOS sus pedidos en Pedidos
// (los más viejos ya están parcialmente archivados y no se tocan).
function actualizarResumen_(datos, ahora, rep, dias) {
  const hR = hojaResumen_();
  const fmt = function (d) { return Utilities.formatDate(d, TZ, 'yyyy-MM-dd'); };
  const hoyKey = fmt(ahora);
  const ayerKey = fmt(new Date(ahora.getTime() - 86400000));
  const minKey = fmt(new Date(ahora.getTime() - (dias - 1) * 86400000));

  const g = {};
  datos.forEach(function (f) {
    if (!f[PED.ID] || !(f[PED.FECHA] instanceof Date)) return;
    const k = fmt(f[PED.FECHA]);
    if (k >= hoyKey || k < minKey) return;
    const x = g[k] = g[k] || { ped: 0, ent: 0, can: 0, ventas: 0, desc: 0, uni: 0 };
    const est = String(f[PED.ESTADO]).trim().toUpperCase();
    x.ped++;
    if (est === 'ENTREGADO') {
      x.ent++; x.ventas += aNumero_(f[PED.TOTAL]); x.desc += aNumero_(f[PED.DESCUENTO]); x.uni += parseInt(f[PED.CANTIDAD], 10) || 0;
    }
    if (est === 'CANCELADO') x.can++;
  });

  const existentes = {};
  const last = hR.getLastRow();
  if (last >= 2) {
    hR.getRange(2, 1, last - 1, 1).getValues().forEach(function (r, i) {
      if (r[0] instanceof Date) existentes[fmt(r[0])] = i + 2;
    });
  }
  Object.keys(g).sort().forEach(function (k) {
    const x = g[k];
    const fila = [Utilities.parseDate(k, TZ, 'yyyy-MM-dd'), x.ped, x.ent, x.can, round2_(x.ventas), round2_(x.desc), x.uni,
                  x.ent ? round2_(x.ventas / x.ent) : 0];
    if (existentes[k]) hR.getRange(existentes[k], 1, 1, fila.length).setValues([fila]);
    else hR.appendRow(fila);
    if (k === ayerKey) { rep.pedidosAyer = x.ped; rep.ventasAyer = round2_(x.ventas); }
  });
}

// Normaliza teléfonos y estados en Pedidos y detecta duplicados en Clientes
function limpiarDatos_(rep) {
  const hP = hoja_(H_PED);
  const last = hP.getLastRow();
  if (last >= 2) {
    const tel = hP.getRange(2, PED.TELEFONO + 1, last - 1, 1).getValues();
    const est = hP.getRange(2, PED.ESTADO + 1, last - 1, 1).getValues();
    let cT = false, cE = false;
    for (let i = 0; i < tel.length; i++) {
      const limpioT = soloDigitos_(tel[i][0]);
      if (tel[i][0] !== '' && String(tel[i][0]) !== limpioT && limpioT) { tel[i][0] = limpioT; cT = true; rep.arreglos++; }
      const e = String(est[i][0]).trim().toUpperCase();
      if (est[i][0] !== '' && String(est[i][0]) !== e && ESTADOS_PEDIDO.indexOf(e) > -1) { est[i][0] = e; cE = true; rep.arreglos++; }
    }
    if (cT) hP.getRange(2, PED.TELEFONO + 1, last - 1, 1).setValues(tel);
    if (cE) hP.getRange(2, PED.ESTADO + 1, last - 1, 1).setValues(est);
  }
  const hC = hoja_(H_CLIENTES);
  if (hC && hC.getLastRow() >= 2) {
    const vistos = {};
    hC.getRange(2, CLI.TEL + 1, hC.getLastRow() - 1, 1).getValues().forEach(function (r, i) {
      const k = soloDigitos_(r[0]);
      if (!k) return;
      if (vistos[k]) rep.dupClientes.push('+' + k + ' (filas ' + vistos[k] + ' y ' + (i + 2) + ')'); else vistos[k] = i + 2;
    });
  }
}

// Borra del inicio de la hoja las filas más viejas que "dias" (los logs se agregan en orden cronológico)
function purgarLog_(nombre, dias) {
  const h = hoja_(nombre);
  if (!h || h.getLastRow() < 2) return 0;
  const lim = new Date(Date.now() - dias * 86400000);
  const f = h.getRange(2, 1, h.getLastRow() - 1, 1).getValues();
  let n = 0;
  while (n < f.length && f[n][0] instanceof Date && f[n][0] < lim) n++;
  if (n > 0) {
    if (h.getMaxRows() - 1 <= n) h.insertRowsAfter(h.getMaxRows(), n + 10);
    h.deleteRows(2, n);
  }
  return n;
}

function contarRecientes_(nombre, ms) {
  const h = hoja_(nombre);
  if (!h || h.getLastRow() < 2) return 0;
  const lim = new Date(Date.now() - ms);
  return h.getRange(2, 1, h.getLastRow() - 1, 1).getValues()
    .filter(function (r) { return r[0] instanceof Date && r[0] >= lim; }).length;
}

function enviarResumenCorte_(rep, ahora) {
  const lista = function (a) { return a.length ? '\n   ' + a.slice(0, 15).join('\n   ') + (a.length > 15 ? '\n   ... y ' + (a.length - 15) + ' más' : '') : ' ninguno'; };
  const cuerpo =
    'Corte del ' + Utilities.formatDate(ahora, TZ, 'dd/MM/yyyy HH:mm') + '\n\n' +
    'AYER\n' +
    '  Pedidos creados: ' + rep.pedidosAyer + '\n' +
    '  Ventas entregadas (de esos pedidos): ' + moneda_(rep.ventasAyer) + '\n\n' +
    'LIMPIEZA\n' +
    '  Pedidos archivados en Historial: ' + rep.archivados + ' (' + rep.items + ' productos en Detalle_Items)\n' +
    '  Datos corregidos (teléfonos/estados): ' + rep.arreglos + '\n' +
    '  Mensajes depurados: ' + rep.logs + ' · Errores depurados: ' + rep.errs + '\n\n' +
    'REVISAR\n' +
    '  Pagos pendientes de más de ' + HORAS_ALERTA_PAGO + ' h:' + lista(rep.pagoViejo) + '\n' +
    '  Pedidos sin teléfono válido:' + lista(rep.sinTel) + '\n' +
    '  Clientes duplicados:' + lista(rep.dupClientes) + '\n' +
    '  Errores en las últimas 24 h: ' + rep.errs24h;
  MailApp.sendEmail(EMAIL_ADMIN, '[' + NEGOCIO + '] Corte diario ' + Utilities.formatDate(ahora, TZ, 'dd/MM'), cuerpo);
}

/***** UTILIDADES: EJECUTAR A MANO *****/
function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu('🛒 ' + NEGOCIO)
      .addItem('Hacer corte ahora', 'corteDiario')
      .addItem('Recalcular clientes', 'sincronizarClientes')
      .addItem('Preparar hojas', 'prepararHojas')
      .addToUi();
  } catch (e) {}
}

function formatoPedidos_(ped) {
  const filas = Math.max(ped.getMaxRows() - 1, 1);
  ped.getRange(2, PED.TELEFONO + 1, filas, 1).setNumberFormat('@');
  ped.getRange(2, PED.ESTADO + 1, filas, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(ESTADOS_PEDIDO, true).build());
}

// Ejecutar UNA VEZ (y de nuevo tras actualizar el código): crea/actualiza hojas y fórmulas sin borrar datos
function prepararHojas() {
  let inv = hoja_(H_INV);
  if (!inv) {
    inv = ss_().insertSheet(H_INV);
    inv.appendRow(['SKU', 'Producto', 'Descripcion', 'Precio', 'Stock', 'URL_Imagen', 'Activo']);
    inv.appendRow(['P001', 'Producto de ejemplo 1', 'Descripción de ejemplo 1', 50, 10, '', 'SI']);
    inv.appendRow(['P002', 'Producto de ejemplo 2', 'Descripción de ejemplo 2', 120, 5, '', 'SI']);
    inv.setFrozenRows(1);
  }

  let ped = hoja_(H_PED);
  if (!ped) {
    ped = ss_().insertSheet(H_PED);
    ped.appendRow(PED_HEADERS);
    ped.setFrozenRows(1);
  } else {
    for (let c = 18; c < PED_COLS; c++) {            // solo completa las columnas nuevas
      const cell = ped.getRange(1, c + 1);
      if (!cell.getValue()) cell.setValue(PED_HEADERS[c]);
    }
  }
  formatoPedidos_(ped);
  ped.getRange(1, PED.LINK + 1).setBackground('#fff2cc');          // resalta donde se pega el link de Zigi
  ped.getRange(1, PED.COMPROBANTE + 1).setBackground('#fff2cc');

  hojaHistorial_(); hojaItems_(); hojaResumen_(); hojaBitacora_();
  formatoClientes_(hojaClientes_());
  sincronizarClientes();
}

// Agrega a Clientes los teléfonos que tengan pedidos (vivos o archivados) y no estén en la hoja,
// y vuelve a escribir las fórmulas de C a G en TODAS las filas (útil si alguien las pisó).
function sincronizarClientes() {
  const h = hojaClientes_();
  hojaHistorial_();
  const existentes = {};
  if (h.getLastRow() >= 2) {
    h.getRange(2, CLI.TEL + 1, h.getLastRow() - 1, 1).getValues().forEach(function (r) { existentes[soloDigitos_(r[0])] = true; });
  }
  [H_PED, H_HIST].forEach(function (nombre) {
    const hp = hoja_(nombre);
    if (!hp || hp.getLastRow() < 2) return;
    hp.getRange(2, 1, hp.getLastRow() - 1, PED.NOMBRE + 1).getValues().forEach(function (r) {
      const t = soloDigitos_(r[PED.TELEFONO]);
      if (!t || existentes[t]) return;
      const fila = Math.max(h.getLastRow(), 1) + 1;
      h.getRange(fila, CLI.TEL + 1).setNumberFormat('@').setValue(t);
      h.getRange(fila, CLI.NOMBRE + 1).setValue(r[PED.NOMBRE] || '');
      h.getRange(fila, CLI.REGISTRO + 1).setValue(r[PED.FECHA] || new Date());
      existentes[t] = true;
    });
  });
  const ultima = h.getLastRow();
  for (let r = 2; r <= ultima; r++) h.getRange(r, CLI.COMPRAS + 1, 1, 5).setFormulas([formulasCliente_(r)]);
  SpreadsheetApp.flush();
}

// Crea los activadores que faltan (no duplica los que ya existen)
function instalarActivadores() {
  const existentes = ScriptApp.getProjectTriggers();
  const tiene = function (fn) { return existentes.some(function (t) { return t.getHandlerFunction() === fn; }); };
  if (!tiene('notificarEstado')) ScriptApp.newTrigger('notificarEstado').forSpreadsheet(ss_()).onEdit().create();
  if (!tiene('corteDiario')) ScriptApp.newTrigger('corteDiario').timeBased().everyDays(1).atHour(HORA_CORTE).create();
  if (!tiene('respaldoDiario')) ScriptApp.newTrigger('respaldoDiario').timeBased().everyDays(1).atHour(3).create();
}

function autorizar() {
  SpreadsheetApp.openById(SHEET_ID);
  CacheService.getScriptCache();
  LockService.getScriptLock();
  CalendarApp.getDefaultCalendar();
  MailApp.getRemainingDailyQuota();
  DriveApp.getRootFolder();
  ScriptApp.getProjectTriggers();
  UrlFetchApp.getRequest('https://graph.facebook.com/');
}


function simularWebhook() {
  // 1. Creamos un paquete de datos idéntico al que envía Meta
  const payloadMeta = {
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "1234567890",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "1234567890",
            "phone_number_id": PHONE_NUMBER_ID
          },
          "contacts": [{
            "profile": { "name": "Walter (Prueba)" },
            "wa_id": "50258798301" // Tu número
          }],
          "messages": [{
            "from": "50258798301",
            "id": "wamid." + Utilities.getUuid(),
            "timestamp": Math.floor(Date.now() / 1000).toString(),
            "text": { "body": "hola" },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  };

  // 2. Simulamos el evento 'e' que recibe el Webhook
  const eventoFalso = {
    postData: {
      contents: JSON.stringify(payloadMeta)
    }
  };

  // 3. Ejecutamos la recepción
  Logger.log("Iniciando simulación. Enviando 'hola' al sistema...");
  doPost(eventoFalso);
  Logger.log("Simulación finalizada. Revisa tu hoja de cálculo y tu WhatsApp.");
}



const WABA_ID = '1647842656984677';

// 1) Ver qué apps están suscritas a tu cuenta
function verSuscripciones() {
  const url = 'https://graph.facebook.com/' + API_VERSION + '/' + WABA_ID + '/subscribed_apps';
  const res = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + WA_TOKEN },
    muteHttpExceptions: true
  });
  Logger.log('Código: ' + res.getResponseCode());
  Logger.log('Respuesta: ' + res.getContentText());
}

// 2) Suscribir tu app a tu cuenta (ESTE es el que arregla el problema)
function suscribirApp() {
  const url = 'https://graph.facebook.com/' + API_VERSION + '/' + WABA_ID + '/subscribed_apps';
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    headers: { Authorization: 'Bearer ' + WA_TOKEN },
    muteHttpExceptions: true
  });
  Logger.log('Código: ' + res.getResponseCode());
  Logger.log('Respuesta: ' + res.getContentText());
}



/***** CONVERSACIONES (chat del panel) *****/
function seguro_(t) {   // evita que un mensaje que empiece con = + - @ se interprete como fórmula
  t = String(t === null || t === undefined ? '' : t);
  return /^[=+\-@]/.test(t) ? ' ' + t : t;
}

function hojaChat_() {
  return hojaConEncabezado_(H_CHAT, CHAT_HEADERS, function (h) {
    h.getRange('B:B').setNumberFormat('@');
    h.getRange('G:G').setNumberFormat('@');
  });
}
function hojaChats_() {
  return hojaConEncabezado_(H_CHATS, CHATS_HEADERS, function (h) { h.getRange('A:A').setNumberFormat('@'); });
}

function registrarMsg_(dir, tel, nombre, autor, tipo, texto, media, wamid, codigo) {
  try {
    hojaChat_().appendRow([new Date(), soloDigitos_(tel), nombre || '', dir, autor, tipo, seguro_(recortar_(texto, 1500)),
                           media || '', wamid || '', codigo === undefined ? '' : codigo]);
  } catch (e) { registrarError_(e); }
}

function registrarEntrante_(num, nombre, ent, wamid) {
  if (ent.tipo === 'reaction') return;
  let media = '', texto = ent.texto || ent.id || '';
  if ((ent.tipo === 'image' || ent.tipo === 'document') && ent.media) {
    try { media = guardarMediaDrive_(ent, num); } catch (x) { registrarError_(x); }
  }
  if (ent.tipo === 'image' || ent.tipo === 'document') texto = ent.caption || (media ? '' : ent.texto);
  registrarMsg_('IN', num, nombre, nombre || 'Cliente', ent.tipo, texto, media, wamid, 200);
}

function carpetaMedia_() {
  if (CARPETA_DRIVE_ID) return DriveApp.getFolderById(CARPETA_DRIVE_ID);
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('CARPETA_AUTO');
  if (id) { try { return DriveApp.getFolderById(id); } catch (x) {} }
  const f = DriveApp.createFolder('Comprobantes ' + NEGOCIO);
  props.setProperty('CARPETA_AUTO', f.getId());
  return f;
}

function guardarMediaDrive_(ent, num) {
  const blob = descargarMedia_(ent.media);
  if (!blob) return '';
  const ext = String(blob.getContentType() || 'image/jpeg').split('/')[1] || 'jpg';
  const nombre = 'chat_' + num + '_' + Utilities.formatDate(new Date(), TZ, 'yyMMdd_HHmmss') + '.' + ext;
  return carpetaMedia_().createFile(blob.copyBlob().setName(nombre)).getId();
}

/***** MODO DE ATENCIÓN: BOT o EMPLEADO (hoja Chats) *****/
function leerChats_() {
  const h = hojaChats_();
  const last = h.getLastRow();
  const out = {};
  if (last < 2) return out;
  h.getRange(2, 1, last - 1, 6).getValues().forEach(function (r, i) {
    const t = soloDigitos_(r[0]);
    if (!t) return;
    out[t] = { fila: i + 2, modo: String(r[1] || 'BOT'), motivo: String(r[2] || ''), asignado: String(r[3] || ''),
               act: r[4] instanceof Date ? r[4] : null, leido: r[5] instanceof Date ? r[5] : null };
  });
  return out;
}

function modoEfectivo_(e) {   // un HUMANO vence solo a las HORAS_MODO_HUMANO
  return e && e.modo === 'HUMANO' && e.act && (Date.now() - e.act.getTime()) < HORAS_MODO_HUMANO * 3600000 ? 'HUMANO' : 'BOT';
}

function getModo_(n) {
  const tel = soloDigitos_(n);
  const cache = CacheService.getScriptCache();
  const c = cache.get('modo_' + tel);
  if (c !== null) return c;
  const m = modoEfectivo_(leerChats_()[tel]);
  cache.put('modo_' + tel, m, 600);
  return m;
}

// cambios: { modo, motivo, asignado, leido:true }  (lo que no se pasa, se conserva)
function actualizarChat_(n, cambios) {
  const tel = soloDigitos_(n);
  conLock_(function () {
    const h = hojaChats_();
    const info = leerChats_()[tel];
    const modo     = cambios.modo     !== undefined ? cambios.modo     : (info ? info.modo : 'BOT');
    const motivo   = cambios.motivo   !== undefined ? cambios.motivo   : (info ? info.motivo : '');
    const asignado = cambios.asignado !== undefined ? cambios.asignado : (info ? info.asignado : '');
    const act      = cambios.modo     !== undefined ? new Date() : (info && info.act ? info.act : '');
    const leido    = cambios.leido ? new Date() : (info && info.leido ? info.leido : '');
    if (info) {
      h.getRange(info.fila, 2, 1, 5).setValues([[modo, motivo, asignado, act, leido]]);
    } else {
      const f = Math.max(h.getLastRow(), 1) + 1;
      h.getRange(f, 1).setNumberFormat('@').setValue(tel);
      h.getRange(f, 2, 1, 5).setValues([[modo, motivo, asignado, act, leido]]);
    }
  }, 30000);
  if (cambios.modo !== undefined) CacheService.getScriptCache().put('modo_' + tel, cambios.modo, 600);
}

// Ejecútala UNA vez: copia tus mensajes viejos (hoja Mensajes) a Conversaciones para que el chat no empiece vacío
function migrarMensajes() {
  const src = hoja_(H_MSG);
  if (!src || src.getLastRow() < 2) return Logger.log('No hay mensajes para migrar.');
  const dst = hojaChat_();
  if (dst.getLastRow() > 1) return Logger.log('Conversaciones ya tiene datos; no se migra para no duplicar.');
  const filas = src.getRange(2, 1, src.getLastRow() - 1, 6).getValues()
    .filter(function (r) { return r[0] instanceof Date && soloDigitos_(r[1]).length >= 8; })
    .map(function (r) {
      return [r[0], soloDigitos_(r[1]), String(r[2] || ''), 'IN', String(r[2] || 'Cliente'), String(r[4] || 'text'),
              seguro_(String(r[3] || '')), '', String(r[5] || ''), 200];
    });
  if (!filas.length) return Logger.log('Nada que migrar.');
  dst.getRange(2, 1, filas.length, 10).setValues(filas);
  Logger.log('Migrados ' + filas.length + ' mensajes.');
}