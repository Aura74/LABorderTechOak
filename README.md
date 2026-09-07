# LA-Studio — Ljusne

Portfolio-/studiosida för webbutveckling (demo, ingen backend). Vanilla HTML/CSS/JS — inga ramverk, inga byggverktyg. Två sidor: startsida (`index.html`) + gallerisida (`galleri.html`) som delar stilmallar och skript.

## Tech Stack

| Del | Val | Kommentar |
|---|---|---|
| Typsnitt (rubriker) | Cormorant Garamond | Serif-display — editorial premiumkänsla |
| Typsnitt (text/UI) | Courier Prime | Monospace — behåller den techiga identiteten |
| Accent-font | Stick No Bills 700 | Bara LJUSNE-baren |
| Ikoner (UI) | Font Awesome 6.7.2 | cdnjs — sociala ikoner, pilar, marquee-loggor |
| Ikoner (kort) | Lucide 0.469.0 | jsDelivr (pinnad version) — `pen-tool`, `braces`, `cpu`, `puzzle` |
| Mjukscroll | Lenis 1.1.14 | jsDelivr, initieras **endast** i effektläget Cinematic |
| AI-chatt | Gemini API | `gemini-flash-lite-latest` → `gemini-flash-latest` → lokal offline-hjärna |
| Allt annat | Vanilla JS | Karusell, `<dialog>`-lightbox, filter, reveals, split-text, count-up, cursor, preloader, sidövergång |

**Byt tillbaka till helt monospace:** sätt `--font-display: var(--font-mono);` i `:root` (css/style.css).

## Projektstruktur

```
LABorderTechOakLjusne/
├── index.html              # Startsida
├── galleri.html            # Gallerisida med kategorifilter
├── 404.html                # Egen felsida (absoluta sökvägar — visas på valfri URL)
├── staticwebapp.config.json # Azure SWA: 404-rewrite + säkerhetsheaders
├── css/
│   ├── style.css           # All sidstyling (tokens, komponenter, sektioner, responsivt)
│   └── chat.css            # AI-chattens widget
├── js/
│   ├── main.js             # Alla beteenden (defensivt — funkar på båda sidorna)
│   ├── chat.js             # AI-assistenten "Alva" (Gemini + offline-hjärna)
│   ├── apikey.js           # GITIGNORAD — sätter window.GEMINI_API_KEY
│   └── apikey.example.js   # Mall: kopiera till apikey.js och klistra in nyckel
├── img/
│   ├── lagul2b.png         # LA STUDIO-loggan (pipigul i dark mode via CSS-filter)
│   ├── lars.jpg            # Porträtt (280×280 — be om högre upplösning)
│   ├── favicon.svg / favicon-32.png / apple-touch-icon.png
│   ├── karusell/           # 5 foton + 1400px-varianter (-1400.jpg) för srcset
│   ├── movies/hero.mp4     # Showreel (H.264) + hero-poster.jpg (1600×900 poster-bild)
│   └── galleri/R.jpg       # BEVARAS som fil — visas inte
├── .gitignore              # js/apikey.js
└── README.md
```

## Kodkonventioner

- **BEM** överallt: `.block__element--modifier`, tillstånd via `.is-open` / `.is-active` / `.is-revealed`.
- **Design-tokens** i `:root` (`--bg`, `--surface`, `--text`, `--accent`, `--line`, `--space-*`, `--radius`, `--z-*`). Mörkt tema = `:root[data-theme="dark"]` som bara skriver över tokens. Linjer och tonade ytor härleds med `color-mix()` ur accenten.
- **Modern CSS**: intervall-media-queries (`@media (width <= 768px)`), individuella transform-egenskaper (`translate`, `scale`), `:is()`/`:has()`, `inset`, logiska egenskaper (`margin-inline`, `padding-block`), `text-wrap: balance/pretty`, `aspect-ratio`, `clamp()`, `<dialog>` med `::backdrop`.
- **Modern JS**: `const`/arrow functions, optional chaining, `dataset`, `replaceChildren`, `async/await` + `AbortController`. Klassiska `<script defer>` (inte ES-moduler) så sidan funkar över `file://`.
- **Återanvändbara komponenter**: `.btn` (+ `--sm`/`--lg`), `.eyebrow`, `.link-underline`, `.icon-btn`, `.form__field`.
- **Baslinje**: Chrome 111+, Safari 16.4+, Firefox 113+.

