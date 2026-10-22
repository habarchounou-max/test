/* Hayata Technology V7.0.0 — couche d'expérience avancée (module autonome)
   Fonctions : statut d'ouverture, accès rapide, recherche (Ctrl/⌘ K), cartes de visite,
   envoi WhatsApp des formulaires. Aucune dépendance. Dégrade proprement sans JS. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PHONE = '+23566706004', PHONE_TXT = '+235 66 70 60 04';
  const MAIL = 'contact@hayatatech.com';
  const WA = 'https://wa.me/23566706004';

  const SVG = (inner, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" ${extra}>${inner}</svg>`;
  const I = {
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6A8.4 8.4 0 0 1 12.5 3H13a8.5 8.5 0 0 1 8 8z"/>',
    search: '<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    page: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    wa: '<path d="M3 21l1.65-4.84A8.5 8.5 0 1 1 8 19.4z"/><path d="M9 10c.5 2.2 2.8 4.5 5 5l1.3-1.3a.8.8 0 0 1 .8-.2l1.7.6v1.8a1.5 1.5 0 0 1-1.6 1.5C10.8 17.4 6.6 13.2 6.2 8.6A1.5 1.5 0 0 1 7.7 7H9.5l.6 1.7a.8.8 0 0 1-.2.8z"/>'
  };

  /* ---------- 1. Statut d'ouverture (heure de N'Djamena) ---------- */
  const HOURS = { 1: [480, 960], 2: [480, 960], 3: [480, 960], 4: [480, 960], 5: [480, 720] };
  const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const hm = m => `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;
  const nowNdjamena = () => {
    try {
      const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Ndjamena', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
        .formatToParts(new Date()).map(x => [x.type, x.value]));
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
      return { day, min: (+p.hour % 24) * 60 + +p.minute };
    } catch (_) { return null; }
  };
  const statusText = () => {
    const n = nowNdjamena(); if (!n) return null;
    const today = HOURS[n.day];
    if (today && n.min >= today[0] && n.min < today[1]) return { open: true, text: `Ouvert maintenant · ferme à ${hm(today[1])}` };
    if (today && n.min < today[0]) return { open: false, text: `Fermé · ouvre aujourd’hui à ${hm(today[0])}` };
    for (let d = 1; d <= 7; d++) {
      const k = (n.day + d) % 7, h = HOURS[k];
      if (h) return { open: false, text: `Fermé · ouvre ${d === 1 ? 'demain' : DAYS[k]} à ${hm(h[0])}` };
    }
    return null;
  };
  const paintStatus = () => {
    const s = statusText();
    $$('[data-open-status]').forEach(el => {
      if (!s) { el.textContent = ''; return; }
      el.textContent = s.text; el.classList.toggle('is-open', s.open);
      el.setAttribute('role', 'status');
    });
  };
  paintStatus(); setInterval(paintStatus, 60000);

  /* ---------- 2. Accès rapide flottant ---------- */
  const dial = document.createElement('div');
  dial.className = 'dial'; dial.setAttribute('data-dial', '');
  dial.innerHTML = `
    <div class="dial-actions" id="dial-actions">
      <a href="tel:${PHONE}"><span class="di">${SVG(I.phone)}</span>Appeler</a>
      <a href="${WA}" target="_blank" rel="noopener noreferrer"><span class="di di-wa">${SVG(I.wa)}</span>WhatsApp</a>
      <a href="mailto:${MAIL}"><span class="di di-mail">${SVG(I.mail)}</span>Écrire</a>
      <button type="button" data-search><span class="di">${SVG(I.search)}</span>Rechercher</button>
      <button type="button" data-top><span class="di di-top">${SVG(I.up)}</span>Haut de page</button>
    </div>
    <button class="dial-main" type="button" aria-expanded="false" aria-controls="dial-actions" aria-label="Contacts rapides">
      <span class="i-open">${SVG(I.chat)}</span><span class="i-close">${SVG(I.close)}</span>
    </button>`;
  body.appendChild(dial);
  const main = $('.dial-main', dial);
  const setDial = open => { dial.classList.toggle('open', open); main.setAttribute('aria-expanded', String(open)); };
  main.addEventListener('click', () => setDial(!dial.classList.contains('open')));
  document.addEventListener('click', e => { if (!dial.contains(e.target)) setDial(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && dial.classList.contains('open')) { setDial(false); main.focus(); } });
  $$('.dial-actions a', dial).forEach(a => a.addEventListener('click', () => setDial(false)));
  $('[data-top]', dial).addEventListener('click', () => { setDial(false); scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); });
  let tick = false;
  const onScroll = () => { if (tick) return; tick = true; requestAnimationFrame(() => { dial.classList.toggle('scrolled', scrollY > 600); tick = false; }); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- 3. Palette de recherche ---------- */
  const ITEMS = [
    ['Accueil', 'index.html', 'Page', 'page', 'home accueil'],
    ['À propos', 'a-propos.html', 'Page', 'page', 'societe entreprise mission'],
    ['Nos services', 'services.html', 'Page', 'page', 'prestations offres'],
    ['Pôle Connectivité & Infrastructures', 'connectivite.html', 'Pôle', 'bolt', 'reseau internet equipements'],
    ['Pôle Cybersécurité & Solutions digitales', 'services.html#cyber', 'Pôle', 'bolt', 'securite developpement donnees'],
    ['Pôle Conseil, Formation & Innovation', 'services.html#conseil', 'Pôle', 'bolt', 'strategie formation accompagnement'],
    ['Accès Internet (FAI)', 'connectivite.html', 'Service', 'page', 'wifi connexion fournisseur'],
    ['Matériels & équipements', 'connectivite.html', 'Service', 'page', 'ordinateur routeur reseau'],
    ['Vidéosurveillance (caméras)', 'connectivite.html', 'Service', 'page', 'camera securite cctv'],
    ['Maintenance informatique', 'connectivite.html', 'Service', 'page', 'depannage reparation it'],
    ['Administration des systèmes', 'connectivite.html', 'Service', 'page', 'serveurs supervision'],
    ['Développement web & mobile', 'services.html#cyber', 'Service', 'page', 'application site logiciel'],
    ['Bases de données & analyse', 'services.html#cyber', 'Service', 'page', 'data donnees statistiques'],
    ['Sécurité numérique & SEO', 'services.html#cyber', 'Service', 'page', 'cybersecurite referencement'],
    ['Audit technologique', 'services.html#cyber', 'Service', 'page', 'diagnostic'],
    ['Conseil stratégique', 'services.html#conseil', 'Service', 'page', 'consultation'],
    ['Formation numérique & cybersécurité', 'services.html#conseil', 'Service', 'page', 'cours apprentissage'],
    ['Notre équipe', 'a-propos.html#equipe', 'Page', 'user', 'membres direction ingenieurs'],
    ['Contact', 'contact.html', 'Page', 'mail', 'adresse horaires formulaire'],
    ['Demander un devis gratuit', 'contact.html#devis', 'Action', 'bolt', 'prix tarif estimation projet'],
    [`Appeler ${PHONE_TXT}`, `tel:${PHONE}`, 'Action', 'phone', 'telephone appel'],
    ['Écrire sur WhatsApp', WA, 'Action', 'wa', 'message discussion'],
    [`Envoyer un email`, `mailto:${MAIL}`, 'Action', 'mail', 'courriel ecrire']
  ];
  const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const box = document.createElement('div');
  box.className = 'cmdk'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Recherche rapide'); box.hidden = false;
  box.innerHTML = `
    <div class="cmdk-box">
      <div class="cmdk-head">${SVG(I.search)}
        <input class="cmdk-input" type="search" placeholder="Rechercher une page, un service, une action…" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-autocomplete="list" aria-label="Rechercher sur le site">
        <button class="cmdk-esc" type="button" aria-label="Fermer la recherche">Échap</button>
      </div>
      <ul class="cmdk-list" id="cmdk-list" role="listbox" aria-label="Résultats"></ul>
      <div class="cmdk-foot"><span><kbd>↑</kbd><kbd>↓</kbd>naviguer</span><span><kbd>↵</kbd>ouvrir</span><span><kbd>Échap</kbd>fermer</span></div>
    </div>`;
  body.appendChild(box);
  const input = $('.cmdk-input', box), list = $('.cmdk-list', box);
  let current = [], idx = 0, lastFocus = null;
  const render = q => {
    const t = norm(q).trim().split(/\s+/).filter(Boolean);
    current = ITEMS.filter(it => { const h = norm(it[0] + ' ' + it[4] + ' ' + it[2]); return t.every(w => h.includes(w)); });
    idx = 0; list.innerHTML = '';
    if (!current.length) { list.innerHTML = '<li class="cmdk-empty" role="presentation">Aucun résultat. Essayez « internet », « devis » ou « formation ».</li>'; input.removeAttribute('aria-activedescendant'); return; }
    let group = '';
    current.forEach((it, i) => {
      if (it[2] !== group) { group = it[2]; const g = document.createElement('li'); g.className = 'cmdk-group'; g.setAttribute('role', 'presentation'); g.textContent = group + 's'; list.appendChild(g); }
      const li = document.createElement('li'); li.className = 'cmdk-item'; li.setAttribute('role', 'presentation');
      const ext = /^https?:/.test(it[1]);
      li.innerHTML = `<a id="cmdk-o${i}" role="option" href="${it[1]}" ${ext ? 'target="_blank" rel="noopener noreferrer"' : ''} aria-selected="${i === 0}"><span class="ci">${SVG(I[it[3]] || I.page)}</span><span class="ct">${it[0]}</span><small>${it[2]}</small></a>`;
      list.appendChild(li);
    });
    input.setAttribute('aria-activedescendant', 'cmdk-o0');
  };
  const select = i => {
    const opts = $$('[role=option]', list); if (!opts.length) return;
    idx = (i + opts.length) % opts.length;
    opts.forEach((o, k) => o.setAttribute('aria-selected', String(k === idx)));
    input.setAttribute('aria-activedescendant', opts[idx].id); opts[idx].scrollIntoView({ block: 'nearest' });
  };
  const openBox = () => {
    if (box.classList.contains('open')) return;
    lastFocus = document.activeElement; setDial(false);
    box.classList.add('open'); body.classList.add('cmdk-open'); input.value = ''; render(''); input.focus(); requestAnimationFrame(() => input.focus());
  };
  const closeBox = () => { box.classList.remove('open'); body.classList.remove('cmdk-open'); (lastFocus && lastFocus.focus) && lastFocus.focus(); };
  input.addEventListener('input', () => render(input.value));
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); select(idx + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); select(idx - 1); }
    else if (e.key === 'Enter') { const o = $$('[role=option]', list)[idx]; if (o) { e.preventDefault(); o.click(); } }
  });
  list.addEventListener('click', e => { if (e.target.closest('a')) closeBox(); });
  box.addEventListener('mousedown', e => { if (e.target === box) closeBox(); });
  $('.cmdk-esc', box).addEventListener('click', closeBox);
  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'k') { e.preventDefault(); box.classList.contains('open') ? closeBox() : openBox(); }
    else if (e.key === 'Escape' && box.classList.contains('open')) closeBox();
    else if (e.key === '/' && !/^(input|textarea|select)$/i.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) { e.preventDefault(); openBox(); }
    else if (e.key === 'Tab' && box.classList.contains('open')) {
      const f = $$('input,button,a[href]', box).filter(x => x.offsetParent !== null); if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  $('[data-search]', dial).addEventListener('click', openBox);
  /* bouton dans l'en-tête */
  const navCta = $('.nav-cta');
  if (navCta) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'nav-search';
    b.setAttribute('aria-label', 'Rechercher sur le site (raccourci Ctrl K)'); b.title = 'Rechercher (Ctrl K)';
    b.innerHTML = SVG(I.search); b.addEventListener('click', openBox);
    navCta.insertBefore(b, $('.burger', navCta) || null);
  }

  /* ---------- 4. Cartes de visite de l'équipe ---------- */
  $$('.member').forEach(m => {
    const name = ($('h3', m) || {}).textContent; if (!name) return;
    const role = (($('.role', m) || {}).textContent || '').trim();
    const mail = ($('a[href^="mailto:"]', m) || {}).href || '';
    const tel = ($('a[href^="tel:"]', m) || {}).href || '';
    const b = document.createElement('button'); b.type = 'button'; b.className = 'vcard-btn';
    b.innerHTML = SVG(I.download) + '<span>Enregistrer le contact</span>';
    b.setAttribute('aria-label', `Enregistrer le contact de ${name.trim()}`);
    b.addEventListener('click', () => {
      const v = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${name.trim()}`, `N:${name.trim()};;;;`, 'ORG:Hayata Technology S.A.S.', role && `TITLE:${role}`,
        tel && `TEL;TYPE=CELL:${decodeURIComponent(tel.replace('tel:', ''))}`, mail && `EMAIL;TYPE=INTERNET:${mail.replace('mailto:', '')}`,
        'URL:https://www.hayatatech.com', 'ADR;TYPE=WORK:;;448 Farcha\\, Route de l’Abattoir de Farcha;N’Djamena;;;Tchad', 'END:VCARD'].filter(Boolean).join('\r\n');
      const url = URL.createObjectURL(new Blob([v], { type: 'text/vcard;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = name.trim().replace(/\s+/g, '-').toLowerCase() + '.vcf';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    });
    m.appendChild(b);
  });

  /* ---------- 5. Envoi des formulaires par WhatsApp ---------- */
  $$('form[data-mail]').forEach(f => {
    const submit = $('button[type="submit"]', f); if (!submit || $('.form-actions', f)) return;
    const wrap = document.createElement('div'); wrap.className = 'form-actions';
    submit.parentNode.insertBefore(wrap, submit); wrap.appendChild(submit);
    const w = document.createElement('button'); w.type = 'button'; w.className = 'btn btn-wa';
    w.innerHTML = SVG(I.wa, 'width="18" height="18"') + 'Envoyer via WhatsApp';
    w.addEventListener('click', () => {
      if (!f.reportValidity()) return;
      const lines = [`Bonjour Hayata Technology, je vous écris depuis votre site (${f.dataset.mail === 'devis' ? 'demande de devis' : 'contact'}).`, ''];
      $$('input, select, textarea', f).forEach(el => {
        if (!el.name || el.name === 'website' || !String(el.value).trim() || el.type === 'hidden') return;
        const lab = el.closest('label');
        const t = lab ? [...lab.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim() : el.name;
        lines.push(`${t || el.name} : ${String(el.value).trim()}`);
      });
      window.open(`${WA}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
    });
    wrap.appendChild(w);
  });
  /* ---------- 6. Chiffres clés : compteurs animés ---------- */
  const nums = $$('[data-to]');
  if (nums.length) {
    const fmt = (v, d) => v.toFixed(d).replace('.', ',');
    const run = el => {
      const to = parseFloat(el.dataset.to), d = +el.dataset.dec || 0; if (isNaN(to)) return;
      if (reduced) { el.textContent = fmt(to, d); return; }
      const t0 = performance.now(), dur = 1500;
      const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(to * e, d); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: .5 });
      nums.forEach(n => io.observe(n));
    } else nums.forEach(run);
  }
})();
