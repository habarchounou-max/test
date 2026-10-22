/* Hayata Technology V6.6.0 — couche UX / accessibilité (module unique)
   Responsabilités : menu mobile, sous-menus, onglets de contact, validation et brouillons de formulaire,
   dock mobile (devis / WhatsApp / haut de page), pause des animations, mode économie de données,
   copie des coordonnées, notifications, préchargement des pages, service worker. */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const mobileMQ = matchMedia('(max-width: 960px)');
  const lite = !!window.HAYATA_LITE;
  root.classList.add('js');

  /* ---------- Notifications (toast) ---------- */
  let toastBox;
  const toast = (msg, kind = 'info', ms = 3800) => {
    if (!toastBox) {
      toastBox = document.createElement('div');
      toastBox.className = 'toast-box';
      toastBox.setAttribute('role', 'status');
      toastBox.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastBox);
    }
    const t = document.createElement('div');
    t.className = 'toast toast-' + kind;
    t.textContent = msg;
    toastBox.appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 350); }, ms);
  };

  /* ---------- Sous-menus : fermeture générale (définie tôt, utilisée par le menu mobile) ---------- */
  const dds = $$('.has-dd');
  function closeAllDropdowns(except) {
    dds.forEach(d => {
      if (d === except) return;
      d.classList.remove('open');
      $('.dd-btn', d)?.setAttribute('aria-expanded', 'false');
    });
  }

  /* ---------- Navigation : menu mobile ---------- */
  const nav = $('.nav');
  const burger = $('.burger');
  const menu = $('.nav-links');

  if (nav && burger && menu) {
    // Un seul contrôle de fermeture : le bouton hamburger devient une croix.
    // Aucun bouton « Fermer » supplémentaire n'est injecté dans le tiroir.

    // Actions rapides dans le menu mobile (devis, appel, WhatsApp)
    if (!$('.menu-cta', menu)) {
      const li = document.createElement('li');
      li.className = 'menu-cta';
      li.innerHTML =
        '<a class="btn btn-primary" href="contact.html#devis"><i class="ic ic-file-invoice fa-file-invoice" aria-hidden="true"></i>Demander un devis</a>' +
        '<div class="menu-cta-row">' +
        '<a class="btn btn-ghost" href="tel:+23566706004"><i class="ic ic-phone fa-phone" aria-hidden="true"></i>Appeler</a>' +
        '<a class="btn btn-ghost" href="https://wa.me/23566706004" target="_blank" rel="noopener"><i class="ic ic-whatsapp fa-whatsapp" aria-hidden="true"></i>WhatsApp</a>' +
        '</div>';
      menu.appendChild(li);
    }

    const isOpen = () => burger.classList.contains('open');
    const syncInert = () => {
      const hidden = mobileMQ.matches && !isOpen();
      if ('inert' in menu) menu.inert = hidden;
      if (hidden) menu.setAttribute('aria-hidden', 'true'); else menu.removeAttribute('aria-hidden');
    };
    const setLabel = () => burger.setAttribute('aria-label', isOpen() ? 'Fermer le menu' : 'Ouvrir le menu');

    const openMenu = () => {
      menu.style.top = '';
      nav.classList.remove('nav-hidden');
      burger.classList.add('open'); menu.classList.add('open');
      burger.setAttribute('aria-expanded', 'true');
      root.classList.add('menu-open');
      nav.classList.remove('nav-hidden');
      syncInert(); setLabel();
      requestAnimationFrame(() => menu.querySelector('a, button')?.focus({ preventScroll: true }));
    };
    const closeMenu = (restoreFocus = false) => {
      if (!isOpen() && !menu.classList.contains('open')) { syncInert(); return; }
      burger.classList.remove('open'); menu.classList.remove('open');
      menu.style.top = '';
      burger.setAttribute('aria-expanded', 'false');
      root.classList.remove('menu-open');
      closeAllDropdowns();
      syncInert(); setLabel();
      if (restoreFocus) burger.focus({ preventScroll: true });
    };

    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-controls', menu.id || 'menu');
    burger.type = 'button';
    burger.addEventListener('click', () => (isOpen() ? closeMenu(true) : openMenu()));
    menu.addEventListener('click', e => { if (e.target.closest('a[href]')) closeMenu(false); });
    menu.addEventListener('click', e => { if (e.target === menu && isOpen()) closeMenu(true); });
    // Fermeture fiable : toucher hors panneau, Escape et changement de viewport.
    document.addEventListener('pointerdown', e => { if (isOpen() && !nav.contains(e.target)) closeMenu(false); }, { passive:true });
    document.addEventListener('keydown', e => {
      if (!isOpen()) return;
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); return; }
      // Focus trap : le focus reste dans le panneau tant que le menu est ouvert.
      if (e.key === 'Tab') {
        const focusables = $$('.nav-links a[href], .nav-links button:not([disabled]), .burger').filter(el => el.getClientRects().length && !el.closest('[hidden]'));
        if (!focusables.length) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && (document.activeElement === first || !menu.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || !menu.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
      }
    });
    const resetMenuViewport = () => {
      if (isOpen()) {
        nav.classList.remove('nav-hidden');
        menu.style.top = '';
        menu.style.maxHeight = '';
      }
    };
    addEventListener('orientationchange', resetMenuViewport, { passive: true });
    addEventListener('resize', () => { if (!mobileMQ.matches) closeMenu(false); else resetMenuViewport(); }, { passive: true });
    mobileMQ.addEventListener?.('change', () => { closeMenu(false); syncInert(); });
    syncInert(); setLabel();

    // Piège de focus pendant que le menu est ouvert
    document.addEventListener('keydown', e => {
      if (e.key !== 'Tab' || !isOpen()) return;
      const items = $$('a[href], button:not([disabled])', nav).filter(el => !el.closest('[aria-hidden="true"]') && el.getClientRects().length > 0);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // Glisser vers le haut sur le menu = fermer (geste tactile)
    let ty = null;
    menu.addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, { passive: true });
    menu.addEventListener('touchend', e => {
      if (ty === null) return;
      const dy = e.changedTouches[0].clientY - ty; ty = null;
      if (dy < -90 && menu.scrollTop <= 0) closeMenu(true);
    }, { passive: true });

    window.__hayataCloseMenu = closeMenu;
  }

  /* ---------- Navigation : sous-menus (clavier + tactile) ---------- */
  dds.forEach((dd, i) => {
    const btn = $('.dd-btn', dd), panel = $('.dd-menu', dd);
    if (!btn || !panel) return;
    btn.type = 'button';
    panel.id = panel.id || 'dd-menu-' + i;
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-controls', panel.id);
    btn.setAttribute('aria-expanded', 'false');
    const items = () => $$('a', panel);
    // Le sous-menu apparaît avec une transition CSS : on réessaie le focus jusqu'à ce qu'il soit réellement visible
    const focusItem = pick => {
      let tries = 0;
      const attempt = () => {
        const el = pick(items()); el?.focus({ preventScroll: true });
        if (el && document.activeElement !== el && ++tries < 25) setTimeout(attempt, 40);
      };
      setTimeout(attempt, 30);
    };
    const open = (focusPick) => {
      closeAllDropdowns(dd);
      dd.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
      if (focusPick) focusItem(focusPick);
    };
    const close = (refocus) => {
      dd.classList.remove('open'); btn.setAttribute('aria-expanded', 'false');
      if (refocus) btn.focus();
    };
    btn.addEventListener('click', e => { e.preventDefault(); dd.classList.contains('open') ? close(false) : open(false); });
    btn.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); open(l => l[0]); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); open(l => l[l.length - 1]); }
    });
    panel.addEventListener('keydown', e => {
      const l = items(), i2 = l.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); l[(i2 + 1) % l.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); l[(i2 - 1 + l.length) % l.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); l[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); l[l.length - 1].focus(); }
      else if (e.key === 'Escape') { e.stopPropagation(); close(true); }
    });
  });
  document.addEventListener('click', e => { if (!e.target.closest('.has-dd')) closeAllDropdowns(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (root.classList.contains('menu-open')) window.__hayataCloseMenu?.(true);
    closeAllDropdowns();
  });

  /* ---------- Barre de navigation : se masque en descendant (mobile), réapparaît en remontant ---------- */
  if (nav) {
    let lastY = scrollY, tick = false;
    const onScroll = () => {
      const y = scrollY, dy = y - lastY;
      if (mobileMQ.matches && !root.classList.contains('menu-open') && !nav.contains(document.activeElement)) {
        if (dy > 8 && y > 140) nav.classList.add('nav-hidden');
        else if (dy < -6 || y < 60) nav.classList.remove('nav-hidden');
      } else nav.classList.remove('nav-hidden');
      lastY = y; tick = false;
    };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
    nav.addEventListener('focusin', () => nav.classList.remove('nav-hidden'));
  }

  /* ---------- Dock mobile : barre de devis + WhatsApp + haut de page ---------- */
  const qbar = $('.mobile-quote-bar');
  if (qbar) {
    root.classList.add('has-qbar');
    qbar.setAttribute('role', 'region');
    const hiders = new Set();
    const setDock = () => {
      const visible = !qbar.classList.contains('is-hidden') && getComputedStyle(qbar).display !== 'none';
      root.style.setProperty('--dock', visible ? qbar.offsetHeight + 'px' : '0px');
    };
    const refresh = () => {
      const hide = hiders.size > 0 || root.classList.contains('menu-open');
      qbar.classList.toggle('is-hidden', hide);
      setDock();
    };
    // Masquer quand un appel à l'action, le formulaire ou le pied de page sont à l'écran (évite la redondance)
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => {
        es.forEach(e => (e.isIntersecting ? hiders.add(e.target) : hiders.delete(e.target)));
        refresh();
      }, { threshold: .15 });
      $$('.cta, footer, .formbox, .hero .hero-btns').forEach(el => io.observe(el));
    }
    // Masquer quand le clavier virtuel est ouvert
    if (window.visualViewport) {
      const vv = visualViewport;
      vv.addEventListener('resize', () => {
        if (vv.height < innerHeight * .75) hiders.add('kb'); else hiders.delete('kb');
        refresh();
      });
    }
    new MutationObserver(refresh).observe(root, { attributes: true, attributeFilter: ['class'] });
    addEventListener('resize', setDock); mobileMQ.addEventListener?.('change', setDock);
    refresh();
  }

  /* ---------- Focus accessible sur une ancre ---------- */
  const focusTarget = (el) => {
    if (!el) return;
    if (!el.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  };

  /* ---------- Onglets de contact (ARIA complet + clavier + #devis) ---------- */
  const tabs = $$('.tab[data-tab]');
  const panels = $$('[data-panel]');
  const selectTab = (name, { focus = false, scroll = false } = {}) => {
    const tab = tabs.find(t => t.dataset.tab === name);
    if (!tab) return false;
    tabs.forEach(t => {
      const on = t === tab;
      t.classList.toggle('on', on); t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(p => p.classList.toggle('hidden', p.dataset.panel !== name));
    if (focus) tab.focus();
    if (scroll) $('#devis')?.scrollIntoView({ behavior: reduceMQ.matches ? 'auto' : 'smooth', block: 'start' });
    return true;
  };
  if (tabs.length) {
    const list = tabs[0].closest('[role="tablist"]');
    list?.setAttribute('aria-label', 'Type de demande');
    tabs.forEach(t => {
      t.type = 'button';
      t.id = t.id || 'tab-' + t.dataset.tab;
      const p = panels.find(x => x.dataset.panel === t.dataset.tab);
      if (p) { p.id = p.id || 'panel-' + t.dataset.tab; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', t.id); t.setAttribute('aria-controls', p.id); }
      t.addEventListener('click', () => selectTab(t.dataset.tab));
      t.addEventListener('keydown', e => {
        const i = tabs.indexOf(t); let n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); selectTab(tabs[n].dataset.tab, { focus: true }); }
      });
    });
    if (location.hash === '#devis') {
      selectTab('devis');
      setTimeout(() => $('[data-panel="devis"] input, [data-panel="devis"] select')?.focus({ preventScroll: true }), 350);
    } else selectTab(tabs.find(t => t.classList.contains('on'))?.dataset.tab || tabs[0].dataset.tab);
    addEventListener('hashchange', () => { if (location.hash === '#devis') selectTab('devis', { scroll: true }); });
    // Un lien « devis » cliqué depuis la page contact ouvre l'onglet devis même si le hash ne change pas
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href$="#devis"]');
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname) return;
      e.preventDefault(); history.replaceState(null, '', '#devis'); selectTab('devis', { scroll: true });
      setTimeout(() => $('[data-panel="devis"] input')?.focus({ preventScroll: true }), 450);
    });
  } else if (location.hash.length > 1) {
    setTimeout(() => focusTarget(document.getElementById(decodeURIComponent(location.hash.slice(1)))), 400);
  }

  /* ---------- Formulaires : attributs mobiles, validation claire, brouillon, anti-spam ---------- */
  const AUTOFILL = { nom: 'name', email: 'email', telephone: 'tel', sujet: 'off', projet: 'off', message: 'off' };
  const messages = {
    valueMissing: 'Ce champ est obligatoire.',
    typeMismatch: 'Vérifiez le format (exemple : nom@exemple.com).',
    patternMismatch: 'Le format saisi n’est pas valide.',
    tooShort: 'Le texte est trop court.',
    tooLong: 'Le texte est trop long.'
  };
  const fieldMsg = el => {
    const v = el.validity;
    if (v.valueMissing) return el.tagName === 'SELECT' ? 'Choisissez une option.' : messages.valueMissing;
    for (const k of ['typeMismatch', 'patternMismatch', 'tooShort', 'tooLong']) if (v[k]) return messages[k];
    return el.validationMessage || 'Valeur non valide.';
  };
  const setError = (el, msg) => {
    const host = el.closest('label') || el.parentElement;
    let err = host.querySelector('.field-error[data-for="' + el.name + '"]');
    if (!msg) {
      el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); err?.remove(); return;
    }
    if (!err) {
      err = document.createElement('span'); err.className = 'field-error'; err.dataset.for = el.name;
      err.id = 'err-' + (el.form?.dataset.mail || 'f') + '-' + el.name;
      host.appendChild(err);
    }
    err.textContent = msg; el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', err.id);
  };

  const draftKey = f => 'ht_draft_' + (f.dataset.mail || 'form');
  const saveDraft = f => {
    try {
      const data = {};
      $$('input[name],select[name],textarea[name]', f).forEach(el => { if (el.name !== 'website' && el.value) data[el.name] = el.value; });
      Object.keys(data).length ? sessionStorage.setItem(draftKey(f), JSON.stringify(data)) : sessionStorage.removeItem(draftKey(f));
    } catch (e) { /* stockage indisponible : ignoré */ }
  };
  const restoreDraft = f => {
    try {
      const raw = sessionStorage.getItem(draftKey(f)); if (!raw) return false;
      const data = JSON.parse(raw); let n = 0;
      Object.entries(data).forEach(([k, v]) => { const el = f.elements[k]; if (el && !el.value) { el.value = v; n++; } });
      return n > 0;
    } catch (e) { return false; }
  };

  $$('form[data-mail]').forEach(f => {
    f.setAttribute('novalidate', '');
    $$('input,select,textarea', f).forEach(el => {
      if (!el.autocomplete && AUTOFILL[el.name]) el.autocomplete = AUTOFILL[el.name];
      if (el.name === 'nom' && f.dataset.mail === 'devis') el.autocomplete = 'organization';
      if (el.type === 'tel') { el.inputMode = 'tel'; }
      if (el.type === 'email') { el.inputMode = 'email'; el.autocapitalize = 'none'; el.spellcheck = false; }
      if (el.tagName === 'INPUT') el.setAttribute('enterkeyhint', 'next');
    });
    // Champ piège (invisible pour les humains)
    if (!f.elements.website) {
      const hp = document.createElement('div'); hp.className = 'hp'; hp.setAttribute('aria-hidden', 'true');
      hp.innerHTML = '<label>Ne pas remplir<input type="text" name="website" tabindex="-1" autocomplete="off"></label>';
      f.appendChild(hp);
    }
    if (restoreDraft(f)) toast('Votre brouillon a été restauré.', 'info');
    f.addEventListener('input', e => {
      saveDraft(f);
      if (e.target.getAttribute('aria-invalid') === 'true' && e.target.checkValidity()) setError(e.target, '');
    });
    f.addEventListener('focusout', e => {
      const el = e.target;
      if (el.matches && el.matches('input[name],select[name],textarea[name]') && el.name !== 'website' && (el.value || el.getAttribute('aria-invalid'))) {
        setError(el, el.checkValidity() ? '' : fieldMsg(el));
      }
    });
  });

  window.HayataUX = {
    validate(f) {
      let first = null;
      $$('input[name],select[name],textarea[name]', f).forEach(el => {
        if (el.name === 'website') return;
        const ok = el.checkValidity(); setError(el, ok ? '' : fieldMsg(el)); if (!ok && !first) first = el;
      });
      if (first) {
        first.focus({ preventScroll: true });
        first.scrollIntoView({ behavior: reduceMQ.matches ? 'auto' : 'smooth', block: 'center' });
        toast('Merci de corriger les champs signalés.', 'error');
        return false;
      }
      return true;
    },
    clearDraft(f) { try { sessionStorage.removeItem(draftKey(f)); } catch (e) { /* ignoré */ } },
    toast
  };

  /* ---------- Copier les coordonnées (utile sur ordinateur) ---------- */
  const copyText = async txt => {
    try { await navigator.clipboard.writeText(txt); return true; }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = txt; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta);
      ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (_) { /* ignoré */ } ta.remove(); return ok;
    }
  };
  $$('.info-row a[href^="mailto:"], .info-row a[href^="tel:"]').forEach(a => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'copy-btn';
    const val = a.textContent.trim();
    b.setAttribute('aria-label', 'Copier ' + val);
    b.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copier</span>';
    b.addEventListener('click', async () => {
      const ok = await copyText(val);
      toast(ok ? val + ' copié.' : 'Copie impossible : sélectionnez le texte manuellement.', ok ? 'success' : 'error', 2600);
    });
    a.after(b);
  });

  /* ---------- Chiffres clés : compteur animé (texte final strictement identique) ---------- */
  const counters = $$('.impact-card > strong');
  if (counters.length && 'IntersectionObserver' in window) {
    counters.forEach(el => {
      const final = el.textContent.trim();
      const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = final;
      const vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true'); vis.textContent = final;
      el.textContent = ''; el.append(vis, sr); el._vis = vis; el._final = final;
    });
    if (!reduceMQ.matches && !lite) {
      const co = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        const el = e.target, m = el._final.match(/^(\d+(?:[.,]\d+)?)(.*)$/);
        if (!m) return;
        const sep = m[1].includes(',') ? ',' : '.', dec = (m[1].split(/[.,]/)[1] || '').length, end = parseFloat(m[1].replace(',', '.')), suf = m[2];
        const t0 = performance.now(), dur = 1300;
        const step = t => {
          const p = Math.min((t - t0) / dur, 1), v = end * (1 - Math.pow(1 - p, 3));
          el._vis.textContent = v.toFixed(dec).replace('.', sep) + suf;
          if (p < 1) requestAnimationFrame(step); else el._vis.textContent = el._final;
        };
        requestAnimationFrame(step);
      }), { threshold: .6 });
      counters.forEach(el => { el._vis.textContent = el._final.replace(/^\d+(?:[.,]\d+)?/, '0'); co.observe(el); });
    }
  }

  /* ---------- Pause des animations continues (WCAG 2.2.2) ----------
     Un seul contrôle par page, intégré dans le bandeau défilant (et non plus flottant sous celui-ci). */
  const movers = $$('.marquee, .ticker');
  if (movers.length && !lite) {
    const box = movers[0];
    const wrap = document.createElement('div'); wrap.className = 'motion-wrap';
    box.parentNode.insertBefore(wrap, box); wrap.appendChild(box);
    const ICON_PAUSE = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true" focusable="false"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>';
    const ICON_PLAY = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true" focusable="false"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';
    const b = document.createElement('button'); b.type = 'button'; b.className = 'motion-toggle';
    b._paint = () => {
      const p = root.classList.contains('motion-paused');
      b.setAttribute('aria-pressed', String(p));
      b.setAttribute('aria-label', p ? 'Reprendre les animations' : 'Mettre en pause les animations');
      b.setAttribute('title', p ? 'Reprendre les animations' : 'Mettre en pause les animations');
      b.innerHTML = p ? ICON_PLAY : ICON_PAUSE;
    };
    b.addEventListener('click', () => { root.classList.toggle('motion-paused'); b._paint(); });
    b._paint(); wrap.appendChild(b);
  }

  /* ---------- Connexion : informer sans bloquer ---------- */
  addEventListener('offline', () => toast('Vous êtes hors ligne. La navigation reste possible, l’envoi nécessite une connexion.', 'error', 5200));
  addEventListener('online', () => toast('Connexion rétablie.', 'success', 2600));

  /* ---------- Préchargement des pages au survol / appui (désactivé en mode économie de données) ---------- */
  if (!lite && /^https?:$/.test(location.protocol)) {
    const seen = new Set();
    const prefetch = a => {
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || !/\.html$/.test(u.pathname) || u.pathname === location.pathname || seen.has(u.pathname)) return;
      seen.add(u.pathname);
      const l = document.createElement('link'); l.rel = 'prefetch'; l.href = u.pathname; document.head.appendChild(l);
    };
    let timer;
    document.addEventListener('pointerover', e => { const a = e.target.closest && e.target.closest('a[href]'); if (!a) return; clearTimeout(timer); timer = setTimeout(() => prefetch(a), 80); }, { passive: true });
    document.addEventListener('touchstart', e => { const a = e.target.closest && e.target.closest('a[href]'); if (a) prefetch(a); }, { passive: true });
  }

  /* ---------- Retour en haut : respecte « mouvement réduit » ---------- */
  const topBtn = $('#toTop');
  if (topBtn) {
    topBtn.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMQ.matches ? 'auto' : 'smooth' }));
    if (!topBtn.getAttribute('aria-label')) topBtn.setAttribute('aria-label', 'Retour en haut de page');
  }

  /* ---------- Service worker (hors-ligne) : seulement en HTTPS ---------- */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* ignoré */ }));
  }
})();
