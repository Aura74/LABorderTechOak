/* ============================================================
   LA-STUDIO — js/main.js
   Delas av index.html och galleri.html. Varje funktion är
   defensiv: saknas ett element hoppas den delen tyst över.
   Effektläget (html[data-perf]) sätts före paint i <head>.
   Laddas med defer — DOM finns när koden körs.
   ============================================================ */

"use strict";

const PERF_KEY = "laljusne:perfMode";
const SKIP_PRELOADER_KEY = "laljusne:skipPreloader";
const FPS_SUGGESTED_KEY = "laljusne:fpsSuggested";

const root = document.documentElement;
const perfMode = root.dataset.perf || "balanced";
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const motionOff = perfMode === "essential" || reducedMotion;
const $ = (id) => document.getElementById(id);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

/* Skapar en IntersectionObserver som kör `onEnter` en gång per element */
function observeOnce(elements, onEnter, options) {
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      io.unobserve(entry.target);
      onEnter(entry.target);
    }
  }, options);
  elements.forEach((el) => io.observe(el));
  return io;
}

/* ===== LUCIDE-IKONER ===== */
window.lucide?.createIcons();

/* ===== DARK / LIGHT MODE ===== */
(function initTheme() {
  const toggle = $("themeToggle");
  if (!toggle) return;
  const icon = toggle.querySelector("i");

  const sync = () => {
    const isDark = root.dataset.theme === "dark";
    icon?.classList.toggle("fa-sun", isDark);
    icon?.classList.toggle("fa-moon", !isDark);
    toggle.setAttribute("aria-label", isDark ? "Byt till ljust tema" : "Byt till mörkt tema");
  };

  toggle.addEventListener("click", () => {
    const isDark = root.dataset.theme === "dark";
    if (isDark) delete root.dataset.theme;
    else root.dataset.theme = "dark";
    localStorage.setItem("theme", isDark ? "light" : "dark");
    sync();
  });
  sync();
})();

/* ===== KARUSELL ===== */
(function initCarousel() {
  const slides = $$(".carousel__slide");
  if (!slides.length) return;
  const dots = $$(".carousel__dot");
  const carousel = document.querySelector(".carousel");
  const INTERVAL = 4500;
  let index = 0;
  let timer = null;

  const show = (i) => {
    index = (i + slides.length) % slides.length;
    slides.forEach((slide, n) => slide.classList.toggle("is-active", n === index));
    dots.forEach((dot, n) => {
      dot.classList.toggle("is-active", n === index);
      dot.setAttribute("aria-selected", String(n === index));
    });
  };
  const stop = () => {
    clearInterval(timer);
    timer = null;
  };
  const start = () => {
    if (motionOff) return;
    stop();
    timer = setInterval(() => show(index + 1), INTERVAL);
  };

  show(0);
  start();

  $("slidePrev")?.addEventListener("click", () => (show(index - 1), start()));
  $("slideNext")?.addEventListener("click", () => (show(index + 1), start()));
  dots.forEach((dot, n) => dot.addEventListener("click", () => (show(n), start())));

  // Autorotera bara när karusellen syns
  if (carousel) {
    new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0.15 }
    ).observe(carousel);
  }
})();

/* ===== MOBILMENY ===== */
(function initMobileMenu() {
  const hamburger = $("hamburgerBtn");
  const menu = $("mobileMenu");
  const closeBtn = $("mobileMenuClose");
  const backdrop = $("menuBackdrop");
  if (!hamburger || !menu || !closeBtn || !backdrop) return;

  const open = () => {
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    hamburger.setAttribute("aria-expanded", "true");
    hamburger.classList.add("is-hidden");
    backdrop.hidden = false;
    requestAnimationFrame(() => backdrop.classList.add("is-open"));
    document.body.classList.add("menu-open");
    closeBtn.focus();
  };
  const close = () => {
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.classList.remove("is-hidden");
    backdrop.classList.remove("is-open");
    setTimeout(() => (backdrop.hidden = true), 300);
    document.body.classList.remove("menu-open");
  };

  hamburger.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  $$("a", menu).forEach((a) => a.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) close();
  });
})();

/* ===== SCROLL-REVEALS ===== */
(function initReveals() {
  const els = $$("[data-reveal]");
  if (!els.length || motionOff) return;
  root.setAttribute("data-reveal-init", ""); // först nu döljs elementen (CSS)
  observeOnce(els, (el) => el.classList.add("is-revealed"), {
    threshold: 0.15,
    rootMargin: "0px 0px -40px 0px",
  });
})();

/* ===== SPLIT-TEXT (rubriker tonas in tecken för tecken) =====
   Orden wrappas i egna spans med nowrap så en rubrik aldrig
   radbryts mitt i ett ord på smala skärmar. */
