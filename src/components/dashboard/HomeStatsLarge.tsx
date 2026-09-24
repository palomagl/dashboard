import { useState, useEffect, useMemo } from "react";
import { Wallet, ArrowDownCircle, ArrowUpCircle, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { statsApi, transactionsApi, QuickStatsData, Transaction } from "@/lib/db";
import { dayKey } from "@/lib/dates";
import { useLocale } from "@/contexts/LocaleContext";

function formatarReais(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

/**
 * Linha de estatísticas financeiras — só em telas grandes. No celular quem
 * aparece é o QuickStats de sempre (tarefas/sequência/metas/saldo); aqui a
 * régua é outra, mais parecida com um resumo financeiro do dia.
 */
export function HomeStatsLarge() {
  const { t } = useLocale();
  const [stats, setStats] = useState<QuickStatsData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    statsApi.quickStats().then(setStats).catch(() => {});
    transactionsApi.list().then(setTransactions).catch(() => {});
  }, []);

  const { despesasHoje, entradasHoje } = useMemo(() => {
    const hoje = dayKey();
    const doDia = transactions.filter((tx) => tx.date === hoje);
    return {
      despesasHoje: doDia.filter((tx) => tx.type === "expense").reduce((soma, tx) => soma + tx.amount, 0),
      entradasHoje: doDia.filter((tx) => tx.type === "income").reduce((soma, tx) => soma + tx.amount, 0),
    };
  }, [transactions]);

  const transacoesHojeCount = useMemo(() => transactions.filter((tx) => tx.date === dayKey()).length, [transactions]);

  const cards = [
    {
      key: "saldo",
      label: t("statsMonthlyBalance"),
      value: formatarReais(stats?.monthlyBalance ?? 0),
      icon: Wallet,
      colorVar: "--widget-tasks",
      footer: null,
    },
    {
      key: "despesas",
      label: t("financeOverviewExpenses") + " hoje",
      value: formatarReais(despesasHoje),
      icon: ArrowDownCircle,
      colorVar: "--destructive",
      footer: `${transacoesHojeCount} ${t("financesTransactions").toLowerCase()}`,
    },
    {
      key: "entradas",
      label: t("financeOverviewIncome") + " hoje",
      value: formatarReais(entradasHoje),
      icon: ArrowUpCircle,
      colorVar: "--widget-habits",
      footer: null,
    },
    {
      key: "metas",
      label: t("goalsTitle"),
      value: (stats?.activeGoals ?? 0).toString(),
      icon: Target,
      colorVar: "--widget-goals",
      footer: t("goalsSubtitle"),
      href: "/progresso",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card, index) => {
        const conteudo = (
          <div
            className="glass-card glass-card-hover rounded-2xl p-5 animate-fade-in h-full"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="p-2.5 rounded-xl"
                style={{ backgroundColor: `hsl(var(${card.colorVar}) / 0.1)` }}
              >
                <card.icon className="w-5 h-5" style={{ color: `hsl(var(${card.colorVar}))` }} />
              </div>
            </div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{card.label}</p>
            <p className="text-2xl font-bold mb-1">{card.value}</p>
            {card.footer && <p className="text-xs text-muted-foreground">{card.footer}</p>}
          </div>
        );
        return card.href ? (
          <Link key={card.key} to={card.href} className="block h-full">
            {conteudo}
          </Link>
        ) : (
          <div key={card.key}>{conteudo}</div>
        );
      })}
    </div>
  );
}
