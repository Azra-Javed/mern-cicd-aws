import { useState, useEffect, useRef } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
type StageStatus = "waiting" | "running" | "passed" | "failed";

interface Stage {
  id: string;
  name: string;
  icon: string;
  duration: number;
}

interface StageState {
  status: StageStatus;
  log: string[];
  ms: number;
}

type PipelineStatus = "idle" | "running" | "passed" | "failed";

// ── Constants ────────────────────────────────────────────────────────────────
const STAGES: Stage[] = [
  { id: "checkout", name: "Checkout",    icon: "⬇",  duration: 700  },
  { id: "install",  name: "Install",     icon: "📦",  duration: 1100 },
  { id: "lint",     name: "Lint",        icon: "🔍",  duration: 800  },
  { id: "test",     name: "Test",        icon: "🧪",  duration: 1200 },
  { id: "build",    name: "Build",       icon: "⚙",   duration: 1000 },
  { id: "deploy",   name: "Deploy",      icon: "🚀",  duration: 900  },
];

const STAGE_LOGS: Record<string, string[]> = {
  checkout: ["Cloning repository...", "Checked out branch: main", "Commit: a3f92bc"],
  install:  ["Running npm install...", "Added 847 packages", "No vulnerabilities found"],
  lint:     ["Checking code style...", "ESLint: 0 errors, 2 warnings", "Prettier: all files formatted"],
  test:     ["Running test suite...", "24 tests passed", "Coverage: 91%"],
  build:    ["Compiling TypeScript...", "Bundling assets...", "Build size: 142 KB (gzipped)"],
  deploy:   ["Uploading to S3...", "Invalidating CloudFront cache...", "✓ Live at https://myapp.com"],
};

const FAIL_LOGS: Record<string, string[]> = {
  test:  ["Running test suite...", "FAIL src/auth.test.ts", "Expected 200, received 401 — 1 test failed"],
  lint:  ["Checking code style...", "ESLint: 3 errors found", "Fix errors before proceeding"],
  build: ["Compiling TypeScript...", "error TS2345: Argument of type 'string' is not assignable", "Build failed"],
};

const FAIL_STAGES = ["test", "lint", "build"];

const initStates = (): Record<string, StageState> =>
  Object.fromEntries(STAGES.map((s) => [s.id, { status: "waiting", log: [], ms: 0 }]));

// ── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const fmtMs = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

