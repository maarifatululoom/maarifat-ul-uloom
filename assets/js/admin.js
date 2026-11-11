// ============================================================
// Maarifat-ul-Uloom Academy — Admin Panel logic
// ============================================================

(function () {
  "use strict";
  var CMS = window.MUA_CMS;
  var content = CMS.getContent();

  /* ============================================================
     AUTH / LOGIN
     ============================================================ */
  var loginWrap = document.getElementById("admin-login-wrap");
  var shell = document.getElementById("admin-shell");
  var loginForm = document.getElementById("admin-login-form");
  var loginError = document.getElementById("admin-login-error");

  function showDashboard() {
    loginWrap.style.display = "none";
    shell.classList.add("is-active");
    renderAll();
  }

  function showLogin() {
    shell.classList.remove("is-active");
    loginWrap.style.display = "flex";
  }

  if (CMS.isLoggedIn()) {
    showDashboard();
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var u = document.getElementById("login-username").value.trim();
    var p = document.getElementById("login-password").value;
    if (CMS.login(u, p)) {
      loginError.classList.remove("is-shown");
      showDashboard();
    } else {
      loginError.textContent = "Incorrect username or password. Please try again.";
      loginError.classList.add("is-shown");
    }
  });

  document.getElementById("admin-logout-btn").addEventListener("click", function () {
    CMS.logout();
    showLogin();
  });

  /* ============================================================
     SIDEBAR NAVIGATION
     ============================================================ */
  var navButtons = document.querySelectorAll("[data-admin-nav]");
  var panels = document.querySelectorAll("[data-admin-panel]");

  navButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("data-admin-nav");
      navButtons.forEach(function (b) { b.classList.remove("active"); });
      panels.forEach(function (p) { p.classList.remove("active"); });
      btn.classList.add("active");
      var panel = document.querySelector('[data-admin-panel="' + target + '"]');
      if (panel) panel.classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  /* ============================================================
     TOAST
     ============================================================ */
  var toast = document.getElementById("admin-save-toast");
  var toastTimer = null;
  function showToast(msg) {
    toast.querySelector("span").textContent = msg || "Changes saved — your live site is updated.";
    toast.classList.add("is-shown");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("is-shown");
    }, 2600);
  }

  function persist() {
    CMS.saveContent(content);
    showToast();
  }

  /* ============================================================
     GENERIC FIELD BINDING (simple text/textarea fields)
     data-field="path.to.value" inside a [data-save-section] card
     ============================================================ */
  function byPath(obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
  }
  function setPath(obj, path, value) {
    var parts = path.split(".");
    var cur = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }

  function fillSimpleFields(root) {
    if (!root) return;
    root.querySelectorAll("[data-field]").forEach(function (el) {
      var path = el.getAttribute("data-field");
      var val = byPath(content, path);
      if (val !== undefined) el.value = val;
    });
  }

  function bindSaveButton(sectionSelector) {
    var section = document.querySelector(sectionSelector);
    if (!section) return;
    var saveBtn = section.querySelector("[data-save-btn]");
    if (!saveBtn) return;
    saveBtn.addEventListener("click", function () {
      section.querySelectorAll("[data-field]").forEach(function (el) {
        setPath(content, el.getAttribute("data-field"), el.value);
      });
      persist();
    });
  }

  /* ============================================================
     DASHBOARD OVERVIEW
     ============================================================ */
  function renderOverview() {
    document.getElementById("stat-course-count").textContent = content.courses.length;
    document.getElementById("stat-testimonial-count").textContent = content.testimonials.length;
    document.getElementById("stat-faq-count").textContent = content.faqs.length;
    document.getElementById("stat-theme").textContent = content.theme === "dark" ? "Dark" : "Light";
  }

  /* ============================================================
     SITE SETTINGS (contact + socials + logo)
     ============================================================ */
  function initSiteSettings() {
    var section = document.querySelector('[data-admin-panel="site-settings"]');
    fillSimpleFields(section);
    bindSaveButton('[data-admin-panel="site-settings"]');

    // Logo preview + upload
    var preview = document.getElementById("logo-preview-img");
    preview.src = content.logoUrl || "assets/img/logo-mark.svg";
    document.getElementById("logo-upload-input").addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        content.logoUrl = reader.result;
        preview.src = reader.result;
        persist();
      };
      reader.readAsDataURL(file);
    });
    document.getElementById("logo-reset-btn").addEventListener("click", function () {
      content.logoUrl = null;
      preview.src = "assets/img/logo-mark.svg";
      persist();
    });
  }

  /* ============================================================
     THEME SWITCHER
     ============================================================ */
  function initTheme() {
    var cards = document.querySelectorAll("[data-theme-option]");
    function refresh() {
      cards.forEach(function (c) {
        c.classList.toggle("selected", c.getAttribute("data-theme-option") === content.theme);
      });
    }
    refresh();
    cards.forEach(function (card) {
      card.addEventListener("click", function () {
        content.theme = card.getAttribute("data-theme-option");
        refresh();
        persist();
        renderOverview();
      });
    });
  }

  /* ============================================================
     HOME PAGE TEXT
     ============================================================ */
  function initHomeSection() {
    var section = document.querySelector('[data-admin-panel="home"]');
    fillSimpleFields(section);
    bindSaveButton('[data-admin-panel="home"]');
  }

  /* ============================================================
     ABOUT PAGE TEXT
     ============================================================ */
  function initAboutSection() {
    var section = document.querySelector('[data-admin-panel="about"]');
    fillSimpleFields(section);
    bindSaveButton('[data-admin-panel="about"]');
  }

  /* ============================================================
     HOW IT WORKS (6 fixed steps — text only)
     ============================================================ */
  function initHowItWorksSection() {
    var section = document.querySelector('[data-admin-panel="how-it-works"]');
    fillSimpleFields(section);
    content.howItWorks.steps.forEach(function (step, i) {
      var titleEl = document.getElementById("step-title-" + i);
      var descEl = document.getElementById("step-desc-" + i);
      if (titleEl) titleEl.value = step.title;
      if (descEl) descEl.value = step.desc;
    });
    var saveBtn = section.querySelector("[data-save-btn]");
    saveBtn.addEventListener("click", function () {
      section.querySelectorAll("[data-field]").forEach(function (el) {
        setPath(content, el.getAttribute("data-field"), el.value);
      });
      content.howItWorks.steps.forEach(function (step, i) {
        var titleEl = document.getElementById("step-title-" + i);
        var descEl = document.getElementById("step-desc-" + i);
        if (titleEl) step.title = titleEl.value;
        if (descEl) step.desc = descEl.value;
      });
      persist();
    });
  }

  /* ============================================================
     CONTACT PAGE TEXT
     ============================================================ */
  function initContactSection() {
    var section = document.querySelector('[data-admin-panel="contact"]');
    fillSimpleFields(section);
    bindSaveButton('[data-admin-panel="contact"]');
  }

  /* ============================================================
     ACCOUNT / PASSWORD
     ============================================================ */
  function initAccountSection() {
    var auth = CMS.getAuth();
    document.getElementById("account-username-display").textContent = auth.username;
    var form = document.getElementById("account-password-form");
    var msg = document.getElementById("account-password-msg");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var newUser = document.getElementById("account-new-username").value.trim();
      var newPass = document.getElementById("account-new-password").value;
      var confirmPass = document.getElementById("account-confirm-password").value;
      msg.classList.remove("is-shown");
      if (!newUser || !newPass) {
        msg.textContent = "Please fill in both the username and new password.";
        msg.classList.add("is-shown");
        return;
      }
      if (newPass !== confirmPass) {
        msg.textContent = "Passwords do not match. Please try again.";
        msg.classList.add("is-shown");
        return;
      }
      if (newPass.length < 6) {
        msg.textContent = "Please choose a password at least 6 characters long.";
        msg.classList.add("is-shown");
        return;
      }
      CMS.saveAuth({ username: newUser, password: newPass });
      document.getElementById("account-username-display").textContent = newUser;
      form.reset();
      showToast("Login credentials updated.");
    });
  }

  /* ============================================================
     REPEATABLE LIST HELPERS (courses / testimonials / faqs)
     ============================================================ */
  function iconOptionsMarkup(selectedIcon) {
    return Object.keys(CMS.ICONS)
      .map(function (key) {
        var sel = key === selectedIcon ? " selected" : "";
        return (
          '<div class="admin-icon-option' + sel + '" data-icon-choice="' + key + '" title="' + CMS.ICON_LABELS[key] + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + CMS.ICONS[key] + "</svg>" +
          "</div>"
        );
      })
      .join("");
  }

  var CATEGORY_LABELS = {
    "quran-studies": "Quran Studies",
    "islamic-studies": "Islamic Studies",
    "language-learning": "Language Learning"
  };

  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, "&quot;");
  }

  function renderCourses() {
    var list = document.getElementById("courses-list");
    list.innerHTML = content.courses
      .map(function (c, i) {
        return (
          '<div class="admin-repeat-item" data-course-index="' + i + '">' +
          '<button class="admin-repeat-remove" data-remove-course="' + i + '" aria-label="Remove course" title="Remove course">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
          '<div class="admin-form-grid">' +
          '<div class="admin-form-row"><label>Course Title</label><input class="admin-input" data-course-field="title" value="' + escapeAttr(c.title) + '"></div>' +
          '<div class="admin-form-row"><label>Category</label><select class="admin-select" data-course-field="category">' +
          Object.keys(CATEGORY_LABELS).map(function (key) {
            return '<option value="' + key + '"' + (key === c.category ? " selected" : "") + ">" + CATEGORY_LABELS[key] + "</option>";
          }).join("") +
          "</select></div>" +
          "</div>" +
          '<div class="admin-form-row"><label>Description</label><textarea class="admin-textarea" data-course-field="desc">' + escapeHtml(c.desc) + "</textarea></div>" +
          '<div class="admin-form-row"><label>Icon</label><div class="admin-icon-grid" data-icon-picker>' + iconOptionsMarkup(c.icon) + "</div></div>" +
          "</div>"
        );
      })
      .join("") || '<p class="admin-empty-state">No courses yet — add your first one below.</p>';

    list.querySelectorAll("[data-course-index]").forEach(function (item) {
      var idx = parseInt(item.getAttribute("data-course-index"), 10);
      item.querySelectorAll("[data-icon-choice]").forEach(function (opt) {
        opt.addEventListener("click", function () {
          content.courses[idx].icon = opt.getAttribute("data-icon-choice");
          item.querySelectorAll("[data-icon-choice]").forEach(function (o) { o.classList.remove("selected"); });
          opt.classList.add("selected");
        });
      });
      item.querySelector('[data-remove-course]').addEventListener("click", function () {
        if (!confirm("Remove this course? This cannot be undone.")) return;
        content.courses.splice(idx, 1);
        persist();
        renderCourses();
        renderOverview();
      });
    });
  }

  function collectCourses() {
    document.querySelectorAll("#courses-list [data-course-index]").forEach(function (item) {
      var idx = parseInt(item.getAttribute("data-course-index"), 10);
      var course = content.courses[idx];
      if (!course) return;
      item.querySelectorAll("[data-course-field]").forEach(function (el) {
        var field = el.getAttribute("data-course-field");
        course[field] = el.value;
      });
      course.tag = CATEGORY_LABELS[course.category] || course.tag;
    });
  }

  function initCoursesSection() {
    renderCourses();
    document.getElementById("add-course-btn").addEventListener("click", function () {
      var slug = "course-" + Date.now();
      content.courses.push({
        id: slug,
        title: "New Course",
        category: "quran-studies",
        tag: "Quran Studies",
        icon: "book",
        desc: "Describe what students learn in this course."
      });
      renderCourses();
      renderOverview();
    });
    document.getElementById("save-courses-btn").addEventListener("click", function () {
      collectCourses();
      persist();
      renderCourses();
    });
  }

  function renderTestimonials() {
    var list = document.getElementById("testimonials-list");
    list.innerHTML = content.testimonials
      .map(function (t, i) {
        return (
          '<div class="admin-repeat-item" data-testi-index="' + i + '">' +
          '<button class="admin-repeat-remove" data-remove-testi="' + i + '" aria-label="Remove testimonial" title="Remove testimonial">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
          '<div class="admin-form-row"><label>Quote</label><textarea class="admin-textarea" data-testi-field="quote">' + escapeHtml(t.quote) + "</textarea></div>" +
          '<div class="admin-form-row"><label>Attribution (e.g. "Parent — United Kingdom")</label><input class="admin-input" data-testi-field="name" value="' + escapeAttr(t.name) + '"></div>' +
          "</div>"
        );
      })
      .join("") || '<p class="admin-empty-state">No testimonials yet — add your first one below.</p>';

    list.querySelectorAll("[data-testi-index]").forEach(function (item) {
      var idx = parseInt(item.getAttribute("data-testi-index"), 10);
      item.querySelector("[data-remove-testi]").addEventListener("click", function () {
        if (!confirm("Remove this testimonial? This cannot be undone.")) return;
        content.testimonials.splice(idx, 1);
        persist();
        renderTestimonials();
        renderOverview();
      });
    });
  }

  function collectTestimonials() {
    document.querySelectorAll("#testimonials-list [data-testi-index]").forEach(function (item) {
      var idx = parseInt(item.getAttribute("data-testi-index"), 10);
      var t = content.testimonials[idx];
      if (!t) return;
      item.querySelectorAll("[data-testi-field]").forEach(function (el) {
        t[el.getAttribute("data-testi-field")] = el.value;
      });
    });
  }

  function initTestimonialsSection() {
    renderTestimonials();
    document.getElementById("add-testimonial-btn").addEventListener("click", function () {
      content.testimonials.push({ quote: "New testimonial text goes here.", name: "Parent — Country" });
      renderTestimonials();
      renderOverview();
    });
    document.getElementById("save-testimonials-btn").addEventListener("click", function () {
      collectTestimonials();
      persist();
      renderTestimonials();
    });
  }

  function renderFaqs() {
    var list = document.getElementById("faqs-list");
    list.innerHTML = content.faqs
      .map(function (f, i) {
        return (
          '<div class="admin-repeat-item" data-faq-index="' + i + '">' +
          '<button class="admin-repeat-remove" data-remove-faq="' + i + '" aria-label="Remove question" title="Remove question">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
          '<div class="admin-form-row"><label>Question</label><input class="admin-input" data-faq-field="q" value="' + escapeAttr(f.q) + '"></div>' +
          '<div class="admin-form-row"><label>Answer</label><textarea class="admin-textarea" data-faq-field="a">' + escapeHtml(f.a) + "</textarea></div>" +
          "</div>"
        );
      })
      .join("") || '<p class="admin-empty-state">No FAQs yet — add your first one below.</p>';

    list.querySelectorAll("[data-faq-index]").forEach(function (item) {
      var idx = parseInt(item.getAttribute("data-faq-index"), 10);
      item.querySelector("[data-remove-faq]").addEventListener("click", function () {
        if (!confirm("Remove this question? This cannot be undone.")) return;
        content.faqs.splice(idx, 1);
        persist();
        renderFaqs();
        renderOverview();
      });
    });
  }

  function collectFaqs() {
    document.querySelectorAll("#faqs-list [data-faq-index]").forEach(function (item) {
      var idx = parseInt(item.getAttribute("data-faq-index"), 10);
      var f = content.faqs[idx];
      if (!f) return;
      item.querySelectorAll("[data-faq-field]").forEach(function (el) {
        f[el.getAttribute("data-faq-field")] = el.value;
      });
    });
  }

  function initFaqsSection() {
    renderFaqs();
    document.getElementById("add-faq-btn").addEventListener("click", function () {
      content.faqs.push({ q: "New question?", a: "Answer goes here." });
      renderFaqs();
      renderOverview();
    });
    document.getElementById("save-faqs-btn").addEventListener("click", function () {
      collectFaqs();
      persist();
      renderFaqs();
    });
  }

  /* ============================================================
     RESET TO DEFAULTS
     ============================================================ */
  document.getElementById("reset-defaults-btn").addEventListener("click", function () {
    if (!confirm("Reset ALL content back to the original defaults? This cannot be undone.")) return;
    CMS.resetContent();
    content = CMS.getContent();
    renderAll();
    showToast("Everything has been reset to the original defaults.");
  });

  /* ============================================================
     EXPORT / IMPORT BACKUP
     ============================================================ */
  document.getElementById("export-content-btn").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "mua-content-backup.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  document.getElementById("import-content-input").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(reader.result);
        content = parsed;
        persist();
        renderAll();
        showToast("Backup imported successfully.");
      } catch (err) {
        alert("That file doesn't look like a valid backup. Please choose a JSON file exported from this Admin Panel.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  /* ============================================================
     INIT EVERYTHING (once, after login)
     ============================================================ */
  var initialized = false;
  function renderAll() {
    renderOverview();
    if (initialized) {
      fillSimpleFields(document.querySelector('[data-admin-panel="site-settings"]'));
      fillSimpleFields(document.querySelector('[data-admin-panel="home"]'));
      fillSimpleFields(document.querySelector('[data-admin-panel="about"]'));
      fillSimpleFields(document.querySelector('[data-admin-panel="how-it-works"]'));
      fillSimpleFields(document.querySelector('[data-admin-panel="contact"]'));
      content.howItWorks.steps.forEach(function (step, i) {
        var titleEl = document.getElementById("step-title-" + i);
        var descEl = document.getElementById("step-desc-" + i);
        if (titleEl) titleEl.value = step.title;
        if (descEl) descEl.value = step.desc;
      });
      document.getElementById("logo-preview-img").src = content.logoUrl || "assets/img/logo-mark.svg";
      document.querySelectorAll("[data-theme-option]").forEach(function (c) {
        c.classList.toggle("selected", c.getAttribute("data-theme-option") === content.theme);
      });
      renderCourses();
      renderTestimonials();
      renderFaqs();
      return;
    }
    initialized = true;
    initSiteSettings();
    initTheme();
    initHomeSection();
    initAboutSection();
    initHowItWorksSection();
    initContactSection();
    initAccountSection();
    initCoursesSection();
    initTestimonialsSection();
    initFaqsSection();
  }
})();
