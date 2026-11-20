/* ===== Centralizador de diseño (solo administrador) ===== */
let DI = null, DI_DIRTY = false, DI_SEC = 'inicio', DI_EDIT = null;

async function vistaDiseno() {
  if (!puede('diseno.editar')) { pintar('<div class="empty">Solo el administrador puede cambiar el diseño.</div>'); return; }
  const r = await api('config');
  if (TAB !== 'diseno') return;
  Tema.aplicar(r);
  DI = Tema.clon(Tema.guardada()); DI_DIRTY = false; DI_EDIT = null;
  armarDiseno();
}

function salirDiseno() { DI_DIRTY = false; DI_EDIT = null; Tema.forzar(null); Tema.revertir(); }

function verFondoEdicion() {
  Tema.forzar(DI_EDIT === 'login' ? DI.fondoLogin : DI_EDIT === 'sec' ? (DI.fondosSec[DI_SEC] || DI.fondoApp) : null);
}
function cambio(re) {
  DI_DIRTY = true; verFondoEdicion(); Tema.previa(DI);
  const s = $('#dstat'); if (s) { s.textContent = 'Cambios sin guardar (vista previa)'; s.classList.add('dirty'); }
  if (re) armarDiseno();
}
function setFondo(id, def) {
  DI_EDIT = id === 'fondoLogin' ? 'login' : id === 'sec' ? 'sec' : 'app';
  if (id === 'sec') { if (def) DI.fondosSec[DI_SEC] = def; else delete DI.fondosSec[DI_SEC]; }
  else DI[id] = def;
}

function bloqueFondo(id, titulo, def, pre) {
  const pres = Object.keys(Tema.PRESETS).map(k => {
    const p = Tema.PRESETS[k], on = def && def.t === 'preset' && def.v === k;
    return '<button class="swb' + (on ? ' on' : '') + '" data-bg="' + id + '" data-t="preset" data-v="' + k + '" style="background:' + p.css + '"><span>' + esc(p.n) + '</span></button>';
  }).join('');
  const img = def && def.t === 'imagen'
    ? '<button class="swb on" style="background:url(\'' + esc(Tema.urlImg(def.v, 400)) + '\') center/cover"><span>Tu imagen</span></button>' : '';
  const colorVal = def && def.t === 'color' ? def.v : '#0b1224';
  return '<div class="card"><b>' + titulo + '</b>' + (pre || '') +
    '<div class="swgrid">' + pres + img + '</div>' +
    '<div class="row"><button class="btn sec" data-up="' + id + '">Subir imagen</button>' +
    '<label class="colorbtn">Color sólido <input type="color" data-col="' + id + '" value="' + colorVal + '"></label></div></div>';
}

