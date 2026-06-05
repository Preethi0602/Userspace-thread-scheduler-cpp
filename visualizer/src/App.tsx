import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ──────────────────────────────────────────────
type ThreadState = "READY" | "RUNNING" | "BLOCKED" | "FINISHED";
type Policy = "ROUND_ROBIN" | "PRIORITY" | "CFS";

interface Thread {
  id: number;
  name: string;
  state: ThreadState;
  priority: number;
  vruntime: number;
  steps: number;
  maxSteps: number;
  color: string;
}

interface LogEntry {
  time: number;
  message: string;
  type: "info" | "switch" | "finish" | "sync";
}

interface TimelineEntry {
  threadName: string;
  color: string;
}

// ── Constants ──────────────────────────────────────────
const COLORS = [
  "#a855f7", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6",
];

const POLICY_LABELS: Record<Policy, string> = {
  ROUND_ROBIN: "Round Robin",
  PRIORITY: "Priority",
  CFS: "CFS",
};

// ── Scheduler Logic ────────────────────────────────────
function pickNext(threads: Thread[], policy: Policy): Thread | null {
  const ready = threads.filter((t) => t.state === "READY");
  if (ready.length === 0) return null;
  if (policy === "ROUND_ROBIN") return ready[0];
  if (policy === "PRIORITY")
    return ready.reduce((a, b) => (b.priority > a.priority ? b : a));
  if (policy === "CFS")
    return ready.reduce((a, b) => (b.vruntime < a.vruntime ? b : a));
  return ready[0];
}

