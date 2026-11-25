(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ----- scroll progress -----
  const bar = $('.progress span');
  if (bar) {
    let ticking = false;
    const set = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty('--p', h > 0 ? Math.min(1, scrollY / h) : 0);
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(set); } }, { passive: true });
    set();
  }

  // ----- reveal on scroll (staggered per parent) -----
  const reveals = $$('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const sibs = $$(':scope > .reveal', e.target.parentElement);
        e.target.style.setProperty('--d', `${Math.max(0, sibs.indexOf(e.target)) * 45}ms`);
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  }

  // ----- number helpers -----
  const fmt = (v) => {
    const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return v < 0 ? `(${s})` : s;
  };
  // rAF-driven ease-out; a timer guarantees the final state even when frames are throttled (hidden tab)
  const tween = (dur, fn, done) => {
    const t0 = performance.now();
    let finished = false;
    const finish = () => { if (finished) return; finished = true; fn(1); if (done) done(); };
    const step = (t) => {
      if (finished) return;
      const k = Math.min(1, (t - t0) / dur);
      if (k >= 1) return finish();
      fn(1 - Math.pow(1 - k, 3));
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    setTimeout(finish, dur + 120);
  };

  // ----- hero ledger: rows tick in, Odoo column counts up, difference falls to zero -----
  const ledger = $('[data-ledger]');
  if (ledger) {
    const finish = () => ledger.classList.add('is-run', 'is-stamped', 'is-done');
    if (reduce) finish();
    else {
      const cells = $$('[data-to]', ledger);
      const diff = $('[data-diff]', ledger);
      const total = cells.reduce((a, c) => a + Math.abs(+c.dataset.to), 0);
      cells.forEach((c) => { c.textContent = fmt(0); });
      diff.textContent = fmt(total);
      diff.style.color = 'var(--warn)';
      const run = () => {
        ledger.classList.add('is-run');
        let remaining = total;
        cells.forEach((c, i) => {
          const to = +c.dataset.to;
          setTimeout(() => {
            tween(700, (k) => { c.textContent = fmt(to * k); });
            const start = remaining; remaining -= Math.abs(to);
            const end = remaining;
            tween(700, (k) => { diff.textContent = fmt(start + (end - start) * k); }, () => {
              if (i === cells.length - 1) {
                diff.textContent = '0.00'; diff.style.color = '';
                setTimeout(() => ledger.classList.add('is-stamped', 'is-done'), 160);
              }
            });
          }, i * 260 + 120);
        });
      };
      const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); setTimeout(run, 350); } }, { threshold: 0.35 });
      io.observe(ledger);
    }
  }

  // ----- stat count-up -----
  const counts = $$('[data-count]');
  if (counts.length && !reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target; const to = +el.dataset.count;
        io.unobserve(el);
        tween(1100, (k) => { el.textContent = Math.round(to * k); });
      });
    }, { threshold: 0.6 });
    counts.forEach((el) => { el.textContent = '0'; io.observe(el); });
  }

  // ----- marquee pause control -----
  const mq = $('[data-marquee]');
  if (mq) {
    const btn = $('.marquee-toggle', mq);
    btn.addEventListener('click', () => {
      const paused = mq.classList.toggle('is-paused');
      btn.setAttribute('aria-pressed', String(paused));
      btn.setAttribute('aria-label', paused ? 'Play the scrolling platform list' : 'Pause the scrolling platform list');
    });
    // pause while off screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { mq.querySelector('.marquee-track').style.animationPlayState = es[0].isIntersecting ? '' : 'paused'; }).observe(mq);
    }
  }

  // ----- work filters -----
  const grid = $('[data-works]');
  if (grid) {
    const status = $('[data-filter-status]');
    $$('.filter').forEach((b) => b.addEventListener('click', () => {
      $$('.filter').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const f = b.dataset.filter; let n = 0;
      $$('.work', grid).forEach((w) => {
        const show = f === 'all' || w.dataset.group === f;
        w.hidden = !show; if (show) { n++; w.classList.add('is-in'); }
      });
      status.textContent = f === 'all' ? '' : `Showing ${n} of 6 case studies.`;
    }));
  }

  // ----- nav scroll spy (home page) -----
  const spy = $$('[data-section]');
  const navLinks = $$('.pill a[data-nav]');
  if (spy.length && document.body.classList.contains('page-home')) {
    const setActive = (k) => navLinks.forEach((a) => {
      if (a.dataset.nav === k) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) setActive(e.target.dataset.section); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spy.forEach((s) => io.observe(s));
    const contact = $('#contact');
    if (contact) new IntersectionObserver((es) => { if (es[0].isIntersecting) setActive('contact'); }, { rootMargin: '-45% 0px -50% 0px' }).observe(contact);
  }

  // ----- case page: table of contents spy -----
  const tocLinks = $$('[data-toc-link]');
  if (tocLinks.length) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        tocLinks.forEach((a) => a.setAttribute('aria-current', String(a.dataset.tocLink === e.target.dataset.toc)));
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    $$('[data-toc]').forEach((s) => io.observe(s));
  }

  // ----- lightbox for one-page summary -----
  const dlg = $('.lightbox');
  if (dlg && typeof dlg.showModal === 'function') {
    let opener = null;
    $$('[data-lightbox]').forEach((b) => b.addEventListener('click', () => {
      opener = b; $('img', dlg).src = b.dataset.lightbox; dlg.showModal(); $('.lightbox-x', dlg).focus();
    }));
    $('.lightbox-x', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => { if (opener) opener.focus(); });
  } else {
    $$('[data-lightbox]').forEach((b) => b.addEventListener('click', () => window.open(b.dataset.lightbox, '_blank', 'noopener')));
  }

  // ----- resume print -----
  $$('[data-print]').forEach((b) => b.addEventListener('click', () => window.print()));
})();