function armarDiseno() {
  const c = DI, y = window.scrollY;
  const rng = (k, lab, min, max, u) => '<label class="rng"><span>' + lab + '</span><b id="v_' + k + '">' + c[k] + u + '</b><input type="range" data-rng="' + k + '" data-u="' + u + '" min="' + min + '" max="' + max + '" value="' + c[k] + '"></label>';
  const chk = (k, lab) => '<label class="chk"><input type="checkbox" data-chk="' + k + '"' + (c[k] ? ' checked' : '') + '> ' + lab + '</label>';
  const txt = (k, lab, max) => '<label>' + lab + '<input data-txt="' + k + '" maxlength="' + max + '" value="' + esc(c[k]) + '"></label>';
  const sel = (k, obj) => '<select data-sel="' + k + '">' + Object.keys(obj).map(o => '<option value="' + o + '"' + (o === c[k] ? ' selected' : '') + '>' + esc(obj[o].n || obj[o]) + '</option>').join('') + '</select>';
  const acs = Object.keys(Tema.ACENTOS).map(k => '<button class="ac' + (c.acento === k ? ' on' : '') + '" data-ac="' + k + '" title="' + k + '" style="background:linear-gradient(135deg,' + Tema.ACENTOS[k][0] + ',' + Tema.ACENTOS[k][1] + ')"></button>').join('') +
    '<button class="ac' + (c.acento === 'custom' ? ' on' : '') + '" data-ac="custom" title="Personalizado" style="background:conic-gradient(#ff5c8a,#ffc247,#2ef2a5,#22d3ff,#b79bff,#ff5c8a)"></button>';
  const formas = [['redondo', 'Círculo'], ['redondeado', 'Redondeado'], ['libre', 'Libre']]
    .map(f => '<button class="chip' + (c.logoForma === f[0] ? ' on' : '') + '" data-forma="' + f[0] + '">' + f[1] + '</button>').join('');
  const secChips = '<div class="chips" style="margin-top:8px">' + Object.keys(Tema.SECCIONES).map(k => '<button class="chip' + (k === DI_SEC ? ' on' : '') + '" data-sec="' + k + '">' + Tema.SECCIONES[k] + (c.fondosSec[k] ? ' •' : '') + '</button>').join('') + '</div>' +
    '<p class="mut" style="margin:2px 0 0">' + (c.fondosSec[DI_SEC] ? 'Esta sección tiene su propio fondo.' : 'Esta sección usa el fondo del espacio de trabajo.') + '</p>' +
    (c.fondosSec[DI_SEC] ? '<div class="row" style="margin-top:6px"><button class="chip" data-bg="sec" data-t="global">Volver al fondo global</button></div>' : '');
  const anims = { cine: 'Cinematográfico (todo activado)', equilibrado: 'Equilibrado', ahorro: 'Ahorro de batería' };

  pintar('<div id="dwrap">' +
    '<p class="mut" style="margin-bottom:12px">Lo que cambies aquí se ve en vivo. Al pulsar <b>Guardar y aplicar a todos</b>, se guarda en la hoja Config_Global y todo el equipo lo recibe.</p>' +
    '<div class="g g3">' +
      '<div class="card"><b>Identidad</b>' + txt('negocio', 'Nombre del negocio', 40) + txt('eslogan', 'Eslogan', 60) + txt('loginTitulo', 'Título del inicio de sesión', 50) + txt('loginTexto', 'Texto del inicio de sesión', 90) +
        '<div class="lprev">' + (c.logo ? '<img class="logo-img f-' + c.logoForma + '" alt="" src="' + esc(Tema.urlImg(c.logo, 200)) + '">' : '<div class="ph">Sin logo</div>') +
        '<div style="flex:1"><button class="btn" data-up="logo">Subir logo</button>' + (c.logo ? '<button class="btn sec" style="margin-top:6px" data-quitarlogo="1">Quitar logo</button>' : '') + '</div></div>' +
        '<div class="chips" style="margin-top:10px">' + formas + '</div></div>' +
      '<div class="card"><b>Color y modo</b>' +
        '<div class="chips" style="margin-top:10px"><button class="chip' + (c.modo === 'oscuro' ? ' on' : '') + '" data-modo="oscuro">Oscuro</button><button class="chip' + (c.modo === 'claro' ? ' on' : '') + '" data-modo="claro">Claro</button></div>' +
        '<label>Color de marca</label><div class="acs">' + acs + '</div>' +
        (c.acento === 'custom' ? '<div class="row"><label class="colorbtn">Color 1 <input type="color" data-ca="colorA" value="' + c.colorA + '"></label><label class="colorbtn">Color 2 <input type="color" data-ca="colorB" value="' + c.colorB + '"></label></div>' : '') +
        chk('permitirModo', 'Permitir que cada usuario elija modo claro u oscuro') + '</div>' +
      '<div class="card"><b>Cristal</b>' + rng('blur', 'Desenfoque', 8, 28, ' px') + rng('opacidad', 'Opacidad de las tarjetas', 20, 95, ' %') + rng('velo', 'Velo de contraste (fotos)', 15, 75, ' %') + rng('radio', 'Redondeo de bordes', 8, 28, ' px') + chk('brillo', 'Reflejo biselado en el borde') + '</div>' +
    '</div>' +
    '<div class="g g3">' + bloqueFondo('fondoLogin', 'Fondo del inicio de sesión', c.fondoLogin) + bloqueFondo('fondoApp', 'Fondo del espacio de trabajo', c.fondoApp) + bloqueFondo('sec', 'Fondo por sección', c.fondosSec[DI_SEC] || null, secChips) + '</div>' +
    '<div class="card"><b>Tipografía y animación</b><div class="fgrid"><label>Tipografía' + sel('fuente', Tema.FUENTES) + '</label><label>Nivel de animación' + sel('anim', anims) + '</label></div></div>' +
    '<div style="height:90px"></div>' +
    '<div class="dbar"><span id="dstat" class="' + (DI_DIRTY ? 'dirty' : '') + '">' + (DI_DIRTY ? 'Cambios sin guardar (vista previa)' : 'Sin cambios') + '</span>' +
      '<button class="btn sec" id="d_desc">Descartar</button><button class="btn sec" id="d_rest">Restablecer</button><button class="btn" id="d_guardar">Guardar y aplicar a todos</button></div></div>');

  const w = $('#dwrap');
  w.onclick = e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.bg) { if (t.dataset.t === 'global') setFondo(t.dataset.bg, null); else setFondo(t.dataset.bg, { t: t.dataset.t, v: t.dataset.v }); return cambio(true); }
    if (t.dataset.up) return subirImagen(t.dataset.up);
    if (t.dataset.ac) { DI.acento = t.dataset.ac; return cambio(true); }
    if (t.dataset.modo) { DI.modo = t.dataset.modo; return cambio(true); }
    if (t.dataset.forma) { DI.logoForma = t.dataset.forma; return cambio(true); }
    if (t.dataset.sec) { DI_SEC = t.dataset.sec; DI_EDIT = 'sec'; return cambio(true); }
    if (t.dataset.quitarlogo) { DI.logo = ''; return cambio(true); }
    if (t.id === 'd_guardar') return guardarDiseno();
    if (t.id === 'd_desc') return descartarDiseno();
    if (t.id === 'd_rest') { DI = Tema.clon(Tema.DEF); DI_EDIT = null; return cambio(true); }
  };
  w.oninput = e => {
    const t = e.target;
    if (t.dataset.rng) { DI[t.dataset.rng] = Number(t.value); $('#v_' + t.dataset.rng).textContent = t.value + (t.dataset.u || ''); return cambio(false); }
    if (t.dataset.txt) { DI[t.dataset.txt] = t.value; return cambio(false); }
    if (t.dataset.ca) { DI[t.dataset.ca] = t.value; return cambio(false); }
    if (t.dataset.col) { setFondo(t.dataset.col, { t: 'color', v: t.value }); return cambio(false); }
  };
  w.onchange = e => {
    const t = e.target;
    if (t.dataset.sel) { DI[t.dataset.sel] = t.value; return cambio(false); }
    if (t.dataset.chk) { DI[t.dataset.chk] = t.checked; return cambio(false); }
    if (t.dataset.col) return cambio(true);
  };
  window.scrollTo(0, y);
}

