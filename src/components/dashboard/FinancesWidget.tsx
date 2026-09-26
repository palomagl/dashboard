import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpToLine, CalendarClock, Check, CreditCard, Pencil, Receipt, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import type { Bill, Transaction } from "@/lib/db";
import { billsApi } from "@/lib/db";
import { useCarteira, useContas, useTransacoes } from "@/lib/aoVivo";
import { dayKey } from "@/lib/dates";
import { executar } from "@/lib/acoes";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";
import { saldoAtual, totaisDoMes } from "@/desktop/calculos";
import { situacaoDe, vencimentoDe } from "@/desktop/contas";
import { ESTILO_SITUACAO, ESTILO_TIPO, useRotulosConta } from "@/desktop/cards/Contas";
import { AjustarSaldoDialog, ContaDialog, TransacaoDialog } from "@/desktop/Formularios";

// Finanças no celular: o mesmo que o computador faz, no tamanho do celular.
// Os dados vêm ao vivo (um gasto mandado pelo Telegram aparece na hora) e
// criar ou editar abre os mesmos formulários do computador: conta parcelada,
// todo mês, cartão, saldo ajustável...

const reais = (v: number, centavos = true) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: centavos ? 2 : 0, maximumFractionDigits: centavos ? 2 : 0 })}`;

/** "2026-09-22" -> "22/09". */
const diaMes = (chave: string) => `${chave.slice(8)}/${chave.slice(5, 7)}`;

type Dialogo =
  | { tipo: "transacao"; inicial?: Transaction; tipoInicial?: Transaction["type"] }
  | { tipo: "conta"; inicial?: Bill }
  | { tipo: "saldo" }
  | null;

export function FinancesWidget() {
  const { t } = useLocale();
  const rotulos = useRotulosConta();
  const contas = useContas().itens;
  const transacoes = useTransacoes().itens;
  const carteira = useCarteira();
  const [aba, setAba] = useState<"bills" | "transactions">("bills");
  const [verPagas, setVerPagas] = useState(false);
  const [dialogo, setDialogo] = useState<Dialogo>(null);

  const hoje = dayKey();
  const d = useMemo(() => {
    const mes = totaisDoMes(transacoes, hoje.slice(0, 7));
    const fimDoMes = `${hoje.slice(0, 7)}-31`;
    const comData = contas.map((c) => ({ conta: c, vencimento: vencimentoDe(c, hoje), ...situacaoDe(c, hoje) }));
    return {
      entradas: mes.entradas,
      gastos: mes.gastos,
      saldo: saldoAtual(transacoes, contas, carteira ?? null),
      aPagarNoMes: comData.filter((x) => !x.conta.paid && x.vencimento <= fimDoMes).reduce((s, x) => s + x.conta.amount, 0),
      abertas: comData.filter((x) => !x.conta.paid).sort((a, b) => a.vencimento.localeCompare(b.vencimento)),
      pagas: comData.filter((x) => x.conta.paid).sort((a, b) => b.vencimento.localeCompare(a.vencimento)),
    };
  }, [transacoes, contas, carteira, hoje]);

  const alternarPaga = (conta: Bill) =>
    executar(() => billsApi.update(conta.id, { paid: !conta.paid }), { erro: t("erroAoSalvar") });

  const fechar = () => setDialogo(null);
  const lista = verPagas ? d.pagas : d.abertas;

  return (
    <div className="glass-card glass-card-hover rounded-xl p-5 animate-fade-in" style={{ animationDelay: "180ms" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-widget-finance" />
            {t("financesTitle")}
          </h3>
          <p className="text-sm text-muted-foreground">{t("financesSubtitle")}</p>
        </div>
        <Wallet className="w-5 h-5 text-widget-finance" />
      </div>

      {/* Saldo (toque para ajustar) + o mês */}
      <button
        type="button"
        onClick={() => setDialogo({ tipo: "saldo" })}
        className="mb-2 flex w-full items-center justify-between gap-3 rounded-xl bg-widget-finance/10 px-4 py-3 text-left transition-colors hover:bg-widget-finance/15"
      >
        <span className="min-w-0">
          <span className="block text-xs text-muted-foreground">{t("saldoAtual")}</span>
          <span className={cn("block text-2xl font-bold tabular-nums", d.saldo < 0 && "text-rose-500")}>
            {carteira === undefined ? "—" : reais(d.saldo)}
          </span>
          <span className="block text-[11px] text-muted-foreground">
            {carteira ? t("ajustadoEm").replace("{dia}", diaMes(dayKey(new Date(carteira.definidoEm)))) : t("informarSaldo")}
          </span>
        </span>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-background/70 text-widget-finance">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">{t("ajustarSaldo")}</span>
        </span>
      </button>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> {t("entradasDoMes")}
          </p>
          <p className="text-sm font-semibold text-emerald-500 tabular-nums">{reais(d.entradas, false)}</p>
        </div>
        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingDown className="h-3.5 w-3.5 text-rose-500" /> {t("gastosDoMes")}
          </p>
          <p className="text-sm font-semibold text-rose-500 tabular-nums">{reais(d.gastos, false)}</p>
        </div>
      </div>

      {/* Anotar */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {(
          [
            { chave: "expense", Icone: ArrowDownToLine, rotulo: t("lancarGasto"), cor: "text-rose-500 bg-rose-500/10" },
            { chave: "income", Icone: ArrowUpToLine, rotulo: t("lancarEntrada"), cor: "text-violet-500 bg-violet-500/10" },
            { chave: "conta", Icone: CalendarClock, rotulo: t("lancarConta"), cor: "text-amber-500 bg-amber-500/10" },
          ] as const
        ).map(({ chave, Icone, rotulo, cor }) => (
          <button
            key={chave}
            type="button"
            onClick={() => setDialogo(chave === "conta" ? { tipo: "conta" } : { tipo: "transacao", tipoInicial: chave })}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-background/40 px-2 py-2.5 text-center text-xs font-semibold transition-colors active:scale-[0.98] hover:bg-secondary/60"
          >
            <span className={cn("grid h-8 w-8 place-items-center rounded-lg", cor)}>
              <Icone className="h-4 w-4" />
            </span>
            <span className="leading-tight">+ {rotulo}</span>
          </button>
        ))}
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-4">
        <button type="button" onClick={() => setAba("bills")} className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${aba === "bills" ? "bg-widget-finance text-white" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}`}>
          <Receipt className="w-4 h-4" /> {t("financesBills")}
        </button>
        <button type="button" onClick={() => setAba("transactions")} className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${aba === "transactions" ? "bg-widget-finance text-white" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}`}>
          <CreditCard className="w-4 h-4" /> {t("financesTransactions")}
        </button>
      </div>

      {aba === "bills" && (
        <>
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-500">
              {t("financesPending")} {t("noMes")}: <strong className="tabular-nums">{reais(d.aPagarNoMes)}</strong>
            </span>
            <button
              type="button"
              onClick={() => setVerPagas((v) => !v)}
              className="rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            >
              {verPagas ? t("filtroAPagar") : `${t("filtroPagas")} (${d.pagas.length})`}
            </button>
          </div>

          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {lista.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{verPagas ? t("nenhumaPaga") : t("nadaAPagar")}</p>}
            {lista.map(({ conta, vencimento, situacao, dias }) => (
              <div
                key={conta.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-2.5 transition-colors",
                  conta.paid ? "border-emerald-500/20 bg-emerald-500/5" : "border-transparent bg-secondary/50"
                )}
              >
                <span
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-lg text-center leading-none",
                    situacao === "vencida" || situacao === "hoje" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-background/70"
                  )}
                >
                  <span>
                    <span className="block text-base font-bold tabular-nums">{Number(vencimento.slice(8))}</span>
                    <span className="block text-[9px] font-semibold uppercase text-muted-foreground">
                      {new Date(`${vencimento}T12:00:00`).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                    </span>
                  </span>
                </span>
                <button type="button" onClick={() => setDialogo({ tipo: "conta", inicial: conta })} className="min-w-0 flex-1 text-left">
                  <p className={cn("truncate text-sm font-medium", conta.paid && "text-muted-foreground line-through")}>{conta.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px]">
                    <span className={cn("rounded px-1 py-px font-semibold", ESTILO_TIPO[conta.tipo ?? "avulsa"])}>{rotulos.tipo(conta)}</span>
                    {!conta.paid && <span className={cn("rounded px-1 py-px font-semibold", ESTILO_SITUACAO[situacao])}>{rotulos.situacao(situacao, dias)}</span>}
                  </p>
                </button>
                <span className={cn("shrink-0 text-sm font-semibold tabular-nums", conta.paid && "text-muted-foreground")}>{reais(conta.amount)}</span>
                <button
                  type="button"
                  onClick={() => alternarPaga(conta)}
                  aria-label={conta.paid ? t("financesMarkUnpaid") : t("financesMarkPaid")}
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition-colors",
                    conta.paid ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/40 text-transparent hover:border-emerald-500 hover:text-emerald-500"
                  )}
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {aba === "transactions" && (
        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
          {transacoes.map((tr) => (
            <button
              key={tr.id}
              type="button"
              onClick={() => setDialogo({ tipo: "transacao", inicial: tr })}
              className="flex w-full items-center gap-3 rounded-lg bg-secondary/50 p-3 text-left transition-colors hover:bg-secondary"
            >
              <span className={`p-2 rounded-lg ${tr.type === "income" ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                {tr.type === "income" ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{tr.description}</span>
                <span className="block text-xs text-muted-foreground">
                  {diaMes(tr.date)} • {tr.category ?? "Outros"}
                </span>
              </span>
              <span className={`shrink-0 text-sm font-semibold tabular-nums ${tr.type === "income" ? "text-emerald-500" : "text-rose-500"}`}>
                {tr.type === "income" ? "+" : "-"} {reais(tr.amount)}
              </span>
            </button>
          ))}
        </div>
      )}

      <TransacaoDialog
        aberto={dialogo?.tipo === "transacao"}
        inicial={dialogo?.tipo === "transacao" ? dialogo.inicial : undefined}
        tipoInicial={dialogo?.tipo === "transacao" ? dialogo.tipoInicial : undefined}
        onFechar={fechar}
      />
      <ContaDialog aberto={dialogo?.tipo === "conta"} inicial={dialogo?.tipo === "conta" ? dialogo.inicial : undefined} onFechar={fechar} />
      <AjustarSaldoDialog aberto={dialogo?.tipo === "saldo"} onFechar={fechar} carteira={carteira} saldoCalculado={d.saldo} />
    </div>
  );
}
