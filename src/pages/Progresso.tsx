import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { GoalsWidget } from "@/components/dashboard/GoalsWidget";
import { RoutineCategories } from "@/components/dashboard/RoutineCategories";

// Como as coisas estão indo. Sai da primeira tela de propósito: quando se
// abre o app para marcar um hábito, o gráfico da semana não ajuda.
export default function Progresso() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
      <div className="space-y-4 sm:space-y-6">
        <WeeklyChart />
        <RoutineCategories />
      </div>
      <GoalsWidget />
    </div>
  );
}
