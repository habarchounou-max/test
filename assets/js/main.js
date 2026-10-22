/* Hayata Technology — interactions */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* Nav: scroll state, burger, dropdowns */
  const nav = $('.nav'), burger = $('.burger'), links = $('.nav-links');
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav?.classList.toggle('scrolled', y > 20);
    if ($('#progress')) $('#progress').style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    $('#toTop')?.classList.toggle('show', y > 600);
  };
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); } }, { passive: true });
  addEventListener('resize', onScroll, { passive: true }); onScroll();
  /* Menu mobile, sous-menus et clavier : voir assets/js/v6-experience.js (module unique) */
  /* Retour en haut : géré dans v6-experience.js */

  /* Reveal on scroll */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    $$('.rv').forEach(el => io.observe(el));
  } else $$('.rv').forEach(el => el.classList.add('in'));

  /* Counters */
  const co = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; co.unobserve(e.target);
    const el = e.target, end = +el.dataset.n, suf = el.dataset.s || '', t0 = performance.now(), dur = 1600;
    const tick = t => { const p = Math.min((t - t0) / dur, 1), v = Math.round(end * (1 - Math.pow(1 - p, 3))); el.textContent = v + suf; if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  $$('[data-n]').forEach(el => co.observe(el));

  /* Cursor glow (desktop only) */
  const glow = $('#cursorGlow');
  if (glow && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    addEventListener('mousemove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; }, { passive: true });
  } else glow?.remove();

  /* Tilt on cards */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
    $$('.tilt').forEach(c => {
      c.addEventListener('mousemove', e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        c.style.transform = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg) translateY(-6px)`;
      });
      c.addEventListener('mouseleave', () => c.style.transform = '');
    });
  }

  /* Holographic logo tilt */
  $$('.holo').forEach(h => {
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    h.addEventListener('mousemove', e => { const r = h.getBoundingClientRect(); h.style.transform = `perspective(1000px) rotateY(${(e.clientX - r.left - r.width / 2) / 10}deg) rotateX(${-(e.clientY - r.top - r.height / 2) / 10}deg)`; });
    h.addEventListener('mouseleave', () => h.style.transform = '');
  });

  /* Contact tabs + forms: honest status, no false success on mailto/network errors */
  $$('form[data-mail]').forEach(f => f.addEventListener('submit', async e => {
    e.preventDefault();
    if (f.dataset.submitting === 'true') return;
    if (window.HayataUX && !window.HayataUX.validate(f)) return;
    if (!window.HayataUX && !f.reportValidity()) return;
    if (f.querySelector('[name="website"]')?.value) return; /* anti-spam : champ piège rempli */
    const data = Object.fromEntries(new FormData(f)); delete data.website;
    const kind = f.dataset.mail;
    const subject = (kind === 'devis' ? 'Demande de devis — ' : 'Contact — ') + (data.service || data.sujet || data.nom || '');
    const body = Object.entries(data).map(([key, value]) => `${key}: ${value}`).join('\n');
    const panel = f.parentElement;
    const status = $('.ok', panel);
    const submit = $('button[type="submit"]', f);
    const endpoint = typeof window.HAYATA_FORM_ENDPOINT === 'string' ? window.HAYATA_FORM_ENDPOINT.trim() : '';
    const setStatus = (message, isError = false) => {
      if (!status) return;
      status.textContent = message;
      status.classList.remove('hidden');
      status.setAttribute('role', isError ? 'alert' : 'status'); status.setAttribute('tabindex', '-1');
      status.classList.toggle('is-error', isError);
    };
    f.dataset.submitting = 'true';
    if (submit) { submit.disabled = true; submit.setAttribute('aria-busy', 'true'); }
    if (status) status.classList.add('hidden');
    try {
      if (endpoint) {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!navigator.onLine) throw new Error('offline');
        if (!response.ok) throw new Error('endpoint');
        setStatus('Votre demande a été transmise. Merci de nous avoir contactés.');
        f.reset(); window.HayataUX?.clearDraft(f);
      } else {
        const mailto = `mailto:contact@hayatatech.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setStatus('Votre application de messagerie va s’ouvrir. Vérifiez le message puis envoyez-le pour finaliser la demande.');
        window.location.href = mailto;
      }
    } catch (error) {
      setStatus('La transmission automatique a échoué. Réessayez plus tard ou écrivez directement à contact@hayatatech.com.', true);
    } finally {
      delete f.dataset.submitting;
      if (submit) { submit.disabled = false; submit.removeAttribute('aria-busy'); }
      status?.focus?.({ preventScroll: false });
    }
  }));

  /* Network canvas background (low-poly constellation), suspended in hidden tabs */
  const cv = $('#bg-canvas');
  if (cv && !window.HAYATA_LITE && !matchMedia('(prefers-reduced-motion:reduce)').matches && !matchMedia('(max-width:760px), (pointer:coarse)').matches) {
    const ctx = cv.getContext('2d'); let W, H, pts = [], dpr = Math.min(devicePixelRatio || 1, 2), mouse = { x: -999, y: -999 };
    const size = () => {
      W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr;
      cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
      const n = Math.min(Math.floor(innerWidth * innerHeight / 17000), 90);
      pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35 * dpr, vy: (Math.random() - .5) * .35 * dpr }));
    };
    size(); let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(size, 200); });
    addEventListener('mousemove', e => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; }, { passive: true });
    const maxD = 150 * dpr;
    (function draw() {
      if (document.hidden) { setTimeout(() => requestAnimationFrame(draw), 400); return; }
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.6 * dpr, 0, 6.283); ctx.fillStyle = 'rgba(34,211,238,.85)'; ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < maxD) { ctx.strokeStyle = `rgba(56,150,255,${(1 - d / maxD) * .45})`; ctx.lineWidth = dpr * .8; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      for (const p of pts) { const d = Math.hypot(p.x - mouse.x, p.y - mouse.y); if (d < 180 * dpr) { ctx.strokeStyle = `rgba(139,92,246,${(1 - d / (180 * dpr)) * .7})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); } }
      requestAnimationFrame(draw);
    })();
  }

  /* Duplicate marquee track and service ticker for seamless loop */
  $$('.track, .tk').forEach(t => {
    [...t.children].forEach(n => {
      const c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('img').forEach(i => { i.alt = ''; i.removeAttribute('loading'); });
      c.querySelectorAll('[title]').forEach(x => x.removeAttribute('title'));
      t.appendChild(c);
    });
  });
})();


/* =====================================================================
   NIVEAU 2027
   ===================================================================== */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* Preloader (une fois par session) */
  const pre = $('#pre');
  if (pre) {
    let seen = false; try { seen = sessionStorage.getItem('ht_pre'); } catch (e) {}
    if (seen || reduce) pre.remove();
    else {
      const hide = () => { pre.classList.add('done'); setTimeout(() => pre.remove(), 800); try { sessionStorage.setItem('ht_pre', '1'); } catch (e) {} };
      const t0 = performance.now();
      const go = () => setTimeout(hide, Math.max(0, 1500 - (performance.now() - t0)));
      document.readyState === 'complete' ? go() : addEventListener('load', go);
    }
  }

  /* Split words reveal */
  const split = el => {
    let i = 0;
    const walk = n => {
      [...n.childNodes].forEach(c => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(t => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.append(' '); return; }
            const w = document.createElement('span'); w.className = 'w';
            const s = document.createElement('span'); s.style.setProperty('--i', i++); s.textContent = t; w.append(s); frag.append(w);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1 && !c.classList.contains('w')) walk(c);
      });
    };
    walk(el); el.setAttribute('aria-label', el.textContent);
  };
  const sws = $$('.s-head h2,.page-hero h1,.hero h1,.cta h2,.split>div>h2');
  sws.forEach(el => { el.classList.add('sw'); split(el); });
  const so = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); so.unobserve(e.target); } }), { threshold: .2 });
  sws.forEach(el => so.observe(el));

  /* Rotating typewriter word */
  const rw = $('.rw');
  if (rw) {
    const words = rw.dataset.words.split('|'); let wi = 0, ci = 0, del = false;
    if (reduce) rw.textContent = words[0];
    else (function tick() {
      const w = words[wi];
      rw.textContent = w.slice(0, ci);
      if (!del && ci < w.length) { ci++; setTimeout(tick, 85); }
      else if (!del) { del = true; setTimeout(tick, 1600); }
      else if (ci > 0) { ci--; setTimeout(tick, 40); }
      else { del = false; wi = (wi + 1) % words.length; setTimeout(tick, 250); }
    })();
  }

  /* Spotlight cards */
  $$('.glass').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  /* Magnetic buttons */
  if (fine && !reduce) $$('.btn-primary,.btn-ghost,.socials a').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px,${(e.clientY - r.top - r.height / 2) * .32}px)`; });
    b.addEventListener('pointerleave', () => b.style.transform = '');
  });

  /* Custom cursor */
  if (false && fine && !reduce) {
    const a = $('#cur'), b = $('#cur2'); let x = 0, y = 0, bx = 0, by = 0;
    if (a && b) {
      document.body.classList.add('has-cur');
      addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; a.style.transform = `translate(${x}px,${y}px)`; }, { passive: true });
      (function loop() { bx += (x - bx) * .16; by += (y - by) * .16; b.style.transform = `translate(${bx}px,${by}px)`; requestAnimationFrame(loop); })();
      document.addEventListener('pointerover', e => b.classList.toggle('hot', !!e.target.closest('a,button,.glass,input,select,textarea')));
    }
  }

  /* Parallax aurora */
  const au = $('.aurora');
  if (au && !reduce) addEventListener('scroll', () => { au.style.transform = `translateY(${scrollY * -.08}px)`; }, { passive: true });

  /* Globe */
  const gc = window.HAYATA_LITE ? null : $('#globe');
  if (gc) {
    const ctx = gc.getContext('2d'); let S, dpr = Math.min(devicePixelRatio || 1, 2), rot = 0, drag = false, lx = 0, vel = 0, visible = true, t = 0;
    const size = () => { const r = gc.getBoundingClientRect(); S = gc.width = gc.height = Math.round(r.width * dpr); };
    size(); let gz; addEventListener('resize', () => { clearTimeout(gz); gz = setTimeout(size, 200); });
    new IntersectionObserver(e => visible = e[0].isIntersecting).observe(gc);
    const rad = d => d * Math.PI / 180;
    const vec = (lat, lon) => [Math.cos(rad(lat)) * Math.sin(rad(lon)), Math.sin(rad(lat)), Math.cos(rad(lat)) * Math.cos(rad(lon))];
    const dots = []; const N = 1100;
    for (let i = 0; i < N; i++) { const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = Math.PI * (3 - Math.sqrt(5)) * i; dots.push([Math.cos(th) * r, y, Math.sin(th) * r]); }
    const HQ = vec(12.13, 15.05);
    const dest = [[48.85, 2.35], [14.7, -17.4], [-1.29, 36.82], [25.2, 55.3], [40.7, -74], [5.6, -0.19], [-26.2, 28.05], [51.5, -0.12], [35.7, 139.7], [-23.5, -46.6]].map(([a, b]) => vec(a, b));
    const tilt = rad(-14);
    const rotY = (v, a) => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
    const rotX = (v, a) => [v[0], v[1] * Math.cos(a) - v[2] * Math.sin(a), v[1] * Math.sin(a) + v[2] * Math.cos(a)];
    const tf = v => rotX(rotY(v, rot), tilt);
    const slerp = (a, b, k) => { const d = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])), om = Math.acos(d), so = Math.sin(om) || 1; const s1 = Math.sin((1 - k) * om) / so, s2 = Math.sin(k * om) / so; return [a[0] * s1 + b[0] * s2, a[1] * s1 + b[1] * s2, a[2] * s1 + b[2] * s2]; };
    rot = -rad(15.05);
    gc.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; gc.setPointerCapture(e.pointerId); });
    gc.addEventListener('pointermove', e => { if (drag) { vel = (e.clientX - lx) * .006; rot += vel; lx = e.clientX; } });
    gc.addEventListener('pointerup', () => drag = false); gc.addEventListener('pointercancel', () => drag = false);
    (function draw() {
      requestAnimationFrame(draw); if (!visible || document.hidden) return;
      t += .016; if (!drag) { vel *= .95; rot += reduce ? 0 : .0035 + vel; }
      ctx.clearRect(0, 0, S, S); const R = S * .42, c = S / 2;
      for (const d of dots) { const p = tf(d); if (p[2] < -.05) continue; const a = .15 + .75 * Math.max(0, p[2]); ctx.fillStyle = `rgba(56,189,248,${a})`; ctx.fillRect(c + p[0] * R, c - p[1] * R, 1.6 * dpr, 1.6 * dpr); }
      dest.forEach((dv, i) => {
        ctx.beginPath(); let started = false;
        for (let k = 0; k <= 40; k++) { const u = k / 40, v = slerp(HQ, dv, u), h = 1 + .22 * Math.sin(Math.PI * u), q = tf([v[0] * h, v[1] * h, v[2] * h]); if (q[2] < -.1) { started = false; continue; } const X = c + q[0] * R, Y = c - q[1] * R; started ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); started = true; }
        ctx.strokeStyle = 'rgba(0,242,254,.5)'; ctx.lineWidth = 1.2 * dpr; ctx.stroke();
        const ph = (t * .35 + i * .13) % 1, v = slerp(HQ, dv, ph), h = 1 + .22 * Math.sin(Math.PI * ph), q = tf([v[0] * h, v[1] * h, v[2] * h]);
        if (q[2] > -.1) { ctx.beginPath(); ctx.arc(c + q[0] * R, c - q[1] * R, 2.4 * dpr, 0, 7); ctx.fillStyle = '#fff'; ctx.shadowColor = '#00F2FE'; ctx.shadowBlur = 12 * dpr; ctx.fill(); ctx.shadowBlur = 0; }
        const e = tf(dv); if (e[2] > 0) { ctx.beginPath(); ctx.arc(c + e[0] * R, c - e[1] * R, 3 * dpr, 0, 7); ctx.fillStyle = '#818cf8'; ctx.fill(); }
      });
      const h = tf(HQ); if (h[2] > -.1) { const X = c + h[0] * R, Y = c - h[1] * R, pr = (t % 1.6) / 1.6; ctx.beginPath(); ctx.arc(X, Y, (6 + pr * 30) * dpr, 0, 7); ctx.strokeStyle = `rgba(0,242,254,${1 - pr})`; ctx.lineWidth = 2 * dpr; ctx.stroke(); ctx.beginPath(); ctx.arc(X, Y, 6 * dpr, 0, 7); ctx.fillStyle = '#00F2FE'; ctx.shadowColor = '#00F2FE'; ctx.shadowBlur = 20 * dpr; ctx.fill(); ctx.shadowBlur = 0; }
    })();
  }

  /* Formulaires : endpoint optionnel (Formspree, Web3Forms...) sinon mailto */
  window.HAYATA_FORM_ENDPOINT = window.HAYATA_FORM_ENDPOINT || '';
})();
