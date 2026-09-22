import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  onAuthStateChanged,

  signInWithRedirect,
  getRedirectResult,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { userApi, type User } from "@/lib/db";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Quando o login foi por redirect, o app volta do Google já carregando de
    // novo. Isto existe para que uma falha nesse caminho apareça, em vez de
    // virar uma tela de login que simplesmente não reage.
    getRedirectResult(auth).catch((erro) => {
      console.error("Falha ao voltar do login do Google:", erro);
    });

    const cancelar = onAuthStateChanged(auth, async (conta) => {
      if (!conta) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const perfil = await userApi.ensure({
          name: conta.displayName ?? conta.email?.split("@")[0] ?? "Você",
          email: conta.email ?? "",
          photoURL: conta.photoURL ?? null,
        });
        setUser(perfil);
      } catch (erro) {
        console.error("Falha ao carregar o perfil:", erro);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return cancelar;
  }, []);

  /**
   * Sempre por redirecionamento, nunca por popup.
   *
   * O popup parece mais elegante e custa caro: o navegador pode bloqueá-lo, a
   * política COOP corta o vínculo entre a página e a janela, fechar sem querer
   * vira um erro, e no aplicativo da tela inicial do iPhone ele simplesmente
   * não volta. Cada um desses vira um jeito diferente do login falhar, e todos
   * falham em silêncio.
   *
   * O redirecionamento tem um caminho só, igual no computador e no celular.
   * A página sai daqui e quem termina o login é o onAuthStateChanged, quando
   * o app recarregar de volta do Google.
   */
  const loginWithGoogle = async () => {
    await signInWithRedirect(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
