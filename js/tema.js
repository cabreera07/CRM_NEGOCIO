/* ===== Motor de diseño =====
   Aplica la configuración global (hoja Config_Global) a toda la app.
   Guarda una copia en localStorage: al abrir, el diseño aparece al instante. */
const Tema = (function () {
    const DEF = {
    negocio: 'Mi Tienda', eslogan: 'Centro de atención',
    loginTitulo: 'Panel de atención', loginTexto: 'Entra con tu usuario y PIN',
    logo: '', logoForma: 'redondeado',
    modo: 'oscuro', acento: 'azul', colorA: '#3f7ad9', colorB: '#2f5fb0',
    fondoLogin: { t: 'preset', v: 'pizarra' }, fondoApp: { t: 'preset', v: 'pizarra' }, fondosSec: {},
    blur: 10, opacidad: 88, velo: 40, radio: 12, brillo: false,
    fuente: 'inter', anim: 'equilibrado', permitirModo: true,
    neon: false, densidad: 'comoda',
    vistaPedidos: 'lista', vistaClientes: 'tarjetas', vistaInventario: 'tarjetas',
    saludo: true, reloj: true, formatoHora: '12h', confirmarSalir: true,
    frases: 'siempre', frasesTxt: ''
  };
  const ACENTOS = {
    azul: ['#3f7ad9', '#2f5fb0'], violeta: ['#7b72d6', '#5b52b5'], esmeralda: ['#2fa37a', '#1f7d5c'],
    ambar: ['#d99a2b', '#b8761a'], rosa: ['#c9577f', '#a03a60'], pizarra: ['#7c8aa0', '#5a6980'], vino: ['#b5475f', '#8f3148']
  };
  const PRESETS = {
    pizarra:      { n: 'Pizarra', anim: false, claro: false, css: 'linear-gradient(180deg,#141920 0%,#0e1116 100%)' },
    niebla:       { n: 'Niebla (claro)', anim: false, claro: true, css: 'linear-gradient(180deg,#f7f8fa,#e9ecf1)' },
    grafito:      { n: 'Grafito', anim: false, claro: false, css: 'radial-gradient(80% 60% at 50% 0%,#2a2f3a,#0e1116 70%)' },
    medianoche:   { n: 'Medianoche', anim: false, claro: false, css: 'radial-gradient(90% 70% at 50% -10%,#16233d 0%,#0b111c 60%,#07090f 100%)' },
    marmol:       { n: 'Mármol oscuro', anim: false, claro: false, css: 'linear-gradient(115deg,transparent 38%,rgba(255,255,255,.05) 44%,transparent 50%),linear-gradient(62deg,transparent 56%,rgba(255,255,255,.035) 61%,transparent 67%),radial-gradient(90% 70% at 30% 15%,#272c36,#0a0c11 75%)' },
    arquitectura: { n: 'Arquitectura', anim: false, claro: false, css: 'radial-gradient(70% 30% at 50% 100%,rgba(120,150,200,.12),transparent 70%),repeating-linear-gradient(90deg,rgba(255,255,255,.025) 0 1px,transparent 1px 120px),linear-gradient(180deg,#0c0f14 0%,#121821 100%)' },
    aurora:       { n: 'Aurora suave', anim: true, claro: false, css: 'radial-gradient(60% 50% at 15% 20%,rgba(63,122,217,.16),transparent 60%),radial-gradient(55% 45% at 85% 15%,rgba(109,111,214,.12),transparent 60%),#0e1116' },
    oceano:       { n: 'Océano', anim: true, claro: false, css: 'radial-gradient(70% 60% at 20% 10%,rgba(45,140,150,.18),transparent 60%),#0a1519' },
    atardecer:    { n: 'Atardecer', anim: true, claro: false, css: 'radial-gradient(70% 60% at 85% 10%,rgba(200,120,70,.16),transparent 60%),radial-gradient(70% 60% at 10% 85%,rgba(120,90,170,.14),transparent 60%),#15111a' },
    esmeralda:    { n: 'Esmeralda', anim: true, claro: false, css: 'radial-gradient(70% 60% at 20% 15%,rgba(47,163,122,.16),transparent 60%),#0a1411' },
    minimal:      { n: 'Minimal claro', anim: false, claro: true, css: 'radial-gradient(80% 60% at 20% 0%,#ffffff,#e9f0ff 60%,#dbe6fb 100%)' }
  };
  const FUENTES = {
    sistema: { n: 'Sistema (la más rápida)', css: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif', url: '' },
    inter:   { n: 'Inter', css: '"Inter",system-ui,sans-serif', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
    jakarta: { n: 'Plus Jakarta Sans', css: '"Plus Jakarta Sans",system-ui,sans-serif', url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap' },
    poppins: { n: 'Poppins', css: '"Poppins",system-ui,sans-serif', url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap' }
  };
  const SEC = { inicio: 'Inicio', chats: 'Chats', pedidos: 'Pedidos', clientes: 'Clientes', mas: 'Herramientas' };

  let res = null, vista = null, forzado = null, sec = 'inicio', enLogin = true, capa = 0, tk = 0, ultimo = '';
  const local = {};

  const clon = o => JSON.parse(JSON.stringify(o));
  function normalizar(c) {
    const o = Object.assign(clon(DEF), c || {});
    if (!o.fondoLogin || !o.fondoLogin.t) o.fondoLogin = clon(DEF.fondoLogin);
    if (!o.fondoApp || !o.fondoApp.t) o.fondoApp = clon(DEF.fondoApp);
    if (!o.fondosSec || typeof o.fondosSec !== 'object') o.fondosSec = {};
    return o;
  }
  const cfgActual = () => vista || res.cfg;
  function rgb(h) {
    h = String(h || '#000000').replace('#', '');
    if (h.length === 3) h = h.split('').map(x => x + x).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function lum(h) {
    const c = rgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function modoEf(cfg) {
    let p = '';
    try { p = localStorage.getItem('modo') || ''; } catch (e) {}
    return (cfg.permitirModo && (p === 'claro' || p === 'oscuro')) ? p : cfg.modo;
  }
  const urlImg = (id, w) => local[id] || ('https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w' + w);
  const fondoDe = (cfg, s) => (cfg.fondosSec && cfg.fondosSec[s]) || cfg.fondoApp;

  function logoHtml(cfg, px) {
    return cfg.logo
      ? '<img class="logo-img f-' + cfg.logoForma + '" style="width:' + px + 'px;height:' + px + 'px" alt="" src="' + urlImg(cfg.logo, px > 100 ? 400 : 200) + '">'
      : '⚡';
  }
  function cargarFuente(k) {
    const f = FUENTES[k];
    if (!f || !f.url || document.getElementById('f_' + k)) return;
    const l = document.createElement('link'); l.id = 'f_' + k; l.rel = 'stylesheet'; l.href = f.url; document.head.appendChild(l);
  }
  function html(id, h) {
    const e = document.getElementById(id);
    if (e && e.dataset.h !== h) { e.innerHTML = h; e.dataset.h = h; }
  }
  function marca(cfg) {
    document.title = cfg.negocio + ' · Panel';
    html('lg-logo', logoHtml(cfg, 72));
    const t = (id, v) => { const e = document.getElementById(id); if (e && e.textContent !== v) e.textContent = v; };
    t('lg-titulo', cfg.loginTitulo); t('lg-sub', cfg.loginTexto);
    t('lg-neg', cfg.negocio + (cfg.eslogan ? ' · ' + cfg.eslogan : '')); t('hneg', cfg.negocio);
    const br = document.querySelector('#nav .brand');
    if (br && br.dataset.h !== logoHtml(cfg, 40)) { br.innerHTML = logoHtml(cfg, 40); br.dataset.h = logoHtml(cfg, 40); }
  }

  function veil(def, cfg) {
    const modo = modoEf(cfg);
    let usar = false;
    if (def.t === 'imagen') usar = true;
    else if (def.t === 'preset') { const p = PRESETS[def.v]; usar = !!p && (!!p.claro !== (modo === 'claro')); }
    document.getElementById('veil').style.opacity = usar ? cfg.velo / 100 : 0;
  }

  function ponerFondo(def, cfg) {
    const clave = JSON.stringify(def) + '|' + modoEf(cfg) + '|' + cfg.velo + '|' + cfg.anim;
    if (clave === ultimo) return;
    ultimo = clave;
    const mi = ++tk;
    const A = document.getElementById('bgA'), B = document.getElementById('bgB');
    const nueva = capa ? A : B, vieja = capa ? B : A;
    const mostrar = function () {
      if (mi !== tk) return;
      capa = 1 - capa; nueva.classList.add('on'); vieja.classList.remove('on'); veil(def, cfg);
    };
    nueva.className = 'bg'; nueva.style.cssText = '';
    if (def.t === 'imagen' && def.v) {
      const url = urlImg(def.v, 1920), im = new Image();
      im.onload = function () { nueva.style.background = 'url("' + url + '") center/cover no-repeat'; mostrar(); };
      im.onerror = function () { nueva.style.background = PRESETS.aurora.css; mostrar(); };
      im.src = url;
    } else if (def.t === 'color') {
      nueva.style.background = def.v; mostrar();
    } else {
      const p = PRESETS[def.v] || PRESETS.aurora;
      nueva.style.background = p.css;
      if (p.anim && cfg.anim !== 'ahorro') { nueva.style.backgroundSize = '160% 160%'; nueva.classList.add('bg-anim'); }
      mostrar();
    }
  }

  function pref(k) { try { return JSON.parse(localStorage.getItem('pref_v1') || '{}')[k]; } catch (e) { return undefined; } }
  function setPref(k, v) {
    try {
      const o = JSON.parse(localStorage.getItem('pref_v1') || '{}');
      if (v === '' || v === null || v === undefined) delete o[k]; else o[k] = v;
      localStorage.setItem('pref_v1', JSON.stringify(o));
    } catch (e) {}
    pintar(cfgActual());
  }

  function pintar(cfg) {
    const b = document.body, s = b.style, modo = modoEf(cfg), ahorro = cfg.anim === 'ahorro';
    b.dataset.modo = modo; b.dataset.anim = cfg.anim;
    b.dataset.neon = cfg.neon ? '1' : '0';
    b.dataset.dens = pref('densidad') || cfg.densidad || 'comoda';
    const ac = cfg.acento === 'custom' ? [cfg.colorA, cfg.colorB] : (ACENTOS[cfg.acento] || ACENTOS.azul);
    const a = rgb(ac[0]);
    s.setProperty('--pri', ac[0]); s.setProperty('--pri2', ac[1]); s.setProperty('--pri-rgb', a.join(','));
    s.setProperty('--glow', 'rgba(' + a.join(',') + ',' + (cfg.neon ? '.30' : '.10') + ')');
    s.setProperty('--glow2', 'rgba(' + rgb(ac[1]).join(',') + ',' + (cfg.neon ? '.22' : '.06') + ')');
    s.setProperty('--pri-tx', (lum(ac[0]) + lum(ac[1])) / 2 > 0.3 ? '#04121f' : '#ffffff');
    s.setProperty('--blur', (ahorro ? 0 : cfg.blur) + 'px');
    s.setProperty('--card-a', (ahorro ? Math.max(cfg.opacidad, 90) : cfg.opacidad) / 100);
    s.setProperty('--radius', cfg.radio + 'px');
    s.setProperty('--hl', cfg.brillo ? (modo === 'claro' ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.16)') : 'transparent');
    const f = FUENTES[cfg.fuente] || FUENTES.sistema;
    cargarFuente(cfg.fuente); s.setProperty('--font', f.css);
    marca(cfg);
    ponerFondo(forzado || (enLogin ? cfg.fondoLogin : fondoDe(cfg, sec)), cfg);
  }

  function aplicar(r, forzar) {
    if (!r || !r.cfg) return;
    if (!forzar && res && r.version === res.version) return;
    res = { version: r.version, cfg: normalizar(r.cfg) };
    vista = null;
    try { localStorage.setItem('cfg_v1', JSON.stringify(res)); } catch (e) {}
    pintar(res.cfg);
  }
  function previa(cfg) { vista = normalizar(cfg); pintar(vista); }
  function revertir() { vista = null; pintar(res.cfg); }
  function seccion(s) { sec = s; if (!enLogin) { const c = cfgActual(); ponerFondo(forzado || fondoDe(c, s), c); } }
  function modoLogin(b) {
  enLogin = b;
  document.body.classList.toggle('en-login', b);
  const c = cfgActual();
  ponerFondo(forzado || (b ? c.fondoLogin : fondoDe(c, sec)), c);
}
  function setModo(m) { try { localStorage.setItem('modo', m); } catch (e) {} pintar(cfgActual()); }

  // Reflejo que sigue al cursor en las tarjetas de cristal
  document.addEventListener('pointermove', function (e) {
    const c = e.target.closest && e.target.closest('.card');
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  // Copia guardada: el diseño aparece al instante
  try { const c = JSON.parse(localStorage.getItem('cfg_v1') || 'null'); if (c && c.cfg) res = { version: c.version, cfg: normalizar(c.cfg) }; } catch (e) {}
  if (!res) res = { version: 0, cfg: normalizar({}) };
  pintar(res.cfg);

  return {
    pref: pref, setPref: setPref,
    DEF: DEF, ACENTOS: ACENTOS, PRESETS: PRESETS, FUENTES: FUENTES, SECCIONES: SEC,
    clon: clon, aplicar: aplicar, previa: previa, revertir: revertir, seccion: seccion, modoLogin: modoLogin, setModo: setModo,
    cfg: cfgActual, guardada: () => res.cfg, modo: () => modoEf(cfgActual()), urlImg: urlImg,
    local: (id, u) => { local[id] = u; }, logoHtml: px => logoHtml(cfgActual(), px),
    forzar: f => { forzado = f; pintar(cfgActual()); }
  };
})();