import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, SkipForward, Sprout, Timer } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import type { Dia } from "@/lib/aoVivo";
import { dayKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useCores } from "../categorias";
import { dataDoDia } from "../formato";
import { DURACOES, relogio, usePomodoro, type ModoPomodoro } from "../pomodoro";
import { BotaoIcone, Cartao, CartaoTopo, Segmentado } from "../ui";

function idioma(locale: string) {
  return locale === "pt" ? "pt-BR" : "en-US";
}

function diaSemanaCurto(chave: string, locale: string) {
  const s = dataDoDia(chave).toLocaleDateString(idioma(locale), { weekday: "short" }).replace(".", "");
  return s.charAt(0).toUpperCase() + s.slice(1, 3);
}

// ==============================================
// Faixa da semana
// ==============================================

export function SemanaCard({
  semana,
  dias,
  onAnterior,
  onProxima,
  onHoje,
  onSelecionar,
  ehSemanaAtual,
}: {
  semana: string[];
  dias: Map<string, Dia>;
  onAnterior: () => void;
  onProxima: () => void;
  onHoje: () => void;
  /** Clicar num dia abre "o que eu fiz nesse dia". */
  onSelecionar: (dia: string) => void;
  ehSemanaAtual: boolean;
}) {
  const { t, locale } = useLocale();
  const hoje = dayKey();
  const dataHoje = new Date().toLocaleDateString(idioma(locale), { day: "numeric", month: "long" });

  return (
    <Cartao className="flex items-center gap-3 p-3.5 wide:p-4">
      <BotaoIcone rotulo={t("semanaAnterior")} onClick={onAnterior} className="h-10 w-10 rounded-xl">
        <ChevronLeft className="h-5 w-5" />
      </BotaoIcone>
      <ol className="grid flex-1 grid-cols-7 gap-2">
        {semana.map((d) => {
          const ehHoje = d === hoje;
          const futuro = d > hoje;
          const dia = dias.get(d);
          const total = (dia?.tarefas ?? 0) + (dia?.habitos ?? 0);
          return (
            <li key={d}>
              <button
                type="button"
                disabled={futuro}
                onClick={() => onSelecionar(d)}
                aria-current={ehHoje ? "date" : undefined}
                title={futuro ? undefined : t("verODia")}
                className={cn(
                  "flex w-full flex-col items-center rounded-2xl py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  ehHoje ? "bg-primary/10 text-primary ring-1 ring-primary/25 hover:bg-primary/15" : "hover:bg-secondary",
                  futuro && "cursor-default opacity-45 hover:bg-transparent"
                )}
              >
              <span className={cn("text-xs font-medium", ehHoje ? "text-primary" : "text-muted-foreground")}>
                {diaSemanaCurto(d, locale)}
              </span>
              <span className="mt-0.5 text-lg font-bold tabular-nums">{Number(d.slice(8))}</span>
              <span
                className={cn(
                  "mt-1 h-4 min-w-[1rem] rounded-full px-1.5 text-center text-[10px] font-semibold leading-4 tabular-nums",
                  total > 0 ? "bg-primary/15 text-primary" : "text-transparent"
                )}
                title={total > 0 ? t("concluidosNoDia").replace("{n}", String(total)) : undefined}
              >
                {total > 0 ? `✓ ${total}` : "·"}
              </span>
              </button>
            </li>
          );
        })}
      </ol>
      <BotaoIcone
        rotulo={t("proximaSemana")}
        onClick={onProxima}
        disabled={ehSemanaAtual}
        className="h-10 w-10 rounded-xl disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight className="h-5 w-5" />
      </BotaoIcone>
      <button
        type="button"
        onClick={onHoje}
        className="ml-1 flex h-11 shrink-0 items-center gap-2 rounded-xl border border-border/80 bg-background px-4 text-sm font-medium transition-colors hover:border-primary/40"
        title={t("irParaHoje")}
      >
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        {dataHoje}
      </button>
    </Cartao>
  );
}

// ==============================================
// Rotina da semana (barras)
// ==============================================

