/* ============================================================
   MAARIFAT-UL-ULOOM ACADEMY — HOMEPAGE SCRIPT (Step 3)
   Vanilla JS, no dependencies. Loaded only by /, after
   content-store.js and content-apply.js (which keep admin-edited
   contact details, social links and the logo working).

   Everything here is an enhancement: the page is fully readable
   without it. Motion respects prefers-reduced-motion. Parallax runs
   only on desktop with a fine pointer. (Step 5: premium motion pass)
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var desktopMQ = window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)");
  var wideMQ = window.matchMedia("(min-width: 1024px)");

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.warn("[home.js]", e); } }

  var cms = null;
  safe(function () { if (window.MUA_CMS) cms = window.MUA_CMS.getContent(); });

  /* ---------- small utilities ---------- */
  var scrollTasks = [];
  var ticking = false;
  function onScrollOrResize() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      scrollTasks.forEach(function (t) { safe(t); });
    });
  }
  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);

  /* ---------- footer year ---------- */
  function initYear() {
    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ---------- header scroll state ---------- */
  function initHeader() {
    var header = $("[data-header]");
    if (!header) return;
    function update() { header.classList.toggle("is-scrolled", window.scrollY > 12); }
    scrollTasks.push(update);
    update();
  }

  /* ---------- mobile menu (aria-expanded, focus trap, Escape, scroll lock) ---------- */
  function initMenu() {
    var btn = $("[data-nav-toggle]"), menu = $("[data-mobile-menu]"), label = $("[data-nav-toggle-label]");
    if (!btn || !menu) return;
    var isOpen = false, closeTimer = 0;
    var behind = $$("main, footer, [data-sticky-bar]");

    function focusables() { return $$("a[href], button:not([disabled])", menu); }

    function setOpen(v) {
      isOpen = v;
      btn.setAttribute("aria-expanded", v ? "true" : "false");
      if (label) label.textContent = v ? "Close menu" : "Open menu";
      document.body.classList.toggle("menu-open", v);
      behind.forEach(function (el) { if (v) el.setAttribute("inert", ""); else el.removeAttribute("inert"); });
      clearTimeout(closeTimer);
      if (v) {
        menu.hidden = false;
        void menu.offsetWidth; // start the transition
        menu.classList.add("is-open");
        var f = focusables()[0]; if (f) f.focus();
      } else {
        menu.classList.remove("is-open");
        closeTimer = setTimeout(function () { menu.hidden = true; }, reduceMQ.matches ? 0 : 260);
      }
    }

    btn.addEventListener("click", function () { setOpen(!isOpen); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (!isOpen) return;
      if (e.key === "Escape") { setOpen(false); btn.focus(); return; }
      if (e.key !== "Tab") return;
      var list = focusables(), first = list[0], last = list[list.length - 1], a = document.activeElement;
      if (e.shiftKey && (a === btn || a === first)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && a === last) { e.preventDefault(); btn.focus(); }
    });
    wideMQ.addEventListener("change", function () { if (wideMQ.matches && isOpen) setOpen(false); });
  }

  /* ---------- scroll reveal ---------- */
  function initReveal() {
    var els = $$(".reveal, .reveal--mask, .reveal-geo");
    if (!("IntersectionObserver" in window) || reduceMQ.matches) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- hero: subtle photographic depth (pointer) + tiny scroll shift (desktop, fine pointer, motion allowed) ---------- */
  function initParallax() {
    var hero = $("[data-hero]");
    if (!hero) return;
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    function enabled() { return desktopMQ.matches && !reduceMQ.matches; }
    function loop() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      hero.style.setProperty("--mx", cx.toFixed(3));
      hero.style.setProperty("--my", cy.toFixed(3));
      raf = (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) ? requestAnimationFrame(loop) : 0;
    }
    function sync() { hero.classList.toggle("is-depth", enabled()); }
    function reset() {
      tx = ty = cx = cy = 0;
      ["--mx", "--my", "--sy", "--ds"].forEach(function (p) { hero.style.removeProperty(p); });
      sync();
    }
    hero.addEventListener("pointerenter", function () {
      if (enabled()) hero.style.setProperty("--ds", "1.04");   /* tiny overscan so the photo can shift inside its frame without showing an edge */
    });
    hero.addEventListener("pointermove", function (e) {
      if (!enabled()) return;
      hero.style.setProperty("--ds", "1.04");
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    hero.addEventListener("pointerleave", function () {
      tx = 0; ty = 0; hero.style.removeProperty("--ds");
      if (enabled() && !raf) raf = requestAnimationFrame(loop);
    });
    sync();
    scrollTasks.push(function () {
      if (!enabled()) return;
      hero.style.setProperty("--sy", (Math.min(window.scrollY, 700) * 0.05).toFixed(1));
    });
    desktopMQ.addEventListener("change", reset);
    reduceMQ.addEventListener("change", reset);
  }


  /* ---------- counters ---------- */
  function initCounters() {
    var els = $$("[data-count-to]");
    if (!els.length || reduceMQ.matches || !("IntersectionObserver" in window)) return; // final value stays in the HTML
    els.forEach(function (el) { el.textContent = "0"; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, to = parseFloat(el.getAttribute("data-count-to")) || 0, start = null;
        (function step(ts) {
          if (start === null) start = ts;
          var t = clamp((ts - start) / 900, 0, 1), e = 1 - Math.pow(1 - t, 3);
          el.textContent = String(Math.round(to * e));
          if (t < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- course pathway: SVG path drawn through the node positions, filled by scroll ---------- */
  function initPathway() {
    var stage = $("[data-path]");
    if (!stage) return;
    var svg = $(".pathway__line", stage), track = $(".pathway__track", stage), draw = $(".pathway__draw", stage);
    var nodes = $$("[data-node]", stage);
    if (!svg || !track || !draw || nodes.length < 2) return;
    var total = 0, fracs = [], L = 0;

    function centre(el) {
      var x = 0, y = 0, n = el;
      while (n && n !== stage) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
    }
    function layout() {
      var w = stage.offsetWidth, h = stage.offsetHeight;
      svg.setAttribute("viewBox", "0 0 " + w + " " + h);
      var pts = nodes.map(centre);
      var d = "M" + pts[0].x.toFixed(1) + "," + pts[0].y.toFixed(1);
      total = 0; var cum = [0];
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i];
        if (Math.abs(b.x - a.x) > Math.abs(b.y - a.y)) {
          var mx = (a.x + b.x) / 2;
          d += " C" + mx.toFixed(1) + "," + a.y.toFixed(1) + " " + mx.toFixed(1) + "," + b.y.toFixed(1) + " " + b.x.toFixed(1) + "," + b.y.toFixed(1);
        } else {
          var my = (a.y + b.y) / 2;
          d += " C" + a.x.toFixed(1) + "," + my.toFixed(1) + " " + b.x.toFixed(1) + "," + my.toFixed(1) + " " + b.x.toFixed(1) + "," + b.y.toFixed(1);
        }
        total += Math.hypot(b.x - a.x, b.y - a.y);
        cum.push(total);
      }
      fracs = cum.map(function (c) { return total ? c / total : 0; });
      track.setAttribute("d", d); draw.setAttribute("d", d);
      L = draw.getTotalLength();
      draw.style.strokeDasharray = L;
      update();
    }
    /* Step 5: the line only ever moves forward. `best` is the furthest scroll progress seen; `cur` eases toward it
       (time-based, ~250ms), so quick scrolling never makes the line jump and scrolling back never un-draws it. */
    var best = 0, cur = 0, raf = 0, prev = 0;
    function paint() {
      draw.style.strokeDashoffset = (L * (1 - cur)).toFixed(1);
      nodes.forEach(function (n, i) {
        if (cur >= fracs[i] - 0.001 && (i > 0 || cur > 0.02 || reduceMQ.matches)) {
          n.classList.add("is-reached");
          if (n.parentNode) n.parentNode.classList.add("is-shown");
        }
      });
    }
    function tick(ts) {
      var dt = Math.min(ts - prev, 50) / 1000; prev = ts;
      var gap = best - cur;
      cur += Math.min(gap * (1 - Math.exp(-dt * 6)), dt * 0.9);
      if (best - cur < 0.0015) cur = best;
      paint();
      raf = cur < best ? requestAnimationFrame(tick) : 0;
    }
    function update() {
      if (reduceMQ.matches) {
        stage.classList.remove("is-live");
        best = cur = 1; paint(); return;
      }
      var r = stage.getBoundingClientRect(), vh = window.innerHeight, p;
      if (pinned()) {
        /* pinned: progress = how far through the tall pin wrapper we are; finishes at 85% so the full path rests before release */
        var pr = pin.getBoundingClientRect(), run = Math.max(1, pr.height - (vh - headerH()));
        p = clamp(0.04 + (headerH() - pr.top) / (run * 0.85), 0, 1);
      } else {
        p = clamp((vh * 0.78 - r.top) / (r.height * 0.85), 0, 1);
      }
      if (p > best) best = p;
      if (!raf && cur < best) { prev = performance.now(); raf = requestAnimationFrame(tick); } else if (!raf) paint();
    }
    /* Desktop pin: the stage sticks under the header while the page scrolls through a tall wrapper,
       so the whole path and all four cards are seen before the section moves on. */
    var pinMQ = window.matchMedia("(min-width: 1024px) and (min-height: 560px)");
    var pin = document.createElement("div"), sticky = document.createElement("div");
    pin.className = "pathway__pin"; sticky.className = "pathway__sticky";
    stage.parentNode.insertBefore(pin, stage); pin.appendChild(sticky); sticky.appendChild(stage);
    function headerH() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 76; }
    function pinned() { return pin.classList.contains("is-pinned"); }
    function fit() {
      var on = pinMQ.matches && !reduceMQ.matches;
      pin.classList.toggle("is-pinned", on);
      stage.style.transform = "";
      if (on) {
        var room = window.innerHeight - headerH() - 48, h = stage.offsetHeight;
        if (h > room) stage.style.transform = "scale(" + (room / h).toFixed(3) + ")";
      }
      update();
    }
    pinMQ.addEventListener("change", fit); reduceMQ.addEventListener("change", fit);
    window.addEventListener("resize", fit);

    stage.classList.add("is-live");   /* CSS hides the cards/nodes only from here on, i.e. only when this script runs */
    layout();
    fit();
    scrollTasks.push(update);
    if ("ResizeObserver" in window) new ResizeObserver(layout).observe(stage); else window.addEventListener("resize", layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    window.addEventListener("load", layout);
    reduceMQ.addEventListener("change", update);
  }

  /* ---------- how it works: rail fills as you scroll ---------- */
  function initSteps() {
    var ol = $("[data-steps]");
    if (!ol) return;
    var items = $$(".step", ol), last = items[items.length - 1];
    function layout() {
      var nodeY = last.offsetTop + 20;
      ol.style.setProperty("--rail-end", Math.max(0, ol.offsetHeight - nodeY) + "px");
      update();
    }
    /* Step 5: same forward-only, eased model as the pathway. The rail fills once; each step number and its text
       reveal when the rail reaches them, and stay revealed. */
    var best = 0, cur = 0, raf = 0, prev = 0;
    function paint() {
      ol.style.setProperty("--p", cur.toFixed(4));
      var span = Math.max(1, last.offsetTop - items[0].offsetTop);
      items.forEach(function (it) {
        var f = (it.offsetTop - items[0].offsetTop) / span;
        if (cur >= f - 0.001 && (f > 0 || cur > 0.004 || reduceMQ.matches)) it.classList.add("is-done");
      });
    }
    function tick(ts) {
      var dt = Math.min(ts - prev, 50) / 1000; prev = ts;
      var gap = best - cur;
      cur += Math.min(gap * (1 - Math.exp(-dt * 6)), dt * 0.9);
      if (best - cur < 0.0015) cur = best;
      paint();
      raf = cur < best ? requestAnimationFrame(tick) : 0;
    }
    function update() {
      if (reduceMQ.matches) {
        ol.classList.remove("is-live");
        best = cur = 1; paint(); return;
      }
      var r = ol.getBoundingClientRect(), anchor = window.innerHeight * 0.6;
      var startY = r.top + items[0].offsetTop + 20, endY = r.top + last.offsetTop + 20;
      var p = clamp((anchor - startY) / Math.max(1, endY - startY), 0, 1);
      /* if the whole list has scrolled past, everything is done regardless of the anchor */
      if (r.bottom < window.innerHeight * 0.9) p = 1;
      if (p > best) best = p;
      if (!raf && cur < best) { prev = performance.now(); raf = requestAnimationFrame(tick); } else if (!raf) paint();
    }
    ol.classList.add("is-live");
    layout();
    scrollTasks.push(update);
    if ("ResizeObserver" in window) new ResizeObserver(layout).observe(ol);
    reduceMQ.addEventListener("change", update);
  }

  /* ---------- testimonials: layered stack, Prev / Next / Pause ---------- */
  function initTestimonials() {
    var shell = $("[data-testi]");
    if (!shell) return;
    var stage = $("[data-testi-stage]", shell);

    var slides = $$(".tcard", stage), n = slides.length;
    if (n < 2) { var c0 = $("[data-testi-controls]", shell); if (c0) c0.hidden = true; return; }
    var prev = $("[data-testi-prev]", shell), next = $("[data-testi-next]", shell), toggle = $("[data-testi-toggle]", shell);
    var idxEl = $("[data-testi-index]", shell), totalEl = $("[data-testi-total]", shell), toggleLabel = $("[data-testi-toggle-label]", shell);
    var index = 0, timer = 0, userPaused = false, hovering = false, focused = false, inView = true;
    if (totalEl) totalEl.textContent = n;
    slides.forEach(function (s, i) { s.setAttribute("aria-label", (i + 1) + " of " + n); });

    function running() { return !reduceMQ.matches && !userPaused && !hovering && !focused && inView && !document.hidden; }
    function render() {
      slides.forEach(function (s, i) {
        var rel = (i - index + n) % n, lim = Math.min(3, n), pos;
        if (rel < lim) pos = String(rel); else pos = (rel === n - 1) ? "out" : "wait";
        s.setAttribute("data-pos", pos);
        if (pos === "0") { s.removeAttribute("aria-hidden"); s.removeAttribute("inert"); }
        else { s.setAttribute("aria-hidden", "true"); s.setAttribute("inert", ""); }
      });
      if (idxEl) idxEl.textContent = index + 1;
    }
    function sync() {
      clearInterval(timer); timer = 0;
      var run = running();
      stage.setAttribute("aria-live", run ? "off" : "polite");
      if (run) timer = setInterval(function () { go(1, true); }, 7000);
    }
    function go(step) { index = (index + step + n) % n; render(); }

    prev.addEventListener("click", function () { go(-1); });
    next.addEventListener("click", function () { go(1); });
    shell.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { go(-1); e.preventDefault(); }
      else if (e.key === "ArrowRight") { go(1); e.preventDefault(); }
    });
    shell.addEventListener("mouseenter", function () { hovering = true; sync(); });
    shell.addEventListener("mouseleave", function () { hovering = false; sync(); });
    shell.addEventListener("focusin", function () { focused = true; sync(); });
    shell.addEventListener("focusout", function (e) { if (!shell.contains(e.relatedTarget)) { focused = false; sync(); } });
    document.addEventListener("visibilitychange", sync);
    reduceMQ.addEventListener("change", function () { if (toggle) toggle.hidden = reduceMQ.matches; sync(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; sync(); }, { threshold: 0.25 }).observe(shell);
    }
    if (toggle) {
      toggle.hidden = reduceMQ.matches; // nothing autoplays under reduced motion, so nothing to pause
      toggle.addEventListener("click", function () {
        userPaused = !userPaused;
        toggle.setAttribute("aria-pressed", userPaused ? "true" : "false");
        if (toggleLabel) toggleLabel.textContent = userPaused ? "Play" : "Pause";
        sync();
      });
    }
    render(); sync();
  }

  /* ---------- sticky mobile bar: visible from first paint, hidden at final CTA + footer ---------- */
  function initSticky() {
    var bar = $("[data-sticky-bar]");
    if (!bar) return;
    var targets = $$("[data-hide-sticky]"), seen = 0;
    if (!("IntersectionObserver" in window)) { bar.classList.add("is-visible"); return; }
    var state = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { state.set(en.target, en.isIntersecting); });
      seen = 0; state.forEach(function (v) { if (v) seen++; });
      bar.classList.toggle("is-visible", seen === 0);
    }, { threshold: 0.15 });
    targets.forEach(function (t) { io.observe(t); });
    bar.classList.add("is-visible");
  }

  /* ---------- boot ---------- */
  [initYear, initHeader, initMenu, initReveal, initParallax, initCounters,
   initPathway, initSteps, initTestimonials, initSticky].forEach(safe);

  scrollTasks.forEach(function (t) { safe(t); });
  root.classList.add("js-ready");
})();
