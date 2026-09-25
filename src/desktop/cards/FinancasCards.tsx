import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CalendarClock, Check, LineChart as IconeLinha, Minus, Pencil, PieChart, Plus, Receipt, Target, Trash2 } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useMedia } from "@/hooks/useTelaGrande";
import { executar } from "@/lib/acoes";
import { billsApi, goalsApi, type Bill, type Goal } from "@/lib/db";
import { useContas, useMetas, useTransacoes } from "@/lib/aoVivo";
import { cn } from "@/lib/utils";
import { ICONE_CATEGORIA, useCores } from "../categorias";
import { acumuladoNoPeriodo, diasDoPeriodo, gastosPorCategoria, transacoesDesde, type Periodo } from "../calculos";
import { diaMes } from "../formato";
import { Rosca } from "../graficos";
import { ContaDialog, MetaDialog } from "../Formularios";
import { Barra, BotaoIcone, Cartao, CartaoTopo, Esqueleto, IconeSuave, Segmentado, Vazio } from "../ui";
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

function LinhaMeta({ meta, onEditar }: { meta: Goal; onEditar: () => void }) {
  const { t } = useLocale();
  const cores = useCores();
  const concluida = meta.progress >= 100;
  const cor = concluida ? cores.serie("saldo") : cores.serie("metas");

  const mudar = (delta: number) => {
    const novo = Math.max(0, Math.min(100, meta.progress + delta));
    if (novo === meta.progress) return;
    executar(() => goalsApi.update(meta.id, { progress: novo }), { erro: t("erroAoSalvar") });
  };
  const excluir = () => executar(() => goalsApi.delete(meta.id), { erro: t("erroAoExcluir") });

  return (
    <li className="group flex items-center gap-3.5 rounded-xl px-1 py-3">
      <IconeSuave Icone={concluida ? Check : Target} cor={cor} tamanho="lg" className="rounded-[14px]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold">{meta.title}</p>
          <span className="shrink-0 text-xs font-semibold tabular-nums">
            {meta.progress}%
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {meta.target}
          {meta.deadline ? ` · ${meta.deadline}` : ""}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Barra pct={meta.progress} cor={cor} className="flex-1" altura="h-2" />
          <div className="flex w-0 overflow-hidden opacity-0 transition-all group-focus-within:w-auto group-focus-within:opacity-100 group-hover:w-auto group-hover:opacity-100">
            <BotaoIcone rotulo={t("goalsDecrease")} onClick={() => mudar(-10)} className="h-6 w-6">
              <Minus className="h-3.5 w-3.5" />
            </BotaoIcone>
            <BotaoIcone rotulo={t("goalsIncrease")} onClick={() => mudar(10)} className="h-6 w-6">
              <Plus className="h-3.5 w-3.5" />
            </BotaoIcone>
            <BotaoIcone rotulo={t("goalsEdit")} onClick={onEditar} className="h-6 w-6">
              <Pencil className="h-3 w-3" />
            </BotaoIcone>
            <BotaoIcone rotulo={t("goalsDelete")} onClick={excluir} className="h-6 w-6 hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </BotaoIcone>
          </div>
        </div>
      </div>
    </li>
  );
}

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
        <ul className="-mx-1 max-h-[430px] divide-y divide-border/60 overflow-y-auto">
          {/* Em andamento primeiro; concluídas no fim. */}
          {[...itens.filter((m) => m.progress < 100), ...itens.filter((m) => m.progress >= 100)].map((m) => (
            <LinhaMeta key={m.id} meta={m} onEditar={() => setDialogo({ aberto: true, meta: m })} />
          ))}
        </ul>
      )}
      <MetaDialog aberto={dialogo.aberto} inicial={dialogo.meta} onFechar={() => setDialogo({ aberto: false })} />
    </Cartao>
  );
}

// ==============================================
// Contas do mês
// ==============================================

function situacao(conta: Bill, hoje: number) {
  if (conta.paid) return "paga" as const;
  const dia = parseInt(conta.dueDate, 10);
  if (!Number.isFinite(dia)) return "aberta" as const;
  if (dia < hoje) return "vencida" as const;
  if (dia - hoje <= 5) return "vencendo" as const;
  return "aberta" as const;
}

