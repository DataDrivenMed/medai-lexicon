const { useState, useEffect, useRef, useCallback } = React;

const T = {
  bg:"#0E0E0F",surface:"#161618",surfaceHi:"#1E1E21",border:"#2A2A2E",borderHi:"#3A3A3F",
  ink:"#F5F4F0",inkSub:"#A8A6A0",inkMuted:"#6B6966",accent:"#E8E4DC",
  pill:"#27251E",pillText:"#F5F4F0",warn:"#7C2D12",warnBg:"#1C0A06",warnText:"#FCA5A5",
  ok:"#14532D",okBg:"#052010",okText:"#86EFAC",formula:"#1A1A2E",formulaAccent:"#8EB8F5",
};
const S = {
  body:{color:T.inkSub,fontSize:15,lineHeight:1.7,marginBottom:14,fontWeight:400},
  subhead:{color:T.ink,fontSize:16,fontWeight:500,marginTop:28,marginBottom:10,letterSpacing:"-0.01em"},
  list:{color:T.inkSub,fontSize:14,lineHeight:1.8,marginLeft:20,marginBottom:12},
  label:{color:T.inkMuted,fontSize:11,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6},
  card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:16,marginBottom:12},
  promptWeak:{background:T.warnBg,borderLeft:"3px solid #7C2D12",borderRadius:"0 8px 8px 0",padding:"12px 16px",margin:"8px 0"},
  promptOk:{background:"#1C1400",borderLeft:"3px solid #854D0E",borderRadius:"0 8px 8px 0",padding:"12px 16px",margin:"8px 0"},
  promptGood:{background:T.okBg,borderLeft:"3px solid #14532D",borderRadius:"0 8px 8px 0",padding:"12px 16px",margin:"8px 0"},
};

function TempCallout({context}){
  return(
    <div style={{background:"#1A1610",border:"1px solid #3D3520",borderRadius:12,padding:"12px 16px",margin:"12px 0",display:"flex",gap:12,alignItems:"flex-start"}}>
      <span style={{fontSize:18,flexShrink:0}}>&#127777;</span>
      <div>
        <div style={{color:"#D4A853",fontSize:12,fontWeight:500,marginBottom:4}}>TEMPERATURE -- PLAIN LANGUAGE</div>
        <div style={{color:T.inkSub,fontSize:13,lineHeight:1.6}}>
          <strong style={{color:T.ink}}>Temperature</strong> is a dial that controls how adventurous the model is when choosing its next word. Set it <strong style={{color:T.ink}}>low (0.1-0.4)</strong> and the model always picks the safest, most expected word -- outputs are consistent but can feel repetitive. Set it <strong style={{color:T.ink}}>high (1.2-2.0)</strong> and the model takes risks, choosing surprising words -- outputs are creative but often incoherent. Most clinical applications run at <strong style={{color:T.ink}}>0.7-1.0</strong>, balancing coherence with some variation.
          {context&&<span> {context}</span>}
        </div>
      </div>
    </div>
  );
}

function RedFlag({title,text}){
  return(
    <div style={{background:T.warnBg,border:`1px solid ${T.warn}30`,borderRadius:12,padding:"12px 16px",margin:"10px 0"}}>
      <div style={{color:T.warnText,fontSize:12,fontWeight:500,marginBottom:4}}>&#128681; {title.toUpperCase()}</div>
      <div style={{color:"#E5C9C9",fontSize:13,lineHeight:1.65}}>{text}</div>
    </div>
  );
}

function GoodPractice({title,text}){
  return(
    <div style={{background:T.okBg,border:`1px solid ${T.ok}40`,borderRadius:12,padding:"12px 16px",margin:"10px 0"}}>
      <div style={{color:T.okText,fontSize:12,fontWeight:500,marginBottom:4}}>&#10003; {title.toUpperCase()}</div>
      <div style={{color:"#C9E5D4",fontSize:13,lineHeight:1.65}}>{text}</div>
    </div>
  );
}

function Callout({icon="&#128161;",label,children,color="#1A1A2E",accent}){
  const a=accent||T.formulaAccent;
  return(
    <div style={{background:color,border:`1px solid ${a}25`,borderRadius:12,padding:"12px 16px",margin:"10px 0"}}>
      <div style={{color:a,fontSize:12,fontWeight:500,marginBottom:4}}>{icon} {label}</div>
      <div style={{color:T.inkSub,fontSize:13,lineHeight:1.65}}>{children}</div>
    </div>
  );
}

function FormulaBlock({children}){
  return(
    <div style={{background:T.formula,border:`1px solid ${T.formulaAccent}30`,borderRadius:8,padding:"12px 16px",margin:"10px 0",fontFamily:"'DM Mono','Courier New',monospace",fontSize:13,color:T.formulaAccent,lineHeight:1.7,whiteSpace:"pre-wrap",overflowX:"auto"}}>
      {children}
    </div>
  );
}

function Collapsible({title,children,accent}){
  const [open,setOpen]=useState(false);
  const a=accent||T.formulaAccent;
  return(
    <div style={{border:`1px solid ${T.border}`,borderRadius:8,marginBottom:8,overflow:"hidden"}}>
      <button onClick={()=>setOpen(!open)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"transparent",border:"none",color:a,fontSize:13,fontWeight:500,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
        <span>{title}</span>
        <span style={{transform:open?"rotate(180deg)":"rotate(0deg)",transition:"0.25s",fontSize:11}}>&#9660;</span>
      </button>
      {open&&<div style={{padding:"0 14px 14px",color:T.inkSub,fontSize:13,lineHeight:1.7,borderTop:`1px solid ${T.border}`}}>{children}</div>}
    </div>
  );
}

function TemperatureSimulation(){
  const [temp,setTemp]=useState(1.0);
  const cvRef=useRef(null);
  const draw=useCallback(()=>{
    const cv=cvRef.current;if(!cv)return;
    const ctx=cv.getContext("2d"),w=cv.width,h=cv.height,pad=48;
    ctx.clearRect(0,0,w,h);ctx.fillStyle=T.formula;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle=T.border;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(pad,h-pad);ctx.lineTo(w-pad,h-pad);ctx.stroke();
    ctx.beginPath();ctx.moveTo(pad,pad);ctx.lineTo(pad,h-pad);ctx.stroke();
    const logits=Array.from({length:28},(_,i)=>Math.exp(-Math.pow(i-12,2)/(2*Math.pow(4.5,2))));
    const scaled=logits.map(l=>l/temp);
    const expSum=scaled.reduce((a,b)=>a+Math.exp(b),0);
    const probs=scaled.map(l=>Math.exp(l)/expSum);
    const maxP=Math.max(...probs);
    const bW=(w-2*pad)/logits.length;
    probs.forEach((p,i)=>{
      const bH=(p/maxP)*(h-2*pad);
      const alpha=0.35+0.65*(p/maxP);
      ctx.fillStyle=`rgba(142,184,245,${alpha})`;
      ctx.fillRect(pad+i*bW+1,h-pad-bH,bW-2,bH);
    });
    ctx.fillStyle=T.inkMuted;ctx.font="12px Inter,system-ui";ctx.textAlign="center";
    ctx.fillText("Token vocabulary (50,000+ choices)",w/2,h-10);
    const shape=temp<0.5?"Sharp peak -- model nearly always picks the safest word":temp<1.2?"Balanced -- some variety while staying on-topic":"Flat -- model picks adventurously, can become incoherent";
    ctx.fillStyle=T.formulaAccent;ctx.font="500 13px Inter,system-ui";
    ctx.fillText("T = "+temp.toFixed(1)+" -- "+shape,w/2,24);
  },[temp]);
  useEffect(()=>{draw();},[draw]);
  return(
    <div style={{...S.card,padding:16}}>
      <TempCallout context="Drag the slider to see how temperature changes which words the model considers." />
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12,marginTop:8}}>
        <span style={{...S.label,marginBottom:0,minWidth:100}}>Temperature</span>
        <input type="range" min="0.1" max="2.5" step="0.1" value={temp}
          onChange={e=>setTemp(parseFloat(e.target.value))}
          style={{flex:1,accentColor:T.formulaAccent}}/>
        <span style={{color:T.formulaAccent,fontWeight:500,fontSize:15,minWidth:36}}>{temp.toFixed(1)}</span>
      </div>
      <canvas ref={cvRef} width={600} height={220} style={{width:"100%",height:"auto",borderRadius:8}}/>
    </div>
  );
}

function LatentSpaceViz(){
  const cvRef=useRef(null);
  useEffect(()=>{
    const cv=cvRef.current;if(!cv)return;
    const ctx=cv.getContext("2d"),w=cv.width,h=cv.height;
    ctx.clearRect(0,0,w,h);ctx.fillStyle=T.formula;ctx.fillRect(0,0,w,h);
    const clusters=[
      {x:180,y:140,c:"#8EB8F5",label:"Clinical descriptions"},
      {x:420,y:120,c:"#A8D5A2",label:"Research methodology"},
      {x:300,y:300,c:"#D4A4C8",label:"General explanations"},
    ];
    clusters.forEach(cl=>{
      ctx.fillStyle=cl.c+"18";ctx.beginPath();ctx.arc(cl.x,cl.y,80,0,Math.PI*2);ctx.fill();
      for(let i=0;i<12;i++){
        const a=(i/12)*Math.PI*2,r=50+(i%3)*15;
        ctx.fillStyle=cl.c+"CC";
        ctx.fillRect(cl.x+Math.cos(a)*r-3,cl.y+Math.sin(a)*r-3,6,6);
      }
      ctx.fillStyle=cl.c;ctx.font="500 12px Inter,system-ui";ctx.textAlign="center";
      ctx.fillText(cl.label,cl.x,cl.y+115);
    });
    ctx.fillStyle=T.inkMuted;ctx.font="12px Inter,system-ui";ctx.textAlign="left";
    ctx.fillText("Each square = one possible response -- Distance = semantic difference",20,28);
  },[]);
  return(<div style={S.card}><canvas ref={cvRef} width={600} height={380} style={{width:"100%",height:"auto",borderRadius:8}}/></div>);
}

