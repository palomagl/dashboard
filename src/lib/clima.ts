// ==============================================
// Clima de agora (Open-Meteo)
// ==============================================
// O ícone do "Hoje" segue o céu de verdade: sol, nuvem, chuva, tempestade ou
// lua de noite. A Open-Meteo é gratuita, não pede chave e aceita chamada
// direto do navegador.

/** Onde a Paloma mora. Para outra cidade, é só trocar aqui. */
export const CIDADE = { nome: "Sapiranga", latitude: -29.6381, longitude: -51.0064, fuso: "America/Sao_Paulo" };

export type Ceu = "limpo" | "poucasNuvens" | "nublado" | "neblina" | "garoa" | "chuva" | "neve" | "tempestade";

export interface Clima {
  temperatura: number;
  ceu: Ceu;
  dia: boolean;
  /** Quando foi buscado (ms). */
  em: number;
}

/** Código WMO da Open-Meteo -> tipo de céu. */
export function ceuDoCodigo(codigo: number): Ceu {
  if (codigo === 0) return "limpo";
  if (codigo === 1 || codigo === 2) return "poucasNuvens";
  if (codigo === 3) return "nublado";
  if (codigo === 45 || codigo === 48) return "neblina";
  if (codigo >= 51 && codigo <= 57) return "garoa";
  if ((codigo >= 61 && codigo <= 67) || (codigo >= 80 && codigo <= 82)) return "chuva";
  if ((codigo >= 71 && codigo <= 77) || codigo === 85 || codigo === 86) return "neve";
  if (codigo >= 95) return "tempestade";
  return "nublado";
}

export async function buscarClima(sinal?: AbortSignal): Promise<Clima> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${CIDADE.latitude}&longitude=${CIDADE.longitude}` +
    `&current=temperature_2m,weather_code,is_day&timezone=${encodeURIComponent(CIDADE.fuso)}`;
  const resposta = await fetch(url, { signal: sinal });
  if (!resposta.ok) throw new Error(`Open-Meteo respondeu ${resposta.status}`);
  const dados = await resposta.json();
  const atual = dados?.current;
  if (typeof atual?.temperature_2m !== "number" || typeof atual?.weather_code !== "number") {
    throw new Error("Resposta do clima sem os campos esperados");
  }
  return {
    temperatura: Math.round(atual.temperature_2m),
    ceu: ceuDoCodigo(atual.weather_code),
    dia: atual.is_day === 1,
    em: Date.now(),
  };
}
