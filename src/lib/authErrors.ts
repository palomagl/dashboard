// ==============================================
// Erros de login, com nome
// ==============================================
// "Não foi possível entrar, tente de novo" é um conselho inútil quando tentar
// de novo nunca vai funcionar. Cada falha que a gente sabe reconhecer ganha
// uma mensagem que diz o que fazer — e o resto cai numa genérica honesta.

import type { TranslationKey } from "./translations";

const POR_CODIGO: Record<string, TranslationKey> = {
  // Configuração: só quem administra o projeto resolve.
  "auth/unauthorized-domain": "loginErroDominio",
  "auth/operation-not-allowed": "loginErroProvedor",

  // Ambiente da pessoa.
  "auth/network-request-failed": "loginErroRede",
  "auth/web-storage-unsupported": "loginErroPrivado",

  // Desistência: não é falha, e a mensagem não deve soar como uma.
  "auth/popup-closed-by-user": "loginGoogleCancelado",
  "auth/cancelled-popup-request": "loginGoogleCancelado",
  "auth/user-cancelled": "loginGoogleCancelado",

  // Conta.
  "auth/user-disabled": "loginErroContaBloqueada",
  "auth/too-many-requests": "loginErroMuitasTentativas",

  // Firestore: o login deu certo, gravar o perfil é que não.
  "permission-denied": "loginErroPermissao",
};

/** A mensagem que corresponde a um código de erro do Firebase. */
export function chaveDoErro(codigo: string | undefined): TranslationKey {
  return POR_CODIGO[codigo ?? ""] ?? "loginGoogleError";
}

/**
 * Vale a pena tentar de novo sozinho?
 *
 * Só para o que costuma passar: rede instável, serviço momentaneamente
 * indisponível. Repetir um erro de configuração ou de permissão apenas faz a
 * pessoa esperar para receber a mesma resposta.
 */
const TRANSITORIOS = new Set([
  "auth/network-request-failed",
  "auth/internal-error",
  "unavailable",
  "deadline-exceeded",
  "resource-exhausted",
  "aborted",
]);

export function ehTransitorio(codigo: string | undefined): boolean {
  return TRANSITORIOS.has(codigo ?? "");
}