export function RotinaSemanaCard({
  semana,
  dias,
  onSelecionar,
}: {
  semana: string[];
  dias: Map<string, Dia>;
  onSelecionar: (dia: string) => void;
}) {
  const { t, locale } = useLocale();
  const cores = useCores();
  const dados = semana.map((d) => ({
    dia: d,
    tarefas: dias.get(d)?.tarefas ?? 0,
    habitos: dias.get(d)?.habitos ?? 0,
  }));
  const vazio = dados.every((d) => d.tarefas === 0 && d.habitos === 0);
  const corT = cores.serie("tarefas");
  const corH = cores.serie("habitos");
  const intervalo = `${dataDoDia(semana[0]).toLocaleDateString(idioma(locale), { day: "numeric" })}–${dataDoDia(
    semana[6]
  ).toLocaleDateString(idioma(locale), { day: "numeric", month: "short" })}`;

  return (
    <Cartao className="flex flex-col">
      <CartaoTopo
        icone={<BarChart3 className="h-[18px] w-[18px] text-primary" />}
        titulo={t("rotinaDaSemana")}
        subtitulo={`${t("chartSubtitle")} · ${intervalo}`}
        acao={
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: corT }} /> {t("chartTasks")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: corH }} /> {t("chartHabits")}
            </span>
          </div>
        }
      />
      {vazio ? (
        <div className="flex min-h-[220px] flex-1 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
          {t("chartNoData")}
        </div>
      ) : (
        <div className="-mx-2 h-[230px] flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dados}
              barGap={3}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              className="cursor-pointer"
              onClick={(e) => {
                const dia = (e as { activeLabel?: string } | null)?.activeLabel;
                if (dia && dia <= dayKey()) onSelecionar(dia);
              }}
            >
              <CartesianGrid vertical={false} stroke={cores.grade} />
              <XAxis
                dataKey="dia"
                axisLine={false}
                tickLine={false}
                interval={0}
                height={40}
                tick={({ x, y, payload }) => (
                  <g transform={`translate(${x},${y})`}>
                    <text textAnchor="middle" dy={12} fontSize={11} fill={cores.eixo}>
                      {diaSemanaCurto(payload.value, locale)}
                    </text>
                    <text textAnchor="middle" dy={27} fontSize={11} fill={cores.eixo} opacity={0.75}>
                      {Number(String(payload.value).slice(8))}
                    </text>
                  </g>
                )}
              />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={28} tick={{ fontSize: 11, fill: cores.eixo }} />
              <Tooltip
                cursor={{ fill: cores.grade, opacity: 0.5, radius: 8 } as never}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                      <p className="mb-1 font-semibold">
                        {dataDoDia(String(label)).toLocaleDateString(idioma(locale), { weekday: "long", day: "numeric", month: "short" })}
                      </p>
                      {payload.map((p) => (
                        <p key={String(p.dataKey)} className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: String(p.color) }} />
                          <span className="text-muted-foreground">{p.dataKey === "tarefas" ? t("chartTasks") : t("chartHabits")}</span>
                          <span className="ml-auto pl-3 font-semibold tabular-nums">{String(p.value)}</span>
                        </p>
                      ))}
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="tarefas" fill={corT} radius={[4, 4, 0, 0]} maxBarSize={14} />
              <Bar dataKey="habitos" fill={corH} radius={[4, 4, 0, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Cartao>
  );
}

// ==============================================
// Foco do dia (Pomodoro)
// ==============================================

function Montanhas() {
  // Ilustração leve no rodapé do card: montanhas com uma bandeirinha no topo.
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 120"
      preserveAspectRatio="xMidYMax slice"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[30%] w-full opacity-80"
    >
      <defs>
        <linearGradient id="mont-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="hsl(252 80% 70%)" stopOpacity="0.22" />
          <stop offset="1" stopColor="hsl(252 80% 70%)" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="mont-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="hsl(252 80% 66%)" stopOpacity="0.32" />
          <stop offset="1" stopColor="hsl(252 80% 66%)" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <path d="M0 120 L70 62 L118 92 L190 30 L262 88 L310 58 L400 110 L400 120 Z" fill="url(#mont-a)" />
      <path d="M40 120 L150 70 L205 40 L262 78 L330 120 Z" fill="url(#mont-b)" />
      <line x1="205" y1="40" x2="205" y2="16" stroke="hsl(252 60% 60%)" strokeOpacity="0.55" strokeWidth="1.6" />
      <path d="M205 16 L222 21 L205 26 Z" fill="hsl(252 75% 64%)" fillOpacity="0.7" />
    </svg>
  );
}

