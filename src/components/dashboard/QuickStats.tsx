import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Flame, Target, Wallet } from "lucide-react";
import { statsApi, QuickStatsData } from "@/lib/db";
import { useCarteira, useContas, useTransacoes } from "@/lib/aoVivo";
import { saldoAtual } from "@/desktop/calculos";
import { useLocale } from "@/contexts/LocaleContext";

export function QuickStats() {
  const [data, setData] = useState<QuickStatsData | null>(null);
  const { t, locale } = useLocale();

  useEffect(() => {
    statsApi.quickStats().then(setData).catch(() => {});
  }, []);

  // O mesmo saldo de Finanças (com o "Ajustar saldo", quando existe), ao vivo.
  const transacoes = useTransacoes();
  const contas = useContas();
  const carteira = useCarteira();
  const pronto = transacoes.pronto && contas.pronto && carteira !== undefined;
  const saldo = pronto
    ? new Intl.NumberFormat(locale === "pt" ? "pt-BR" : "en-US", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }).format(saldoAtual(transacoes.itens, contas.itens, carteira))
    : "—";

  // Classes completas e estáticas para o Tailwind conseguir detectá-las no build
  const stats = [
    { labelKey: "statsTasksToday" as const, value: data?.tasksToday || "0/0", icon: CheckCircle2, iconClass: "text-widget-tasks", bgClass: "bg-widget-tasks/10" },
    { labelKey: "statsStreak" as const, value: `${data?.streak ?? 0} ${t("statsDays")}`, icon: Flame, iconClass: "text-widget-habits", bgClass: "bg-widget-habits/10" },
    { labelKey: "statsActiveGoals" as const, value: data?.activeGoals?.toString() || "0", icon: Target, iconClass: "text-widget-goals", bgClass: "bg-widget-goals/10" },
    { labelKey: "saldoAtual" as const, value: saldo, icon: Wallet, iconClass: "text-widget-finance", bgClass: "bg-widget-finance/10", link: "/financas" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const conteudo = (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs text-muted-foreground uppercase tracking-wide">{t(stat.labelKey)}</p>
              <span className={`shrink-0 p-1.5 rounded-lg ${stat.bgClass}`}>
                <stat.icon className={`w-4 h-4 ${stat.iconClass}`} />
              </span>
            </div>
            <p className="mt-1 truncate text-xl font-bold tabular-nums sm:text-2xl">{stat.value}</p>
          </>
        );
        const classe = "glass-card glass-card-hover block rounded-xl p-4 animate-fade-in";
        const estilo = { animationDelay: `${index * 50}ms` };
        return "link" in stat && stat.link ? (
          <Link key={stat.labelKey} to={stat.link} className={classe} style={estilo}>
            {conteudo}
          </Link>
        ) : (
          <div key={stat.labelKey} className={classe} style={estilo}>
            {conteudo}
          </div>
        );
      })}
    </div>
  );
}
