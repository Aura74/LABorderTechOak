"use strict";

/* ============================================================
   LA-STUDIO — app.js  (delas av index.html och galleri.html)
   Alla funktioner är defensiva: saknas ett element hoppas
   den delen tyst över, så samma fil funkar på båda sidorna.
   Effektläget (data-perf) sätts före paint i sidans <head>.
   ============================================================ */

const PERF_KEY = "laljusne:perfMode";
const html = document.documentElement;
const perfMode = html.getAttribute("data-perf") || "balanced";
const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;
const hasIO = "IntersectionObserver" in window;

/* ===== LUCIDE-IKONER ===== */
if (window.lucide && typeof window.lucide.createIcons === "function") {
  window.lucide.createIcons();
}

/* ===== DARK / LIGHT MODE ===== */
(function initTheme() {
  const themeToggle = document.getElementById("themeToggle");
  if (!themeToggle) return;
  const themeIcon = themeToggle.querySelector("i");

  function sync() {
    const isDark = html.getAttribute("data-theme") === "dark";
    if (themeIcon) {
      themeIcon.classList.toggle("fa-sun", isDark);
      themeIcon.classList.toggle("fa-moon", !isDark);
    }
  }
  sync();

  themeToggle.addEventListener("click", () => {
    const isDark = html.getAttribute("data-theme") === "dark";
    if (isDark) html.removeAttribute("data-theme");
    else html.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", isDark ? "light" : "dark");
    sync();
  });
})();

/* ===== KARUSELL ===== */
(function initCarousel() {
  const slides = Array.from(document.querySelectorAll(".mySlides"));
  if (!slides.length) return;
  const dots = Array.from(document.querySelectorAll(".dot"));
  const container = document.querySelector(".slideshow-container");
  let index = 0;
  let timer = null;
  const INTERVAL = 4500;

  function show(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle("is-active", n === index));
    dots.forEach((d, n) => d.classList.toggle("active", n === index));
  }
  function start() {
    if (perfMode === "essential" || reducedMotion) return;
    stop();
    timer = setInterval(() => show(index + 1), INTERVAL);
  }
  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  show(0);
  start();

  const prev = document.getElementById("slidePrev");
  const next = document.getElementById("slideNext");
  if (prev) prev.addEventListener("click", () => (show(index - 1), start()));
  if (next) next.addEventListener("click", () => (show(index + 1), start()));
  dots.forEach((d, n) => d.addEventListener("click", () => (show(n), start())));

  if (hasIO && container) {
    new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => (e.isIntersecting ? start() : stop())),
      { threshold: 0.15 }
    ).observe(container);
  }
})();

/* ===== MOBILMENY ===== */
(function initMobileMenu() {
  const hamburger = document.getElementById("hamburgerBtn");
  const menu = document.getElementById("mobileMenu");
  const closeBtn = document.getElementById("mobileMenuClose");
  const backdrop = document.getElementById("menuBackdrop");
  if (!hamburger || !menu || !closeBtn || !backdrop) return;

  function open() {
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    hamburger.setAttribute("aria-expanded", "true");
    hamburger.style.visibility = "hidden";
    backdrop.hidden = false;
    requestAnimationFrame(() => backdrop.classList.add("is-open"));
    document.body.classList.add("menu-open");
    closeBtn.focus();
  }
  function close() {
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.style.visibility = "";
    backdrop.classList.remove("is-open");
    setTimeout(() => (backdrop.hidden = true), 300);
    document.body.classList.remove("menu-open");
  }

  hamburger.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) close();
  });
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
})();

/* ===== SCROLL-REVEALS ===== */
(function initReveals() {
  const els = document.querySelectorAll("[data-reveal]");
  if (!els.length || perfMode === "essential" || reducedMotion || !hasIO) return;
  try {
    html.setAttribute("data-reveal-init", "");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-revealed");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => io.observe(el));
  } catch (e) {
    html.removeAttribute("data-reveal-init");
  }
})();

/* ===== SPLIT-TEXT (skrivmaskinsreveal på rubriker) ===== */
(function initSplitText() {
  const targets = document.querySelectorAll("[data-split]");
  if (!targets.length || perfMode === "essential" || reducedMotion || !hasIO)
    return;

  targets.forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.textContent = "";
    let i = 0;
    for (const ch of text) {
      const span = document.createElement("span");
      span.className = "char";
      span.setAttribute("aria-hidden", "true");
      span.textContent = ch === " " ? " " : ch;
      span.style.transitionDelay = i * 25 + "ms";
      el.appendChild(span);
      i++;
    }
  });

  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-revealed");
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.4 }
  );
  targets.forEach((el) => io.observe(el));
})();

