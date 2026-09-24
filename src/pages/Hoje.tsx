import { QuickStats } from "@/components/dashboard/QuickStats";
import { TasksWidget } from "@/components/dashboard/TasksWidget";
import { HabitsWidget } from "@/components/dashboard/HabitsWidget";
import { PomodoroWidget } from "@/components/dashboard/PomodoroWidget";
import { HomeStatsLarge } from "@/components/dashboard/HomeStatsLarge";
import { FinanceOverviewWidget } from "@/components/dashboard/FinanceOverviewWidget";
import { RecentTransactionsWidget } from "@/components/dashboard/RecentTransactionsWidget";

// O que a pessoa precisa fazer agora. No celular fica só o essencial —
// estatísticas rápidas, tarefas, hábitos, pomodoro. Em telas grandes, sobra
// espaço, e entra também um resumo financeiro (gastos x entradas,
// categorias, últimas transações): não vira um dashboard financeiro, é só
// mais uma área da rotina que cabe ali do lado. O gráfico semanal e as
// metas continuam morando em Progresso.
export default function Hoje() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* No celular/tablet: os 4 cards de sempre (tarefas, sequência, metas, saldo). */}
      <div className="lg:hidden">
        <QuickStats />
      </div>

      {/* Só em telas grandes — no celular essa área nem monta. */}
      <div className="hidden lg:block space-y-4 sm:space-y-6">
        <HomeStatsLarge />

        <div className="grid grid-cols-3 gap-4 sm:gap-6 items-start">
          <div className="col-span-2">
            <FinanceOverviewWidget />
          </div>
          <RecentTransactionsWidget />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
        <TasksWidget />
        <HabitsWidget />
        <PomodoroWidget />
      </div>
    </div>
  );
}
