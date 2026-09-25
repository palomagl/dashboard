import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Pencil, Wallet } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useCarteira, useContas, useTransacoes } from "@/lib/aoVivo";
import { lastNDays } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useCores } from "../categorias";
import { saldoAtual, saldoPorDia } from "../calculos";
import { Kpi } from "../graficos";
import { Sparkline } from "../ui";
import { useDinheiro } from "../valores";
import { AjustarSaldoDialog } from "../Formularios";

/**
 * O card de saldo (Início e Finanças).
 *
 * Quando a pessoa informou quanto tem ("Ajustar saldo"), o valor parte daí e
 * o rodapé mostra quanto mudou desde então. Sem isso, é a conta antiga
 * (tudo que entrou menos tudo que saiu) e o rodapé convida a informar.
 */
export function SaldoKpi({ rotulo, acaoExtra }: { rotulo: string; acaoExtra?: ReactNode }) {
  const { t, locale } = useLocale();
  const cores = useCores();
  const dinheiro = useDinheiro();
  const transacoes = useTransacoes().itens;
  const contas = useContas().itens;
  const carteira = useCarteira();
  const [ajustando, setAjustando] = useState(false);

  const d = useMemo(() => {
    const c = carteira ?? null;
    const saldo = saldoAtual(transacoes, contas, c);
    const base = c ? c.saldos.reduce((s, x) => s + x.valor, 0) : 0;
    return {
      saldo,
      serie: saldoPorDia(transacoes, contas, lastNDays(30), c),
      mudanca: saldo - base,
      dia: c
        ? new Date(c.definidoEm).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", { day: "2-digit", month: "2-digit" })
        : "",
    };
  }, [transacoes, contas, carteira, locale]);

  const carregando = carteira === undefined;

  let rodape: ReactNode = null;
  if (carteira) {
    rodape =
      Math.abs(d.mudanca) < 0.005 ? (
        <span className="text-muted-foreground">{t("ajustadoEm").replace("{dia}", d.dia)}</span>
      ) : (
        <span className={cn("font-semibold", d.mudanca >= 0 ? "text-positivo" : "text-negativo")}>
          {d.mudanca >= 0 ? "↑" : "↓"} {dinheiro(Math.abs(d.mudanca), { centavos: true })}
          <span className="ml-1 font-normal text-muted-foreground">{t("desdeDia").replace("{dia}", d.dia)}</span>
        </span>
      );
  } else if (carteira === null) {
    rodape = (
      <button
        type="button"
        onClick={() => setAjustando(true)}
        className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
      >
        {t("informarSaldo")} <ArrowRight className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <>
      <Kpi
        Icone={Wallet}
        cor={cores.serie("saldo")}
        rotulo={rotulo}
        acao={
          <>
            {acaoExtra}
            <button
              type="button"
              onClick={() => setAjustando(true)}
              aria-label={t("ajustarSaldo")}
              title={t("ajustarSaldo")}
              className="-my-1 grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </>
        }
        valor={carregando ? <span className="text-muted-foreground/60">—</span> : dinheiro(d.saldo)}
        rodape={rodape}
        grafico={<Sparkline valores={d.serie} cor={cores.serie("saldo")} largura={64} altura={30} className="w-[52px] wide:w-16" />}
      />
      <AjustarSaldoDialog aberto={ajustando} onFechar={() => setAjustando(false)} carteira={carteira} saldoCalculado={d.saldo} />
    </>
  );
}