/* ===== VIDEO — autoplay bara när den syns, aldrig i Essential ===== */
(function initVideo() {
  const video = document.getElementById("heroFilm");
  if (!video) return;

  if (perfMode === "essential") {
    video.setAttribute("controls", "");
    return;
  }
  if (hasIO) {
    new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting)
            video.play().catch(() => video.setAttribute("controls", ""));
          else video.pause();
        }),
      { threshold: 0.25 }
    ).observe(video);
  } else {
    video.play().catch(() => video.setAttribute("controls", ""));
  }
})();

/* ===== TOAST ===== */
let toastTimer = null;

function showToast(message, actionLabel, onAction) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  if (actionLabel && onAction) {
    const btn = document.createElement("button");
    btn.textContent = actionLabel;
    btn.addEventListener("click", () => {
      hideToast();
      onAction();
    });
    toast.appendChild(btn);
  }
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, actionLabel ? 9000 : 4000);
}

function hideToast() {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.classList.remove("is-visible");
  setTimeout(() => (toast.hidden = true), 300);
}

/* ===== NEWSLETTER (demo — ingen backend) ===== */
(function initNewsletter() {
  const form = document.getElementById("newsletterForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const field = document.getElementById("newsletter_field");
    const value = field.value.trim();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      showToast("Skriv en giltig e-postadress.");
      field.focus();
      return;
    }
    field.value = "";
    showToast("Tack! Kolla din inkorg. (Demo — inget mejl skickas)");
  });
})();

/* ===== KONTAKTFORMULÄR (demo — koppla Formspree/Netlify Forms live) ===== */
(function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("cf_name");
    const email = document.getElementById("cf_email");
    const msg = document.getElementById("cf_msg");
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    if (!name.value.trim() || !emailOk || !msg.value.trim()) {
      showToast("Fyll i namn, giltig e-post och ett meddelande.");
      return;
    }
    const first = name.value.trim().split(/\s+/)[0];
    form.reset();
    showToast("Tack " + first + "! Jag hör av mig inom ett dygn. (Demo)");
  });
})();

/* ===== LIGHTBOX (delas av fotovägg + galleri) ===== */
(function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;
  const imgEl = document.getElementById("lightboxImg");
  const capEl = document.getElementById("lightboxCaption");
  let list = [];
  let current = 0;

  const collect = () =>
    Array.from(document.querySelectorAll(".lightbox-trigger")).filter(
      (t) => t.offsetParent !== null
    );

  function dataOf(trigger) {
    const img = trigger.querySelector("img");
    return {
      src: (img && (img.currentSrc || img.src)) || "",
      caption: trigger.dataset.caption || (img && img.alt) || "",
    };
  }
  function render() {
    const { src, caption } = dataOf(list[current]);
    imgEl.src = src;
    imgEl.alt = caption;
    capEl.textContent = caption;
  }
  function open(trigger) {
    list = collect();
    current = Math.max(0, list.indexOf(trigger));
    render();
    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => lightbox.classList.add("is-open"));
    document.body.classList.add("menu-open");
  }
  function close() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    setTimeout(() => {
      lightbox.hidden = true;
      imgEl.src = "";
    }, 300);
    document.body.classList.remove("menu-open");
  }
  function step(dir) {
    if (!list.length) return;
    current = (current + dir + list.length) % list.length;
    render();
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".lightbox-trigger");
    if (trigger) {
      e.preventDefault();
      open(trigger);
    }
  });
  document.getElementById("lightboxClose").addEventListener("click", close);
  document.getElementById("lightboxPrev").addEventListener("click", () => step(-1));
  document.getElementById("lightboxNext").addEventListener("click", () => step(1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });
  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
  });
})();

/* ===== GALLERI-FILTER (bara på galleri.html) ===== */
(function initGalleryFilter() {
  const btns = Array.from(document.querySelectorAll(".filter-btn"));
  const cells = Array.from(document.querySelectorAll(".gallery-cell"));
  if (!btns.length || !cells.length) return;

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const cat = btn.dataset.filter;
      cells.forEach((cell) => {
        const show = cat === "all" || cell.dataset.cat === cat;
        cell.classList.toggle("is-hidden", !show);
      });
    });
  });
})();

/* ===== EFFEKTVÄLJARE ===== */
(function initPerfSelector() {
  const toggle = document.getElementById("perfToggle");
  const popover = document.getElementById("perfPopover");
  if (!toggle || !popover) return;
  const options = Array.from(document.querySelectorAll("[data-perf-option]"));

  options.forEach((o) =>
    o.classList.toggle(
      "is-selected",
      o.getAttribute("data-perf-option") === perfMode
    )
  );

  function setOpen(open) {
    popover.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  }

  toggle.addEventListener("click", () => setOpen(popover.hidden));
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".perf-widget")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  options.forEach((o) => {
    o.addEventListener("click", () => {
      const chosen = o.getAttribute("data-perf-option");
      if (chosen === perfMode) {
        setOpen(false);
        return;
      }
      localStorage.setItem(PERF_KEY, chosen);
      sessionStorage.setItem("laljusne:skipPreloader", "1"); // ingen preloader-blink vid lägesbyte
      location.reload();
    });
  });
})();

