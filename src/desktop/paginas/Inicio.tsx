import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownToLine, ArrowRight, ArrowUpToLine, Moon, Sun, Target, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useMedia } from "@/hooks/useTelaGrande";
import { useContas, useMetas, useTransacoes } from "@/lib/aoVivo";
import { dayKey, lastNDays } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Cabecalho } from "../Cabecalho";
import { useCores } from "../categorias";
import { saldoAtual, saldoPorDia, somaPorDia, totaisDoMes, type Periodo } from "../calculos";
import { dataPorExtenso, primeiroNome } from "../formato";
import { Kpi } from "../graficos";
import { Sparkline } from "../ui";
import { useDinheiro } from "../valores";
import { DespesasPorCategoria, ResumoFinanceiro } from "../cards/Resumo";
import { FraseCard, TelegramFaixa } from "../cards/Extras";
import { HabitosCard, TarefasCard } from "../cards/Rotina";
import { UltimasTransacoes } from "../cards/Transacoes";
import { DiaDetalhe } from "../cards/DiaDetalhe";

function Saudacao() {
  const hora = new Date().getHours();
  const noite = hora >= 18 || hora < 5;
  return (
    <span
      className={cn(
        "grid h-14 w-14 shrink-0 place-items-center rounded-full",
        noite ? "bg-indigo-500/10 text-indigo-500" : "bg-amber-400/15 text-amber-500"
      )}
      style={{ boxShadow: noite ? "0 0 0 6px hsl(239 84% 67% / 0.05)" : "0 0 0 6px hsl(43 96% 56% / 0.07)" }}
    >
      {noite ? <Moon className="h-7 w-7" strokeWidth={1.75} /> : <Sun className="h-8 w-8" strokeWidth={1.75} />}
    </span>
  );
}

function Kpis() {
  const { t } = useLocale();
  const cores = useCores();
  const dinheiro = useDinheiro();
  const transacoes = useTransacoes().itens;
  const contas = useContas().itens;
  const metas = useMetas().itens;

  const dados = useMemo(() => {
    const hoje = dayKey();
    const semana = lastNDays(7);
    const mes = lastNDays(30);
    const doDia = transacoes.filter((x) => x.date === hoje);
    const despesas = doDia.filter((x) => x.type === "expense");
    const entradas = doDia.filter((x) => x.type === "income");
    return {
      saldo: saldoAtual(transacoes, contas),
      saldoSerie: saldoPorDia(transacoes, contas, mes),
      noMes: totaisDoMes(transacoes, hoje.slice(0, 7)).saldo,
      despesasHoje: despesas.reduce((s, x) => s + x.amount, 0),
      nDespesas: despesas.length,
      despesasSerie: somaPorDia(transacoes, semana, "expense"),
      entradasHoje: entradas.reduce((s, x) => s + x.amount, 0),
      nEntradas: entradas.length,
      entradasSerie: somaPorDia(transacoes, semana, "income"),
    };
  }, [transacoes, contas]);

  const ativas = metas.filter((m) => m.progress < 100).length;
  const n = (q: number) => `${q} ${q === 1 ? t("transacao") : t("financesTransactions").toLowerCase()}`;

  return (
    <div className="grid grid-cols-4 gap-4 wide:gap-5">
      <Kpi
        Icone={Wallet}
        cor={cores.serie("saldo")}
        rotulo={t("saldoTotal")}
        valor={dinheiro(dados.saldo)}
        rodape={
          <span className={cn("font-semibold", dados.noMes >= 0 ? "text-positivo" : "text-negativo")}>
            {dados.noMes >= 0 ? "↑" : "↓"} {dinheiro(Math.abs(dados.noMes))}
            <span className="ml-1 font-normal text-muted-foreground">{t("noMes")}</span>
          </span>
        }
        grafico={<Sparkline valores={dados.saldoSerie} cor={cores.serie("saldo")} largura={64} altura={30} className="w-[52px] wide:w-16" />}
      />
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

  return (
    <>
      <Cabecalho
        icone={<Saudacao />}
        titulo={`${saudacao}, ${nome}`}
        subtitulo={`${dataPorExtenso(new Date(), locale)} · ${t("saudacaoPergunta")}`}
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
