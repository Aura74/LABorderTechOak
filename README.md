# LA-Studio — Ljusne

Portfolio-/studiosida för webbutveckling (demo, ingen backend). Vanilla HTML/CSS/JS — inga ramverk, inga byggverktyg. Två sidor: startsida (`index.html`) + gallerisida (`galleri.html`), som delar `style.css` och `app.js`.

## Tech Stack

| Del | Val | Kommentar |
|---|---|---|
| Typsnitt (rubriker) | Cormorant Garamond | Serif-display — editorial premiumkänsla |
| Typsnitt (text/UI) | Courier Prime | Monospace — behåller den techiga identiteten |
| Accent-font | Stick No Bills | Bara LJUSNE-baren |
| Ikoner (UI) | Font Awesome 6.5.1 | CDN — sociala ikoner, pilar, marquee-loggor |
| Ikoner (kort) | Lucide | CDN — `pen-tool`, `braces`, `cpu`, `puzzle` i oliv |
| Mjukscroll | Lenis 1.1.14 | CDN, initieras **endast** i effektläget Cinematic |
| Allt annat | Vanilla JS | Karusell, lightbox, filter, reveals, split-text, count-up, cursor, preloader, sidövergång |

**Byt tillbaka till helt monospace:** sätt `--font-display: var(--font-mono);` i `:root` (style.css).

## Projektstruktur

```
LABorderTechOakLjusne/
├── index.html          # Startsida
├── galleri.html        # Gallerisida med kategorifilter
├── style.css           # All styling (delas av båda sidorna)
├── app.js              # Alla beteenden (defensiv — funkar på båda sidorna)
└── img/
    ├── lagul2b.png         # LA STUDIO-loggan (pipigul i dark mode via CSS-filter)
    ├── favicon.svg / -32.png / apple-touch-icon.png
    ├── karusell/           # Karusell- + fotoväggs- + galleribilder
    ├── movies/             # Hero-video (mp4)
    └── galleri/R.jpg       # BEVARAS som fil — visas inte
```

**Porträtt:** Om mig-sektionen använder en CSS-platshållare (`.about-portrait` med LA-monogram). Byt mot `<img src="img/lars.jpg">` när ett foto finns (kommentar finns i index.html).

## Sektioner — index.html (i ordning)

| # | Sektion | Beskrivning |
|---|---|---|
| 1 | Hero | Logga + **serif-tagline** + sektionsnav |
| 2 | Karusell `#portfolio` | 5 case (Aurora Studio, Nordvik Interiör …), eyebrow + titel + beskrivning + CTA, pilar, prickar, autorotation |
| 3 | Vad vi gör `#vad-vi-gor` | Serif-rubrik + 4 kort med Lucide-ikoner |
| 4 | Teknik-marquee | Scrollande tech-loggor, pausar vid hover |
| 5 | Video | Autoplay bara när synlig |
| 6 | Tjänster `#tjanster` | Textsektion |
| 7 | Statistik | 4 tal med **count-up** vid scroll (120+ / 12 år / 100% / 24h) |
| 8 | Om mig `#om-mig` | Porträtt-platshållare + bio + signatur |
| 9 | Fotovägg `#galleri` | Klickbar → lightbox, LJUSNE-bar, länk till galleri.html |
| 10 | Omdömen `#omdomen` | 3 kundcitat (demo — live via Trustpilot/Yotpo) |
| 11 | Kontakt `#kontakt` | Formulär → demo-toast |
| 12 | Footer | CTA-block + 4 kolumner (brand/meny/tjänster/nyhetsbrev) + bottenrad |

## Galleri — galleri.html

12 rutor i 3-kolumnsgrid (jämn underkant), filter **Alla / Kreativt / Teknik / Miljö**, klick → lightbox (pilnavigering håller sig inom det filtrerade setet). Delar nav, footer, effektväljare, mobilmeny, lightbox, cursor och preloader med startsidan.

## Interaktiva delar (vanilla JS)

- **Lightbox** — alla `.lightbox-trigger` samlas i DOM-ordning; pilar/piltangenter/Escape; navigerar bara bland synliga (respekterar filter).
- **Split-text** — rubriker med `data-split` fadear in per tecken (25 ms stagger). Av i Essential/reduced-motion.
- **Count-up** — `.stat-number[data-count]` räknar upp vid scroll (IntersectionObserver).
- **Preloader** — LA-monogram, visas en gång per session (`sessionStorage`), fade-out. Aldrig i Essential.
- **Custom cursor + magnetiska CTA** — endast Cinematic + fine pointer. Native cursor göms först vid första musrörelsen.
- **Sidövergång** — fade-out vid klick på interna `.html`-länkar, fade-in vid load. Av i Essential.
- **Kontakt & nyhetsbrev** — demo (`preventDefault` + validering + toast). Live: Formspree/Netlify Forms, Klaviyo/Mailchimp.

## Effektlägen (data-perf)

Flytande knapp nere till höger. Sparas i `localStorage["laljusne:perfMode"]`, sätts före paint. Utan val: `prefers-reduced-motion` → Essential, annars **Balanced** (Cinematic är alltid opt-in).

| Läge | Innehåll |
|---|---|
| **Essential** | Inga animationer, ingen preloader/cursor/sidövergång, marquee står still, video pausad, reveals/split-text/count-up av (slutvärden visas direkt) |
| **Balanced** (default) | Reveals, split-text, count-up, marquee, hover, autorotation, video, sidövergång — men ingen Lenis/cursor/parallax |
| **Cinematic** | Allt + Lenis + custom cursor + magnetiska CTA + parallax. FPS-vakt föreslår Balanced vid < 45 fps |

## Design & tema

- Färger: off-white `#eeefec`, oliv `#747247` (+ `--accent-strong` för liten text), LJUSNE-gul `#c8b832`
- Olivtonade skuggor, egna mörkare värden i dark mode, radius 2–4 px
- Dark mode: `data-theme="dark"` före paint, `localStorage.theme`. Loggan blir pipigul via CSS-filter.
- Oliv scrollbar, animerad nav-understrykning

## Hur man kör

Öppna `index.html` direkt, eller `npx serve .` — inga byggsteg.

## Responsivt

Breakpoints **1200 / 1024 / 880 / 768 / 480**. ≤880 hamburgare, ≤768 stats 2×2 + Om mig staplad + testimonials 1 kolumn + footer 2 kolumner + cursor av, ≤480 stats/footer 1 kolumn. `overflow-x: hidden` på både `html` och `body`.

## Webbläsarstöd

Chrome 90+, Firefox 88+, Safari 14+. `100dvh`-fallback, utan IntersectionObserver visas allt direkt.
