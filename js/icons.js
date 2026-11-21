/* Motor de iconos con Iconify (0 descargas locales, 3 estilos intercambiables).
   Los mensajes del chat (burbujas .m) NO se tocan. */
(function () {
  const SOLAR = {
    moon:      'solar:moon-stars-bold-duotone',
    bolt:      'solar:bolt-bold-duotone',
    home:      'solar:home-2-bold-duotone',
    chat:      'solar:chat-round-dots-bold-duotone',
    box:       'solar:box-bold-duotone',
    users:     'solar:users-group-rounded-bold-duotone',
    user:      'solar:user-circle-bold-duotone',
    grid:      'solar:widget-2-bold-duotone',
    logout:    'solar:logout-2-bold-duotone',
    alert:     'solar:danger-triangle-bold-duotone',
    camera:    'solar:camera-bold-duotone',
    clock:     'solar:clock-circle-bold-duotone',
    hourglass: 'solar:hourglass-bold-duotone',
    truck:     'solar:delivery-bold-duotone',
    nav:       'solar:map-arrow-right-bold-duotone',
    check:     'solar:check-circle-bold-duotone',
    xcircle:   'solar:close-circle-bold-duotone',
    gift:      'solar:gift-bold-duotone',
    dollar:    'solar:dollar-minimalistic-bold-duotone',
    file:      'solar:bill-list-bold-duotone',
    target:    'solar:target-bold-duotone',
    trend:     'solar:graph-up-bold-duotone',
    bars:      'solar:chart-2-bold-duotone',
    card:      'solar:card-bold-duotone',
    award:     'solar:cup-star-bold-duotone',
    pin:       'solar:map-point-bold-duotone',
    briefcase: 'solar:case-minimalistic-bold-duotone',
    search:    'solar:magnifer-bold-duotone',
    bot:       'solar:cpu-bolt-bold-duotone',
    help:      'solar:question-circle-bold-duotone',
    back:      'solar:arrow-left-bold-duotone',
    chevl:     'solar:alt-arrow-left-bold-duotone',
    send:      'solar:plain-bold-duotone',
    refresh:   'solar:refresh-bold-duotone',
    list:      'solar:list-bold-duotone',
    columns:   'solar:widget-4-bold-duotone',
    table:     'solar:checklist-minimalistic-bold-duotone',
    close:     'solar:close-square-bold-duotone',
    plus:      'solar:add-circle-bold-duotone',
    calendar:  'solar:calendar-bold-duotone',
    tag:       'solar:tag-price-bold-duotone',
    tool:      'solar:settings-bold-duotone',
    star:      'solar:star-bold-duotone',
    clipboard: 'solar:clipboard-list-bold-duotone',
    map:       'solar:map-bold-duotone',
    save:      'solar:diskette-bold-duotone',
    drop:      'solar:pallete-2-bold-duotone',
    bell:      'solar:bell-bing-bold-duotone',
    crown:     'solar:crown-bold-duotone',
    dot:       'solar:record-circle-bold-duotone',
    smile:     'solar:smile-circle-bold-duotone',
    eye:       'solar:eye-bold-duotone',
    broom:     'solar:restart-bold-duotone',
    bulb:      'solar:lightbulb-bolt-bold-duotone'
  };

  const CORPORATIVO = {
    moon:      'ph:moon-stars-duotone',
    bolt:      'ph:lightning-duotone',
    home:      'ph:house-duotone',
    chat:      'ph:chat-circle-dots-duotone',
    box:       'ph:package-duotone',
    users:     'ph:users-three-duotone',
    user:      'ph:user-circle-duotone',
    grid:      'ph:squares-four-duotone',
    logout:    'ph:sign-out-duotone',
    alert:     'ph:warning-duotone',
    camera:    'ph:camera-duotone',
    clock:     'ph:clock-duotone',
    hourglass: 'ph:hourglass-duotone',
    truck:     'ph:truck-duotone',
    nav:       'ph:navigation-arrow-duotone',
    check:     'ph:check-circle-duotone',
    xcircle:   'ph:x-circle-duotone',
    gift:      'ph:gift-duotone',
    dollar:    'ph:currency-dollar-duotone',
    file:      'ph:receipt-duotone',
    target:    'ph:target-duotone',
    trend:     'ph:trend-up-duotone',
    bars:      'ph:chart-bar-duotone',
    card:      'ph:credit-card-duotone',
    award:     'ph:trophy-duotone',
    pin:       'ph:map-pin-duotone',
    briefcase: 'ph:briefcase-duotone',
    search:    'ph:magnifying-glass-duotone',
    bot:       'ph:robot-duotone',
    help:      'ph:question-duotone',
    back:      'ph:arrow-left-duotone',
    chevl:     'ph:caret-left-duotone',
    send:      'ph:paper-plane-tilt-duotone',
    refresh:   'ph:arrows-clockwise-duotone',
    list:      'ph:list-bullets-duotone',
    columns:   'ph:kanban-duotone',
    table:     'ph:table-duotone',
    close:     'ph:x-duotone',
    plus:      'ph:plus-circle-duotone',
    calendar:  'ph:calendar-blank-duotone',
    tag:       'ph:tag-duotone',
    tool:      'ph:wrench-duotone',
    star:      'ph:sparkle-duotone',
    clipboard: 'ph:clipboard-text-duotone',
    map:       'ph:map-trifold-duotone',
    save:      'ph:floppy-disk-duotone',
    drop:      'ph:palette-duotone',
    bell:      'ph:bell-ringing-duotone',
    crown:     'ph:crown-duotone',
    dot:       'ph:radio-button-duotone',
    smile:     'ph:hand-waving-duotone',
    eye:       'ph:eye-duotone',
    broom:     'ph:broom-duotone',
    bulb:      'ph:lightbulb-duotone'
  };

  // Material Line Icons (animados y en loop) con Solar como respaldo para el resto
  const ANIMADO = Object.assign({}, SOLAR, {
    home:      'line-md:home-md-twotone',
    chat:      'line-md:chat-twotone',
    user:      'line-md:account',
    grid:      'line-md:grid-3-twotone',
    logout:    'line-md:logout',
    alert:     'line-md:alert-loop',
    clock:     'line-md:watch-loop',
    check:     'line-md:confirm-circle-twotone',
    xcircle:   'line-md:close-circle-twotone',
    file:      'line-md:document-list-twotone',
    pin:       'line-md:map-marker-alt-loop',
    search:    'line-md:search-twotone',
    help:      'line-md:question-circle-twotone',
    back:      'line-md:arrow-left',
    chevl:     'line-md:chevron-left',
    list:      'line-md:list-3-twotone',
    close:     'line-md:close',
    plus:      'line-md:plus',
    calendar:  'line-md:calendar',
    tool:      'line-md:cog-loop',
    star:      'line-md:star-pulsating-twotone-loop',
    clipboard: 'line-md:clipboard-list-twotone',
    bell:      'line-md:bell-loop',
    moon:      'line-md:moon-alt-loop'
  });

  const PACKS = { solar: SOLAR, corporativo: CORPORATIVO, animado: ANIMADO };
  let PACK = 'solar';
  try {
    const g = localStorage.getItem('crm_icon_pack');
    if (g && PACKS[g]) PACK = g;
  } catch (e) {}

  const MAP = {
    '⚡':'bolt', '🏠':'home', '💬':'chat', '📦':'box', '🛍':'box', '👥':'users', '👤':'user', '🧑':'user',
    '\u{1F9D1}\u200D\u{1F4BC}':'briefcase', '🧰':'grid', '⎋':'logout', '🚨':'alert', '⚠':'alert',
    '📸':'camera', '📷':'camera', '⏰':'clock', '🕒':'clock', '⏳':'hourglass', '🚚':'truck', '🛵':'nav',
    '✅':'check', '🎉':'check', '❌':'xcircle', '🎁':'gift', '💰':'dollar', '💵':'dollar', '🧾':'file', '📄':'file',
    '🎯':'target', '📈':'trend', '📊':'bars', '💳':'card', '🏆':'award', '📍':'pin', '🔎':'search', '🤖':'bot',
    '🙋':'help', '←':'back', '‹':'chevl', '➤':'send', '⟳':'refresh', '☰':'list', '▦':'columns', '▤':'table',
    '✕':'close', '＋':'plus', '📅':'calendar', '🏷':'tag', '🛠':'tool', '⭐':'star', '✨':'star', '📋':'clipboard',
    '🗺':'map', '💾':'save', '🎨':'drop', '🔔':'bell', '👑':'crown', '🌙':'moon', '🔘':'dot', '👋':'smile',
    '👁':'eye', '🧹':'broom', '💡':'bulb'
  };

  const keys = Object.keys(MAP).sort((a, b) => b.length - a.length);
  const fuente = '(' + keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\uFE0F?';
  const RE = new RegExp(fuente, 'g');
  const RE_T = new RegExp(fuente);
  const STRIP = /[\p{Extended_Pictographic}\uFE0F\u200D⎋⟳➤☰▦▤✕＋]/gu;

  const iconEl = function (key) {
    const el = document.createElement('iconify-icon');
    el.className = 'sv';
    el.dataset.ik = key;
    el.setAttribute('icon', (PACKS[PACK] && PACKS[PACK][key]) || SOLAR[key] || 'solar:star-bold-duotone');
    el.setAttribute('width', '1em');
    el.setAttribute('height', '1em');
    el.setAttribute('aria-hidden', 'true');
    return el;
  };

  const omitir = function (n) {
    return !!(n && n.closest && n.closest('.m, textarea, input, script, style, svg, iconify-icon'));
  };

  function convertir(txt) {
    const s = txt.nodeValue, frag = document.createDocumentFragment();
    let ult = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(s))) {
      if (m.index > ult) frag.appendChild(document.createTextNode(s.slice(ult, m.index)));
      frag.appendChild(iconEl(MAP[m[1]]));
      ult = m.index + m[0].length;
    }
    if (ult < s.length) frag.appendChild(document.createTextNode(s.slice(ult)));
    txt.parentNode.replaceChild(frag, txt);
  }

  function procesar(raiz) {
    if (!raiz) return;
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

  function setPack(p) {
    if (!PACKS[p]) return;
    PACK = p;
    try { localStorage.setItem('crm_icon_pack', p); } catch (e) {}
    document.querySelectorAll('iconify-icon[data-ik]').forEach(function (el) {
      const k = el.dataset.ik;
      el.setAttribute('icon', PACKS[PACK][k] || SOLAR[k]);
    });
  }

  window.Iconos = {
    setPack: setPack,
    getPack: function () { return PACK; },
    packs: Object.keys(PACKS)
  };

  const mo = new MutationObserver(function (muts) {
    mo.disconnect();
    muts.forEach(function (m) { m.addedNodes.forEach(procesar); });
    mo.observe(document.body, { childList: true, subtree: true });
  });
  mo.observe(document.body, { childList: true, subtree: true });
  procesar(document.body);
})();