/* ===== CINEMATIC: Lenis + parallax ===== */
if (perfMode === "cinematic" && !reducedMotion) {
  if (window.Lenis) {
    html.style.scrollBehavior = "auto";
    const lenis = new Lenis({ lerp: 0.1 });
    const raf = (t) => {
      lenis.raf(t);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (href === "#") return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -80 });
        }
      });
    });
  }

  const parallaxItems = Array.from(
    document.querySelectorAll(".pw-big, .pw-left3")
  );
  if (parallaxItems.length) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      parallaxItems.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
        el.style.transform = `translateY(${(-progress * 24).toFixed(1)}px)`;
      });
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  }
}

/* ===== FPS-VAKT — föreslå Balanced om Cinematic laggar ===== */
if (
  perfMode === "cinematic" &&
  !reducedMotion &&
  !sessionStorage.getItem("laljusne:fpsSuggested")
) {
  window.addEventListener("load", () => {
    setTimeout(() => {
      let frames = 0;
      const start = performance.now();
      const DURATION = 2000;
      function count(now) {
        frames++;
        if (now - start < DURATION) {
          requestAnimationFrame(count);
        } else {
          const fps = frames / ((now - start) / 1000);
          if (fps < 45) {
            sessionStorage.setItem("laljusne:fpsSuggested", "1");
            showToast("Sidan verkar hacka på din dator.", "Byt till Balanced", () => {
              localStorage.setItem(PERF_KEY, "balanced");
              location.reload();
            });
          }
        }
      }
      requestAnimationFrame(count);
    }, 1500);
  });
}

/* ===== PRELOADER ===== */
(function initPreloader() {
  const pre = document.getElementById("preloader");
  if (!pre) return;

  // Essential/reduced-motion eller redan visad denna session → dölj direkt
  if (
    perfMode === "essential" ||
    reducedMotion ||
    sessionStorage.getItem("laljusne:skipPreloader")
  ) {
    pre.hidden = true;
    return;
  }

  let finished = false;
  function done() {
    if (finished) return;
    finished = true;
    sessionStorage.setItem("laljusne:skipPreloader", "1");
    pre.classList.add("is-done");
    setTimeout(() => (pre.hidden = true), 550); // display:none efter fade
  }

  window.addEventListener("load", () => setTimeout(done, 350));
  setTimeout(done, 2600); // failsafe om load aldrig fyras
})();

/* ===== STAT-RÄKNARE (count-up) ===== */
(function initStats() {
  const nums = Array.from(document.querySelectorAll(".stat-number[data-count]"));
  if (!nums.length) return;

  const setFinal = (el) =>
    (el.textContent = el.dataset.count + (el.dataset.suffix || ""));

  if (perfMode === "essential" || reducedMotion || !hasIO) {
    nums.forEach(setFinal);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        io.unobserve(el);
        const target = parseInt(el.dataset.count, 10) || 0;
        const suffix = el.dataset.suffix || "";
        const dur = 1400;
        const start = performance.now();
        function tick(now) {
          const p = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.5 }
  );
  nums.forEach((n) => io.observe(n));
})();

/* ===== SIDÖVERGÅNG (fade mellan index & galleri) ===== */
(function initPageTransition() {
  if (perfMode === "essential" || reducedMotion) return;
  document.querySelectorAll('a[href*=".html"]').forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || /^https?:\/\//.test(href) || link.target === "_blank") return;
    link.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return; // öppna i ny flik ska funka
      e.preventDefault();
      document.body.classList.add("page-out");
      setTimeout(() => (window.location.href = href), 320);
    });
  });
})();

/* ===== CUSTOM CURSOR + MAGNETISKA CTA (endast Cinematic, fine pointer) ===== */
if (
  perfMode === "cinematic" &&
  !reducedMotion &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches
) {
  const dot = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  if (dot && ring) {
    let mx = 0,
      my = 0,
      rx = 0,
      ry = 0,
      active = false;
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      if (!active) {
        active = true;
        document.body.classList.add("cursor-active"); // först nu göms native cursor
      }
    });
    (function ringLoop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(ringLoop);
    })();
    document
      .querySelectorAll(
        "a, button, input, textarea, .lightbox-trigger, .gallery-cell"
      )
      .forEach((el) => {
        el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
        el.addEventListener("mouseleave", () =>
          ring.classList.remove("is-hover")
        );
      });
  }

  document
    .querySelectorAll(
      ".buttonInPicture, .contact-submit, .viewGalleryLink, .footer-cta-btn"
    )
    .forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${(x * 0.18).toFixed(1)}px, ${(
          y * 0.32
        ).toFixed(1)}px)`;
      });
      btn.addEventListener("mouseleave", () => (btn.style.transform = ""));
    });
}
