import { QuickStats } from "@/components/dashboard/QuickStats";
import { TasksWidget } from "@/components/dashboard/TasksWidget";
import { HabitsWidget } from "@/components/dashboard/HabitsWidget";
import { PomodoroWidget } from "@/components/dashboard/PomodoroWidget";
import { useTelaGrande } from "@/hooks/useTelaGrande";
import InicioDesktop from "@/desktop/paginas/Inicio";

// O que a pessoa precisa fazer agora. No celular fica só o essencial —
// estatísticas rápidas, tarefas, hábitos, pomodoro. No notebook/monitor
// (>= 1024px) a Início é outra página, com resumo financeiro, transações e
// tudo lado a lado: src/desktop/paginas/Inicio.tsx.
export default function Hoje() {
  const telaGrande = useTelaGrande();
  if (telaGrande) return <InicioDesktop />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <QuickStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
        <TasksWidget />
        <HabitsWidget />
        <PomodoroWidget />
      </div>
    </div>
  );
}
