import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { TasksWidget } from "@/components/dashboard/TasksWidget";
import { HabitsWidget } from "@/components/dashboard/HabitsWidget";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { GoalsWidget } from "@/components/dashboard/GoalsWidget";
import { QuickNotes } from "@/components/dashboard/QuickNotes";
import { RoutineCategories } from "@/components/dashboard/RoutineCategories";
import { FinancesWidget } from "@/components/dashboard/FinancesWidget";
import { PomodoroWidget } from "@/components/dashboard/PomodoroWidget";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/*
        O topo soma a área segura ao respiro normal. Sem isso o cabeçalho
        encosta na barra de status do iPhone, porque o viewport-fit=cover
        (necessário para a tela de abertura) deixa o conteúdo subir até lá.
      */}
      <div
        className="container max-w-7xl px-4 sm:px-6 pb-6 sm:pb-8
          pt-[calc(env(safe-area-inset-top)+1.5rem)] sm:pt-[calc(env(safe-area-inset-top)+2rem)]"
      >
        <DashboardHeader />
        
        <main className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {/* Quick Stats Row */}
          <QuickStats />
          
          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Tasks & Notes */}
            <div className="lg:col-span-4 space-y-6">
              <TasksWidget />
              <PomodoroWidget />
              <QuickNotes />
            </div>
            
            {/* Center Column - Habits & Chart & Finances */}
            <div className="lg:col-span-4 space-y-6">
              <HabitsWidget />
              <FinancesWidget />
            </div>
            
            {/* Right Column - Goals, Chart & Categories */}
            <div className="lg:col-span-4 space-y-6">
              <GoalsWidget />
              <WeeklyChart />
              <RoutineCategories />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
