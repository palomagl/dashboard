import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { GoalsWidget } from "@/components/dashboard/GoalsWidget";
import { RoutineCategories } from "@/components/dashboard/RoutineCategories";
import { Navigate, useLocation } from "react-router-dom";
import { useTelaGrande } from "@/hooks/useTelaGrande";
import RotinaDesktop from "@/desktop/paginas/Rotina";

// Como as coisas estão indo. Sai da primeira tela de propósito: quando se
// abre o app para marcar um hábito, o gráfico da semana não ajuda.
// No computador esta aba vira "Rotina" (src/desktop/paginas/Rotina.tsx), com
// tarefas, hábitos, a semana e o Pomodoro. As metas foram para Finanças.
export default function Progresso() {
  const telaGrande = useTelaGrande();
  const { pathname } = useLocation();
  if (telaGrande) return <RotinaDesktop />;
  // /rotina é o endereço do computador; no celular a aba continua sendo Progresso.
  if (pathname === "/rotina") return <Navigate to="/progresso" replace />;

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
