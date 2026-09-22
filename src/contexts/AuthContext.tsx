import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
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

/**
 * O app está rodando como aplicativo salvo na tela inicial?
 *
 * Isso decide como o login acontece: dentro do PWA em modo standalone, o
 * `signInWithPopup` abre uma janela que não volta e o login trava — no iPhone
 * principalmente. Ali o caminho é redirect.
 */
function ehStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const porMedia = window.matchMedia?.("(display-mode: standalone)")?.matches === true;
  // Safari no iOS não implementa a media query acima; ele expõe esta flag.
  const porIOS = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return porMedia || porIOS;
}

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

  const loginWithGoogle = async () => {
    if (ehStandalone()) {
      // A página sai daqui: quem termina o login é o onAuthStateChanged
      // quando o app recarregar de volta do Google.
      await signInWithRedirect(auth, googleProvider);
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (erro) {
      // Navegador bloqueou a janela: em vez de deixar o botão sem reação,
      // termina o login pelo caminho que não precisa de popup.
      if ((erro as { code?: string }).code === "auth/popup-blocked") {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw erro;
    }
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
