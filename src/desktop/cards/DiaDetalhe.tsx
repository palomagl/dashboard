import { useMemo } from "react";
import { ArrowDownToLine, Check, ChevronLeft, ChevronRight, Flame, Sprout, Timer } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLocale } from "@/contexts/LocaleContext";
import { useDia, useHabitos, useNotas, useTransacoes, type HabitoAoVivo } from "@/lib/aoVivo";
import { dayKey, previousDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ETIQUETA_TAREFA, ICONES_HABITO, ROTULO_TAREFA, useCores } from "../categorias";
import { dataDoDia, dataPorExtenso } from "../formato";
import { Barra, BotaoIcone } from "../ui";
import { useDinheiro } from "../valores";
import { LinhaTransacao } from "./Transacoes";

// ==============================================
// "O que eu fiz nesse dia"
// ==============================================
// Abre ao clicar num dia da semana (ou numa barra do gráfico) na Rotina.
// Junta tudo o que ficou registrado daquele dia: hábitos, tarefas, gastos e
// entradas, metas que avançaram, focos do Pomodoro e notas criadas.
//
// Os nomes de tarefas e hábitos passaram a ser anotados no dia a partir
// desta versão (db.ts, anotarNoDia). Para dias anteriores:
// - hábitos saem da sequência atual (quem tem sequência de 5 terminando
//   hoje foi feito nos últimos 5 dias — isso é certo);
// - tarefas só têm a contagem, e a tela diz isso em vez de inventar nomes.

function proximoDia(chave: string): string {
  const d = dataDoDia(chave);
  d.setDate(d.getDate() + 1);
  return dayKey(d);
}

function diasEntre(de: string, ate: string): number {
  return Math.round((dataDoDia(ate).getTime() - dataDoDia(de).getTime()) / 86_400_000);
}

/** Pela sequência atual: o hábito com certeza foi feito nesse dia? */
function feitoPelaSequencia(h: HabitoAoVivo, dia: string): boolean {
  if (!h.lastCompletedOn || h.streak <= 0 || dia > h.lastCompletedOn) return false;
  return diasEntre(dia, h.lastCompletedOn) < h.streak;
}

function Secao({ titulo, contagem, children }: { titulo: string; contagem?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-baseline justify-between text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {titulo}
        {contagem && <span className="normal-case tracking-normal">{contagem}</span>}
      </h3>
      {children}
    </section>
  );
}

function Numero({ Icone, cor, valor, rotulo }: { Icone: typeof Check; cor: string; valor: string; rotulo: string }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-3.5">
      <Icone className="h-4 w-4" style={{ color: cor }} />
      <p className="mt-2 text-lg font-bold leading-none tabular-nums">{valor}</p>
      <p className="mt-1 text-xs text-muted-foreground">{rotulo}</p>
    </div>
  );
}

