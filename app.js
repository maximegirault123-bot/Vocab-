(function () {
  "use strict";

  const WORDS = window.WORDS;
  const STORAGE_KEY = "lexicon-progress-v1";
  const MAX_LEVEL = 3; // niveau à partir duquel un mot est « maîtrisé »
  const LEVEL_LABELS = { 1: "Soutenu", 2: "Rare", 3: "Très rare" };
  const app = document.getElementById("app");

  // ---------- Persistance ----------

  function defaultState() {
    return { words: {}, bestScore: 0, quizzesPlayed: 0, answers: 0, correct: 0 };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? Object.assign(defaultState(), JSON.parse(raw)) : defaultState();
    } catch (e) {
      return defaultState();
    }
  }

  let state = load();

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* stockage indisponible (navigation privée) : on continue sans sauvegarde */
    }
  }

  function prog(word) {
    if (!state.words[word]) state.words[word] = { seen: false, level: 0, right: 0, wrong: 0 };
    return state.words[word];
  }
  const peek = (word) => state.words[word] || { seen: false, level: 0, right: 0, wrong: 0 };
  const isSeen = (w) => peek(w.word).seen;
  const isMastered = (w) => peek(w.word).level >= MAX_LEVEL;
  const needsReview = (w) => peek(w.word).wrong > 0 && !isMastered(w);

  // ---------- Utilitaires ----------

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const sample = (arr, n) => shuffle(arr).slice(0, n);

  function exampleHtml(example) {
    return esc(example).replace(/\*\*(.+?)\*\*/g, "<mark>$1</mark>");
  }

  function exampleWithBlank(example) {
    return esc(example).replace(/\*\*(.+?)\*\*/g, '<span class="blank">&nbsp;</span>');
  }

  function normalize(s) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  function dots(level) {
    let html = "";
    for (let i = 1; i <= MAX_LEVEL; i++) html += i <= level ? "●" : '<span class="off">●</span>';
    return `<span class="dots" aria-label="Maîtrise ${level} sur ${MAX_LEVEL}">${html}</span>`;
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR";
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  function wordOfTheDay() {
    const d = new Date();
    const dayIndex = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
    return WORDS[(dayIndex * 7919) % WORDS.length];
  }

  // Fiche complète d'un mot (utilisée en découverte, lexique, mot du jour).
  function wordCardBody(w) {
    const p = peek(w.word);
    return `
      <div class="word-head">
        <div>
          <div class="word">${esc(w.word)}</div>
          <div class="wtype">${esc(w.type)}</div>
        </div>
        <button class="speak" data-speak="${esc(w.word)}" aria-label="Écouter la prononciation">🔊</button>
      </div>
      <div class="tags">
        <span class="tag">${LEVEL_LABELS[w.level]}</span>
        ${p.level >= MAX_LEVEL ? '<span class="tag mastered">Maîtrisé</span>' : ""}
      </div>
      <p class="definition">${esc(w.definition)}</p>
      <p class="example">${exampleHtml(w.example)}</p>
      ${w.etymology ? `<p class="etym">${esc(w.etymology)}</p>` : ""}`;
  }

  // ---------- Navigation ----------

  const views = { home: renderHome, discover: renderDiscover, quiz: renderQuiz, lexicon: renderLexicon };

  function route() {
    const name = (location.hash || "#home").slice(1);
    const view = views[name] ? name : "home";
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.nav === view));
    closeModal();
    views[view]();
    window.scrollTo(0, 0);
  }

  function go(name) {
    if (location.hash === "#" + name) route();
    else location.hash = name;
  }

  document.addEventListener("click", (e) => {
    const nav = e.target.closest("[data-nav]");
    if (nav) go(nav.dataset.nav);
    const sp = e.target.closest("[data-speak]");
    if (sp) {
      e.stopPropagation();
      speak(sp.dataset.speak);
    }
  });

  window.addEventListener("hashchange", route);

  // ---------- Accueil ----------

  function renderHome() {
    const seen = WORDS.filter(isSeen).length;
    const mastered = WORDS.filter(isMastered).length;
    const pct = Math.round((mastered / WORDS.length) * 100);
    const wotd = wordOfTheDay();

    app.innerHTML = `
      <div class="fade-in">
        <div class="header">
          <h1 class="brand">Lexi<span>con</span></h1>
          <span class="muted small">${WORDS.length} mots rares</span>
        </div>

        <div class="stats">
          <div class="stat"><b>${seen}</b><span>Découverts</span></div>
          <div class="stat"><b>${mastered}</b><span>Maîtrisés</span></div>
          <div class="stat"><b>${state.bestScore}</b><span>Record quiz</span></div>
        </div>
        <div class="progress" aria-label="Progression"><i style="width:${pct}%"></i></div>
        <p class="muted small">${pct}% du lexique maîtrisé</p>

        <div class="section-title">Mot du jour</div>
        <div class="card" data-open="${esc(wotd.word)}" role="button" tabindex="0">
          <div class="word-head">
            <div>
              <div class="word">${esc(wotd.word)}</div>
              <div class="wtype">${esc(wotd.type)}</div>
            </div>
            <button class="speak" data-speak="${esc(wotd.word)}" aria-label="Écouter">🔊</button>
          </div>
          <p class="definition">${esc(wotd.definition)}</p>
        </div>

        <div class="section-title">Modes de jeu</div>
        <button class="mode-card" data-nav="discover">
          <span class="ico">✦</span>
          <span><h3>Découverte</h3><p>Apprenez de nouveaux mots, carte après carte.</p></span>
        </button>
        <button class="mode-card" data-nav="quiz">
          <span class="ico">?</span>
          <span><h3>Quiz</h3><p>Vérifiez que les mots sont bien assimilés.</p></span>
        </button>
        <button class="mode-card" data-nav="lexicon">
          <span class="ico">≡</span>
          <span><h3>Lexique</h3><p>Parcourez tous les mots et votre progression.</p></span>
        </button>

        <button class="btn ghost" id="reset" style="margin-top:24px">Réinitialiser ma progression</button>
      </div>`;

    app.querySelector("[data-open]").addEventListener("click", (e) => {
      if (e.target.closest("[data-speak]")) return;
      prog(wotd.word).seen = true;
      save();
      openModal(wotd);
    });
    document.getElementById("reset").addEventListener("click", () => {
      if (confirm("Effacer toute votre progression ?")) {
        state = defaultState();
        save();
        renderHome();
      }
    });
  }

  // ---------- Mode Découverte ----------

  const discover = { filter: "new", deck: [], index: 0, revealed: false };

  function buildDeck(filter) {
    let pool;
    if (filter === "new") pool = WORDS.filter((w) => !isSeen(w));
    else if (filter === "review") pool = WORDS.filter((w) => isSeen(w) && !isMastered(w));
    else pool = WORDS;
    return shuffle(pool);
  }

  function renderDiscover() {
    if (!discover.deck.length || discover.index >= discover.deck.length) {
      discover.deck = buildDeck(discover.filter);
      discover.index = 0;
      discover.revealed = false;
    }
    const chips = [
      ["new", "Nouveaux"],
      ["review", "À consolider"],
      ["all", "Tous"],
    ]
      .map(([k, l]) => `<button class="chip ${discover.filter === k ? "on" : ""}" data-filter="${k}">${l}</button>`)
      .join("");

    let body;
    if (!discover.deck.length) {
      body = `<div class="empty">
          <p>${discover.filter === "new" ? "Bravo, vous avez découvert tous les mots ! 🎉" : "Aucun mot à consolider pour l'instant."}</p>
          <button class="btn" data-nav="quiz">Tester mes connaissances</button>
        </div>`;
    } else {
      const w = discover.deck[discover.index];
      body = `
        <div class="counter">
          <span>Carte ${discover.index + 1} / ${discover.deck.length}</span>
          ${dots(peek(w.word).level)}
        </div>
        <div class="progress" style="margin-bottom:14px"><i style="width:${(discover.index / discover.deck.length) * 100}%"></i></div>
        ${
          discover.revealed
            ? `<div class="card fade-in">${wordCardBody(w)}</div>
               <div class="btn-row">
                 <button class="btn secondary" data-mark="known">Je le connaissais</button>
                 <button class="btn" data-mark="new">Nouveau pour moi</button>
               </div>`
            : `<div class="card fade-in" id="flip" role="button" tabindex="0">
                 <div class="word-head">
                   <div>
                     <div class="word">${esc(w.word)}</div>
                     <div class="wtype">${esc(w.type)}</div>
                   </div>
                   <button class="speak" data-speak="${esc(w.word)}" aria-label="Écouter">🔊</button>
                 </div>
                 <div class="tags"><span class="tag">${LEVEL_LABELS[w.level]}</span></div>
                 <div class="reveal-hint">Devinez le sens…<br><b>Touchez pour révéler</b></div>
               </div>`
        }`;
    }

    app.innerHTML = `
      <div class="fade-in">
        <h2>Découverte</h2>
        <div class="option-group">${chips}</div>
        ${body}
      </div>`;

    app.querySelectorAll("[data-filter]").forEach((b) =>
      b.addEventListener("click", () => {
        discover.filter = b.dataset.filter;
        discover.deck = [];
        renderDiscover();
      })
    );
    const flip = document.getElementById("flip");
    if (flip) {
      flip.addEventListener("click", (e) => {
        if (e.target.closest("[data-speak]")) return;
        discover.revealed = true;
        renderDiscover();
      });
    }
    app.querySelectorAll("[data-mark]").forEach((b) =>
      b.addEventListener("click", () => {
        const w = discover.deck[discover.index];
        const p = prog(w.word);
        p.seen = true;
        if (b.dataset.mark === "known") p.level = Math.max(p.level, 1);
        save();
        discover.index++;
        discover.revealed = false;
        if (discover.index >= discover.deck.length) renderDiscoverDone();
        else renderDiscover();
      })
    );
  }

  function renderDiscoverDone() {
    const n = discover.deck.length;
    discover.deck = [];
    app.innerHTML = `
      <div class="fade-in empty">
        <div class="result-big">✦</div>
        <h2>Série terminée !</h2>
        <p>Vous avez parcouru ${n} mot${n > 1 ? "s" : ""}. Passez au quiz pour les ancrer dans votre mémoire.</p>
        <button class="btn" data-nav="quiz">Lancer un quiz</button>
        <button class="btn ghost" style="margin-top:10px" data-nav="discover">Continuer la découverte</button>
      </div>`;
  }

  // ---------- Mode Quiz ----------

  const quizSetup = { source: "seen", length: 10 };
  let quiz = null;

  function quizPool(source) {
    if (source === "seen") return WORDS.filter(isSeen);
    if (source === "review") return WORDS.filter(needsReview);
    return WORDS;
  }

  function makeQuestion(w) {
    const type = shuffle(["definition", "word", "blank"])[0];
    // Pour les phrases à trous, on privilégie des leurres de même nature grammaticale.
    let others = WORDS.filter((o) => o.word !== w.word);
    if (type === "blank") {
      const sameType = others.filter((o) => o.type.split(" ")[0] === w.type.split(" ")[0]);
      if (sameType.length >= 3) others = sameType;
    }
    const options = shuffle([w].concat(sample(others, 3)));
    return { w, type, options, answered: null };
  }

  function startQuiz(words) {
    quiz = {
      questions: words.map(makeQuestion),
      index: 0,
      score: 0,
      streak: 0,
      bestStreak: 0,
      correct: 0,
    };
    renderQuiz();
  }

  function renderQuiz() {
    if (!quiz) return renderQuizSetup();
    if (quiz.index >= quiz.questions.length) return renderQuizResult();
    renderQuestion();
  }

  function renderQuizSetup() {
    const sources = [
      ["seen", "Mots découverts", WORDS.filter(isSeen).length],
      ["all", "Tous les mots", WORDS.length],
      ["review", "Mes erreurs", WORDS.filter(needsReview).length],
    ];
    if (!quizPool(quizSetup.source).length) quizSetup.source = "all";

    app.innerHTML = `
      <div class="fade-in">
        <h2>Quiz</h2>
        <p class="muted">Trois types de questions : trouver la définition, retrouver le mot, compléter une phrase.</p>

        <div class="section-title">Mots interrogés</div>
        <div class="option-group">
          ${sources
            .map(
              ([k, l, n]) =>
                `<button class="chip ${quizSetup.source === k ? "on" : ""}" data-source="${k}" ${n ? "" : "disabled"}>${l} (${n})</button>`
            )
            .join("")}
        </div>

        <div class="section-title">Nombre de questions</div>
        <div class="option-group">
          ${[5, 10, 20]
            .map((n) => `<button class="chip ${quizSetup.length === n ? "on" : ""}" data-length="${n}">${n}</button>`)
            .join("")}
        </div>

        <div class="panel small muted" style="margin:18px 0">
          Chaque bonne réponse fait progresser la maîtrise du mot (${dots(MAX_LEVEL)}),
          chaque erreur la fait reculer. Enchaînez les bonnes réponses pour gagner des points bonus !
        </div>

        <button class="btn" id="start">Commencer</button>
      </div>`;

    app.querySelectorAll("[data-source]").forEach((b) =>
      b.addEventListener("click", () => {
        quizSetup.source = b.dataset.source;
        renderQuizSetup();
      })
    );
    app.querySelectorAll("[data-length]").forEach((b) =>
      b.addEventListener("click", () => {
        quizSetup.length = Number(b.dataset.length);
        renderQuizSetup();
      })
    );
    document.getElementById("start").addEventListener("click", () => {
      const pool = quizPool(quizSetup.source);
      // Les mots les moins maîtrisés passent en priorité.
      const ordered = shuffle(pool).sort((a, b) => peek(a.word).level - peek(b.word).level);
      startQuiz(shuffle(ordered.slice(0, quizSetup.length)));
    });
  }

  function renderQuestion() {
    const q = quiz.questions[quiz.index];
    const total = quiz.questions.length;
    let prompt, optionLabel, serif;

    if (q.type === "definition") {
      prompt = `<div class="prompt-label">Que signifie…</div>
                <div class="prompt-text big">${esc(q.w.word)} <span class="wtype" style="font-size:1rem">${esc(q.w.type)}</span></div>`;
      optionLabel = (o) => esc(o.definition);
      serif = false;
    } else if (q.type === "word") {
      prompt = `<div class="prompt-label">Quel mot correspond à cette définition ?</div>
                <div class="prompt-text">${esc(q.w.definition)}</div>`;
      optionLabel = (o) => esc(o.word);
      serif = true;
    } else {
      prompt = `<div class="prompt-label">Complétez la phrase</div>
                <div class="prompt-text">${exampleWithBlank(q.w.example)}</div>`;
      optionLabel = (o) => esc(o.word);
      serif = true;
    }

    const answered = q.answered !== null;
    const choices = q.options
      .map((o, i) => {
        let cls = "choice" + (serif ? " serif" : "");
        if (answered) {
          if (o === q.w) cls += " correct";
          else if (i === q.answered) cls += " wrong";
        }
        return `<button class="${cls}" data-choice="${i}" ${answered ? "disabled" : ""}>${optionLabel(o)}</button>`;
      })
      .join("");

    let feedback = "";
    if (answered) {
      const ok = q.options[q.answered] === q.w;
      feedback = `
        <div class="feedback ${ok ? "ok" : "ko"} fade-in">
          ${ok ? "✅ Bonne réponse !" : "❌ Raté…"}
          <div style="margin-top:6px"><b>${esc(q.w.word)}</b> : ${esc(q.w.definition)}</div>
          <div class="small muted" style="margin-top:6px"><i>${exampleHtml(q.w.example)}</i></div>
        </div>
        <button class="btn" id="next" style="margin-top:14px">${quiz.index + 1 < total ? "Question suivante" : "Voir le résultat"}</button>`;
    }

    app.innerHTML = `
      <div class="fade-in">
        <div class="score-line">
          <span>Question ${quiz.index + 1} / ${total}</span>
          <span>${quiz.streak >= 2 ? `<span class="streak">🔥 ${quiz.streak}</span> · ` : ""}${quiz.score} pts</span>
        </div>
        <div class="progress" style="margin-bottom:14px"><i style="width:${(quiz.index / total) * 100}%"></i></div>
        <div class="card">${prompt}</div>
        <div class="choices">${choices}</div>
        ${feedback}
        <button class="btn ghost" id="quit" style="margin-top:18px">Abandonner</button>
      </div>`;

    app.querySelectorAll("[data-choice]").forEach((b) =>
      b.addEventListener("click", () => answer(Number(b.dataset.choice)))
    );
    const next = document.getElementById("next");
    if (next) {
      next.addEventListener("click", () => {
        quiz.index++;
        renderQuiz();
        window.scrollTo(0, 0);
      });
      next.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    document.getElementById("quit").addEventListener("click", () => {
      quiz = null;
      renderQuiz();
    });
  }

  function answer(i) {
    const q = quiz.questions[quiz.index];
    if (q.answered !== null) return;
    q.answered = i;
    const ok = q.options[i] === q.w;
    const p = prog(q.w.word);
    p.seen = true;
    state.answers++;
    if (ok) {
      p.right++;
      p.level = Math.min(MAX_LEVEL, p.level + 1);
      quiz.correct++;
      quiz.streak++;
      quiz.bestStreak = Math.max(quiz.bestStreak, quiz.streak);
      quiz.score += 10 + Math.min(quiz.streak - 1, 5) * 2;
      state.correct++;
    } else {
      p.wrong++;
      p.level = Math.max(0, p.level - 1);
      quiz.streak = 0;
    }
    if (navigator.vibrate) navigator.vibrate(ok ? 20 : [40, 40, 40]);
    save();
    renderQuestion();
  }

  function renderQuizResult() {
    const total = quiz.questions.length;
    if (!quiz.recorded) {
      quiz.recorded = true;
      quiz.isRecord = quiz.score > state.bestScore;
      state.quizzesPlayed++;
      if (quiz.isRecord) state.bestScore = quiz.score;
      save();
    }
    const ratio = quiz.correct / total;
    const verdict =
      ratio === 1 ? "Sans faute, quelle érudition !" :
      ratio >= 0.7 ? "Très beau score !" :
      ratio >= 0.4 ? "C'est un bon début, continuez !" :
      "Ces mots sont coriaces… revoyez-les en mode découverte.";
    const missed = quiz.questions.filter((q) => q.options[q.answered] !== q.w).map((q) => q.w);

    app.innerHTML = `
      <div class="fade-in">
        <h2 style="text-align:center">Résultat</h2>
        <div class="result-big">${quiz.correct} / ${total}</div>
        <p style="text-align:center" class="muted">${quiz.score} points · meilleure série ${quiz.bestStreak}
          ${quiz.isRecord ? "<br><b style='color:var(--gold)'>🏆 Nouveau record !</b>" : ""}</p>
        <p style="text-align:center">${verdict}</p>

        <div class="panel">
          <ul class="recap">
            ${quiz.questions
              .map((q) => {
                const ok = q.options[q.answered] === q.w;
                return `<li><span>${ok ? "✅" : "❌"} <b>${esc(q.w.word)}</b></span>${dots(peek(q.w.word).level)}</li>`;
              })
              .join("")}
          </ul>
        </div>

        <div class="btn-row">
          ${missed.length ? '<button class="btn secondary" id="retry-missed">Revoir mes erreurs</button>' : ""}
          <button class="btn" id="again">Nouveau quiz</button>
        </div>
      </div>`;

    document.getElementById("again").addEventListener("click", () => {
      quiz = null;
      renderQuiz();
    });
    const retry = document.getElementById("retry-missed");
    if (retry) retry.addEventListener("click", () => startQuiz(shuffle(missed)));
  }

  // ---------- Lexique ----------

  const lexicon = { query: "", filter: "all" };

  function renderLexicon() {
    const chips = [
      ["all", "Tous"],
      ["seen", "Découverts"],
      ["mastered", "Maîtrisés"],
      ["review", "À revoir"],
    ]
      .map(([k, l]) => `<button class="chip ${lexicon.filter === k ? "on" : ""}" data-lfilter="${k}">${l}</button>`)
      .join("");

    app.innerHTML = `
      <div class="fade-in">
        <h2>Lexique</h2>
        <input class="search" type="search" placeholder="Rechercher un mot ou une définition…" value="${esc(lexicon.query)}" aria-label="Rechercher">
        <div class="option-group">${chips}</div>
        <div id="list"></div>
      </div>`;

    const input = app.querySelector(".search");
    input.addEventListener("input", () => {
      lexicon.query = input.value;
      renderList();
    });
    app.querySelectorAll("[data-lfilter]").forEach((b) =>
      b.addEventListener("click", () => {
        lexicon.filter = b.dataset.lfilter;
        renderLexicon();
      })
    );
    renderList();
  }

  function renderList() {
    const q = normalize(lexicon.query.trim());
    const filters = { all: () => true, seen: isSeen, mastered: isMastered, review: needsReview };
    const items = WORDS.filter(filters[lexicon.filter])
      .filter((w) => !q || normalize(w.word).includes(q) || normalize(w.definition).includes(q))
      .sort((a, b) => a.word.localeCompare(b.word, "fr"));

    const list = document.getElementById("list");
    list.innerHTML = items.length
      ? `<p class="muted small">${items.length} mot${items.length > 1 ? "s" : ""}</p>` +
        items
          .map(
            (w) => `
          <button class="lex-item" data-open="${esc(w.word)}">
            <div class="row"><span class="w">${isSeen(w) ? "" : "🔒 "}${esc(w.word)}</span>${dots(peek(w.word).level)}</div>
            <div class="d">${isSeen(w) ? esc(w.definition) : "Pas encore découvert — touchez pour le découvrir"}</div>
          </button>`
          )
          .join("")
      : '<div class="empty">Aucun mot ne correspond.</div>';

    list.querySelectorAll("[data-open]").forEach((b) =>
      b.addEventListener("click", () => {
        const w = WORDS.find((x) => x.word === b.dataset.open);
        prog(w.word).seen = true;
        save();
        openModal(w);
        renderList();
      })
    );
  }

  // ---------- Fenêtre modale ----------

  function openModal(w) {
    closeModal();
    const m = document.createElement("div");
    m.className = "modal";
    m.innerHTML = `
      <div class="card" role="dialog" aria-modal="true">
        ${wordCardBody(w)}
        <button class="btn" style="margin-top:20px" id="close-modal">Fermer</button>
      </div>`;
    m.addEventListener("click", (e) => {
      if (e.target === m || e.target.id === "close-modal") closeModal();
    });
    document.body.appendChild(m);
  }

  function closeModal() {
    document.querySelectorAll(".modal").forEach((m) => m.remove());
  }

  // ---------- Démarrage ----------

  route();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
