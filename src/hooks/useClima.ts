import { useEffect, useState } from "react";
import { buscarClima, type Clima } from "@/lib/clima";

const CHAVE = "clima-agora";
const VALIDADE = 30 * 60 * 1000;

function lerGuardado(): Clima | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const clima = JSON.parse(bruto) as Clima;
    return Date.now() - clima.em < VALIDADE ? clima : null;
  } catch {
    return null;
  }
}

/**
 * O clima de agora na cidade (src/lib/clima.ts), atualizado a cada 30 min.
 * Guarda a última resposta no aparelho para não piscar ao trocar de página.
 * `null` enquanto não chegou ou se a internet falhou — quem usa cai no
 * sol/lua pela hora do dia.
 */
export function useClima(): Clima | null {
  const [clima, setClima] = useState<Clima | null>(lerGuardado);

  useEffect(() => {
    let controle = new AbortController();
    const atualizar = () => {
      controle = new AbortController();
      buscarClima(controle.signal)
        .then((novo) => {
          setClima(novo);
          try {
            localStorage.setItem(CHAVE, JSON.stringify(novo));
          } catch {
            // Sem armazenamento (aba anônima): só não guarda.
          }
        })
        .catch((erro) => {
          if ((erro as Error).name !== "AbortError") console.warn("Clima indisponível:", erro);
        });
    };
    if (!lerGuardado()) atualizar();
    const relogio = setInterval(atualizar, VALIDADE);
    return () => {
      clearInterval(relogio);
      controle.abort();
    };
  }, []);

  return clima;
}
