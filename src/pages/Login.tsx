import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LogIn,
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckSquare,
  Target,
  Wallet,
  Timer,
  CheckCircle2,
  Flame,
  Play,
} from "lucide-react";

const REMEMBER_KEY = "mr_remember_email";

export default function Login() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("theme");
    } catch {}
    document.documentElement.classList.toggle("dark", stored !== "light");

    try {
      const savedEmail = localStorage.getItem(REMEMBER_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
        setRemember(true);
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      try {
        if (remember) {
          localStorage.setItem(REMEMBER_KEY, email);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
      } catch {}
      navigate("/");
    } catch (err: any) {
      setError(err.message || t("accountErrorUnknown"));
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: CheckSquare, label: t("loginFeatureTasks"), color: "text-widget-tasks", bg: "bg-widget-tasks/10 border-widget-tasks/20" },
    { icon: Timer, label: t("loginFeaturePomodoro"), color: "text-widget-focus", bg: "bg-widget-focus/10 border-widget-focus/20" },
    { icon: Target, label: t("loginFeatureGoals"), color: "text-widget-goals", bg: "bg-widget-goals/10 border-widget-goals/20" },
    { icon: Wallet, label: t("loginFeatureFinance"), color: "text-widget-finance", bg: "bg-widget-finance/10 border-widget-finance/20" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.18),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-widget-goals/10 blur-3xl animate-float-slow" />

        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24 py-16 w-full">
          <div className="flex items-center gap-3 mb-8 animate-fade-in">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 relative">
              <span className="absolute inset-0 rounded-2xl bg-primary/20 blur-md animate-pulse" />
              <Sparkles className="w-8 h-8 text-primary relative" />
            </div>
            <span className="text-2xl font-bold gradient-text">Minha Rotina</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-bold tracking-tight text-foreground mb-4 leading-[1.1] animate-fade-in [animation-delay:80ms] [animation-fill-mode:backwards]">
            Organize seu dia.
            <br />
            <span className="gradient-text">Cuide do que importa.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mb-10 animate-fade-in [animation-delay:150ms] [animation-fill-mode:backwards]">
            Tarefas, hábitos, metas e finanças em um só lugar. Acesse seu dashboard e comece agora.
          </p>

          <div className="space-y-3 max-w-sm mb-12">
            {features.map(({ icon: Icon, label, color, bg }, i) => (
              <div
                key={label}
                style={{ animationDelay: `${220 + i * 90}ms` }}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${bg} backdrop-blur-sm transition-all duration-300 hover:translate-x-1 hover:shadow-md animate-fade-in [animation-fill-mode:backwards]`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>

          {/* Streak badge row */}
          <div className="flex items-center gap-3 mb-5 animate-fade-in [animation-delay:460ms] [animation-fill-mode:backwards]">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-widget-focus bg-widget-focus/10 border border-widget-focus/20 rounded-full px-3 py-1.5">
              <Flame className="w-3.5 h-3.5" />
              12 dias de sequência
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              4/6 tarefas hoje
            </span>
          </div>

          {/* Product preview: Pomodoro card */}
          <div className="glass-card rounded-2xl p-5 max-w-sm shadow-xl shadow-black/10 border-border/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 animate-fade-in [animation-delay:540ms] [animation-fill-mode:backwards]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-widget-focus" />
                Pomodoro
              </span>
              <span className="text-xs text-muted-foreground font-medium">3 sessões hoje</span>
            </div>

            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="hsl(var(--widget-focus))"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 * 0.35}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold tabular-nums text-foreground">16:12</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-foreground">Sessão de foco</p>
                <p className="text-xs text-muted-foreground">Estudar para a prova de sexta</p>
                <button
                  type="button"
                  tabIndex={-1}
                  className="flex items-center gap-1.5 text-xs font-semibold text-widget-focus bg-widget-focus/10 border border-widget-focus/20 rounded-lg px-3 py-1.5 pointer-events-none"
                >
                  <Play className="w-3 h-3" />
                  Em andamento
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary via-widget-focus to-widget-habits w-2/3" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">67%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-8 lg:p-12 relative overflow-hidden lg:overflow-visible">
        <div className="absolute inset-0 lg:hidden bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="w-full max-w-md relative">
          {/* Compact brand header - mobile only */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-8 animate-fade-in">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold gradient-text">Minha Rotina</span>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-8 sm:p-10 space-y-8 animate-fade-in border-border/50 shadow-2xl shadow-black/20">
            {/* Header - visible on mobile only as main title */}
            <div className="text-center lg:text-left space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mx-auto lg:mx-0 lg:hidden">
                <LogIn className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("loginTitle")}</h1>
              <p className="text-muted-foreground text-sm">{t("loginSubtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2 animate-fade-in">
                  <span className="shrink-0 w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("loginEmail")}</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="h-11 pl-10 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("loginPassword")}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-11 pl-10 pr-10 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t("loginHidePassword") : t("loginShowPassword")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-border/50 accent-primary cursor-pointer"
                />
                {t("loginRemember")}
              </label>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {t("loginLoading")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    {t("loginButton")}
                  </span>
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground pt-2">
              {t("loginNoAccount")}{" "}
              <Link
                to="/register"
                className="text-primary font-medium hover:underline underline-offset-2 decoration-primary/50"
              >
                {t("loginCreateAccount")}
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground/70 mt-6">
            Ao entrar, você concorda com o uso do app para organizar sua rotina.
          </p>
        </div>
      </div>
    </div>
  );
}