function CartaoConta({ conta, onEditar }: { conta: Bill; onEditar: () => void }) {
  const { t } = useLocale();
  const dinheiro = useDinheiro();
  const hoje = new Date().getDate();
  const estado = situacao(conta, hoje);
  const dia = parseInt(conta.dueDate, 10);
  const faltam = dia - hoje;

  const alternar = () => executar(() => billsApi.update(conta.id, { paid: !conta.paid }), { erro: t("erroAoSalvar") });
  const excluir = () => executar(() => billsApi.delete(conta.id), { erro: t("erroAoExcluir") });

  const selo = {
    paga: { texto: t("contaPaga"), classe: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", Icone: Check },
    vencida: { texto: t("contaVencida"), classe: "bg-rose-500/10 text-rose-700 dark:text-rose-400", Icone: AlertTriangle },
    vencendo: {
      texto: faltam === 0 ? t("avisoVenceHoje") : faltam === 1 ? t("avisoVenceAmanha") : t("avisoVenceEm").replace("{n}", String(faltam)),
      classe: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
      Icone: CalendarClock,
    },
    aberta: { texto: t("contaEmAberto"), classe: "bg-secondary text-muted-foreground", Icone: CalendarClock },
  }[estado];

  return (
    <li
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl border p-3.5 transition-colors",
        conta.paid ? "border-transparent bg-secondary/60" : "border-border/80 bg-card hover:border-primary/30"
      )}
    >
      <button
        type="button"
        onClick={alternar}
        aria-label={conta.paid ? t("financesMarkUnpaid") : t("financesMarkPaid")}
        title={conta.paid ? t("financesMarkUnpaid") : t("financesMarkPaid")}
        className={cn(
          "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-2 transition-colors",
          conta.paid ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/35 hover:border-primary"
        )}
      >
        {conta.paid && <Check className="h-3 w-3" strokeWidth={3.5} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-semibold", conta.paid && "text-muted-foreground line-through")}>{conta.name}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {t("financesDay")} {conta.dueDate} · {conta.category}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn("text-sm font-bold tabular-nums", conta.paid && "text-muted-foreground")}>
          {dinheiro(conta.amount, { centavos: true })}
        </p>
        <span className={cn("mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold", selo.classe)}>
          <selo.Icone className="h-3 w-3" /> {selo.texto}
        </span>
      </div>
      <div className="absolute -top-2.5 right-2 flex gap-0.5 rounded-lg border border-border bg-card p-0.5 opacity-0 shadow-sm transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <BotaoIcone rotulo={t("financesEditBill")} onClick={onEditar} className="h-6 w-6">
          <Pencil className="h-3 w-3" />
        </BotaoIcone>
        <BotaoIcone rotulo={t("financesDeleteBill")} onClick={excluir} className="h-6 w-6 hover:text-destructive">
          <Trash2 className="h-3 w-3" />
        </BotaoIcone>
      </div>
    </li>
  );
}

export function ContasCard({ className }: { className?: string }) {
  const { t } = useLocale();
  const dinheiro = useDinheiro();
  const { itens, pronto } = useContas();
  const [dialogo, setDialogo] = useState<{ aberto: boolean; conta?: Bill }>({ aberto: false });

  const pendente = itens.filter((c) => !c.paid).reduce((s, c) => s + c.amount, 0);
  const pago = itens.filter((c) => c.paid).reduce((s, c) => s + c.amount, 0);
  // Por dia de vencimento; as pagas vão para o fim.
  const ordenadas = [...itens].sort(
    (a, b) => Number(a.paid) - Number(b.paid) || parseInt(a.dueDate, 10) - parseInt(b.dueDate, 10)
  );

  return (
    <Cartao className={className} id="contas">
      <CartaoTopo
        icone={<Receipt className="h-[18px] w-[18px] text-primary" />}
        titulo={t("contasTitulo")}
        subtitulo={t("contasSubtitulo")}
        acao={
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400">
              {t("financesPending")}: {dinheiro(pendente, { centavos: true })}
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {t("contaPagas")}: {dinheiro(pago, { centavos: true })}
            </span>
            <BotaoIcone rotulo={t("financesNewBill")} onClick={() => setDialogo({ aberto: true })}>
              <Plus className="h-[18px] w-[18px]" />
            </BotaoIcone>
          </div>
        }
      />
      {!pronto ? (
        <Esqueleto linhas={2} />
      ) : itens.length === 0 ? (
        <Vazio className="min-h-[90px]">{t("contasVazio")}</Vazio>
      ) : (
        <ul className="grid grid-cols-2 gap-3 pt-1 xl:grid-cols-3 2xl:grid-cols-4">
          {ordenadas.map((c) => (
            <CartaoConta key={c.id} conta={c} onEditar={() => setDialogo({ aberto: true, conta: c })} />
          ))}
        </ul>
      )}
      <ContaDialog aberto={dialogo.aberto} inicial={dialogo.conta} onFechar={() => setDialogo({ aberto: false })} />
    </Cartao>
  );
}

