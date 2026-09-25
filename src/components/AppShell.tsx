import { NavLink, Outlet } from "react-router-dom";
import { Sun, TrendingUp, Wallet, StickyNote } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useLocale } from "@/contexts/LocaleContext";
import type { TranslationKey } from "@/lib/translations";
import { useTelaGrande } from "@/hooks/useTelaGrande";
import { DesktopShell } from "@/desktop/DesktopShell";

// A mesma navegação em dois formatos: barra fixa embaixo no celular, onde o
// polegar alcança, e pílulas no topo no computador, onde o mouse já está.
const ABAS: { para: string; rotulo: TranslationKey; Icone: React.ElementType }[] = [
  { para: "/", rotulo: "tabHoje", Icone: Sun },
  { para: "/progresso", rotulo: "tabProgresso", Icone: TrendingUp },
  { para: "/financas", rotulo: "tabFinancas", Icone: Wallet },
  { para: "/notas", rotulo: "tabNotas", Icone: StickyNote },
];

// Notebook e monitor (>= 1024px) ganham um layout próprio, com menu lateral
// (src/desktop). Daqui para baixo é o layout de celular, que não mudou.
export function AppShell() {
  const telaGrande = useTelaGrande();
  return telaGrande ? <DesktopShell /> : <AppShellCelular />;
}

function AppShellCelular() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-background">
      <div
        className="container max-w-7xl px-4 sm:px-6
          pt-[calc(env(safe-area-inset-top)+1.5rem)] sm:pt-[calc(env(safe-area-inset-top)+2rem)]
          pb-[calc(env(safe-area-inset-bottom)+5.5rem)] md:pb-10"
      >
        <DashboardHeader />

        {/* Pílulas — só no computador. No celular a navegação mora embaixo. */}
        <nav className="hidden md:flex mt-6 gap-1 rounded-full border border-border/60 bg-secondary/30 p-1 w-fit">
          {ABAS.map(({ para, rotulo, Icone }) => (
            <NavLink
              key={para}
              to={para}
              end={para === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <Icone className="w-4 h-4" />
              {t(rotulo)}
            </NavLink>
          ))}
        </nav>

        <main className="mt-5 sm:mt-6">
          <Outlet />
        </main>
      </div>

      {/* Barra inferior — só no celular. */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border/60
          bg-card/85 backdrop-blur-xl
          pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex">
          {ABAS.map(({ para, rotulo, Icone }) => (
            <NavLink
              key={para}
              to={para}
              end={para === "/"}
              className={({ isActive }) =>
                // 3.5rem de altura garante o alvo de toque confortável que o
                // dedo precisa — bem mais do que o ícone sozinho ocuparia.
                `flex flex-1 flex-col items-center justify-center gap-1 h-[3.5rem] text-[0.6875rem] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icone className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
                  {t(rotulo)}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