export function DiaDetalhe({ dia, onMudarDia }: { dia: string | null; onMudarDia: (d: string | null) => void }) {
  const { t, locale } = useLocale();
  const cores = useCores();
  const dinheiro = useDinheiro();
  const { dia: registro, pronto } = useDia(dia);
  const habitos = useHabitos().itens;
  const transacoes = useTransacoes().itens;
  const notas = useNotas().itens;

  const hoje = dayKey();
  const ehHoje = dia === hoje;

  const dados = useMemo(() => {
    if (!dia) return null;
    const anotados = registro?.habitosFeitos ?? {};
    const listaHabitos = Object.entries(anotados).map(([id, h]) => ({ id, nome: h.nome, icone: h.icone }));
    // Completa com o que a sequência garante (dias antes do histórico existir).
    for (const h of habitos) {
      if (!anotados[h.id] && feitoPelaSequencia(h, dia)) listaHabitos.push({ id: h.id, nome: h.name, icone: h.icon });
    }
    const tarefas = Object.entries(registro?.tarefasFeitas ?? {}).map(([id, x]) => ({ id, ...x }));
    const doDia = transacoes.filter((x) => x.date === dia);
    const gastos = doDia.filter((x) => x.type === "expense").reduce((s, x) => s + x.amount, 0);
    const entradas = doDia.filter((x) => x.type === "income").reduce((s, x) => s + x.amount, 0);
    const notasDoDia = notas.filter((n) => n.criadaEm && dayKey(n.criadaEm) === dia);
    const metas = Object.entries(registro?.metas ?? {}).map(([id, m]) => ({ id, ...m }));
    return {
      habitos: listaHabitos,
      totalHabitos: Math.max(registro?.habitos ?? 0, listaHabitos.length),
      tarefas,
      totalTarefas: Math.max(registro?.tarefas ?? 0, tarefas.length),
      transacoes: doDia,
      gastos,
      entradas,
      notas: notasDoDia,
      metas,
      focos: registro?.focos ?? 0,
    };
  }, [dia, registro, habitos, transacoes, notas]);

  const vazio =
    dados &&
    dados.totalHabitos === 0 &&
    dados.totalTarefas === 0 &&
    dados.transacoes.length === 0 &&
    dados.notas.length === 0 &&
    dados.metas.length === 0 &&
    dados.focos === 0;

  const rotuloDia = !dia
    ? ""
    : ehHoje
      ? t("hoje")
      : dia === previousDay(hoje)
        ? t("ontem")
        : "";

  return (
    <Sheet open={!!dia} onOpenChange={(aberto) => !aberto && onMudarDia(null)}>
      <SheetContent side="right" className="flex w-[460px] flex-col gap-0 p-0 sm:max-w-[460px]">
        <SheetHeader className="space-y-1 border-b border-border/80 px-6 pb-5 pt-6 text-left">
          <div className="flex items-center gap-1 pr-8">
            <BotaoIcone rotulo={t("diaAnterior")} onClick={() => dia && onMudarDia(previousDay(dia))} className="-ml-2">
              <ChevronLeft className="h-4 w-4" />
            </BotaoIcone>
            <BotaoIcone
              rotulo={t("proximoDia")}
              onClick={() => dia && !ehHoje && onMudarDia(proximoDia(dia))}
              disabled={ehHoje}
              className="disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </BotaoIcone>
            {rotuloDia && (
              <span className="ml-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{rotuloDia}</span>
            )}
          </div>
          <SheetTitle className="text-xl">{dia ? dataPorExtenso(dataDoDia(dia), locale) : ""}</SheetTitle>
          <SheetDescription>{t("diaResumoSubtitulo")}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
          {!pronto || !dados ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[84px] animate-pulse rounded-2xl bg-secondary" />
              ))}
            </div>
          ) : vazio ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
              <Sprout className="h-7 w-7 text-primary" strokeWidth={1.75} />
              <p className="text-sm text-muted-foreground">{ehHoje ? t("diaVazioHoje") : t("diaVazio")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Numero Icone={Check} cor={cores.serie("tarefas")} valor={String(dados.totalTarefas)} rotulo={t("tarefasConcluidas")} />
                <Numero Icone={Flame} cor="#f97316" valor={String(dados.totalHabitos)} rotulo={t("habitosFeitos")} />
                <Numero Icone={ArrowDownToLine} cor={cores.serie("gastos")} valor={dinheiro(dados.gastos)} rotulo={t("gastosNoDia")} />
                <Numero Icone={Timer} cor={cores.serie("habitos")} valor={String(dados.focos)} rotulo={t("focosPomodoro")} />
              </div>

              {dados.habitos.length > 0 && (
                <Secao titulo={t("habitosMetasDiarias")} contagem={String(dados.habitos.length)}>
                  <div className="flex flex-wrap gap-2">
                    {dados.habitos.map((h) => {
                      const Icone = ICONES_HABITO[h.icone] ?? ICONES_HABITO.Leaf;
                      return (
                        <span
                          key={h.id}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
                          style={{ backgroundColor: `color-mix(in srgb, ${cores.serie("habitos")} 11%, transparent)` }}
                        >
                          <Icone className="h-4 w-4" style={{ color: cores.serie("habitos") }} />
                          {h.nome}
                        </span>
                      );
                    })}
                  </div>
                </Secao>
              )}

              {dados.totalTarefas > 0 && (
                <Secao titulo={t("tarefasConcluidas")} contagem={String(dados.totalTarefas)}>
                  {dados.tarefas.length > 0 && (
                    <ul className="space-y-1.5">
                      {dados.tarefas.map((x) => (
                        <li key={x.id} className="flex items-center gap-3 rounded-xl bg-secondary/60 px-3 py-2.5">
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" strokeWidth={3.5} />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm">{x.titulo}</span>
                          <span
                            className={cn(
                              "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold",
                              ETIQUETA_TAREFA[x.categoria] ?? ETIQUETA_TAREFA.Geral
                            )}
                          >
                            {t(ROTULO_TAREFA[x.categoria] ?? "categoryGeneral")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {dados.totalTarefas > dados.tarefas.length && (
                    <p className="rounded-xl bg-secondary/60 px-3 py-2.5 text-xs text-muted-foreground">
                      {t(dados.tarefas.length > 0 ? "tarefasSemNomeMais" : "tarefasSemNome").replace(
                        "{n}",
                        String(dados.totalTarefas - dados.tarefas.length)
                      )}
                    </p>
                  )}
                </Secao>
              )}

              {dados.transacoes.length > 0 && (
                <Secao
                  titulo={t("dinheiroNoDia")}
                  contagem={[
                    dados.gastos > 0 ? `${t("financeOverviewExpenses")} ${dinheiro(dados.gastos)}` : "",
                    dados.entradas > 0 ? `${t("financeOverviewIncome")} ${dinheiro(dados.entradas)}` : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                >
                  <ul className="-mx-1 divide-y divide-border/60">
                    {dados.transacoes.map((tx) => (
                      <LinhaTransacao key={tx.id} tx={tx} />
                    ))}
                  </ul>
                </Secao>
              )}

              {dados.metas.length > 0 && (
                <Secao titulo={t("metasQueAvancaram")}>
                  <ul className="space-y-3">
                    {dados.metas.map((m) => (
                      <li key={m.id} className="space-y-1.5">
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="truncate font-medium">{m.titulo}</span>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {m.de}% → <span className="font-semibold text-foreground">{m.para}%</span>
                          </span>
                        </div>
                        <Barra pct={m.para} cor={cores.serie("metas")} />
                      </li>
                    ))}
                  </ul>
                </Secao>
              )}

              {dados.notas.length > 0 && (
                <Secao titulo={t("notasDoDia")} contagem={String(dados.notas.length)}>
                  <div className="space-y-2">
                    {dados.notas.map((n) => (
                      <p key={n.id} className={cn("line-clamp-3 whitespace-pre-wrap rounded-xl px-3.5 py-3 text-sm", n.color)}>
                        {n.content}
                      </p>
                    ))}
                  </div>
                </Secao>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
