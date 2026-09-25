import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Home,
  Languages,
  LineChart,
  LogOut,
  Moon,
  Pause,
  Play,
  Send,
  Settings,
  Sun,
  Timer,
  User,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useTema } from "@/hooks/useTema";
import { useTelegram } from "@/lib/aoVivo";
import type { TranslationKey } from "@/lib/translations";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { iniciais } from "./formato";
import { relogio, usePomodoro } from "./pomodoro";
import { TelegramDialog } from "./TelegramDialog";
import { useValores } from "./valores";

const ITENS: { para: string; rotulo: TranslationKey; Icone: typeof Home }[] = [
  { para: "/", rotulo: "navInicio", Icone: Home },
  { para: "/financas", rotulo: "tabFinancas", Icone: LineChart },
  { para: "/rotina", rotulo: "navRotina", Icone: CalendarDays },
  { para: "/notas", rotulo: "tabNotas", Icone: FileText },
];

/** Dica com o nome — só quando o menu está recolhido (abaixo de 1600px). */
function ComDica({ texto, children }: { texto: string; children: React.ReactNode }) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" className="wide:hidden">
        {texto}
      </TooltipContent>
    </Tooltip>
  );
}

export function Sidebar() {
  const { t } = useLocale();

  return (
    <aside
      className="sticky top-0 flex h-screen w-[84px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3.5 py-6 wide:w-[252px] wide:px-5"
      aria-label={t("navMenu")}
    >
      <Link to="/" className="flex items-center justify-center gap-3 rounded-xl px-1 wide:justify-start" aria-label="Minha Rotina">
        <Logo className="h-9 w-9 shrink-0" />
        <span className="hidden text-[19px] font-bold tracking-tight wide:block">Minha Rotina</span>
      </Link>

      <nav className="mt-9 space-y-1.5">
        {ITENS.map(({ para, rotulo, Icone }) => (
          <ComDica key={para} texto={t(rotulo)}>
            {/* O span recebe a dica: o Slot do Radix estragaria a className-função do NavLink. */}
            <span className="block">
            <NavLink
              to={para}
              end={para === "/"}
              aria-label={t(rotulo)}
              className={({ isActive }) =>
                cn(
                  "group flex h-11 items-center justify-center gap-3 rounded-xl text-[14px] font-medium transition-colors wide:justify-start wide:px-3.5",
                  isActive
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-sidebar-foreground/80 hover:bg-secondary hover:text-foreground"
                )
              }
            >
              <Icone className="h-[19px] w-[19px] shrink-0" />
              <span className="hidden wide:inline">{t(rotulo)}</span>
            </NavLink>
            </span>
          </ComDica>
        ))}
      </nav>

      <div className="mt-10">
        <CartaoTelegram />
      </div>

      <div className="flex-1" />

      <PomodoroMini />
      <Perfil />
    </aside>
  );
}

// ----------------------------------------------
// Telegram
// ----------------------------------------------

function CartaoTelegram() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const status = useTelegram();
  const [conectar, setConectar] = useState(false);
  const vinculado = !!status;

  const agir = () => (vinculado ? navigate("/account") : setConectar(true));

  return (
    <>
      {/* Recolhido: só o ícone, com a bolinha de status. */}
      <ComDica texto={`Telegram · ${vinculado ? t("accountTelegramConnected") : t("telegramNaoVinculado")}`}>
        <button
          type="button"
          onClick={agir}
          className="relative mx-auto grid h-11 w-11 place-items-center rounded-xl bg-card shadow-sm ring-1 ring-border/80 wide:hidden"
          aria-label="Telegram"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#2AABEE]">
            <Send className="h-3.5 w-3.5 -translate-x-px translate-y-px text-white" />
          </span>
          <span
            className={cn(
              "absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-card",
              vinculado ? "bg-emerald-500" : "bg-muted-foreground/40"
            )}
          />
        </button>
      </ComDica>

      {/* Aberto: o card da referência. */}
      <div className="hidden rounded-2xl border border-border/80 bg-card p-4 shadow-sm wide:block">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#2AABEE]">
            <Send className="h-4 w-4 -translate-x-px translate-y-px text-white" />
          </span>
          <span className="text-sm font-semibold">Telegram</span>
        </div>
        <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{t("telegramChamada")}</p>
        <button
          type="button"
          onClick={agir}
          className="mt-3 flex w-full items-center justify-between rounded-lg py-1 text-xs font-semibold transition-colors hover:text-primary"
        >
          <span className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", vinculado ? "bg-emerald-500" : "bg-muted-foreground/40")} />
            <span className={vinculado ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}>
              {status === undefined ? "…" : vinculado ? t("accountTelegramConnected") : t("telegramConectar")}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <TelegramDialog aberto={conectar} onFechar={() => setConectar(false)} />
    </>
  );
}

