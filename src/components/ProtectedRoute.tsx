import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Enquanto a sessão está sendo restaurada, quem aparece é a SplashScreen,
  // por cima de tudo. Aqui basta não piscar conteúdo nem mandar para o login
  // antes de saber se existe alguém logado.
  if (loading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