## Sektioner — index.html (i ordning)

| # | Sektion | Klass / id | Beskrivning |
|---|---|---|---|
| 1 | Hero | `.hero` | Logga + serif-tagline + sektionsnav |
| 2 | Karusell | `.carousel` `#portfolio` | 5 case, gradientscrim, pilar, prickar (`role="tab"`), autorotation bara när synlig |
| 3 | Vad vi gör | `.services` `#vad-vi-gor` | Serif-rubrik + 4 kort med Lucide-ikoner |
| 4 | Teknik-marquee | `.marquee` | Scrollande tech-loggor, pausar vid hover |
| 5 | Showreel | `.showreel` | Video med poster-bild, spelar bara när den syns |
| 6 | Tjänster | `.pitch` `#tjanster` | Textsektion |
| 7 | Statistik | `.stats` | Count-up vid scroll (120+ / 12 år / 100% / 24h) |
| 8 | Om mig | `.about` `#om-mig` | Porträtt + bio + signatur |
| 9 | Fotovägg | `.portfolio` `#galleri` | Grid-areas, klick → lightbox, LJUSNE-bar |
| 10 | Omdömen | `.testimonials` `#omdomen` | 3 kundcitat (demo — live via Trustpilot/Yotpo) |
| 11 | Kontakt | `.contact` `#kontakt` | Formulär → demo-toast (live: Formspree/Netlify Forms) |
| 12 | Footer | `.footer` | CTA-block + 4 kolumner (brand/meny/tjänster/nyhetsbrev) + bottenrad |

## Galleri — galleri.html

12 rutor i 3-kolumnsgrid (jämn underkant i 3/2/1 kolumner), filter **Alla / Kreativt / Teknik / Miljö** (`aria-pressed`), klick → lightbox som bara bläddrar inom det filtrerade setet.

## Interaktiva delar (js/main.js)

- **Lightbox** — ett riktigt `<dialog>`: `showModal()` ger fokusfälla, Escape och top-layer gratis, och kan aldrig bli en osynlig klickfångare. Pilar/piltangenter bläddrar bland synliga `.lightbox-trigger`.
- **Split-text** — `[data-split]`-rubriker tonas in per tecken (25 ms stagger). Varje ord wrappas i `.split-text__word` med `nowrap` så rubriker aldrig bryts mitt i ett ord.
- **Count-up** — `.stats__number[data-count][data-suffix]` via IntersectionObserver.
- **Preloader** — LA-monogram, en gång per session (`sessionStorage laljusne:skipPreloader`).
- **Custom cursor + magnetiska knappar** — endast Cinematic + `(hover:hover) and (pointer:fine)`.
- **Sidövergång** — över http(s) sköter CSS `@view-transition { navigation: auto }` cross-faden mellan index och galleri (Chrome 126+, Safari 18.2+). JS-fallbacken (fade-out + navigate) körs bara över `file://` eller i äldre webbläsare. Av i Essential/reduced-motion.
- **Lenis** — hämtas dynamiskt av `main.js` **bara i Cinematic**; Balanced/Essential laddar aldrig skriptet.
- **Cookie-notis + integritetsdialog** — sidan sätter inga spårningscookies. En notis visas en gång (`localStorage laljusne:cookies`), och footerns "Integritet & cookies" (`href="#integritet"`) öppnar ett `<dialog>` som listar exakt vad som sparas lokalt. Båda injiceras av `main.js`.
- **Toast** — global `showToast(text, [knapptext, callback])`, delas av formulär, FPS-vakt och chatt.

## 404-sida (Azure Static Web Apps)

