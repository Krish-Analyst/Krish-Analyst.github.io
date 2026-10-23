// Rexyd shared script: menu, theme, search, scroll reveal, guide extras, offline support.
window.__vpReady = true;

// ---------- Phone menu ----------
(function () {
  var nav = document.querySelector('nav');
  var button = document.querySelector('.nav-toggle');
  if (!nav || !button) return;

  function setOpen(open) {
    nav.classList.toggle('nav-open', open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  button.addEventListener('click', function () { setOpen(!nav.classList.contains('nav-open')); });
  nav.querySelectorAll('.nav-links a').forEach(function (link) {
    link.addEventListener('click', function () { setOpen(false); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  document.addEventListener('click', function (e) { if (!nav.contains(e.target)) setOpen(false); });
})();

// ---------- Light / dark theme ----------
(function () {
  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  function label() {
    if (!btn) return;
    var dark = root.getAttribute('data-theme') === 'dark';
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.setAttribute('title', dark ? 'Light mode' : 'Dark mode');
  }
  label();
  if (btn) btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('vp-theme', next); } catch (e) {}
    label();
  });
})();

// ---------- Scroll reveal ----------
(function () {
  var els = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    var batch = entries.filter(function (e) { return e.isIntersecting; });
    batch.forEach(function (e, i) {
      e.target.style.transitionDelay = Math.min(i * 70, 350) + 'ms';
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach(function (el) { io.observe(el); });
})();

// ---------- Guide pages: progress bar + "In this guide" ----------
(function () {
  var article = document.querySelector('.article-full .body');
  if (!article) return;

  var bar = document.createElement('div');
  bar.className = 'read-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var main = document.querySelector('.article-full');
  function progress() {
    var r = main.getBoundingClientRect();
    var total = r.height - window.innerHeight + 140;
    var p = total > 0 ? Math.min(Math.max((-r.top + 60) / total, 0), 1) : 1;
    bar.style.transform = 'scaleX(' + p + ')';
  }
  window.addEventListener('scroll', progress, { passive: true });
  window.addEventListener('resize', progress);
  progress();

  var heads = article.querySelectorAll('h2');
  if (heads.length < 4) return;
  var label = main.getAttribute('data-toc-label') || 'In this guide';
  var toc = document.createElement('div');
  toc.className = 'toc rv in';
  toc.setAttribute('role', 'navigation');
  toc.setAttribute('aria-label', label);
  var html = '<div class="toc-label">' + label + '</div><ol>';
  heads.forEach(function (h, i) {
    if (!h.id) h.id = h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ('section-' + i);
    html += '<li><a href="#' + h.id + '">' + h.textContent + '</a></li>';
  });
  toc.innerHTML = html + '</ol>';
  article.parentNode.insertBefore(toc, article);

  if ('IntersectionObserver' in window) {
    var links = toc.querySelectorAll('a');
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('href') === '#' + e.target.id); });
        }
      });
    }, { rootMargin: '-70px 0px -70% 0px' });
    heads.forEach(function (h) { obs.observe(h); });
  }
})();

