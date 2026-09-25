import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart as IconeLinha, PieChart, Plus, Target } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useMedia } from "@/hooks/useTelaGrande";
import type { Goal } from "@/lib/db";
import { useMetas, useTransacoes } from "@/lib/aoVivo";
import { cn } from "@/lib/utils";
import { ICONE_CATEGORIA, useCores } from "../categorias";
import { acumuladoNoPeriodo, diasDoPeriodo, gastosPorCategoria, transacoesDesde, type Periodo } from "../calculos";
import { diaMes } from "../formato";
import { Rosca } from "../graficos";
import { MetaDialog } from "../Formularios";
import { ListaMetas } from "@/components/metas/Metas";
import { BotaoIcone, Cartao, CartaoTopo, Esqueleto, Segmentado, Vazio } from "../ui";
import { useDinheiro } from "../valores";
import { usePeriodoRotulos } from "./Resumo";

// ==============================================
// Entradas x gastos (área, acumulado no período)
// ==============================================

function valorCurto(v: number) {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return String(Math.round(v));
}

/** Marcas redondas no eixo (0, 1.000, 2.000...) em vez das que o gráfico inventa (850, 1.700...). */
function marcasRedondas(maximo: number, quantas = 4): number[] {
  if (maximo <= 0) return [0];
  const bruto = maximo / quantas;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= bruto) ?? bruto;
  const marcas: number[] = [];
  for (let v = 0; v < maximo + passo; v += passo) marcas.push(v);
  return marcas;
}

export function EntradasGastosCard({ periodo, onPeriodo }: { periodo: Periodo; onPeriodo: (p: Periodo) => void }) {
  const { t, locale } = useLocale();
  const cores = useCores();
  const dinheiro = useDinheiro();
  const { itens } = useTransacoes();
  const rotulos = usePeriodoRotulos();

  const dados = useMemo(() => acumuladoNoPeriodo(itens, diasDoPeriodo(periodo)), [itens, periodo]);
  const vazio = dados.every((d) => d.entradas === 0 && d.gastos === 0);
  const marcas = useMemo(() => marcasRedondas(Math.max(0, ...dados.map((d) => Math.max(d.entradas, d.gastos)))), [dados]);
  const corE = cores.serie("entradas");
  const corG = cores.serie("gastos");

  return (
    <Cartao className="flex flex-col">
      <CartaoTopo
        icone={<IconeLinha className="h-[18px] w-[18px] text-primary" />}
        titulo={t("financeOverviewTitle")}
        subtitulo={`${rotulos.subtitulo(periodo)} · ${t("acumulado")}`}
        acao={
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-4 text-xs text-muted-foreground xl:flex">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: corE }} /> {t("financeOverviewIncome")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: corG }} /> {t("financeOverviewExpenses")}
              </span>
            </div>
            <Segmentado rotulo={t("periodo")} opcoes={rotulos.opcoes} valor={periodo} onChange={onPeriodo} />
          </div>
        }
      />
      {vazio ? (
        <Vazio className="min-h-[240px] flex-1">{t("semMovimento")}</Vazio>
      ) : (
        <div className="-mx-2 h-[250px] flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradEntradas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={corE} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={corE} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradGastos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={corG} stopOpacity={0.16} />
                  <stop offset="100%" stopColor={corG} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={cores.grade} />
              <XAxis
                dataKey="dia"
                tickFormatter={(d: string) => diaMes(d, locale)}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
                tick={{ fontSize: 11, fill: cores.eixo }}
                dy={6}
              />
              <YAxis
                tickFormatter={valorCurto}
                ticks={marcas}
                domain={[0, marcas[marcas.length - 1]]}
                axisLine={false}
                tickLine={false}
                width={52}
                tick={{ fontSize: 11, fill: cores.eixo }}
              />
              <Tooltip
                cursor={{ stroke: cores.eixo, strokeWidth: 1, strokeDasharray: "0" }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                      <p className="mb-1 font-semibold">{diaMes(String(label), locale)}</p>
                      {payload.map((p) => (
                        <p key={String(p.dataKey)} className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: String(p.color) }} />
                          <span className="text-muted-foreground">
                            {p.dataKey === "entradas" ? t("financeOverviewIncome") : t("financeOverviewExpenses")}
                          </span>
                          <span className="ml-auto pl-3 font-semibold tabular-nums">{dinheiro(Number(p.value))}</span>
                        </p>
                      ))}
                    </div>
                  ) : null
                }
              />
              <Area
                type="monotone"
                dataKey="entradas"
                stroke={corE}
                strokeWidth={2}
                fill="url(#gradEntradas)"
                activeDot={{ r: 4, strokeWidth: 2, stroke: cores.superficie }}
              />
              <Area
                type="monotone"
                dataKey="gastos"
                stroke={corG}
                strokeWidth={2}
                fill="url(#gradGastos)"
                activeDot={{ r: 4, strokeWidth: 2, stroke: cores.superficie }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Cartao>
  );
}

