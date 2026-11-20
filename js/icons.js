/* Iconos SVG en línea: se dibujan en el navegador (0 descargas, ~6 KB).
   Reemplazan automáticamente los emojis de la interfaz.
   Los mensajes del chat (burbujas .m) NO se tocan.
   Para agregar uno: ponlo en P (dibujo) y en MAP (qué emoji reemplaza). */
(function () {
  const P = {
    bolt:      '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    home:      '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    chat:      '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    box:       '<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    users:     '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user:      '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    grid:      '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    logout:    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    alert:     '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    camera:    '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    clock:     '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    hourglass: '<path d="M6 2h12"/><path d="M6 22h12"/><path d="M7 2v4.5L12 12l-5 5.5V22"/><path d="M17 2v4.5L12 12l5 5.5V22"/>',
    truck:     '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    nav:       '<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
    check:     '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    xcircle:   '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    gift:      '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    dollar:    '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    file:      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    target:    '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    trend:     '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    bars:      '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    card:      '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    award:     '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    pin:       '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    search:    '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    bot:       '<rect x="4" y="8" width="16" height="12" rx="3"/><line x1="12" y1="4" x2="12" y2="8"/><circle cx="12" cy="3.5" r="1"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/><line x1="9" y1="17" x2="15" y2="17"/>',
    help:      '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    back:      '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    chevl:     '<polyline points="15 18 9 12 15 6"/>',
    send:      '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    refresh:   '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    list:      '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    columns:   '<path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18"/>',
    close:     '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    plus:      '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    calendar:  '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    tag:       '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
    tool:      '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    star:      '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
    map:       '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
    save:      '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    drop:      '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
    bell:      '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    crown:     '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8z"/>',
    dot:       '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
    smile:     '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>'
  };

  // emoji (o símbolo) → icono
  const MAP = {
    '⚡':'bolt', '🏠':'home', '💬':'chat', '📦':'box', '🛍':'box', '👥':'users', '👤':'user', '🧑':'user',
    '\u{1F9D1}\u200D\u{1F4BC}':'briefcase', '🧰':'grid', '⎋':'logout', '🚨':'alert', '⚠':'alert',
    '📸':'camera', '📷':'camera', '⏰':'clock', '🕒':'clock', '⏳':'hourglass', '🚚':'truck', '🛵':'nav',
    '✅':'check', '🎉':'check', '❌':'xcircle', '🎁':'gift', '💰':'dollar', '💵':'dollar', '🧾':'file', '📄':'file',
    '🎯':'target', '📈':'trend', '📊':'bars', '💳':'card', '🏆':'award', '📍':'pin', '🔎':'search', '🤖':'bot',
    '🙋':'help', '←':'back', '‹':'chevl', '➤':'send', '⟳':'refresh', '☰':'list', '▦':'columns', '✕':'close',
    '＋':'plus', '📅':'calendar', '🏷':'tag', '🛠':'tool', '⭐':'star', '✨':'star', '📋':'clipboard', '🗺':'map',
    '💾':'save', '🎨':'drop', '🔔':'bell', '👑':'crown', '🔘':'dot', '👋':'smile'
  };

  const keys = Object.keys(MAP).sort(function (a, b) { return b.length - a.length; });
  const fuente = '(' + keys.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')\\uFE0F?';
  const RE = new RegExp(fuente, 'g');       // con g: para reemplazar
  const RE_T = new RegExp(fuente);          // sin g: para probar
  const STRIP = /[\p{Extended_Pictographic}\uFE0F\u200D⎋⟳➤☰▦✕＋]/gu;   // para placeholders y <option>, que no admiten SVG

  const svg = function (n) {
    return '<svg class="sv" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[n] + '</svg>';
  };
  const omitir = function (n) {
    return !!(n && n.closest && n.closest('.m, textarea, input, script, style, svg'));
  };

  function convertir(txt) {
    const s = txt.nodeValue, frag = document.createDocumentFragment();
    let ult = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(s))) {
      if (m.index > ult) frag.appendChild(document.createTextNode(s.slice(ult, m.index)));
      const t = document.createElement('template');
      t.innerHTML = svg(MAP[m[1]]);
      frag.appendChild(t.content.firstChild);
      ult = m.index + m[0].length;
    }
    if (ult < s.length) frag.appendChild(document.createTextNode(s.slice(ult)));
    txt.parentNode.replaceChild(frag, txt);
  }

  function procesar(raiz) {
    if (raiz.nodeType === 3) { raiz = raiz.parentNode; if (!raiz) return; }
    if (raiz.nodeType !== 1 || omitir(raiz)) return;

    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    const nodos = [];
    while (w.nextNode()) nodos.push(w.currentNode);
    nodos.forEach(function (t) {
      const p = t.parentNode;
      if (!p || omitir(p)) return;
      if (p.tagName === 'OPTION') { t.nodeValue = t.nodeValue.replace(STRIP, '').replace(/^\s+/, ''); return; }
      if (RE_T.test(t.nodeValue)) convertir(t);
    });

    const campos = raiz.querySelectorAll ? raiz.querySelectorAll('[placeholder]') : [];
    campos.forEach(function (c) { c.placeholder = c.placeholder.replace(STRIP, '').replace(/^\s+/, ''); });
  }

  const mo = new MutationObserver(function (muts) {
    mo.disconnect();                                    // no reprocesar nuestros propios cambios
    muts.forEach(function (m) { m.addedNodes.forEach(procesar); });
    mo.observe(document.body, { childList: true, subtree: true });
  });
  mo.observe(document.body, { childList: true, subtree: true });
  procesar(document.body);
})();