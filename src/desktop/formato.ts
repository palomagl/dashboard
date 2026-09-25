// Formatação usada nas telas de computador. Os valores são sempre em reais —
// é a moeda dos dados — mesmo com o app em inglês.

export function reais(valor: number, opcoes: { centavos?: boolean; sinal?: boolean } = {}): string {
  const { centavos = false, sinal = false } = opcoes;
  const texto = Math.abs(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: centavos ? 2 : 0,
    maximumFractionDigits: centavos ? 2 : 0,
  });
  if (!sinal) return valor < 0 ? `- ${texto}` : texto;
  return `${valor < 0 ? "-" : "+"} ${texto}`;
}

/** "2026-09-24" -> Date ao meio-dia local (o meio-dia evita o fuso puxar pro dia anterior). */
export function dataDoDia(chave: string): Date {
  return new Date(`${chave}T12:00:00`);
}

function idioma(locale: string) {
  return locale === "pt" ? "pt-BR" : "en-US";
}

/** "24 de set." / "Sep 24" */
export function diaMes(chave: string, locale: string): string {
  if (!chave) return "";
  return dataDoDia(chave).toLocaleDateString(idioma(locale), { day: "numeric", month: "short" });
}

/** "14:32" */
export function hora(data: Date | null, locale: string): string {
  if (!data) return "";
  return data.toLocaleTimeString(idioma(locale), { hour: "2-digit", minute: "2-digit" });
}

/** "quinta-feira, 24 de setembro" */
export function dataPorExtenso(data: Date, locale: string): string {
  const texto = data.toLocaleDateString(idioma(locale), { weekday: "long", day: "numeric", month: "long" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function primeiroNome(nome: string | undefined | null): string {
  return (nome ?? "").trim().split(/\s+/)[0] ?? "";
}

export function iniciais(nome: string | undefined | null): string {
  const partes = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

/** Primeiro dia do mês de uma chave "YYYY-MM-DD" (ou de hoje). */
export function mesDe(chave: string): string {
  return chave.slice(0, 7);
}

/** "2026-09" -> "2026-08" */
export function mesAnterior(mes: string): string {
  const [ano, m] = mes.split("-").map(Number);
  const data = new Date(ano, m - 2, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}
