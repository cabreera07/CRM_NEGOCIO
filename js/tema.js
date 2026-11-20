/* ===== Motor de diseño =====
   Aplica la configuración global (hoja Config_Global) a toda la app.
   Guarda una copia en localStorage: al abrir, el diseño aparece al instante. */
const Tema = (function () {
  const DEF = {
    negocio: 'Mi Tienda', eslogan: 'Centro de atención',
    loginTitulo: 'Panel de atención', loginTexto: 'Entra con tu usuario y PIN',
    logo: '', logoForma: 'redondeado',
    modo: 'oscuro', acento: 'azul', colorA: '#22d3ff', colorB: '#3b82f6',
    fondoLogin: { t: 'preset', v: 'aurora' }, fondoApp: { t: 'preset', v: 'aurora' }, fondosSec: {},
    blur: 18, opacidad: 55, velo: 40, radio: 18, brillo: true,
    fuente: 'sistema', anim: 'equilibrado', permitirModo: true
  };
  const ACENTOS = {
    azul: ['#22d3ff', '#3b82f6'], violeta: ['#b79bff', '#7c3aed'], esmeralda: ['#34e8b0', '#10b981'],
    ambar: ['#ffc247', '#f97316'], rosa: ['#ff7ab8', '#ec4899']
  };
  const PRESETS = {
    aurora:       { n: 'Aurora', anim: true, claro: false, css: 'radial-gradient(60% 50% at 15% 20%,rgba(34,211,255,.40),transparent 60%),radial-gradient(55% 45% at 85% 15%,rgba(124,58,237,.36),transparent 60%),radial-gradient(60% 55% at 70% 92%,rgba(16,185,129,.30),transparent 60%),#060b1c' },
    marmol:       { n: 'Mármol oscuro', anim: false, claro: false, css: 'linear-gradient(115deg,transparent 38%,rgba(255,255,255,.06) 44%,transparent 50%),linear-gradient(62deg,transparent 56%,rgba(255,255,255,.045) 61%,transparent 67%),radial-gradient(90% 70% at 30% 15%,#272c36,#0a0c11 75%)' },
    medianoche:   { n: 'Medianoche', anim: false, claro: false, css: 'radial-gradient(90% 70% at 50% -10%,#17306b 0%,#070d22 60%,#03050f 100%)' },
    arquitectura: { n: 'Arquitectura', anim: false, claro: false, css: 'radial-gradient(70% 30% at 50% 100%,rgba(34,211,255,.28),transparent 70%),repeating-linear-gradient(90deg,rgba(255,255,255,.035) 0 1px,transparent 1px 120px),linear-gradient(180deg,#05070d 0%,#0b1224 55%,#13203f 100%)' },
    oceano:       { n: 'Océano', anim: true, claro: false, css: 'radial-gradient(70% 60% at 20% 10%,rgba(45,212,191,.38),transparent 60%),radial-gradient(70% 60% at 90% 80%,rgba(14,116,144,.55),transparent 60%),#04141f' },
    atardecer:    { n: 'Atardecer', anim: true, claro: false, css: 'radial-gradient(70% 60% at 85% 10%,rgba(251,146,60,.42),transparent 60%),radial-gradient(70% 60% at 10% 85%,rgba(168,85,247,.42),transparent 60%),#140a1f' },
    grafito:      { n: 'Grafito', anim: false, claro: false, css: 'radial-gradient(80% 60% at 50% 0%,#2a2f3a,#0e1116 70%)' },
    esmeralda:    { n: 'Esmeralda', anim: true, claro: false, css: 'radial-gradient(70% 60% at 20% 15%,rgba(16,185,129,.40),transparent 60%),radial-gradient(60% 50% at 85% 85%,rgba(34,211,255,.24),transparent 60%),#04130f' },
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

  function pintar(cfg) {
    const b = document.body, s = b.style, modo = modoEf(cfg), ahorro = cfg.anim === 'ahorro';
    b.dataset.modo = modo; b.dataset.anim = cfg.anim;
    const ac = cfg.acento === 'custom' ? [cfg.colorA, cfg.colorB] : (ACENTOS[cfg.acento] || ACENTOS.azul);
    const a = rgb(ac[0]);
    s.setProperty('--pri', ac[0]); s.setProperty('--pri2', ac[1]); s.setProperty('--pri-rgb', a.join(','));
    s.setProperty('--glow', 'rgba(' + a.join(',') + ',.30)'); s.setProperty('--glow2', 'rgba(' + rgb(ac[1]).join(',') + ',.22)');
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
  function modoLogin(b) { enLogin = b; const c = cfgActual(); ponerFondo(forzado || (b ? c.fondoLogin : fondoDe(c, sec)), c); }
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
    DEF: DEF, ACENTOS: ACENTOS, PRESETS: PRESETS, FUENTES: FUENTES, SECCIONES: SEC,
    clon: clon, aplicar: aplicar, previa: previa, revertir: revertir, seccion: seccion, modoLogin: modoLogin, setModo: setModo,
    cfg: cfgActual, guardada: () => res.cfg, modo: () => modoEf(cfgActual()), urlImg: urlImg,
    local: (id, u) => { local[id] = u; }, logoHtml: px => logoHtml(cfgActual(), px),
    forzar: f => { forzado = f; pintar(cfgActual()); }
  };
})();