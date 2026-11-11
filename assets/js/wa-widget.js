/* ============================================================
   MAARIFAT-UL-ULOOM — WHATSAPP CHOOSER
   Floating WhatsApp button on every page. Opens a small panel with two choices:
   male teacher (brothers / boys) and female teacher (sisters / girls).
   Every "WhatsApp us" button marked data-wa-choose opens the same panel.
   Numbers come from the admin content store when present, otherwise the defaults below.
   ============================================================ */
(function () {
  "use strict";
  var cms = {}; try { cms = (window.MUA_CMS && window.MUA_CMS.getContent()) || {}; } catch (e) {}
  var c = cms.contact || {};
  function digits(v) { return String(v || "").replace(/\D/g, ""); }
  var male = digits(c.phoneMale) || "923075253269";
  var female = digits(c.phoneFemale) || "923713518505";
  function local(n) { return ("0" + n.slice(2)).replace(/^(\d{4})/, "$1 "); }
  var text = encodeURIComponent("Assalamu alaikum. I would like to know more about Maarifat-ul-Uloom Academy classes.");
  var waIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-whatsapp"/></svg>';

  var root = document.createElement("div");
  root.className = "wa";
  root.innerHTML =
    '<div class="wa__panel" id="wa-panel" role="dialog" aria-modal="false" aria-labelledby="wa-title" hidden>' +
      '<div class="wa__head">' + waIcon + '<div><p class="wa__title" id="wa-title">Chat on WhatsApp</p><p class="wa__sub">Talk to a teacher or apply online</p></div>' +
        '<button type="button" class="wa__close" aria-label="Close">&times;</button></div>' +
      '<a class="wa__opt" data-wa-num="' + male + '" target="_blank" rel="noopener" href="https://wa.me/' + male + '?text=' + text + '">' +
        '<span class="wa__av wa__av--m" aria-hidden="true">M</span><span><strong>Male teacher</strong><small>Boys · ' + local(male) + '</small></span>' + waIcon + '</a>' +
      '<a class="wa__opt" data-wa-num="' + female + '" target="_blank" rel="noopener" href="https://wa.me/' + female + '?text=' + text + '">' +
        '<span class="wa__av wa__av--f" aria-hidden="true">F</span><span><strong>Female teacher</strong><small>Girls · ' + local(female) + '</small></span>' + waIcon + '</a>' +
      '<a class="wa__form" href="https://maarifat-ul-uloom-academy.vercel.app/?tab=admission" target="_blank" rel="noopener" >Apply online in our <strong>academy app</strong> &rarr;</a>' +
      '<p class="wa__note">We usually reply within a few hours.</p>' +
    '</div>' +
    '<button type="button" class="wa__fab" aria-expanded="false" aria-controls="wa-panel">' + waIcon + '<span class="wa__label">WhatsApp</span></button>';
  document.body.appendChild(root);

  var panel = root.querySelector(".wa__panel"), fab = root.querySelector(".wa__fab");
  var lastTrigger = null;
  var title = root.querySelector(".wa__title"), sub = root.querySelector(".wa__sub"), formLink = root.querySelector(".wa__form");
  var slugNames = { "noorani-qaida": "Noorani Qaida", "quran-reading": "Quran Reading", "tajweed": "Tajweed", "hifz-support": "Hifz Support",
    "islamic-studies": "Islamic Studies", "arabic-language": "Arabic Language", "english-language": "English Language" };
  /* Free-trial buttons: same two numbers, a trial message (with the course when the button names one) and a link to the form */
  function setMode(trigger) {
    var trial = !!(trigger && trigger.hasAttribute && trigger.hasAttribute("data-trial")), msg = text;
    if (trial) {
      var m = /[?&]course=([a-z-]+)/.exec(trigger.getAttribute("href") || ""), course = m && slugNames[m[1]];
      msg = encodeURIComponent("Assalamu alaikum. I would like to book a free trial class" + (course ? " for " + course : "") + " at Maarifat-ul-Uloom Academy.");
    }
    title.textContent = trial ? "Book your free trial" : "Chat on WhatsApp";
    sub.textContent = trial ? "WhatsApp a teacher or apply online" : "Talk to a teacher or apply online";
    [].forEach.call(root.querySelectorAll("[data-wa-num]"), function (a) { a.href = "https://wa.me/" + a.getAttribute("data-wa-num") + "?text=" + msg; });
  }
  /* every "free trial" button that links to the contact page (not the form's own submit, not plain text links) */
  [].forEach.call(document.querySelectorAll("a.btn[href^='contact']"), function (a) {
    if (/free trial/i.test(a.textContent)) a.setAttribute("data-trial", "");
  });

  function open(trigger) {
    setMode(trigger);
    lastTrigger = trigger || fab;
    panel.hidden = false;
    requestAnimationFrame(function () { root.classList.add("is-open"); });
    fab.setAttribute("aria-expanded", "true");
    panel.querySelector(".wa__opt").focus();
  }
  function close() {
    root.classList.remove("is-open");
    fab.setAttribute("aria-expanded", "false");
    setTimeout(function () { if (!root.classList.contains("is-open")) panel.hidden = true; }, 220);
    if (lastTrigger) lastTrigger.focus();
  }
  fab.addEventListener("click", function () { root.classList.contains("is-open") ? close() : open(fab); });
  root.querySelector(".wa__close").addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && root.classList.contains("is-open")) close(); });
  document.addEventListener("click", function (e) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button > 0) return;   /* new-tab clicks still follow the link */
    var t = e.target.closest && e.target.closest("[data-wa-choose], [data-trial]");
    if (t) { e.preventDefault(); open(t); return; }
    if (root.classList.contains("is-open") && !root.contains(e.target)) close();
  });
})();
