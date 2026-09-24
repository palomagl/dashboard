// ==============================================
// Interpretar texto: valor, tipo e descrição
// ==============================================
// Função pura — sem Firestore, sem Telegram, sem relógio (a data de verdade
// é decidida em transacoes.ts, na hora de gravar). Só texto entra, uma
// transação interpretada (ou null, quando não dá pra saber o valor com
// confiança) sai. É o que deixa testar cada frase sem precisar de bot nem
// de banco.

export interface TransacaoInterpretada {
  type: "expense" | "income";
  /** Em reais, sempre positivo. Ex.: 30.5 */
  amount: number;
  description: string;
}

const PALAVRAS_RECEITA = ["recebi", "receita", "ganhei", "caiu", "entrou"];
const PALAVRAS_DESPESA = ["gastei", "paguei", "comprei", "gasto"];

// Descartadas da descrição depois que o valor já foi tirado do texto: verbos
// e preposições não dizem nada sobre O QUÊ foi gasto ou recebido.
const PALAVRAS_DESCARTAVEIS = new Set([
  "reais",
  "real",
  "r$",
  "de",
  "do",
  "da",
  "no",
  "na",
  "em",
  "com",
  "por",
  "pra",
  "para",
  ...PALAVRAS_RECEITA,
  ...PALAVRAS_DESPESA,
]);

/**
 * "30" | "30,50" | "1.250,90" -> número. O separador de milhar é o ponto e o
 * decimal é a vírgula, ao jeito brasileiro — "30.50" não vira 30,5 (não bate
 * com nenhum dos dois formatos aceitos, então dá null).
 */
export function interpretarValorBR(token: string): number | null {
  const limpo = token.trim().replace(/^r\$\s*/i, "");
  const comMilhar = /^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/;
  const semMilhar = /^\d+(?:,\d{1,2})?$/;
  if (!comMilhar.test(limpo) && !semMilhar.test(limpo)) return null;

  const numero = Number(limpo.replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(numero) || numero <= 0) return null;
  return numero;
}

/** Acha o primeiro trecho que parece um valor em reais dentro de um texto qualquer. */
function acharValor(texto: string): { valor: number; inicio: number; fim: number } | null {
  const regex = /r\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?/gi;
  const m = regex.exec(texto);
  if (!m) return null;

  const valor = interpretarValorBR(m[0]);
  if (valor === null) return null;

  return { valor, inicio: m.index, fim: m.index + m[0].length };
}

function limparDescricao(texto: string): string {
  return texto
    .split(/\s+/)
    .filter((palavra) => palavra.length > 0 && !PALAVRAS_DESCARTAVEIS.has(palavra.toLowerCase()))
    .join(" ")
    .trim();
}

/**
 * Mensagem livre, em qualquer ordem: "gastei 30 reais no mercado",
 * "gastei 20 de gasolina", "recebi 2500 de salário", "uber 18".
 *
 * Sem palavra de receita reconhecida, assume gasto — é o caso mais comum de
 * lançamento rápido ("uber 18", "mercado 45,90"), e comandos explícitos
 * (/gasto, /entrada) continuam disponíveis pra quando isso não servir.
 *
 * Devolve null quando não acha um valor, ou quando não sobra nada pra
 * descrição depois de tirar o valor e as palavras descartáveis — nesses
 * casos é melhor pedir pra reformular do que adivinhar.
 */
export function interpretarMensagem(texto: string): TransacaoInterpretada | null {
  const achado = acharValor(texto);
  if (!achado) return null;

  const textoMin = texto.toLowerCase();
  const ehReceita = PALAVRAS_RECEITA.some((p) => textoMin.includes(p));

  const semValor = texto.slice(0, achado.inicio) + " " + texto.slice(achado.fim);
  const description = limparDescricao(semValor);
  if (!description) return null;

  return { type: ehReceita ? "income" : "expense", amount: achado.valor, description };
}

/** /gasto 30 mercado, /entrada 2500 salário — o tipo já vem do nome do comando. */
export function interpretarComando(
  type: "expense" | "income",
  argumento: string
): TransacaoInterpretada | null {
  const partes = argumento.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return null;

  const valor = interpretarValorBR(partes[0]);
  if (valor === null) return null;

  const description = limparDescricao(partes.slice(1).join(" "));
  if (!description) return null;

  return { type, amount: valor, description };
}