function leerImagen(file, max, mime, q) {
  return new Promise((ok, fail) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const x = c.getContext('2d');
        if (mime === 'image/jpeg') { x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height); }
        x.drawImage(img, 0, 0, c.width, c.height);
        const dataUrl = c.toDataURL(mime, q);
        ok({ mime: mime, b64: dataUrl.split(',')[1], dataUrl: dataUrl });
      };
      img.onerror = () => fail(new Error('No pude leer esa imagen.'));
      img.src = fr.result;
    };
    fr.onerror = () => fail(new Error('No pude leer ese archivo.'));
    fr.readAsDataURL(file);
  });
}

function subirImagen(id) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/png,image/jpeg,image/webp';
  inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return;
    busy(true);
    try {
      const esLogo = id === 'logo';
      const im = await leerImagen(f, esLogo ? 512 : 1920, esLogo ? 'image/png' : 'image/jpeg', 0.82);
      const r = await api('diseno_imagen', { tipo: esLogo ? 'logo' : 'fondo', mime: im.mime, b64: im.b64 });
      Tema.local(r.id, im.dataUrl);
      if (esLogo) DI.logo = r.id; else setFondo(id, { t: 'imagen', v: r.id });
      cambio(true);
      toast(r.publico ? 'Imagen subida. Recuerda guardar para aplicarla a todos.' : 'Imagen subida, pero Drive no permitió el enlace público: otros usuarios no la verán.', r.publico ? '' : 'warn');
    } catch (e) { toast(e.message, 'err'); }
    busy(false);
  };
  inp.click();
}

async function guardarDiseno() {
  busy(true);
  try {
    const r = await api('diseno_guardar', { cfg: DI });
    DI_EDIT = null; Tema.forzar(null); Tema.aplicar(r, true);
    DI = Tema.clon(Tema.guardada()); DI_DIRTY = false;
    toast('Diseño aplicado para todo el equipo');
    armarDiseno();
  } catch (e) { toast(e.message, 'err'); }
  busy(false);
}

function descartarDiseno() {
  DI_DIRTY = false; DI_EDIT = null; Tema.forzar(null); Tema.revertir();
  DI = Tema.clon(Tema.guardada()); armarDiseno();
}