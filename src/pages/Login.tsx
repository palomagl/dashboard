import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { Logo } from "@/components/Logo";

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

  return (
    <div
      className="relative min-h-screen bg-background grid place-items-center px-5
        pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]"
    >
      {/* Um brilho só, bem discreto, para a tela não ser uma chapa lisa. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-0 h-[60vh] w-[130vw] -translate-x-1/2 -translate-y-1/3
            rounded-full bg-widget-habits/[0.08] blur-[110px]"
        />
      </div>

      <main className="relative w-full max-w-[400px]">
        <div
          className="rounded-3xl border border-border/60 bg-card/90 backdrop-blur-xl
            px-7 py-10 sm:px-9 sm:py-11 animate-fade-in
            shadow-[0_24px_70px_-20px_rgb(0_0_0/0.22)] dark:shadow-[0_24px_70px_-20px_rgb(0_0_0/0.65)]"
        >
          <div className="flex flex-col items-center text-center">
            <Logo className="w-16 h-16" />

            <h1 className="mt-6 text-[1.75rem] font-extrabold tracking-tight text-foreground">
              Minha Rotina
            </h1>

            <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted-foreground">
              {t("loginSubtitle")}
            </p>
          </div>

          {erro && (
            <div
              role="alert"
              className="mt-7 flex items-center gap-2.5 rounded-xl border border-destructive/20
                bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-in"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
              {erro}
            </div>
          )}

          <button
            type="button"
            onClick={entrar}
            disabled={entrando}
            className="mt-8 flex h-[3.25rem] w-full items-center justify-center gap-3
              rounded-2xl border border-black/[0.08] bg-white font-semibold text-[#1f1f1f]
              shadow-sm transition-all
              hover:shadow-md hover:-translate-y-px
              active:translate-y-0 active:scale-[0.99]
              disabled:pointer-events-none disabled:opacity-60"
          >
            {entrando ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#1f1f1f]/20 border-t-[#1f1f1f]" />
                {t("loginGoogleLoading")}
              </>
            ) : (
              <>
                <GoogleG />
                {t("loginGoogle")}
              </>
            )}
          </button>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground/70">
          {t("loginPrivacidade")}
        </p>
      </main>
    </div>
  );
}