(function initSplitText() {
  const targets = $$("[data-split]");
  if (!targets.length || motionOff) return;

  for (const el of targets) {
    const text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.replaceChildren();
    let i = 0;
    for (const word of text.split(/\s+/)) {
      const wordEl = document.createElement("span");
      wordEl.className = "split-text__word";
      wordEl.setAttribute("aria-hidden", "true");
      for (const ch of word) {
        const charEl = document.createElement("span");
        charEl.className = "split-text__char";
        charEl.textContent = ch;
        charEl.style.transitionDelay = `${i++ * 25}ms`;
        wordEl.append(charEl);
      }
      el.append(wordEl, " ");
    }
  }

  observeOnce(targets, (el) => el.classList.add("is-revealed"), { threshold: 0.4 });
})();

/* ===== SHOWREEL — spelar bara när den syns, aldrig i Essential ===== */
(function initVideo() {
  const video = $("heroFilm");
  if (!video) return;

  const showControls = () => video.setAttribute("controls", "");
  if (perfMode === "essential") {
    showControls();
    return;
  }
  new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) video.play().catch(showControls);
      else video.pause();
    },
    { threshold: 0.25 }
  ).observe(video);
})();

/* ===== TOAST (delas av formulär, FPS-vakt och chatt) ===== */
let toastTimer = null;

function showToast(message, actionLabel, onAction) {
  const toast = $("toast");
  if (!toast) return;
  toast.textContent = message;
  if (actionLabel && onAction) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = actionLabel;
    btn.addEventListener("click", () => {
      hideToast();
      onAction();
    });
    toast.append(btn);
  }
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, actionLabel ? 9000 : 4000);
}

function hideToast() {
  const toast = $("toast");
  if (!toast) return;
  toast.classList.remove("is-visible");
  setTimeout(() => (toast.hidden = true), 300);
}

window.showToast = showToast; // används av js/chat.js

/* ===== FORMULÄR (demo — ingen backend) =====
   Live: kontakt → Formspree/Netlify Forms, nyhetsbrev → Klaviyo/Mailchimp. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

(function initNewsletter() {
  const form = $("newsletterForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const field = form.elements.email;
    if (!EMAIL_RE.test(field.value.trim())) {
      showToast("Skriv en giltig e-postadress.");
      field.focus();
      return;
    }
    form.reset();
    showToast("Tack! Kolla din inkorg. (Demo — inget mejl skickas)");
  });
})();

(function initContactForm() {
  const form = $("contactForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const { name, email, message } = form.elements;
    if (!name.value.trim() || !EMAIL_RE.test(email.value.trim()) || !message.value.trim()) {
      showToast("Fyll i namn, giltig e-post och ett meddelande.");
      return;
    }
    const firstName = name.value.trim().split(/\s+/)[0];
    form.reset();
    showToast(`Tack ${firstName}! Jag hör av mig inom ett dygn. (Demo)`);
  });
})();

/* ===== LIGHTBOX (<dialog>, delas av fotovägg + galleri) =====
   Samlar alla synliga .lightbox-trigger i DOM-ordning, så pilarna
   respekterar galleri-filtret. Escape/fokusfälla sköter <dialog>. */
(function initLightbox() {
  const dialog = $("lightbox");
  if (!dialog) return;
  const img = $("lightboxImg");
  const caption = $("lightboxCaption");
  let list = [];
  let current = 0;

  const visibleTriggers = () => $$(".lightbox-trigger").filter((t) => t.offsetParent !== null);

  const render = () => {
    const trigger = list[current];
    const source = trigger.querySelector("img");
    img.src = source?.currentSrc || source?.src || "";
    img.alt = trigger.dataset.caption || source?.alt || "";
    caption.textContent = img.alt;
  };
  const step = (dir) => {
    if (!list.length) return;
    current = (current + dir + list.length) % list.length;
    render();
  };

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".lightbox-trigger");
    if (!trigger) return;
    e.preventDefault();
    list = visibleTriggers();
    current = Math.max(0, list.indexOf(trigger));
    render();
    dialog.showModal();
  });

  $("lightboxClose")?.addEventListener("click", () => dialog.close());
  $("lightboxPrev")?.addEventListener("click", () => step(-1));
  $("lightboxNext")?.addEventListener("click", () => step(1));
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close(); // klick på backdrop
  });
  dialog.addEventListener("close", () => (img.src = ""));
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
  });
})();

/* ===== GALLERI-FILTER (galleri.html) ===== */
(function initGalleryFilter() {
  const buttons = $$(".gallery__filter");
  const cells = $$(".gallery__cell");
  if (!buttons.length || !cells.length) return;

  buttons.forEach((btn) =>
    btn.addEventListener("click", () => {
      buttons.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
      const category = btn.dataset.filter;
      cells.forEach((cell) =>
        cell.classList.toggle("is-hidden", category !== "all" && cell.dataset.cat !== category)
      );
    })
  );
})();

