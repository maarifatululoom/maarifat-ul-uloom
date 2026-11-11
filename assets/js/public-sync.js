/* ============================================================
   MAARIFAT-UL-ULOOM ACADEMY — PUBLIC CONTENT SYNC (Step 7)

   The Admin Panel saves everything to MUA_CMS (content-store.js, localStorage key "mua-content-v1").
   content-apply.js already handles logo, contact details, social links and [data-cms] text.
   This file carries the rest of the admin-managed content onto the four redesigned public pages:
     - Courses      titles + descriptions edited; courses removed; courses added (Courses page, form list)
     - How It Works the six step titles/descriptions (Home and About)
     - Testimonials the Home carousel
     - FAQs         the About page accordion
     - Text         hero headline / buttons, pricing note, Contact intro   ([data-sync] / [data-sync-html])

   THE "CHANGED-ONLY" RULE
   The redesigned pages use carefully edited copy (sentence-case step titles, shorter button labels…).
   A value from the store is applied ONLY when the admin has changed it from the shipped default
   (compared with MUA_CMS.getDefaultContent()). Untouched fields keep the designed copy; edited fields always win.
   "Reset to defaults" in the Admin therefore returns each page to its designed copy.

   Runs synchronously before home.js so that the carousel, pathway and step-rail initialisers see the final DOM.
   Never throws: every block is wrapped, and with no store / no JS the static HTML is simply what visitors see.
   NOTE: the store lives in the admin's browser (localStorage). There is no server, so other visitors see the
   shipped HTML until the site is rebuilt. See CONTENT-ARCHITECTURE.md.
   ============================================================ */
