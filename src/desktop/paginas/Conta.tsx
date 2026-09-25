import type { FormEvent } from "react";
import { Check, LogOut, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useTema } from "@/hooks/useTema";
import type { TelegramStatus } from "@/lib/db";
import { cn } from "@/lib/utils";
import { Cabecalho, IconePagina } from "../Cabecalho";
import { DesktopShell } from "../DesktopShell";
import { Avatar } from "../Sidebar";
import { Segmentado } from "../ui";
import { useValores } from "../valores";

// "Minha conta" no computador: a mesma página (mesmos dados, mesmas ações —
// quem cuida delas continua sendo src/pages/Account.tsx), só que dentro do
// layout com menu lateral e em duas colunas.

export interface PropsConta {
  name: string;
  setName: (v: string) => void;
  salvando: boolean;
  erro: string;
  salvarPerfil: (e: FormEvent) => void;
  telegram: TelegramStatus | null | undefined;
  codigo: { codigo: string; expiraEm: Date } | null;
  gerando: boolean;
  desvinculando: boolean;
  erroTelegram: string;
  gerarCodigoTelegram: () => void;
  desvincularTelegram: () => void;
}

export default function ContaDesktop(props: PropsConta) {
  const { t } = useLocale();
  return (
    <DesktopShell>
      <Cabecalho icone={<IconePagina Icone={User} />} titulo={t("accountTitle")} subtitulo={t("accountSubtitle")} />
      <div className="grid max-w-[1180px] grid-cols-2 items-start gap-5">
        <div className="space-y-5">
          <ContaGoogle />
          <Perfil {...props} />
        </div>
        <div className="space-y-5">
          <Telegram {...props} />
          <Preferencias />
        </div>
      </div>
    </DesktopShell>
  );
}

function ContaGoogle() {
  const { user } = useAuth();
  const { t } = useLocale();
  return (
    <section className="cartao p-6 animate-fade-in">
      <h2 className="rotulo-kpi">{t("accountGoogleConnected")}</h2>
      <div className="mt-4 flex items-center gap-4">
        <Avatar className="h-14 w-14 text-base" />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{user?.name}</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{t("accountEmailFromGoogle")}</p>
    </section>
  );
}

function Perfil({ name, setName, salvando, erro, salvarPerfil }: PropsConta) {
  const { user } = useAuth();
  const { t } = useLocale();
  return (
    <section className="cartao p-6 animate-fade-in">
      <h2 className="flex items-center gap-2 font-semibold">
        <User className="h-5 w-5 text-primary" /> {t("accountProfile")}
      </h2>
      <form onSubmit={salvarPerfil} className="mt-5 space-y-4">
        {erro && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{erro}</div>}
        <label className="block space-y-2">
          <span className="text-sm font-medium">{t("accountName")}</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl bg-background" required />
        </label>
        <Button
          type="submit"
          className="h-11 w-full rounded-xl"
          disabled={salvando || !name.trim() || name.trim() === user?.name}
        >
          {salvando ? "..." : t("accountSaveProfile")}
        </Button>
      </form>
    </section>
  );
}

function Telegram({
  telegram,
  codigo,
  gerando,
  desvinculando,
  erroTelegram,
  gerarCodigoTelegram,
  desvincularTelegram,
}: PropsConta) {
  const { t, locale } = useLocale();
  return (
    <section className="cartao p-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#2AABEE]">
          <Send className="h-[18px] w-[18px] -translate-x-px translate-y-px text-white" />
        </span>
        <div>
          <h2 className="font-semibold">{t("accountTelegramTitle")}</h2>
          <p className="text-xs text-muted-foreground">{t("accountTelegramDescription")}</p>
        </div>
      </div>

      {erroTelegram && <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{erroTelegram}</div>}

      {telegram ? (
        <div className="mt-5 space-y-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white">
              <Check className="h-3 w-3" strokeWidth={3.5} />
            </span>
            {t("accountTelegramConnected")}
            <span className="font-normal text-muted-foreground">
              ·{" "}
              {telegram.vinculadoEm.toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </p>
          <p className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground">{t("telegramConectadoTexto")}</p>
          <Button variant="outline" className="h-11 w-full rounded-xl" onClick={desvincularTelegram} disabled={desvinculando}>
            {desvinculando ? "..." : t("accountTelegramUnlinkButton")}
          </Button>
        </div>
      ) : codigo ? (
        <div className="mt-5 space-y-2 rounded-2xl bg-secondary p-5 text-center">
          <p className="text-xs text-muted-foreground">{t("accountTelegramInstructions")}</p>
          <p className="break-all font-mono text-xl font-bold tracking-wider">/start {codigo.codigo}</p>
          <p className="text-xs text-muted-foreground">
            {t("accountTelegramExpiresAt")}{" "}
            {codigo.expiraEm.toLocaleTimeString(locale === "pt" ? "pt-BR" : "en-US", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      ) : (
        <Button className="mt-5 h-11 w-full rounded-xl" onClick={gerarCodigoTelegram} disabled={gerando || telegram === undefined}>
          {gerando ? "..." : t("accountTelegramLinkButton")}
        </Button>
      )}
    </section>
  );
}

function Preferencias() {
  const { t, locale, setLocale } = useLocale();
  const { logout } = useAuth();
  const { escuro, alternar } = useTema();
  const { ocultos, alternar: alternarValores } = useValores();

  const linha = "flex items-center justify-between gap-4 py-3.5";
  return (
    <section className="cartao p-6 animate-fade-in">
      <h2 className="font-semibold">{t("preferencias")}</h2>
      <div className="mt-2 divide-y divide-border/70">
        <div className={linha}>
          <span className="text-sm">{t("idioma")}</span>
          <Segmentado<"pt" | "en">
            rotulo={t("idioma")}
            valor={locale}
            onChange={(v) => setLocale(v)}
            opcoes={[
              { valor: "pt", rotulo: "Português" },
              { valor: "en", rotulo: "English" },
            ]}
          />
        </div>
        <div className={linha}>
          <span className="text-sm">{t("tema")}</span>
          <Segmentado<"claro" | "escuro">
            rotulo={t("tema")}
            valor={escuro ? "escuro" : "claro"}
            onChange={(v) => (v === "escuro") !== escuro && alternar()}
            opcoes={[
              { valor: "claro", rotulo: t("claro") },
              { valor: "escuro", rotulo: t("escuro") },
            ]}
          />
        </div>
        <div className={linha}>
          <span className="text-sm">
            {t("valoresOcultar")}
            <span className="block text-xs text-muted-foreground">{t("valoresOcultarTexto")}</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={ocultos}
            aria-label={t("valoresOcultar")}
            onClick={alternarValores}
            className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", ocultos ? "bg-primary" : "bg-input")}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                ocultos ? "translate-x-[22px]" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
      </div>
      <Button variant="ghost" className="mt-3 h-11 w-full rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={logout}>
        <LogOut className="mr-2 h-4 w-4" /> {t("logout")}
      </Button>
    </section>
  );
}
