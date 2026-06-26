import { useState } from "react";

type Stage = "code" | "build" | "test" | "deploy" | "live";

interface PipelineStage {
  id: Stage;
  label: string;
  icon: string;
  description: string;
  duration: number;
}

const stages: PipelineStage[] = [
  { id: "code",   label: "Code",   icon: "✏️", description: "Push your code to GitHub", duration: 800 },
  { id: "build",  label: "Build",  icon: "⚙️", description: "Install dependencies & compile", duration: 1200 },
  { id: "test",   label: "Test",   icon: "🧪", description: "Run unit & integration tests", duration: 1000 },
  { id: "deploy", label: "Deploy", icon: "🚀", description: "Upload to S3 & invalidate CDN", duration: 900 },
  { id: "live",   label: "Live",   icon: "✅", description: "Your site is live!", duration: 0 },
];

type Status = "idle" | "running" | "done" | "failed";

export default function App() {
  const [current, setCurrent] = useState<number>(-1);
  const [status, setStatus] = useState<Status>("idle");
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) =>
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const runPipeline = async () => {
    setStatus("running");
    setCurrent(-1);
    setLog([]);
    addLog("🔁 Pipeline started...");

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      setCurrent(i);
      addLog(`▶ ${stage.label}: ${stage.description}`);

      await new Promise((r) => setTimeout(r, stage.duration));

      // Simulate random test failure
      if (stage.id === "test" && Math.random() < 0.2) {
        addLog("❌ Tests failed! Fix your code and retry.");
        setStatus("failed");
        return;
      }

      addLog(`✔ ${stage.label} complete`);
    }

    addLog("🎉 Deployment successful! Site is live.");
    setStatus("done");
  };

  const reset = () => {
    setCurrent(-1);
    setStatus("idle");
    setLog([]);
  };

  const getStageColor = (index: number) => {
    if (status === "failed" && index === current) return "#ef4444";
    if (index < current || status === "done") return "#22c55e";
    if (index === current) return "#f59e0b";
    return "#334155";
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.badge}>CI/CD</span>
        <h1 style={styles.title}>Pipeline Simulator</h1>
        <p style={styles.subtitle}>Watch your code go from commit → live</p>
      </div>

      {/* Pipeline Stages */}
      <div style={styles.pipeline}>
        {stages.map((stage, i) => (
          <div key={stage.id} style={styles.stageWrapper}>
            <div
              style={{
                ...styles.stageBox,
                borderColor: getStageColor(i),
                boxShadow: i === current && status === "running"
                  ? `0 0 16px ${getStageColor(i)}66`
                  : "none",
              }}
            >
              <span style={styles.stageIcon}>{stage.icon}</span>
              <span style={{ ...styles.stageLabel, color: getStageColor(i) }}>
                {stage.label}
              </span>
              {i === current && status === "running" && (
                <span style={styles.spinner}>⏳</span>
              )}
            </div>
            {i < stages.length - 1 && (
              <div
                style={{
                  ...styles.arrow,
                  color: i < current || status === "done" ? "#22c55e" : "#334155",
                }}
              >
                →
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Status Banner */}
      {status === "done" && (
        <div style={{ ...styles.banner, background: "#14532d", borderColor: "#22c55e" }}>
          🎉 Site deployed successfully!
        </div>
      )}
      {status === "failed" && (
        <div style={{ ...styles.banner, background: "#450a0a", borderColor: "#ef4444" }}>
          ❌ Pipeline failed at <strong>Test</strong> stage. Fix & retry!
        </div>
      )}

      {/* Buttons */}
      <div style={styles.btnRow}>
        <button
          style={{
            ...styles.btn,
            background: status === "running" ? "#334155" : "#6366f1",
            cursor: status === "running" ? "not-allowed" : "pointer",
          }}
          onClick={runPipeline}
          disabled={status === "running"}
        >
          {status === "running" ? "Running..." : "▶ Run Pipeline"}
        </button>
        <button style={{ ...styles.btn, background: "#334155" }} onClick={reset}>
          ↺ Reset
        </button>
      </div>

      {/* Log Console */}
      {log.length > 0 && (
        <div style={styles.console}>
          <div style={styles.consoleHeader}>
            <span style={styles.dot} />
            <span style={styles.dot} />
            <span style={styles.dot} />
            <span style={styles.consoleTitle}>pipeline.log</span>
          </div>
          <div style={styles.consoleBody}>
            {log.map((line, i) => (
              <div key={i} style={styles.logLine}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={styles.hint}>
        💡 There's a 20% chance the test stage fails — just like real CI/CD!
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    color: "#e2e8f0",
    fontFamily: "'Courier New', monospace",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 20px",
    gap: "28px",
  },
  header: {
    textAlign: "center",
  },
  badge: {
    background: "#6366f1",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "2px",
    padding: "4px 12px",
    borderRadius: "20px",
    textTransform: "uppercase",
  },
  title: {
    fontSize: "32px",
    fontWeight: 800,
    margin: "12px 0 6px",
    color: "#f1f5f9",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "14px",
    margin: 0,
  },
  pipeline: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
    justifyContent: "center",
  },
  stageWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  stageBox: {
    border: "2px solid",
    borderRadius: "12px",
    padding: "14px 18px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    minWidth: "80px",
    transition: "all 0.3s ease",
    background: "#1e293b",
  },
  stageIcon: {
    fontSize: "22px",
  },
  stageLabel: {
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  spinner: {
    fontSize: "12px",
    animation: "spin 1s linear infinite",
  },
  arrow: {
    fontSize: "20px",
    fontWeight: 700,
    transition: "color 0.3s",
  },
  banner: {
    border: "1px solid",
    borderRadius: "10px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: 600,
  },
  btnRow: {
    display: "flex",
    gap: "12px",
  },
  btn: {
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 28px",
    fontSize: "14px",
    fontWeight: 700,
    letterSpacing: "0.5px",
    transition: "opacity 0.2s",
  },
  console: {
    width: "100%",
    maxWidth: "600px",
    background: "#0a0f1e",
    borderRadius: "12px",
    border: "1px solid #1e293b",
    overflow: "hidden",
  },
  consoleHeader: {
    background: "#1e293b",
    padding: "10px 16px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#475569",
  },
  consoleTitle: {
    marginLeft: "8px",
    fontSize: "12px",
    color: "#64748b",
  },
  consoleBody: {
    padding: "16px",
    maxHeight: "200px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  logLine: {
    fontSize: "12px",
    color: "#94a3b8",
    lineHeight: "1.6",
  },
  hint: {
    fontSize: "12px",
    color: "#475569",
    textAlign: "center",
  },
};
