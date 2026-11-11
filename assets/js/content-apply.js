// ============================================================
// Maarifat-ul-Uloom Academy — Content Apply
// Runs on every public page (NOT admin), before public-sync.js and home.js.
// Reads MUA_CMS content and:
//   1. (Theme: the redesigned public pages have one fixed palette, so the
//      admin "default theme" setting is intentionally not applied.)
//   2. Swaps the logo everywhere, if an admin-uploaded one exists
//   3. Fills in contact info, social links, and stats
//   4. Fills in editable text blocks marked with [data-cms="path"]
//   5. Fills the free-trial form's course list from the stored courses
// (Courses, steps, testimonials and FAQs are handled by public-sync.js;
//  the legacy card/grid/accordion renderers were removed in Step 7 because
//  the redesigned pages no longer contain those containers.)
// ============================================================

(function () {
  "use strict";
  if (!window.MUA_CMS) return;
  var content = window.MUA_CMS.getContent();

  /* ---------- helpers ---------- */
  function byPath(obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* ---------- 1. Site-wide default theme ---------- */
  // Applying the theme itself is handled by main.js's initTheme(), which
  // consults MUA_CMS directly — this keeps a single source of truth and
  // avoids a race between this script and main.js on page load.

  /* ---------- 2. Logo ---------- */
  if (content.logoUrl) {
    document.querySelectorAll(".cms-logo").forEach(function (img) {
      img.src = content.logoUrl;
    });
  }

  /* ---------- 3. Contact info, socials, stats ---------- */
  document.querySelectorAll("[data-contact-value]").forEach(function (el) {
    var key = el.getAttribute("data-contact-value");
    var val = byPath(content, "contact." + key);
    if (val === undefined) return;
    el.textContent = val;
  });
  document.querySelectorAll("[data-contact-href]").forEach(function (el) {
    var key = el.getAttribute("data-contact-href");
    var val = byPath(content, "contact." + key);
    if (val === undefined) return;
    if (key === "email") el.href = "mailto:" + val;
    else if (key === "phoneMale" || key === "phoneFemale") {
      el.href = "tel:" + val.replace(/[^+\d]/g, "");
    } else {
      el.href = val;
    }
  });
  document.querySelectorAll("[data-social]").forEach(function (el) {
    var key = el.getAttribute("data-social");
    var val = byPath(content, "socials." + key);
    if (val) el.href = val;
  });

  /* ---------- 4. Generic editable text ---------- */
  document.querySelectorAll("[data-cms]").forEach(function (el) {
    var path = el.getAttribute("data-cms");
    var val = byPath(content, path);
    if (val === undefined) return;
    el.textContent = val;
  });
  // Same as above, but preserves simple inline HTML (e.g. <strong>) in the
  // stored string — used only for the handful of fields that need it.
  document.querySelectorAll("[data-cms-html]").forEach(function (el) {
    var path = el.getAttribute("data-cms-html");
    var val = byPath(content, path);
    if (val === undefined) return;
    el.innerHTML = val;
  });

  /* ---------- 5. Free-trial form course list ---------- */
  var courseSelect = document.querySelector("[data-course-select]");
  if (courseSelect) {
    courseSelect.innerHTML = content.courses
      .map(function (c) {
        return '<option value="' + c.id + '">' + escapeHtml(c.title) + "</option>";
      })
      .join("");
  }
})();