/* ===== EFFEKTVÄLJARE ===== */
(function initPerfSelector() {
  const toggle = $("perfToggle");
  const popover = $("perfPopover");
  if (!toggle || !popover) return;
  const options = $$("[data-perf-option]");

  options.forEach((o) => o.classList.toggle("is-selected", o.dataset.perfOption === perfMode));

  const setOpen = (open) => {
    popover.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () => setOpen(popover.hidden));
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".perf")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  options.forEach((o) =>
    o.addEventListener("click", () => {
      const chosen = o.dataset.perfOption;
      if (chosen === perfMode) return setOpen(false);
      localStorage.setItem(PERF_KEY, chosen);
      sessionStorage.setItem(SKIP_PRELOADER_KEY, "1"); // ingen preloader-blink vid lägesbyte
      location.reload(); // ren om-init av Lenis/cursor
    })
  );
})();

/* ===== CINEMATIC: Lenis + parallax ===== */
if (perfMode === "cinematic" && !reducedMotion) {
  if (window.Lenis) {
    root.style.scrollBehavior = "auto";
    const lenis = new Lenis({ lerp: 0.1 });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const target = link.hash.length > 1 && document.querySelector(link.hash);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -80 });
      });
    });
  }

  // Subtil parallax på fotoväggens två stora rutor (containrarna, inte img —
  // annars krockar den med hover-zoomen)
  const parallaxItems = $$(".photo-wall__item--big, .photo-wall__item--left3");
  if (parallaxItems.length) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = innerHeight;
      for (const el of parallaxItems) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) continue;
        const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
        el.style.transform = `translateY(${(-progress * 24).toFixed(1)}px)`;
      }
    };
    addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );
    update();
  }
}

/* ===== FPS-VAKT — föreslå Balanced om Cinematic hackar ===== */
if (perfMode === "cinematic" && !reducedMotion && !sessionStorage.getItem(FPS_SUGGESTED_KEY)) {
  addEventListener("load", () => {
    setTimeout(() => {
      const DURATION = 2000;
      const start = performance.now();
      let frames = 0;
      const count = (now) => {
        frames++;
        if (now - start < DURATION) return requestAnimationFrame(count);
        const fps = frames / ((now - start) / 1000);
        if (fps >= 45) return;
        sessionStorage.setItem(FPS_SUGGESTED_KEY, "1");
        showToast("Sidan verkar hacka på din dator.", "Byt till Balanced", () => {
          localStorage.setItem(PERF_KEY, "balanced");
          location.reload();
        });
      };
      requestAnimationFrame(count);
    }, 1500);
  });
}

/* ===== PRELOADER — visas en gång per session ===== */
(function initPreloader() {
  const pre = $("preloader");
  if (!pre) return;

  if (motionOff || sessionStorage.getItem(SKIP_PRELOADER_KEY)) {
    pre.hidden = true;
    return;
  }

  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    sessionStorage.setItem(SKIP_PRELOADER_KEY, "1");
    pre.classList.add("is-done");
    setTimeout(() => (pre.hidden = true), 550); // display:none efter fade
  };

  addEventListener("load", () => setTimeout(done, 350));
  setTimeout(done, 2600); // failsafe om load aldrig fyras
})();

/* ===== STATISTIK — räknar upp vid scroll ===== */
(function initStats() {
  const numbers = $$(".stats__number[data-count]");
  if (!numbers.length) return;

  const setFinal = (el) => (el.textContent = el.dataset.count + (el.dataset.suffix || ""));
  if (motionOff) return numbers.forEach(setFinal);

  observeOnce(
    numbers,
    (el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const suffix = el.dataset.suffix || "";
      const DURATION = 1400;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / DURATION);
        const eased = 1 - (1 - p) ** 3;
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    { threshold: 0.5 }
  );
})();

/* ===== SIDÖVERGÅNG (fade mellan index & galleri) ===== */
(function initPageTransition() {
  if (motionOff) return;
  $$('a[href*=".html"]').forEach((link) => {
    if (link.origin !== location.origin || link.target === "_blank") return;
    link.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return; // "öppna i ny flik" ska funka
      e.preventDefault();
      document.body.classList.add("page-out");
      setTimeout(() => (location.href = link.href), 320);
    });
  });
})();

/* ===== CUSTOM CURSOR + MAGNETISKA KNAPPAR (Cinematic, fin pekare) ===== */
if (
  perfMode === "cinematic" &&
  !reducedMotion &&
  matchMedia("(hover: hover) and (pointer: fine)").matches
) {
  const dot = $("cursorDot");
  const ring = $("cursorRing");
  if (dot && ring) {
    let mx = 0;
    let my = 0;
    let rx = 0;
    let ry = 0;
    addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      document.body.classList.add("cursor-active"); // först nu göms native cursor
    });
    (function ringLoop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(ringLoop);
    })();
    $$("a, button, input, textarea").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
    });
  }

  $$(".btn, .link-underline").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      btn.style.transform = `translate(${(x * 0.18).toFixed(1)}px, ${(y * 0.32).toFixed(1)}px)`;
    });
    btn.addEventListener("mouseleave", () => (btn.style.transform = ""));
  });
}
