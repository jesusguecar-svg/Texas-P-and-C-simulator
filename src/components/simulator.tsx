"use client";

import {
  AlarmClock,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Flag,
  Highlighter,
  History,
  LayoutGrid,
  ListChecks,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Scissors,
  ShieldCheck,
  Sun,
  X,
  XCircle,
} from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  DOMAIN_IDS,
  DOMAIN_META,
  QUESTIONS,
  selectQuestions,
  type DomainId,
  type OptionId,
  type Question,
} from "@/lib/questions";
import {
  createSession,
  HISTORY_KEY,
  scoreSession,
  SESSION_KEY,
  THEME_KEY,
  type SessionState,
  type Setup,
} from "@/lib/session";

const DEFAULT_SETUP: Setup = {
  domains: [...DOMAIN_IDS],
  amount: 50,
  timed: true,
  minutes: 75,
  explanationMode: "al_final",
  allowChanges: true,
  includeAnswered: true,
  shuffleOptions: true,
};

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remainder = safe % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button type="button" className={`toggle ${checked ? "on" : ""}`} onClick={() => onChange(!checked)} aria-pressed={checked} aria-label={label}>
      <span />
    </button>
  );
}

function ThemeButton({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button className="icon-button" onClick={onToggle} title={dark ? "Usar tema claro" : "Usar tema oscuro"} aria-label={dark ? "Usar tema claro" : "Usar tema oscuro"}>
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "compact" : ""}`}>
      <div className="brand-mark">AA</div>
      <div>
        <strong>Alleanza Academy</strong>
        <span>Texas P&amp;C Simulator</span>
      </div>
    </div>
  );
}

function HighlightedText({ text, highlights }: { text: string; highlights: string[] }) {
  if (!highlights.length) return text;
  const escaped = highlights.filter(Boolean).sort((a, b) => b.length - a.length).map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!escaped.length) return text;
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  return text.split(regex).map((part, index) =>
    highlights.some((value) => value.toLowerCase() === part.toLowerCase()) ? <mark key={`${part}-${index}`}>{part}</mark> : <Fragment key={`${part}-${index}`}>{part}</Fragment>,
  );
}

export function Simulator() {
  const [hydrated, setHydrated] = useState(false);
  const [dark, setDark] = useState(false);
  const [setup, setSetup] = useState<Setup>(DEFAULT_SETUP);
  const [session, setSession] = useState<SessionState | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedTheme = localStorage.getItem(THEME_KEY) === "dark";
      const savedHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as string[];
      const savedSession = localStorage.getItem(SESSION_KEY);
      setDark(savedTheme);
      setHistory(savedHistory);
      if (savedSession) {
        try {
          setSession(JSON.parse(savedSession) as SessionState);
        } catch {
          localStorage.removeItem(SESSION_KEY);
        }
      }
      setHydrated(true);
    });
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    if (hydrated) localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }, [dark, hydrated]);

  useEffect(() => {
    if (hydrated && session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, [session, hydrated]);

  const submitSession = useCallback(() => {
    setSession((current) => current ? { ...current, status: "submitted", submittedAt: Date.now() } : current);
    setShowSubmit(false);
    setReviewIndex(0);
  }, []);

  useEffect(() => {
    if (!session?.expiresAt || session.status !== "active" || paused) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((session.expiresAt! - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) submitSession();
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [paused, session?.expiresAt, session?.status, submitSession]);

  const questionsById = useMemo(() => new Map(QUESTIONS.map((question) => [question.id, question])), []);
  const activeQuestions = useMemo(() => session?.questionIds.map((id) => questionsById.get(id)!).filter(Boolean) ?? [], [session?.questionIds, questionsById]);

  const updateSession = (patch: Partial<SessionState>) => setSession((current) => current ? { ...current, ...patch } : current);

  const start = () => {
    const selected = selectQuestions(setup.domains, setup.amount, new Set(history), setup.includeAnswered);
    if (!selected.length) return;
    setSession(createSession(selected, setup));
    setPaused(false);
    setShowNavigator(false);
    setReviewIndex(0);
  };

  const finish = () => {
    if (!session) return;
    const answeredIds = Object.keys(session.answers);
    const mergedHistory = Array.from(new Set([...history, ...answeredIds]));
    setHistory(mergedHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(mergedHistory));
    submitSession();
  };

  const reset = () => {
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
    setShowNavigator(false);
    setShowSubmit(false);
  };

  const toggleDomain = (domain: DomainId) => {
    setSetup((current) => ({
      ...current,
      domains: current.domains.includes(domain)
        ? current.domains.filter((item) => item !== domain)
        : [...current.domains, domain],
    }));
  };

  if (!hydrated) return <div className="loading"><div className="brand-mark">AA</div><span>Preparando simulador…</span></div>;

  if (!session) {
    const available = QUESTIONS.filter((question) => setup.domains.includes(question.domain) && (setup.includeAnswered || !history.includes(question.id))).length;
    return (
      <div className="app-shell setup-shell">
        <header className="topbar public-topbar">
          <Brand />
          <div className="topbar-actions"><span className="bank-count"><BookOpenCheck size={17} /> 300 preguntas</span><ThemeButton dark={dark} onToggle={() => setDark(!dark)} /></div>
        </header>
        <main className="setup-main">
          <section className="setup-intro">
            <div><span className="eyebrow">Texas General Lines P&amp;C · InsTX-PC06</span><h1>Configura tu sesión</h1><p>Simulación rigurosa o práctica enfocada, con navegación, herramientas de lectura y análisis por dominio.</p></div>
            <div className="powered"><ShieldCheck size={18} /> Powered by <strong>Alleanza Academy</strong></div>
          </section>

          <div className="setup-grid">
            <section className="panel domain-panel">
              <div className="section-heading"><div><span className="step">1</span><h2>Dominios</h2></div><button className="text-button" onClick={() => setSetup((current) => ({ ...current, domains: current.domains.length === DOMAIN_IDS.length ? [] : [...DOMAIN_IDS] }))}>{setup.domains.length === DOMAIN_IDS.length ? "Quitar todos" : "Seleccionar todos"}</button></div>
              <div className="domain-list">
                {DOMAIN_IDS.map((domain) => {
                  const count = QUESTIONS.filter((question) => question.domain === domain).length;
                  const checked = setup.domains.includes(domain);
                  return <button key={domain} className={`domain-row ${checked ? "selected" : ""}`} onClick={() => toggleDomain(domain)}><span className="checkbox">{checked && <Check size={15} />}</span><span className="domain-code">{domain}</span><span className="domain-name">{DOMAIN_META[domain].name}</span><span className="domain-count">{count}</span></button>;
                })}
              </div>
            </section>

            <section className="panel settings-panel">
              <div className="section-heading"><div><span className="step">2</span><h2>Condiciones</h2></div></div>
              <div className="setting-block"><label>Cantidad de preguntas</label><div className="segmented">{[10, 25, 50, 75, 100, 130].map((amount) => <button key={amount} className={setup.amount === amount ? "active" : ""} onClick={() => setSetup((current) => ({ ...current, amount }))}>{amount}</button>)}</div><div className="range-row"><input type="range" min="5" max={Math.max(5, available)} step="5" value={Math.min(setup.amount, Math.max(5, available))} onChange={(event) => setSetup((current) => ({ ...current, amount: Number(event.target.value) }))} /><strong>{Math.min(setup.amount, available)} disponibles</strong></div></div>
              <div className="setting-block"><div className="setting-title"><div><Clock3 size={18} /><span>Temporizador</span></div><Toggle checked={setup.timed} onChange={(timed) => setSetup((current) => ({ ...current, timed }))} label="Activar temporizador" /></div>{setup.timed && <div className="time-input"><button onClick={() => setSetup((current) => ({ ...current, minutes: Math.max(5, current.minutes - 5) }))}>−</button><span><strong>{setup.minutes}</strong> minutos</span><button onClick={() => setSetup((current) => ({ ...current, minutes: Math.min(300, current.minutes + 5) }))}>+</button></div>}</div>
              <div className="setting-block"><label>Explicaciones</label><div className="select-wrap"><select value={setup.explanationMode} onChange={(event) => setSetup((current) => ({ ...current, explanationMode: event.target.value as Setup["explanationMode"] }))}><option value="inmediata">Después de cada respuesta</option><option value="al_final">Solo al finalizar</option><option value="nunca">Ocultar explicaciones</option></select><ChevronDown size={17} /></div></div>
              <div className="toggle-list">
                <div><span><RotateCcw size={17} /> Permitir cambiar respuestas</span><Toggle checked={setup.allowChanges} onChange={(allowChanges) => setSetup((current) => ({ ...current, allowChanges }))} label="Permitir cambios" /></div>
                <div><span><History size={17} /> Incluir preguntas ya contestadas</span><Toggle checked={setup.includeAnswered} onChange={(includeAnswered) => setSetup((current) => ({ ...current, includeAnswered }))} label="Incluir preguntas contestadas" /></div>
                <div><span><ListChecks size={17} /> Mezclar opciones</span><Toggle checked={setup.shuffleOptions} onChange={(shuffleOptions) => setSetup((current) => ({ ...current, shuffleOptions }))} label="Mezclar opciones" /></div>
              </div>
              <button className="primary start-button" disabled={!setup.domains.length || !available} onClick={start}><Play size={18} fill="currentColor" /> Iniciar sesión de {Math.min(setup.amount, available)} preguntas</button>
            </section>
          </div>

          {history.length > 0 && <div className="history-note"><History size={17} /><span>Historial local: <strong>{history.length}</strong> preguntas contestadas.</span><button onClick={() => { setHistory([]); localStorage.removeItem(HISTORY_KEY); }}>Borrar historial</button></div>}
          <p className="disclaimer">Producto educativo independiente. No está afiliado, patrocinado ni respaldado por Pearson VUE, el Texas Department of Insurance ni ninguna entidad examinadora. Las preguntas son originales y no son reactivos reales del examen.</p>
        </main>
      </div>
    );
  }

  if (session.status === "submitted") {
    return <Results session={session} questions={activeQuestions} reviewIndex={reviewIndex} setReviewIndex={setReviewIndex} dark={dark} setDark={setDark} onReset={reset} />;
  }

  const question = activeQuestions[session.current];
  const answer = session.answers[question.id];
  const struck = session.strikeouts[question.id] ?? [];
  const highlights = session.highlights[question.id] ?? [];
  const order = session.optionOrders[question.id] ?? ["A", "B", "C", "D"];
  const orderedOptions = order.map((id) => question.options.find((option) => option.id === id)!);
  const immediate = session.setup.explanationMode === "inmediata" && Boolean(answer);
  const answeredCount = Object.keys(session.answers).length;
  const isFlagged = session.flagged.includes(question.id);

  const chooseAnswer = (option: OptionId) => {
    if (answer && !session.setup.allowChanges) return;
    updateSession({ answers: { ...session.answers, [question.id]: option } });
  };
  const toggleStrike = (option: OptionId) => updateSession({ strikeouts: { ...session.strikeouts, [question.id]: struck.includes(option) ? struck.filter((id) => id !== option) : [...struck, option] } });
  const toggleFlag = () => updateSession({ flagged: isFlagged ? session.flagged.filter((id) => id !== question.id) : [...session.flagged, question.id] });
  const addHighlight = () => {
    const selected = window.getSelection()?.toString().trim();
    if (!selected || selected.length < 2 || !question.stem.toLowerCase().includes(selected.toLowerCase())) return;
    if (!highlights.some((item) => item.toLowerCase() === selected.toLowerCase())) updateSession({ highlights: { ...session.highlights, [question.id]: [...highlights, selected] } });
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div className="app-shell exam-shell">
      <header className="topbar exam-topbar">
        <Brand compact />
        <div className="exam-title"><span>{session.setup.domains.length === 8 ? "Simulación integral" : "Práctica por dominios"}</span><strong>Texas General Lines P&amp;C</strong></div>
        <div className="topbar-actions">
          {session.setup.timed && <div className={`timer ${secondsLeft <= 300 ? "urgent" : ""}`}><AlarmClock size={18} /><span>{formatTime(secondsLeft)}</span></div>}
          {!session.setup.timed && <button className="icon-button" onClick={() => setPaused(!paused)} title={paused ? "Continuar" : "Pausar"}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>}
          <ThemeButton dark={dark} onToggle={() => setDark(!dark)} />
        </div>
      </header>
      <div className="progress-strip"><span style={{ width: `${((session.current + 1) / activeQuestions.length) * 100}%` }} /></div>
      <main className="exam-main">
        <aside className={`navigator ${showNavigator ? "open" : ""}`}>
          <div className="navigator-head"><div><LayoutGrid size={18} /><strong>Navegador</strong></div><button className="icon-button mobile-only" onClick={() => setShowNavigator(false)}><X size={18} /></button></div>
          <div className="nav-summary"><span><strong>{answeredCount}</strong> contestadas</span><span><strong>{session.flagged.length}</strong> marcadas</span></div>
          <div className="question-grid">{activeQuestions.map((item, index) => { const answered = Boolean(session.answers[item.id]); const flagged = session.flagged.includes(item.id); return <button key={item.id} className={`${index === session.current ? "current" : ""} ${answered ? "answered" : ""} ${flagged ? "flagged" : ""}`} onClick={() => { updateSession({ current: index }); setShowNavigator(false); }} aria-label={`Pregunta ${index + 1}, ${answered ? "contestada" : "sin contestar"}${flagged ? ", marcada" : ""}`}>{index + 1}{flagged && <Flag size={9} fill="currentColor" />}</button>; })}</div>
          <div className="legend"><span><i className="dot current" /> Actual</span><span><i className="dot answered" /> Contestada</span><span><i className="dot" /> Pendiente</span></div>
          <button className="submit-side" onClick={() => setShowSubmit(true)}>Finalizar sesión</button>
        </aside>

        <section className="question-workspace">
          <div className="question-toolbar">
            <button className="navigator-trigger" onClick={() => setShowNavigator(true)}><LayoutGrid size={17} /> Preguntas</button>
            <span className="question-position">Pregunta <strong>{session.current + 1}</strong> de {activeQuestions.length}</span>
            <div className="question-tools"><button className={highlights.length ? "active" : ""} onClick={addHighlight} title="Selecciona texto del enunciado y presiona para resaltar"><Highlighter size={17} /> <span>Resaltar</span></button><button className={isFlagged ? "active warning" : ""} onClick={toggleFlag}><Flag size={17} fill={isFlagged ? "currentColor" : "none"} /> <span>{isFlagged ? "Marcada" : "Marcar"}</span></button></div>
          </div>
          <div className="question-card">
            <div className="question-meta"><span className="domain-tag">{question.domain}</span><span>{DOMAIN_META[question.domain].short}</span><span>·</span><span>{question.subtopic}</span></div>
            <h1 className="question-text"><HighlightedText text={question.stem} highlights={highlights} /></h1>
            <p className="instruction">Selecciona la mejor respuesta.</p>
            <div className="options" role="radiogroup" aria-label="Opciones de respuesta">
              {orderedOptions.map((option, displayIndex) => {
                const selected = answer === option.id;
                const crossed = struck.includes(option.id);
                const correctState = immediate && option.id === question.correctOption;
                const wrongState = immediate && selected && option.id !== question.correctOption;
                return <div key={option.id} className={`option-wrap ${selected ? "selected" : ""} ${crossed ? "crossed" : ""} ${correctState ? "correct" : ""} ${wrongState ? "wrong" : ""}`}><button className="option-main" role="radio" aria-checked={selected} onClick={() => chooseAnswer(option.id)} disabled={Boolean(answer && !session.setup.allowChanges)}><span className="option-letter">{String.fromCharCode(65 + displayIndex)}</span><span>{option.text}</span>{selected && <CheckCircle2 className="state-icon" size={20} />}</button><button className="strike-button" onClick={() => toggleStrike(option.id)} title={crossed ? "Restaurar opción" : "Tachar opción"} aria-label={crossed ? "Restaurar opción" : "Tachar opción"}><Scissors size={16} /></button>{immediate && <div className="rationale">{correctState ? <CheckCircle2 size={18} /> : <XCircle size={18} />}<span>{option.rationale}</span></div>}</div>;
              })}
            </div>
            {immediate && <div className="explanation"><div><CircleHelp size={19} /><strong>Justificación</strong></div><p>{question.explanation}</p><div className="terms">{question.keyTerms.map((term) => <span key={`${term.es}-${term.en}`}>{term.es} <em>({term.en})</em></span>)}</div></div>}
          </div>
          <footer className="exam-footer"><button className="secondary" disabled={session.current === 0} onClick={() => updateSession({ current: session.current - 1 })}><ArrowLeft size={18} /> Anterior</button><span>{answer ? "Respuesta registrada" : "Sin respuesta"}</span>{session.current < activeQuestions.length - 1 ? <button className="primary" onClick={() => updateSession({ current: session.current + 1 })}>Siguiente <ArrowRight size={18} /></button> : <button className="primary" onClick={() => setShowSubmit(true)}>Revisar y finalizar</button>}</footer>
        </section>
      </main>
      {paused && <div className="pause-overlay"><div><Pause size={28} /><h2>Práctica en pausa</h2><p>El temporizador está desactivado para esta sesión.</p><button className="primary" onClick={() => setPaused(false)}><Play size={18} /> Continuar</button></div></div>}
      {showSubmit && <div className="modal-backdrop"><div className="modal"><div className="modal-icon"><ListChecks size={23} /></div><h2>¿Finalizar la sesión?</h2><p>Has contestado <strong>{answeredCount} de {activeQuestions.length}</strong> preguntas. {activeQuestions.length - answeredCount > 0 && `Quedan ${activeQuestions.length - answeredCount} sin contestar.`}</p><div className="modal-stats"><span><CheckCircle2 size={17} /> {answeredCount} contestadas</span><span><Flag size={17} /> {session.flagged.length} marcadas</span></div><div className="modal-actions"><button className="secondary" onClick={() => setShowSubmit(false)}>Continuar revisando</button><button className="primary" onClick={finish}>Entregar respuestas</button></div></div></div>}
    </div>
  );
}

function Results({ session, questions, reviewIndex, setReviewIndex, dark, setDark, onReset }: { session: SessionState; questions: Question[]; reviewIndex: number; setReviewIndex: (index: number) => void; dark: boolean; setDark: (value: boolean) => void; onReset: () => void }) {
  const score = scoreSession(session, QUESTIONS);
  const [tab, setTab] = useState<"resumen" | "revision">("resumen");
  const question = questions[reviewIndex];
  const selected = question ? session.answers[question.id] : undefined;
  const elapsed = Math.round(((session.submittedAt ?? session.startedAt) - session.startedAt) / 1000);
  return <div className="app-shell results-shell"><header className="topbar public-topbar"><Brand /><div className="topbar-actions"><ThemeButton dark={dark} onToggle={() => setDark(!dark)} /></div></header><main className="results-main"><div className="results-heading"><div><span className="eyebrow">Sesión completada</span><h1>Resultados</h1><p>Desempeño educativo para orientar tu estudio. No representa una calificación oficial.</p></div><button className="primary" onClick={onReset}><RotateCcw size={18} /> Nueva sesión</button></div><div className="tabs"><button className={tab === "resumen" ? "active" : ""} onClick={() => setTab("resumen")}><BarChart3 size={17} /> Resumen</button><button className={tab === "revision" ? "active" : ""} onClick={() => setTab("revision")}><BookOpenCheck size={17} /> Revisar respuestas</button></div>{tab === "resumen" ? <><section className="score-grid"><div className="score-hero panel"><div className="score-ring" style={{ "--score": `${score.percentage * 3.6}deg` } as React.CSSProperties}><div><strong>{score.percentage}%</strong><span>resultado</span></div></div><div><h2>{score.percentage >= 75 ? "Buen dominio general" : "Hay áreas por reforzar"}</h2><p>{score.correct} respuestas correctas de {score.total}.</p></div></div><div className="metric panel"><CheckCircle2 /><strong>{score.correct}</strong><span>Correctas</span></div><div className="metric panel"><XCircle /><strong>{score.incorrect}</strong><span>Incorrectas</span></div><div className="metric panel"><CircleHelp /><strong>{score.unanswered}</strong><span>Sin contestar</span></div><div className="metric panel"><Clock3 /><strong>{formatTime(elapsed)}</strong><span>Tiempo utilizado</span></div></section><section className="panel domain-results"><div className="section-heading"><div><h2>Rendimiento por dominio</h2></div></div><div className="domain-results-list">{Object.entries(score.byDomain).map(([domain, result]) => { const percent = Math.round((result.correct / result.total) * 100); return <div key={domain}><div className="domain-result-label"><span><strong>{domain}</strong> {DOMAIN_META[domain as DomainId].name}</span><span>{result.correct}/{result.total} · <strong>{percent}%</strong></span></div><div className="bar"><span style={{ width: `${percent}%` }} /></div></div>; })}</div></section></> : question && <section className="review-layout"><aside className="review-list">{questions.map((item, index) => { const answer = session.answers[item.id]; const correct = answer === item.correctOption; return <button key={item.id} className={`${index === reviewIndex ? "active" : ""} ${correct ? "correct" : "wrong"}`} onClick={() => setReviewIndex(index)}><span>{index + 1}</span><div><strong>{item.domain}</strong><small>{correct ? "Correcta" : answer ? "Incorrecta" : "Sin contestar"}</small></div>{correct ? <CheckCircle2 size={17} /> : <XCircle size={17} />}</button>; })}</aside><article className="panel review-card"><div className="question-meta"><span className="domain-tag">{question.domain}</span><span>{question.subtopic}</span></div><h2>{question.stem}</h2><div className="review-options">{question.options.map((option) => { const isCorrect = option.id === question.correctOption; const wasSelected = selected === option.id; return <div key={option.id} className={`${isCorrect ? "correct" : ""} ${wasSelected && !isCorrect ? "wrong" : ""}`}><span>{option.id}</span><div><strong>{option.text}</strong><p>{option.rationale}</p></div>{isCorrect && <CheckCircle2 size={19} />}{wasSelected && !isCorrect && <XCircle size={19} />}</div>; })}</div>{session.setup.explanationMode !== "nunca" && <div className="explanation"><div><CircleHelp size={19} /><strong>Explicación</strong></div><p>{question.explanation}</p><div className="terms">{question.keyTerms.map((term) => <span key={term.es}>{term.es} <em>({term.en})</em></span>)}</div><small>Fuente de estudio: {question.source.section}</small></div>}<div className="review-nav"><button className="secondary" disabled={reviewIndex === 0} onClick={() => setReviewIndex(reviewIndex - 1)}><ArrowLeft size={17} /> Anterior</button><span>{reviewIndex + 1} de {questions.length}</span><button className="secondary" disabled={reviewIndex === questions.length - 1} onClick={() => setReviewIndex(reviewIndex + 1)}>Siguiente <ArrowRight size={17} /></button></div></article></section>}</main></div>;
}
