const { useState, useEffect, useRef, useCallback } = React;

// ============================================================
// DATA: Module definitions with verified content
// ============================================================

const TRACKS = [
  { id: "clinician", label: "Clinicians", color: "#E87B2A", modules: 8 },
  { id: "researcher", label: "Researchers", color: "#2A7AE8", modules: 7 },
  { id: "educator", label: "Educators", color: "#22863A", modules: 6 },
];

// ============================================================
// SIMULATIONS: Interactive components
// ============================================================

function TemperatureSimulation() {
  const [temp, setTemp] = useState(1.0);
  const canvasRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    const pad = 50, plotW = w - 2 * pad, plotH = h - 2 * pad;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h - pad); ctx.stroke();

    const logits = [];
    for (let i = 0; i < 25; i++) logits.push(Math.exp(-Math.pow(i - 10, 2) / (2 * Math.pow(4, 2))));
    const scaled = logits.map(l => l / temp);
    const expSum = scaled.reduce((a, b) => a + Math.exp(b), 0);
    const probs = scaled.map(l => Math.exp(l) / expSum);
    const maxP = Math.max(...probs);
    const barW = plotW / logits.length;

    for (let i = 0; i < probs.length; i++) {
      const barH = (probs[i] / maxP) * plotH;
      const x = pad + i * barW;
      const alpha = 0.4 + 0.6 * (probs[i] / maxP);
      ctx.fillStyle = `rgba(0, 217, 255, ${alpha})`;
      ctx.fillRect(x + 1, h - pad - barH, barW - 2, barH);
    }

    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Token vocabulary →", w / 2, h - 12);
    ctx.fillStyle = "#00d9ff";
    ctx.font = "bold 14px system-ui";
    ctx.fillText(`T = ${temp.toFixed(1)}`, w / 2, 28);

    const labels = temp < 0.5 ? "Sharp peak — deterministic, repetitive" :
                   temp < 1.2 ? "Balanced — coherent with some variety" :
                   "Flat — high variance, often incoherent";
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "12px system-ui";
    ctx.fillText(labels, w / 2, 45);
  }, [temp]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div style={{ background: "#0f172a", borderRadius: 8, padding: "1.25rem", margin: "1rem 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
        <span style={{ color: "#94a3b8", fontSize: 14, minWidth: 90 }}>Temperature:</span>
        <input type="range" min="0.1" max="2.5" step="0.1" value={temp}
          onChange={e => setTemp(parseFloat(e.target.value))}
          style={{ flex: 1, accentColor: "#00d9ff" }} />
        <span style={{ color: "#00d9ff", fontWeight: 600, minWidth: 40 }}>{temp.toFixed(1)}</span>
      </div>
      <canvas ref={canvasRef} width={580} height={240} style={{ width: "100%", height: "auto", borderRadius: 6 }} />
    </div>
  );
}

function LatentSpaceViz() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, w, h);

    const clusters = [
      { x: 160, y: 130, color: "#00d9ff", label: "Clinical explanations" },
      { x: 420, y: 120, color: "#E87B2A", label: "Research methodology" },
      { x: 290, y: 280, color: "#22863A", label: "General answers" },
    ];
    clusters.forEach(c => {
      ctx.fillStyle = c.color + "20";
      ctx.beginPath(); ctx.arc(c.x, c.y, 75, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c.color;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const r = 45 + Math.random() * 22;
        ctx.fillRect(c.x + Math.cos(a) * r - 3, c.y + Math.sin(a) * r - 3, 6, 6);
      }
      ctx.fillStyle = c.color;
      ctx.font = "bold 12px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(c.label, c.x, c.y + 105);
    });
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px system-ui";
    ctx.textAlign = "left";
    ctx.fillText("Each square = one possible response | Proximity = semantic similarity", 20, 30);
  }, []);

  return (
    <div style={{ background: "#0f172a", borderRadius: 8, padding: "1.25rem", margin: "1rem 0" }}>
      <canvas ref={canvasRef} width={580} height={350} style={{ width: "100%", height: "auto", borderRadius: 6 }} />
    </div>
  );
}

