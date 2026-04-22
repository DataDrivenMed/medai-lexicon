// app.jsx — main UI: landing, module nav, lesson player, quiz, progress, tweaks
const { useState, useEffect, useMemo, useRef } = React;

// ── storage ──
const STORE_KEY = "medai_lex_v1";
function loadStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); } catch { return {}; }
}
function saveStore(s) { localStorage.setItem(STORE_KEY, JSON.stringify(s)); }

// ── progress model ──
//   state = { completed: { [termName]: true }, quizScores: { [termName]: 0|1 }, lastTerm: string, persona: string }
const useProgress = () => {
  const [state, setState] = useState(() => ({ completed:{}, quizScores:{}, lastTerm:null, persona:"physician", ...loadStore() }));
  useEffect(() => { saveStore(state); }, [state]);
  return [state, setState];
};

// ── tweak defaults ──
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentHue": 45,
  "pacing": 1,
  "headlineFont": "Playfair Display",
  "density": "comfortable",
  "bgMode": "ink"
}/*EDITMODE-END*/;

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
function App() {
  const [progress, setProgress] = useProgress();
  const [view, setView] = useState("home"); // home | module | lesson
  const [activeCluster, setActiveCluster] = useState(null);
  const [activeTermIdx, setActiveTermIdx] = useState(0); // within module
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  // Tweaks protocol
  useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === "__activate_edit_mode") setTweaksOpen(true);
      if (e.data?.type === "__deactivate_edit_mode") setTweaksOpen(false);
    };
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const updateTweak = (k, v) => {
    const next = { ...tweaks, [k]: v };
    setTweaks(next);
    window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { [k]: v } }, "*");
  };

  // Apply CSS vars from tweaks
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent-hue", tweaks.accentHue);
    root.style.setProperty("--headline-font", `'${tweaks.headlineFont}', serif`);
    root.style.setProperty("--density-pad", tweaks.density === "compact" ? "12px" : tweaks.density === "spacious" ? "28px" : "20px");
    if (tweaks.bgMode === "cream") {
      root.style.setProperty("--bg", "#f5f3ee");
      root.style.setProperty("--surface", "#ffffff");
      root.style.setProperty("--ink", "#0d1117");
      root.style.setProperty("--ink-soft", "#2d3748");
      root.style.setProperty("--ink-muted", "#64748b");
      root.style.setProperty("--border", "rgba(13,17,23,0.1)");
    } else {
      root.style.setProperty("--bg", "#0e1014");
      root.style.setProperty("--surface", "#171a20");
      root.style.setProperty("--ink", "#f5f3ee");
      root.style.setProperty("--ink-soft", "#d2cfc8");
      root.style.setProperty("--ink-muted", "#8e8b84");
      root.style.setProperty("--border", "rgba(245,243,238,0.09)");
    }
  }, [tweaks]);

  // Derived
  const termsByCluster = useMemo(() => {
    const g = {};
    window.TERMS.forEach(t => { (g[t.cluster] ??= []).push(t); });
    return g;
  }, []);
  const totalTerms = window.TERMS.length;
  const completedCount = Object.keys(progress.completed).length;

  // Navigation
  const openModule = (cluster) => {
    setActiveCluster(cluster);
    const firstIncomplete = termsByCluster[cluster].findIndex(t => !progress.completed[t.name]);
    setActiveTermIdx(firstIncomplete >= 0 ? firstIncomplete : 0);
    setView("lesson");
  };
  const openTerm = (cluster, termName) => {
    setActiveCluster(cluster);
    const idx = termsByCluster[cluster].findIndex(t => t.name === termName);
    setActiveTermIdx(idx >= 0 ? idx : 0);
    setView("lesson");
  };
  const currentTerms = activeCluster ? termsByCluster[activeCluster] : [];
  const currentTerm = currentTerms[activeTermIdx];

  const markComplete = (termName, quizScore) => {
    setProgress(p => ({
      ...p,
      completed: { ...p.completed, [termName]: true },
      quizScores: quizScore != null ? { ...p.quizScores, [termName]: quizScore } : p.quizScores,
      lastTerm: termName,
    }));
  };

  const gotoNext = () => {
    const nextIdx = activeTermIdx + 1;
    if (nextIdx < currentTerms.length) {
      setActiveTermIdx(nextIdx);
    } else {
      // module finished — back to module map
      setView("home");
    }
  };
  const gotoPrev = () => { if (activeTermIdx > 0) setActiveTermIdx(activeTermIdx - 1); };

  return (
    <div className="app-root">
      <TopBar view={view} setView={setView}
              completedCount={completedCount} totalTerms={totalTerms}
              activeCluster={activeCluster}/>

      {view === "home" && (
        <HomeView
          termsByCluster={termsByCluster} progress={progress}
          onOpenModule={openModule} onOpenTerm={openTerm}
          completedCount={completedCount} totalTerms={totalTerms}
          onReset={() => { setProgress({ completed:{}, quizScores:{}, lastTerm:null, persona: progress.persona }); }}
        />
      )}

      {view === "lesson" && currentTerm && (
        <LessonView
          term={currentTerm}
          cluster={activeCluster}
          terms={currentTerms}
          index={activeTermIdx}
          setIndex={setActiveTermIdx}
          progress={progress}
          persona={progress.persona}
          setPersona={(p) => setProgress(s => ({ ...s, persona: p }))}
          onMarkComplete={markComplete}
          onNext={gotoNext}
          onPrev={gotoPrev}
          onBack={() => setView("home")}
          onJumpTerm={(name) => {
            const t = window.TERMS.find(x => x.name === name);
            if (t) openTerm(t.cluster, t.name);
          }}
          pacing={tweaks.pacing}
        />
      )}

      {tweaksOpen && (
        <TweaksPanel tweaks={tweaks} update={updateTweak} onClose={() => setTweaksOpen(false)}/>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Top bar
// ═══════════════════════════════════════════════════════════════════════════
function TopBar({ view, setView, completedCount, totalTerms, activeCluster }) {
  const pct = Math.round((completedCount / totalTerms) * 100);
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand" onClick={() => setView("home")}>
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
              <path d="M12 3l8 4v6l-8 4-8-4V7l8-4z" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M12 3v14M4 7l8 4 8-4" stroke="currentColor" strokeWidth="1.6"/>
            </svg>
          </div>
          <div className="brand-text">
            <div className="brand-title">MedAI Lexicon</div>
            <div className="brand-sub">Interactive Guide · Ram Paragi, MD</div>
          </div>
        </button>

        <div className="topbar-progress">
          <div className="tp-ring">
            <svg width="36" height="36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border)" strokeWidth="2.5"/>
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--accent)" strokeWidth="2.5"
                      strokeDasharray={`${(pct/100) * 94.25} 94.25`} strokeLinecap="round"
                      transform="rotate(-90 18 18)"/>
            </svg>
            <div className="tp-pct">{pct}%</div>
          </div>
          <div className="tp-text">
            <div className="tp-n">{completedCount} <span>/ {totalTerms}</span></div>
            <div className="tp-lbl">concepts learned</div>
          </div>
        </div>

        <nav className="topnav">
          <a href="index.html">← Lexicon</a>
        </nav>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Home: module cards + jump-to-lesson list
// ═══════════════════════════════════════════════════════════════════════════
function HomeView({ termsByCluster, progress, onOpenModule, onOpenTerm, completedCount, totalTerms, onReset }) {
  const next = useMemo(() => {
    if (progress.lastTerm && !progress.completed[progress.lastTerm]) {
      const t = window.TERMS.find(x => x.name === progress.lastTerm);
      if (t) return t;
    }
    return window.TERMS.find(t => !progress.completed[t.name]) || null;
  }, [progress]);

  return (
    <main className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-label">Interactive Teaching Guide</div>
        <h1 className="hero-h">
          The Language of <em>Medical AI</em>,<br/>
          <span className="hero-taught">animated and taught.</span>
        </h1>
        <p className="hero-sub">
          {totalTerms} bite-sized lessons. Each concept gets a custom animation, a role-specific explanation,
          and a check-for-understanding. Progress saves automatically.
        </p>

        <div className="hero-cta">
          {next ? (
            <button className="btn-primary" onClick={() => onOpenTerm(next.cluster, next.name)}>
              <span>{completedCount === 0 ? "Begin the journey" : "Continue"}</span>
              <span className="btn-sub">{next.name} · {window.CLUSTERS[next.cluster].short}</span>
              <svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>
            </button>
          ) : (
            <button className="btn-primary" onClick={() => onReset()}>
              <span>🎉 All {totalTerms} lessons complete — restart?</span>
            </button>
          )}
          {completedCount > 0 && (
            <button className="btn-ghost" onClick={onReset}>Reset progress</button>
          )}
        </div>

        <div className="hero-meta">
          <div className="hm-item"><div className="hm-n">{totalTerms}</div><div className="hm-l">lessons</div></div>
          <div className="hm-divider"/>
          <div className="hm-item"><div className="hm-n">5</div><div className="hm-l">modules</div></div>
          <div className="hm-divider"/>
          <div className="hm-item"><div className="hm-n">3</div><div className="hm-l">personas</div></div>
        </div>
      </section>

      {/* Modules */}
      <section className="modules">
        <div className="section-lbl">The Curriculum</div>
        <h2 className="section-h">Five modules, one connected journey.</h2>
        <div className="modules-grid">
          {window.CURRICULUM.map((cluster, i) => {
            const cfg = window.CLUSTERS[cluster];
            const terms = termsByCluster[cluster] || [];
            const done = terms.filter(t => progress.completed[t.name]).length;
            const pct = Math.round((done / terms.length) * 100);
            return (
              <button key={cluster} className="mod-card" onClick={() => onOpenModule(cluster)} style={{ "--hue": cfg.hue }}>
                <div className="mod-head">
                  <div className="mod-num">0{i+1}</div>
                  <div className="mod-tag">{cfg.short}</div>
                </div>
                <div className="mod-title">{cfg.label}</div>
                <div className="mod-blurb">{cfg.blurb}</div>
                <div className="mod-terms">
                  {terms.slice(0, 6).map(t => (
                    <span key={t.name} className={"mod-term" + (progress.completed[t.name] ? " done" : "")}>{t.name}</span>
                  ))}
                  {terms.length > 6 && <span className="mod-term-more">+{terms.length - 6}</span>}
                </div>
                <div className="mod-footer">
                  <div className="mod-bar"><div className="mod-bar-fill" style={{ width: pct + "%" }}/></div>
                  <div className="mod-pct">{done}/{terms.length}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* All terms quick grid */}
      <section className="browse">
        <div className="section-lbl">Or jump anywhere</div>
        <h2 className="section-h">All {totalTerms} concepts at a glance.</h2>
        <div className="browse-grid">
          {window.TERMS.map(t => {
            const cfg = window.CLUSTERS[t.cluster];
            const done = progress.completed[t.name];
            return (
              <button key={t.name} className={"brw" + (done ? " done" : "")}
                      onClick={() => onOpenTerm(t.cluster, t.name)}
                      style={{ "--hue": cfg.hue }}>
                <span className="brw-dot"/>
                <span className="brw-name">{t.name}</span>
                <span className="brw-cl">{cfg.short}</span>
                {done && <span className="brw-check">✓</span>}
              </button>
            );
          })}
        </div>
      </section>

      <footer className="site-foot">
        <div>MedAI Lexicon · Interactive Guide</div>
        <div className="foot-disc">An educational tool, not a medical device. Always verify AI output against current guidelines and institutional policy.</div>
      </footer>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Lesson player
// ═══════════════════════════════════════════════════════════════════════════
function LessonView({ term, cluster, terms, index, setIndex, progress, persona, setPersona,
                      onMarkComplete, onNext, onPrev, onBack, onJumpTerm, pacing }) {
  const cfg = window.CLUSTERS[cluster];
  const Anim = window.ANIM_REGISTRY[term.anim];
  const [stage, setStage] = useState("learn"); // learn | quiz | recap
  const [quizPick, setQuizPick] = useState(null);
  const [quizRevealed, setQuizRevealed] = useState(false);

  useEffect(() => { setStage("learn"); setQuizPick(null); setQuizRevealed(false); window.scrollTo({ top:0, behavior:"smooth" }); }, [term.name]);

  // arrow keys
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.matches("input,textarea,button")) return;
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight" && index < terms.length - 1 && progress.completed[term.name]) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPrev, onNext, index, terms, term, progress]);

  const submitQuiz = () => {
    if (quizPick == null) return;
    setQuizRevealed(true);
    const correct = quizPick === term.quiz.correct;
    onMarkComplete(term.name, correct ? 1 : 0);
  };

  const isLast = index === terms.length - 1;
  const prevDisabled = index === 0;

  return (
    <main className="lesson" style={{ "--hue": cfg.hue }}>
      {/* Lesson scaffold */}
      <div className="lesson-top">
        <button className="lb-back" onClick={onBack}>
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>
          All modules
        </button>
        <div className="lb-breadcrumbs">
          <span className="lb-module" style={{ color: `oklch(0.78 0.12 ${cfg.hue})` }}>{cfg.label}</span>
          <span className="lb-sep">›</span>
          <span className="lb-count">{index + 1} of {terms.length}</span>
        </div>
        <div className="lb-dots">
          {terms.map((t, i) => (
            <button key={t.name} className={"lb-dot" + (i === index ? " active" : "") + (progress.completed[t.name] ? " done" : "")}
                    onClick={() => setIndex(i)} title={t.name}/>
          ))}
        </div>
      </div>

      <article className="lesson-card">
        {/* Header */}
        <div className="lh-tag" style={{ color: `oklch(0.78 0.12 ${cfg.hue})`, borderColor: `oklch(0.5 0.12 ${cfg.hue} / 0.35)`, background: `oklch(0.22 0.05 ${cfg.hue} / 0.25)` }}>
          {cfg.label}
        </div>
        <h1 className="lh-title">{term.name}</h1>
        <p className="lh-def">{term.def}</p>

        {/* Animation stage */}
        <div className="anim-stage">
          {Anim ? <Anim speed={pacing}/> : <div className="anim-missing">animation pending</div>}
          <div className="anim-caption">
            <span className="anim-live-dot"/> live animation · custom to this concept
          </div>
        </div>

        {stage === "learn" && (
          <>
            {/* Persona section */}
            <div className="persona-wrap">
              <div className="persona-label">Read it through your lens</div>
              <div className="persona-tabs">
                {[
                  {id:"physician", label:"Physician",        icon:"🩺"},
                  {id:"basic",     label:"Basic Science",    icon:"🔬"},
                  {id:"clinical",  label:"Clinical Research",icon:"📊"},
                ].map(p => (
                  <button key={p.id} className={"pt" + (persona === p.id ? " active" : "")}
                          onClick={() => setPersona(p.id)}>
                    <span className="pt-icon">{p.icon}</span>
                    <span className="pt-label">{p.label}</span>
                  </button>
                ))}
              </div>
              <div className="persona-body" key={persona}>
                <p>{term[persona]}</p>
              </div>
            </div>

            {/* Analogy */}
            <div className="analogy">
              <div className="analogy-mark">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2a5 5 0 00-3 9v2h6v-2a5 5 0 00-3-9z" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M8 16h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="analogy-text" dangerouslySetInnerHTML={{ __html: term.analogy }}/>
            </div>

            {/* Check for understanding trigger */}
            <div className="lesson-actions">
              <button className="btn-primary" onClick={() => setStage("quiz")}>
                Check my understanding
                <svg width="14" height="14" viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>
              </button>
              <button className="btn-ghost" onClick={() => { onMarkComplete(term.name); setStage("recap"); }}>
                Skip · mark complete
              </button>
            </div>
          </>
        )}

        {stage === "quiz" && (
          <div className="quiz">
            <div className="quiz-label">Check-for-understanding</div>
            <h2 className="quiz-q">{term.quiz.q}</h2>
            <div className="quiz-choices">
              {term.quiz.choices.map((c, i) => {
                const isPicked = quizPick === i;
                const isCorrect = i === term.quiz.correct;
                const show = quizRevealed;
                return (
                  <button key={i}
                          className={"qc" + (isPicked ? " picked" : "") +
                            (show ? (isCorrect ? " correct" : isPicked ? " wrong" : " dim") : "")}
                          disabled={quizRevealed}
                          onClick={() => setQuizPick(i)}>
                    <span className="qc-marker">{String.fromCharCode(65+i)}</span>
                    <span className="qc-text">{c}</span>
                    {show && isCorrect && <span className="qc-ic">✓</span>}
                    {show && !isCorrect && isPicked && <span className="qc-ic">✕</span>}
                  </button>
                );
              })}
            </div>
            {!quizRevealed ? (
              <div className="lesson-actions">
                <button className="btn-primary" onClick={submitQuiz} disabled={quizPick == null}>Submit answer</button>
                <button className="btn-ghost" onClick={() => setStage("learn")}>Back</button>
              </div>
            ) : (
              <>
                <div className={"quiz-why " + (quizPick === term.quiz.correct ? "good" : "bad")}>
                  <div className="qw-head">{quizPick === term.quiz.correct ? "Exactly right." : "Not quite."}</div>
                  <div className="qw-body">{term.quiz.why}</div>
                </div>
                <div className="lesson-actions">
                  <button className="btn-primary" onClick={() => setStage("recap")}>Continue →</button>
                </div>
              </>
            )}
          </div>
        )}

        {stage === "recap" && (
          <div className="recap">
            <div className="recap-label">You just learned</div>
            <h2 className="recap-title">{term.name}</h2>
            <p className="recap-one">{term.def}</p>
            {term.related?.length > 0 && (
              <>
                <div className="recap-related-lbl">Connected concepts</div>
                <div className="recap-related">
                  {term.related.map(rn => {
                    const rt = window.TERMS.find(t => t.name === rn);
                    return (
                      <button key={rn} className="rr" onClick={() => rt && onJumpTerm(rn)}
                              disabled={!rt}>
                        <span className="rr-name">{rn}</span>
                        {rt && <span className="rr-arrow">→</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            <div className="recap-nav">
              <button className="btn-ghost" onClick={onPrev} disabled={prevDisabled}>← Previous lesson</button>
              <button className="btn-primary" onClick={onNext}>
                {isLast ? "Finish module" : "Next lesson"}
                <svg width="14" height="14" viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>
              </button>
            </div>
          </div>
        )}
      </article>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tweaks panel
// ═══════════════════════════════════════════════════════════════════════════
function TweaksPanel({ tweaks, update, onClose }) {
  return (
    <div className="tweaks">
      <div className="tweaks-head">
        <div className="tweaks-title">Tweaks</div>
        <button className="tweaks-close" onClick={onClose}>×</button>
      </div>
      <div className="tweaks-body">
        <div className="tw-row">
          <label>Accent hue</label>
          <input type="range" min="0" max="360" step="1" value={tweaks.accentHue}
                 onChange={e => update("accentHue", parseInt(e.target.value))}/>
          <div className="tw-val">
            <span className="tw-swatch" style={{ background: `oklch(0.72 0.14 ${tweaks.accentHue})` }}/>
            {tweaks.accentHue}°
          </div>
        </div>
        <div className="tw-row">
          <label>Animation pacing</label>
          <input type="range" min="0.5" max="2" step="0.1" value={tweaks.pacing}
                 onChange={e => update("pacing", parseFloat(e.target.value))}/>
          <div className="tw-val">{tweaks.pacing.toFixed(1)}×</div>
        </div>
        <div className="tw-row tw-row-choice">
          <label>Headline</label>
          <div className="tw-choices">
            {["Playfair Display","DM Sans","Fraunces"].map(f => (
              <button key={f} className={"tw-ch" + (tweaks.headlineFont === f ? " active" : "")}
                      onClick={() => update("headlineFont", f)} style={{ fontFamily: `'${f}', serif` }}>Aa</button>
            ))}
          </div>
        </div>
        <div className="tw-row tw-row-choice">
          <label>Density</label>
          <div className="tw-choices">
            {["compact","comfortable","spacious"].map(d => (
              <button key={d} className={"tw-ch tw-ch-txt" + (tweaks.density === d ? " active" : "")}
                      onClick={() => update("density", d)}>{d}</button>
            ))}
          </div>
        </div>
        <div className="tw-row tw-row-choice">
          <label>Canvas</label>
          <div className="tw-choices">
            {["ink","cream"].map(b => (
              <button key={b} className={"tw-ch tw-ch-txt" + (tweaks.bgMode === b ? " active" : "")}
                      onClick={() => update("bgMode", b)}>{b}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// mount
ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
