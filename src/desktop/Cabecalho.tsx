import type { ReactNode } from "react";
import { Moon, Search, Sun } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useTema } from "@/hooks/useTema";
import { cn } from "@/lib/utils";
import { useBusca } from "./Busca";
import { Notificacoes } from "./Notificacoes";

/** Cabeçalho das páginas: ícone, título e subtítulo; busca, avisos e tema à direita. */
export function Cabecalho({
  icone,
  titulo,
  subtitulo,
}: {
  icone: ReactNode;
  titulo: ReactNode;
  subtitulo?: ReactNode;
}) {
  return (
    <header className="mb-6 flex items-center gap-6 wide:mb-7">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {icone}
        <div className="min-w-0">
          <h1 className="truncate text-[25px] font-bold leading-tight tracking-tight wide:text-[27px]">{titulo}</h1>
          {subtitulo && <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitulo}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <BotaoBusca />
        <Notificacoes />
        <BotaoTema />
      </div>
    </header>
  );
}

/** Ícone de página num quadrado branco com sombra leve (Finanças, Rotina, Notas...). */
export function IconePagina({ Icone, className }: { Icone: typeof Search; className?: string }) {
  return (
    <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-border/80 bg-card shadow-sm", className)}>
      <Icone className="h-[22px] w-[22px] text-primary" />
    </span>
  );
}

function BotaoBusca() {
  const { t } = useLocale();
  const { abrir } = useBusca();
  const mac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  return (
    <button
      type="button"
      onClick={abrir}
      className="mr-2 flex h-11 w-[240px] items-center gap-3 rounded-full border border-border/80 bg-card px-4 text-left text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary/40 xl:w-[300px] wide:w-[380px]"
    >
      <Search className="h-[18px] w-[18px] shrink-0" />
      <span className="flex-1 truncate">{t("search")}</span>
      <kbd className="hidden rounded-md border border-border bg-background px-1.5 py-0.5 font-sans text-[10px] font-semibold text-muted-foreground xl:inline">
        {mac ? "⌘" : "Ctrl"} K
      </kbd>
    </button>
  );
}

function BotaoTema() {
  const { t } = useLocale();
  const { escuro, alternar } = useTema();
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={escuro ? t("themeLight") : t("themeDark")}
      title={escuro ? t("themeLight") : t("themeDark")}
      className="grid h-11 w-11 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-card hover:text-foreground hover:shadow-sm"
    >
      {escuro ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