function PromptComparison({ scenarios }) {
  const [selected, setSelected] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [liveMode, setLiveMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [liveResponses, setLiveResponses] = useState([null, null]);
  const s = scenarios[selected];

  async function fetchLive() {
    if (!apiKey) return;
    setLoading(true);
    try {
      const results = [];
      for (let i = 0; i < 2; i++) {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514", max_tokens: 300,
            messages: [{ role: "user", content: s.prompt }],
          }),
        });
        const data = await resp.json();
        results.push(data.content?.[0]?.text || "Error fetching response");
      }
      setLiveResponses(results);
    } catch (e) { setLiveResponses(["API error: " + e.message, "API error: " + e.message]); }
    setLoading(false);
  }

  return (
    <div style={{ background: "#0f172a", borderRadius: 8, padding: "1.25rem", margin: "1rem 0" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1rem" }}>
        {scenarios.map((sc, i) => (
          <button key={i} onClick={() => { setSelected(i); setLiveResponses([null, null]); }}
            style={{ padding: "6px 14px", borderRadius: 6, border: selected === i ? "2px solid #00d9ff" : "1px solid #334155",
              background: selected === i ? "#00d9ff15" : "transparent", color: selected === i ? "#00d9ff" : "#94a3b8",
              cursor: "pointer", fontSize: 13 }}>
            {sc.label}
          </button>
        ))}
      </div>
      <div style={{ background: "#1e293b", borderRadius: 6, padding: "0.75rem", marginBottom: "1rem", borderLeft: "3px solid #00d9ff" }}>
        <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>PROMPT</div>
        <div style={{ color: "#e2e8f0", fontSize: 14 }}>{s.prompt}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {[0, 1].map(i => (
          <div key={i} style={{ background: "#1e293b", borderRadius: 6, padding: "0.75rem" }}>
            <div style={{ color: "#00d9ff", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>RUN {i + 1}</div>
            <div style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.7, fontStyle: "italic" }}>
              {loading ? "Loading..." : (liveMode && liveResponses[i]) ? liveResponses[i] : s.responses[i]}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#1e293b", borderRadius: 6 }}>
        <div style={{ color: "#f59e0b", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>What to observe:</div>
        <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6 }}>{s.observation}</div>
      </div>
      <details style={{ marginTop: "1rem" }}>
        <summary style={{ color: "#64748b", fontSize: 12, cursor: "pointer" }}>Use live API (educator option)</summary>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input type="password" placeholder="Anthropic API key" value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            style={{ flex: 1, padding: "6px 10px", borderRadius: 4, border: "1px solid #334155",
              background: "#0f172a", color: "#e2e8f0", fontSize: 13 }} />
          <button onClick={() => { setLiveMode(true); fetchLive(); }}
            style={{ padding: "6px 14px", borderRadius: 4, border: "1px solid #00d9ff",
              background: "transparent", color: "#00d9ff", cursor: "pointer", fontSize: 13 }}>
            Fetch Live
          </button>
        </div>
        <div style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>Your key is used client-side only and never stored.</div>
      </details>
    </div>
  );
}

function FormativeCheck({ questions }) {
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});

  return (
    <div style={{ background: "#0f172a", borderRadius: 8, padding: "1.25rem", margin: "1rem 0" }}>
      <div style={{ color: "#f59e0b", fontSize: 14, fontWeight: 600, marginBottom: "1rem" }}>
        Knowledge Check (formative — no scores recorded)
      </div>
      {questions.map((q, qi) => (
        <div key={qi} style={{ marginBottom: "1.5rem" }}>
          <div style={{ color: "#e2e8f0", fontSize: 14, marginBottom: 8 }}>{qi + 1}. {q.question}</div>
          {q.options.map((opt, oi) => (
            <button key={oi} onClick={() => { setAnswers({ ...answers, [qi]: oi }); setRevealed({ ...revealed, [qi]: true }); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", marginBottom: 4,
                borderRadius: 6, fontSize: 13, cursor: "pointer",
                border: revealed[qi] ? (oi === q.correct ? "2px solid #22c55e" : answers[qi] === oi ? "2px solid #ef4444" : "1px solid #334155") : answers[qi] === oi ? "2px solid #00d9ff" : "1px solid #334155",
                background: revealed[qi] && oi === q.correct ? "#22c55e15" : revealed[qi] && answers[qi] === oi && oi !== q.correct ? "#ef444415" : "transparent",
                color: "#cbd5e1" }}>
              {opt}
            </button>
          ))}
          {revealed[qi] && (
            <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 6, fontSize: 13, lineHeight: 1.6,
              background: answers[qi] === q.correct ? "#22c55e10" : "#ef444410",
              borderLeft: `3px solid ${answers[qi] === q.correct ? "#22c55e" : "#ef4444"}`,
              color: "#94a3b8" }}>
              {q.explanation}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RedFlag({ title, text }) {
  return (
    <div style={{ background: "#ef444410", borderLeft: "4px solid #ef4444", borderRadius: "0 6px 6px 0",
      padding: "1rem 1.25rem", margin: "0.75rem 0" }}>
      <div style={{ color: "#fca5a5", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>🚩 {title}</div>
      <div style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.7 }}>{text}</div>
    </div>
  );
}

function Collapsible({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: "1px solid #334155", borderRadius: 8, margin: "0.75rem 0", overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "0.75rem 1rem", background: "transparent", border: "none", color: "#00d9ff",
          fontSize: 14, fontWeight: 500, cursor: "pointer", textAlign: "left" }}>
        <span>{title}</span>
        <span style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "0.3s" }}>▼</span>
      </button>
      {open && <div style={{ padding: "0 1rem 1rem", color: "#cbd5e1", fontSize: 13, lineHeight: 1.7 }}>{children}</div>}
    </div>
  );
}

function FormulaBlock({ children }) {
  return (
    <div style={{ background: "#0a0a1e", border: "1px solid #00d9ff30", borderRadius: 6,
      padding: "1rem", margin: "0.75rem 0", fontFamily: "monospace", fontSize: 13, color: "#00d9ff",
      lineHeight: 1.6, overflowX: "auto" }}>
      {children}
    </div>
  );
}

// ============================================================
// MODULE CONTENT
// ============================================================

function ClinModule1() {
  return (<>
    <h3 style={{ color: "#E87B2A", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Explain how an LLM generates text autoregressively through token-by-token probability sampling</li>
      <li>Distinguish between how an LLM generates output and how a human clinician reasons through a differential diagnosis</li>
      <li>Identify the fundamental limitation: LLMs optimize for statistical likelihood, not factual accuracy</li>
    </ul>

    <h3 style={styles.subhead}>How Token Generation Works</h3>
    <p style={styles.body}>When you type a clinical question into an LLM, the model does not retrieve facts from a database. It predicts the most probable next token (word or subword) given all preceding tokens, then commits to that prediction and repeats. Each token is generated independently — there is no lookahead, revision, or planning.</p>
    <p style={styles.body}><strong>Tokens and vocabulary:</strong> LLMs operate on tokens, not words. A token may be a whole word, a subword, or punctuation. GPT-scale models have vocabularies of approximately 50,000 tokens. At each step, the model computes a probability distribution over this entire vocabulary and samples one token.</p>
    <p style={styles.body}><strong>The softmax function</strong> converts raw model outputs (logits) to probabilities:</p>
    <FormulaBlock>P(token_i) = exp(z_i) / Σ_j exp(z_j)</FormulaBlock>
    <p style={styles.body}>This ensures all probabilities sum to 1 and the highest-scoring token gets the highest probability.</p>

    <h3 style={styles.subhead}>Temperature: Controlling the Distribution Shape</h3>
    <p style={styles.body}>Temperature rescales logits before softmax. Drag the slider to see how it affects the probability distribution:</p>
    <TemperatureSimulation />

    <Collapsible title="Show the math: temperature scaling">
      <p>Temperature T rescales logits before softmax application:</p>
      <FormulaBlock>P(token_i | T) = exp(z_i / T) / Σ_j exp(z_j / T)</FormulaBlock>
      <p style={{ marginTop: 8 }}>When T → 0: distribution converges to a one-hot vector (greedy decoding). When T = 1: standard softmax. When T → ∞: distribution flattens to uniform.</p>
    </Collapsible>

    <h3 style={styles.subhead}>Interactive Exercise: Reproducibility Test</h3>
    <PromptComparison scenarios={[
      { label: "Clinical question",
        prompt: "What is the first-line treatment for community-acquired pneumonia in an immunocompetent adult?",
        responses: [
          "First-line treatment for CAP in immunocompetent adults is amoxicillin for outpatient cases, or a respiratory fluoroquinolone (levofloxacin) as an alternative. For inpatients, a beta-lactam plus a macrolide is recommended per ATS/IDSA guidelines.",
          "For community-acquired pneumonia in immunocompetent adults, ATS/IDSA guidelines recommend amoxicillin as first-line for low-risk outpatients. Alternatives include doxycycline. Hospitalized patients should receive a beta-lactam (ceftriaxone) plus azithromycin."
        ],
        observation: "Notice both responses are broadly correct but differ in specific drug choices, guideline emphasis, and level of detail. This is stochastic sampling in action — the model generates different but statistically plausible outputs each time."
      },
      { label: "Dosage question",
        prompt: "What is the correct dose of amoxicillin for a 70kg adult with CAP?",
        responses: [
          "The standard dose of amoxicillin for CAP is 1g three times daily (TID) for 5-7 days, per IDSA/ATS guidelines.",
          "Amoxicillin for CAP: 500mg-1g PO TID for 5 days. Higher dosing (1g TID) is preferred for moderate-severity cases."
        ],
        observation: "The dosages differ (1g TID vs 500mg-1g TID). This is why you should never trust an LLM-generated dosage without independent verification against a validated formulary."
      }
    ]} />

    <RedFlag title="Dosage variation across runs" text="If the same dosage question yields different specific doses on different runs, the model is unreliable for dosing decisions. Always verify against a validated formulary (e.g., Lexicomp, UpToDate, institutional protocols)." />

    <h3 style={styles.subhead}>Prompt Engineering: Beginner Level</h3>
    <div style={styles.promptBox}>
      <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 600 }}>WEAK PROMPT</div>
      <div style={{ color: "#e2e8f0", fontSize: 14, fontStyle: "italic", margin: "4px 0" }}>"What is the treatment for pneumonia?"</div>
      <div style={{ color: "#94a3b8", fontSize: 13 }}>Why this is weak: No patient context, no pathogen specification, no constraints on sources. The model fills in assumptions you did not specify — ambiguity creates space for hallucination.</div>
    </div>

    <FormativeCheck questions={[
      { question: "When an LLM generates a response, it:",
        options: [
          "Retrieves facts from a medical database and formats them",
          "Predicts the most probable next token based on statistical patterns, one token at a time",
          "Searches the internet for relevant information and summarizes it",
          "Reasons through the clinical problem like a physician would"
        ],
        correct: 1,
        explanation: "LLMs generate text autoregressively — predicting one token at a time based on the conditional probability distribution P(token_t | tokens_{1:t-1}). They do not retrieve facts, search the internet during generation, or reason causally."
      },
      { question: "Low temperature (e.g., T=0.2) causes the model to:",
        options: [
          "Generate more creative and diverse outputs",
          "Search more thoroughly through its training data",
          "Almost always select the single highest-probability token, producing near-deterministic output",
          "Produce longer responses with more detail"
        ],
        correct: 2,
        explanation: "Low temperature sharpens the probability distribution, concentrating probability mass on the most likely token. This produces repetitive, deterministic output. Temperature does not affect how thoroughly the model 'searches' — it only controls the shape of the sampling distribution."
      }
    ]} />
  </>);
}

function ClinModule2() {
  return (<>
    <h3 style={{ color: "#E87B2A", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Explain how tokens are represented as high-dimensional vectors (embeddings) and why semantic similarity maps to vector proximity</li>
      <li>Describe what latent space means and why it matters for understanding LLM behavior</li>
      <li>Connect embedding structure to why LLMs can conflate similar but clinically distinct conditions</li>
    </ul>

    <h3 style={styles.subhead}>Embeddings: How Meaning Becomes Numbers</h3>
    <p style={styles.body}><strong>Each token is mapped to a vector of numbers</strong> — an embedding. For GPT-scale models, this vector has 768 to 12,288 dimensions. These vectors are learned during training: tokens that appear in similar contexts develop similar embeddings.</p>
    <p style={styles.body}>For example: "metformin" and "glipizide" will have more similar embeddings than "metformin" and "amoxicillin," because oral hypoglycemics share more training context (diabetes management) than a diabetes drug and an antibiotic.</p>

    <Collapsible title="Show the math: embedding lookup">
      <p>Each token ID maps to a row in the embedding matrix:</p>
      <FormulaBlock>embedding = W_e[token_id]  where W_e ∈ ℝ^(vocab_size × d)</FormulaBlock>
      <p style={{ marginTop: 8 }}>Similarity is measured by cosine similarity: cos(θ) = (A · B) / (||A|| × ||B||). Values near 1 indicate high semantic similarity; values near 0 indicate unrelated concepts.</p>
    </Collapsible>

    <h3 style={styles.subhead}>Latent Space: Where Meaning Lives</h3>
    <p style={styles.body}>The high-dimensional space defined by all possible embedding vectors is called latent space. Semantically related concepts cluster together in this space. The visualization below is a simplified 2D projection — real latent spaces have thousands of dimensions.</p>
    <LatentSpaceViz />
    <p style={styles.body}><strong>Critical distinction:</strong> The model does not "search" this space. It samples probabilistically from high-density regions based on the prompt context. Responses cluster because statistically similar tokens naturally co-occur in training data — not because the model is "choosing" between different answer strategies.</p>

    <h3 style={styles.subhead}>Clinical Implication: Conflation Risk</h3>
    <p style={styles.body}>Because the model represents knowledge through statistical co-occurrence, it may conflate conditions that share vocabulary but have different clinical management. Viral pneumonia and bacterial pneumonia share many context words but require different treatment — the model may not reliably distinguish them if the prompt does not force the distinction.</p>

    <PromptComparison scenarios={[
      { label: "Underspecified",
        prompt: "What is the treatment for pneumonia?",
        responses: [
          "Pneumonia treatment typically involves antibiotics such as amoxicillin or azithromycin, rest, fluids, and supportive care. Severe cases may require hospitalization with IV antibiotics.",
          "Treatment depends on the type. Bacterial pneumonia requires antibiotics; viral pneumonia is managed with antivirals in some cases and supportive care. Hospitalization may be needed for severe cases."
        ],
        observation: "Run 1 defaults to bacterial treatment (antibiotics) without distinguishing viral vs. bacterial. Run 2 makes the distinction. This inconsistency is caused by embedding proximity — the model sometimes conflates the two because they share so much context vocabulary."
      },
      { label: "Specific",
        prompt: "Compare the treatment protocols for viral versus bacterial community-acquired pneumonia in an immunocompetent adult. Specify the key distinguishing criteria for each.",
        responses: [
          "Bacterial CAP: First-line is amoxicillin (outpatient) or beta-lactam + macrolide (inpatient). Distinguishing: productive cough, lobar consolidation, elevated procalcitonin. Viral CAP: Supportive care primarily. Influenza-specific: oseltamivir within 48 hours. Distinguishing: dry cough, bilateral interstitial infiltrates, normal procalcitonin.",
          "Bacterial CAP: Antibiotic therapy per ATS/IDSA — amoxicillin for outpatient, ceftriaxone + azithromycin for inpatient. Key markers: purulent sputum, focal consolidation, leukocytosis. Viral CAP: Primarily supportive. Oseltamivir for confirmed influenza within 48h of symptom onset. Key markers: diffuse infiltrates, lymphopenia, negative sputum culture."
        ],
        observation: "Both runs now correctly distinguish viral from bacterial treatment. The specific prompt forced the model to generate from different regions of the probability space rather than defaulting to the most common (bacterial) response."
      }
    ]} />

    <h3 style={styles.subhead}>Prompt Progression: Beginner to Intermediate</h3>
    <div style={styles.promptBox}>
      <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>IMPROVED PROMPT</div>
      <div style={{ color: "#e2e8f0", fontSize: 14, fontStyle: "italic", margin: "4px 0" }}>"Compare the treatment protocols for viral versus bacterial community-acquired pneumonia in an immunocompetent adult. Specify the key distinguishing criteria for each."</div>
      <div style={{ color: "#94a3b8", fontSize: 13 }}>Why this works: Forces the model to generate distinct output for each condition rather than defaulting to the most probable (most common in training data) treatment.</div>
    </div>

    <FormativeCheck questions={[
      { question: "Two words have similar embeddings in an LLM because:",
        options: [
          "They have the same dictionary definition",
          "A human linguist manually assigned similar vectors",
          "They frequently appear in similar contexts in the training data",
          "The model understands their meaning"
        ],
        correct: 2,
        explanation: "Embeddings are learned during training through statistical co-occurrence. Words that appear in similar contexts develop similar vectors. This is a statistical relationship, not semantic understanding — the model does not 'know' what words mean."
      },
      { question: "An LLM might conflate viral and bacterial pneumonia treatment because:",
        options: [
          "It lacks medical training",
          "The embedding vectors for both conditions are close in latent space due to shared vocabulary context",
          "It was trained on incorrect medical data",
          "The temperature setting is too high"
        ],
        correct: 1,
        explanation: "Viral and bacterial pneumonia share substantial context vocabulary (cough, fever, consolidation, treatment, antibiotics). This makes their embedding regions overlap in latent space. Without specific prompting that forces distinction, the model may default to the most statistically common (bacterial) treatment patterns."
      }
    ]} />
  </>);
}

function ClinModule3() {
  return (<>
    <h3 style={{ color: "#E87B2A", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Define hallucination in technical terms: tokens with high conditional probability that form factually incorrect sequences</li>
      <li>Identify the three primary causes: no external grounding, frequency bias, and fabricated citations</li>
      <li>Apply a verification protocol before acting on any LLM-generated clinical information</li>
    </ul>

    <h3 style={styles.subhead}>What Is Hallucination, Technically?</h3>
    <p style={styles.body}>Hallucinations are outputs where P(token_t | tokens_&#123;1:t-1&#125;) is high — the model is confident — but the resulting sequence is factually incorrect. The model has <strong>no mechanism to distinguish between statistically likely and factually true</strong>.</p>
    <p style={styles.body}>This occurs because:</p>
    <ul style={styles.list}>
      <li><strong>No external grounding:</strong> LLMs have no access to real-time databases, drug formularies, or clinical guidelines during generation. They can only sample from patterns learned during training.</li>
      <li><strong>Frequency bias:</strong> The model overweights common patterns. If an outdated treatment protocol appears frequently in training data, the model may confidently reproduce it.</li>
      <li><strong>Fabricated citations:</strong> LLMs can generate entirely fictional journal articles, authors, and DOIs that sound plausible. This creates false authority for false claims.</li>
    </ul>

    <h3 style={styles.subhead}>Interactive Exercise: Citation Verification</h3>
    <PromptComparison scenarios={[
      { label: "Citation request",
        prompt: "Cite three recent RCTs supporting the use of dapagliflozin in heart failure with preserved ejection fraction.",
        responses: [
          "1. DELIVER Trial (Solomon et al., NEJM, 2022): Demonstrated significant reduction in cardiovascular death and worsening HF. 2. PRESERVED-HF (Nassif et al., Nature Medicine, 2021): Showed improvement in Kansas City Cardiomyopathy Questionnaire scores. 3. DETERMINE-Preserved (Singh et al., JAMA Cardiol, 2023): Confirmed exercise capacity improvements with dapagliflozin.",
          "1. DELIVER Trial (Solomon et al., NEJM, 2022): Showed dapagliflozin reduced composite of CV death or worsening HF. 2. PRESERVED-HF (Nassif et al., Nat Med, 2021): Demonstrated symptom improvement measured by KCCQ. 3. DAPA-HF Subanalysis (McMurray et al., Circulation, 2020): Explored benefits in preserved ejection fraction subgroups."
        ],
        observation: "The DELIVER trial is real. PRESERVED-HF is real. But verify: are the authors correct? Are the journal names correct? Are the years correct? Some details may be hallucinated even when the trial names are real. DETERMINE-Preserved and the DAPA-HF subanalysis framing should be independently verified. Never trust citation details from an LLM."
      },
      { label: "No-citation approach",
        prompt: "Summarize the general evidence consensus on SGLT2 inhibitors in HFpEF. Do not cite specific studies. Note where evidence is uncertain.",
        responses: [
          "Current evidence supports SGLT2 inhibitors (dapagliflozin, empagliflozin) for HFpEF based on large RCTs demonstrating reduced composite endpoints of cardiovascular death and heart failure hospitalization. The benefit appears consistent across subgroups. Areas of uncertainty include: long-term outcomes beyond trial duration, optimal patient selection criteria, and whether benefits extend to all SGLT2 inhibitors as a class effect.",
          "SGLT2 inhibitors have shown benefit in HFpEF in recent trials, reducing the composite of cardiovascular death and worsening heart failure events. Guidelines now recommend their use across the ejection fraction spectrum. Remaining uncertainties include: precise mechanism of benefit in HFpEF, whether the benefit is a class effect, and long-term safety in elderly populations."
        ],
        observation: "Without citation pressure, the model provides more reliable consensus summaries. Both responses are broadly accurate and appropriately flag uncertainty. This approach reduces hallucination risk by removing the incentive to fabricate specific references."
      }
    ]} />

    <RedFlag title="Fabricated citations" text="LLMs can generate entirely fictional papers with plausible authors, titles, journals, and DOIs. Even when a cited trial name is real, specific details (authors, year, journal) may be hallucinated. Always verify every citation against PubMed or the original source." />
    <RedFlag title="Overconfidence on rare conditions" text="If the model speaks with certainty about rare diseases, recent research, or edge cases without qualifying statements, it is likely hallucinating. Well-calibrated models express uncertainty where training data is sparse." />
    <RedFlag title="Specific dosages without sources" text="Never trust an LLM-generated dosage without verification against a validated formulary. The model generates statistically likely numbers, not verified prescribing information." />

    <h3 style={styles.subhead}>Prompt Progression: Intermediate</h3>
    <div style={styles.promptBox}>
      <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>ANTI-HALLUCINATION PROMPT</div>
      <div style={{ color: "#e2e8f0", fontSize: 14, fontStyle: "italic", margin: "4px 0" }}>"Summarize the general consensus on [drug] for [condition] per major guidelines (AHA, IDSA, etc.). Do not cite specific studies. Note where evidence is uncertain or conflicting."</div>
      <div style={{ color: "#94a3b8", fontSize: 13 }}>Why this works: Removing the citation requirement reduces the hallucination incentive. Asking for consensus rather than specifics aligns with how the model stores knowledge — as patterns, not individual facts.</div>
    </div>

    <FormativeCheck questions={[
      { question: "An LLM hallucination occurs when:",
        options: [
          "The model intentionally generates false information",
          "The model generates tokens with high conditional probability that form factually incorrect sequences",
          "The model's internet connection fails and it makes up an answer",
          "The user provides a poorly worded prompt"
        ],
        correct: 1,
        explanation: "Hallucinations are a consequence of the model's optimization objective (maximizing token probability) not aligning with factual accuracy. The model has no intent — it generates whatever is statistically most likely given the context, regardless of truth value."
      },
      { question: "The most effective way to reduce citation hallucination is to:",
        options: [
          "Ask the model to double-check its citations",
          "Use a higher temperature setting",
          "Instruct the model not to cite specific studies and instead summarize general consensus",
          "Ask for more citations so the model has more chances to be correct"
        ],
        correct: 2,
        explanation: "Removing the citation requirement eliminates the incentive to fabricate references. Asking the model to 'double-check' does not help because the model cannot verify facts — it can only generate more tokens. More citations means more opportunities for fabrication."
      }
    ]} />
  </>);
}

function ResModule1() {
  return (<>
    <h3 style={{ color: "#2A7AE8", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Describe the transformer architecture at a mechanistic level: token embeddings, positional encoding, multi-head attention, feed-forward layers, and output softmax</li>
      <li>Explain the attention mechanism (queries, keys, values) and why it enables context-dependent token processing</li>
      <li>Distinguish between what LLMs learn (statistical co-occurrence) and what they do not learn (causal relationships)</li>
    </ul>

    <h3 style={styles.subhead}>The Transformer Architecture: Layer by Layer</h3>
    <p style={styles.body}>A transformer-based LLM processes input through a series of layers, each transforming the token representations into increasingly abstract features.</p>
    <p style={styles.body}><strong>Step 1 — Token Embedding:</strong> Each token ID maps to a learned vector in ℝ^d (d = 768 to 12,288 depending on model scale). The embedding matrix W_e has dimensions vocab_size × d.</p>
    <FormulaBlock>embedding = W_e[token_id]</FormulaBlock>

    <p style={styles.body}><strong>Step 2 — Positional Encoding:</strong> Transformers process all tokens in parallel (unlike RNNs). To encode word order, sinusoidal positional encodings are added to each embedding:</p>
    <FormulaBlock>PE(pos, 2i) = sin(pos / 10000^(2i/d)){"\n"}PE(pos, 2i+1) = cos(pos / 10000^(2i/d))</FormulaBlock>
    <p style={styles.body}>This allows the model to distinguish "The drug treats the infection" from "The infection treats the drug."</p>

    <p style={styles.body}><strong>Step 3 — Multi-Head Self-Attention:</strong> The core mechanism. For each token position, the model computes how much to attend to every other token in the sequence.</p>
    <FormulaBlock>Attention(Q, K, V) = softmax(Q · K^T / √d_k) · V</FormulaBlock>
    <p style={styles.body}>Where Q (queries), K (keys), and V (values) are learned linear projections of the hidden states. Multiple attention heads (typically 12-96) operate in parallel, each capturing different types of relationships — syntactic structure, semantic similarity, coreference, etc.</p>

    <p style={styles.body}><strong>Step 4 — Feed-Forward Network:</strong> After attention, each position passes through a 2-layer MLP with a non-linear activation (typically GELU or ReLU). This adds non-linear transformation capacity.</p>

    <p style={styles.body}><strong>Step 5 — Output Layer:</strong> The final hidden state at the last position is projected to a logit vector of size vocab_size, then softmax converts to probabilities for next-token prediction.</p>

    <h3 style={styles.subhead}>Interactive: Temperature Effects on Output Distribution</h3>
    <TemperatureSimulation />

    <Collapsible title="Deep dive: Why attention matters for clinical text">
      <p>Consider the sentence: "The patient was prescribed metformin for their newly diagnosed type 2 diabetes, but it was contraindicated due to their renal impairment."</p>
      <p style={{ marginTop: 8 }}>The attention mechanism allows the model to connect "contraindicated" with "renal impairment" across the sentence, even though they are far apart. Without attention, the model would process each word in isolation and lose this long-range dependency.</p>
      <p style={{ marginTop: 8 }}>However, attention captures statistical co-occurrence, not causal reasoning. The model learns that "metformin," "contraindicated," and "renal impairment" frequently co-occur — but it does not understand WHY metformin is contraindicated in renal impairment (lactic acidosis risk from impaired clearance).</p>
    </Collapsible>

    <h3 style={styles.subhead}>Fundamental Limitation</h3>
    <p style={styles.body}>LLMs are <strong>simulators of the training distribution</strong>, not discoverers of new knowledge. They can recombine patterns from training data in novel ways, but they cannot learn facts not present in training data, and they cannot reason about the real world — only about statistical patterns. This distinction is critical for research applications.</p>

    <FormativeCheck questions={[
      { question: "The attention mechanism in a transformer computes:",
        options: [
          "The importance of each word based on its dictionary definition",
          "A weighted combination of value vectors, where weights are determined by query-key dot products",
          "The grammatical structure of the sentence using pre-defined linguistic rules",
          "Causal relationships between medical concepts"
        ],
        correct: 1,
        explanation: "Attention computes softmax(QK^T / √d_k) · V — the dot product of queries and keys determines attention weights, which are used to create a weighted combination of values. This is a learned statistical operation, not a linguistic or causal analysis."
      },
      { question: "Positional encoding is necessary because:",
        options: [
          "Transformers process tokens sequentially and need to track position",
          "Transformers process all tokens in parallel and have no inherent sense of word order",
          "The embedding matrix does not have enough dimensions",
          "It improves the model's vocabulary size"
        ],
        correct: 1,
        explanation: "Unlike RNNs, transformers process all tokens simultaneously. Without positional encoding, the model could not distinguish 'The drug treats the disease' from 'The disease treats the drug' — the same tokens in different positions would produce identical representations."
      }
    ]} />
  </>);
}

function ResModule2() {
  return (<>
    <h3 style={{ color: "#2A7AE8", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Explain how embedding spaces encode semantic relationships through vector similarity</li>
      <li>Describe why dimensionality reduction (t-SNE, UMAP) is necessary and what information is lost</li>
      <li>Connect embedding structure to practical research implications</li>
    </ul>

    <h3 style={styles.subhead}>Semantic Similarity as Vector Proximity</h3>
    <p style={styles.body}>Cosine similarity between embedding vectors quantifies semantic relatedness:</p>
    <FormulaBlock>cos(θ) = (A · B) / (||A|| × ||B||)</FormulaBlock>
    <p style={styles.body}>Values range from -1 (opposite) to 1 (identical). In practice, most token pairs have cosine similarity near 0 (unrelated). Tokens within the same semantic domain (e.g., all diabetes medications) have cosine similarity in the 0.5-0.9 range.</p>

    <h3 style={styles.subhead}>Latent Space Visualization</h3>
    <LatentSpaceViz />
    <p style={styles.body}><strong>Dimensionality reduction caveat:</strong> The visualization above is a 2D projection of a space with thousands of dimensions. t-SNE and UMAP preserve local neighborhood structure (nearby points stay nearby) but do not preserve global distances. This means cluster separations in 2D may be artifacts of the projection method, not real features of the embedding space.</p>

    <Collapsible title="Research application: Why clustering matters">
      <p>If you use an LLM to cluster or categorize scientific concepts, understand that the clustering reflects training data co-occurrence, not necessarily biological or causal relationships. A model might group "BRCA1" and "BRCA2" closely (correct — both are breast cancer susceptibility genes) but also group "p53" nearby (a tumor suppressor gene, but mechanistically distinct and involved in many cancer types beyond breast cancer).</p>
      <p style={{ marginTop: 8 }}>This has direct implications for LLM-assisted literature review: the model may merge findings from related but distinct research areas based on vocabulary overlap, not scientific relevance.</p>
    </Collapsible>

    <h3 style={styles.subhead}>Contextual vs. Static Embeddings</h3>
    <p style={styles.body}><strong>Static embeddings</strong> (like Word2Vec) assign one vector per word regardless of context. "Bank" has the same vector whether it means a financial institution or a riverbank.</p>
    <p style={styles.body}><strong>Contextual embeddings</strong> (transformer-based) produce different vectors for the same word depending on surrounding context. After processing through transformer layers, the hidden state for "bank" in "blood bank" is very different from "bank" in "investment bank." This context-dependence is why transformer-based models are more powerful than earlier approaches.</p>

    <RedFlag title="Conflation in literature review" text="When using LLMs for literature review, embedding-based conflation can cause the model to merge findings from related but distinct research areas. Always verify that the model distinguishes between your specific research question and adjacent topics." />

    <FormativeCheck questions={[
      { question: "Contextual embeddings differ from static embeddings because:",
        options: [
          "They use larger vectors with more dimensions",
          "The same word gets different vector representations depending on its surrounding context",
          "They are trained on more data",
          "They include positional information in the embedding matrix"
        ],
        correct: 1,
        explanation: "In transformer models, the hidden state for a given token evolves through each layer, incorporating information from surrounding tokens via attention. This means the same word produces different representations in different contexts — 'cell' in 'cell biology' vs. 'cell phone' would have very different hidden states after processing."
      }
    ]} />
  </>);
}

function ResModule3() {
  return (<>
    <h3 style={{ color: "#2A7AE8", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Identify three types of research-relevant hallucinations: fabricated citations, false mechanistic claims, and ghost data patterns</li>
      <li>Design a verification protocol for LLM-generated research content</li>
      <li>Recognize when LLM-generated hypotheses are novel versus statistical artifacts</li>
    </ul>

    <h3 style={styles.subhead}>Three Types of Research Hallucination</h3>
    <p style={styles.body}><strong>1. Fabricated citations:</strong> LLMs construct these by sampling from patterns of citation formatting in training data. The probability of fabrication increases for niche topics with fewer training examples. A fabricated citation may have a real journal name, a plausible author name, and a convincing title — but the paper does not exist.</p>
    <p style={styles.body}><strong>2. False mechanistic claims:</strong> LLMs can generate plausible-sounding biological mechanisms that have no basis in evidence. For example, describing a specific protein-protein interaction pathway that has never been demonstrated. The language sounds authoritative because the model has seen thousands of similar mechanistic descriptions in training data.</p>
    <p style={styles.body}><strong>3. Ghost data patterns:</strong> When asked to analyze or describe data, LLMs may describe patterns that would be statistically likely given the topic but that do not exist in any actual dataset. The model generates the most probable description of data it has never seen. This is not intentional fabrication — it is a natural consequence of next-token prediction.</p>

    <PromptComparison scenarios={[
      { label: "Mechanism query",
        prompt: "Describe the molecular mechanism by which resveratrol activates SIRT1 in cardiac tissue.",
        responses: [
          "Resveratrol activates SIRT1 through direct allosteric binding to the enzyme's N-terminal domain, inducing a conformational change that increases NAD+ binding affinity. In cardiac tissue, this leads to deacetylation of PGC-1α, promoting mitochondrial biogenesis and reducing oxidative stress through enhanced expression of SOD2 and catalase.",
          "Resveratrol enhances SIRT1 activity through a mechanism involving direct enzyme activation and increased NAD+ bioavailability. In cardiomyocytes, SIRT1 activation deacetylates PGC-1α and FOXO3a, leading to improved mitochondrial function and reduced apoptosis. The downstream effects include enhanced fatty acid oxidation and reduced ROS production."
        ],
        observation: "Both responses sound highly plausible and authoritative. But verify: Is the 'direct allosteric binding to the N-terminal domain' supported by evidence? The exact mechanism of resveratrol-SIRT1 interaction remains debated in the literature. Some of these specific mechanistic details may be hallucinated — the model is generating the most statistically likely mechanism description, not reporting verified findings."
      },
      { label: "Uncertainty-aware",
        prompt: "What is the current understanding of how resveratrol interacts with SIRT1? Distinguish between well-established findings and areas of active debate. Do not cite specific studies.",
        responses: [
          "The resveratrol-SIRT1 interaction has been studied extensively but remains partially understood. Well-established: resveratrol treatment increases SIRT1 activity in multiple cell types. Under debate: whether resveratrol directly binds and activates SIRT1, or whether its effects are indirect (through AMPK activation or increased NAD+ levels). The original direct activation model has been challenged by studies suggesting the observed activation may be an artifact of fluorescent substrate assays.",
          "Current understanding of resveratrol-SIRT1 is nuanced. Established: SIRT1 activity increases with resveratrol treatment, leading to beneficial metabolic effects in preclinical models. Debated: the directness of the interaction. Early reports of direct allosteric activation have been questioned, with alternative mechanisms proposed including AMPK-mediated effects and cAMP signaling. The field has not reached consensus on the primary mechanism."
        ],
        observation: "When prompted to distinguish established from debated findings, the model produces more honest and scientifically accurate output. The uncertainty expression aligns with the actual state of the literature."
      }
    ]} />

    <RedFlag title="Confident mechanistic descriptions" text="If an LLM provides highly specific mechanistic details (e.g., 'binds to the N-terminal domain at residues 183-210') for a pathway that is not well-characterized in the literature, treat this as a probable hallucination. Real experts express uncertainty; LLMs often do not unless specifically prompted." />
    <RedFlag title="Specific quantitative claims without sources" text="If the model states something like 'increases expression by 40%' without citing a specific experiment, the model is generating a statistically likely number, not reporting actual data. Always verify quantitative claims against primary literature." />

    <h3 style={styles.subhead}>Verification Protocol for Research Content</h3>
    <ol style={{ ...styles.list, listStyleType: "decimal" }}>
      <li>Never use LLM-generated citations without verifying each one against PubMed or the source journal</li>
      <li>For mechanistic claims, cross-reference against review articles in the specific pathway</li>
      <li>For quantitative claims, demand the specific study — if the model cannot provide a verifiable source, treat the number as fabricated</li>
      <li>When generating hypotheses, distinguish between recombinations of known findings (potentially useful) and entirely novel claims (likely hallucinated)</li>
    </ol>

    <FormativeCheck questions={[
      { question: "A 'ghost data pattern' in LLM output refers to:",
        options: [
          "Data that was deleted from the training set",
          "Descriptions of data patterns that would be statistically likely but do not exist in any real dataset",
          "Encrypted data hidden in the model weights",
          "Data from deprecated databases"
        ],
        correct: 1,
        explanation: "Ghost data patterns occur when the model describes what data 'should' look like based on its training distribution, rather than reporting actual observations. The model generates the most probable description of data it has never analyzed — this is a natural consequence of next-token prediction applied to data description tasks."
      }
    ]} />
  </>);
}

function EduModule1() {
  return (<>
    <h3 style={{ color: "#22863A", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Summarize the current state of AI integration in US and Canadian medical schools based on AAMC SCOPE Survey data (2024)</li>
      <li>Identify three critical infrastructure gaps: governance policies, tool access, and faculty development</li>
      <li>Articulate a values-aligned vision for AI integration at your institution</li>
    </ul>

    <h3 style={styles.subhead}>The Current Landscape: AAMC Data</h3>
    <p style={styles.body}>The 2024 AAMC Curriculum SCOPE Survey (88% response rate, 182 of 208 MD- and DO-granting schools) reveals rapid growth:</p>
    <ul style={styles.list}>
      <li><strong>140 schools</strong> reported AI in curriculum in 2024, up from 88 in 2023 — a <strong>59% increase</strong> in one year</li>
      <li><strong>107 of 140</strong> schools have AI in the <strong>required</strong> curriculum (up from 61 of 88 in 2023)</li>
      <li>Ethical use and basic AI concepts are the most common topics in required curricula</li>
      <li>Some schools also cover AI in clinical settings, research, and data analysis</li>
    </ul>

    <h3 style={styles.subhead}>The Infrastructure Gap</h3>
    <p style={styles.body}>While curriculum has grown rapidly, governance has not kept pace:</p>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", margin: "1rem 0" }}>
      <div style={{ background: "#ef444415", borderRadius: 8, padding: "1rem", textAlign: "center" }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: "#ef4444" }}>52%</div>
        <div style={{ color: "#94a3b8", fontSize: 13 }}>of schools lack an appropriate use policy</div>
      </div>
      <div style={{ background: "#ef444415", borderRadius: 8, padding: "1rem", textAlign: "center" }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: "#ef4444" }}>70%</div>
        <div style={{ color: "#94a3b8", fontSize: 13 }}>do not provide secure AI tool access to learners</div>
      </div>
    </div>
    <p style={styles.body}>This creates a responsibility vacuum: students are using AI tools without institutional guidance, and faculty are teaching AI concepts without governance infrastructure to support them.</p>

    <h3 style={styles.subhead}>The IACAI Vision Framework</h3>
    <p style={styles.body}>The International Advisory Committee on AI (IACAI) — a collaboration between AAMC, AMEE, IAMSE, and partner organizations — proposes 12 domains for AI integration, organized across five levels:</p>
    <ul style={styles.list}>
      <li><strong>Intrapersonal:</strong> Individual educator awareness, values, and self-assessment of AI knowledge</li>
      <li><strong>Micro:</strong> Practice-level implementation (classroom, clinical training)</li>
      <li><strong>Meso:</strong> Institutional policies, committees, and infrastructure</li>
      <li><strong>Macro:</strong> National organizations (AAMC, AACOM) providing guidelines and benchmarks</li>
      <li><strong>Mega:</strong> International consortium developing global standards</li>
    </ul>

    <h3 style={styles.subhead}>Self-Assessment Exercise</h3>
    <p style={styles.body}>Using the IACAI framework, rate your institution on these domains from 1 (not started) to 5 (fully implemented). Identify your three weakest domains — these are your institutional priorities.</p>

    <RedFlag title="No policy = no governance" text="Students and faculty are already using AI tools. The question is whether they are using them with institutional guidance or without. A policy that says 'AI is prohibited' is not a governance strategy — it drives usage underground and eliminates the opportunity for structured learning." />

    <FormativeCheck questions={[
      { question: "According to the 2024 AAMC SCOPE Survey, approximately what percentage of responding schools have AI in their required curriculum?",
        options: [
          "About 30%",
          "About 50%",
          "About 76% (107 of 140 schools with AI in curriculum)",
          "About 95%"
        ],
        correct: 2,
        explanation: "107 of 140 schools that reported AI in curriculum confirmed it was in the required curriculum. This represents rapid growth from 2023, when 61 of 88 schools had AI in required curriculum. Note: 140 of 182 total respondents reported having AI in curriculum at all."
      },
      { question: "The most critical infrastructure gap identified in the SCOPE Survey is:",
        options: [
          "Lack of AI textbooks",
          "Insufficient computing power",
          "52% of schools lack an appropriate use policy and only 30% provide learners with secure AI tool access",
          "Too few AI-focused faculty"
        ],
        correct: 2,
        explanation: "The SCOPE Survey found that governance infrastructure is not keeping pace with curriculum growth. Without appropriate use policies and secure tool access, institutions cannot ensure responsible AI use by students and faculty."
      }
    ]} />
  </>);
}

function EduModule2() {
  return (<>
    <h3 style={{ color: "#22863A", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Distinguish between AI literacy (knowing concepts) and AI fluency (applying concepts to clinical and research practice)</li>
      <li>Map learner needs to the IACAI Matrix II (Learner Focus) competency framework</li>
      <li>Design a scaffolded AI curriculum progression from foundational to advanced</li>
    </ul>

    <h3 style={styles.subhead}>Literacy vs. Fluency: The Critical Distinction</h3>
    <p style={styles.body}><strong>AI literacy</strong> = understanding what "hallucination" means. <strong>AI fluency</strong> = knowing how to test for hallucination in a specific clinical tool, interpreting the results, and making a defensible decision about whether to use the tool.</p>
    <p style={styles.body}>The MedAI Lexicon provides literacy. These micromodules build fluency. Your curriculum needs both — but fluency is the actionable outcome.</p>

    <h3 style={styles.subhead}>Scaffolded Curriculum Progression</h3>
    <div style={{ border: "1px solid #334155", borderRadius: 8, overflow: "hidden", margin: "1rem 0" }}>
      {[
        { phase: "Year 1-2: Foundations", color: "#22c55e", items: "What is an LLM, how does it generate text, what are hallucinations, basic ethical principles, prompt basics" },
        { phase: "Year 3-4: Applied Evaluation", color: "#f59e0b", items: "How to test a clinical AI tool, structured prompting, evaluating vendor claims, entrustment assessment" },
        { phase: "Residency: Advanced Integration", color: "#ef4444", items: "Entrustment decision-making, governance participation, domain-specific AI evaluation, teaching AI to others" },
      ].map((p, i) => (
        <div key={i} style={{ padding: "1rem 1.25rem", borderBottom: i < 2 ? "1px solid #334155" : "none", borderLeft: `4px solid ${p.color}` }}>
          <div style={{ color: p.color, fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{p.phase}</div>
          <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6 }}>{p.items}</div>
        </div>
      ))}
    </div>

    <h3 style={styles.subhead}>The Competency Gap: Faculty Development First</h3>
    <p style={styles.body}>Most faculty are not AI fluent. Teaching AI fluency requires faculty development before curriculum development. The IACAI framework recommends:</p>
    <ul style={styles.list}>
      <li>Communities of practice where educators share AI experiences</li>
      <li>Case studies demonstrating AI integration successes and failures</li>
      <li>Institutional working groups with cross-disciplinary representation</li>
      <li>Training resources specific to each course or clerkship context</li>
    </ul>

    <h3 style={styles.subhead}>Curriculum Mapping Exercise</h3>
    <p style={styles.body}>Using the IACAI Matrix II (Learner Focus), identify which competencies should be required vs. elective at your institution. Map each required competency to a specific course or clerkship where it can be taught in context:</p>
    <ul style={styles.list}>
      <li>Hallucination detection → Evidence-Based Medicine coursework</li>
      <li>Prompt engineering → Clinical Skills / Simulation</li>
      <li>AI ethics → Medical Ethics / Professionalism</li>
      <li>AI for research → Research Methods coursework</li>
      <li>Clinical AI evaluation → Clerkship rotations</li>
    </ul>

    <FormativeCheck questions={[
      { question: "The difference between AI literacy and AI fluency is:",
        options: [
          "Literacy is for students; fluency is for faculty",
          "Literacy means knowing AI concepts; fluency means applying them to make decisions in practice",
          "Literacy covers basic AI; fluency covers advanced AI",
          "There is no meaningful difference"
        ],
        correct: 1,
        explanation: "AI literacy is conceptual knowledge (what is hallucination?). AI fluency is applied competence (how do I test for hallucination in this specific tool, interpret the results, and decide whether to use it?). Medical education should target fluency as the actionable outcome."
      }
    ]} />
  </>);
}

function EduModule3() {
  return (<>
    <h3 style={{ color: "#22863A", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Draft the essential components of an institutional AI appropriate use policy</li>
      <li>Establish a data governance framework addressing HIPAA, FERPA, and AI-specific privacy concerns</li>
      <li>Design an AI governance committee structure with appropriate stakeholder representation</li>
    </ul>

    <h3 style={styles.subhead}>Essential Policy Components</h3>
    <ol style={{ ...styles.list, listStyleType: "decimal" }}>
      <li><strong>Acceptable use guidelines:</strong> What AI tools may be used, for what purposes, with what disclosures</li>
      <li><strong>Data governance:</strong> No patient data in general-purpose LLMs without BAA compliance</li>
      <li><strong>Academic integrity:</strong> When and how AI assistance must be disclosed in coursework</li>
      <li><strong>Assessment integrity:</strong> How AI-assisted work is evaluated; AI use in examinations</li>
      <li><strong>Review cycle:</strong> Policies must be updated at least annually given the pace of AI development</li>
    </ol>

    <h3 style={styles.subhead}>HIPAA and AI: The Critical Boundary</h3>
    <p style={styles.body}>Any AI tool that processes protected health information (PHI) must be covered by a Business Associate Agreement (BAA). Most general-purpose LLMs (ChatGPT, Claude, Gemini) do not have BAAs for individual use. This means: <strong>no patient data in standard AI tools</strong>.</p>
    <p style={styles.body}>Enterprise agreements with specific AI vendors may include BAA coverage. Your institution's compliance office should evaluate any AI tool before it processes PHI or student educational records (FERPA).</p>

    <h3 style={styles.subhead}>Committee Structure (IACAI Recommendation)</h3>
    <p style={styles.body}>The IACAI recommends an institutional AI working group with representation from:</p>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", margin: "1rem 0" }}>
      {["Faculty (clinical)", "Faculty (basic science)", "Students", "IT / Cybersecurity",
       "Compliance / Legal", "Administration", "Librarians", "External AI expert"].map((role, i) => (
        <div key={i} style={{ background: "#22863A15", padding: "8px 12px", borderRadius: 6, color: "#86efac", fontSize: 13 }}>
          {role}
        </div>
      ))}
    </div>
    <p style={styles.body}>The committee should meet monthly and report to the dean. The IACAI RACI framework (Table 2) maps specific responsibilities to each stakeholder group.</p>

    <h3 style={styles.subhead}>The Entrustment Framework for AI in HPE (Gin et al., 2025)</h3>
    <p style={styles.body}>Gin et al. propose assessing AI trustworthiness through three characteristics, paralleling how supervisors evaluate trainees:</p>
    <ul style={styles.list}>
      <li><strong>Ability:</strong> Does the AI possess domain-specific knowledge for the task? Was it trained on relevant data?</li>
      <li><strong>Integrity:</strong> Is the AI transparent about how it generates output? Can it cite sources? Are biases disclosed?</li>
      <li><strong>Benevolence:</strong> Does the AI uphold ethical standards? Is it free of commercial agendas? Does it protect patient autonomy?</li>
    </ul>

    <RedFlag title="Prohibition is not governance" text="A policy that says 'AI is prohibited' is not a governance strategy. It drives usage underground, eliminates the opportunity for structured learning, and leaves students unprepared for clinical practice where AI tools are increasingly present." />
    <RedFlag title="No BAA = no patient data" text="Unless your institution has a Business Associate Agreement with a specific AI vendor, no PHI should enter any AI tool. This applies to clinical vignettes, case presentations, and any data that could identify a patient." />

    <FormativeCheck questions={[
      { question: "Gin et al.'s three characteristics for assessing AI trustworthiness are:",
        options: [
          "Speed, accuracy, and cost",
          "Ability, integrity, and benevolence",
          "Transparency, fairness, and reliability",
          "Training data quality, model size, and temperature"
        ],
        correct: 1,
        explanation: "Gin et al. (2025) propose assessing AI trustworthiness through ability (competence for the task), integrity (transparency and honesty), and benevolence (alignment with ethical standards). These parallel the trustworthiness characteristics used to assess HPE trainees for entrustment decisions."
      },
      { question: "How often should an institutional AI policy be reviewed, according to best practice?",
        options: [
          "Every 5 years",
          "Only when a problem occurs",
          "At least annually, given the pace of AI development",
          "Once, when initially created"
        ],
        correct: 2,
        explanation: "AI capabilities and risks evolve rapidly. A policy created even 12 months ago may not address current tools, capabilities, or risks. Annual review is a minimum; some institutions may need more frequent updates."
      }
    ]} />
  </>);
}

// ============================================================
// PHASE 2: CLINICIAN MODULES 4-8
// ============================================================

function ClinModule4() {
  return (<>
    <h3 style={{ color: "#E87B2A", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Explain why LLM outputs are stochastic and what temperature controls</li>
      <li>Design a reproducibility test for a clinical AI tool</li>
      <li>Establish a threshold for acceptable reproducibility in clinical decision support</li>
    </ul>
    <h3 style={styles.subhead}>Stochastic Generation: Why Outputs Vary</h3>
    <p style={styles.body}>Because the model samples from a probability distribution rather than always selecting the single highest-probability token (argmax), the same prompt can yield different outputs on different runs. Two parameters primarily control this variation:</p>
    <p style={styles.body}><strong>Temperature:</strong> Rescales logits before softmax. Low T sharpens the distribution; high T flattens it.</p>
    <p style={styles.body}><strong>Top-p (nucleus) sampling:</strong> Instead of considering all tokens, the model only samples from the smallest set of tokens whose cumulative probability exceeds threshold p. With p=0.9, the model considers only the top tokens covering 90% of probability mass, ignoring the long tail.</p>
    <FormulaBlock>Top-p: sample from smallest set S where Σ_{i∈S} P(token_i) ≥ p</FormulaBlock>
    <h3 style={styles.subhead}>Interactive: Temperature Effects on Reproducibility</h3>
    <TemperatureSimulation />
    <PromptComparison scenarios={[
      { label: "Low T (reproducible)",
        prompt: "What are the absolute contraindications to thrombolytic therapy in acute ischemic stroke?",
        responses: [
          "Absolute contraindications to IV alteplase in acute ischemic stroke include: active internal bleeding, recent intracranial surgery or serious head trauma within 3 months, intracranial neoplasm, known arteriovenous malformation, and presentation more than 4.5 hours from symptom onset (for IV alteplase).",
          "Absolute contraindications to thrombolytics in acute ischemic stroke: active internal bleeding, intracranial hemorrhage, recent (within 3 months) intracranial or spinal surgery, serious head trauma within 3 months, intracranial neoplasm or AVM, and symptom onset beyond the treatment window (4.5 hours for IV alteplase)."
        ],
        observation: "At low temperature, both runs produce nearly identical content with minor wording differences. The core clinical information is consistent. This is acceptable reproducibility for decision support."
      },
      { label: "High T (variable)",
        prompt: "What are the absolute contraindications to thrombolytic therapy in acute ischemic stroke?",
        responses: [
          "You should never give thrombolytics if the patient has been bleeding or had brain surgery recently. Also consider blood pressure — if it's really high that could be a problem. There are time windows too, but those depend on the specific agent and imaging findings...",
          "Absolute contraindications include active internal bleeding and intracranial pathology. But honestly, the decision is nuanced — many contraindications are relative, and newer evidence with imaging-guided approaches is expanding treatment windows significantly."
        ],
        observation: "At high temperature, responses diverge significantly. Run 1 is vague and informal. Run 2 editorializes. Neither is suitable for clinical decision support. This demonstrates why temperature settings matter for clinical AI tools."
      }
    ]} />
    <h3 style={styles.subhead}>Clinical Reproducibility Standard</h3>
    <p style={styles.body}><strong>Protocol:</strong> Select 20 clinical questions with verifiable correct answers. Ask each question 3 times at fixed low temperature. Score each run: identical answer = 1, minor variation (same clinical recommendation, different wording) = 0.5, contradictory recommendation = 0.</p>
    <p style={styles.body}><strong>Threshold:</strong> For clinical decision support, demand greater than 95% semantic consistency. If the tool scores below 80%, it is not ready for clinical use in its current configuration.</p>
    <RedFlag title="Variable dosing recommendations" text="If the same dosing question yields different specific doses on different runs at the same temperature, the tool is categorically unreliable for prescribing decisions. This is a disqualifying finding regardless of the tool's average accuracy." />
    <FormativeCheck questions={[
      { question: "Top-p (nucleus) sampling works by:",
        options: [
          "Always selecting the top p tokens from the vocabulary",
          "Sampling only from the smallest set of tokens whose cumulative probability exceeds the threshold p",
          "Reducing the temperature by a factor of p",
          "Selecting tokens that appear in the top p percentile of the training data"
        ],
        correct: 1,
        explanation: "Top-p sampling truncates the probability distribution to the smallest set of tokens whose probabilities sum to at least p. This removes the long tail of very low-probability tokens while preserving natural variation among high-probability candidates."
      },
      { question: "A clinical AI tool that produces contradictory treatment recommendations across runs at low temperature should be:",
        options: [
          "Used with caution and a disclaimer",
          "Considered unreliable for that clinical question — the finding is disqualifying",
          "Trusted on the first run since subsequent runs may have errors",
          "Tested at higher temperature to see if it stabilizes"
        ],
        correct: 1,
        explanation: "Contradictory recommendations at low temperature indicate fundamental instability in the model's output for that query. At low temperature, the model should be near-deterministic. Contradictions indicate the probability landscape has multiple competing peaks — the tool cannot be trusted for that clinical question."
      }
    ]} />
  </>);
}

function ClinModule5() {
  return (<>
    <h3 style={{ color: "#E87B2A", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Design a validation protocol for a clinical AI tool using gold-standard test cases</li>
      <li>Calculate and interpret accuracy, hallucination rate, and confidence calibration</li>
      <li>Apply the EPA entrustment framework to determine the appropriate level of AI supervision</li>
    </ul>
    <h3 style={styles.subhead}>Four-Dimension Evaluation Framework</h3>
    <p style={styles.body}>Accuracy alone is insufficient. A comprehensive evaluation assesses four dimensions:</p>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", margin: "1rem 0" }}>
      {[
        { title: "1. Diagnostic Accuracy", threshold: ">90%", desc: "Compare against validated benchmarks (USMLE, board exam questions). Minimum 100 test cases.", color: "#22c55e" },
        { title: "2. Hallucination Rate", threshold: "<5%", desc: "Fraction of responses containing factually incorrect claims. Test with 50+ open-ended questions.", color: "#f59e0b" },
        { title: "3. Reproducibility", threshold: ">95%", desc: "Semantic consistency across 3+ runs at fixed low temperature. Test 20+ questions.", color: "#2A7AE8" },
        { title: "4. Confidence Calibration", threshold: "r > 0.8", desc: "Correlation between stated confidence and actual correctness. Do high-confidence answers have higher accuracy?", color: "#a855f7" },
      ].map((d, i) => (
        <div key={i} style={{ background: "#1e293b", borderRadius: 8, padding: "1rem", borderLeft: `4px solid ${d.color}` }}>
          <div style={{ color: d.color, fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{d.title}</div>
          <div style={{ color: "#00d9ff", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{d.threshold}</div>
          <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>{d.desc}</div>
        </div>
      ))}
    </div>
    <h3 style={styles.subhead}>Entrustment Levels for Clinical AI (Gin et al., 2025)</h3>
    <p style={styles.body}>Gin et al. propose a 5-level entrustment scale that maps AI supervision requirements to task stakes:</p>
    <div style={{ border: "1px solid #334155", borderRadius: 8, overflow: "hidden", margin: "1rem 0" }}>
      {[
        { level: "Level 1", desc: "AI ineligible for any autonomous role", example: "Summative graduation decisions by competency committee", color: "#ef4444" },
        { level: "Level 2", desc: "Supporting role, constant human supervision", example: "AI summarizing written feedback on a competency", color: "#f59e0b" },
        { level: "Level 3", desc: "Equivalent collaboration with humans", example: "AI creating figures or illustrations for lectures", color: "#eab308" },
        { level: "Level 4", desc: "Leading role, limited human supervision", example: "Automated scoring with validated rubric", color: "#22c55e" },
        { level: "Level 5", desc: "Full autonomy", example: "Formative student dashboard (low stakes, validated)", color: "#10b981" },
      ].map((l, i) => (
        <div key={i} style={{ padding: "0.75rem 1rem", borderBottom: i < 4 ? "1px solid #334155" : "none", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <div style={{ minWidth: 70, color: l.color, fontWeight: 700, fontSize: 13 }}>{l.level}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 500 }}>{l.desc}</div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>Example: {l.example}</div>
          </div>
        </div>
      ))}
    </div>
    <RedFlag title="Unvalidated accuracy claims" text="If a vendor claims their AI achieves '95% accuracy' without citing peer-reviewed validation on an independent test set, be skeptical. Accuracy measured on the vendor's own data is not generalizable." />
    <RedFlag title="No uncertainty expression" text="If the tool never says 'I am not certain,' it is not well-calibrated. A model that expresses the same confidence on common conditions and rare edge cases is dangerous — it cannot distinguish what it knows from what it is guessing." />
    <FormativeCheck questions={[
      { question: "An AI tool with 92% accuracy but 15% hallucination rate is:",
        options: [
          "Acceptable for clinical use with minor caveats",
          "More dangerous than a tool with 88% accuracy and 2% hallucination rate",
          "Safe because accuracy exceeds 90%",
          "Appropriate for Level 4 entrustment"
        ],
        correct: 1,
        explanation: "A 15% hallucination rate means approximately 1 in 7 responses contains factually incorrect information. Even with high average accuracy, the unpredictability of hallucinations makes this tool more dangerous than one with slightly lower accuracy but far fewer false claims. Hallucination rate and accuracy must both be evaluated."
      }
    ]} />
  </>);
}

function ClinModule6() {
  return (<>
    <h3 style={{ color: "#E87B2A", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Construct structured clinical prompts that reduce hallucination risk</li>
      <li>Apply chain-of-thought (CoT) prompting to clinical reasoning tasks</li>
      <li>Use few-shot prompting to guide output format and quality</li>
    </ul>
    <h3 style={styles.subhead}>The Anatomy of a Good Clinical Prompt</h3>
    <p style={styles.body}>A well-constructed clinical prompt specifies five elements. Each additional constraint reduces the probability space the model samples from, lowering hallucination risk:</p>
    <ol style={{ ...styles.list, listStyleType: "decimal" }}>
      <li><strong>Clinical context:</strong> Setting, urgency, available resources</li>
      <li><strong>Patient demographics:</strong> Age, sex, relevant comorbidities, medications</li>
      <li><strong>Specific question:</strong> What exactly do you need to know?</li>
      <li><strong>Desired format:</strong> Differential list, step-by-step reasoning, comparison table</li>
      <li><strong>Source constraints:</strong> Which guidelines, what to avoid (e.g., "do not fabricate citations")</li>
    </ol>
    <h3 style={styles.subhead}>Progressive Prompt Exercise</h3>
    <PromptComparison scenarios={[
      { label: "Level 1: Weak",
        prompt: "What drug should I use for hypertension?",
        responses: [
          "Common antihypertensives include ACE inhibitors, ARBs, calcium channel blockers, and thiazide diuretics. The choice depends on the patient's age, race, and comorbidities.",
          "For hypertension, first-line options include lisinopril, amlodipine, hydrochlorothiazide, or losartan. Lifestyle modifications should also be recommended."
        ],
        observation: "Both responses are generic and lack patient-specific guidance. The model fills in no context because none was provided. This level of response is not clinically actionable."
      },
      { label: "Level 2: Better",
        prompt: "What is the first-line antihypertensive for a 55-year-old African American male with stage 2 hypertension and no comorbidities, per current ACC/AHA guidelines?",
        responses: [
          "Per ACC/AHA guidelines, initial treatment for a 55-year-old African American male with stage 2 HTN and no comorbidities should be a thiazide diuretic or calcium channel blocker. Two-drug combination therapy is recommended for stage 2 HTN. Preferred combinations: thiazide + CCB, or CCB + ACE inhibitor.",
          "For this patient, ACC/AHA guidelines recommend initiating two-drug therapy for stage 2 HTN. First-line agents in African American patients: thiazide-type diuretic (chlorthalidone) or calcium channel blocker (amlodipine). ACE inhibitors and ARBs are less effective as monotherapy in this population."
        ],
        observation: "Both responses are now patient-specific, guideline-referenced, and clinically actionable. Adding context dramatically improves output quality."
      },
      { label: "Level 3: Advanced",
        prompt: "Acting as an evidence-based medicine consultant: provide first-line antihypertensive recommendations for a 55-year-old African American male with stage 2 HTN (systolic 160-170), no diabetes, no CKD, no heart failure. Cite the specific guideline section (ACC/AHA 2017). If evidence is mixed or recommendations differ from JNC 8, state the uncertainty explicitly. Do not fabricate citations.",
        responses: [
          "Per the 2017 ACC/AHA Hypertension Guideline: Stage 2 HTN (≥140/90) warrants initiation of two first-line agents. For African American adults without heart failure or CKD, initial therapy should include a thiazide-type diuretic (preferably chlorthalidone) and/or a calcium channel blocker (amlodipine). Note: The JNC 8 panel members' report (2014) had a higher threshold for treatment initiation (150/90 in patients ≥60). The ACC/AHA 2017 guideline lowered thresholds, which remains a point of clinical debate. ACE inhibitors are less effective as monotherapy in African American patients per ALLHAT trial findings, though they remain appropriate in combination therapy.",
          "Based on ACC/AHA 2017 guidelines for this patient profile: Initiate two-drug combination therapy. Recommended agents: thiazide diuretic (chlorthalidone preferred over HCTZ per guideline preference) plus dihydropyridine CCB (amlodipine). Area of uncertainty: Treatment threshold differs between JNC 8 (more conservative in older patients) and ACC/AHA 2017 (lower thresholds). Both guidelines agree on drug class selection for African American patients. I cannot provide specific page or section numbers without verified access to the document."
        ],
        observation: "Both responses now provide guideline-specific recommendations, acknowledge uncertainty between guidelines, and the second response honestly states it cannot verify section numbers. This is the gold standard for clinical prompting."
      }
    ]} />
    <h3 style={styles.subhead}>Chain-of-Thought Prompting</h3>
    <p style={styles.body}><strong>Chain-of-thought (CoT)</strong> prompting instructs the model to show its reasoning step by step. This improves accuracy on complex reasoning tasks because intermediate tokens constrain subsequent predictions. Instead of jumping directly to a conclusion, the model generates reasoning tokens that narrow the probability space for the final answer.</p>
    <div style={styles.promptBox}>
      <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>CoT PROMPT TEMPLATE</div>
      <div style={{ color: "#e2e8f0", fontSize: 14, fontStyle: "italic", margin: "4px 0" }}>"Given this patient presentation [details], work through the differential diagnosis step by step. For each candidate diagnosis, state the supporting evidence from the presentation and the evidence against. Then rank the differential by likelihood. Show your reasoning."</div>
    </div>
    <FormativeCheck questions={[
      { question: "Chain-of-thought prompting improves accuracy because:",
        options: [
          "It makes the model think harder about the problem",
          "Intermediate reasoning tokens constrain subsequent predictions, narrowing the probability space",
          "It accesses a different part of the model's training data",
          "It increases the temperature automatically"
        ],
        correct: 1,
        explanation: "CoT works mechanistically: by generating intermediate reasoning tokens, each subsequent prediction is conditioned on a richer context. This constrains the output toward answers consistent with the stated reasoning, reducing the probability of jumping to a statistically likely but incorrect conclusion."
      }
    ]} />
  </>);
}

function ClinModule7() {
  return (<>
    <h3 style={{ color: "#E87B2A", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Compare training objectives and output characteristics across major LLM architectures</li>
      <li>Explain why different models have different hallucination profiles</li>
      <li>Select the appropriate model type for a given clinical task</li>
    </ul>
    <h3 style={styles.subhead}>How Training Objectives Shape Output</h3>
    <p style={styles.body}>All transformer-based LLMs use the same core generation mechanism (softmax + sampling), but their training objectives create fundamentally different output characteristics:</p>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", margin: "1rem 0" }}>
      {[
        { name: "Autoregressive (GPT-style)", training: "Next-token prediction on general internet data", character: "High variance, prone to hallucination on specialized topics. No explicit constraint against fabrication.", clinical: "Requires careful prompt engineering and mandatory fact-checking.", color: "#10b981" },
        { name: "RLHF-Aligned (Claude-style)", training: "Reinforcement learning from human feedback + constitutional alignment", character: "More calibrated uncertainty. Tends to express doubt on uncertain topics. May err toward caution.", clinical: "Better at flagging uncertainty, but still requires verification for clinical claims.", color: "#2A7AE8" },
        { name: "Specialized Medical", training: "Fine-tuned on medical literature, clinical trials, textbooks", character: "Higher accuracy within training distribution. Still hallucinates on rare conditions and recent research.", clinical: "More reliable for narrow medical tasks within the fine-tuning domain.", color: "#a855f7" },
      ].map((m, i) => (
        <div key={i} style={{ background: "#1e293b", borderRadius: 8, padding: "1rem", borderTop: `3px solid ${m.color}` }}>
          <div style={{ color: m.color, fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{m.name}</div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}><strong style={{ color: "#cbd5e1" }}>Training:</strong> {m.training}</div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}><strong style={{ color: "#cbd5e1" }}>Output:</strong> {m.character}</div>
          <div style={{ color: "#94a3b8", fontSize: 12 }}><strong style={{ color: "#cbd5e1" }}>Clinical:</strong> {m.clinical}</div>
        </div>
      ))}
    </div>
    <h3 style={styles.subhead}>The Helpfulness-Safety Trade-off</h3>
    <p style={styles.body}>Different RLHF objectives create different probability landscapes. A model trained to maximize helpfulness may hallucinate plausible-sounding information to avoid saying "I don't know." A model trained to be conservative may suppress valid but uncertain outputs. Neither extreme is ideal for all clinical tasks.</p>
    <p style={styles.body}><strong>For clinical evaluation:</strong> A model that frequently says "I'm not sure" is safer than one that always provides a confident answer. Overconfidence is more dangerous than overcaution in clinical decision support.</p>
    <Collapsible title="What about retrieval-augmented generation (RAG)?">
      <p>RAG supplements LLM generation with retrieval from a user-defined database. It can improve accuracy and provide citation ability by giving the model access to verified content. However, RAG does not guarantee faithful representation — the model may still hallucinate interpretations of retrieved content or selectively attend to parts of retrieved documents that support a pre-existing pattern.</p>
      <p style={{ marginTop: 8 }}>When evaluating a RAG-based clinical tool, verify: (1) What is the retrieval database? (2) How current is it? (3) Does the model faithfully represent retrieved sources? (4) Can you audit the retrieval process?</p>
    </Collapsible>
    <FormativeCheck questions={[
      { question: "A general-purpose LLM optimized for helpfulness is potentially more dangerous in clinical settings because:",
        options: [
          "It processes information more slowly",
          "It may hallucinate plausible information rather than expressing uncertainty",
          "It has a smaller vocabulary",
          "It cannot process medical terminology"
        ],
        correct: 1,
        explanation: "A helpfulness-optimized model is trained to provide useful answers. When it encounters questions where the correct answer is 'I'm not sure,' the helpfulness objective incentivizes generating a plausible response rather than expressing uncertainty. In clinical settings, false confidence is more dangerous than honest uncertainty."
      }
    ]} />
  </>);
}

function ClinModule8() {
  return (<>
    <h3 style={{ color: "#E87B2A", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Apply a comprehensive evaluation protocol integrating all four dimensions</li>
      <li>Map a clinical AI tool to the appropriate entrustment level</li>
      <li>Draft a recommendation memo for institutional leadership on AI tool adoption</li>
    </ul>
    <h3 style={styles.subhead}>Capstone: Comprehensive AI Tool Evaluation</h3>
    <p style={styles.body}>This module synthesizes everything from Modules 1-7 into a practical evaluation framework. You will apply this to evaluate a hypothetical clinical AI tool.</p>
    <h3 style={styles.subhead}>Entrustment Decision Framework (Gin et al., 2025)</h3>
    <p style={styles.body}>Five factors determine the appropriate entrustment level:</p>
    <div style={{ border: "1px solid #334155", borderRadius: 8, overflow: "hidden", margin: "1rem 0" }}>
      {[
        { factor: "Trustee (AI Tool)", question: "Does it have domain-specific knowledge? What is its training data? What are its validated capabilities?" },
        { factor: "Trustor (User)", question: "Does the user have sufficient AI literacy and clinical expertise to judge the validity of AI output?" },
        { factor: "Context", question: "What are the stakes for patients, learners, and the institution? Could the AI have differential impact on different groups?" },
        { factor: "Relationship", question: "Do users have partnerships with AI developers that allow them to advocate for clinical priorities?" },
        { factor: "Task", question: "Is this a low-stakes or high-stakes task? Is the potential value from AI worth the risk of errors?" },
      ].map((f, i) => (
        <div key={i} style={{ padding: "0.75rem 1rem", borderBottom: i < 4 ? "1px solid #334155" : "none" }}>
          <div style={{ color: "#00d9ff", fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{f.factor}</div>
          <div style={{ color: "#94a3b8", fontSize: 13 }}>{f.question}</div>
        </div>
      ))}
    </div>
    <h3 style={styles.subhead}>Capstone Exercise</h3>
    <p style={styles.body}><strong>Scenario:</strong> A vendor is pitching an AI-powered antibiotic selection tool for your hospital's Emergency Department. The tool recommends antibiotics based on patient demographics, presenting symptoms, and local resistance patterns. Using everything you have learned:</p>
    <ol style={{ ...styles.list, listStyleType: "decimal" }}>
      <li><strong>Design your testing methodology:</strong> What questions will you test? How many? What gold standard will you use?</li>
      <li><strong>Evaluate across all four dimensions:</strong> Accuracy (against established guidelines), hallucination rate (fabricated drug names or dosages), reproducibility (same case, multiple runs), confidence calibration (does it express uncertainty on ambiguous cases?)</li>
      <li><strong>Determine entrustment level:</strong> Using Gin et al.'s 5-level scale, what supervision level is appropriate? What conditions would allow you to increase the entrustment level over time?</li>
      <li><strong>Draft a 1-page memo</strong> to your department chair with your recommendation: adopt, pilot with safeguards, or reject.</li>
    </ol>
    <RedFlag title="The key insight" text="Accuracy alone is insufficient. A tool that is 92% accurate but has a 15% hallucination rate and poor reproducibility is more dangerous than a tool that is 88% accurate with a 2% hallucination rate and 98% reproducibility. The pattern of errors matters more than the average performance." />
    <FormativeCheck questions={[
      { question: "When writing an evaluation memo for leadership, the most important information to include is:",
        options: [
          "The vendor's marketing claims about accuracy",
          "Your independent testing results across all four dimensions, with the recommended entrustment level and justification",
          "A comparison of the tool's price to competitors",
          "The number of other hospitals using the tool"
        ],
        correct: 1,
        explanation: "Institutional leadership needs independent evidence, not vendor claims. Your memo should present your testing methodology, results across accuracy, hallucination rate, reproducibility, and calibration, and a specific entrustment level recommendation grounded in the Gin et al. framework."
      }
    ]} />
  </>);
}

// ============================================================
// PHASE 2: RESEARCHER MODULES 4-7
// ============================================================

function ResModule4() {
  return (<>
    <h3 style={{ color: "#2A7AE8", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Identify appropriate and inappropriate uses of AI at each stage of the research process</li>
      <li>Apply responsible AI use principles from AAMC and IACAI frameworks</li>
      <li>Develop a personal verification protocol for LLM-assisted research</li>
    </ul>
    <h3 style={styles.subhead}>AI in the Research Workflow: Where It Helps and Where It Fails</h3>
    <div style={{ border: "1px solid #334155", borderRadius: 8, overflow: "hidden", margin: "1rem 0" }}>
      {[
        { stage: "Literature search", appropriate: "Generating search terms, identifying related MeSH headings, brainstorming search strategies", inappropriate: "Accepting LLM-generated literature summaries as accurate without verification against primary sources", color: "#22c55e" },
        { stage: "Hypothesis generation", appropriate: "Brainstorming research questions, identifying gaps in existing literature, suggesting experimental approaches", inappropriate: "Treating LLM-generated hypotheses as novel — they are recombinations of training data patterns, not discoveries", color: "#22c55e" },
        { stage: "Data analysis", appropriate: "Writing code for statistical analysis, suggesting visualization approaches, drafting analysis pipelines", inappropriate: "Using AI-generated code without validating against known correct results and checking statistical test assumptions", color: "#f59e0b" },
        { stage: "Manuscript writing", appropriate: "Improving clarity of drafted text, checking grammar, restructuring paragraphs (with disclosure)", inappropriate: "Submitting AI-generated text as original scholarship without disclosure; relying on AI-generated citations", color: "#ef4444" },
      ].map((s, i) => (
        <div key={i} style={{ padding: "1rem", borderBottom: i < 3 ? "1px solid #334155" : "none", borderLeft: `4px solid ${s.color}` }}>
          <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{s.stage}</div>
          <div style={{ color: "#86efac", fontSize: 13, marginBottom: 4 }}>✓ Appropriate: {s.appropriate}</div>
          <div style={{ color: "#fca5a5", fontSize: 13 }}>✗ Inappropriate: {s.inappropriate}</div>
        </div>
      ))}
    </div>
    <h3 style={styles.subhead}>The Verification Obligation</h3>
    <p style={styles.body}>Every factual claim in an LLM-generated research document must be independently verified against primary sources. This obligation applies regardless of how confident the model sounds. The IACAI framework (Domain X: Research) explicitly recommends identifying appropriate stages where AI can be integrated and building verification into each stage.</p>
    <h3 style={styles.subhead}>Prompt Progression: Research-Specific</h3>
    <div style={styles.promptBox}>
      <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>RESEARCH PROMPT TEMPLATE</div>
      <div style={{ color: "#e2e8f0", fontSize: 14, fontStyle: "italic", margin: "4px 0" }}>"I am studying [specific pathway] in [specific cell type]. Suggest 5 potential research questions that extend current findings. For each question, explain what makes it potentially novel and what existing evidence would support it. Flag any suggestions where the supporting evidence is uncertain or based on limited studies."</div>
      <div style={{ color: "#94a3b8", fontSize: 13 }}>Why this works: Asking the model to flag uncertainty forces qualification. Specifying "based on limited studies" leverages the model's knowledge of evidence strength gradations.</div>
    </div>
    <FormativeCheck questions={[
      { question: "LLM-generated hypotheses should be treated as:",
        options: [
          "Novel scientific discoveries",
          "Recombinations of patterns from training data that may point to useful directions but require independent validation",
          "More reliable than human-generated hypotheses because they consider more literature",
          "Equivalent to systematic review conclusions"
        ],
        correct: 1,
        explanation: "LLMs recombine patterns from training data. They cannot discover new facts or reason about causality. A generated hypothesis may point to a fruitful direction, but it reflects what is statistically common in published literature, not what is scientifically true or novel."
      }
    ]} />
  </>);
}

function ResModule5() {
  return (<>
    <h3 style={{ color: "#2A7AE8", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Explain why AI-generated code can contain subtle bugs that produce plausible but incorrect results</li>
      <li>Design a validation protocol for AI-generated data analysis code</li>
      <li>Apply defensive coding practices when using AI as a coding assistant</li>
    </ul>
    <h3 style={styles.subhead}>The Plausibility Trap</h3>
    <p style={styles.body}>AI-generated code often runs without errors and produces output that looks reasonable. But "runs without errors" is not the same as "produces correct results." The most dangerous bugs are those that produce plausible-looking but incorrect numerical output.</p>
    <p style={styles.body}><strong>Common failure modes in AI-generated analysis code:</strong></p>
    <ul style={styles.list}>
      <li><strong>Wrong statistical test:</strong> Using a parametric test (t-test) on non-normal data without checking assumptions. The code runs, produces a p-value, but the result is invalid.</li>
      <li><strong>Off-by-one indexing:</strong> Selecting the wrong rows or columns, silently excluding or including data points. Especially common with 0-indexed vs. 1-indexed languages.</li>
      <li><strong>Silent type coercion:</strong> Numeric values stored as strings being silently converted, leading to incorrect calculations or dropped data.</li>
      <li><strong>Missing data handling:</strong> Dropping NA values without disclosure, or imputing with mean/median without justification, changing the effective sample size and potentially biasing results.</li>
    </ul>
    <h3 style={styles.subhead}>Validation Protocol</h3>
    <ol style={{ ...styles.list, listStyleType: "decimal" }}>
      <li><strong>Test on known data:</strong> Before running on your actual dataset, test the generated code on a small dataset where you know the correct answer. If the code produces the wrong result on known data, it will produce wrong results on your data.</li>
      <li><strong>Verify assumptions:</strong> For statistical tests, independently check: normality (Shapiro-Wilk), homoscedasticity (Levene's), independence. Do not trust the AI to check these.</li>
      <li><strong>Manual spot-check:</strong> Calculate at least one value by hand and compare to the code output.</li>
      <li><strong>Edge cases:</strong> Test with missing data, zero values, extreme outliers, and single-element groups.</li>
    </ol>
    <PromptComparison scenarios={[
      { label: "Unchecked code",
        prompt: "Write Python code to perform a t-test comparing drug efficacy between treatment and control groups from my CSV file.",
        responses: [
          "import pandas as pd\nfrom scipy.stats import ttest_ind\n\ndf = pd.read_csv('data.csv')\ntreatment = df[df['group']=='treatment']['efficacy']\ncontrol = df[df['group']=='control']['efficacy']\nt, p = ttest_ind(treatment, control)\nprint(f't={t:.4f}, p={p:.4f}')",
          "import pandas as pd\nfrom scipy.stats import ttest_ind\n\ndf = pd.read_csv('data.csv')\nt_group = df.loc[df.group == 'treatment', 'efficacy'].dropna()\nc_group = df.loc[df.group == 'control', 'efficacy'].dropna()\nstat, pval = ttest_ind(t_group, c_group)\nprint(f'Test statistic: {stat:.3f}, P-value: {pval:.3f}')"
        ],
        observation: "Both scripts run and produce results. Neither checks normality assumptions, handles missing data transparently, nor tests for equal variances (which affects whether to use Welch's t-test vs. Student's t-test). Both would produce publishable-looking but potentially invalid statistical results."
      }
    ]} />
    <RedFlag title="AI-generated p-values" text="An AI-generated statistical analysis that produces a clean p-value without checking assumptions is not valid science. Always verify: Is the test appropriate for this data distribution? Are assumptions met? Is the sample size adequate?" />
    <FormativeCheck questions={[
      { question: "The most dangerous type of AI-generated code bug is:",
        options: [
          "A syntax error that prevents the code from running",
          "A runtime error that crashes the program",
          "A silent bug that produces plausible but incorrect numerical output",
          "A formatting error in the output"
        ],
        correct: 2,
        explanation: "Syntax and runtime errors are obvious — the code fails visibly. Silent bugs are far more dangerous because the code runs successfully and produces output that looks reasonable but is wrong. These can lead to incorrect conclusions in published research."
      }
    ]} />
  </>);
}

function ResModule6() {
  return (<>
    <h3 style={{ color: "#2A7AE8", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Distinguish between training data bias, algorithmic bias, and output bias</li>
      <li>Explain how bias in AI models can introduce systematic errors into research</li>
      <li>Apply the IACAI ethical framework to bias detection and mitigation</li>
    </ul>
    <h3 style={styles.subhead}>Three Layers of AI Bias</h3>
    <p style={styles.body}><strong>Training data bias:</strong> LLMs are trained on internet text, which over-represents English-language sources, Western populations, common conditions, and well-funded research areas. Rare diseases, non-English medical literature, and underrepresented populations are systematically under-represented in the training distribution.</p>
    <p style={styles.body}><strong>Algorithmic bias:</strong> Even with balanced training data, the model's optimization objective (next-token prediction) favors common patterns. Rare associations are learned with lower confidence and are more likely to be overridden by frequent patterns during generation. This means the model systematically under-represents minority findings.</p>
    <p style={styles.body}><strong>Output bias:</strong> The model's generated text may reproduce stereotypes and biases present in training data. Gin et al. (2025) developed a gender-neutral LLM for measuring sentiment in feedback narratives, which revealed that standard models reproduced biases in how clinical faculty describe trainees of different genders and underrepresented-in-medicine statuses.</p>
    <Collapsible title="The Word Embedding Association Test (WEAT)">
      <p>Caliskan et al. developed the WEAT to measure implicit associations in LLMs — analogous to the Implicit Association Test (IAT) in psychology. WEAT measures whether a model's embeddings associate certain demographic groups with certain stereotypes more strongly than others.</p>
      <p style={{ marginTop: 8 }}>Findings: LLMs reproduce human-like biases around gender (associating "career" with male names, "family" with female names), race, religion, and socioeconomic status. These biases are encoded in the embedding space and influence every downstream generation task.</p>
    </Collapsible>
    <h3 style={styles.subhead}>Research Implications</h3>
    <p style={styles.body}><strong>Literature review bias:</strong> If your LLM-assisted literature review returns predominantly Western, English-language sources, the model is systematically excluding relevant global research. You may miss important findings published in non-English journals or from under-studied populations.</p>
    <p style={styles.body}><strong>Hypothesis generation bias:</strong> If AI-generated hypotheses cluster around well-studied pathways, the model is exhibiting frequency bias, not generating novel insights. Truly novel research often explores under-studied areas — precisely where the model has the least training data.</p>
    <RedFlag title="Systematic literature exclusion" text="If your LLM-assisted search returns zero results from non-English-language journals on a topic with known international research activity, the model's training data bias is systematically excluding relevant work. Supplement with targeted manual searches in relevant language-specific databases." />
    <FormativeCheck questions={[
      { question: "Gin et al.'s gender-neutral sentiment LLM revealed that:",
        options: [
          "AI models are inherently unbiased",
          "Standard LLMs reproduce biases in how clinical faculty describe trainees of different genders and URM statuses",
          "Gender bias only exists in older AI models",
          "Bias in AI is primarily a training data problem that is easily fixed"
        ],
        correct: 1,
        explanation: "Gin et al. (2025) found that standard LLMs reproduce human-like biases from training data, including differences in emotive language used to describe trainees of different demographics. Building a gender-neutral model allowed them to uncover these persistent biases in the clinical learning environment."
      }
    ]} />
  </>);
}

function ResModule7() {
  return (<>
    <h3 style={{ color: "#2A7AE8", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Identify emerging AI capabilities relevant to research: RAG, multimodal models, and agent-based systems</li>
      <li>Assess research integrity implications of each emerging capability</li>
      <li>Develop a personal framework for evaluating new AI tools as they emerge</li>
    </ul>
    <h3 style={styles.subhead}>Emerging Capabilities and Their Risks</h3>
    <div style={{ border: "1px solid #334155", borderRadius: 8, overflow: "hidden", margin: "1rem 0" }}>
      {[
        { tech: "Retrieval-Augmented Generation (RAG)", promise: "Supplements LLM with retrieval from a verified database. Can improve accuracy and provide citations.", risk: "Does not guarantee faithful representation. Model may hallucinate interpretations of retrieved documents or selectively attend to parts that match pre-existing patterns.", integrity: "Verify: what is the retrieval database? How current? Can you audit retrievals?" },
        { tech: "Multimodal Models", promise: "Process images, text, and structured data simultaneously. Promising for pathology, radiology, molecular visualization.", risk: "Multimodal hallucination: describing features in an image that do not exist. This failure mode is poorly understood and harder to detect than text-only hallucination.", integrity: "Never trust visual analysis without independent verification by a domain expert." },
        { tech: "Agent-Based Systems", promise: "AI executes multi-step workflows: search literature, retrieve papers, summarize, generate hypotheses.", risk: "Compounding error: each step's hallucination risk multiplies across the pipeline. A 5% error rate per step compounds to ~23% error over 5 steps.", integrity: "Verify outputs at each step, not just the final result. One undetected error early in the pipeline corrupts all downstream outputs." },
      ].map((t, i) => (
        <div key={i} style={{ padding: "1rem", borderBottom: i < 2 ? "1px solid #334155" : "none" }}>
          <div style={{ color: "#00d9ff", fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{t.tech}</div>
          <div style={{ color: "#86efac", fontSize: 13, marginBottom: 4 }}>Promise: {t.promise}</div>
          <div style={{ color: "#fca5a5", fontSize: 13, marginBottom: 4 }}>Risk: {t.risk}</div>
          <div style={{ color: "#93c5fd", fontSize: 13 }}>Integrity check: {t.integrity}</div>
        </div>
      ))}
    </div>
    <h3 style={styles.subhead}>Compounding Error in Multi-Step AI Workflows</h3>
    <FormulaBlock>P(all steps correct) = (1 - error_rate)^n{"\n"}Example: 5% error per step × 5 steps = (0.95)^5 = 0.774{"\n"}→ 22.6% probability of at least one error in the pipeline</FormulaBlock>
    <p style={styles.body}>This is why agent-based research workflows require verification at each step, not just the final output. A single undetected hallucination early in the pipeline corrupts all downstream analysis.</p>
    <h3 style={styles.subhead}>Personal Evaluation Framework</h3>
    <p style={styles.body}>When evaluating any new AI research tool, ask these five questions:</p>
    <ol style={{ ...styles.list, listStyleType: "decimal" }}>
      <li>What is its training data, and how relevant is it to my specific research domain?</li>
      <li>Does it use RAG? If so, what is its retrieval database and how current is it?</li>
      <li>Can it cite sources, and are those citations independently verifiable?</li>
      <li>Does it express calibrated uncertainty, or is it uniformly confident?</li>
      <li>For multi-step workflows, can I verify intermediate outputs, not just the final result?</li>
    </ol>
    <FormativeCheck questions={[
      { question: "Compounding error in agent-based AI systems means:",
        options: [
          "Errors cancel each other out over multiple steps",
          "Each step's hallucination risk multiplies, so multi-step workflows have significantly higher total error rates",
          "The system becomes more accurate with more steps",
          "Errors only occur at the final output step"
        ],
        correct: 1,
        explanation: "Each step in a multi-step AI pipeline has an independent probability of error. These probabilities compound: (1-error)^n decreases with each additional step. A 5% per-step error rate over 5 steps yields a ~23% chance of at least one error in the pipeline. This is why intermediate verification is essential."
      }
    ]} />
  </>);
}

// ============================================================
// PHASE 2: EDUCATOR MODULES 4-6
// ============================================================

function EduModule4() {
  return (<>
    <h3 style={{ color: "#22863A", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Evaluate AI-powered assessment tools using the Gin et al. entrustment scale</li>
      <li>Identify bias risks in AI-assisted assessment</li>
      <li>Design safeguards for AI-assisted assessment that preserve fairness and transparency</li>
    </ul>
    <h3 style={styles.subhead}>AI in Assessment: Current Applications</h3>
    <p style={styles.body}>AI is being used across the assessment continuum:</p>
    <ul style={styles.list}>
      <li><strong>Automated item scoring:</strong> Free-response items scored against a rubric or construct map</li>
      <li><strong>Feedback quality appraisal:</strong> Analyzing narrative evaluations for completeness and actionability</li>
      <li><strong>Student performance dashboards:</strong> Synthesizing evaluation data into individualized insights</li>
      <li><strong>Predictive analytics:</strong> Identifying at-risk learners based on performance patterns</li>
    </ul>
    <h3 style={styles.subhead}>Entrustment Mapping for Assessment Tasks</h3>
    <div style={{ border: "1px solid #334155", borderRadius: 8, overflow: "hidden", margin: "1rem 0" }}>
      {[
        { task: "Competency committee summative decisions", level: "Level 1 — AI ineligible", rationale: "High stakes; AI cannot explain its decision-making process or weigh evidence as committee members do", color: "#ef4444" },
        { task: "Feedback narrative summarization", level: "Level 2 — Supporting, constant supervision", rationale: "AI may not recognize bias in source material or detect politeness strategies and coded language in evaluations", color: "#f59e0b" },
        { task: "Lecture illustration creation", level: "Level 3 — Equivalent collaboration", rationale: "Moderate stakes; AI may fail to cite creative sources; results require review but risk is manageable", color: "#eab308" },
        { task: "Free-response scoring with validated rubric", level: "Level 4 — Leading, limited supervision", rationale: "Requires adequate validation against human scorers; ongoing bias monitoring essential", color: "#22c55e" },
        { task: "Formative student dashboard", level: "Level 5 — Full autonomy", rationale: "Low stakes (purely formative); validated insights; real-time analysis of data too large for manual review", color: "#10b981" },
      ].map((t, i) => (
        <div key={i} style={{ padding: "0.75rem 1rem", borderBottom: i < 4 ? "1px solid #334155" : "none", borderLeft: `4px solid ${t.color}` }}>
          <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 500 }}>{t.task}</div>
          <div style={{ color: t.color, fontSize: 13, fontWeight: 600, marginTop: 2 }}>{t.level}</div>
          <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>{t.rationale}</div>
        </div>
      ))}
    </div>
    <h3 style={styles.subhead}>Bias in AI-Assisted Assessment</h3>
    <p style={styles.body}>Gin et al. demonstrated that LLMs can reproduce human-like biases in assessment language. AI scoring tools may systematically score differently based on writing style, linguistic patterns, or cultural expression norms. This has particular implications for learners from underrepresented backgrounds whose communication styles may differ from the training data majority.</p>
    <p style={styles.body}><strong>Mandatory safeguards:</strong> Before deploying any AI assessment tool, conduct a bias audit across demographic groups. Compare AI scores to human scores stratified by gender, race/ethnicity, and English language learner status. If significant disparities exist, the tool is not ready for deployment.</p>
    <RedFlag title="Bias amplification" text="AI assessment tools may amplify existing biases in evaluation data. If training evaluations contain biased language, the AI learns and reproduces these biases at scale. A biased tool deployed across an entire program creates systematic unfairness that is harder to detect than individual evaluator bias." />
    <FormativeCheck questions={[
      { question: "Before deploying an AI scoring tool for free-response assessments, the most critical step is:",
        options: [
          "Ensuring the tool produces scores faster than human raters",
          "Conducting a bias audit comparing AI scores to human scores across demographic groups",
          "Checking that the tool's user interface is intuitive",
          "Verifying the vendor's marketing claims about accuracy"
        ],
        correct: 1,
        explanation: "Speed and interface quality are secondary to fairness. A bias audit is essential because AI scoring tools may systematically score differently based on writing style, linguistic patterns, or cultural expression norms that correlate with demographic characteristics."
      }
    ]} />
  </>);
}

function EduModule5() {
  return (<>
    <h3 style={{ color: "#22863A", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Design classroom activities that teach AI fluency through guided exploration</li>
      <li>Create structured prompt engineering exercises for different learner levels</li>
      <li>Model appropriate AI use in your own teaching practice</li>
    </ul>
    <h3 style={styles.subhead}>Active Learning: Guided Exploration Over Lecture</h3>
    <p style={styles.body}>AI fluency cannot be taught through didactics alone. The most effective approach is guided exploration: give students a clinical scenario, an AI tool, and structured questions. Let them discover the limitations themselves. This builds critical evaluation skills that transfer to new tools as they emerge.</p>
    <h3 style={styles.subhead}>Structured Exercises by Learner Level</h3>
    <div style={{ border: "1px solid #334155", borderRadius: 8, overflow: "hidden", margin: "1rem 0" }}>
      {[
        { level: "Preclinical (M1-M2)", exercise: "Compare LLM explanations of a disease mechanism to textbook content. Identify discrepancies. Discuss: why might the LLM produce a different explanation?", skill: "Recognizing that LLM output is not equivalent to verified knowledge", color: "#22c55e" },
        { level: "Clerkship (M3-M4)", exercise: "Use an AI tool for differential diagnosis on a standardized case. Compare to the attending's assessment. Identify what the AI missed and hypothesize why.", skill: "Evaluating AI clinical reasoning against expert judgment", color: "#f59e0b" },
        { level: "Residency", exercise: "Evaluate a clinical AI vendor's claims using the four-dimension framework (accuracy, hallucination rate, reproducibility, calibration). Draft an entrustment recommendation.", skill: "Institutional AI governance and decision-making", color: "#ef4444" },
      ].map((l, i) => (
        <div key={i} style={{ padding: "1rem", borderBottom: i < 2 ? "1px solid #334155" : "none", borderLeft: `4px solid ${l.color}` }}>
          <div style={{ color: l.color, fontWeight: 600, fontSize: 14 }}>{l.level}</div>
          <div style={{ color: "#e2e8f0", fontSize: 13, margin: "6px 0" }}>{l.exercise}</div>
          <div style={{ color: "#94a3b8", fontSize: 12 }}>Skill developed: {l.skill}</div>
        </div>
      ))}
    </div>
    <h3 style={styles.subhead}>The AI Red Team Exercise</h3>
    <p style={styles.body}><strong>High-engagement classroom activity:</strong> Divide students into two teams. Team A generates clinical advice using an AI tool. Team B has 10 minutes to find errors, fabricated citations, hallucinations, or unsafe recommendations. Teams switch roles. The team that finds the most verified errors wins.</p>
    <p style={styles.body}>This adversarial approach builds deep evaluation skills, is highly engaging, and teaches students that AI output must always be verified — through direct experience rather than instruction.</p>
    <h3 style={styles.subhead}>Faculty Modeling</h3>
    <p style={styles.body}>When you use AI to prepare lectures, disclose this to students. Model the verification process: show them how you checked AI-generated content against primary sources, what you found to be correct, and what you had to correct. This normalizes responsible use while demonstrating critical evaluation in action.</p>
    <FormativeCheck questions={[
      { question: "The AI Red Team exercise is effective because:",
        options: [
          "It teaches students to trust AI output",
          "Competition makes learning fun",
          "Students learn through direct experience that AI output must be verified, which builds transferable critical evaluation skills",
          "It demonstrates that AI is unreliable and should not be used"
        ],
        correct: 2,
        explanation: "The Red Team exercise builds critical evaluation skills through direct experience. Students do not just hear that AI can hallucinate — they find the hallucinations themselves. This experiential learning transfers to new tools and contexts better than didactic instruction about AI limitations."
      }
    ]} />
  </>);
}

function EduModule6() {
  return (<>
    <h3 style={{ color: "#22863A", marginBottom: 8 }}>Learning Objectives</h3>
    <ul style={styles.list}>
      <li>Design a 3-year AI integration roadmap aligned with IACAI vision and AAMC principles</li>
      <li>Address the equal access challenge for learner AI tool access</li>
      <li>Develop an AI faculty development program that builds institutional capacity</li>
    </ul>
    <h3 style={styles.subhead}>Three-Year Institutional Roadmap</h3>
    <div style={{ border: "1px solid #334155", borderRadius: 8, overflow: "hidden", margin: "1rem 0" }}>
      {[
        { year: "Year 1: Foundation", priorities: ["Establish AI governance committee with cross-stakeholder representation", "Draft and approve appropriate use policy and data governance framework", "Launch faculty development program (introductory AI literacy for all faculty)", "Integrate foundational AI concepts into required curriculum (ethics, basic concepts, limitations)"], color: "#22c55e" },
        { year: "Year 2: Integration", priorities: ["Provide secure, institutionally-managed AI tool access for all learners", "Develop domain-specific AI curriculum (AI in clinical reasoning, AI in research methods)", "Begin assessment integration with appropriate entrustment levels and bias auditing", "Establish monitoring and evaluation metrics"], color: "#f59e0b" },
        { year: "Year 3: Advancement", priorities: ["Evaluate curriculum effectiveness with student outcome data", "Expand to advanced applications (AI for clinical simulation, personalized learning)", "Share institutional case studies with the medical education community (IACAI macro level)", "Review and update governance policies based on two years of implementation data"], color: "#2A7AE8" },
      ].map((y, i) => (
        <div key={i} style={{ padding: "1.25rem", borderBottom: i < 2 ? "1px solid #334155" : "none", borderLeft: `4px solid ${y.color}` }}>
          <div style={{ color: y.color, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{y.year}</div>
          {y.priorities.map((p, j) => (
            <div key={j} style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.6, paddingLeft: 16, position: "relative", marginBottom: 4 }}>
              <span style={{ position: "absolute", left: 0, color: y.color }}>•</span>{p}
            </div>
          ))}
        </div>
      ))}
    </div>
    <h3 style={styles.subhead}>The Equal Access Imperative</h3>
    <p style={styles.body}>The AAMC's 2025 Principles for Responsible AI Use emphasize equal access. With only 30% of surveyed schools providing secure AI tool access, most learners use personal accounts without institutional oversight. This creates two gaps:</p>
    <ul style={styles.list}>
      <li><strong>Equity gap:</strong> Students who can afford premium AI tool subscriptions have advantages over those who cannot.</li>
      <li><strong>Governance gap:</strong> Personal accounts are not covered by institutional policies, BAAs, or usage monitoring.</li>
    </ul>
    <p style={styles.body}>Addressing this requires institutional procurement of AI tools with appropriate licensing, security, and compliance coverage — similar to how institutions provide access to clinical databases, learning management systems, and simulation equipment.</p>
    <h3 style={styles.subhead}>Capstone: Strategic Planning Exercise</h3>
    <p style={styles.body}>Using the IACAI 12-domain framework and the RACI matrix (Table 2), draft a 1-page institutional AI integration plan. For each year, identify:</p>
    <ol style={{ ...styles.list, listStyleType: "decimal" }}>
      <li>Top 3 priorities with measurable outcomes</li>
      <li>Stakeholders responsible (Responsible, Accountable, Consulted, Informed)</li>
      <li>Metrics for measuring progress</li>
      <li>Budget implications and resource requirements</li>
    </ol>
    <p style={styles.body}><strong>The strategic move:</strong> Presenting a structured, evidence-based plan grounded in national frameworks (AAMC, IACAI, EPA) positions you as an institutional leader in AI integration. This document becomes your roadmap and your credibility.</p>
    <RedFlag title="Curriculum without governance" text="Building AI curriculum without first establishing governance creates institutional risk. Students using AI tools without policies, faculty teaching AI without training, and assessment committees adopting AI without bias auditing — all create liability. Governance first, then curriculum." />
    <FormativeCheck questions={[
      { question: "The AAMC's 2025 principles emphasize equal access to AI tools because:",
        options: [
          "AI tools are expensive and institutions should save money",
          "Students using personal accounts creates both an equity gap (differential access) and a governance gap (no institutional oversight)",
          "All students should use the same AI tool for standardization",
          "Personal AI accounts are technically inferior to institutional accounts"
        ],
        correct: 1,
        explanation: "When students use personal AI accounts, wealthier students have access to premium tools while others do not (equity gap), and all usage occurs outside institutional policies, BAA coverage, and monitoring (governance gap). Institutional procurement addresses both problems."
      }
    ]} />
  </>);
}

// ============================================================
// MODULE REGISTRY (COMPLETE - ALL 21 MODULES)
// ============================================================
const MODULE_DATA = {
  clinician: [
    { num: 1, title: "What Happens When You Type a Prompt", duration: "12 min", Component: ClinModule1 },
    { num: 2, title: "Embeddings, Latent Space & Clinical Conflation", duration: "15 min", Component: ClinModule2 },
    { num: 3, title: "Hallucination: Why LLMs Generate False Information", duration: "15 min", Component: ClinModule3 },
    { num: 4, title: "Reproducibility: Same Prompt, Different Answers", duration: "12 min", Component: ClinModule4 },
    { num: 5, title: "Diagnostic Accuracy: How to Test an AI Tool", duration: "15 min", Component: ClinModule5 },
    { num: 6, title: "Prompt Engineering for Clinical Practice", duration: "15 min", Component: ClinModule6 },
    { num: 7, title: "Architecture Comparison: GPT, Claude & Medical Models", duration: "12 min", Component: ClinModule7 },
    { num: 8, title: "Clinical AI Evaluation Framework: Putting It Together", duration: "15 min", Component: ClinModule8 },
  ],
  researcher: [
    { num: 1, title: "The Transformer Architecture: Inside an LLM", duration: "15 min", Component: ResModule1 },
    { num: 2, title: "Embeddings & Latent Space: How Meaning Is Encoded", duration: "15 min", Component: ResModule2 },
    { num: 3, title: "Hallucination in Research: Citations, Mechanisms & Ghost Data", duration: "15 min", Component: ResModule3 },
    { num: 4, title: "Using AI Responsibly in Your Research Workflow", duration: "12 min", Component: ResModule4 },
    { num: 5, title: "AI-Generated Code: Validation & Subtle Bugs", duration: "15 min", Component: ResModule5 },
    { num: 6, title: "Bias in AI: Training Data, Algorithms & Research Impact", duration: "15 min", Component: ResModule6 },
    { num: 7, title: "The Future: RAG, Multimodal & Agent Systems", duration: "12 min", Component: ResModule7 },
  ],
  educator: [
    { num: 1, title: "The Landscape: Where Medical Education Stands on AI", duration: "12 min", Component: EduModule1 },
    { num: 2, title: "Teaching AI Fluency: What Learners Actually Need", duration: "15 min", Component: EduModule2 },
    { num: 3, title: "Governance: Building AI Policy for Your Institution", duration: "15 min", Component: EduModule3 },
    { num: 4, title: "AI for Assessment: Entrustment Framework", duration: "15 min", Component: EduModule4 },
    { num: 5, title: "Teaching with AI: Pedagogical Strategies", duration: "12 min", Component: EduModule5 },
    { num: 6, title: "Strategic Planning: Building an AI-Ready Institution", duration: "15 min", Component: EduModule6 },
  ],
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  body: { color: "#cbd5e1", fontSize: 15, lineHeight: 1.8, marginBottom: 12 },
  subhead: { color: "#e2e8f0", fontSize: 17, fontWeight: 600, marginTop: 24, marginBottom: 8 },
  list: { color: "#cbd5e1", fontSize: 14, lineHeight: 1.8, marginLeft: 20, marginBottom: 12 },
  promptBox: { background: "#1e293b", borderRadius: 8, padding: "1rem 1.25rem", margin: "0.75rem 0", borderLeft: "3px solid #f59e0b" },
};

// ============================================================
// MAIN APP
// ============================================================
function MedAIMicromodules() {
  const [activeTrack, setActiveTrack] = useState("clinician");
  const [activeModule, setActiveModule] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const contentRef = useRef(null);

  const modules = MODULE_DATA[activeTrack];
  const current = modules[activeModule];
  const trackInfo = TRACKS.find(t => t.id === activeTrack);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTo(0, 0);
  }, [activeTrack, activeModule]);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0f172a", color: "#e2e8f0", fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: "hidden" }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <div style={{ width: 320, minWidth: 320, background: "#1e293b", borderRight: "1px solid #334155", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "1.25rem", borderBottom: "1px solid #334155" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#00d9ff", marginBottom: 4 }}>MedAI Micromodules</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Interactive AI Fluency Curriculum</div>
          </div>

          {/* Track selector */}
          <div style={{ padding: "0.75rem", display: "flex", gap: 4 }}>
            {TRACKS.map(t => (
              <button key={t.id} onClick={() => { setActiveTrack(t.id); setActiveModule(0); }}
                style={{ flex: 1, padding: "8px 4px", borderRadius: 6, border: activeTrack === t.id ? `2px solid ${t.color}` : "1px solid #334155",
                  background: activeTrack === t.id ? t.color + "20" : "transparent",
                  color: activeTrack === t.id ? t.color : "#94a3b8", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Module list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
            {modules.map((m, i) => (
              <button key={i} onClick={() => setActiveModule(i)}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", marginBottom: 4,
                  borderRadius: 6, border: "none", cursor: "pointer",
                  background: activeModule === i ? trackInfo.color + "20" : "transparent",
                  color: activeModule === i ? "#e2e8f0" : "#94a3b8", fontSize: 13, lineHeight: 1.4 }}>
                <span style={{ color: trackInfo.color, fontWeight: 600, marginRight: 8 }}>{m.num}.</span>
                {m.title}
                <span style={{ display: "block", fontSize: 11, color: "#64748b", marginTop: 2 }}>{m.duration}</span>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid #334155", fontSize: 11, color: "#475569" }}>
            Part of the <span style={{ color: "#00d9ff" }}>Interactive MedAI Lexicon</span>
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ padding: "0.75rem 1.5rem", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1e293b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: "transparent", border: "1px solid #334155", borderRadius: 4, padding: "4px 8px", color: "#94a3b8", cursor: "pointer", fontSize: 16 }}>
              {sidebarOpen ? "◀" : "▶"}
            </button>
            <div>
              <span style={{ color: trackInfo.color, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                {trackInfo.label} Track
              </span>
              <span style={{ color: "#475569", margin: "0 8px" }}>|</span>
              <span style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 500 }}>Module {current.num}: {current.title}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setActiveModule(Math.max(0, activeModule - 1))}
              disabled={activeModule === 0}
              style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #334155", background: "transparent",
                color: activeModule === 0 ? "#334155" : "#94a3b8", cursor: activeModule === 0 ? "default" : "pointer", fontSize: 13 }}>
              ← Previous
            </button>
            <button onClick={() => setActiveModule(Math.min(modules.length - 1, activeModule + 1))}
              disabled={activeModule === modules.length - 1}
              style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${trackInfo.color}`, background: "transparent",
                color: activeModule === modules.length - 1 ? "#334155" : trackInfo.color,
                cursor: activeModule === modules.length - 1 ? "default" : "pointer", fontSize: 13 }}>
              Next →
            </button>
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: "2rem 2.5rem", maxWidth: 900 }}>
          <div style={{ marginBottom: 16 }}>
            <span style={{ background: trackInfo.color + "30", color: trackInfo.color, padding: "4px 12px",
              borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              {current.duration}
            </span>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: "#e2e8f0", marginBottom: 24, lineHeight: 1.3 }}>
            {current.title}
          </h2>
          <current.Component />

          {/* Navigation footer */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid #334155" }}>
            {activeModule > 0 ? (
              <button onClick={() => setActiveModule(activeModule - 1)}
                style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #334155", background: "transparent",
                  color: "#94a3b8", cursor: "pointer", fontSize: 14 }}>
                ← {modules[activeModule - 1].title}
              </button>
            ) : <div />}
            {activeModule < modules.length - 1 && (
              <button onClick={() => setActiveModule(activeModule + 1)}
                style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${trackInfo.color}`, background: trackInfo.color + "15",
                  color: trackInfo.color, cursor: "pointer", fontSize: 14 }}>
                {modules[activeModule + 1].title} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// mount
ReactDOM.createRoot(document.getElementById("root")).render(<MedAIMicromodules/>);
