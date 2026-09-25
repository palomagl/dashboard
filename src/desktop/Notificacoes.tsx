import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, CalendarClock, CircleCheck, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocale } from "@/contexts/LocaleContext";
import { useContas, useHabitos, useTarefas } from "@/lib/aoVivo";
import { cn } from "@/lib/utils";
import { useDinheiro } from "./valores";
import { situacaoDe, vencimentoDe } from "./contas";

// O sininho: contas vencidas ou vencendo nos próximos 5 dias (as que ainda
// não foram marcadas como pagas) e o que falta de tarefas e hábitos hoje.
// A bolinha vermelha só aparece quando tem conta pedindo atenção.

const JANELA_DIAS = 5;

export function Notificacoes() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const dinheiro = useDinheiro();
  const contas = useContas().itens;
  const tarefas = useTarefas().itens;
  const habitos = useHabitos().itens;

  const alertas = useMemo(
    () =>
      contas
        .filter((c) => !c.paid)
        .map((c) => {
          const vencimento = vencimentoDe(c);
          const { dias } = situacaoDe(c);
          return { conta: c, faltam: dias, dia: `${vencimento.slice(8)}/${vencimento.slice(5, 7)}` };
        })
        .filter(({ faltam }) => faltam <= JANELA_DIAS)
        .sort((a, b) => a.faltam - b.faltam),
    [contas]
  );

  const tarefasAbertas = tarefas.filter((x) => !x.completed).length;
  const habitosAbertos = habitos.filter((h) => !h.completed).length;
  const temAlgo = alertas.length > 0 || tarefasAbertas > 0 || habitosAbertos > 0;

  const quando = (faltam: number, dia: string) => {
    if (faltam < 0) return t("avisoVenceu").replace("{dia}", dia);
    if (faltam === 0) return t("avisoVenceHoje");
    if (faltam === 1) return t("avisoVenceAmanha");
    return t("avisoVenceEm").replace("{n}", String(faltam));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={alertas.length > 0 ? `${t("avisos")} (${alertas.length})` : t("avisos")}
          className="relative grid h-11 w-11 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-card hover:text-foreground hover:shadow-sm data-[state=open]:bg-card data-[state=open]:shadow-sm"
        >
          <Bell className="h-5 w-5" />
          {alertas.length > 0 && (
            <span className="absolute right-[11px] top-[10px] h-2 w-2 rounded-full bg-rose-500 ring-2 ring-background" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[340px] rounded-2xl p-0">
        <div className="border-b border-border/80 px-4 py-3">
          <p className="text-sm font-semibold">{t("avisos")}</p>
        </div>
        <div className="max-h-[360px] overflow-y-auto p-2">
          {!temAlgo && (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              {t("avisosVazio")}
            </div>
          )}

          {alertas.map(({ conta, dia, faltam }) => (
            <button
              key={conta.id}
              type="button"
              onClick={() => navigate("/financas")}
              className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-secondary"
            >
              <span
                className={cn(
                  "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                  faltam < 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                )}
              >
                {faltam < 0 ? <AlertTriangle className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {conta.name}
                  {conta.parcela ? ` ${conta.parcela}` : ""} · {dinheiro(conta.amount, { centavos: true })}
                </span>
                <span className="block text-xs text-muted-foreground">{quando(faltam, dia)}</span>
              </span>
            </button>
          ))}

          {(tarefasAbertas > 0 || habitosAbertos > 0) && (
            <button
              type="button"
              onClick={() => navigate("/rotina")}
              className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-secondary"
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <CircleCheck className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{t("avisoHoje")}</span>
                <span className="block text-xs text-muted-foreground">
                  {t("avisoPendentes")
                    .replace("{tarefas}", String(tarefasAbertas))
                    .replace("{habitos}", String(habitosAbertos))}
                </span>
              </span>
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
