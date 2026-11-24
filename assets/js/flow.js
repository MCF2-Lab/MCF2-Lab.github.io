/* MCF2 Lab — live flow-field backgrounds for hero sections.
   Each <canvas data-flow> fills its parent. Point vortices with Lamb–Oseen cores drift in a
   uniform stream. Light tracers move with the local fluid velocity; heavy particles relax
   toward it with response time TAU, so they lag the flow and are centrifuged out of vortex
   cores. Optional: data-flow-density (particle count multiplier) and a [data-flow-toggle]
   button inside the same parent to pause and resume. */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var L = 14, TAU = 1.1, U0 = 26, TWO_PI = Math.PI * 2;
  var BUCKETS = [[0, 4, 0.14], [4, 9, 0.32], [9, 13, 0.7]];
  var rand = function (a, b) { return a + Math.random() * (b - a); };

  function flowField(canvas) {
    var ctx = canvas.getContext('2d');
    var host = canvas.parentNode;
    var density = parseFloat(canvas.getAttribute('data-flow-density')) || 1;
    var W = 0, H = 0, vort = [], n = 0, px, py, pvx, pvy, heavy, life, hist, head = 0;
    var pointer = { x: 0, y: 0, g: 0, lastX: null, lastY: null, lastT: 0 };
    var vel = [0, 0];
    var running = false, userPaused = reduceMotion, onScreen = true, raf = 0, last = 0;

    var velocity = function (x, y) {
      var u = U0, v = 0, k, o, dx, dy, r2, f;
      for (k = 0; k < vort.length; k++) {
        o = vort[k]; dx = x - o.x; dy = y - o.y; r2 = dx * dx + dy * dy + 1;
        f = o.g / (TWO_PI * r2) * (1 - Math.exp(-r2 / o.rc2));
        u -= dy * f; v += dx * f;
      }
      if (pointer.g) {
        dx = x - pointer.x; dy = y - pointer.y; r2 = dx * dx + dy * dy + 1;
        f = pointer.g / (TWO_PI * r2) * (1 - Math.exp(-r2 / 4900));
        u -= dy * f; v += dx * f;
      }
      vel[0] = u; vel[1] = v;
    };
    var spawn = function (i) {
      var x = rand(-20, W), y = rand(0, H), b = i * L * 2;
      px[i] = x; py[i] = y;
      velocity(x, y); pvx[i] = vel[0]; pvy[i] = vel[1];
      life[i] = rand(6, 14);
      for (var j = 0; j < L; j++) { hist[b + j * 2] = x; hist[b + j * 2 + 1] = y; }
    };
    var step = function (dt) {
      var i, k, o, b;
      for (k = 0; k < vort.length; k++) {
        o = vort[k];
        o.x += U0 * 0.55 * dt; o.ph += dt * 0.35;
        o.y = o.y0 + Math.sin(o.ph) * o.rc * 0.35;
        if (o.x > W + o.rc * 2.5) o.x -= W + o.rc * 5;
      }
      pointer.g *= Math.exp(-dt * 1.6);
      if (Math.abs(pointer.g) < 50) pointer.g = 0;
      for (i = 0; i < n; i++) {
        velocity(px[i], py[i]);
        if (heavy[i]) { pvx[i] += (vel[0] - pvx[i]) * dt / TAU; pvy[i] += (vel[1] - pvy[i]) * dt / TAU; }
        else { pvx[i] = vel[0]; pvy[i] = vel[1]; }
        px[i] += pvx[i] * dt; py[i] += pvy[i] * dt;
        life[i] -= dt;
        if (life[i] < 0 || px[i] > W + 20 || px[i] < -30 || py[i] < -20 || py[i] > H + 20) { spawn(i); continue; }
        b = i * L * 2 + head * 2;
        hist[b] = px[i]; hist[b + 1] = py[i];
      }
      head = (head + 1) % L;
    };
    var draw = function () {
      ctx.clearRect(0, 0, W, H);
      for (var grp = 0; grp < 2; grp++) {
        ctx.lineWidth = grp ? 2.1 : 1.15;
        for (var q = 0; q < BUCKETS.length; q++) {
          var from = BUCKETS[q][0], to = BUCKETS[q][1];
          ctx.beginPath();
          for (var i = 0; i < n; i++) {
            if (heavy[i] !== grp) continue;
            var b = i * L * 2;
            for (var j = from; j < to; j++) {
              var s0 = ((head + j) % L) * 2, s1 = ((head + j + 1) % L) * 2;
              ctx.moveTo(hist[b + s0], hist[b + s0 + 1]);
              ctx.lineTo(hist[b + s1], hist[b + s1 + 1]);
            }
          }
          ctx.strokeStyle = grp ? 'rgba(240, 180, 80,' + BUCKETS[q][2] + ')' : 'rgba(120, 214, 228,' + (BUCKETS[q][2] * 0.85) + ')';
          ctx.stroke();
        }
      }
    };
    var setup = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = host.clientWidth; H = host.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round';
      var s = Math.min(Math.max(W, H) * 0.6, Math.max(Math.min(W, H), 420)), nv = Math.max(3, Math.round(W / 230)), i;
      vort = [];
      for (i = 0; i < nv; i++) {
        var rc = s * rand(0.09, 0.14), y0 = rand(0.18, 0.82) * H;
        vort.push({ x: (i + 0.5) * (W + rc * 5) / nv - rc * 2.5, y: y0, y0: y0, rc2: rc * rc, rc: rc, ph: rand(0, TWO_PI), g: (i % 2 ? 1 : -1) * rand(0.85, 1.15) * 1050 * rc });
      }
      n = Math.round(Math.min(1500, Math.max(220, W * H / 900)) * density);
      px = new Float32Array(n); py = new Float32Array(n); pvx = new Float32Array(n); pvy = new Float32Array(n);
      life = new Float32Array(n); heavy = new Uint8Array(n); hist = new Float32Array(n * L * 2); head = 0;
      for (i = 0; i < n; i++) { heavy[i] = Math.random() < 0.34 ? 1 : 0; spawn(i); life[i] = rand(0, 14); }
      for (i = 0; i < 150; i++) step(1 / 30);
      draw();
    };
    var frame = function (t) {
      raf = requestAnimationFrame(frame);
      var dt = Math.min((t - last) / 1000, 1 / 30);
      last = t;
      if (dt > 0) { step(dt); draw(); }
    };
    var sync = function () {
      var want = !userPaused && onScreen && !document.hidden;
      if (want && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
      else if (!want && running) { running = false; cancelAnimationFrame(raf); }
    };

    setup();
    var lastW = W, resizeTimer = 0;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (host.clientWidth !== lastW || Math.abs(host.clientHeight - H) > 120) { lastW = host.clientWidth; setup(); }
      }, 200);
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; sync(); }).observe(host);
    }
    document.addEventListener('visibilitychange', sync);

    // The pointer stirs the flow: moving it adds a decaying vortex whose strength follows its speed.
    if (finePointer) {
      host.addEventListener('pointermove', function (e) {
        var r = host.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, t = e.timeStamp;
        if (pointer.lastX !== null && t > pointer.lastT) {
          var dx = x - pointer.lastX, dy = y - pointer.lastY, dtp = (t - pointer.lastT) / 1000;
          var speed = Math.min(Math.sqrt(dx * dx + dy * dy) / Math.max(dtp, 0.008), 1400);
          pointer.g += ((dx >= 0 ? -1 : 1) * speed * 75 - pointer.g) * 0.25;
        }
        pointer.x = x; pointer.y = y; pointer.lastX = x; pointer.lastY = y; pointer.lastT = t;
      });
      host.addEventListener('pointerleave', function () { pointer.lastX = null; });
    }

    var btn = host.querySelector('[data-flow-toggle]');
    if (btn) {
      if (reduceMotion) btn.hidden = true;
      btn.addEventListener('click', function () {
        userPaused = !userPaused;
        btn.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
        btn.querySelector('span').textContent = userPaused ? 'Play animation' : 'Pause animation';
        sync();
      });
    }
    sync();
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-flow]'), function (c) {
    if (c.getContext) flowField(c);
  });
})();
