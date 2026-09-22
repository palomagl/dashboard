import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SplashScreen } from "@/components/SplashScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppShell } from "@/components/AppShell";
import Hoje from "./pages/Hoje";
import Progresso from "./pages/Progresso";
import Financas from "./pages/Financas";
import Notas from "./pages/Notas";
import Login from "./pages/Login";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";
import Account from "./pages/Account";

// Fica dentro do AuthProvider porque a splash sai quando a sessão termina de
// ser restaurada — e essa informação mora no contexto de autenticação.
function Conteudo() {
  const { loading } = useAuth();

  return (
    <>
      <SplashScreen pronto={!loading} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/install" element={<Install />} />

        {/* As abas dividem o mesmo cabeçalho e a mesma navegação: trocar de
            aba troca só o miolo, como em um aplicativo. */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Hoje />} />
          <Route path="/progresso" element={<Progresso />} />
          <Route path="/financas" element={<Financas />} />
          <Route path="/notas" element={<Notas />} />
        </Route>

        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <ErrorBoundary>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LocaleProvider>
            <Conteudo />
          </LocaleProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </ErrorBoundary>
);

export default App;
