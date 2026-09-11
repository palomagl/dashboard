import { useState, useEffect } from "react";
import { CheckCircle2, Flame, Target, Wallet } from "lucide-react";
import { statsApi, QuickStatsData } from "@/lib/api";
import { useLocale } from "@/contexts/LocaleContext";

export function QuickStats() {
  const [data, setData] = useState<QuickStatsData | null>(null);
  const { t } = useLocale();

  useEffect(() => {
    statsApi.quickStats().then(setData).catch(() => {});
  }, []);

  // Classes completas e estáticas para o Tailwind conseguir detectá-las no build
  const stats = [
    { labelKey: "statsTasksToday" as const, value: data?.tasksToday || "0/0", icon: CheckCircle2, iconClass: "text-widget-tasks", bgClass: "bg-widget-tasks/10" },
    { labelKey: "statsStreak" as const, value: data?.streak ?? `0 ${t("statsDays")}`, icon: Flame, iconClass: "text-widget-habits", bgClass: "bg-widget-habits/10" },
    { labelKey: "statsActiveGoals" as const, value: data?.activeGoals?.toString() || "0", icon: Target, iconClass: "text-widget-goals", bgClass: "bg-widget-goals/10" },
    { labelKey: "statsMonthlyBalance" as const, value: data?.monthlyBalance || "R$ 0", icon: Wallet, iconClass: "text-widget-finance", bgClass: "bg-widget-finance/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={stat.labelKey}
          className="glass-card glass-card-hover rounded-xl p-4 animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {t(stat.labelKey)}
              </p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
            <div className={`p-2 rounded-lg ${stat.bgClass}`}>
              <stat.icon className={`w-5 h-5 ${stat.iconClass}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