// ── Component ────────────────────────────────────────────────────────────────
export default function App() {
  const [states, setStates] = useState<Record<string, StageState>>(initStates());
  const [pipeline, setPipeline] = useState<PipelineStatus>("idle");
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [runCount, setRunCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (pipeline === "running") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 100), 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [pipeline]);

  const update = (id: string, patch: Partial<StageState>) =>
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const run = async () => {
    if (pipeline === "running") return;
    setStates(initStates());
    setPipeline("running");
    setActiveStage(null);
    setElapsed(0);
    setRunCount((c) => c + 1);

    const failAt = Math.random() < 0.3
      ? FAIL_STAGES[Math.floor(Math.random() * FAIL_STAGES.length)]
      : null;

    for (const stage of STAGES) {
      setActiveStage(stage.id);
      update(stage.id, { status: "running", log: [], ms: 0 });
      const start = Date.now();
      await sleep(stage.duration);
      const ms = Date.now() - start;
      const didFail = stage.id === failAt;
      const logs = didFail ? (FAIL_LOGS[stage.id] ?? STAGE_LOGS[stage.id]) : STAGE_LOGS[stage.id];
      update(stage.id, { status: didFail ? "failed" : "passed", log: logs, ms });
      if (didFail) { setActiveStage(null); setPipeline("failed"); return; }
    }

    setActiveStage(null);
    setPipeline("passed");
  };

  const reset = () => {
    setStates(initStates());
    setPipeline("idle");
    setActiveStage(null);
    setElapsed(0);
  };

  const passedCount = STAGES.filter((s) => states[s.id].status === "passed").length;

  return (
    <div style={s.root}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <span style={s.brandDot} />
          <span style={s.brandName}>FlowCI</span>
        </div>
        <nav style={s.nav}>
          {[
            { icon: "◈", label: "Pipelines", active: true },
            { icon: "⊞", label: "Projects",  active: false },
            { icon: "◎", label: "Settings",  active: false },
          ].map((item) => (
            <div key={item.label} style={{ ...s.navItem, ...(item.active ? s.navActive : {}) }}>
              <span style={s.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
        <div style={s.sideStats}>
          {[
            { label: "Runs",   val: String(runCount), color: "#94a3b8" },
            { label: "Status", val: pipeline.toUpperCase(),
              color: pipeline === "passed" ? "#4ade80" : pipeline === "failed" ? "#f87171" : pipeline === "running" ? "#facc15" : "#64748b" },
            { label: "Time",   val: fmtMs(elapsed), color: "#94a3b8" },
          ].map(({ label, val, color }) => (
            <div key={label} style={s.statRow}>
              <span style={s.statLabel}>{label}</span>
              <span style={{ ...s.statVal, color }}>{val}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main style={s.main}>
        <header style={s.header}>
          <div>
            <p style={s.eyebrow}>main → production</p>
            <h1 style={s.title}>Pipeline Run</h1>
          </div>
          <div style={s.actions}>
            <button style={s.btnGhost} onClick={reset} disabled={pipeline === "running"}>Reset</button>
            <button style={{ ...s.btnPrimary, opacity: pipeline === "running" ? 0.5 : 1 }} onClick={run} disabled={pipeline === "running"}>
              {pipeline === "running" ? "Running…" : "▶  Run Pipeline"}
            </button>
          </div>
        </header>

        {/* Progress */}
        <div style={s.track}>
          <div style={{
            ...s.bar,
            width: `${(passedCount / STAGES.length) * 100}%`,
            background: pipeline === "failed" ? "#f87171" : pipeline === "passed" ? "#4ade80" : "#818cf8",
          }} />
        </div>

        {/* Cards */}
        <div style={s.grid}>
          {STAGES.map((stage, i) => {
            const st = states[stage.id];
            const isActive = activeStage === stage.id;
            const borderColor =
              st.status === "passed" ? "#4ade80" :
              st.status === "failed" ? "#f87171" :
              st.status === "running" ? "#818cf8" : "#1e293b";

            return (
              <div key={stage.id} style={{
                ...s.card,
                borderColor,
                boxShadow: isActive ? `0 0 0 1px ${borderColor}30, 0 4px 20px ${borderColor}15` : "none",
              }}>
                <div style={s.cardTop}>
                  <div style={{
                    ...s.cardIcon,
                    background: st.status === "passed" ? "#14532d" : st.status === "failed" ? "#450a0a" : st.status === "running" ? "#1e1b4b" : "#0f172a",
                  }}>
                    {st.status === "running" ? <span style={s.spin}>◌</span> : <span>{stage.icon}</span>}
                  </div>
                  <div style={s.cardMeta}>
                    <span style={s.cardStep}>STEP {i + 1}</span>
                    <span style={s.cardName}>{stage.name}</span>
                  </div>
                  <span style={{
                    ...s.badge,
                    background: st.status === "passed" ? "#14532d" : st.status === "failed" ? "#450a0a" : st.status === "running" ? "#1e1b4b" : "#0f172a",
                    color: st.status === "passed" ? "#4ade80" : st.status === "failed" ? "#f87171" : st.status === "running" ? "#818cf8" : "#475569",
                  }}>
                    {st.status === "waiting" ? "—" : st.status === "running" ? "running" : st.status === "passed" ? "✓ passed" : "✗ failed"}
                  </span>
                </div>

                {st.ms > 0 && <div style={s.cardTime}>{fmtMs(st.ms)}</div>}

                {st.log.length > 0 && (
                  <div style={s.logBox}>
                    {st.log.map((line, j) => (
                      <div key={j} style={{
                        ...s.logLine,
                        color: line.startsWith("✓") ? "#4ade80"
                             : line.toLowerCase().includes("fail") || line.toLowerCase().includes("error") ? "#f87171"
                             : "#94a3b8",
                      }}>{line}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Result Banner */}
        {pipeline === "passed" && (
          <div style={{ ...s.banner, borderColor: "#4ade80", background: "#052e16" }}>
            <span style={{ fontSize: "22px" }}>🎉</span>
            <div>
              <p style={{ ...s.bannerTitle, color: "#4ade80" }}>Pipeline passed</p>
              <p style={s.bannerSub}>All 6 stages completed · {fmtMs(elapsed)} total</p>
            </div>
          </div>
        )}
        {pipeline === "failed" && (
          <div style={{ ...s.banner, borderColor: "#f87171", background: "#2d0707" }}>
            <span style={{ fontSize: "22px" }}>❌</span>
            <div>
              <p style={{ ...s.bannerTitle, color: "#f87171" }}>Pipeline failed</p>
              <p style={s.bannerSub}>{passedCount} of {STAGES.length} stages completed · fix errors and re-run</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  root: { display: "flex", minHeight: "100vh", background: "#080f1e", color: "#e2e8f0", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", fontSize: "14px" },

  sidebar: { width: "200px", background: "#0d1627", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0 },
  brand: { display: "flex", alignItems: "center", gap: "10px", padding: "0 20px 28px", borderBottom: "1px solid #1e293b" },
  brandDot: { width: "8px", height: "8px", borderRadius: "50%", background: "#818cf8", boxShadow: "0 0 8px #818cf8" },
  brandName: { fontWeight: 700, fontSize: "16px", letterSpacing: "-0.3px", color: "#f1f5f9" },
  nav: { padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px" },
  navItem: { display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "8px", color: "#475569", cursor: "pointer", fontSize: "13px", fontWeight: 500 },
  navActive: { background: "#1e293b", color: "#e2e8f0" },
  navIcon: { fontSize: "15px" },
  sideStats: { marginTop: "auto", padding: "20px", borderTop: "1px solid #1e293b", display: "flex", flexDirection: "column", gap: "12px" },
  statRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  statLabel: { color: "#475569", fontSize: "12px" },
  statVal: { fontWeight: 700, fontSize: "12px", fontVariantNumeric: "tabular-nums" },

  main: { flex: 1, display: "flex", flexDirection: "column", padding: "32px", gap: "24px", overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end" },
  eyebrow: { margin: "0 0 4px", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", color: "#475569" },
  title: { margin: 0, fontSize: "22px", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.4px" },
  actions: { display: "flex", gap: "10px", alignItems: "center" },
  btnGhost: { background: "transparent", border: "1px solid #1e293b", color: "#64748b", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 500 },
  btnPrimary: { background: "#4f46e5", border: "none", color: "#fff", padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, letterSpacing: "0.2px" },

  track: { height: "3px", background: "#1e293b", borderRadius: "99px", overflow: "hidden" },
  bar: { height: "100%", borderRadius: "99px", transition: "width 0.4s ease, background 0.3s" },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" },
  card: { background: "#0d1627", border: "1px solid", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", transition: "border-color 0.3s, box-shadow 0.3s" },
  cardTop: { display: "flex", alignItems: "center", gap: "12px" },
  cardIcon: { width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 },
  cardMeta: { display: "flex", flexDirection: "column", gap: "2px", flex: 1 },
  cardStep: { fontSize: "10px", letterSpacing: "1px", color: "#475569", fontWeight: 600 },
  cardName: { fontSize: "14px", fontWeight: 600, color: "#f1f5f9" },
  badge: { fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", flexShrink: 0, letterSpacing: "0.2px" },
  cardTime: { fontSize: "11px", color: "#475569", fontVariantNumeric: "tabular-nums" },
  logBox: { background: "#060d1a", borderRadius: "6px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "4px" },
  logLine: { fontSize: "11px", lineHeight: "1.6", fontFamily: "'JetBrains Mono','Fira Code',monospace" },

  spin: { display: "inline-block", animation: "spin 1s linear infinite", fontSize: "16px", color: "#818cf8" },

  banner: { border: "1px solid", borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px" },
  bannerTitle: { margin: "0 0 2px", fontWeight: 700, fontSize: "15px" },
  bannerSub: { margin: 0, color: "#64748b", fontSize: "12px" },
};
