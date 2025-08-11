"use client";
import React, { useEffect, useRef, useState } from "react";
import RecipeManager from "./components/RecipeManager";

// Basic multi-stopwatch manager for a single Next.js page (App Router)
// - Create/Delete stopwatches
// - Start/Stop/Reset
// - Rename each stopwatch
// - Persists to localStorage
// - Timekeeping is based on Date.now(), so it stays correct across tab backgrounding or sleep
//   and "catches up" when you return.

type Stopwatch = {
  id: string;
  name: string;
  isRunning: boolean;
  startedAt: number | null; // epoch ms when last started
  elapsed: number; // accumulated ms when NOT running
};

const STORAGE_KEY = "multi-stopwatches-v1";

const now = () => Date.now();

function format(ms: number): string {
  const negative = ms < 0;
  if (negative) ms = -ms;
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1_000);
  const hundredths = Math.floor((ms % 1_000) / 10);
  const h = hours > 0 ? String(hours).padStart(2, "0") + ":" : "";
  const m = String(minutes).padStart(2, "0");
  const s = String(seconds).padStart(2, "0");
  const hs = String(hundredths).padStart(2, "0");
  return `${negative ? "-" : ""}${h}${m}:${s}.${hs}`;
}

export default function Page() {
  const [stopwatches, setStopwatches] = useState<Stopwatch[]>([]);
  // "tick" just forces a re-render so the displayed time updates.
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const [showRecipes, setShowRecipes] = useState(false);

  // Load from localStorage on first mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Stopwatch[];
        setStopwatches(parsed);
      } else {
        setStopwatches([
          {
            id: crypto.randomUUID(),
            name: "Stopwatch 1",
            isRunning: false,
            startedAt: null,
            elapsed: 0,
          },
        ]);
      }
    } catch (e) {
      console.error("Failed to load stopwatches", e);
    }
  }, []);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stopwatches));
    } catch (e) {
      console.error("Failed to persist stopwatches", e);
    }
  }, [stopwatches]);

  // Lightweight render loop for the on-screen time (not the source of truth)
  useEffect(() => {
    // Update 50x/sec for smooth hundredths display
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => setTick(Date.now()), 20);

    const onWake = () => setTick(Date.now());
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
    };
  }, []);

  const computedElapsed = (sw: Stopwatch) => {
    if (sw.isRunning && sw.startedAt != null) {
      return sw.elapsed + (now() - sw.startedAt);
    }
    return sw.elapsed;
  };

  const addStopwatch = () =>
    setStopwatches((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: `Stopwatch ${prev.length + 1}`,
        isRunning: false,
        startedAt: null,
        elapsed: 0,
      },
    ]);

  const deleteStopwatch = (id: string) =>
    setStopwatches((prev) => prev.filter((sw) => sw.id !== id));

  const start = (id: string) =>
    setStopwatches((prev) =>
      prev.map((sw) =>
        sw.id === id && !sw.isRunning
          ? { ...sw, isRunning: true, startedAt: now() }
          : sw
      )
    );

  const stop = (id: string) =>
    setStopwatches((prev) =>
      prev.map((sw) => {
        if (sw.id === id && sw.isRunning && sw.startedAt != null) {
          return {
            ...sw,
            isRunning: false,
            elapsed: sw.elapsed + (now() - sw.startedAt),
            startedAt: null,
          };
        }
        return sw;
      })
    );

  const reset = (id: string) =>
    setStopwatches((prev) =>
      prev.map((sw) =>
        sw.id === id
          ? { ...sw, elapsed: 0, startedAt: null, isRunning: false }
          : sw
      )
    );

  const rename = (id: string, name: string) =>
    setStopwatches((prev) => prev.map((sw) => (sw.id === id ? { ...sw, name } : sw)));

  return (
    <main className="container">
      <header className="top">
        <h1>Stopwatch Manager</h1>
        <div className="header-actions">
          <div className="tabs">
            <button 
              className={`tab ${!showRecipes ? 'active' : ''}`}
              onClick={() => setShowRecipes(false)}
            >
              Stopwatches
            </button>
            <button 
              className={`tab ${showRecipes ? 'active' : ''}`}
              onClick={() => setShowRecipes(true)}
            >
              Recipes
            </button>
          </div>
          {!showRecipes && (
            <button className="primary" onClick={addStopwatch} aria-label="Add a stopwatch">
              Add Stopwatch
            </button>
          )}
        </div>
      </header>

      {!showRecipes ? (
        <>
          <p className="hint">
            Create, label, and control multiple stopwatches.
          </p>

          <section className="grid">
        {stopwatches.map((sw) => (
          <article key={sw.id} className={`card ${sw.isRunning ? "running" : ""}`}>
            <input
              className="name"
              value={sw.name}
              onChange={(e) => rename(sw.id, e.target.value)}
              placeholder="Label (e.g., Salmon cooking time)"
              aria-label="Stopwatch name"
            />

            <div className="time" aria-live="polite">
              {format(computedElapsed(sw))}
            </div>

            <div className="actions">
              {sw.isRunning ? (
                <button
                  className="secondary"
                  onClick={() => stop(sw.id)}
                  aria-label={`Stop ${sw.name}`}
                >
                  Stop
                </button>
              ) : (
                <button
                  className="primary"
                  onClick={() => start(sw.id)}
                  aria-label={`Start ${sw.name}`}
                >
                  Start
                </button>
              )}

              <button onClick={() => reset(sw.id)} title="Reset to 00:00.00">
                Reset
              </button>

              <button
                className="danger"
                onClick={() => deleteStopwatch(sw.id)}
                title="Delete"
                aria-label={`Delete ${sw.name}`}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
          </section>
        </>
      ) : (
        <RecipeManager />
      )}

      <style jsx>{`
        .container { max-width: 960px; margin: 0 auto; padding: 24px; font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; }
        .top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
        h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
        .header-actions { display: flex; align-items: center; gap: 16px; }
        .tabs { display: flex; gap: 4px; background: #f3f4f6; padding: 4px; border-radius: 12px; }
        .tab { appearance: none; border: none; background: transparent; padding: 8px 16px; font-weight: 600; cursor: pointer; border-radius: 8px; transition: all 0.2s; }
        .tab:hover { background: rgba(0,0,0,0.05); }
        .tab.active { background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .hint { color: #6b7280; margin: 0 0 18px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
        .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .card.running { border-color: #22c55e; box-shadow: 0 6px 18px rgba(34,197,94,0.15); }
        .name { width: 100%; font-size: 14px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 8px 10px; margin-bottom: 10px; }
        .time { font-variant-numeric: tabular-nums; font-size: 32px; line-height: 1.2; font-weight: 800; margin: 4px 0 12px; }
        .actions { display: flex; gap: 8px; flex-wrap: wrap; }
        button { appearance: none; border: 1px solid #e5e7eb; background: #f9fafb; border-radius: 9999px; padding: 8px 14px; font-weight: 700; cursor: pointer; }
        button:hover { background: #f3f4f6; }
        button.primary { background: #111827; color: white; border-color: #111827; }
        button.primary:hover { background: #000; }
        button.secondary { background: #fff7ed; border-color: #f59e0b; color: #92400e; }
        button.secondary:hover { background: #ffedd5; }
        button.danger { background: #fef2f2; border-color: #ef4444; color: #991b1b; margin-left: auto; }
        button.danger:hover { background: #fee2e2; }
        @media (prefers-color-scheme: dark) {
          .container { background: #0b0b0c; color: #e5e7eb; }
          .card { background: #111214; border-color: #26272b; }
          .name { background: #0b0b0c; border-color: #26272b; color: #e5e7eb; }
          .hint { color: #9ca3af; }
          .tabs { background: #1a1b1e; }
          .tab:hover { background: rgba(255,255,255,0.05); }
          .tab.active { background: #26272b; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
          button { border-color: #26272b; background: #1a1b1e; color: #e5e7eb; }
          button:hover { background: #232428; }
          button.primary { background: #e5e7eb; color: #111827; border-color: #e5e7eb; }
          button.primary:hover { background: #fff; }
          .secondary { background: #2b1d0f; border-color: #b45309; color: #fbbf24; }
          .danger { background: #2b1617; border-color: #ef4444; color: #fecaca; }
        }
      `}</style>
    </main>
  );
}