// ---------- Search ----------
(function () {
  var openBtn = document.getElementById('search-open');
  if (!openBtn) return;
  var index = null, loading = false, active = 0, results = [];
  var overlay = document.createElement('div');
  overlay.className = 'search-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Search Rexyd');
  overlay.innerHTML =
    '<div class="search-box">' +
      '<div class="search-field">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>' +
        '<input type="search" placeholder="Search guides and tools" aria-label="Search guides and tools" autocomplete="off" spellcheck="false">' +
        '<kbd role="button" tabindex="0" aria-label="Close search">Esc</kbd>' +
      '</div>' +
      '<div class="search-results" role="listbox"></div>' +
      '<div class="search-hint"><span>&uarr; &darr; to move</span><span>Enter to open</span></div>' +
    '</div>';
  document.body.appendChild(overlay);
  var input = overlay.querySelector('input');
  var list = overlay.querySelector('.search-results');
  var lastFocus = null;

  function load() {
    if (index || loading) return;
    loading = true;
    fetch('/search-index.json').then(function (r) { return r.json(); }).then(function (data) {
      index = data; loading = false; render();
    }).catch(function () { loading = false; list.innerHTML = '<div class="search-empty">Search isn’t available right now.</div>'; });
  }
  function open() {
    lastFocus = document.activeElement;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    input.value = '';
    load(); render();
    setTimeout(function () { input.focus(); }, 30);
  }
  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function score(item, terms) {
    var t = norm(item.title), d = norm(item.desc), k = norm(item.keys || ''), b = norm(item.text || '');
    var s = 0;
    for (var i = 0; i < terms.length; i++) {
      var q = terms[i], hit = false;
      if (t.indexOf(q) !== -1) { s += t.indexOf(q) === 0 ? 14 : 10; hit = true; }
      if (k.indexOf(q) !== -1) { s += 6; hit = true; }
      if (d.indexOf(q) !== -1) { s += 4; hit = true; }
      if (b.indexOf(q) !== -1) { s += 1 + Math.min((b.split(q).length - 1), 5) * 0.4; hit = true; }
      if (!hit) return 0;
    }
    return s + (item.boost || 0);
  }
  function snippet(item, terms) {
    var src = item.text || item.desc, n = norm(src), pos = -1;
    for (var i = 0; i < terms.length && pos === -1; i++) pos = n.indexOf(terms[i]);
    if (pos === -1 || !terms.length) return esc(item.desc);
    var start = Math.max(0, pos - 50), end = Math.min(src.length, pos + 110);
    var out = esc(src.slice(start, end));
    terms.forEach(function (q) {
      if (q.length < 2) return;
      out = out.replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
    });
    return (start > 0 ? '…' : '') + out + (end < src.length ? '…' : '');
  }
  function render() {
    if (!index) { list.innerHTML = '<div class="search-empty">Loading…</div>'; return; }
    var q = norm(input.value.trim());
    var terms = q ? q.split(/\s+/) : [];
    if (!terms.length) {
      results = index.items.filter(function (i) { return i.featured; });
    } else {
      results = index.items.map(function (i) { return { i: i, s: score(i, terms) }; })
        .filter(function (r) { return r.s > 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .slice(0, 8).map(function (r) { return r.i; });
    }
    active = 0;
    if (!results.length) {
      list.innerHTML = '<div class="search-empty">No results for “' + esc(input.value) + '”. Try “pricing”, “brand” or “first customers”.</div>';
      return;
    }
    list.innerHTML = results.map(function (r, n) {
      return '<a href="' + r.url + '" role="option" class="' + (n === 0 ? 'active' : '') + '">' +
        '<span class="g-icon sm">' + (index.icons[r.icon] || '') + '</span>' +
        '<span><span class="sr-type">' + esc(r.type) + '</span><div class="sr-title">' + esc(r.title) + '</div>' +
        '<div class="sr-snippet">' + snippet(r, terms) + '</div></span></a>';
    }).join('');
  }
  function move(d) {
    var links = list.querySelectorAll('a');
    if (!links.length) return;
    links[active].classList.remove('active');
    active = (active + d + links.length) % links.length;
    links[active].classList.add('active');
    links[active].scrollIntoView({ block: 'nearest' });
  }

  openBtn.addEventListener('click', open);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  overlay.querySelector('kbd').addEventListener('click', close);
  input.addEventListener('input', render);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { var a = list.querySelectorAll('a')[active]; if (a) window.location.href = a.href; }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) { close(); return; }
    var typing = /input|textarea|select/i.test((document.activeElement || {}).tagName || '') || (document.activeElement || {}).isContentEditable;
    if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      if (!overlay.classList.contains('open')) open();
    }
  });
})();

// ---------- Brand film: play only while on screen ----------
(function () {
  var v = document.querySelector('video[data-autoplay-visible]');
  if (!v) return;
  var btn = document.querySelector('[data-film-sound]');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.35 }).observe(v);
  }
  if (btn) btn.addEventListener('click', function () {
    var turnOn = v.muted;
    if (turnOn) { v.currentTime = 0; v.muted = false; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    else v.muted = true;
    btn.classList.toggle('is-on', turnOn);
    btn.querySelector('span').textContent = turnOn ? 'Sound on' : 'Play with sound';
    btn.setAttribute('aria-pressed', turnOn ? 'true' : 'false');
  });
})();

// ---------- Installable web app: offline support ----------
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}

// ---------- Tools dropdown (tap/click support; hover and keyboard focus work through CSS) ----------
(function () {
  document.querySelectorAll('.has-menu').forEach(function (li) {
    var btn = li.querySelector('.menu-caret');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = li.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.has-menu.open').forEach(function (li) {
      if (!li.contains(e.target)) { li.classList.remove('open'); li.querySelector('.menu-caret').setAttribute('aria-expanded', 'false'); }
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.has-menu.open').forEach(function (li) { li.classList.remove('open'); li.querySelector('.menu-caret').setAttribute('aria-expanded', 'false'); });
  });
})();
