import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SplashScreen } from "@/components/SplashScreen";
import Index from "./pages/Index";
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
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/install" element={<Install />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
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
);

export default App;
