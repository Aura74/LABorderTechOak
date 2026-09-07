/* ============================================================
   LA-STUDIO — js/chat.js
   "Alva" — AI-assistent med Gemini (modell-fallback) och en
   lokal offline-hjärna som svarar när nyckel saknas eller
   API:et inte svarar. Markup + stil: css/chat.css.

   Nyckeln läses från js/apikey.js (gitignorad — får ALDRIG
   committas; Google spärrar nycklar i publika GitHub-repon).
   Publikt deployad sida (Azure) kör därför offline-läget.
   ============================================================ */

(() => {
  "use strict";

  /* ----- Konfiguration ----- */
  const API_KEY = window.GEMINI_API_KEY || "";
  // Lite-modellen först: flash-latest kan hänga i 30+ s under last (2026-09-02)
  const MODELS = ["gemini-flash-lite-latest", "gemini-flash-latest"];
  const TIMEOUT_MS = 12000;
  const endpoint = (model) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const SITE_FACTS = `
Om LA-Studio:
• Webbstudio i Ljusne (Hälsingland), driven av grundaren Lars Asplund — över tolv år i branschen, 120+ levererade projekt.
• Tjänster: webbdesign (UX i fokus), webbutveckling (skräddarsydd logik), e-handel (varukorg, önskelista, Stripe-betalning), systemintegration/API-kopplingar, samt support & drift efteråt.
• Teknik: HTML, CSS, JavaScript, React, .NET, Node.js, Python, Sass, Git, Figma. Alltid modern, tillgänglig och snabb kod.
• Arbetssätt: nära samarbete från första skiss till lansering; tekniken förklaras i klartext. Svar på förfrågningar inom ett dygn.
• Exempelprojekt på sidan: Aurora Studio (portfolio med mörkt läge), Nordvik Interiör (e-handel), Ljusne Larm (bokning + kundportal), Fjärdens Fastigheter (objektsportal med kartsök), Kustväder (väderpanel i realtid).
• Kontakt: formuläret under "Kontakt" på startsidan (namn, e-post, meddelande). Det finns också ett nyhetsbrev i footern.
• Sidan har ljust/mörkt tema (månknappen uppe till höger), ett galleri (galleri.html) och en effektväljare nere till vänster med lägena Essential, Balanced och Cinematic för svagare respektive starkare datorer.
• Priser: inga fasta priser publiceras — varje projekt offereras individuellt efter ett kostnadsfritt första samtal.`;

  const SYSTEM_PROMPT = `Du är Alva, LA-Studios AI-assistent. LA-Studio är en webbstudio i Ljusne som drivs av Lars Asplund. Du pratar svenska.

Faktabas (utgå från den här — hitta inte på tjänster, priser eller kunder som inte finns här):
${SITE_FACTS}

Personlighet:
- Varm, saklig och rak. Som en kunnig kollega, inte en säljare.
- Kortfattad: 1–4 meningar om inte användaren ber om mer.
- Använd gärna **fetstil** för tjänster och viktiga ord. Inga emojis.

Regler:
- Svara på svenska om inte användaren skriver på ett annat språk.
- Frågor om pris: förklara att projekt offereras individuellt och hänvisa till kontaktformuläret.
- Ligger frågan helt utanför webb, design och LA-Studio: svara vänligt kort och styr tillbaka.
- Tekniska frågor om webb får du gärna svara på ordentligt — det är studions kompetens.`;

  /* ----- Ikoner (inline SVG, Lucide-stil) ----- */
  const ICON = {
    spark:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    reset:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    send:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>',
  };

  /* ----- Markup (injiceras så HTML-filerna hålls rena) ----- */
  function injectWidget() {
    const wrap = document.createElement("div");
    wrap.id = "chatRoot";
    wrap.innerHTML = `
      <button id="chatFab" class="chat-fab" type="button" aria-label="Fråga Alva">
        <span class="chat-fab__tip">Fråga Alva</span>${ICON.spark}
      </button>
      <section id="chatWidget" class="chat" hidden role="dialog" aria-modal="false" aria-label="Chatt med Alva">
        <header class="chat__head">
          <div class="chat__identity">
            <span class="chat__orb" aria-hidden="true"></span>
            <div><h3>Alva</h3><p class="chat__status">LA-Studios assistent</p></div>
          </div>
          <div class="chat__actions">
            <button class="chat__iconbtn" id="chatClear" type="button" aria-label="Börja om">${ICON.reset}</button>
            <button class="chat__iconbtn" id="chatClose" type="button" aria-label="Stäng chatten">${ICON.close}</button>
          </div>
        </header>
        <div class="chat__box" id="chatBox">
          <div id="chatMessages"></div>
          <div class="chat__typing" id="chatTyping" hidden><span></span><span></span><span></span></div>
        </div>
        <div class="chat__suggest" id="chatSuggest">
          <button class="chat__chip" type="button" data-msg="Vad kan LA-Studio hjälpa mig med?">Vad gör ni?</button>
          <button class="chat__chip" type="button" data-msg="Vad kostar en hemsida?">Vad kostar det?</button>
          <button class="chat__chip" type="button" data-msg="Hur går ett projekt till från start till lansering?">Hur går det till?</button>
        </div>
        <footer class="chat__inputrow">
          <textarea id="chatInput" class="chat__input" rows="1" maxlength="500" placeholder="Skriv till Alva …" aria-label="Skriv ditt meddelande"></textarea>
          <button id="chatSend" class="chat__send" type="button" aria-label="Skicka" disabled>${ICON.send}</button>
        </footer>
      </section>`;
    document.body.append(wrap);
  }

  /* ----- Lokal offline-hjärna ----- */
  const normalize = (str) =>
    str.toLowerCase().replace(/[åä]/g, "a").replace(/ö/g, "o").replace(/[?!.,'"]/g, "");

  const LOCAL_ANSWERS = [
    [/(pris|kostar|kostnad|offert|budget|betala)/, "LA-Studio publicerar inga fasta priser — varje projekt **offereras individuellt** efter ett kostnadsfritt första samtal. Skriv några rader i **kontaktformuläret** så får du en offert inom ett dygn."],
    [/(e-?handel|webshop|butik|shop|varukorg|stripe)/, "Ja, **e-handel** är en av kärntjänsterna: butiker med varukorg, önskelista och Stripe-betalning — som projektet *Nordvik Interiör* på startsidan."],
    [/(design|ux|utseende|layout|figma)/, "**Webbdesign med UX i fokus** — tydlig struktur, snygg typografi och en sida som känns lika genomtänkt i koden som på skärmen. Skisser görs i Figma innan en rad kod skrivs."],
    [/(api|integration|system|koppla|automat)/, "**Systemintegration** är en specialitet: LA-Studio kopplar ihop hemsidan med bokningssystem, betalning, CRM eller andra API:er så att allt pratar med varandra automatiskt."],
    [/(teknik|stack|react|net|node|python|sprak|kod)/, "Stacken är modern webb: **HTML, CSS, JavaScript**, React, .NET, Node.js och Python — plus Sass, Git och Figma. Alltid tillgänglig, snabb och lätt att förvalta."],
    [/(hur gar|process|tillvagagang|start|lansering|projekt till)/, "Så här går det till: **1)** kostnadsfritt samtal om mål och behov, **2)** skiss och design, **3)** utveckling med löpande avstämningar, **4)** lansering — och därefter gärna support & drift. Du får alltid tekniken förklarad i klartext."],
    [/(support|drift|underhall|efter lansering|hosting)/, "Efter lansering finns **support & drift**: uppdateringar, säkerhet, backup och små förbättringar löpande, så sidan fortsätter fungera och kännas ny."],
    [/(vem|lars|grundare|om er|om dig|vem ar)/, "LA-Studio drivs av **Lars Asplund** i Ljusne — över tolv år i branschen och 120+ levererade projekt. Läs mer under *Om mig* på startsidan."],
    [/(kontakt|mail|mejl|ring|telefon|hor av|boka)/, "Enklast är **kontaktformuläret** på startsidan (namn, e-post, meddelande). Lars hör av sig inom ett dygn."],
    [/(galleri|exempel|referens|portfolio|tidigare)/, "Kika på **karusellen** och **fotoväggen** på startsidan, eller gå till **galleriet** — där kan du filtrera på Kreativt, Teknik och Miljö."],
    [/(tid|hur lang|leveranstid|snabbt|deadline)/, "Det beror på omfattningen: en kampanjsida kan vara klar på **några veckor**, en e-handel eller kundportal tar längre. Berätta om ditt projekt i kontaktformuläret så får du en tidsplan i offerten."],
    [/(mork|dark|tema|effekt|cinematic|balanced|essential|langsam|hackar)/, "Sidan har **ljust/mörkt tema** (månknappen uppe till höger) och en **effektväljare** nere till vänster: *Essential* för äldre datorer, *Balanced* som standard och *Cinematic* med alla effekter."],
    [/(hej|halla|tjena|hello|hi|god morgon|god kvall)/, "Hej och välkommen! Jag är **Alva**, LA-Studios assistent. Fråga mig om tjänster, arbetssätt eller hur du kommer igång med ett projekt."],
    [/(tack|tackar|thanks)/, "Så lite så. Hör av dig via kontaktformuläret när du vill gå vidare."],
  ];

  function localAnswer(input) {
    const n = normalize(input);
    const hit = LOCAL_ANSWERS.find(([re]) => re.test(n));
    return (
      hit?.[1] ||
      "Jag är i **offline-läge** just nu och kan svara på det jag vet om LA-Studio — prova att fråga om *tjänster*, *pris*, *teknik* eller *hur ett projekt går till*."
    );
  }

  /* ----- Gemini-anrop med modell-fallback ----- */
  let history = [];

  async function callAI(userMessage) {
    history.push({ role: "user", parts: [{ text: userMessage }] });
    const body = JSON.stringify({
      contents: history,
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      // OBS: ingen thinkingConfig — ger 400 från Google (2026-08-11).
      generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 1024 },
    });

    for (const model of MODELS) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(endpoint(model), {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-goog-api-key": API_KEY },
          body,
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Tänkande modeller kan svara med content utan parts — behandla som tomt
        const parts = data.candidates?.[0]?.content?.parts ?? [];
        const text = parts.map((p) => p.text || "").join("").trim();
        if (!text) throw new Error("Tomt svar");
        history.push({ role: "model", parts: [{ text }] });
        if (history.length > 40) history = history.slice(-40);
        return text;
      } catch {
        // prova nästa modell
      } finally {
        clearTimeout(timer);
      }
    }
    history.pop(); // rulla tillbaka så historiken inte förgiftas
    throw new Error("Alla modeller misslyckades");
  }

  /* ----- UI ----- */
  const $ = (id) => document.getElementById(id);
  let isTyping = false;
  let hasOpened = false;
  let apiAvailable = API_KEY.length > 0;
  const isEssential = () => document.documentElement.dataset.perf === "essential";

  const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const formatText = (text) =>
    escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(?!\*)(.*?)\*(?!\*)/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");

  const scrollToBottom = () => {
    const box = $("chatBox");
    box.scrollTop = box.scrollHeight;
  };

  function addMessage(text, sender) {
    $("chatWelcome")?.remove();
    const msg = document.createElement("div");
    msg.className = `chat__msg chat__msg--${sender}`;
    const bubble = document.createElement("div");
    bubble.className = "chat__bubble";
    if (sender === "bot") bubble.innerHTML = formatText(text);
    else bubble.textContent = text;
    msg.append(bubble);
    $("chatMessages").append(msg);
    scrollToBottom();
    return bubble;
  }

  function typewriter(el, text) {
    const html = formatText(text);
    if (isEssential()) {
      el.innerHTML = html;
      scrollToBottom();
      return Promise.resolve();
    }
    // Skriv tecken för tecken men håll HTML-taggar hela
    const tokens = html.split(/(<[^>]+>)/).flatMap((part) => (part.startsWith("<") ? [part] : [...part]));
    const speed = Math.max(5, Math.min(18, 1100 / tokens.length));
    return new Promise((resolve) => {
      let out = "";
      let i = 0;
      const next = () => {
        if (i >= tokens.length) return resolve();
        const token = tokens[i++];
        out += token;
        el.innerHTML = out;
        scrollToBottom();
        setTimeout(next, token.startsWith("<") ? 0 : speed);
      };
      next();
    });
  }

  function showWelcome() {
    const div = document.createElement("div");
    div.id = "chatWelcome";
    div.className = "chat__welcome";
    div.innerHTML = `
      <span class="chat__orb chat__orb--big" aria-hidden="true"></span>
      <h4>Hej, jag är Alva</h4>
      <p>Fråga mig om LA-Studios tjänster, hur ett projekt går till eller vad som passar just din idé.</p>`;
    $("chatMessages").append(div);
  }

  async function sendMessage(raw) {
    const text = (raw || "").trim();
    if (!text || isTyping) return;
    isTyping = true;

    addMessage(text, "user");
    const input = $("chatInput");
    input.value = "";
    input.style.height = "auto";
    $("chatSend").disabled = true;
    $("chatSuggest").hidden = true;
    $("chatTyping").hidden = false;
    scrollToBottom();

    let response;
    if (apiAvailable) {
      try {
        response = await callAI(text);
      } catch {
        apiAvailable = false;
        response = `${localAnswer(text)}\n\n*(AI-tjänsten svarar inte just nu — jag använder min lokala kunskap om LA-Studio.)*`;
      }
    } else {
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
      response = localAnswer(text);
    }

    $("chatTyping").hidden = true;
    await typewriter(addMessage("", "bot"), response);
    isTyping = false;
  }

  function openWidget() {
    $("chatWidget").hidden = false;
    $("chatFab").classList.add("is-hidden");
    if (!hasOpened) {
      showWelcome();
      hasOpened = true;
    }
    setTimeout(() => $("chatInput").focus(), 250);
  }

  function closeWidget() {
    $("chatWidget").hidden = true;
    $("chatFab").classList.remove("is-hidden");
    $("chatFab").focus();
  }

  function clearChat() {
    $("chatMessages").replaceChildren();
    history = [];
    $("chatSuggest").hidden = false;
    showWelcome();
  }

  /* ----- Init (defer → DOM finns redan) ----- */
  injectWidget();

  $("chatFab").addEventListener("click", openWidget);
  $("chatClose").addEventListener("click", closeWidget);
  $("chatClear").addEventListener("click", clearChat);

  const input = $("chatInput");
  input.addEventListener("input", () => {
    $("chatSend").disabled = input.value.trim().length === 0;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 96)}px`;
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.value);
    }
  });
  $("chatSend").addEventListener("click", () => sendMessage(input.value));
  $("chatSuggest").addEventListener("click", (e) => {
    const chip = e.target.closest(".chat__chip");
    if (chip) sendMessage(chip.dataset.msg);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("chatWidget").hidden) closeWidget();
  });
})();
