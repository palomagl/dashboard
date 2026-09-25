import { useMemo, useState } from "react";
import { ArrowRight, BarChart3, PieChart as IconePizza } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useTransacoes } from "@/lib/aoVivo";
import { cn } from "@/lib/utils";
import { ICONE_CATEGORIA, normalizarCategoria, useCores } from "../categorias";
import { diasDoPeriodo, gastosPorCategoria, transacoesDesde, type Periodo } from "../calculos";
import { Rosca } from "../graficos";
import { Barra, Cartao, CartaoTopo, IconeSuave, LinkVerTodas, Segmentado, Vazio } from "../ui";
import { useDinheiro } from "../valores";

export function usePeriodoRotulos() {
  const { t } = useLocale();
  return {
    opcoes: [
      { valor: "7d" as Periodo, rotulo: t("financePeriod7d") },
      { valor: "30d" as Periodo, rotulo: t("financePeriod30d") },
      { valor: "3m" as Periodo, rotulo: t("financePeriod3m") },
    ],
    subtitulo: (p: Periodo) => t(p === "7d" ? "ultimos7" : p === "30d" ? "ultimos30" : "ultimos3m"),
  };
}

/** Início: rosca de entradas x gastos no período, com o saldo no meio. */
export function ResumoFinanceiro({ periodo, onPeriodo }: { periodo: Periodo; onPeriodo: (p: Periodo) => void }) {
  const { t } = useLocale();
  const cores = useCores();
  const dinheiro = useDinheiro();
  const { itens } = useTransacoes();
  const rotulos = usePeriodoRotulos();
  const [destaque, setDestaque] = useState<string | null>(null);

  const { entradas, gastos, quantidade } = useMemo(() => {
    const doPeriodo = transacoesDesde(itens, diasDoPeriodo(periodo)[0]);
    let e = 0;
    let g = 0;
    for (const x of doPeriodo) {
      if (x.type === "income") e += x.amount;
      else g += x.amount;
    }
    return { entradas: e, gastos: g, quantidade: doPeriodo.length };
  }, [itens, periodo]);

  const total = entradas + gastos;
  const saldo = entradas - gastos;
  const fatias = [
    { chave: "entradas", rotulo: t("financeOverviewIncome"), valor: entradas, cor: cores.serie("entradas") },
    { chave: "gastos", rotulo: t("financeOverviewExpenses"), valor: gastos, cor: cores.serie("gastos") },
  ];

  return (
    <Cartao>
      <CartaoTopo
        icone={<BarChart3 className="h-[18px] w-[18px] text-primary" />}
        titulo={t("financeOverviewTitle")}
        subtitulo={rotulos.subtitulo(periodo)}
        acao={<Segmentado rotulo={t("periodo")} opcoes={rotulos.opcoes} valor={periodo} onChange={onPeriodo} />}
        className="flex-wrap"
      />
      {total === 0 ? (
        <Vazio className="min-h-[170px]">{t("semMovimento")}</Vazio>
      ) : (
        <div className="flex items-center gap-5 wide:gap-7">
          <Rosca
            fatias={fatias}
            tamanho={150}
            espessura={19}
            trilho={cores.trilho}
            formatar={(v) => dinheiro(v)}
            destaque={destaque}
            onDestaque={setDestaque}
            centro={
              <>
                <span className={cn("text-[17px] font-bold leading-tight tabular-nums", saldo < 0 && "text-negativo")}>
                  {dinheiro(saldo)}
                </span>
                <span className="mt-0.5 text-[11px] text-muted-foreground">{t("saldoNoPeriodo")}</span>
              </>
            }
          />
          <ul className="min-w-0 flex-1 space-y-1">
            {fatias.map((f) => (
              <li
                key={f.chave}
                onMouseEnter={() => setDestaque(f.chave)}
                onMouseLeave={() => setDestaque(null)}
                className={cn(
                  "grid grid-cols-[1fr_auto_2.5rem] items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
                  destaque === f.chave && "bg-secondary"
                )}
              >
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: f.cor }} />
                  <span className="truncate">{f.rotulo}</span>
                </span>
                <span className="text-sm font-semibold tabular-nums">{dinheiro(f.valor)}</span>
                <span className="text-right text-xs tabular-nums text-muted-foreground">
                  {total > 0 ? Math.round((f.valor / total) * 100) : 0}%
                </span>
              </li>
            ))}
            <li className="mx-2 !my-2 border-t border-border/70" aria-hidden="true" />
            <li className="grid grid-cols-[1fr_auto_2.5rem] items-center gap-2 px-2 py-1">
              <span className="truncate pl-[18px] text-sm text-muted-foreground">{t("financesBalance")}</span>
              <span className={cn("text-sm font-semibold tabular-nums", saldo < 0 ? "text-negativo" : "text-positivo")}>
                {dinheiro(saldo, { sinal: true })}
              </span>
              <span />
            </li>
            <li className="grid grid-cols-[1fr_auto_2.5rem] items-center gap-2 px-2 py-1">
              <span className="truncate pl-[18px] text-sm text-muted-foreground">{t("financesTransactions")}</span>
              <span className="text-sm font-semibold tabular-nums">{quantidade}</span>
              <span />
            </li>
          </ul>
        </div>
      )}
    </Cartao>
  );
}

/** Início: barras por categoria (as 4 maiores), no mesmo período do resumo. */
export function DespesasPorCategoria({ periodo, limite = 4 }: { periodo: Periodo; limite?: number }) {
  const { t } = useLocale();
  const cores = useCores();
  const dinheiro = useDinheiro();
  const { itens } = useTransacoes();
  const rotulos = usePeriodoRotulos();

  const { lista } = useMemo(() => gastosPorCategoria(transacoesDesde(itens, diasDoPeriodo(periodo)[0])), [itens, periodo]);
  const visiveis = lista.slice(0, limite);
  const maior = visiveis[0]?.valor ?? 0;

  return (
    <Cartao>
      <CartaoTopo
        icone={<IconePizza className="h-[18px] w-[18px] text-amber-500" />}
        titulo={t("financeCategoryTitle")}
        subtitulo={rotulos.subtitulo(periodo)}
        acao={
          lista.length > limite ? (
            <LinkVerTodas para="/financas">
              {t("verTodasN").replace("{n}", String(lista.length))} <ArrowRight className="h-3.5 w-3.5" />
            </LinkVerTodas>
          ) : undefined
        }
      />
      {visiveis.length === 0 ? (
        <Vazio className="min-h-[170px]">{t("financeCategoryEmpty")}</Vazio>
      ) : (
        <ul className="space-y-3.5">
          {visiveis.map(({ categoria, valor, pct }) => {
            const c = normalizarCategoria(categoria);
            const cor = cores.categoria(c);
            return (
              <li key={c} className="flex items-center gap-3">
                <IconeSuave Icone={ICONE_CATEGORIA[c]} cor={cor} tamanho="sm" />
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm">{c}</span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">{dinheiro(valor)}</span>
                  </div>
                  {/* Barra relativa à maior categoria, para as diferenças aparecerem. */}
                  <Barra pct={maior > 0 ? (valor / maior) * 100 : 0} cor={cor} />
                </div>
                <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{Math.round(pct)}%</span>
              </li>
            );
          })}
        </ul>
      )}
    </Cartao>
  );
}
