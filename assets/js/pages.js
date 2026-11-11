/* ============================================================
   MAARIFAT-UL-ULOOM ACADEMY — PAGE SCRIPT (Step 6)
   For About & How It Works (FAQ) and Contact / Free Trial (form).
   Vanilla JS. Everything here is an enhancement: with JavaScript off,
   the FAQ is native <details> and the form opens the visitor's email app.
   The site has no server, so the form never claims that anything was sent.
   ============================================================ */
(function () {
  "use strict";
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.warn("[pages.js]", e); } }
  var cms = null;
  safe(function () { if (window.MUA_CMS) cms = window.MUA_CMS.getContent(); });

  /* ---------- Free trial form ----------
     FORM_ENDPOINT: paste a Formspree (or similar) URL, e.g. "https://formspree.io/f/abcd1234".
     Empty = no backend: the form prepares the request for WhatsApp / email (never claims it was sent).
     Set = the request is posted there first; on any failure it falls back to WhatsApp / email. */
  var FORM_ENDPOINT = "";

  function initForm() {
    var form = $("[data-trial-form]");
    if (!form) return;
    var ready = $("[data-ready]"), summary = $("[data-ready-summary]"), sum = $("[data-error-summary]");
    var wa = $("[data-send-wa]"), mail = $("[data-send-mail]"), edit = $("[data-edit]");
    var name = $("#f-name"), email = $("#f-email"), course = $("#f-course");
    var contact = (cms && cms.contact) || {};
    var waBase = contact.whatsappMale || "https://wa.me/923075253269";
    var toEmail = contact.email || "maarifatululoom@gmail.com";

    form.setAttribute("novalidate", "");
    form.removeAttribute("action"); form.removeAttribute("method"); form.removeAttribute("enctype");   /* JS handles submit; no-JS keeps the mailto fallback */

    /* ?course=slug from the Courses page */
    var slug = new URLSearchParams(window.location.search).get("course");
    if (slug && course && $$("option", course).some(function (o) { return o.value === slug; })) course.value = slug;

    function fieldOf(el) { return el.closest(".field"); }
    function setError(el, msg) {
      var f = fieldOf(el), err = $(".field__error", f);
      if (err && msg) err.textContent = msg;
      el.setAttribute("aria-invalid", "true");
      if (err) el.setAttribute("aria-describedby", ((el.getAttribute("data-desc") || "") + " " + err.id).trim());
    }
    function clearError(el) {
      el.removeAttribute("aria-invalid");
      var d = el.getAttribute("data-desc");
      if (d) el.setAttribute("aria-describedby", d); else el.removeAttribute("aria-describedby");
    }
    $$("input, textarea, select", form).forEach(function (el) { var d = el.getAttribute("aria-describedby"); if (d) el.setAttribute("data-desc", d); });
    function validate() {
      var bad = [];
      clearError(name); clearError(email);
      if (!name.value.trim()) { setError(name, "Please enter your name."); bad.push(name); }
      var ev = email.value.trim();
      if (!ev) { setError(email, "Please enter your email address."); bad.push(email); }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ev)) { setError(email, "Please enter a valid email address, like name@example.com."); bad.push(email); }
      return bad;
    }
    [name, email].forEach(function (el) {
      el.addEventListener("input", function () { if (el.getAttribute("aria-invalid")) validate(); });
    });

    /* Time zone: preselect from the device (Intl), adding the visitor's own zone if it is not in the list */
    var tz = $("#f-tz");
    function tzText() { return tz && tz.value ? tz.options[tz.selectedIndex].text : ""; }
    try {
      var dz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && dz) {
        if (!$$("option", tz).some(function (o) { return o.value === dz; })) {
          var o = document.createElement("option"); o.value = dz; o.textContent = dz.replace(/_/g, " ") + " (your device)"; tz.insertBefore(o, tz.options[1]);
        }
        tz.value = dz;
      }
    } catch (x) {}

    function value(id) { var el = $(id); return el ? el.value.trim() : ""; }
    function build() {
      var teacher = $("input[name='Preferred teacher']:checked", form);
      var lines = [
        "Assalamu alaikum. I would like to book a free trial class.",
        "",
        "Name: " + name.value.trim(),
        "Email: " + email.value.trim(),
        "Course: " + course.options[course.selectedIndex].text,
        "Preferred teacher: " + (teacher ? teacher.value : "No preference"),
        "Preferred class timing: " + (value("#f-timing") || "Not specified"),
        "Time zone: " + (tzText() || "Not specified")
      ];
      var m = value("#f-message");
      if (m) lines.push("Message: " + m);
      return lines.join("\n");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = validate();
      if (bad.length) {
        sum.textContent = bad.length === 1 ? "There is 1 thing to fix before your request can be prepared." : "There are " + bad.length + " things to fix before your request can be prepared.";
        sum.classList.add("is-shown");
        bad[0].focus();
        return;
      }
      sum.classList.remove("is-shown"); sum.textContent = "";
      var msg = build();
      summary.textContent = msg.split("\n").slice(2).join("\n");
      /* Female teacher chosen → send to the female-teacher number */
      var tSel = $("input[name='Preferred teacher']:checked", form);
      var femaleNum = String(contact.phoneFemale || "+92 371 3518505").replace(/\D/g, "");
      var base = tSel && tSel.value === "Female" && femaleNum ? "https://wa.me/" + femaleNum : waBase;
      wa.href = base + (base.indexOf("?") > -1 ? "&" : "?") + "text=" + encodeURIComponent(msg);
      mail.href = "mailto:" + toEmail + "?subject=" + encodeURIComponent("Free trial class request") + "&body=" + encodeURIComponent(msg);
      var head = $("h2", ready), note = $("p", ready);
      function show(sent) {
        if (head) head.textContent = sent ? "Your request has been sent" : "Your request is ready to send";
        if (note) note.textContent = sent ? "JazakAllahu khairan. The academy will contact you soon. You can also message us directly:" : "Nothing has been sent yet. Choose how you'd like to send these details to the academy:";
        form.hidden = true;
        ready.classList.add("is-shown");
        ready.focus();
        try { ready.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); } catch (x) {}
      }
      if (FORM_ENDPOINT && window.fetch) {
        var btn = $("[type=submit]", form); if (btn) btn.disabled = true;
        fetch(FORM_ENDPOINT, { method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ _subject: "Free trial class request", email: email.value.trim(), message: msg }) })
          .then(function (r) { show(r.ok); }, function () { show(false); })
          .then(function () { if (btn) btn.disabled = false; });
        return;
      }
      show(false);
    });

    edit.addEventListener("click", function () {
      ready.classList.remove("is-shown");
      form.hidden = false;
      name.focus();
    });
  }

  [initForm].forEach(safe);
})();