// ── Main App ───────────────────────────────────────────
export default function App() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [policy, setPolicy] = useState<Policy>("ROUND_ROBIN");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [tick, setTick] = useState(0);
  const [newName, setNewName] = useState("");
  const [newPriority, setNewPriority] = useState(5);
  const [colorIdx, setColorIdx] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (logRef.current)
      logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const addLog = useCallback(
    (message: string, type: LogEntry["type"] = "info") => {
      setLogs((prev) => [...prev, { time: Date.now(), message, type }]);
    },
    []
  );

  const addThread = () => {
    const name = newName.trim() || `Thread${threads.length + 1}`;
    const color = COLORS[colorIdx % COLORS.length];
    const thread: Thread = {
      id: threads.length,
      name,
      state: "READY",
      priority: newPriority,
      vruntime: 0,
      steps: 0,
      maxSteps: Math.floor(Math.random() * 4) + 2,
      color,
    };
    setThreads((prev) => [...prev, thread]);
    setColorIdx((c) => c + 1);
    setNewName("");
    addLog(
      `[Scheduler] Created thread: ${name} (priority=${newPriority})`,
      "info"
    );
  };

  const step = useCallback(() => {
    setThreads((prev) => {
      const current = prev.find((t) => t.state === "RUNNING");
      let next = [...prev];

      if (current) {
        next = next.map((t) => {
          if (t.id !== current.id) return t;
          const newSteps = t.steps + 1;
          const newVruntime = t.vruntime + 1;
          if (newSteps >= t.maxSteps) {
            addLog(`[Thread ${t.name}] Finished`, "finish");
            return { ...t, steps: newSteps, vruntime: newVruntime, state: "FINISHED" as ThreadState };
          }
          addLog(`[Thread ${t.name}] Step ${newSteps} -- yielding`, "info");
          return { ...t, steps: newSteps, vruntime: newVruntime, state: "READY" as ThreadState };
        });
      }

      const chosen = pickNext(next, policy);
      if (chosen) {
        next = next.map((t) =>
          t.id === chosen.id ? { ...t, state: "RUNNING" as ThreadState } : t
        );
        if (current?.id !== chosen.id) {
          addLog(
            `Context switch: ${current?.name ?? "main"} -> ${chosen.name}`,
            "switch"
          );
        }
        setTimeline((tl) => [
          ...tl,
          { threadName: chosen.name, color: chosen.color },
        ]);
      }

      setTick((t) => t + 1);
      return next;
    });
  }, [policy, addLog]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setThreads((prev) => {
          const allDone = prev.every(
            (t) => t.state === "FINISHED" || t.state === "BLOCKED"
          );
          if (allDone || prev.length === 0) {
            setRunning(false);
            addLog("[Scheduler] All threads finished", "finish");
          }
          return prev;
        });
        step();
      }, 1000 / speed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, speed, step, addLog]);

  const reset = () => {
    setThreads([]);
    setLogs([]);
    setTimeline([]);
    setRunning(false);
    setTick(0);
    setColorIdx(0);
    addLog("[Scheduler] Reset", "info");
  };

  const allDone =
    threads.length > 0 &&
    threads.every((t) => t.state === "FINISHED" || t.state === "BLOCKED");

  return (
    <div className="min-h-screen bg-[#12100a] text-white font-mono p-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-400 tracking-widest uppercase">
            Thread Scheduler Visualizer
          </h1>
          <p className="text-xs text-amber-600 mt-1">
            Userspace context switching (built in C++ and TypeScript)
          </p>
        </div>
        <a
          href="https://github.com/Preethi0602"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-amber-400 border border-amber-700 px-3 py-1 rounded hover:bg-amber-900 transition"
        >
          GitHub
        </a>
      </div>

      {/* Controls Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        {/* Policy Selector */}
        <div className="bg-[#12100a] border border-amber-900 rounded-xl p-4">
          <p className="text-xs text-amber-500 mb-2 uppercase tracking-widest">
            Scheduling Policy
          </p>
          <div className="flex gap-2">
            {(["ROUND_ROBIN", "PRIORITY", "CFS"] as Policy[]).map((p) => (
              <button
                key={p}
                onClick={() => setPolicy(p)}
                className={`flex-1 text-xs py-2 rounded-lg border transition font-bold ${
                  policy === p
                    ? "bg-amber-600 border-amber-400 text-white"
                    : "border-amber-800 text-amber-500 hover:border-amber-500"
                }`}
              >
                {POLICY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Speed */}
        <div className="bg-[#12100a] border border-amber-900 rounded-xl p-4">
          <p className="text-xs text-amber-500 mb-2 uppercase tracking-widest">
            Speed: {speed}x
          </p>
          <input
            type="range"
            min={1}
            max={8}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="bg-[#12100a] border border-amber-900 rounded-xl p-4 flex items-center gap-2">
          <button
            onClick={() => setRunning((r) => !r)}
            disabled={threads.length === 0 || allDone}
            className="flex-1 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:opacity-30 text-sm font-bold transition"
          >
            {running ? "Pause" : "Auto Run"}
          </button>
          <button
            onClick={step}
            disabled={threads.length === 0 || allDone || running}
            className="flex-1 py-2 rounded-lg border border-amber-700 hover:bg-amber-900 disabled:opacity-30 text-sm font-bold transition"
          >
            Step
          </button>
          <button
            onClick={reset}
            className="flex-1 py-2 rounded-lg border border-amber-800 hover:bg-[#12100a] text-sm font-bold transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Add Thread */}
      <div className="bg-[#12100a] border border-amber-900 rounded-xl p-4 mb-6 flex gap-3 items-end">
        <div className="flex-1">
          <p className="text-xs text-amber-500 mb-1 uppercase tracking-widest">
            Thread Name
          </p>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addThread()}
            placeholder="e.g. Producer"
            className="w-full bg-[#12100a] border border-amber-800 rounded-lg px-3 py-2 text-sm text-amber-200 placeholder-purple-800 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="w-32">
          <p className="text-xs text-amber-500 mb-1 uppercase tracking-widest">
            Priority: {newPriority}
          </p>
          <input
            type="range"
            min={1}
            max={10}
            value={newPriority}
            onChange={(e) => setNewPriority(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>
        <button
          onClick={addThread}
          className="px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded-lg text-sm font-bold transition"
        >
          + Add Thread
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* Thread List */}
        <div className="bg-[#12100a] border border-amber-900 rounded-xl p-4">
          <p className="text-xs text-amber-500 mb-3 uppercase tracking-widest">
            Threads
          </p>
          {threads.length === 0 && (
            <p className="text-amber-400 text-sm text-center py-8">
              No threads yet - add some above!
            </p>
          )}
          <div className="space-y-3">
            {threads.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 p-3 rounded-lg border transition-all duration-300"
                style={{
                  borderColor:
                    t.state === "RUNNING" ? t.color : "#2d2000",
                  backgroundColor:
                    t.state === "RUNNING" ? `${t.color}15` : "transparent",
                  boxShadow:
                    t.state === "RUNNING"
                      ? `0 0 12px ${t.color}40`
                      : "none",
                }}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: t.color,
                    boxShadow:
                      t.state === "RUNNING" ? `0 0 8px ${t.color}` : "none",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-bold truncate"
                      style={{ color: t.color }}
                    >
                      {t.name}
                    </span>
                    <span className="text-xs text-amber-600">
                      P:{t.priority}
                    </span>
                    <span className="text-xs text-amber-600">
                      vrt:{t.vruntime.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 bg-[#12100a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(t.steps / t.maxSteps) * 100}%`,
                        backgroundColor: t.color,
                      }}
                    />
                  </div>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full border flex-shrink-0"
                  style={{
                    borderColor:
                      t.state === "RUNNING" ? t.color : "#b45309",
                    color: t.state === "RUNNING" ? t.color : "#d97706",
                    backgroundColor:
                      t.state === "RUNNING" ? `${t.color}20` : "transparent",
                  }}
                >
                  {t.state}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Console */}
        <div className="bg-[#12100a] border border-amber-900 rounded-xl p-4 flex flex-col">
          <p className="text-xs text-amber-500 mb-3 uppercase tracking-widest">
            Console
          </p>
          <div ref={logRef} className="flex-1 overflow-y-auto space-y-1 max-h-72">
            {logs.length === 0 && (
              <p className="text-amber-400 text-sm text-center py-8">
                Waiting for events...
              </p>
            )}
            {logs.map((log, i) => (
              <div
                key={i}
                className={`text-xs px-2 py-0.5 rounded ${
                  log.type === "switch"
                    ? "text-cyan-400"
                    : log.type === "finish"
                    ? "text-green-400"
                    : log.type === "sync"
                    ? "text-amber-400"
                    : "text-amber-300"
                }`}
              >
                {"> "}{log.message}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CPU Timeline */}
      <div className="bg-[#12100a] border border-amber-900 rounded-xl p-4">
        <p className="text-xs text-amber-500 mb-3 uppercase tracking-widest">
          CPU Timeline (tick: {tick})
        </p>
        <div className="flex flex-wrap gap-1">
          {timeline.length === 0 && (
            <p className="text-amber-400 text-sm">No execution yet...</p>
          )}
          {timeline.map((t, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: `${t.color}30`,
                border: `1px solid ${t.color}`,
                color: t.color,
              }}
              title={t.threadName}
            >
              {t.threadName.charAt(0)}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center text-xs text-amber-400">
        Built with C++ (ucontext_t) + React + TypeScript
      </div>
    </div>
  );
}