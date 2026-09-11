import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, SkipForward, Flame } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/contexts/LocaleContext";

type Mode = "focus" | "short" | "long";

const DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const SESSIONS_KEY = "mr_pomodoro_sessions";
const CYCLE_KEY = "mr_pomodoro_cycle";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readSessionsToday(): number {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    return data.date === todayKey() ? data.count : 0;
  } catch {
    return 0;
  }
}

function writeSessionsToday(count: number) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify({ date: todayKey(), count }));
  } catch {}
}

// Simple synthesized beep so a session completion is audible without any external asset.
function playChime() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [880, 1108].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.4);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {}
}

export function PomodoroWidget() {
  const { t } = useLocale();
  const [mode, setMode] = useState<Mode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [cycle, setCycle] = useState(0); // completed focus sessions in current 4-cycle
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSessionsToday(readSessionsToday());
    try {
      const c = Number(localStorage.getItem(CYCLE_KEY) || 0);
      if (!Number.isNaN(c)) setCycle(c);
    } catch {}
  }, []);

  const switchMode = useCallback(
    (next: Mode, autoStart: boolean) => {
      setMode(next);
      setSecondsLeft(DURATIONS[next]);
      setRunning(autoStart);
    },
    []
  );

  const handleComplete = useCallback(() => {
    playChime();
    if (mode === "focus") {
      const nextCount = sessionsToday + 1;
      setSessionsToday(nextCount);
      writeSessionsToday(nextCount);
      const nextCycle = (cycle + 1) % 4;
      setCycle(nextCycle);
      try {
        localStorage.setItem(CYCLE_KEY, String(nextCycle));
      } catch {}
      toast.success(t("pomodoroDone"));
      switchMode(nextCycle === 0 ? "long" : "short", false);
    } else {
      toast.success(t("pomodoroBreakDone"));
      switchMode("focus", false);
    }
  }, [mode, sessionsToday, cycle, switchMode, t]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          handleComplete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, handleComplete]);

  const toggleRunning = () => setRunning((r) => !r);
  const reset = () => {
    setRunning(false);
    setSecondsLeft(DURATIONS[mode]);
  };
  const skip = () => {
    setRunning(false);
    if (mode === "focus") {
      handleComplete();
    } else {
      switchMode("focus", false);
    }
  };

  const total = DURATIONS[mode];
  const progress = 1 - secondsLeft / total;
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  const modeColor =
    mode === "focus" ? "widget-focus" : mode === "short" ? "widget-habits" : "primary";

  return (
    <div className="glass-card glass-card-hover rounded-xl p-5 animate-fade-in" style={{ animationDelay: "150ms" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-widget-focus" />
            {t("pomodoroTitle")}
          </h3>
          <p className="text-sm text-muted-foreground">{t("pomodoroSubtitle")}</p>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-widget-focus bg-widget-focus/10 border border-widget-focus/20 rounded-full px-2.5 py-1">
          <Flame className="w-3.5 h-3.5" />
          {sessionsToday} {t("pomodoroSessionsToday")}
        </span>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1.5 mb-5 p-1 rounded-lg bg-secondary/50">
        {(["focus", "short", "long"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m, false)}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
              mode === m
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "focus" ? t("pomodoroFocus") : m === "short" ? t("pomodoroShortBreak") : t("pomodoroLongBreak")}
          </button>
        ))}
      </div>

      {/* Timer ring */}
      <div className="flex justify-center mb-5">
        <div className="relative w-36 h-36">
          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={`hsl(var(--${modeColor}))`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tabular-nums text-foreground">
              {minutes}:{seconds}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          aria-label={t("pomodoroReset")}
          className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={toggleRunning}
          aria-label={running ? t("pomodoroPause") : t("pomodoroStart")}
          className="w-14 h-14 rounded-full bg-widget-focus hover:bg-widget-focus/90 text-white flex items-center justify-center shadow-lg shadow-widget-focus/30 transition-all active:scale-95"
        >
          {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <button
          type="button"
          onClick={skip}
          aria-label={t("pomodoroSkip")}
          className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