(function () {
  "use strict";
  if (!window.MUA_CMS) return;
  var cms, def;
  try { cms = window.MUA_CMS.getContent(); def = window.MUA_CMS.getDefaultContent(); } catch (e) { return; }
  if (!cms || !def) return;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.warn("[public-sync]", e); } }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function byPath(o, p) { return p.split(".").reduce(function (a, k) { return a && a[k] !== undefined ? a[k] : undefined; }, o); }
  function clean(v) { return typeof v === "string" && v.trim() ? v.trim() : ""; }
  var WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
  function countWord(n) { return n <= 10 ? WORDS[n] : String(n); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  /* ---------- text fields: only when changed ---------- */
  function syncText() {
    $$("[data-sync]").forEach(function (el) {
      var p = el.getAttribute("data-sync"), v = clean(byPath(cms, p));
      if (!v || v === byPath(def, p)) return;
      el.textContent = v + (el.getAttribute("data-sync-suffix") || "");
    });
    /* the stored string may contain <strong>…</strong>; nothing else is ever inserted as markup */
    $$("[data-sync-html]").forEach(function (el) {
      var p = el.getAttribute("data-sync-html"), v = clean(byPath(cms, p));
      if (!v || v === byPath(def, p)) return;
      el.innerHTML = v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/&lt;(\/?)strong&gt;/gi, "<$1strong>");
    });
  }

  /* ---------- How It Works: six steps on Home and About ---------- */
  function syncSteps() {
    var s = cms.howItWorks && cms.howItWorks.steps, d = def.howItWorks.steps;
    if (!Array.isArray(s)) return;
    $$("[data-steps]").forEach(function (ol) {
      $$(".step", ol).forEach(function (li, i) {
        if (!s[i] || same(s[i], d[i])) return;
        var h = $("h3", li), p = $(".step__body > p:not(.label)", li);
        if (h && clean(s[i].title)) h.textContent = s[i].title;
        if (p && clean(s[i].desc)) p.textContent = s[i].desc;
      });
    });
  }

  /* ---------- Testimonials: Home carousel ---------- */
  function syncTestimonials() {
    var stage = $("[data-testi-stage]");
    var t = cms.testimonials;
    if (!stage || !Array.isArray(t) || same(t, def.testimonials)) return;
    if (!t.length) { var sec = $("#testimonials"); if (sec) sec.hidden = true; return; }
    stage.textContent = "";
    t.forEach(function (x) {
      var card = document.createElement("div"); card.className = "tcard";
      card.setAttribute("role", "group"); card.setAttribute("aria-roledescription", "slide");
      var mark = document.createElement("span"); mark.className = "tcard__mark"; mark.setAttribute("aria-hidden", "true"); mark.textContent = "“";
      var fig = document.createElement("figure"), bq = document.createElement("blockquote"), p = document.createElement("p");
      p.textContent = x.quote; bq.appendChild(p);
      var cap = document.createElement("figcaption"); cap.textContent = x.name;
      fig.appendChild(bq); fig.appendChild(cap); card.appendChild(mark); card.appendChild(fig); stage.appendChild(card);
    });
  }

  /* ---------- FAQs: About accordion (native <details>) ---------- */
  function syncFaqs() {
    var box = $("[data-faq-list]"), f = cms.faqs;
    if (!box || !Array.isArray(f) || same(f, def.faqs)) return;
    box.textContent = "";
    if (!f.length) { box.hidden = true; return; }
    f.forEach(function (x) {
      var d = document.createElement("details"), s = document.createElement("summary"), a = document.createElement("div"), p = document.createElement("p");
      s.textContent = x.q; a.className = "faq__a"; p.textContent = x.a; a.appendChild(p); d.appendChild(s); d.appendChild(a); box.appendChild(d);
    });
  }

  /* ---------- Courses ---------- */
  var GROUP_OF = { "quran-studies": "quran", "islamic-studies": "islamic", "language-learning": "language" };
  var GROUP_NAME = { quran: "Quran studies", islamic: "Islamic studies", language: "Language learning" };

  function courseText(root, c) {
    var t = $("[data-course-title]", root), d = $("[data-course-desc]", root);
    if (t && clean(c.title)) {
      t.textContent = c.title;
      $$(".sr-only", root).forEach(function (s) { s.textContent = s.textContent.replace(/(: | for ).*$/, "$1" + c.title); });
    }
    if (d && clean(c.desc)) d.textContent = c.desc;
  }

  function syncCourses() {
    var list = cms.courses;
    if (!Array.isArray(list) || same(list, def.courses)) return;
    var byId = {}; list.forEach(function (c) { byId[c.id] = c; });
    var defById = {}; def.courses.forEach(function (c) { defById[c.id] = c; });

    /* 1. edited titles / descriptions, 2. removed courses (Home pathway + Courses page) */
    $$("[data-course-id]").forEach(function (el) {
      var id = el.getAttribute("data-course-id"), c = byId[id];
      if (!c) { el.parentNode.removeChild(el); return; }
      if (!same(c, defById[id])) courseText(el, c);
    });

    /* 3. added courses appear on the Courses page, in the group for their category */
    var page = $(".courses-page");
    if (page) {
      var rosette = $(".course__plate svg", page);
      list.forEach(function (c) {
        if (defById[c.id] || $('[data-course-id="' + c.id + '"]', page)) return;
        var gid = GROUP_OF[c.category] || "quran", sec = document.getElementById(gid);
        if (!sec) return;
        var a = document.createElement("article");
        a.className = "course"; a.id = c.id; a.setAttribute("data-course-id", c.id); a.setAttribute("aria-labelledby", c.id + "-title");
        var plate = document.createElement("div"); plate.className = "course__plate reveal"; plate.setAttribute("aria-hidden", "true");
        if (rosette) plate.appendChild(rosette.cloneNode(true));
        plate.appendChild(document.createElement("span"));
        var body = document.createElement("div"); body.className = "course__body reveal"; body.style.setProperty("--i", "1");
        var lab = document.createElement("p"); lab.className = "label";
        var h = document.createElement("h3"); h.id = c.id + "-title"; h.setAttribute("data-course-title", ""); h.textContent = c.title;
        var d = document.createElement("p"); d.className = "course__desc"; d.setAttribute("data-course-desc", ""); d.textContent = c.desc;
        var cta = document.createElement("a"); cta.className = "btn btn--primary"; cta.href = "contact?course=" + encodeURIComponent(c.id);
        cta.appendChild(document.createTextNode("Start Free Trial"));
        var sr = document.createElement("span"); sr.className = "sr-only"; sr.textContent = " for " + c.title; cta.appendChild(sr);
        body.appendChild(lab); body.appendChild(h); body.appendChild(d); body.appendChild(cta);
        a.appendChild(plate); a.appendChild(body); sec.appendChild(a);
      });

      /* 4. renumber, re-flip, recount groups and hide empty ones */
      var n = 0;
      $$(".cgroup", page).forEach(function (g) {
        var items = $$(".course", g);
        var lab = $(".cgroup__head .label", g);
        if (lab) lab.textContent = countWord(items.length) + (items.length === 1 ? " course" : " courses");
        g.hidden = !items.length;
        var link = $('.jump a[href="#' + g.id + '"]'); if (link) link.hidden = !items.length;
        items.forEach(function (it) {
          n++;
          it.classList.toggle("course--flip", n % 2 === 0);
          var l = $(".course__body .label", it); if (l) l.textContent = pad(n) + " · " + (GROUP_NAME[g.id] || "");
          var sp = $(".course__plate span", it); if (sp) sp.textContent = pad(n);
        });
      });
    }

    /* 5. Home pathway numbering and any headline that states the course count */
    var k = 0;
    $$(".pstep .card__num").forEach(function (el) { k++; el.textContent = pad(k); });
    var count = list.length;
    if (count !== def.courses.length) {
      var t1 = $("#pathway-title"); if (t1) t1.textContent = "Our courses, one connected path of learning";
      var tc = $(".trust__num [data-count-to]");
      if (tc) { tc.setAttribute("data-count-to", count); tc.textContent = count; }
      var t2 = $(".page-hero #page-title"); if (t2 && /^Seven courses/i.test(t2.textContent)) t2.textContent = "Our courses, one connected path";
    }
  }

  [syncText, syncSteps, syncTestimonials, syncFaqs, syncCourses].forEach(safe);
})();
