// ==============================================
// Quem está chamando o webhook?
// ==============================================
// A URL do webhook é pública. Sem esta checagem, qualquer pessoa que
// descobrisse o endereço poderia mandar updates falsos se passando pelo
// Telegram. No setWebhook a gente combina um segredo (secret_token), e o
// Telegram passa a mandar ele em todo request, no cabeçalho abaixo.

import { createHash, timingSafeEqual } from "node:crypto";

export const CABECALHO_SEGREDO = "x-telegram-bot-api-secret-token";

/**
 * Compara em tempo constante. Uma comparação com === termina no primeiro
 * caractere diferente, e medir esse tempo ajuda a adivinhar o segredo aos
 * poucos. Os hashes têm sempre o mesmo tamanho, o que o timingSafeEqual exige.
 */
export function segredoValido(recebido: string | null, esperado: string): boolean {
  if (!recebido || !esperado) return false;
  const a = createHash("sha256").update(recebido).digest();
  const b = createHash("sha256").update(esperado).digest();
  return timingSafeEqual(a, b);
}
