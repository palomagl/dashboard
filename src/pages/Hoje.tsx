import { QuickStats } from "@/components/dashboard/QuickStats";
import { TasksWidget } from "@/components/dashboard/TasksWidget";
import { HabitsWidget } from "@/components/dashboard/HabitsWidget";
import { PomodoroWidget } from "@/components/dashboard/PomodoroWidget";

// O que a pessoa precisa fazer agora. Nada aqui é análise: o gráfico da
// semana e as metas moram em Progresso, onde se olha depois de agir.
export default function Hoje() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <QuickStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
        <div className="space-y-4 sm:space-y-6">
          <TasksWidget />
        </div>
        <div className="space-y-4 sm:space-y-6">
          <HabitsWidget />
          <PomodoroWidget />
        </div>
      </div>
    </div>
  );
}
