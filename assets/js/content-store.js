// ============================================================
// Maarifat-ul-Uloom Academy — Content Store
// A tiny client-side "CMS" data layer. All editable site content
// lives here. The Admin Panel writes to it; every public page
// reads from it on load. Because this is a static site with no
// server, the store lives in the browser's localStorage — so
// edits saved in the Admin Panel apply instantly to every page
// opened in that same browser. See admin for details.
// ============================================================

(function (global) {
  "use strict";

  var STORAGE_KEY = "mua-content-v1";
  var AUTH_KEY = "mua-admin-auth-v1";
  var SESSION_KEY = "mua-admin-session-v1";

  // ---------- Icon library (used by course cards) ----------
  // Each entry is the inner <path>/<g> markup for a 24x24 stroke icon.
  var ICONS = {
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    "book-open": '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    "map-pin": '<path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/>',
    user: '<path d="M3 21c0-3.5 4-5 9-5s9 1.5 9 5"/><circle cx="12" cy="7" r="4"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
    "file-text": '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h6M9 11h6"/>'
  };

  var ICON_LABELS = {
    book: "Book",
    "book-open": "Open Book",
    music: "Music Note",
    "map-pin": "Map Pin",
    user: "Person",
    globe: "Globe",
    "file-text": "Document"
  };

  // ---------- Default content ----------
  function defaultContent() {
    return {
      version: 1,
      theme: "light",
      logoUrl: null,

      contact: {
        email: "maarifatululoom@gmail.com",
        phoneMale: "+92 307 5253269",
        phoneFemale: "+92 371 3518505",
        whatsappMale: "https://wa.me/923075253269"
      },

      socials: {
        facebook: "https://facebook.com/profile.php?id=61591790594650",
        instagram: "https://instagram.com/maarifat_ul_uloom_academy",
        linkedin: "https://linkedin.com/company/maarifat-ul-uloom-academy",
        youtube: "https://youtube.com/@MaarifatUlUloomAcademy",
        tiktok: "https://tiktok.com/@maarifatululoomac",
        x: "https://x.com/MaarifatUlUloom",
        whatsappChannel: "https://whatsapp.com/channel/0029Vb8Doae9xVJYnsMAuV2S",
        pinterest: "https://pin.it/4gwbnP8Il"
      },

      stats: {
        students: "500+",
        countries: "15+",
        courses: "7",
        teachers: "20+"
      },

      home: {
        heroTagline: "Nurturing Faith",
        heroTaglineSecond: "Building Futures",
        heroCtaPrimary: "Book Your Free Trial Class",
        heroCtaSecondary: "Explore Courses",
        closingHeading: "Your journey with the Qur'an can start this week",
        closingText: "Book a free trial class — no cost, no obligation — and meet the teacher who will guide your learning."
      },

      about: {
        founding: "Maarifat-ul-Uloom Academy was founded on a simple belief: that every Muslim, regardless of age or location, deserves access to authentic, well-taught Quranic education, delivered with warmth, structure, and sincerity.",
        mission: "To provide authentic, structured Quranic and Islamic education to students of all ages, delivered online with the same care and accountability as an in-person madrasah.",
        vision: "To become the world's most trusted online academy for Quranic learning, and, in time, a bridge between timeless Islamic knowledge and modern skills.",
        values: "Authenticity in teaching, sincerity in intention, respect for every learner's pace, and accountability to parents and students alike."
      },

      howItWorks: {
        steps: [
          { title: "Contact Us", desc: "Reach out via WhatsApp, email, or our contact form; we typically respond within a few hours." },
          { title: "Free Trial Class", desc: "Meet your teacher and experience a real, live lesson at no cost." },
          { title: "Assessment", desc: "We evaluate current level and learning goals to build a plan that fits." },
          { title: "Monthly Enrollment", desc: "Choose a simple monthly plan; no long-term contracts, cancel anytime." },
          { title: "Start Learning", desc: "Begin regular, structured classes at a time that works for you." },
          { title: "Continuous Progress", desc: "Ongoing tracking, revision, and parent updates keep growth visible." }
        ],
        pricingText: "We offer a simple, transparent monthly fee with no hidden charges or long-term contracts. Exact pricing depends on the course and class frequency — your teacher will walk you through it after your free trial class."
      },

      contactPage: {
        intro: "Ready to start your Quranic journey? <strong>Contact us today for your FREE Trial Class</strong> with no obligation."
      },

      courses: [
        { id: "noorani-qaida", title: "Noorani Qaida", category: "quran-studies", tag: "Quran Studies", icon: "book", desc: "The essential first step: master Arabic letters, correct pronunciation, and reading fundamentals before moving into the Qur'an itself." },
        { id: "quran-reading", title: "Nazra Quran", category: "quran-studies", tag: "Quran Studies", icon: "book-open", desc: "Build fluency and confidence reading the Qur'an with proper pronunciation, at a pace suited to your level." },
        { id: "tajweed", title: "Tajweed", category: "quran-studies", tag: "Quran Studies", icon: "music", desc: "Learn the precise rules of recitation to read the Qur'an as it was revealed: beautifully, correctly, and with understanding." },
        { id: "hifz-support", title: "Hifz-ul-Quran", category: "quran-studies", tag: "Quran Studies", icon: "map-pin", desc: "Structured memorization guidance with regular revision cycles, designed to build lasting retention, not just short-term recall." },
        { id: "tafseer", title: "Tafseer", category: "islamic-studies", tag: "Islamic Studies", icon: "book-open", desc: "Understand the meaning and message of the Qur'an through guided explanation of its verses, so that reading turns into understanding." },
        { id: "hadith-40", title: "40 Hadith Memorization in 40 Days", category: "islamic-studies", tag: "Islamic Studies", icon: "book", desc: "Memorize 40 well-known hadith in 40 days, with their meanings and regular revision, one hadith at a time." }
      ],

      testimonials: [
        { quote: "My son struggled with Tajweed for years before we found Maarifat-ul-Uloom. Within three months, his teacher had identified exactly where he was going wrong.", name: "Parent — United Kingdom" },
        { quote: "I started as a complete beginner with the Noorani Qaida course at 32 years old. I'm now reading full pages of the Qur'an confidently.", name: "Adult Student — Canada" },
        { quote: "The free trial class is what convinced us. We could see exactly how patient and structured the teaching was before committing to anything.", name: "Parent — United Arab Emirates" },
        { quote: "My daughter has been doing Hifz support classes for eight months now. The revision system actually works; she retains what she memorizes.", name: "Parent — United States" },
        { quote: "As a teenager, I didn't want a boring class. My teacher made Tajweed genuinely interesting, and I actually look forward to my lessons now.", name: "Teenage Student — Australia" },
        { quote: "Flexible timing was everything for us; we're in a completely different time zone, and scheduling was never once a problem.", name: "Parent — Pakistan (Overseas Family)" }
      ],

      faqs: [
        { q: "What age groups do you teach?", a: "We welcome students of all ages, from young children just starting Noorani Qaida, to teenagers and adults learning to read, understand, or memorize the Qur'an for the first time." },
        { q: "Are your teachers qualified and verified?", a: "Yes, every teacher undergoes a structured vetting process evaluating both Quranic qualifications and teaching ability." },
        { q: "Do you have both male and female teachers?", a: "Yes, so every student and family can choose an instructor they feel most comfortable with." },
        { q: "How do online Quran classes actually work?", a: "Classes take place live, one-to-one, through video call at your scheduled time, with your teacher correcting pronunciation in real time." },
        { q: "Is there really a free trial class?", a: "Yes, genuinely free with no obligation; you complete one full live lesson and decide afterward." },
        { q: "How much does a monthly plan cost?", a: "A simple, transparent monthly fee with no hidden charges or long-term contracts; exact pricing depends on the course and class frequency." },
        { q: "Can I cancel or pause my enrollment anytime?", a: "Yes, our monthly plans are flexible with no long-term lock-in." },
        { q: "What if my class schedule needs to change?", a: "Reach out to reschedule in advance and we'll find a slot that fits." },
        { q: "What if I don't like the assigned teacher?", a: "Let us know and we'll happily arrange a switch." },
        { q: "How is Hifz progress tracked?", a: "Through a structured revision cycle with regular assessments of new memorization and retention." },
        { q: "Do you teach Tajweed as a separate course?", a: "Yes, and its principles are also woven into our Nazra Quran and Hifz courses." },
        { q: "What equipment do I need for online classes?", a: "Just a stable internet connection and a device with a camera and microphone." },
        { q: "Do you offer classes for complete beginners?", a: "Absolutely, our Noorani Qaida course is designed for absolute beginners." },
        { q: "Are classes available in different time zones?", a: "Yes, we teach across many countries and schedule classes at realistic times for your location." },
        { q: "How do I get started?", a: "Reach out via WhatsApp, email, or our contact form, and we'll schedule your free trial class." }
      ]
    };
  }

  function defaultAuth() {
    return { username: "admin", password: "Admin@123" };
  }

  // ---------- Deep merge (so older saved content gains new default fields) ----------
  function mergeDeep(base, override) {
    if (Array.isArray(base)) return override !== undefined ? override : base;
    if (typeof base !== "object" || base === null) return override !== undefined ? override : base;
    var out = {};
    for (var key in base) {
      out[key] = mergeDeep(base[key], override ? override[key] : undefined);
    }
    if (override) {
      for (var k2 in override) {
        if (!(k2 in out)) out[k2] = override[k2];
      }
    }
    return out;
  }

  // ---------- Public API ----------
  var CMS = {
    ICONS: ICONS,
    ICON_LABELS: ICON_LABELS,

    getContent: function () {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return defaultContent();
        var saved = JSON.parse(raw);
        return mergeDeep(defaultContent(), saved);
      } catch (e) {
        return defaultContent();
      }
    },

    saveContent: function (content) {
      try {
        content.updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
        return true;
      } catch (e) {
        return false;
      }
    },

    resetContent: function () {
      try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
      } catch (e) {
        return false;
      }
    },

    getDefaultContent: defaultContent,

    // ---- Auth ----
    getAuth: function () {
      try {
        var raw = localStorage.getItem(AUTH_KEY);
        if (!raw) return defaultAuth();
        return JSON.parse(raw);
      } catch (e) {
        return defaultAuth();
      }
    },

    saveAuth: function (auth) {
      try {
        localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
        return true;
      } catch (e) {
        return false;
      }
    },

    login: function (username, password) {
      var auth = CMS.getAuth();
      if (username === auth.username && password === auth.password) {
        sessionStorage.setItem(SESSION_KEY, "1");
        return true;
      }
      return false;
    },

    logout: function () {
      sessionStorage.removeItem(SESSION_KEY);
    },

    isLoggedIn: function () {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    }
  };

  global.MUA_CMS = CMS;
})(window);
