import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { userApi, type User } from "@/lib/db";
import { ehTransitorio } from "@/lib/authErrors";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** Código do último erro de autenticação. A tela é quem traduz. */
  erroAuth: string | null;
  limparErro: () => void;
  setUser: (user: User | null) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function codigoDe(erro: unknown): string | undefined {
  return (erro as { code?: string } | null)?.code;
}

/**
 * Tenta de novo, mas só o que costuma passar sozinho.
 *
 * Rede de celular oscila, e uma falha de meio segundo não deveria devolver a
 * pessoa para a tela de login. Já um erro de configuração ou de permissão dá
 * a mesma resposta quantas vezes for — insistir nele só faz esperar à toa.
 */
async function comRetentativa<T>(fn: () => Promise<T>, tentativas = 3): Promise<T> {
  let ultimoErro: unknown;

  for (let tentativa = 0; tentativa < tentativas; tentativa++) {
    try {
      return await fn();
    } catch (erro) {
      ultimoErro = erro;
      if (!ehTransitorio(codigoDe(erro))) throw erro;
      await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** tentativa));
    }
  }

  throw ultimoErro;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [erroAuth, setErroAuth] = useState<string | null>(null);

  useEffect(() => {
    // O login por redirecionamento termina com o app recarregando de volta do
    // Google. Se algo deu errado lá, é aqui que a notícia chega — e ela precisa
    // virar mensagem na tela, não só uma linha no console que ninguém lê.
    getRedirectResult(auth).catch((erro) => {
      console.error("Falha ao voltar do login do Google:", erro);
      setErroAuth(codigoDe(erro) ?? "desconhecido");
    });

    const cancelar = onAuthStateChanged(auth, async (conta) => {
      if (!conta) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const perfil = await comRetentativa(() =>
          userApi.ensure({
            name: conta.displayName ?? conta.email?.split("@")[0] ?? "Você",
            email: conta.email ?? "",
            photoURL: conta.photoURL ?? null,
          })
        );
        setUser(perfil);
        setErroAuth(null);
      } catch (erro) {
        // O Google autenticou, mas não conseguimos preparar a conta no banco.
        // Ficar numa sessão pela metade é pior do que não entrar: a tela ficaria
        // presa em "Conectando..." sem nunca dizer o motivo. Desfaz e explica.
        console.error("Falha ao preparar o perfil:", erro);
        setErroAuth(codigoDe(erro) ?? "desconhecido");
        await signOut(auth).catch(() => {});
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
   * não volta. Cada um desses vira um jeito diferente do login falhar.
   *
   * O redirecionamento tem um caminho só, igual no computador e no celular.
   */
  const loginWithGoogle = async () => {
    setErroAuth(null);
    await signInWithRedirect(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setErroAuth(null);
  };

  const limparErro = () => setErroAuth(null);

  return (
    <AuthContext.Provider
      value={{ user, loading, erroAuth, limparErro, setUser, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
