/* ============================================================
   MAARIFAT-UL-ULOOM — SCROLL SCENES
   1) [data-sp]    : sets --sp (0 → 1) as the element travels through the viewport.
                     CSS turns it into parallax / zoom (see "SCROLL SCENES" in home.css / pages.css).
   2) [data-scene] : desktop pin. The section gets a tall runway, its .container sticks under the header,
                     --sp runs 0 → 1 across the runway and the children listed in data-scene-items become
                     .is-active one after another. Oversized content is scaled to fit the viewport.
   Reduced motion, phones and no-JS: nothing pins, nothing moves, content stays static and visible.
   ============================================================ */
(function () {
  "use strict";
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var pinMQ = window.matchMedia("(min-width: 1024px) and (min-height: 560px)");
  var root = document.documentElement;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function headerH() { return parseFloat(getComputedStyle(root).getPropertyValue("--header-h")) || 76; }

  var floats = [].slice.call(document.querySelectorAll("[data-sp]"));
  var scenes = [].slice.call(document.querySelectorAll("[data-scene]")).map(function (sec) {
    return { el: sec, box: sec.querySelector(".container"), items: [].slice.call(sec.querySelectorAll(sec.getAttribute("data-scene-items") || "[data-scene-item]")) };
  });
  if (!floats.length && !scenes.length) return;

  function motionOn() { return !reduceMQ.matches; }

  function fit() {
    var on = motionOn() && pinMQ.matches;
    scenes.forEach(function (s) {
      s.el.classList.toggle("is-scene", on);
      s.box.style.transform = "";
      if (!on) { s.items.forEach(function (it) { it.classList.remove("is-active", "is-past"); }); return; }
      /* natural height → scale to fit, then centre it in the space under the header */
      var room = window.innerHeight - headerH() - 40, h = s.box.offsetHeight, k = Math.min(1, room / h);
      if (k < 1) s.box.style.transform = "scale(" + k.toFixed(3) + ")";
      s.el.style.setProperty("--scene-top", (headerH() + (window.innerHeight - headerH() - h * k) / 2).toFixed(0) + "px");
    });
    frame();
  }

  var ticking = false;
  function frame() {
    ticking = false;
    var vh = window.innerHeight, on = motionOn();
    floats.forEach(function (el) {
      if (!on) { el.style.removeProperty("--sp"); return; }
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      /* 0 when the element's top enters the bottom of the viewport, 1 when its bottom leaves the top */
      el.style.setProperty("--sp", clamp((vh - r.top) / (vh + r.height), 0, 1).toFixed(4));
    });
    scenes.forEach(function (s) {
      if (!s.el.classList.contains("is-scene")) return;
      var r = s.el.getBoundingClientRect(), run = Math.max(1, r.height - (vh - headerH()));
      var p = clamp((headerH() - r.top) / run, 0, 1);
      s.el.style.setProperty("--sp", p.toFixed(4));
      /* spread the items over the first 88% so the last one rests on screen before the pin releases */
      var n = s.items.length, idx = Math.min(n - 1, Math.floor(clamp(p / 0.88, 0, 0.9999) * n));
      s.items.forEach(function (it, i) { it.classList.toggle("is-active", i === idx); it.classList.toggle("is-past", i < idx); });
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", fit);
  pinMQ.addEventListener("change", fit);
  reduceMQ.addEventListener("change", fit);
  window.addEventListener("load", fit);
  fit();
})();
