/* ============================================================
   MAARIFAT-UL-ULOOM — SCROLL-SCRUBBED HERO FILM
   The hero gets a tall runway; its content sticks to the viewport while the page scrolls,
   and the scroll position picks the film frame drawn on <canvas data-hero-scrub="folder/">.
   Frames: folder/manifest.json {count, pattern}. Phones load every 2nd frame.
   Reduced motion: no pin, one still frame. Frames load progressively (first frame first).
   ============================================================ */
(function () {
  "use strict";
  var cv = document.querySelector("canvas[data-hero-scrub]");
  if (!cv || !window.fetch) return;
  var hero = cv.closest("section"), folder = cv.getAttribute("data-hero-scrub");
  var ctx = cv.getContext("2d");
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var small = window.matchMedia("(max-width: 767px)").matches;
  var frames = [], count = 0, step = small ? 2 : 1, want = 0, drawn = -1, W = 0, H = 0, dpr = 1;

  /* wrap the hero's children in a sticky stage */
  var stage = document.createElement("div"); stage.className = "hero__stage";
  while (hero.firstChild) stage.appendChild(hero.firstChild);
  hero.appendChild(stage);

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function size() {
    var r = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    drawn = -1; draw();
  }
  function nearest(i) {
    for (var d = 0; d < frames.length; d++) {
      if (frames[i - d] && frames[i - d].ok) return frames[i - d];
      if (frames[i + d] && frames[i + d].ok) return frames[i + d];
    }
    return null;
  }
  function draw() {
    var img = nearest(want);
    if (!img) return;
    var key = frames.indexOf(img);
    if (key === drawn) return;
    drawn = key;
    /* cover-fit; on narrow screens keep the right-hand subject (the film's left side is empty for the headline) */
    var iw = img.naturalWidth, ih = img.naturalHeight, s = Math.max(cv.width / iw, cv.height / ih);
    var dw = iw * s, dh = ih * s, fx = W < 768 ? 0.62 : 0.5;
    ctx.drawImage(img, (cv.width - dw) * fx, (cv.height - dh) / 2, dw, dh);
  }
  function progress() {
    var r = hero.getBoundingClientRect(), run = Math.max(1, r.height - window.innerHeight);
    return clamp(-r.top / run, 0, 1);
  }
  var ticking = false;
  function update() {
    ticking = false;
    var p = reduceMQ.matches ? 0 : progress();
    hero.style.setProperty("--hp", p.toFixed(4));
    want = Math.round(p * (frames.length - 1));
    draw();
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  function load(i) {
    return new Promise(function (res) {
      var img = new Image(); img.decoding = "async";
      img.onload = function () { img.ok = true; if (Math.abs(i - want) < 3 || drawn < 0) { drawn = -1; draw(); } res(); };
      img.onerror = res;
      img.src = folder + frames.pattern.replace("%04d", String(i * step + 1).padStart(4, "0"));
      frames[i] = img;
    });
  }

  fetch(folder + "manifest.json").then(function (r) { return r.json(); }).then(function (m) {
    count = Math.floor((m.count - 1) / step) + 1;
    frames.length = count; frames.pattern = m.pattern;
    hero.classList.add("is-film");
    size();
    return load(0).then(function () {
      hero.classList.add("is-film-ready");
      if (reduceMQ.matches) return;
      /* then every 8th frame (coarse scrub works early), then the rest */
      var order = [], seen = {};
      [8, 4, 2, 1].forEach(function (k) { for (var i = 0; i < count; i += k) if (!seen[i]) { seen[i] = 1; order.push(i); } });
      var q = order.slice(1), running = 0;
      (function pump() {
        while (running < 6 && q.length) { running++; load(q.shift()).then(function () { running--; pump(); }); }
      })();
    });
  }).catch(function () { /* no frames: the hero keeps its photo + geometry */ });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { size(); update(); });
  reduceMQ.addEventListener && reduceMQ.addEventListener("change", update);
  update();
})();