`staticwebapp.config.json` skriver om alla 404 till `/404.html` med behållen statuskod 404 och sätter `X-Content-Type-Options: nosniff` + `Referrer-Policy`. Sidan använder absoluta sökvägar (`/css/style.css`, `/img/...`) eftersom den visas på godtycklig URL, delar tema/typografi med resten och har temaknapp. Lokalt: `npx serve .` och gå till `/404.html` (över `file://` funkar inte absoluta sökvägar).

## AI-chatt "Alva" (js/chat.js + css/chat.css)

Flytande knapp nere till höger. Widgeten injiceras av JS så HTML-filerna hålls rena.

- Nyckeln läses från `js/apikey.js` (**gitignorad** — Google spärrar nycklar i publika repon). Kopiera `js/apikey.example.js` → `js/apikey.js` och klistra in nyckel från https://aistudio.google.com/apikey.
- Utan nyckel, eller om API:et inte svarar inom 12 s per modell, svarar en lokal offline-hjärna med fakta om LA-Studio. Den publikt deployade sidan (Azure) kör därför alltid offline-läget — en riktig publik chatt behöver en backend-proxy.
- Systemprompt byggs från sidans fakta (tjänster, arbetssätt, exempelprojekt, "priser offereras individuellt"). Inga påhittade priser.
- Respekterar effektläget (ingen skrivmaskinsanimation i Essential) och temat.

## Effektlägen (data-perf)

Flytande sliders-knapp **nere till vänster** (chatten har höger). Sparas i `localStorage["laljusne:perfMode"]`, sätts före paint. Utan val: `prefers-reduced-motion` → Essential, annars **Balanced** (Cinematic är alltid opt-in).

| Läge | Innehåll |
|---|---|
| **Essential** | Inga animationer, ingen preloader/cursor/sidövergång, marquee står still, video med kontroller, reveals/split-text/count-up av (slutvärden direkt) |
| **Balanced** (default) | Reveals, split-text, count-up, marquee, hover, autorotation, video, sidövergång — men ingen Lenis/cursor/parallax |
| **Cinematic** | Allt + Lenis + custom cursor + magnetiska knappar + parallax. FPS-vakt föreslår Balanced vid < 45 fps |

Lagerordning (`--z-*`): nav 1000 < effektväljare 1400 < chatt 1450 < backdrop 1500 < mobilmeny 1600 < toast 2100 < cursor 2500 < preloader 3000. `<dialog>` ligger i top layer.

## Design & tema

- Färger: off-white `#eeefec`, oliv `#747247` (+ `--accent-strong #5c5a35` för liten text, WCAG AA), LJUSNE-gul `#c8b832`. Knappar på accent använder `--on-accent` (vit i ljust, nästan svart i mörkt läge för kontrast).
- Olivtonade skuggor, egna mörkare värden i dark mode, radius 2–4 px, eyebrows med flankerande linjer.
- Dark mode: `data-theme="dark"` före paint, `localStorage.theme`, `color-scheme` följer temat (formulär/scrollbar). Loggan blir pipigul via CSS-filter.
- `<meta name="theme-color">` för ljust/mörkt, Open Graph-taggar, skip-link till innehållet.

## Hur man kör

Öppna `index.html` direkt, eller `npx serve .` — inga byggsteg. För AI-chatten: skapa `js/apikey.js` enligt ovan.

## Responsivt

Breakpoints **1200 / 1024 / 880 / 768 / 480** (intervallsyntax). ≤880 hamburgare (slide-in-meny med X-knapp, hamburgaren göms medan menyn är öppen), ≤768 stats 2×2 + Om mig staplad + testimonials 1 kolumn + footer 2 kolumner + cursor av + toast ovanför de flytande knapparna, ≤480 footer/galleri 1 kolumn. `overflow-x: hidden` på både `html` och `body`.

Bilder: `width`/`height` på alla `<img>` (ingen layout-shift), `srcset` med 1400px-varianter för de tre 4400px-fotona, `loading="lazy"` under vecket, `fetchpriority="high"` på logga + första slide.

## Webbläsarstöd

Chrome 111+, Firefox 113+, Safari 16.4+ (`color-mix`, `:has`, intervall-media-queries, `<dialog>`). `100dvh` med `100vh`-fallback.