function ModelComparison({scenarios}){
  const [sel,setSel]=useState(0);
  const [apiKey,setApiKey]=useState("");
  const [liveA,setLiveA]=useState(null);
  const [liveB,setLiveB]=useState(null);
  const [loading,setLoading]=useState(false);
  const sc=scenarios[sel];
  async function fetchLive(){
    if(!apiKey)return;setLoading(true);
    try{
      const f=async(sys)=>{
        const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",
          headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01"},
          body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:300,system:sys,
            messages:[{role:"user",content:sc.prompt}]})});
        const d=await r.json();return d.content?.[0]?.text||"Error";
      };
      const[a,b]=await Promise.all([f(sc.systemA),f(sc.systemB)]);
      setLiveA(a);setLiveB(b);
    }catch(e){setLiveA("API error: "+e.message);setLiveB("API error");}
    setLoading(false);
  }
  return(
    <div style={S.card}>
      {scenarios.length>1&&(
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
          {scenarios.map((s,i)=>(
            <button key={i} onClick={()=>{setSel(i);setLiveA(null);setLiveB(null);}}
              style={{padding:"4px 14px",borderRadius:9999,border:`1px solid ${sel===i?T.borderHi:T.border}`,
                background:sel===i?T.surfaceHi:"transparent",color:sel===i?T.ink:T.inkMuted,
                cursor:"pointer",fontSize:12,fontWeight:500,fontFamily:"inherit"}}>
              {s.label}
            </button>
          ))}
        </div>
      )}
      <div style={{background:T.surfaceHi,borderRadius:8,padding:"10px 14px",marginBottom:12,borderLeft:`2px solid ${T.borderHi}`}}>
        <div style={S.label}>Prompt</div>
        <div style={{color:T.ink,fontSize:14,lineHeight:1.6}}>{sc.prompt}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[{id:"A",title:sc.titleA,arch:sc.archA,response:liveA||sc.responseA},{id:"B",title:sc.titleB,arch:sc.archB,response:liveB||sc.responseB}].map(m=>(
          <div key={m.id} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:12,padding:14}}>
            <div style={{marginBottom:8}}>
              <div style={{color:T.ink,fontSize:13,fontWeight:500}}>Model {m.id}</div>
              <div style={{color:T.inkMuted,fontSize:11}}>{m.arch}</div>
            </div>
            <div style={{color:T.inkSub,fontSize:13,lineHeight:1.65,fontStyle:"italic",background:T.surfaceHi,borderRadius:8,padding:"10px 12px",minHeight:80}}>
              {loading?"Fetching...":m.response}
            </div>
          </div>
        ))}
      </div>
      <div style={{background:T.surfaceHi,borderRadius:8,padding:"10px 14px",marginTop:12}}>
        <div style={{color:"#D4A853",fontSize:11,fontWeight:500,marginBottom:4}}>WHAT TO OBSERVE</div>
        <div style={{color:T.inkSub,fontSize:13,lineHeight:1.6}}>{sc.observation}</div>
      </div>
      <details style={{marginTop:10}}>
        <summary style={{color:T.inkMuted,fontSize:12,cursor:"pointer",userSelect:"none"}}>Educator option: use live API with different system prompts</summary>
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <input type="password" placeholder="Anthropic API key" value={apiKey} onChange={e=>setApiKey(e.target.value)}
            style={{flex:1,padding:"6px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.surfaceHi,color:T.ink,fontSize:13,fontFamily:"inherit"}}/>
          <button onClick={fetchLive} style={{padding:"6px 16px",borderRadius:9999,border:`1px solid ${T.borderHi}`,background:T.pill,color:T.pillText,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>Run Live</button>
        </div>
        <div style={{color:T.inkMuted,fontSize:11,marginTop:4}}>Your key is used client-side only and never stored.</div>
      </details>
    </div>
  );
}

function FormativeCheck({questions}){
  const [answers,setAnswers]=useState({});
  const [revealed,setRevealed]=useState({});
  return(
    <div style={{border:`1px solid ${T.border}`,borderRadius:16,padding:16,marginTop:24}}>
      <div style={{color:T.inkMuted,fontSize:11,fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14}}>
        Knowledge Check -- Formative only, no scores recorded
      </div>
      {questions.map((q,qi)=>(
        <div key={qi} style={{marginBottom:20}}>
          <div style={{color:T.ink,fontSize:14,lineHeight:1.6,marginBottom:10,fontWeight:500}}>{qi+1}. {q.question}</div>
          {q.options.map((opt,oi)=>{
            const picked=answers[qi]===oi,shown=revealed[qi],isCorrect=oi===q.correct;
            return(
              <button key={oi} onClick={()=>{setAnswers({...answers,[qi]:oi});setRevealed({...revealed,[qi]:true});}}
                style={{display:"block",width:"100%",textAlign:"left",padding:"8px 14px",marginBottom:4,borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit",lineHeight:1.5,
                  border:shown?(isCorrect?"1px solid #14532D":picked?`1px solid ${T.warn}`:`1px solid ${T.border}`):picked?`1px solid ${T.borderHi}`:`1px solid ${T.border}`,
                  background:shown?(isCorrect?T.okBg:picked?T.warnBg:"transparent"):"transparent",
                  color:shown?(isCorrect?T.okText:picked?T.warnText:T.inkMuted):T.inkSub}}>
                {opt}
              </button>
            );
          })}
          {revealed[qi]&&(
            <div style={{marginTop:8,padding:"10px 14px",borderRadius:8,fontSize:13,lineHeight:1.65,
              background:answers[qi]===q.correct?T.okBg:T.warnBg,
              borderLeft:`3px solid ${answers[qi]===q.correct?"#14532D":T.warn}`,
              color:answers[qi]===q.correct?T.okText:T.warnText}}>
              {q.explanation}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function VerifiedBadge({date="May 2026"}){
  return(
    <div style={{display:"inline-flex",alignItems:"center",gap:6,background:T.surfaceHi,border:`1px solid ${T.border}`,borderRadius:9999,padding:"3px 12px",marginBottom:16}}>
      <span style={{color:T.okText,fontSize:11}}>&#9679;</span>
      <span style={{color:T.inkMuted,fontSize:11}}>Content verified {date}</span>
    </div>
  );
}

// TRACK 1 MODULES
function T1M1(){
  return(<>
    <VerifiedBadge/>
    <h3 style={S.subhead}>What actually happens when someone types a prompt?</h3>
    <p style={S.body}>Most people assume an LLM works like a search engine -- you ask a question, it finds the answer. This is not what happens. When a user submits a prompt, the model does one thing repeatedly: it predicts the single most likely next word (technically, the next "token") given everything written so far. It commits to that word, adds it to the sequence, then predicts the next word again. There is no lookup, no retrieval, no reasoning in the human sense.</p>
    <h3 style={S.subhead}>Tokens: the units the model actually sees</h3>
    <p style={S.body}>The model does not read words -- it reads <strong style={{color:T.ink}}>tokens</strong>. A token is a chunk of text: sometimes a whole word, sometimes part of a word, sometimes punctuation. "Pneumonia" might be one token; "diastolic" might be split into "dia" and "stolic". GPT-scale models have vocabularies of approximately 50,000 tokens.</p>
    <Callout label="Why tokens matter clinically" color="#1A1A12" accent="#D4A853">
      Medical terminology is often split into subword tokens the model has seen infrequently. This contributes to why models sometimes handle rare medical terms less reliably than common ones -- the tokens themselves appear less often in training data.
    </Callout>
    <h3 style={S.subhead}>The probability distribution: choosing the next word</h3>
    <p style={S.body}>At each step, the model computes a probability for every token in its vocabulary. "Fever" might have 12% probability, "infection" 8%, "pain" 6%, with the remaining probability spread across tens of thousands of other tokens. The model then samples from this distribution.</p>
    <FormulaBlock>{"P(token_i) = exp(z_i) / \u03A3_j exp(z_j)\n\nThis is the softmax function. z_i is the raw score for each token.\nAll probabilities sum to 1.0 across all vocabulary tokens."}</FormulaBlock>
    <TempCallout context="Temperature controls this sampling step -- how the model picks from the probability distribution above."/>
    <TemperatureSimulation/>
    <h3 style={S.subhead}>Model A vs Model B: same prompt, different training objectives</h3>
    <ModelComparison scenarios={[{
      label:"Clinical question",
      prompt:"What is the first-line treatment for community-acquired pneumonia in a healthy 40-year-old?",
      titleA:"General-purpose (helpfulness-optimized)",archA:"Trained to always provide a direct, confident answer",
      titleB:"Caution-aligned (uncertainty-calibrated)",archB:"Trained to acknowledge uncertainty and recommend verification",
      systemA:"You are a helpful medical assistant. Always provide a direct, confident answer.",
      systemB:"You are a careful medical assistant. Always acknowledge uncertainty and recommend professional verification.",
      responseA:"For a healthy 40-year-old with community-acquired pneumonia, first-line treatment is amoxicillin 500mg three times daily for 5 days per IDSA guidelines. Azithromycin is an alternative if atypical pathogens are suspected.",
      responseB:"Based on IDSA/ATS guidelines, amoxicillin is generally first-line for outpatient CAP in low-risk patients. However, local resistance patterns and individual patient factors should guide the final decision. I would recommend confirming with the treating clinician.",
      observation:"Model A gives a specific dose and duration confidently. Model B provides the same core recommendation but adds appropriate caveats. In clinical contexts, Model B's epistemic humility is safer -- it acknowledges what LLMs genuinely cannot know about the specific patient in front of you."
    }]}/>
    <FormativeCheck questions={[
      {question:"When an LLM generates a response, it:",
        options:["Searches a medical database and formats the best match","Predicts the most probable next token, one at a time, based on statistical patterns in training data","Reasons through the clinical problem using logical inference","Retrieves and summarizes relevant web pages"],
        correct:1,explanation:"LLMs are autoregressive token predictors. They do not retrieve, search, or reason causally. Each token is independently sampled from a probability distribution conditioned on all previous tokens. This is why the same question can produce different answers across runs."},
      {question:"Why does temperature matter for clinical AI tools?",
        options:["Higher temperature makes models faster","It controls how consistently the model picks the most expected next word vs. exploring less likely alternatives","It determines how much medical training data the model accesses","It affects response length"],
        correct:1,explanation:"Temperature scales the probability distribution before sampling. Low temperature produces consistent, predictable output. High temperature produces more varied but less reliable output. For clinical decision support, lower temperature is generally preferable."}
    ]}/>
  </>);
}

function T1M2(){
  return(<>
    <VerifiedBadge/>
    <h3 style={S.subhead}>Embeddings: how the model stores meaning as numbers</h3>
    <p style={S.body}>To process text, the model converts tokens into vectors -- lists of hundreds or thousands of numbers. These are called embeddings. The crucial property: tokens that appear in similar contexts during training develop similar embeddings. "Metformin" and "glipizide" will have similar embeddings because they frequently appear alongside the same words: "diabetes," "blood glucose," "oral hypoglycemic."</p>
    <Collapsible title="The mathematics: why proximity means similarity">
      <p style={{marginBottom:8}}>Semantic similarity is measured by cosine similarity:</p>
      <FormulaBlock>{"cos(\u03B8) = (A \u00B7 B) / (||A|| \u00D7 ||B||)\n\nRanges from -1 (opposite) to 1 (identical context patterns)\nRelated medical terms typically score 0.5\u20130.9"}</FormulaBlock>
      <p style={{marginTop:8}}>The embedding matrix W_e has dimensions: vocabulary_size x embedding_dimension (768 to 12,288 for large models). Each token is a vector with hundreds to thousands of values.</p>
    </Collapsible>
    <h3 style={S.subhead}>Latent space: the geography of meaning</h3>
    <p style={S.body}>The space defined by all possible embedding vectors is called <strong style={{color:T.ink}}>latent space</strong>. Similar concepts cluster together. The visualization below is a simplified 2D projection -- real latent space has thousands of dimensions. Proximity reflects how often words appear in similar contexts, not their actual clinical or biological relationship.</p>
    <LatentSpaceViz/>
    <h3 style={S.subhead}>Why this matters for teaching</h3>
    <p style={S.body}>Because the model organizes knowledge by co-occurrence, it can conflate conditions that share vocabulary but differ clinically. Viral and bacterial pneumonia share many context words. Without a specific prompt forcing distinction, the model defaults to whichever pattern is most common in training data.</p>
    <ModelComparison scenarios={[{
      label:"Underspecified vs. specified prompt",
      prompt:"What is the treatment for pneumonia?",
      titleA:"Model A (underspecified prompt -- no type specified)",archA:"Default behavior when no distinction is forced",
      titleB:"Model B (same model, improved prompt: specify viral vs bacterial)",archB:"Same architecture, same model -- better prompt forces distinction",
      systemA:"You are a helpful medical assistant.",
      systemB:"You are a helpful medical assistant.",
      responseA:"Pneumonia treatment typically involves antibiotics such as amoxicillin or azithromycin. Supportive care including rest and hydration is also important. Severe cases may require hospitalization.",
      responseB:"Bacterial CAP: First-line is amoxicillin (outpatient) or beta-lactam plus macrolide (inpatient). Viral CAP (e.g. influenza): Antivirals if within treatment window -- oseltamivir within 48h for influenza; otherwise supportive care. The distinction matters because antibiotics are ineffective against viral infection.",
      observation:"Model A defaults to bacterial treatment (the most common pattern in training data) without distinguishing viral vs bacterial. Model B makes the critical distinction. Same model -- the prompt changed what probability space was sampled from. Teaching point: embedding proximity means the model defaults to the most common pattern when the prompt is underspecified."
    }]}/>
    <TempCallout context="At higher temperature, the underspecified pneumonia prompt produces even more variable answers because the model explores lower-probability tokens that span across viral and bacterial contexts."/>
    <FormativeCheck questions={[
      {question:"'Metformin' and 'glipizide' have similar embeddings primarily because:",
        options:["They are both white pills","They appear in similar contexts in training data (diabetes management, blood glucose control)","A human programmer assigned them similar codes","They have similar chemical structures"],
        correct:1,explanation:"Embeddings are learned entirely from co-occurrence statistics in training text, not from pharmacological or physical properties. The model has no access to drug structure information -- it only learns from which words appear together."}
    ]}/>
  </>);
}

function T1M3(){
  return(<>
    <VerifiedBadge/>
    <h3 style={S.subhead}>What is hallucination, technically?</h3>
    <p style={S.body}>Hallucination occurs when an LLM generates a token with high conditional probability -- the model is confident -- but the resulting sequence is factually incorrect. This is a <strong style={{color:T.ink}}>structural consequence</strong> of how LLMs are trained: they optimize for statistical likelihood given training data, not for factual accuracy. The model has no mechanism to verify claims against reality.</p>
    <h3 style={S.subhead}>Three root causes in medical contexts</h3>
    <div style={{display:"grid",gap:8,margin:"12px 0"}}>
      {[
        {n:"01",title:"No external grounding",desc:"LLMs generate from patterns learned during training. They have no live access to drug formularies, clinical guidelines, or research databases. Everything comes from statistical patterns -- which may be outdated, biased, or simply wrong."},
        {n:"02",title:"Frequency bias",desc:"Common patterns in training data are more likely to be reproduced. Outdated guidelines, retracted studies, or majority-population findings dominate over rare, recent, or population-specific information."},
        {n:"03",title:"Fabricated specificity",desc:"When asked for citations, dosages, or trial names, the model generates tokens that pattern-match to how citations and dosages look in training text -- even when the specific fact does not exist."},
      ].map(c=>(
        <div key={c.n} style={{display:"flex",gap:12,background:T.surfaceHi,borderRadius:12,padding:14,border:`1px solid ${T.border}`}}>
          <div style={{color:T.inkMuted,fontSize:22,fontWeight:400,minWidth:36,lineHeight:1}}>{c.n}</div>
          <div><div style={{color:T.ink,fontSize:14,fontWeight:500,marginBottom:4}}>{c.title}</div><div style={{color:T.inkSub,fontSize:13,lineHeight:1.6}}>{c.desc}</div></div>
        </div>
      ))}
    </div>
    <ModelComparison scenarios={[
      {label:"Citation request",
        prompt:"Cite three RCTs supporting dapagliflozin in heart failure with preserved ejection fraction.",
        titleA:"Model A (helpfulness-optimized)",archA:"Optimized to always produce a complete, useful-looking answer",
        titleB:"Model B (uncertainty-calibrated)",archB:"Calibrated to acknowledge limits of its knowledge",
        systemA:"Always provide complete, specific answers with citations when asked.",
        systemB:"Only cite sources you are confident exist. Acknowledge uncertainty explicitly.",
        responseA:"1. DELIVER Trial (Solomon et al., NEJM 2022): Dapagliflozin reduced CV death/worsening HF. 2. PRESERVED-HF (Nassif et al., Nature Medicine 2021): Improved KCCQ scores. 3. DETERMINE-Preserved (Singh et al., JAMA Cardiol 2023): Confirmed exercise capacity benefit.",
        responseB:"I can confirm the DELIVER trial (NEJM 2022) and PRESERVED-HF (Nature Medicine 2021) are real studies. I am less certain about additional trials -- I may generate plausible-sounding citations that do not exist. Verify any specific trial against PubMed before using.",
        observation:"DELIVER and PRESERVED-HF are real. Model A confidently lists a third trial that may be hallucinated. Model B flags its uncertainty. Teaching point: the confidence of the language is not correlated with the accuracy of the fact. Verify every citation independently."},
      {label:"Dosing question",
        prompt:"What is the exact dose of dapagliflozin for HFpEF?",
        titleA:"Model A (specific)",archA:"Gives precise answer regardless of certainty",
        titleB:"Model B (calibrated)",archB:"Distinguishes what it knows from what it is estimating",
        systemA:"Give precise, specific clinical answers.",
        systemB:"Acknowledge when you are uncertain about specific details.",
        responseA:"The recommended dose of dapagliflozin for HFpEF is 10mg once daily, taken with or without food.",
        responseB:"Dapagliflozin 10mg once daily is the dose used in the DELIVER trial and aligns with current prescribing information for HF indications. Confirm against current labeling -- dosing guidance evolves as indications expand.",
        observation:"Both give 10mg -- which is correct. But Model B adds a critical caveat: dosing guidance changes. Teaching point: the correct answer today may not be correct after guideline updates. Model A's response could mislead students into thinking all LLM dosing answers are equally reliable."}
    ]}/>
    <RedFlag title="Confident citation does not mean real citation" text="LLMs construct citations by pattern-matching to how citations look in training text. A plausible author name, journal, and year can be entirely fabricated. Always verify against PubMed or the original journal before using any LLM-generated citation."/>
    <GoodPractice title="Anti-hallucination prompt technique" text="Ask the model: 'Summarize the general evidence consensus on X without citing specific studies. Note where evidence is uncertain or limited.' Removing citation pressure eliminates the strongest hallucination incentive."/>
    <TempCallout context="Higher temperature increases hallucination risk: the model explores lower-probability tokens, which often means less well-attested facts. For clinical content, use the lowest temperature that still produces useful output."/>
    <FormativeCheck questions={[
      {question:"Hallucination in LLMs occurs because:",
        options:["The model intentionally produces false information","The model optimizes for statistical likelihood, not factual accuracy -- high-probability tokens can form incorrect sequences","The model's internet connection is unreliable","The user provided a poorly formatted prompt"],
        correct:1,explanation:"Hallucinations are a structural property of next-token prediction. The model generates what is statistically most likely given the context, with no ground-truth verification step. This is not an alignment failure or intentional deception."}
    ]}/>
  </>);
}

function T1M4(){
  return(<>
    <VerifiedBadge/>
    <h3 style={S.subhead}>Self-attention: how the model reads context</h3>
    <p style={S.body}>Each token in a transformer looks at every other token in the sequence and asks: how relevant is that token to understanding what I mean here? This mechanism is <strong style={{color:T.ink}}>self-attention</strong>. In the sentence "The patient received metformin but it was contraindicated due to their renal impairment," attention allows the model to connect "contraindicated" directly to "renal impairment" across the full sentence.</p>
    <FormulaBlock>{"Attention(Q, K, V) = softmax(Q \u00B7 K^T / \u221Ad_k) \u00B7 V\n\nQ = query vectors (what am I looking for?)\nK = key vectors (what do I represent?)\nV = value vectors (what information do I carry?)\n\nMultiple attention heads run in parallel, each learning\ndifferent relationship types (syntactic, semantic, referential)"}</FormulaBlock>
    <Callout label="For educators: the key limitation of attention" color="#0D1A0D" accent="#A8D5A2">
      Attention captures <em>statistical co-occurrence patterns</em>, not causal reasoning. The model learns that "metformin," "renal impairment," and "contraindicated" frequently co-occur in medical text -- so it attends to these tokens strongly. But it does not understand <em>why</em> metformin is contraindicated in renal impairment (lactic acidosis risk). This distinction is essential for teaching critical AI evaluation.
    </Callout>
    <h3 style={S.subhead}>Positional encoding: word order in a parallel processor</h3>
    <p style={S.body}>Transformers process all tokens simultaneously -- they have no inherent sense of sequence. To encode position, sinusoidal functions are added to each embedding, allowing the model to distinguish "drug treats disease" from "disease treats drug."</p>
    <FormulaBlock>{"PE(position, 2i) = sin(position / 10000^(2i/d))\nPE(position, 2i+1) = cos(position / 10000^(2i/d))"}</FormulaBlock>
    <h3 style={S.subhead}>Layers: from syntax to semantics</h3>
    <p style={S.body}>A token's representation changes as it passes through each transformer layer. Early layers encode surface patterns (syntax, word proximity). Later layers encode abstract semantics (meaning, relationships, clinical relevance). The final hidden state is projected to logit scores across all vocabulary tokens, then softmax produces the sampling distribution.</p>
    <TempCallout context="Temperature applies at the very end of this process -- after all attention calculations -- when the model is about to sample the next token from the final probability distribution."/>
    <FormativeCheck questions={[
      {question:"Self-attention allows a transformer to:",
        options:["Access external medical databases","Connect any token to any other token in the input sequence, regardless of distance","Remember conversations from previous sessions","Verify factual claims against ground truth"],
        correct:1,explanation:"Self-attention computes a weighted relationship between every token pair in the sequence simultaneously. This allows long-range connections (like 'contraindicated' to 'renal impairment') that sequential models struggled with. It does not give the model access to external information or enable causal reasoning."}
    ]}/>
  </>);
}

function T1M5(){
  return(<>
    <VerifiedBadge/>
    <h3 style={S.subhead}>Training: where the model's knowledge comes from</h3>
    <p style={S.body}>LLMs learn by reading enormous quantities of text and repeatedly doing one task: predict the next token. Through billions of these predictions, the model adjusts its internal weights. The knowledge encoded in a model is entirely determined by what text it was trained on -- its coverage, recency, and quality.</p>
    <h3 style={S.subhead}>What training data means for medical applications</h3>
    <p style={S.body}><strong style={{color:T.ink}}>Coverage bias:</strong> English-language, Western, high-publication-volume topics are over-represented. Rare diseases, non-English medical literature, and research from low- and middle-income countries are systematically under-represented.</p>
    <p style={S.body}><strong style={{color:T.ink}}>Temporal cutoff:</strong> Training data has a cutoff date. Guidelines updated after that date are unknown to the model. It may confidently reproduce outdated recommendations.</p>
    <p style={S.body}><strong style={{color:T.ink}}>Quality is not filtered:</strong> General-purpose models are trained on internet text including errors and misinformation. Medical misinformation present in training data can be reproduced with high confidence.</p>
    <h3 style={S.subhead}>Fine-tuning and RLHF</h3>
    <p style={S.body}><strong style={{color:T.ink}}>Reinforcement Learning from Human Feedback (RLHF):</strong> Human raters evaluate responses; a reward model learns these preferences; the LLM is trained to maximize this reward. This shapes whether a model prioritizes helpfulness, caution, or other properties -- with real consequences for clinical safety.</p>
    <Callout label="The helpfulness trap" color="#1C100A" accent="#FCA5A5">
      A model trained primarily to be helpful may hallucinate plausible information rather than express uncertainty, because "I don't know" scores poorly on helpfulness ratings. For clinical tools, a model that frequently says "I'm not certain" is safer than one that always provides a confident answer.
    </Callout>
    <ModelComparison scenarios={[{
      label:"Training objective comparison",
      prompt:"What is the evidence for using aspirin in primary prevention of cardiovascular disease?",
      titleA:"Helpfulness-optimized",archA:"RLHF objective: maximize user satisfaction with the response",
      titleB:"Uncertainty-calibrated",archB:"RLHF objective: maximize epistemic accuracy, acknowledge limits",
      systemA:"Be maximally helpful. Always provide complete clinical guidance.",
      systemB:"Be accurate above all. Express uncertainty where it exists. Do not overstate evidence.",
      responseA:"Aspirin is recommended for primary prevention in high-risk patients, particularly those over 40 with cardiovascular risk factors. A daily low-dose aspirin (81mg) reduces the risk of first heart attack by approximately 25% in this population.",
      responseB:"Evidence on aspirin for primary prevention shifted significantly after 2018. Major trials (ASPREE, ARRIVE, ASCEND) showed marginal or no net benefit in low-to-moderate risk populations. Current ACC/AHA guidelines have substantially narrowed the indication. The evidence landscape here changed considerably -- I would recommend checking current guidelines.",
      observation:"Model A reflects older pre-2018 consensus confidently. Model B reflects the current nuanced picture and flags that evidence evolved. Teaching point: training cutoffs and helpfulness optimization can cause a model to confidently teach outdated medicine."
    }]}/>
    <FormativeCheck questions={[
      {question:"A model trained with a helpfulness-optimized RLHF objective is potentially more dangerous in clinical settings because:",
        options:["It generates responses too slowly","It may hallucinate plausible information rather than express uncertainty, because 'I don't know' scores poorly on helpfulness ratings","It cannot process medical terminology","It uses too much computing power"],
        correct:1,explanation:"RLHF trains models to maximize a reward signal. If raters prefer confident, complete answers over honest uncertainty, the model learns to produce confident answers even when it should not. For clinical applications, epistemic calibration is more important than appearing maximally helpful."}
    ]}/>
  </>);
}

// TRACK 2 MODULES
function T2M1(){
  return(<>
    <VerifiedBadge/>
    <h3 style={S.subhead}>Why prompt structure determines output quality</h3>
    <p style={S.body}>A prompt is a constraint on the probability distribution the model samples from. Every additional piece of context narrows the space of plausible next tokens. Vague prompts leave enormous probability mass on responses that are technically plausible but clinically useless. Structured prompts concentrate probability on specific, actionable outputs.</p>
    <h3 style={S.subhead}>The five elements of a structured clinical prompt</h3>
    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",margin:"12px 0"}}>
      {[
        {n:"1",title:"Clinical context",ex:"Setting, urgency, available resources",why:"Narrows the model toward protocols relevant to your environment"},
        {n:"2",title:"Patient specifics",ex:"Age, sex, comorbidities, current medications",why:"Eliminates population-level answers in favor of patient-relevant ones"},
        {n:"3",title:"Precise question",ex:"Compare X and Y for Z indication, not tell me about X",why:"Forces comparative rather than encyclopedic output"},
        {n:"4",title:"Output format",ex:"Differential list, step-by-step reasoning, table",why:"Shapes the token sequence toward structured, actionable content"},
        {n:"5",title:"Source constraints",ex:"'Per IDSA guidelines' / 'Do not fabricate citations'",why:"Anchors the probability distribution to authoritative patterns"},
      ].map((el,i)=>(
        <div key={i} style={{display:"flex",gap:14,padding:"12px 16px",borderBottom:i<4?`1px solid ${T.border}`:"none",alignItems:"flex-start"}}>
          <div style={{color:T.inkMuted,fontSize:20,fontWeight:400,minWidth:28,paddingTop:2}}>{el.n}</div>
          <div style={{flex:1}}>
            <div style={{color:T.ink,fontSize:14,fontWeight:500,marginBottom:4}}>{el.title}</div>
            <div style={{color:T.inkSub,fontSize:13,marginBottom:2}}>Example: <em>{el.ex}</em></div>
            <div style={{color:T.inkMuted,fontSize:12}}>Why: {el.why}</div>
          </div>
        </div>
      ))}
    </div>
    <h3 style={S.subhead}>Progressive prompt exercise</h3>
    <div style={S.promptWeak}>
      <div style={{color:T.warnText,fontSize:11,fontWeight:500,marginBottom:4}}>LEVEL 1 -- WEAK</div>
      <div style={{color:"#E5C9C9",fontSize:14,fontStyle:"italic"}}>"What drug should I use for hypertension?"</div>
      <div style={{color:T.inkMuted,fontSize:12,marginTop:4}}>No patient context. Model defaults to the most common training pattern. Generic, not actionable.</div>
    </div>
    <div style={S.promptOk}>
      <div style={{color:"#D4A853",fontSize:11,fontWeight:500,marginBottom:4}}>LEVEL 2 -- BETTER</div>
      <div style={{color:"#E5D4B0",fontSize:14,fontStyle:"italic"}}>"What is the first-line antihypertensive for a 55-year-old African American male with stage 2 hypertension and no comorbidities, per ACC/AHA guidelines?"</div>
      <div style={{color:T.inkMuted,fontSize:12,marginTop:4}}>Patient-specific, guideline-referenced. Actionable. Still lacks uncertainty instruction.</div>
    </div>
    <div style={S.promptGood}>
      <div style={{color:T.okText,fontSize:11,fontWeight:500,marginBottom:4}}>LEVEL 3 -- STRUCTURED</div>
      <div style={{color:"#C9E5D4",fontSize:14,fontStyle:"italic"}}>"Acting as an evidence-based medicine consultant: first-line antihypertensive for a 55-year-old African American male, stage 2 HTN (systolic 160-170), no diabetes, no CKD, no HF. Cite the guideline class (ACC/AHA 2017). If JNC 8 differs, note the uncertainty. Do not fabricate specific citations."</div>
      <div style={{color:T.inkMuted,fontSize:12,marginTop:4}}>Role assignment, patient-specific, guideline-anchored, requests uncertainty acknowledgment, anti-hallucination instruction.</div>
    </div>
    <TempCallout context="For structured prompts like Level 3, use low temperature (0.3-0.5) -- you want the model to reliably produce the guideline-aligned answer, not explore creative alternatives."/>
    <ModelComparison scenarios={[{
      label:"Prompt quality comparison",
      prompt:"What is the first-line antihypertensive for a 55-year-old African American male with stage 2 HTN, per ACC/AHA 2017? Note if JNC 8 differs.",
      titleA:"Model A (no system instruction)",archA:"Default behavior with no structured guidance",
      titleB:"Model B (structured system prompt)",archB:"System prompt: act as EBM consultant, cite guidelines, note uncertainty",
      systemA:"You are a helpful assistant.",
      systemB:"You are an evidence-based medicine consultant. Always cite the guideline class. Note where guidelines conflict. Acknowledge uncertainty explicitly. Never fabricate citations.",
      responseA:"For hypertension in an African American male, calcium channel blockers like amlodipine or thiazide diuretics are often recommended as first-line therapy. ACE inhibitors are generally less effective in this population.",
      responseB:"Per ACC/AHA 2017: For African American adults without HF or CKD, initial therapy should include a thiazide-type diuretic (chlorthalidone preferred) and/or CCB (amlodipine). For stage 2 HTN, two-drug combination is recommended. Note: JNC 8 had a higher initiation threshold (150/90 in patients 60+). Both guidelines agree on drug class selection for this population.",
      observation:"Same model, dramatically different output. Model B correctly identifies the guideline conflict between ACC/AHA 2017 and JNC 8 -- critical clinical information Model A omits entirely. The structured prompt changed what probability space was sampled from."
    }]}/>
    <FormativeCheck questions={[
      {question:"Why does specifying 'Do not fabricate citations' in a prompt reduce hallucination?",
        options:["It activates a special fact-checking module in the model","It removes the statistical pressure to generate citation-shaped tokens when no real citation is needed","It connects the model to external databases","It increases the temperature"],
        correct:1,explanation:"When a prompt requests citations, it creates statistical pressure to generate citation-formatted text. If the model does not have a real citation for that specific claim, it generates one that looks correct. Explicitly stating 'do not fabricate citations' shifts probability away from citation generation toward uncertainty expression."}
    ]}/>
  </>);
}

function T2M2(){
  return(<>
    <VerifiedBadge/>
    <h3 style={S.subhead}>Chain-of-thought prompting: making reasoning visible</h3>
    <p style={S.body}><strong style={{color:T.ink}}>Chain-of-thought (CoT)</strong> prompting instructs the model to generate its reasoning steps before producing a conclusion. This mechanistically improves accuracy: intermediate reasoning tokens constrain subsequent predictions, making the final answer more likely to be consistent with the stated logic.</p>
    <div style={S.promptGood}>
      <div style={{color:T.okText,fontSize:11,fontWeight:500,marginBottom:4}}>CoT PROMPT TEMPLATE</div>
      <div style={{color:"#C9E5D4",fontSize:14,fontStyle:"italic",lineHeight:1.6}}>
        "Given this patient presentation: [details]. Work through the differential diagnosis step by step. For each candidate, state (a) the supporting evidence from the presentation, (b) the evidence against, and (c) the likelihood. Then rank the differential by probability. Show all reasoning before giving a conclusion."
      </div>
    </div>
    <h3 style={S.subhead}>Few-shot prompting</h3>
    <p style={S.body}>Providing 2-3 examples of the desired input-output format before your actual question biases the model toward that pattern. Particularly powerful for getting consistent output formats from learners' AI interactions.</p>
    <ModelComparison scenarios={[{
      label:"Zero-shot vs chain-of-thought",
      prompt:"A 68-year-old man presents with sudden onset severe headache, neck stiffness, and photophobia. Most likely diagnosis?",
      titleA:"Model A (zero-shot -- direct answer, no reasoning required)",archA:"No intermediate reasoning instruction",
      titleB:"Model B (chain-of-thought -- reasoning required first)",archB:"Instructed to work through differential before concluding",
      systemA:"Answer clinical questions directly and concisely.",
      systemB:"Work through clinical reasoning step by step before giving a diagnosis. Identify supporting and contradicting evidence for each differential.",
      responseA:"The most likely diagnosis is bacterial meningitis, given the classic triad of severe headache, neck stiffness, and photophobia. Subarachnoid hemorrhage should also be considered.",
      responseB:"Classic triad present: sudden severe headache + neck stiffness + photophobia. Differential: (1) Subarachnoid hemorrhage -- thunderclap onset fits; no fever mentioned. (2) Bacterial meningitis -- all three findings present, most dangerous, requires immediate action. (3) Viral meningitis -- less acute onset typical. Conclusion: Both SAH and bacterial meningitis are emergencies. Do not delay -- CT head first to rule out SAH before LP, then CSF analysis.",
      observation:"Model B reveals a critical nuance Model A misses: the need to rule out SAH before LP. The reasoning process forces the model to consider the diagnostic pathway, not just the final diagnosis. This is a teaching example of why CoT prompting produces more clinically useful output."
    }]}/>
    <TempCallout context="For chain-of-thought prompting, a slightly higher temperature (0.5-0.8) can produce more varied reasoning paths -- useful for showing students that different reasoning routes can reach the same conclusion. For clinical use, keep temperature low (0.3-0.5) for consistency."/>
    <FormativeCheck questions={[
      {question:"Chain-of-thought prompting improves accuracy because:",
        options:["It gives the model more time to compute","Intermediate reasoning tokens constrain subsequent predictions, narrowing the probability space for the final answer","It connects the model to better training data","It reduces temperature automatically"],
        correct:1,explanation:"Each reasoning token generated constrains what tokens can plausibly follow. A conclusion that contradicts the preceding reasoning has lower probability than one consistent with it. This makes the final answer more likely to be logically coherent -- a mechanical property of autoregressive generation."}
    ]}/>
  </>);
}

function T2M3(){
  return(<>
    <VerifiedBadge/>
    <h3 style={S.subhead}>Reproducibility and evaluation standards</h3>
    <p style={S.body}>Because LLMs sample from a probability distribution, the same prompt can yield different outputs on different runs. This is a design feature, not a defect -- but it has direct implications for clinical AI evaluation.</p>
    <FormulaBlock>{"Top-p sampling: sample from smallest set S where \u03A3 P(token_i) \u2265 p\n\nAt p=0.9: model considers only tokens covering 90% of probability\nEliminating the long tail of very low-probability tokens"}</FormulaBlock>
    <TempCallout context="Top-p and temperature interact: low temperature with high p produces near-deterministic output. High temperature with low p produces varied output from a restricted set. For reproducibility testing, control both -- ask vendors about their default settings."/>
    <h3 style={S.subhead}>Four-dimension evaluation framework</h3>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"12px 0"}}>
      {[
        {n:"1",title:"Diagnostic accuracy",threshold:"> 90%",desc:"Correct answers on gold-standard cases. Minimum 100 test cases.",c:"#14532D"},
        {n:"2",title:"Hallucination rate",threshold:"< 5%",desc:"Fraction containing factually incorrect claims. Test 50+ open-ended questions.",c:T.warn},
        {n:"3",title:"Reproducibility",threshold:"> 95%",desc:"Semantic consistency across 3+ runs at fixed low temperature.",c:"#1E3A5F"},
        {n:"4",title:"Confidence calibration",threshold:"Correlated",desc:"Stated confidence should correlate with actual correctness.",c:"#3D1A5F"},
      ].map(d=>(
        <div key={d.n} style={{background:T.surfaceHi,borderRadius:12,padding:14,border:`1px solid ${T.border}`,borderLeft:`3px solid ${d.c}`}}>
          <div style={{color:T.inkMuted,fontSize:11,marginBottom:4}}>DIMENSION {d.n}</div>
          <div style={{color:T.ink,fontSize:14,fontWeight:500,marginBottom:4}}>{d.title}</div>
          <div style={{color:"#8EB8F5",fontSize:18,fontWeight:500,marginBottom:6}}>{d.threshold}</div>
          <div style={{color:T.inkSub,fontSize:13,lineHeight:1.5}}>{d.desc}</div>
        </div>
      ))}
    </div>
    <h3 style={S.subhead}>Entrustment levels for AI tools (Gin et al., 2025)</h3>
    <p style={S.body}>Trustworthiness is assessed through three dimensions: <strong style={{color:T.ink}}>Ability</strong> (domain-specific competence), <strong style={{color:T.ink}}>Integrity</strong> (transparency about limitations), and <strong style={{color:T.ink}}>Benevolence</strong> (upholding patient interests).</p>
    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",margin:"12px 0"}}>
      {[
        {l:"1",d:"AI ineligible for autonomous role",e:"Summative competency committee decisions",c:"#7C2D12"},
        {l:"2",d:"Supporting role, constant supervision",e:"AI summarizing narrative evaluations",c:"#854D0E"},
        {l:"3",d:"Equivalent collaboration",e:"AI assisting lecture content creation",c:"#713F12"},
        {l:"4",d:"Leading role, limited supervision",e:"Automated scoring with validated rubric",c:"#14532D"},
        {l:"5",d:"Full autonomy (low-stakes, validated)",e:"Formative student performance dashboard",c:"#14532D"},
      ].map((r,i)=>(
        <div key={i} style={{padding:"10px 16px",borderBottom:i<4?`1px solid ${T.border}`:"none",display:"flex",gap:14,alignItems:"flex-start"}}>
          <div style={{background:r.c+"30",color:r.c==="14532D"?T.okText:T.warnText,borderRadius:6,padding:"2px 10px",fontSize:12,fontWeight:500,minWidth:70,textAlign:"center"}}>Level {r.l}</div>
          <div style={{flex:1}}>
            <div style={{color:T.ink,fontSize:13,fontWeight:500}}>{r.d}</div>
            <div style={{color:T.inkMuted,fontSize:12,marginTop:2}}>Example: {r.e}</div>
          </div>
        </div>
      ))}
    </div>
    <RedFlag title="Unvalidated accuracy claims" text="If a vendor claims '95% accuracy' without citing peer-reviewed validation on an independent test set, the claim is not trustworthy. Accuracy on the vendor's own curated data does not generalize."/>
    <FormativeCheck questions={[
      {question:"A tool with 92% accuracy but 15% hallucination rate is:",
        options:["Acceptable for clinical use with minor caveats","More dangerous than a tool with 88% accuracy and 2% hallucination rate","Safe because accuracy exceeds 90%","Appropriate for Level 4 entrustment"],
        correct:1,explanation:"A 15% hallucination rate means approximately 1 in 7 responses contains factual errors. The unpredictability of which responses are wrong -- combined with high average accuracy -- creates false confidence. A clinician cannot know which 15% to distrust. Lower accuracy with near-zero hallucinations is safer because errors are more predictable."}
    ]}/>
  </>);
}

function T2M4(){
  return(<>
    <VerifiedBadge/>
    <h3 style={S.subhead}>Architecture comparison: how different models behave</h3>
    <p style={S.body}>All transformer-based LLMs use the same core generation mechanism (softmax + sampling), but their training objectives create different output characteristics. Understanding these differences helps educators and learners select and evaluate tools appropriately.</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,margin:"12px 0"}}>
      {[
        {name:"General-purpose",training:"Broad internet data, next-token prediction",character:"High variance, prone to hallucination on specialized topics. No constraint against confident fabrication.",clinical:"Requires careful prompting and mandatory fact-checking.",c:"#8EB8F5"},
        {name:"RLHF-aligned",training:"Human feedback + alignment objectives",character:"More calibrated uncertainty. May express doubt on uncertain topics. May err toward overcaution.",clinical:"Better at flagging uncertainty, but still requires verification for clinical claims.",c:"#A8D5A2"},
        {name:"Domain fine-tuned",training:"Medical literature, clinical trials, textbooks",character:"Higher accuracy within training distribution. Still hallucinates on rare conditions and post-cutoff research.",clinical:"More reliable for tasks within the fine-tuning domain.",c:"#D4A4C8"},
      ].map((m,i)=>(
        <div key={i} style={{background:T.surfaceHi,borderRadius:12,padding:14,border:`1px solid ${T.border}`,borderTop:`3px solid ${m.c}`}}>
          <div style={{color:m.c,fontWeight:500,fontSize:14,marginBottom:8}}>{m.name}</div>
          <div style={{color:T.inkSub,fontSize:12,marginBottom:6}}><strong style={{color:T.ink}}>Training:</strong> {m.training}</div>
          <div style={{color:T.inkSub,fontSize:12,marginBottom:6}}><strong style={{color:T.ink}}>Output:</strong> {m.character}</div>
          <div style={{color:T.inkSub,fontSize:12}}><strong style={{color:T.ink}}>Clinical:</strong> {m.clinical}</div>
        </div>
      ))}
    </div>
    <ModelComparison scenarios={[{
      label:"Architecture behavior comparison",
      prompt:"What is the evidence for using aspirin in primary prevention of cardiovascular disease in a 60-year-old with no prior CVD?",
      titleA:"Model A (helpfulness-optimized, no domain fine-tuning)",archA:"Optimized to produce complete, satisfying answers",
      titleB:"Model B (uncertainty-calibrated, may reflect domain fine-tuning)",archB:"Optimized for epistemic accuracy over satisfaction",
      systemA:"Be maximally helpful. Provide complete clinical guidance.",
      systemB:"Be accurate. Express uncertainty where it exists. Note when evidence has changed over time.",
      responseA:"For a 60-year-old without prior CVD, low-dose aspirin (81mg daily) reduces the risk of first cardiovascular event by approximately 10-15%. It is generally recommended for patients with elevated 10-year CVD risk.",
      responseB:"Evidence on aspirin for primary prevention changed substantially after 2018. Major trials showed marginal benefit with increased bleeding risk in average-risk patients. Current ACC/AHA guidelines recommend against routine aspirin use for primary prevention in most patients. This is an area where the evidence evolved significantly -- I would recommend checking the most current guidelines.",
      observation:"Model A reflects pre-2018 consensus. Model B reflects current guidance and explicitly flags that evidence changed. Teaching point: the model's training cutoff and optimization objective together determine which version of medical knowledge it confidently reproduces."
    }]}/>
    <TempCallout context="Architecture comparison is most instructive at low temperature (0.3-0.5), where each model's 'default' behavior is most consistently expressed. At high temperature, output becomes noisy and the architectural differences are harder to observe."/>
    <FormativeCheck questions={[
      {question:"A general-purpose LLM optimized for helpfulness is more dangerous in clinical settings because:",
        options:["It processes information more slowly","It may hallucinate plausible information rather than express uncertainty, since 'I don't know' scores poorly on helpfulness ratings","It has a smaller vocabulary","It cannot process medical terminology"],
        correct:1,explanation:"A helpfulness-optimized model is trained to provide useful answers. When it encounters questions where the correct answer is 'I'm not sure,' the helpfulness objective incentivizes generating a plausible response rather than expressing uncertainty. In clinical settings, false confidence is more dangerous than honest uncertainty."}
    ]}/>
  </>);
}

// TRACK 3 MODULES
function T3M1(){
  return(<>
    <VerifiedBadge/>
    <h3 style={S.subhead}>The current landscape: AAMC data</h3>
    <p style={S.body}>The 2024 AAMC Curriculum SCOPE Survey (88% response rate, 182 of 208 MD- and DO-granting schools) reveals rapid curriculum growth alongside critical infrastructure gaps.</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,margin:"12px 0"}}>
      {[
        {stat:"140",label:"Schools with AI in curriculum (2024)",sub:"Up from 88 in 2023 -- 59% growth in one year"},
        {stat:"52%",label:"Schools lacking an appropriate use policy",sub:"Governance has not kept pace with curriculum adoption"},
        {stat:"30%",label:"Schools providing secure AI tool access",sub:"70% of learners use personal, unsanctioned accounts"},
      ].map((s,i)=>(
        <div key={i} style={{background:T.surfaceHi,borderRadius:12,padding:16,border:`1px solid ${T.border}`,textAlign:"center"}}>
          <div style={{fontSize:32,fontWeight:400,color:T.ink,marginBottom:4}}>{s.stat}</div>
          <div style={{color:T.inkSub,fontSize:13,lineHeight:1.5,marginBottom:4}}>{s.label}</div>
          <div style={{color:T.inkMuted,fontSize:11}}>{s.sub}</div>
        </div>
      ))}
    </div>
    <h3 style={S.subhead}>The infrastructure gap</h3>
    <p style={S.body}>Curriculum has grown faster than governance. Students are using AI tools without institutional guidance -- on personal accounts, with unvetted tools, without data governance. The AAMC 2025 Principles for Responsible AI Use identify equal access and appropriate use policies as foundational requirements that most institutions have not yet met.</p>
    <Callout label="IACAI framework" color="#0A0A1A">
      The International Advisory Committee on AI (IACAI) -- a collaboration of AAMC, AMEE, and IAMSE -- proposes 12 domains spanning five levels: intrapersonal (individual awareness), micro (practice), meso (institution), macro (national), and mega (international). This curriculum addresses intrapersonal and micro levels -- the most immediately actionable for faculty.
    </Callout>
    <FormativeCheck questions={[
      {question:"According to the 2024 AAMC SCOPE Survey, the most critical infrastructure gap is:",
        options:["Too few AI-focused faculty","Lack of AI textbooks","52% of schools lack an appropriate use policy and 70% do not provide secure AI tool access","Insufficient computing infrastructure"],
        correct:2,explanation:"The SCOPE Survey found governance infrastructure lags far behind curriculum growth. Without policies and secure tool access, institutions cannot ensure responsible AI use, protect student data, or meet the AAMC equal access principle."}
    ]}/>
  </>);
}

function T3M2(){
  return(<>
    <VerifiedBadge/>
    <h3 style={S.subhead}>Literacy vs. fluency: the distinction that changes everything</h3>
    <p style={S.body}><strong style={{color:T.ink}}>AI literacy</strong> means understanding what "hallucination" means. <strong style={{color:T.ink}}>AI fluency</strong> means knowing how to test for hallucination in a specific tool, interpreting results, and making a defensible institutional decision about adoption. Most AI curricula currently teach literacy. The workforce needs fluency.</p>
    <h3 style={S.subhead}>Scaffolded curriculum progression</h3>
    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",margin:"12px 0"}}>
      {[
        {phase:"Preclinical (Year 1-2)",c:"#22c55e",content:"What is an LLM? How does it generate text? What are hallucinations? Basic ethical principles. Foundational prompt structure. Mapped to: Evidence-Based Medicine, Medical Ethics."},
        {phase:"Clerkship (Year 3-4)",c:"#f59e0b",content:"How to test a clinical AI tool. Structured prompting for clinical reasoning. Evaluating vendor claims. AI-assisted differential diagnosis with critical evaluation. Mapped to: Clinical rotations, patient safety."},
        {phase:"Residency",c:"#ef4444",content:"Entrustment decision-making. Governance participation. Domain-specific AI evaluation. Teaching AI literacy to medical students."},
      ].map((p,i)=>(
        <div key={i} style={{padding:"14px 16px",borderBottom:i<2?`1px solid ${T.border}`:"none",borderLeft:`4px solid ${p.c}`}}>
          <div style={{color:p.c,fontSize:13,fontWeight:500,marginBottom:6}}>{p.phase}</div>
          <div style={{color:T.inkSub,fontSize:13,lineHeight:1.6}}>{p.content}</div>
        </div>
      ))}
    </div>
    <h3 style={S.subhead}>Using this tool in your curriculum</h3>
    <p style={S.body}><strong style={{color:T.ink}}>Track 1 (How LLMs Work)</strong> maps to Year 1-2: 5 modules, 12-15 minutes each, designed for independent completion before lecture or discussion.</p>
    <p style={S.body}><strong style={{color:T.ink}}>Track 2 (Prompt Engineering and Evaluation)</strong> maps to Year 3-4 and residency: 4 modules on applied skills. Best used in active learning sessions with access to a live AI tool.</p>
    <p style={S.body}><strong style={{color:T.ink}}>Track 3 (Curriculum and Governance)</strong> is for faculty and curriculum committees: 4 modules on institutional design. Designed for workshop or faculty development contexts.</p>
    <FormativeCheck questions={[
      {question:"The key difference between AI literacy and AI fluency for curriculum design is:",
        options:["Literacy is for students; fluency is for faculty","Literacy is knowing concepts; fluency is applying them to make defensible decisions in practice","Literacy covers basic AI; fluency covers advanced topics","There is no meaningful distinction"],
        correct:1,explanation:"Literacy (conceptual knowledge) is a prerequisite, not an endpoint. Fluency (applied decision-making) is the workforce-relevant outcome. A student who can define hallucination but cannot design a test for it in a specific clinical tool has literacy, not fluency."}
    ]}/>
  </>);
}

function T3M3(){
  return(<>
    <VerifiedBadge/>
    <h3 style={S.subhead}>Essential policy components</h3>
    <p style={S.body}>A policy that says "AI is prohibited" is not governance -- it drives usage underground and leaves students unprepared. Effective governance enables responsible use and builds institutional capacity.</p>
    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",margin:"12px 0"}}>
      {[
        {n:"01",title:"Acceptable use guidelines",desc:"What tools may be used, for what purposes, with what disclosures. Distinguish between approved and unapproved tools."},
        {n:"02",title:"Data governance",desc:"No patient data in general-purpose LLMs without a Business Associate Agreement (BAA). Most consumer AI tools (ChatGPT, Claude, Gemini personal accounts) do not have BAAs."},
        {n:"03",title:"Academic integrity",desc:"When and how AI assistance must be disclosed. What constitutes AI-assisted work. How this applies to assessments, presentations, and published work."},
        {n:"04",title:"Assessment integrity",desc:"How AI-assisted work is evaluated. AI use in examinations. How to design assessments that remain valid in an AI-accessible environment."},
        {n:"05",title:"Annual review cycle",desc:"AI capabilities change faster than most policy revision cycles. Annual review is a minimum."},
      ].map((c,i)=>(
        <div key={i} style={{display:"flex",gap:14,padding:"12px 16px",borderBottom:i<4?`1px solid ${T.border}`:"none"}}>
          <div style={{color:T.inkMuted,fontSize:16,fontWeight:400,minWidth:32}}>{c.n}</div>
          <div>
            <div style={{color:T.ink,fontSize:14,fontWeight:500,marginBottom:4}}>{c.title}</div>
            <div style={{color:T.inkSub,fontSize:13,lineHeight:1.6}}>{c.desc}</div>
          </div>
        </div>
      ))}
    </div>
    <RedFlag title="No BAA = no patient data" text="Unless your institution has a BAA with the specific AI vendor, no PHI should enter any AI tool. This applies in teaching contexts as well -- de-identified case vignettes are acceptable; identifiable patient information is not."/>
    <h3 style={S.subhead}>Governance committee structure</h3>
    <p style={S.body}>The IACAI recommends a cross-stakeholder committee including: clinical faculty, basic science faculty, students, IT/cybersecurity, compliance/legal, and administration. The IACAI RACI matrix maps responsibilities across these stakeholders for each governance domain.</p>
    <FormativeCheck questions={[
      {question:"What is the key compliance requirement before any AI tool processes patient information?",
        options:["Written permission from the patient","A Business Associate Agreement (BAA) with the AI vendor","IRB approval","Department chair approval"],
        correct:1,explanation:"HIPAA requires a BAA with any vendor who processes PHI on an institution's behalf. Most consumer AI tools do not have BAAs for individual use. Verify BAA coverage before allowing any AI tool to process patient-identifiable information, including in educational contexts."}
    ]}/>
  </>);
}

function T3M4(){
  return(<>
    <VerifiedBadge/>
    <h3 style={S.subhead}>Teaching strategies that build fluency</h3>
    <p style={S.body}>AI fluency cannot be taught through didactics alone. Students who discover hallucinations themselves respond very differently to clinical AI tools than students who hear about hallucinations in a lecture. The experiential discovery creates durable skepticism and transferable evaluation skills.</p>
    <h3 style={S.subhead}>The AI Red Team exercise</h3>
    <p style={S.body}><strong style={{color:T.ink}}>Setup:</strong> Divide into two groups. Group A generates clinical advice using an AI tool for a standardized case. Group B has 10 minutes to find errors, fabricated citations, contradictions with established guidelines, or unsafe recommendations. Groups switch roles. Debrief together.</p>
    <p style={S.body}><strong style={{color:T.ink}}>Why it works:</strong> Students do not just hear that AI can fail -- they find failures under time pressure with specific criteria. The adversarial framing makes finding errors rewarding. The debrief surfaces recurring failure patterns -- a powerful pattern-recognition moment.</p>
    <h3 style={S.subhead}>Three-year institutional roadmap</h3>
    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",margin:"12px 0"}}>
      {[
        {year:"Year 1: Foundation",c:"#22c55e",items:["AI governance committee with cross-stakeholder representation","Appropriate use policy and data governance framework","Faculty development: introductory AI literacy for all faculty","Foundational AI in required curriculum (ethics, concepts, limitations)"]},
        {year:"Year 2: Integration",c:"#f59e0b",items:["Secure, institutionally-managed AI tool access for all learners","Domain-specific AI curriculum (clinical reasoning, research methodology)","Assessment integration with entrustment levels and bias auditing","Monitoring and evaluation metrics"]},
        {year:"Year 3: Advancement",c:"#8EB8F5",items:["Curriculum effectiveness evaluation with outcome data","Advanced applications (clinical simulation, personalized learning)","Institutional case studies shared with the medical education community","Policy review based on implementation data"]},
      ].map((y,i)=>(
        <div key={i} style={{padding:"14px 16px",borderBottom:i<2?`1px solid ${T.border}`:"none",borderLeft:`4px solid ${y.c}`}}>
          <div style={{color:y.c,fontSize:14,fontWeight:500,marginBottom:8}}>{y.year}</div>
          {y.items.map((item,j)=>(
            <div key={j} style={{color:T.inkSub,fontSize:13,lineHeight:1.6,paddingLeft:14,position:"relative",marginBottom:4}}>
              <span style={{position:"absolute",left:0,color:y.c}}>&#183;</span>{item}
            </div>
          ))}
        </div>
      ))}
    </div>
    <h3 style={S.subhead}>Faculty modeling</h3>
    <p style={S.body}>When you use AI to prepare teaching materials, disclose this to students and walk through your verification process. Show what the AI produced, what you changed, and what you verified against primary sources. This normalizes responsible use and demonstrates critical evaluation in action -- more effectively than any lecture about AI limitations.</p>
    <FormativeCheck questions={[
      {question:"The AI Red Team exercise is more effective than a lecture about hallucination because:",
        options:["It is faster to complete","Students discover failure modes themselves under realistic conditions, creating durable and transferable evaluation skills","It requires no preparation from the instructor","It eliminates the need to understand how LLMs work"],
        correct:1,explanation:"Experiential discovery creates stronger and more durable learning than declarative instruction. When students find hallucinations themselves -- under time pressure, with specific clinical stakes -- they develop internalized evaluation habits that transfer to new AI tools, not just knowledge about AI limitations in the abstract."}
    ]}/>
  </>);
}

// TRACKS AND MODULE REGISTRY
const TRACKS=[
  {id:"t1",label:"How LLMs Work",sub:"Mechanistic foundations",color:"#8EB8F5"},
  {id:"t2",label:"Prompt Engineering",sub:"Applied skills and evaluation",color:"#A8D5A2"},
  {id:"t3",label:"Curriculum & Governance",sub:"Institutional design",color:"#D4A4C8"},
];
const MODULES={
  t1:[
    {n:1,title:"What happens when you type a prompt",dur:"12 min",C:T1M1},
    {n:2,title:"Embeddings and latent space",dur:"15 min",C:T1M2},
    {n:3,title:"Hallucination: root causes and clinical risk",dur:"15 min",C:T1M3},
    {n:4,title:"Attention, layers, and how context is processed",dur:"15 min",C:T1M4},
    {n:5,title:"Training, fine-tuning, and RLHF",dur:"12 min",C:T1M5},
  ],
  t2:[
    {n:1,title:"Structured prompting: the five elements",dur:"15 min",C:T2M1},
    {n:2,title:"Chain-of-thought and few-shot prompting",dur:"12 min",C:T2M2},
    {n:3,title:"Reproducibility and evaluation standards",dur:"12 min",C:T2M3},
    {n:4,title:"Architecture comparison and model selection",dur:"15 min",C:T2M4},
  ],
  t3:[
    {n:1,title:"The current landscape: AAMC data and gaps",dur:"12 min",C:T3M1},
    {n:2,title:"Literacy vs. fluency: designing the curriculum",dur:"12 min",C:T3M2},
    {n:3,title:"Governance: policy, HIPAA, and committee structure",dur:"15 min",C:T3M3},
    {n:4,title:"Teaching strategies and institutional roadmap",dur:"15 min",C:T3M4},
  ],
};

function MedAIMicromodules(){
  const [activeTrack,setActiveTrack]=useState("t1");
  const [activeMod,setActiveMod]=useState(0);
  const [sidebarOpen,setSidebarOpen]=useState(true);
  const contentRef=useRef(null);
  const mods=MODULES[activeTrack];
  const mod=mods[activeMod];
  const track=TRACKS.find(t=>t.id===activeTrack);
  useEffect(()=>{if(contentRef.current)contentRef.current.scrollTo({top:0,behavior:"smooth"});},[activeTrack,activeMod]);

  return(
    <div style={{display:"flex",height:"100vh",background:T.bg,fontFamily:"'Inter','DM Sans',system-ui,sans-serif",color:T.ink,overflow:"hidden"}}>
      {sidebarOpen&&(
        <div style={{width:300,minWidth:300,background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"20px 16px 14px",borderBottom:`1px solid ${T.border}`}}>
            <div style={{fontSize:15,fontWeight:500,color:T.ink,letterSpacing:"-0.01em"}}>MedAI Micromodules</div>
            <div style={{fontSize:12,color:T.inkMuted,marginTop:2}}>Interactive AI Fluency Curriculum</div>
          </div>
          <div style={{padding:8,borderBottom:`1px solid ${T.border}`}}>
            {TRACKS.map(t=>(
              <button key={t.id} onClick={()=>{setActiveTrack(t.id);setActiveMod(0);}}
                style={{display:"block",width:"100%",textAlign:"left",padding:"8px 12px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",background:activeTrack===t.id?T.surfaceHi:"transparent",marginBottom:2}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:6,height:6,borderRadius:9999,background:activeTrack===t.id?t.color:T.borderHi,flexShrink:0}}/>
                  <div>
                    <div style={{color:activeTrack===t.id?T.ink:T.inkSub,fontSize:13,fontWeight:activeTrack===t.id?500:400}}>{t.label}</div>
                    <div style={{color:T.inkMuted,fontSize:11}}>{t.sub}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div style={{flex:1,overflowY:"auto",padding:8}}>
            {mods.map((m,i)=>(
              <button key={i} onClick={()=>setActiveMod(i)}
                style={{display:"block",width:"100%",textAlign:"left",padding:"8px 12px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",background:activeMod===i?T.surfaceHi:"transparent",marginBottom:2}}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                  <div style={{color:activeMod===i?track.color:T.inkMuted,fontSize:11,fontWeight:500,minWidth:20,paddingTop:2}}>{m.n}</div>
                  <div style={{flex:1}}>
                    <div style={{color:activeMod===i?T.ink:T.inkSub,fontSize:13,lineHeight:1.4,fontWeight:activeMod===i?500:400}}>{m.title}</div>
                    <div style={{color:T.inkMuted,fontSize:11,marginTop:2}}>{m.dur}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div style={{padding:"12px 16px",borderTop:`1px solid ${T.border}`}}>
            <a href="https://medai-lexicon.vercel.app/" style={{color:T.inkMuted,fontSize:12,textDecoration:"none",display:"flex",alignItems:"center",gap:6}} target="_blank" rel="noopener noreferrer">
              <span style={{color:T.formulaAccent,fontSize:10}}>&#8599;</span>
              Part of the Interactive MedAI Lexicon
            </a>
          </div>
        </div>
      )}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"12px 24px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,padding:"4px 10px",color:T.inkMuted,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>
              {sidebarOpen?"&#8592;":"&#8594;"}
            </button>
            <div style={{height:16,width:1,background:T.border}}/>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:6,height:6,borderRadius:9999,background:track.color}}/>
              <span style={{color:T.inkMuted,fontSize:13}}>{track.label}</span>
              <span style={{color:T.border}}>&#183;</span>
              <span style={{color:T.ink,fontSize:13,fontWeight:500}}>{mod.n}. {mod.title}</span>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{color:T.inkMuted,fontSize:12}}>{mod.dur}</span>
            <div style={{height:16,width:1,background:T.border}}/>
            <button onClick={()=>setActiveMod(Math.max(0,activeMod-1))} disabled={activeMod===0}
              style={{padding:"4px 14px",borderRadius:9999,border:`1px solid ${T.border}`,background:"transparent",color:activeMod===0?T.inkMuted:T.inkSub,cursor:activeMod===0?"default":"pointer",fontSize:12,fontFamily:"inherit"}}>
              Previous
            </button>
            <button onClick={()=>setActiveMod(Math.min(mods.length-1,activeMod+1))} disabled={activeMod===mods.length-1}
              style={{padding:"4px 16px",borderRadius:9999,border:`1px solid ${activeMod===mods.length-1?T.border:track.color}`,background:activeMod===mods.length-1?"transparent":T.pill,color:activeMod===mods.length-1?T.inkMuted:T.pillText,cursor:activeMod===mods.length-1?"default":"pointer",fontSize:12,fontFamily:"inherit"}}>
              Next
            </button>
          </div>
        </div>
        <div ref={contentRef} style={{flex:1,overflowY:"auto",padding:"32px 48px",maxWidth:860,width:"100%"}}>
          <div style={{marginBottom:24}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12}}>
              <span style={{background:T.surfaceHi,color:T.inkMuted,borderRadius:9999,padding:"3px 12px",fontSize:11,fontWeight:500,border:`1px solid ${T.border}`}}>{track.label}</span>
              <span style={{background:T.surfaceHi,color:T.inkMuted,borderRadius:9999,padding:"3px 12px",fontSize:11,border:`1px solid ${T.border}`}}>Module {mod.n} of {mods.length}</span>
            </div>
            <h1 style={{fontSize:26,fontWeight:400,color:T.ink,lineHeight:1.3,letterSpacing:"-0.02em",marginBottom:4}}>{mod.title}</h1>
            <div style={{width:40,height:2,background:track.color,borderRadius:9999,marginTop:12}}/>
          </div>
          <mod.C/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:48,paddingTop:24,borderTop:`1px solid ${T.border}`}}>
            {activeMod>0?(<button onClick={()=>setActiveMod(activeMod-1)} style={{padding:"8px 20px",borderRadius:9999,border:`1px solid ${T.border}`,background:"transparent",color:T.inkSub,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>&#8592; {mods[activeMod-1].title}</button>):<div/>}
            {activeMod<mods.length-1&&(<button onClick={()=>setActiveMod(activeMod+1)} style={{padding:"8px 20px",borderRadius:9999,border:`1px solid ${track.color}`,background:T.pill,color:T.pillText,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>{mods[activeMod+1].title} &#8594;</button>)}
          </div>
          <div style={{marginTop:48,paddingTop:24,borderTop:`1px solid ${T.border}`,textAlign:"center"}}>
            <a href="https://medai-lexicon.vercel.app/" style={{color:T.inkMuted,fontSize:12,textDecoration:"none"}} target="_blank" rel="noopener noreferrer">
              Part of the <span style={{color:T.formulaAccent,textDecoration:"underline"}}>Interactive MedAI Lexicon</span>
            </a>
            <div style={{color:T.inkMuted,fontSize:11,marginTop:4}}>Content verified May 2026 &#183; AI capabilities evolve rapidly -- verify against current literature</div>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<MedAIMicromodules/>);
