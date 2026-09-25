import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { reais } from "./formato";

// O olhinho do "Saldo atual": esconde todos os valores em reais das telas de
// computador (útil com alguém do lado, ou compartilhando a tela). A escolha
// fica salva neste navegador.

const CHAVE = "mr_ocultar_valores";

const Contexto = createContext<{ ocultos: boolean; alternar: () => void }>({
  ocultos: false,
  alternar: () => {},
});

export function ValoresProvider({ children }: { children: ReactNode }) {
  const [ocultos, setOcultos] = useState(() => {
    try {
      return localStorage.getItem(CHAVE) === "1";
    } catch {
      return false;
    }
  });

  const alternar = useCallback(() => {
    setOcultos((atual) => {
      const proximo = !atual;
      try {
        localStorage.setItem(CHAVE, proximo ? "1" : "0");
      } catch {
        /* sem storage: vale só nesta sessão */
      }
      return proximo;
    });
  }, []);

  return <Contexto.Provider value={{ ocultos, alternar }}>{children}</Contexto.Provider>;
}

export function useValores() {
  return useContext(Contexto);
}

/** Formata em reais — ou devolve "R$ •••" quando os valores estão ocultos. */
export function useDinheiro() {
  const { ocultos } = useContext(Contexto);
  return useCallback(
    (valor: number, opcoes?: { centavos?: boolean; sinal?: boolean }) => {
      if (!ocultos) return reais(valor, opcoes);
      const sinal = opcoes?.sinal ? (valor < 0 ? "- " : "+ ") : "";
      return `${sinal}R$ •••`;
    },
    [ocultos]
  );
}