const COR_MODO: Record<ModoPomodoro, number> = { focus: 0, short: 1, long: 2 };

export function FocoCard({ className }: { className?: string }) {
  const { t } = useLocale();
  const cores = useCores();
  const p = usePomodoro();
  const cor = [cores.serie("habitos"), cores.serie("tarefas"), "#3b82f6"][COR_MODO[p.modo]];

  const r = 64;
  const circ = 2 * Math.PI * r;

  return (
    <Cartao className={cn("relative flex flex-col overflow-hidden", className)}>
      <Montanhas />
      <CartaoTopo
        icone={<Timer className="h-[18px] w-[18px]" style={{ color: cores.serie("habitos") }} />}
        titulo={t("focoDoDia")}
        subtitulo={`${t("pomodoroTitle")} · ${p.sessoesHoje} ${t("pomodoroSessionsToday")}`}
        acao={
          <div className="flex items-center gap-1" title={t("cicloPomodoro")} aria-label={t("cicloPomodoro")}>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: i < p.ciclo ? cores.serie("habitos") : cores.trilho }}
              />
            ))}
          </div>
        }
        className="relative"
      />

      <div className="relative flex flex-1 flex-col items-center gap-5 pb-6 xl:flex-row xl:gap-6">
        <div className="relative h-[156px] w-[156px] shrink-0">
          <svg viewBox="0 0 156 156" className="h-full w-full -rotate-90">
            <circle cx="78" cy="78" r={r} fill="none" stroke={cores.trilho} strokeWidth="9" />
            <circle
              cx="78"
              cy="78"
              r={r}
              fill="none"
              stroke={cor}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - p.progresso)}
              style={{ transition: "stroke-dashoffset 0.3s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[32px] font-bold leading-none tabular-nums">{relogio(p.restante)}</span>
            <span className="mt-1.5 text-xs text-muted-foreground">
              {p.modo === "focus" ? t("pomodoroFocus") : p.modo === "short" ? t("pomodoroShortBreak") : t("pomodoroLongBreak")}
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center space-y-5 xl:items-start">
          <Segmentado<ModoPomodoro>
            rotulo={t("pomodoroTitle")}
            valor={p.modo}
            onChange={p.trocarModo}
            opcoes={[
              { valor: "focus", rotulo: `${DURACOES.focus / 60} min` },
              { valor: "short", rotulo: `${DURACOES.short / 60} min` },
              { valor: "long", rotulo: `${DURACOES.long / 60} min` },
            ]}
          />
          <div className="flex items-center gap-3">
            <BotaoIcone rotulo={t("pomodoroReset")} onClick={p.reiniciar} className="h-10 w-10 rounded-full">
              <RotateCcw className="h-4 w-4" />
            </BotaoIcone>
            <button
              type="button"
              onClick={p.alternar}
              aria-label={p.rodando ? t("pomodoroPause") : t("pomodoroStart")}
              className="grid h-14 w-14 place-items-center rounded-full text-white shadow-lg transition-transform active:scale-95"
              style={{ backgroundColor: cor, boxShadow: `0 10px 24px -10px ${cor}` }}
            >
              {p.rodando ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
            </button>
            <BotaoIcone rotulo={t("pomodoroSkip")} onClick={p.pular} className="h-10 w-10 rounded-full">
              <SkipForward className="h-4 w-4" />
            </BotaoIcone>
          </div>
          
        </div>
      </div>
    </Cartao>
  );
}

// ==============================================
// Faixa de frase (rodapé da Rotina)
// ==============================================

export function FraseRotina() {
  const { t } = useLocale();
  return (
    <section
      className="cartao flex items-center gap-4 overflow-hidden px-6 py-5 animate-fade-in"
      style={{ backgroundImage: "linear-gradient(90deg, hsl(var(--primary) / 0.06), transparent 60%)" }}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10">
        <Sprout className="h-5 w-5 text-primary" strokeWidth={1.75} />
      </span>
      <p className="flex-1 text-[15px] font-medium text-foreground/80">{t("fraseDisciplina")}</p>
      <span className="shrink-0 -rotate-3 font-script text-[26px] leading-none text-primary">{t("voceConsegue")} ♡</span>
    </section>
  );
}
