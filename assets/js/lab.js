/* MCF2 Lab — site interactions (no dependencies) */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Header: mobile menu and scrolled state ---------- */
  var header = $('[data-header]');
  var toggle = $('[data-nav-toggle]');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('#site-nav a').forEach(function (a) {
      a.addEventListener('click', function () { document.body.classList.remove('nav-open'); toggle.setAttribute('aria-expanded', 'false'); });
    });
  }
  function onScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll and count-up ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target) || reduceMotion) return;
    var fmt = function (v) { return Math.round(v).toLocaleString('en-US'); };
    var start = null, dur = 1400;
    function step(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }
  var revealEls = $$('[data-reveal]');
  var countEls = $$('[data-count]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.6 });
    countEls.forEach(function (el) { co.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Hero slideshow ---------- */
  var show = $('[data-slideshow]');
  if (show) {
    var slides = $$('[data-slide]', show), dots = $$('[data-slide-dot]', show), cur = 0, timer = null;
    var go = function (i) {
      slides[cur].classList.remove('is-active'); dots[cur].classList.remove('is-active');
      cur = (i + slides.length) % slides.length;
      slides[cur].classList.add('is-active'); dots[cur].classList.add('is-active');
    };
    var play = function () { if (!reduceMotion) { stop(); timer = setInterval(function () { go(cur + 1); }, 6000); } };
    var stop = function () { if (timer) clearInterval(timer); timer = null; };
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); play(); }); });
    show.addEventListener('mouseenter', stop);
    show.addEventListener('mouseleave', play);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : play(); });
    play();
  }

  /* ---------- Videos: autoplay only when visible and motion is allowed ---------- */
  $$('video[data-autoplay]').forEach(function (v) {
    var btn = v.parentNode.querySelector('[data-video-toggle]');
    var userPaused = reduceMotion;
    var setBtn = function () { if (btn) { btn.classList.toggle('is-paused', v.paused); btn.setAttribute('aria-label', v.paused ? 'Play animation' : 'Pause animation'); } };
    if (btn) btn.addEventListener('click', function () {
      if (v.paused) { userPaused = false; v.play(); } else { userPaused = true; v.pause(); }
    });
    v.addEventListener('play', setBtn); v.addEventListener('pause', setBtn);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          if (e.isIntersecting && !userPaused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
          else if (!e.isIntersecting) v.pause();
        });
      }, { threshold: 0.35 }).observe(v);
    }
    setBtn();
  });

  /* ---------- Sub-navigation highlight ---------- */
  var subLinks = $$('.subnav a');
  if (subLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    subLinks.forEach(function (a) { var t = document.getElementById(a.getAttribute('href').slice(1)); if (t) map[t.id] = a; });
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { subLinks.forEach(function (a) { a.classList.remove('is-current'); }); map[e.target.id].classList.add('is-current'); }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) { so.observe(document.getElementById(id)); });
  }

  /* ---------- Filters (publications, news, alumni) ---------- */
  $$('[data-filter-root]').forEach(function (root) {
    var kind = root.getAttribute('data-filter-root');
    var state = { type: 'all', topic: 'all', year: 'all', cat: 'all', group: 'all', q: '', student: false };
    var scope = root.parentNode;
    var items = $$('[data-filter-item]', scope);
    var countEl = $('[data-filter-count]', root);
    var emptyEl = $('[data-filter-empty]', scope);

    function apply() {
      var shown = 0;
      if (kind === 'alumni') {
        $$('[data-alumni-group]', scope).forEach(function (g) {
          var ok = state.group === 'all' || g.getAttribute('data-alumni-group') === state.group;
          g.hidden = !ok;
        });
        return;
      }
      items.forEach(function (it) {
        var ok = true;
        if (kind === 'pubs') {
          if (state.type !== 'all' && it.dataset.type !== state.type) ok = false;
          if (state.topic !== 'all' && it.dataset.topic !== state.topic) ok = false;
          if (state.student && it.dataset.student !== 'true') ok = false;
          if (state.q && it.dataset.search.indexOf(state.q) === -1) ok = false;
        } else {
          if (state.year !== 'all' && it.dataset.year !== state.year) ok = false;
          if (state.cat !== 'all' && it.dataset.cat !== state.cat) ok = false;
        }
        it.hidden = !ok;
        if (ok) shown++;
      });
      if (kind === 'pubs') {
        $$('[data-pub-group]', scope).forEach(function (g) { g.hidden = !$$('[data-filter-item]:not([hidden])', g).length; });
      }
      if (countEl) countEl.textContent = 'Showing ' + shown + ' of ' + items.length;
      if (emptyEl) emptyEl.hidden = shown !== 0;
    }

    $$('[data-filter]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-filter');
        $$('[data-filter="' + key + '"]', root).forEach(function (o) { o.classList.remove('is-active'); o.setAttribute('aria-pressed', 'false'); });
        b.classList.add('is-active'); b.setAttribute('aria-pressed', 'true');
        state[key] = b.getAttribute('data-value');
        apply();
      });
    });
    var sel = $('[data-filter-select]', root);
    if (sel) sel.addEventListener('change', function () { state[sel.getAttribute('data-filter-select')] = sel.value; apply(); });
    var search = $('[data-filter-search]', root);
    if (search) search.addEventListener('input', function () { state.q = search.value.trim().toLowerCase(); apply(); });
    var stu = $('[data-filter-student]', root);
    if (stu) stu.addEventListener('change', function () { state.student = stu.checked; apply(); });
    apply();
  });

  /* ---------- Lightbox ---------- */
  var lb = $('[data-lightbox-root]');
  if (lb) {
    var media = $('[data-lightbox-media]', lb), cap = $('[data-lightbox-caption]', lb), lastFocus = null;
    var close = function () {
      lb.classList.remove('is-open');
      setTimeout(function () { lb.hidden = true; media.innerHTML = ''; }, 200);
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    };
    $$('[data-lightbox]').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        lastFocus = a;
        var vid = a.getAttribute('data-video');
        if (vid) {
          media.innerHTML = '<video src="' + vid + '" controls ' + (reduceMotion ? '' : 'autoplay ') + 'loop muted playsinline></video>';
        } else {
          var img = new Image(); img.src = a.getAttribute('href'); img.alt = (a.querySelector('img') || {}).alt || '';
          media.innerHTML = ''; media.appendChild(img);
        }
        cap.textContent = a.getAttribute('data-caption') || '';
        lb.hidden = false;
        requestAnimationFrame(function () { lb.classList.add('is-open'); });
        document.body.style.overflow = 'hidden';
        $('[data-lightbox-close]', lb).focus();
      });
    });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('[data-lightbox-close]')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) close(); });
  }

  /* ---------- Charts ---------- */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function tipFor(plot) {
    var t = document.createElement('div'); t.className = 'viz-tip'; t.setAttribute('role', 'status'); plot.appendChild(t);
    return {
      show: function (html, x, y) { t.innerHTML = html; t.style.left = x + 'px'; t.style.top = y + 'px'; t.classList.add('is-on'); },
      hide: function () { t.classList.remove('is-on'); }
    };
  }
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function onResize(fn) { var w = 0; var run = function () { var nw = Math.round(document.documentElement.clientWidth); if (nw !== w) { w = nw; fn(); } }; window.addEventListener('resize', run); run(); }

  // Publications per year: stacked columns (journal below, conference above)
  var pubPlot = $('[data-pubchart]');
  var pubData = $('[data-pubdata]');
  if (pubPlot && pubData) {
    var rows = JSON.parse(pubData.textContent);
    onResize(function () {
      pubPlot.innerHTML = '';
      var W = pubPlot.clientWidth, H = 240, m = { t: 14, r: 8, b: 28, l: 28 };
      var iw = W - m.l - m.r, ih = H - m.t - m.b;
      var max = Math.max.apply(null, rows.map(function (r) { return r.j + r.c; }));
      var top = Math.max(2, Math.ceil(max / 2) * 2);
      var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Journal articles and conference presentations per year, 2012 to 2026' }, pubPlot);
      var g = el('g', { transform: 'translate(' + m.l + ',' + m.t + ')' }, svg);
      var y = function (v) { return ih - v / top * ih; };
      var grid = el('g', { class: 'grid' }, g), axis = el('g', { class: 'axis' }, g);
      for (var v = 0; v <= top; v += (top > 6 ? 2 : 1)) {
        el('line', { x1: 0, x2: iw, y1: y(v), y2: y(v) }, grid);
        el('text', { x: -8, y: y(v) + 4, 'text-anchor': 'end' }, axis).textContent = v;
      }
      var band = iw / rows.length, bw = Math.min(30, band * 0.62);
      var tip = tipFor(pubPlot), surf = '#fcfcfb', r = 4;
      rows.forEach(function (d, i) {
        var x = i * band + (band - bw) / 2;
        var segs = [{ v: d.j, c: css('--s1') }, { v: d.c, c: css('--s2') }];
        var base = 0, n = segs.filter(function (s) { return s.v > 0; }).length, k = 0;
        segs.forEach(function (s) {
          if (!s.v) return;
          k++;
          var y0 = y(base), y1 = y(base + s.v), h = y0 - y1 - (base > 0 ? 2 : 0);
          var isTop = k === n;
          var yy = y1, rr = isTop ? Math.min(r, h / 2) : 0;
          var p = 'M' + x + ',' + (yy + h) + 'V' + (yy + rr) + (rr ? 'Q' + x + ',' + yy + ' ' + (x + rr) + ',' + yy : '') + 'H' + (x + bw - rr) + (rr ? 'Q' + (x + bw) + ',' + yy + ' ' + (x + bw) + ',' + (yy + rr) : '') + 'V' + (yy + h) + 'Z';
          el('path', { d: p, fill: s.c }, g);
          base += s.v;
        });
        if (d.y % 2 === 0 || W > 700) el('text', { x: x + bw / 2, y: ih + 18, 'text-anchor': 'middle' }, axis).textContent = (W > 700 ? d.y : "'" + String(d.y).slice(2));
        var hit = el('rect', { class: 'hit', x: i * band, y: 0, width: band, height: ih }, g);
        var show = function () {
          var bx = m.l + x + bw / 2, by = m.t + y(d.j + d.c);
          tip.show('<b>' + d.y + '</b><br>' + d.j + ' journal · ' + d.c + ' conference', bx / W * pubPlot.clientWidth, by);
        };
        hit.addEventListener('mouseenter', show); hit.addEventListener('mouseleave', tip.hide);
        hit.addEventListener('touchstart', show, { passive: true });
      });
      el('line', { x1: 0, x2: iw, y1: ih, y2: ih, stroke: '#c9ccd3' }, g);
    });
  }
})();
