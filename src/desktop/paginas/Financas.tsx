import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowDownToLine, ArrowUpToLine, Eye, EyeOff, Target, Wallet } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useContas, useMetas, useTransacoes } from "@/lib/aoVivo";
import { dayKey, lastNDays } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Cabecalho, IconePagina } from "../Cabecalho";
import { useCores } from "../categorias";
import { saldoAtual, saldoPorDia, somaPorDia, totaisDoMes, variacao, type Periodo } from "../calculos";
import { mesAnterior } from "../formato";
import { Delta, Kpi } from "../graficos";
import { Barra, Sparkline } from "../ui";
import { useDinheiro, useValores } from "../valores";
import { CategoriasCard, ContasCard, EntradasGastosCard, MetasCard } from "../cards/FinancasCards";
import { TransacoesCard } from "../cards/Transacoes";
import { TelegramFaixa } from "../cards/Extras";

function Kpis() {
  const { t } = useLocale();
  const cores = useCores();
  const dinheiro = useDinheiro();
  const { ocultos, alternar } = useValores();
  const transacoes = useTransacoes().itens;
  const metas = useMetas().itens;

  const d = useMemo(() => {
    const mes = dayKey().slice(0, 7);
    const atual = totaisDoMes(transacoes, mes);
    const anterior = totaisDoMes(transacoes, mesAnterior(mes));
    const dias = lastNDays(30);
    return {
      saldo: saldoAtual(transacoes, contas),
      saldoSerie: saldoPorDia(transacoes, contas, dias),
      liquidoMes: atual.saldo,
      entradas: atual.entradas,
      gastos: atual.gastos,
      varEntradas: variacao(atual.entradas, anterior.entradas),
      varGastos: variacao(atual.gastos, anterior.gastos),
      serieEntradas: somaPorDia(transacoes, dias, "income"),
      serieGastos: somaPorDia(transacoes, dias, "expense"),
    };
  }, [transacoes, contas]);

  const concluidas = metas.filter((m) => m.progress >= 100).length;
  const vsMes = ` ${t("vsMesPassado")}`;

  return (
    <div className="grid grid-cols-4 gap-4 wide:gap-5">
      <Kpi
        Icone={Wallet}
        cor={cores.serie("saldo")}
        rotulo={t("saldoAtual")}
        acao={
          <button
            type="button"
            onClick={alternar}
            aria-label={ocultos ? t("valoresMostrar") : t("valoresOcultar")}
            title={ocultos ? t("valoresMostrar") : t("valoresOcultar")}
            className="-my-1 grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {ocultos ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        }
        valor={dinheiro(d.saldo)}
        rodape={
          <span className={cn("font-semibold", d.liquidoMes >= 0 ? "text-positivo" : "text-negativo")}>
            {d.liquidoMes >= 0 ? "↑" : "↓"} {dinheiro(Math.abs(d.liquidoMes))}
            <span className="ml-1 font-normal text-muted-foreground">{t("noMes")}</span>
          </span>
        }
        grafico={<Sparkline valores={d.saldoSerie} cor={cores.serie("saldo")} largura={64} altura={30} className="w-[52px] wide:w-16" />}
      />
      <Kpi
        atraso={50}
        Icone={ArrowUpToLine}
        cor={cores.serie("entradas")}
        rotulo={t("entradasDoMes")}
        valor={dinheiro(d.entradas)}
        rodape={<Delta pct={d.varEntradas} bomQuandoSobe sufixo={vsMes} />}
        grafico={<Sparkline valores={d.serieEntradas} cor={cores.serie("entradas")} largura={64} altura={30} className="w-[52px] wide:w-16" />}
      />
      <Kpi
        atraso={100}
        Icone={ArrowDownToLine}
        cor={cores.serie("gastos")}
        rotulo={t("gastosDoMes")}
        valor={dinheiro(d.gastos)}
        rodape={<Delta pct={d.varGastos} bomQuandoSobe={false} sufixo={vsMes} />}
        grafico={<Sparkline valores={d.serieGastos} cor={cores.serie("gastos")} largura={64} altura={30} className="w-[52px] wide:w-16" />}
      />
      <Kpi
        atraso={150}
        Icone={Target}
        cor={cores.serie("metas")}
        rotulo={t("metasTitulo")}
        valor={
          <>
            {concluidas}
            <span className="text-base font-semibold text-muted-foreground">/{metas.length}</span>
          </>
        }
        rodape={
          <div className="w-full">
            <Barra pct={metas.length ? (concluidas / metas.length) * 100 : 0} cor={cores.serie("metas")} />
            <span className="mt-1.5 block text-muted-foreground">{t("metasConcluidas")}</span>
          </div>
        }
      />
    </div>
  );
}

export default function FinancasDesktop() {
  const { t } = useLocale();
  const { hash } = useLocation();
  const [periodo, setPeriodo] = useState<Periodo>("30d");

  // "Ver detalhes" das metas na Início leva para /financas#metas.
  useEffect(() => {
    if (!hash) return;
    const alvo = document.getElementById(hash.slice(1));
    if (alvo) setTimeout(() => alvo.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
  }, [hash]);

  return (
    <>
      <Cabecalho icone={<IconePagina Icone={Wallet} />} titulo={t("tabFinancas")} subtitulo={t("financasSubtitulo")} />

      <div className="space-y-4 wide:space-y-5">
        <LancarRapido />
        <Kpis />
        <div className="grid grid-cols-12 gap-4 wide:gap-5">
          <div className="col-span-7 grid min-w-0">
            <EntradasGastosCard periodo={periodo} onPeriodo={setPeriodo} />
          </div>
          <div className="col-span-5 grid min-w-0">
            <CategoriasCard periodo={periodo} />
          </div>
        </div>
        <div className="grid grid-cols-2 items-stretch gap-4 wide:gap-5">
          <TransacoesCard />
          <MetasCard />
        </div>
        <ContasCard />
        <TelegramFaixa />
      </div>
    </>
  );
}