// ----------------------------------------------
// Pomodoro rodando (aparece em qualquer página)
// ----------------------------------------------

function PomodoroMini() {
  const { t } = useLocale();
  const p = usePomodoro();
  if (!p.emAndamento) return null;
  const rotulo = p.modo === "focus" ? t("pomodoroFocus") : t("pomodoroBreak");

  return (
    <div className="mb-3 flex flex-col items-center justify-center gap-1 rounded-2xl border border-border/80 bg-card p-1.5 shadow-sm wide:flex-row wide:justify-between wide:pl-3">
      <Link to="/rotina" className="hidden min-w-0 items-center gap-2 wide:flex" title={t("focoAbrir")}>
        <Timer className="h-4 w-4 shrink-0 text-primary" />
        <span className="truncate text-xs font-medium text-muted-foreground">{rotulo}</span>
        <span className="text-sm font-semibold tabular-nums">{relogio(p.restante)}</span>
      </Link>
      <ComDica texto={`${rotulo} · ${relogio(p.restante)}`}>
        <button
          type="button"
          onClick={p.alternar}
          aria-label={p.rodando ? t("pomodoroPause") : t("pomodoroStart")}
          className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary transition-colors hover:bg-primary/15"
        >
          {p.rodando ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>
      </ComDica>
      <span className="text-[10px] font-semibold tabular-nums text-muted-foreground wide:hidden">{relogio(p.restante)}</span>
    </div>
  );
}

// ----------------------------------------------
// Perfil (menu com conta, idioma, tema e sair)
// ----------------------------------------------

function Avatar({ className }: { className?: string }) {
  const { user } = useAuth();
  if (user?.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt=""
        referrerPolicy="no-referrer"
        className={cn("h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-border", className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary",
        className
      )}
    >
      {iniciais(user?.name)}
    </span>
  );
}

export { Avatar };

function Perfil() {
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useLocale();
  const { escuro, alternar } = useTema();
  const { ocultos, alternar: alternarValores } = useValores();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-3 rounded-2xl p-1.5 text-left transition-colors hover:bg-secondary wide:justify-start"
          aria-label={t("accountTitle")}
        >
          <Avatar />
          <span className="hidden min-w-0 flex-1 wide:block">
            <span className="block truncate text-sm font-semibold">{user?.name || t("user")}</span>
            <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
          </span>
          <Settings className="hidden h-[18px] w-[18px] shrink-0 text-muted-foreground wide:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" sideOffset={12} className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-semibold">{user?.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/account")} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" /> {t("accountTitle")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={alternar} className="cursor-pointer">
          {escuro ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {escuro ? t("themeLight") : t("themeDark")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={alternarValores} className="cursor-pointer">
          {ocultos ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
          {ocultos ? t("valoresMostrar") : t("valoresOcultar")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Languages className="h-3.5 w-3.5" /> {t("idioma")}
        </DropdownMenuLabel>
        {(["pt", "en"] as const).map((l) => (
          <DropdownMenuItem key={l} onClick={() => setLocale(l)} className="cursor-pointer pl-8">
            {l === "pt" ? "Português" : "English"}
            {locale === l && <Check className="ml-auto h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