// ==============================================
// Por categoria (rosca)
// ==============================================

export function CategoriasCard({ periodo }: { periodo: Periodo }) {
  const { t } = useLocale();
  const cores = useCores();
  const dinheiro = useDinheiro();
  const { itens } = useTransacoes();
  const rotulos = usePeriodoRotulos();
  const [destaque, setDestaque] = useState<string | null>(null);
  const largo = useMedia("(min-width: 1280px)");

  const { lista, total } = useMemo(() => gastosPorCategoria(transacoesDesde(itens, diasDoPeriodo(periodo)[0])), [itens, periodo]);
  // Na rosca, a ordem é fixa (a das categorias), não a do valor: assim uma
  // categoria nunca troca de vizinha — e as cores foram validadas nessa ordem.
  const fatias = lista
    .map((x) => ({ chave: x.categoria, rotulo: x.categoria, valor: x.valor, cor: cores.categoria(x.categoria) }))
    .sort((a, b) => Object.keys(ICONE_CATEGORIA).indexOf(a.chave) - Object.keys(ICONE_CATEGORIA).indexOf(b.chave));

  return (
    <Cartao className="flex flex-col">
      <CartaoTopo
        icone={<PieChart className="h-[18px] w-[18px] text-amber-500" />}
        titulo={t("porCategoria")}
        subtitulo={`${t("gastosDoPeriodo")} · ${rotulos.subtitulo(periodo).toLowerCase()}`}
      />
      {lista.length === 0 ? (
        <Vazio className="min-h-[240px] flex-1">{t("financeCategoryEmpty")}</Vazio>
      ) : (
        <div className="flex flex-1 items-center gap-4 xl:gap-6">
          <Rosca
            fatias={fatias}
            tamanho={largo ? 164 : 132}
            espessura={largo ? 22 : 18}
            trilho={cores.trilho}
            formatar={(v) => dinheiro(v)}
            destaque={destaque}
            onDestaque={setDestaque}
            centro={
              <>
                <span className="text-lg font-bold leading-tight tabular-nums">{dinheiro(total)}</span>
                <span className="mt-0.5 text-[11px] text-muted-foreground">{t("total")}</span>
              </>
            }
          />
          <ul className="min-w-0 flex-1 space-y-0.5">
            {lista.map((x) => (
              <li
                key={x.categoria}
                onMouseEnter={() => setDestaque(x.categoria)}
                onMouseLeave={() => setDestaque(null)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                  destaque === x.categoria && "bg-secondary"
                )}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cores.categoria(x.categoria) }} />
                <span className="min-w-0 flex-1 truncate">{x.categoria}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{Math.round(x.pct)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Cartao>
  );
}

// ==============================================
// Metas
// ==============================================

export function MetasCard({ className }: { className?: string }) {
  const { t } = useLocale();
  const { itens, pronto } = useMetas();
  const [dialogo, setDialogo] = useState<{ aberto: boolean; meta?: Goal }>({ aberto: false });
  const concluidas = itens.filter((m) => m.progress >= 100).length;

  return (
    <Cartao className={cn("flex flex-col", className)} id="metas">
      <CartaoTopo
        icone={<Target className="h-[18px] w-[18px] text-amber-500" />}
        titulo={t("metasTitulo")}
        subtitulo={t("metasResumo").replace("{feitas}", String(concluidas)).replace("{total}", String(itens.length))}
        acao={
          <BotaoIcone rotulo={t("goalsAdd")} onClick={() => setDialogo({ aberto: true })}>
            <Plus className="h-[18px] w-[18px]" />
          </BotaoIcone>
        }
      />
      {!pronto ? (
        <Esqueleto linhas={3} />
      ) : itens.length === 0 ? (
        <Vazio>{t("goalsEmpty")}</Vazio>
      ) : (
        <ListaMetas
          metas={itens}
          onEditar={(m) => setDialogo({ aberto: true, meta: m })}
          className="-mr-2 max-h-[460px] overflow-y-auto pr-2"
        />
      )}
      <MetaDialog aberto={dialogo.aberto} inicial={dialogo.meta} onFechar={() => setDialogo({ aberto: false })} />
    </Cartao>
  );
}
