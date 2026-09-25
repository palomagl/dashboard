import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownToLine, ArrowRight, ArrowUpToLine, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useMedia } from "@/hooks/useTelaGrande";
import { useClima } from "@/hooks/useClima";
import type { Clima } from "@/lib/clima";
import { useResumoClima, visualDoCeu } from "@/components/Clima";
import { useMetas, useTransacoes } from "@/lib/aoVivo";
import { dayKey, lastNDays } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Cabecalho } from "../Cabecalho";
import { useCores } from "../categorias";
import { somaPorDia, type Periodo } from "../calculos";
import { dataPorExtenso, primeiroNome } from "../formato";
import { Kpi } from "../graficos";
import { Sparkline } from "../ui";
import { useDinheiro } from "../valores";
import { DespesasPorCategoria, ResumoFinanceiro } from "../cards/Resumo";
import { FraseCard, TelegramFaixa } from "../cards/Extras";
import { HabitosCard, TarefasCard } from "../cards/Rotina";
import { UltimasTransacoes } from "../cards/Transacoes";
import { DiaDetalhe } from "../cards/DiaDetalhe";
import { SaldoKpi } from "../cards/Saldo";

/** O círculo do "Hoje": o céu de agora em Sapiranga (sol, nuvem, chuva, lua...) e a temperatura. */
function Saudacao({ clima, resumo }: { clima: Clima | null; resumo: string | null }) {
  const { Icone, classe, aura } = visualDoCeu(clima);
  return (
    <span
      className={cn("relative grid h-14 w-14 shrink-0 place-items-center rounded-full", classe)}
      style={{ boxShadow: `0 0 0 6px ${aura}` }}
      title={resumo ?? undefined}
    >
      <Icone className="h-7 w-7" strokeWidth={1.75} />
      {clima && (
        <span className="absolute -bottom-1.5 -right-2 rounded-full border border-border/80 bg-card px-1.5 py-px text-[11px] font-bold tabular-nums text-foreground shadow-sm">
          {clima.temperatura}°
        </span>
      )}
      {resumo && <span className="sr-only">{resumo}</span>}
    </span>
  );
}

function Kpis() {
  const { t } = useLocale();
  const cores = useCores();
  const dinheiro = useDinheiro();
  const transacoes = useTransacoes().itens;
  const metas = useMetas().itens;

  const dados = useMemo(() => {
    const hoje = dayKey();
    const semana = lastNDays(7);
    const doDia = transacoes.filter((x) => x.date === hoje);
    const despesas = doDia.filter((x) => x.type === "expense");
    const entradas = doDia.filter((x) => x.type === "income");
    return {
      despesasHoje: despesas.reduce((s, x) => s + x.amount, 0),
      nDespesas: despesas.length,
      despesasSerie: somaPorDia(transacoes, semana, "expense"),
      entradasHoje: entradas.reduce((s, x) => s + x.amount, 0),
      nEntradas: entradas.length,
      entradasSerie: somaPorDia(transacoes, semana, "income"),
    };
  }, [transacoes]);

  const ativas = metas.filter((m) => m.progress < 100).length;
  const n = (q: number) => `${q} ${q === 1 ? t("transacao") : t("financesTransactions").toLowerCase()}`;

  return (
    <div className="grid grid-cols-4 gap-4 wide:gap-5">
      <SaldoKpi rotulo={t("saldoTotal")} />
      <Kpi
        atraso={50}
        Icone={ArrowDownToLine}
        cor={cores.serie("gastos")}
        rotulo={t("despesasHoje")}
        valor={dinheiro(dados.despesasHoje)}
        rodape={<span className="text-muted-foreground">{n(dados.nDespesas)}</span>}
        grafico={<Sparkline valores={dados.despesasSerie} cor={cores.serie("gastos")} largura={64} altura={30} className="w-[52px] wide:w-16" />}
      />
      <Kpi
        atraso={100}
        Icone={ArrowUpToLine}
        cor={cores.serie("entradas")}
        rotulo={t("entradasHoje")}
        valor={dinheiro(dados.entradasHoje)}
        rodape={<span className="text-muted-foreground">{n(dados.nEntradas)}</span>}
        grafico={<Sparkline valores={dados.entradasSerie} cor={cores.serie("entradas")} largura={64} altura={30} className="w-[52px] wide:w-16" />}
      />
      <Kpi
        atraso={150}
        Icone={Target}
        cor={cores.serie("metas")}
        rotulo={t("goalsTitle")}
        valor={ativas}
        rodape={
          <Link
            to="/financas#metas"
            className="flex items-center gap-1 font-semibold text-amber-600 hover:underline dark:text-amber-400"
          >
            {t("verDetalhes")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
    </div>
  );
}

export default function InicioDesktop() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const [periodo, setPeriodo] = useState<Periodo>("30d");
  const [diaAberto, setDiaAberto] = useState<string | null>(null);
  // Com 1360px ou mais sobra largura para a coluna de transações à direita,
  // como na referência; abaixo disso ela desce para o meio da página (senão
  // os cards de número ficam estreitos demais e cortam o texto).
  const comColuna = useMedia("(min-width: 1360px)");

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? t("greetingMorning") : hora < 18 ? t("greetingAfternoon") : t("greetingEvening");
  const nome = primeiroNome(user?.name) || t("user");
  const clima = useClima();
  const resumoClima = useResumoClima(clima);

  return (
    <>
      <Cabecalho
        icone={<Saudacao clima={clima} resumo={resumoClima} />}
        titulo={`${saudacao}, ${nome}`}
        subtitulo={[dataPorExtenso(new Date(), locale), resumoClima, t("saudacaoPergunta")].filter(Boolean).join(" · ")}
      />

      <div className={cn("grid gap-4 wide:gap-5", comColuna && "grid-cols-[minmax(0,1fr)_320px] wide:grid-cols-[minmax(0,1fr)_340px]")}>
        <div className="min-w-0 space-y-4 wide:space-y-5">
          <Kpis />
          <div className="grid grid-cols-2 gap-4 wide:gap-5">
            <ResumoFinanceiro periodo={periodo} onPeriodo={setPeriodo} />
            <DespesasPorCategoria periodo={periodo} />
          </div>
          <div className="grid grid-cols-2 gap-4 wide:gap-5">
            <TarefasCard limite={5} className="h-full" />
            <HabitosCard limite={6} className="h-full" />
          </div>
          {!comColuna && (
            <div className="grid grid-cols-2 gap-4">
              <UltimasTransacoes />
              <FraseCard onAbrirDia={() => setDiaAberto(dayKey())} />
            </div>
          )}
          <TelegramFaixa />
        </div>

        {comColuna && (
          <aside className="flex min-w-0 flex-col gap-4 wide:gap-5">
            <UltimasTransacoes />
            <FraseCard className="flex-1" onAbrirDia={() => setDiaAberto(dayKey())} />
          </aside>
        )}
      </div>

      <DiaDetalhe dia={diaAberto} onMudarDia={setDiaAberto} />
    </>
  );
}
