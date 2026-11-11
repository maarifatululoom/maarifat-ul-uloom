/* ============================================================
   MAARIFAT-UL-ULOOM — 3D ISLAMIC GEOMETRY (no libraries, no images)
   Draws a slowly turning tunnel of gilded eight-point star rosettes
   and drifting light motes on a <canvas data-lattice>.
   - data-lattice="hero"  : deep tunnel, scroll flies the camera in, pointer tilts it
   - data-lattice="band"  : calmer, fewer rings (section backgrounds)
   - data-align="right"   : tunnel centre sits at ~70% width on wide screens
   No Qur'anic or Arabic text is ever drawn. Reduced motion: one still frame.
   Pauses when off-screen or the tab is hidden.
   ============================================================ */
(function () {
  "use strict";
  var canvases = document.querySelectorAll("canvas[data-lattice]");
  if (!canvases.length || !window.HTMLCanvasElement) return;
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var TAU = Math.PI * 2;

  /* 8-fold star {8/3} + octagon + inner star: returns list of closed polylines on the unit circle */
  function rosetteShapes(kind) {
    var out = [], i, p;
    function ring(n, r, step, rot) {
      var pts = [];
      for (i = 0; i < n; i++) { var a = rot + (i * step % n) / n * TAU; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
      return pts;
    }
    out.push(ring(8, 1, 3, 0));               // {8/3} star
    out.push(ring(8, 0.707, 1, TAU / 16));    // octagon
    if (kind % 2 === 0) out.push(ring(16, 0.55, 5, 0));   // {16/5} inner star on alternate rings
    else { p = []; for (i = 0; i < 48; i++) p.push([Math.cos(i / 48 * TAU) * 1.08, Math.sin(i / 48 * TAU) * 1.08]); out.push(p); }
    out.push(ring(8, 0.34, 3, TAU / 16));
    return out;
  }

  function Scene(cv) {
    var mode = cv.getAttribute("data-lattice") || "hero";
    var hero = mode === "hero";
    var ctx = cv.getContext("2d");
    var W = 0, H = 0, dpr = 1, cx = 0, cy = 0, focal = 700;
    var host = cv.parentElement;
    var RINGS = hero ? 11 : 6, GAP = hero ? 260 : 320, R = hero ? 430 : 380;
    var rings = [], motes = [], i;
    for (i = 0; i < RINGS; i++) rings.push({ z: 300 + i * GAP, spin: (i % 2 ? -1 : 1) * (0.05 + i * 0.006), shapes: rosetteShapes(i), phase: i * 0.4 });
    var MOTES = hero ? 150 : 70;
    for (i = 0; i < MOTES; i++) motes.push({ x: (Math.random() - 0.5) * 1800, y: (Math.random() - 0.5) * 1200, z: 150 + Math.random() * RINGS * GAP, s: 0.6 + Math.random() * 1.6, v: 6 + Math.random() * 14, t: Math.random() * TAU });

    var tiltX = 0, tiltY = 0, tx = 0, ty = 0, camZ = 0, running = false, visible = true, raf = 0, last = 0, time = 0;

    function resize() {
      var r = host.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var wide = W >= 1024 && cv.getAttribute("data-align") === "right";
      cx = wide ? W * 0.7 : W * 0.5; cy = H * (hero ? 0.5 : 0.5);
      focal = Math.max(W, H) * 0.62;
      if (!running) draw();
    }

    function project(x, y, z) {
      /* rotate by pointer tilt (yaw/pitch) */
      var cyw = Math.cos(tiltX), syw = Math.sin(tiltX), cp = Math.cos(tiltY), sp = Math.sin(tiltY);
      var x1 = x * cyw - z * syw, z1 = x * syw + z * cyw;
      var y1 = y * cp - z1 * sp; z1 = y * sp + z1 * cp;
      var d = z1 - camZ;
      if (d < 20) return null;
      var k = focal / d;
      return [cx + x1 * k, cy + y1 * k, k, d];
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.lineJoin = "round";
      var far = RINGS * GAP;
      /* rings, far to near */
      for (var n = rings.length - 1; n >= 0; n--) {
        var rg = rings[n];
        var z = rg.z; // wrap so the fly-through never runs out
        while (z - camZ < 60) z += far;
        var depth = (z - camZ) / far;                    // 0 near .. 1 far
        /* peak brightness mid-tunnel; near rings dissolve before they fill the screen */
        var a = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, (depth - 0.12) / 0.88))), 1.6) * (hero ? 0.62 : 0.5);
        if (a <= 0.01) continue;
        var rot = rg.phase + time * rg.spin;
        var cr = Math.cos(rot), sr = Math.sin(rot);
        var near = 1 - depth;
        ctx.strokeStyle = n % 3 === 2 ? "rgba(232,216,181," + (a * 0.55).toFixed(3) + ")" : "rgba(216,190,138," + (a * 0.8).toFixed(3) + ")";
        ctx.lineWidth = 0.5 + near * 0.9;
        for (var s = 0; s < rg.shapes.length; s++) {
          var sh = rg.shapes[s];
          ctx.beginPath();
          var ok = false;
          for (var p = 0; p <= sh.length; p++) {
            var q = sh[p % sh.length];
            var px = (q[0] * cr - q[1] * sr) * R, py = (q[0] * sr + q[1] * cr) * R;
            var pr = project(px, py, z);
            if (!pr) { ok = false; continue; }
            if (!ok) { ctx.moveTo(pr[0], pr[1]); ok = true; } else ctx.lineTo(pr[0], pr[1]);
          }
          ctx.stroke();
        }
        /* glowing nodes on the star tips */
        ctx.fillStyle = "rgba(232,216,181," + (a * 0.9).toFixed(3) + ")";
        var tip = rg.shapes[0];
        for (var t = 0; t < tip.length; t++) {
          var tq = tip[t], tp = project((tq[0] * cr - tq[1] * sr) * R, (tq[0] * sr + tq[1] * cr) * R, z);
          if (tp) { ctx.beginPath(); ctx.arc(tp[0], tp[1], Math.max(0.8, tp[2] * 3.2), 0, TAU); ctx.fill(); }
        }
      }
      /* central light */
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * (hero ? 0.55 : 0.45));
      g.addColorStop(0, "rgba(232,216,181,0.16)"); g.addColorStop(1, "rgba(232,216,181,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      /* motes */
      for (var m = 0; m < motes.length; m++) {
        var mo = motes[m], mz = mo.z;
        while (mz - camZ < 40) mz += far;
        var mp = project(mo.x, mo.y, mz);
        if (!mp) continue;
        var md = (mz - camZ) / far;
        var ma = Math.max(0, (1 - md)) * (0.45 + 0.55 * Math.sin(time * 1.3 + mo.t) * Math.sin(time * 1.3 + mo.t));
        ctx.fillStyle = "rgba(240,226,190," + (ma * 0.85).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(mp[0], mp[1], Math.max(0.5, mo.s * mp[2] * 2.2), 0, TAU); ctx.fill();
      }
    }

    function frame(now) {
      raf = 0;
      if (!running) return;
      var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      time += dt;
      tiltX += (tx - tiltX) * 0.05; tiltY += (ty - tiltY) * 0.05;
      var target = hero ? Math.min(window.scrollY, H * 1.2) * 1.4 : time * 18;
      if (hero) target += time * 22;  // slow constant drift forward
      camZ += (target - camZ) * (hero ? 0.08 : 1);
      for (var m = 0; m < motes.length; m++) { motes[m].y -= motes[m].v * dt; if (motes[m].y < -600) motes[m].y += 1200; }
      draw();
      raf = requestAnimationFrame(frame);
    }

    function sync() {
      var should = visible && !document.hidden && !reduceMQ.matches;
      if (should && !running) { running = true; last = 0; raf = requestAnimationFrame(frame); }
      else if (!should && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; draw(); }
    }

    if (hero) {
      host.closest("section").addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        tx = (e.clientX / window.innerWidth - 0.5) * 0.28;
        ty = (e.clientY / window.innerHeight - 0.5) * -0.2;
      });
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; sync(); }, { rootMargin: "80px" }).observe(host);
    }
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(host); else window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", sync);
    reduceMQ.addEventListener && reduceMQ.addEventListener("change", sync);
    resize();
    time = 3; draw();
    sync();
    cv.classList.add("is-on");
  }

  for (var c = 0; c < canvases.length; c++) { try { Scene(canvases[c]); } catch (e) { /* decorative only */ } }

  /* Optional hero film (e.g. a Google Flow clip). Put the path in data-src on <video data-hero-film>;
     empty = no request is made and the 3D geometry is the hero on its own. */
  var film = document.querySelector("video[data-hero-film]");
  if (film && film.getAttribute("data-src") && !reduceMQ.matches) {
    film.src = film.getAttribute("data-src");
    film.hidden = false;
    film.addEventListener("canplay", function () { film.classList.add("is-on"); document.documentElement.classList.add("has-hero-film"); }, { once: true });
    var p = film.play(); if (p && p.catch) p.catch(function () {});
  }
})();
