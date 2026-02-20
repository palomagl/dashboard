import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, Sparkles } from "lucide-react";

export default function Login() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || t("accountErrorUnknown"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - branding (hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.15),transparent)]" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <span className="text-2xl font-bold gradient-text">Minha Rotina</span>
          </div>
          <h2 className="text-4xl xl:text-5xl font-bold tracking-tight text-foreground mb-4">
            Organize seu dia.
            <br />
            <span className="gradient-text">Cuide do que importa.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-md">
            Tarefas, hábitos, metas e finanças em um só lugar. Acesse seu dashboard e comece agora.
          </p>
        </div>
      </div>

      {/* Right side - form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          <div className="glass-card glass-card-hover rounded-2xl p-8 sm:p-10 space-y-8 animate-fade-in border-border/50 shadow-2xl shadow-black/20">
            {/* Header - visible on mobile only as main title */}
            <div className="text-center lg:text-left space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mx-auto lg:mx-0">
                <LogIn className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("loginTitle")}</h1>
              <p className="text-muted-foreground text-sm">{t("loginSubtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                  <span className="shrink-0 w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("loginEmail")}</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("loginPassword")}</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {t("loginLoading")}
                  </span>
                ) : (
                  t("loginButton")
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
