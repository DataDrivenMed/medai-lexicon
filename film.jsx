// film.jsx — auto-playing cinematic film
// Walks all 30 terms in CURRICULUM order, animating the concept
// with its definition on-screen and speechSynthesis voiceover.
// No user input; fully automatic. Tweaks panel is the only interactive surface.

const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ── persistence (so refresh resumes) ──
const STORE = "medai_film_v1";
const load = () => { try { return JSON.parse(localStorage.getItem(STORE) || "{}"); } catch { return {}; } };
const save = (o) => localStorage.setItem(STORE, JSON.stringify(o));

// ── Tweak defaults ──
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentHue": 45,
  "speed": 1,
  "persona": "physician",
  "voiceover": true,
  "captions": true,
  "bgMode": "ink",
  "secondsFloor": 10
}/*EDITMODE-END*/;

const PERSONAS = {
  physician: { label: "Physician",         icon: "🩺" },
  basic:     { label: "Basic Science",     icon: "🔬" },
  clinical:  { label: "Clinical Research", icon: "📊" },
};

// ── utilities ──
// Estimate how many seconds to spend on a concept based on text length.
// Reads at ~180 words/minute. Floor enforced by Tweaks.
function estimateDuration(text, floor = 10, speed = 1) {
  const words = (text || "").split(/\s+/).filter(Boolean).length;
  const readSec = (words / 180) * 60;
  return Math.max(floor, readSec + 3) / speed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Film App
// ═══════════════════════════════════════════════════════════════════════════
function FilmApp() {
  const [tweaks, setTweaks] = useState(() => ({ ...TWEAK_DEFAULTS, ...load().tweaks }));
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const saved = load();
  const [idx, setIdx] = useState(typeof saved.idx === "number" ? saved.idx : 0);
  const [phase, setPhase] = useState("intro"); // intro | playing | chapter | outro
  const [progress, setProgress] = useState(0); // 0..1 within current scene

  const terms = window.TERMS;
  const totalTerms = terms.length;
  const current = terms[idx];
  const cluster = current ? window.CLUSTERS[current.cluster] : null;

  // New chapter detection
  const isClusterOpener = useMemo(() => {
    if (!current) return false;
    if (idx === 0) return true;
    return terms[idx-1].cluster !== current.cluster;
  }, [idx, current, terms]);

  // Persist idx + tweaks
  useEffect(() => { save({ ...load(), idx, tweaks }); }, [idx, tweaks]);

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

  // Apply CSS vars
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--accent-hue", tweaks.accentHue);
    if (tweaks.bgMode === "cream") {
      r.style.setProperty("--film-bg", "#eae7df");
      r.style.setProperty("--film-stage", "#f5f3ee");
      r.style.setProperty("--film-ink", "#0d1117");
      r.style.setProperty("--film-soft", "#2d3748");
      r.style.setProperty("--film-muted", "#6b7280");
      r.style.setProperty("--film-border", "rgba(13,17,23,0.14)");
    } else {
      r.style.setProperty("--film-bg", "#000");
      r.style.setProperty("--film-stage", "#0e1014");
      r.style.setProperty("--film-ink", "#f5f3ee");
      r.style.setProperty("--film-soft", "#d2cfc8");
      r.style.setProperty("--film-muted", "#8e8b84");
      r.style.setProperty("--film-border", "rgba(245,243,238,0.1)");
    }
  }, [tweaks]);

  // Voiceover
  const uttRef = useRef(null);
  const speak = useCallback((text) => {
    if (!tweaks.voiceover) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95 * tweaks.speed;
      u.pitch = 1;
      u.volume = 1;
      // Prefer a clear English voice
      const voices = window.speechSynthesis.getVoices();
      const pref = voices.find(v => /en[-_]US/i.test(v.lang) && /(Samantha|Google US|Natural|Microsoft Aria)/i.test(v.name))
                || voices.find(v => /en[-_]US/i.test(v.lang))
                || voices.find(v => /^en/i.test(v.lang));
      if (pref) u.voice = pref;
      uttRef.current = u;
      window.speechSynthesis.speak(u);
    } catch {}
  }, [tweaks.voiceover, tweaks.speed]);
  useEffect(() => () => { try { window.speechSynthesis.cancel(); } catch {} }, []);

  // Auto-advance timer
  useEffect(() => {
    if (phase !== "playing" || !current) return;
    const vo = current[tweaks.persona] || current.def;
    const dur = estimateDuration(vo, tweaks.secondsFloor, tweaks.speed) * 1000;
    speak(vo);
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      setProgress(p);
      if (p >= 1) {
        // Advance
        if (idx + 1 >= totalTerms) {
          setPhase("outro");
        } else {
          const nextTerm = terms[idx + 1];
          const nextIsNewCluster = nextTerm.cluster !== current.cluster;
          if (nextIsNewCluster) {
            setPhase("chapter");
          } else {
            setIdx(idx + 1);
            setProgress(0);
          }
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); try { window.speechSynthesis.cancel(); } catch {} };
  }, [phase, idx, current, tweaks.persona, tweaks.speed, tweaks.secondsFloor, totalTerms, speak, terms]);

  // Intro → playing
  const beginFilm = () => {
    // Warm up speechSynthesis on user gesture
    try {
      const warm = new SpeechSynthesisUtterance(" ");
      warm.volume = 0;
      window.speechSynthesis.speak(warm);
    } catch {}
    setPhase("playing");
  };

  // Chapter → next term
  useEffect(() => {
    if (phase !== "chapter") return;
    const t = setTimeout(() => {
      setIdx(idx + 1);
      setProgress(0);
      setPhase("playing");
    }, 3600 / tweaks.speed);
    return () => clearTimeout(t);
  }, [phase, idx, tweaks.speed]);

  // Outro loop → restart on user click
  const restart = () => { setIdx(0); setProgress(0); setPhase("playing"); };

  // Chapter-card cluster: the UPCOMING term's cluster
  const upcomingCluster = phase === "chapter" && terms[idx+1] ? window.CLUSTERS[terms[idx+1].cluster] : null;

  return (
    <div className="film-root">
      {/* Letterbox background */}
      <div className="film-letterbox">
        {/* Cinematic 16:9 stage */}
        <div className="film-stage">
          {/* Subtle grain */}
          <div className="film-grain"/>

          {/* Persistent chrome — top/bottom bars */}
          <header className="film-chrome-top">
            <div className="fc-brand">
              <div className="fc-dot"/>
              <div>
                <div className="fc-title">MedAI Lexicon</div>
                <div className="fc-sub">An Animated Primer · Ram Paragi, MD</div>
              </div>
            </div>
            {phase === "playing" && current && (
              <div className="fc-chapter">
                <div className="fc-chapter-num">{String(idx + 1).padStart(2, "0")} / {String(totalTerms).padStart(2, "0")}</div>
                <div className="fc-chapter-label" style={{ color: `oklch(0.82 0.14 ${cluster.hue})` }}>{cluster.label}</div>
              </div>
            )}
          </header>

          {/* Scenes */}
          {phase === "intro" && <IntroScene onBegin={beginFilm} totalTerms={totalTerms}/>}

          {phase === "chapter" && upcomingCluster && (
            <ChapterScene cluster={upcomingCluster} />
          )}

          {phase === "playing" && current && (
            <PlayingScene
              key={current.name /* remount to reset anim */}
              term={current}
              cluster={cluster}
              persona={tweaks.persona}
              captions={tweaks.captions}
              speed={tweaks.speed}
              progress={progress}
            />
          )}

          {phase === "outro" && <OutroScene onRestart={restart}/>}

          {/* Progress bar */}
          {phase === "playing" && (
            <footer className="film-chrome-bot">
              <div className="fcb-track">
                <div className="fcb-fill"
                     style={{
                       width: ((idx + progress) / totalTerms) * 100 + "%",
                       background: `oklch(0.8 0.14 ${cluster.hue})`
                     }}/>
              </div>
              <div className="fcb-meta">
                <span className="fcb-caption">{current.name}</span>
                <span className="fcb-dim">·</span>
                <span className="fcb-dim">{PERSONAS[tweaks.persona].label}</span>
              </div>
            </footer>
          )}
        </div>
      </div>

      {tweaksOpen && <TweaksPanel tweaks={tweaks} update={updateTweak} onClose={() => setTweaksOpen(false)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Intro scene — poster card
// ═══════════════════════════════════════════════════════════════════════════
function IntroScene({ onBegin, totalTerms }) {
  return (
    <div className="scene scene-intro">
      <div className="intro-poster">
        <div className="intro-eyebrow">An Animated Primer</div>
        <h1 className="intro-h">
          The Language of<br/>
          <em>Medical AI</em>,<br/>
          in {totalTerms} moving parts.
        </h1>
        <p className="intro-sub">
          A continuous film. Thirty concepts. Each one animated and narrated.<br/>
          No clicks, no menus — just press play and watch.
        </p>
        <button className="intro-btn" onClick={onBegin}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M3 2l9 5-9 5V2z"/>
          </svg>
          Begin the film
        </button>
        <div className="intro-hint">You may need to enable voiceover in Tweaks · ~5 min runtime</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Chapter card — between cluster transitions
// ═══════════════════════════════════════════════════════════════════════════
function ChapterScene({ cluster }) {
  return (
    <div className="scene scene-chapter">
      <div className="chapter-card" style={{ "--hue": cluster.hue }}>
        <div className="chapter-eyebrow">Next Chapter</div>
        <h2 className="chapter-h">{cluster.label}</h2>
        <p className="chapter-blurb">{cluster.blurb}</p>
        <div className="chapter-rule"/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Playing scene — animation left, definition right
// ═══════════════════════════════════════════════════════════════════════════
function PlayingScene({ term, cluster, persona, captions, speed, progress }) {
  const Anim = window.ANIM_REGISTRY[term.anim];
  const voText = term[persona] || term.def;

  return (
    <div className="scene scene-playing" style={{ "--hue": cluster.hue }}>
      {/* Left: animation */}
      <div className="play-left">
        <div className="play-anim-wrap">
          {Anim ? <Anim speed={speed}/> : <div className="play-missing">animation pending</div>}
        </div>
      </div>

      {/* Right: text */}
      <div className="play-right">
        <div className="play-tag" style={{ color: `oklch(0.82 0.14 ${cluster.hue})`, borderColor: `oklch(0.5 0.12 ${cluster.hue} / 0.4)` }}>
          {cluster.label}
        </div>
        <h2 className="play-title">{term.name}</h2>
        <p className="play-def">{term.def}</p>

        {captions && (
          <div className="play-persona">
            <div className="play-persona-icon">{PERSONAS[persona].icon}</div>
            <div className="play-persona-text">
              <div className="pp-label">{PERSONAS[persona].label} lens</div>
              <p className="pp-body">{voText}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Outro scene — end card
// ═══════════════════════════════════════════════════════════════════════════
function OutroScene({ onRestart }) {
  return (
    <div className="scene scene-outro">
      <div className="outro-card">
        <div className="outro-fin">— fin —</div>
        <h2 className="outro-h">That's the lexicon.</h2>
        <p className="outro-sub">
          Thirty concepts that together form the working vocabulary of medical AI.<br/>
          The language keeps evolving; come back and watch again.
        </p>
        <div className="outro-actions">
          <button className="intro-btn" onClick={onRestart}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 7a4 4 0 117 2.6M10 10V7M10 10h3" strokeLinecap="round"/>
            </svg>
            Watch again
          </button>
          <a className="outro-link" href="index.html">← Back to the Lexicon</a>
        </div>
      </div>
    </div>
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
          <label>Playback speed</label>
          <input type="range" min="0.6" max="1.8" step="0.1" value={tweaks.speed}
                 onChange={e => update("speed", parseFloat(e.target.value))}/>
          <div className="tw-val">{tweaks.speed.toFixed(1)}×</div>
        </div>
        <div className="tw-row">
          <label>Seconds per concept (min)</label>
          <input type="range" min="6" max="20" step="1" value={tweaks.secondsFloor}
                 onChange={e => update("secondsFloor", parseInt(e.target.value))}/>
          <div className="tw-val">{tweaks.secondsFloor}s</div>
        </div>
        <div className="tw-row">
          <label>Accent hue</label>
          <input type="range" min="0" max="360" step="1" value={tweaks.accentHue}
                 onChange={e => update("accentHue", parseInt(e.target.value))}/>
          <div className="tw-val">
            <span className="tw-swatch" style={{ background: `oklch(0.72 0.14 ${tweaks.accentHue})` }}/>
            {tweaks.accentHue}°
          </div>
        </div>
        <div className="tw-row tw-row-choice">
          <label>Persona voice</label>
          <div className="tw-choices">
            {Object.entries(PERSONAS).map(([k, p]) => (
              <button key={k} className={"tw-ch tw-ch-txt" + (tweaks.persona === k ? " active" : "")}
                      onClick={() => update("persona", k)} title={p.label}>
                {p.icon}
              </button>
            ))}
          </div>
        </div>
        <div className="tw-row tw-row-choice">
          <label>Voiceover</label>
          <div className="tw-choices">
            <button className={"tw-ch tw-ch-txt" + (tweaks.voiceover ? " active" : "")}
                    onClick={() => update("voiceover", true)}>on</button>
            <button className={"tw-ch tw-ch-txt" + (!tweaks.voiceover ? " active" : "")}
                    onClick={() => update("voiceover", false)}>off</button>
          </div>
        </div>
        <div className="tw-row tw-row-choice">
          <label>Captions</label>
          <div className="tw-choices">
            <button className={"tw-ch tw-ch-txt" + (tweaks.captions ? " active" : "")}
                    onClick={() => update("captions", true)}>on</button>
            <button className={"tw-ch tw-ch-txt" + (!tweaks.captions ? " active" : "")}
                    onClick={() => update("captions", false)}>off</button>
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
ReactDOM.createRoot(document.getElementById("root")).render(<FilmApp/>);
