import { useEffect, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useManterAoVivo } from "@/lib/aoVivo";
import { BuscaProvider } from "./Busca";
import { PomodoroProvider } from "./pomodoro";
import { Sidebar } from "./Sidebar";
import { ValoresProvider } from "./valores";

// ==============================================
// Layout de notebook e monitor (>= 1024px)
// ==============================================
// Menu lateral fixo + conteúdo. Tudo que é específico de computador mora em
// src/desktop; o celular continua com o AppShell de sempre.
//
// Abaixo de 1600px o menu mostra só os ícones (com o nome ao passar o
// mouse); a partir de 1600px, ícone e nome.

export function DesktopShell({ children }: { children?: ReactNode }) {
  const { pathname } = useLocation();
  useManterAoVivo();

  // A paleta do computador vale enquanto este layout está na tela.
  useEffect(() => {
    document.documentElement.classList.add("desk");
    return () => document.documentElement.classList.remove("desk");
  }, []);

  // Progresso virou Rotina no computador (o endereço antigo continua valendo).
  if (pathname === "/progresso") return <Navigate to="/rotina" replace />;

  return (
    <ValoresProvider>
      <PomodoroProvider>
        <BuscaProvider>
          <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar />
            <div className="min-w-0 flex-1">
              <main key={pathname} className="mx-auto w-full max-w-[1680px] px-6 py-7 xl:px-8 wide:px-9 wide:py-8">
                {children ?? <Outlet />}
              </main>
            </div>
          </div>
        </BuscaProvider>
      </PomodoroProvider>
    </ValoresProvider>
  );
}
