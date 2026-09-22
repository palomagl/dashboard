import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { Logo } from "@/components/Logo";
import {
  CheckSquare,
  Target,
  Wallet,
  Timer,
  CheckCircle2,
  Flame,
  Play,
} from "lucide-react";

/** A marca do Google, como as diretrizes do botão de login pedem. */
function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="w-5 h-5 shrink-0" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function Login() {
  const { t } = useLocale();
  const { user, loading: carregandoSessao, loginWithGoogle } = useAuth();
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let salvo: string | null = null;
    try {
      salvo = localStorage.getItem("theme");
    } catch {
      // Janela anônima ou storage bloqueado: segue no tema escuro, que é o padrão.
    }
    document.documentElement.classList.toggle("dark", salvo !== "light");
  }, []);

  // Quem já está logada não precisa ver esta tela — inclusive ao voltar do
  // Google por redirect, que traz a pessoa de volta em /login.
  useEffect(() => {
    if (!carregandoSessao && user) navigate("/", { replace: true });
  }, [user, carregandoSessao, navigate]);

  const entrar = async () => {
    setErro("");
    setEntrando(true);
    try {
      await loginWithGoogle();
      // No caminho do popup, o redirecionamento acontece no efeito acima.
      // No caminho do redirect, a página já saiu daqui.
    } catch (e) {
      const codigo = (e as { code?: string }).code;
      const cancelou =
        codigo === "auth/popup-closed-by-user" || codigo === "auth/cancelled-popup-request";
      setErro(cancelou ? t("loginGoogleCancelado") : t("loginGoogleError"));
      if (!cancelou) console.error("Falha no login com Google:", e);
      setEntrando(false);
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
      {/* Painel esquerdo - marca */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-gradient-to-br from-background via-background to-widget-habits/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--widget-habits)/0.16),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-widget-habits/10 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-widget-goals/10 blur-3xl animate-float-slow" />

        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24 py-16 w-full">
          <div className="flex items-center gap-3 mb-8 animate-fade-in">
            <Logo className="w-11 h-11" />
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

          {/* Prévia do produto */}
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
                <span className="flex items-center gap-1.5 text-xs font-semibold text-widget-focus bg-widget-focus/10 border border-widget-focus/20 rounded-lg px-3 py-1.5 w-fit">
                  <Play className="w-3 h-3" />
                  Em andamento
                </span>
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

      {/* Lado direito - entrar */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-8 lg:p-12 relative overflow-hidden lg:overflow-visible">
        <div className="absolute inset-0 lg:hidden bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,hsl(var(--widget-habits)/0.12),transparent)]" />
        <div className="w-full max-w-md relative">
          {/* Marca compacta - só no celular */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-8 animate-fade-in">
            <Logo className="w-8 h-8" />
            <span className="text-xl font-bold gradient-text">Minha Rotina</span>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-8 sm:p-10 space-y-8 animate-fade-in border-border/50 shadow-2xl shadow-black/20">
            <div className="text-center lg:text-left space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("loginTitle")}</h1>
              <p className="text-muted-foreground text-sm">{t("loginSubtitle")}</p>
            </div>

            {erro && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2 animate-fade-in"
              >
                <span className="shrink-0 w-2 h-2 rounded-full bg-destructive" />
                {erro}
              </div>
            )}

            <button
              type="button"
              onClick={entrar}
              disabled={entrando}
              className="w-full h-12 rounded-xl font-medium bg-white text-[#1f1f1f] border border-black/10
                flex items-center justify-center gap-3 shadow-lg shadow-black/10
                transition-all hover:shadow-xl hover:bg-white/95 active:scale-[0.98]
                disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {entrando ? (
                <>
                  <span className="w-5 h-5 border-2 border-[#1f1f1f]/25 border-t-[#1f1f1f] rounded-full animate-spin" />
                  {t("loginGoogleLoading")}
                </>
              ) : (
                <>
                  <GoogleG />
                  {t("loginGoogle")}
                </>
              )}
            </button>

            <p className="text-center text-xs text-muted-foreground">{t("loginPrivacidade")}</p>
          </div>

          <p className="text-center text-xs text-muted-foreground/70 mt-6">
            Ao entrar, você concorda com o uso do app para organizar sua rotina.
          </p>
        </div>
      </div>
    </div>
  );
}
