// ==============================================
// Vínculo conta ↔ Telegram
// ==============================================
// Duas pontas usam este arquivo: a rota POST/DELETE /api/telegram/vinculo
// (chamada pelo app, com o ID token de quem está logada) e o webhook do bot
// (chamado pelo Telegram, quando a pessoa manda /start CODIGO ou
// /desvincular). Nenhuma das duas confia na outra — cada uma prova quem é do
// seu próprio jeito: o app com o ID token do Firebase, o bot por já estar
// dentro do chat vinculado.
//
// O código nunca é guardado em texto puro: só o hash. Quem lesse a coleção
// telegramCodes (o Admin SDK, ou alguém com acesso ao projeto) não sairia
// dali sabendo o código de ninguém.
//
// users/{uid}.telegram é só uma cópia para a tela mostrar o status na hora
// (users/{uid} pode ser lido E ESCRITO pela própria dona da conta, pelas
// firestore.rules de sempre). Isso é de propósito: se alguém mexesse nesse
// campo pelo cliente, o máximo que estragaria seria a própria tela — quem
// decide de verdade se um chat está vinculado é telegramChats/{chatId}, que
// só o Admin SDK toca.

import { randomInt, createHash } from "node:crypto";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { obterAppAdmin } from "../firebase-admin.js";

const VALIDADE_MS = 10 * 60 * 1000;
const TAMANHO_CODIGO = 8;

// Sem 0/O, 1/I/L: são as trocas mais comuns ao digitar um código à mão.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function db() {
  return getFirestore(obterAppAdmin());
}

function hash(codigo: string): string {
  return createHash("sha256").update(codigo).digest("hex");
}

/** Só a geração do código — sem rede, para dar pra testar o formato sozinha. */
export function gerarCodigo(): string {
  let codigo = "";
  for (let i = 0; i < TAMANHO_CODIGO; i++) {
    codigo += ALFABETO[randomInt(ALFABETO.length)];
  }
  return codigo;
}

export interface CodigoGerado {
  codigo: string;
  expiraEm: string; // ISO, para o front formatar/comparar sem depender do Admin SDK
}

/** Chamada pela rota POST /api/telegram/vinculo, já com o uid conferido pelo ID token. */
export async function criarCodigo(uid: string): Promise<CodigoGerado> {
  const codigo = gerarCodigo();
  const expiraEm = new Date(Date.now() + VALIDADE_MS);

  await db()
    .collection("telegramCodes")
    .doc(hash(codigo))
    .set({ uid, expiraEm: Timestamp.fromDate(expiraEm), criadoEm: Timestamp.now() });

  return { codigo, expiraEm: expiraEm.toISOString() };
}

/** Chamada pelo webhook quando a pessoa manda /start CODIGO no bot. Devolve o texto da resposta. */
export async function vincularPorCodigo(chatId: number, codigoDigitado: string): Promise<string> {
  const codigo = codigoDigitado.trim().toUpperCase();
  const ref = db().collection("telegramCodes").doc(hash(codigo));
  const snap = await ref.get();

  if (!snap.exists) {
    return "Código inválido — ele já foi usado, ou nunca existiu. Gere um novo em Minha conta, no app.";
  }

  const dados = snap.data() as { uid: string; expiraEm: Timestamp };
  if (dados.expiraEm.toMillis() < Date.now()) {
    await ref.delete();
    return "Esse código expirou (ele vale por 10 minutos). Gere um novo em Minha conta, no app.";
  }

  const uid = dados.uid;
  const chatIdStr = String(chatId);
  const vinculadoEm = Timestamp.now();

  await db().runTransaction(async (tx) => {
    tx.set(db().collection("telegramChats").doc(chatIdStr), { uid, vinculadoEm });
    tx.set(db().collection("users").doc(uid), { telegram: { chatId: chatIdStr, vinculadoEm } }, { merge: true });
    tx.delete(ref);
  });

  return "Conta vinculada! ✅ Daqui pra frente eu aviso por aqui. Veja o que já dá pra fazer em /ajuda.";
}

/** Desfaz o vínculo de um uid, não importa quantos chats ele tenha (hoje só cabe um, mas não custa cobrir). */
async function desvincularUid(uid: string): Promise<boolean> {
  const chats = await db().collection("telegramChats").where("uid", "==", uid).get();
  if (chats.empty) return false;

  await db().runTransaction(async (tx) => {
    chats.docs.forEach((doc) => tx.delete(doc.ref));
    tx.set(db().collection("users").doc(uid), { telegram: FieldValue.delete() }, { merge: true });
  });
  return true;
}

/** Chamada pela rota DELETE /api/telegram/vinculo, já com o uid conferido pelo ID token. */
export async function desvincularPorUid(uid: string): Promise<void> {
  await desvincularUid(uid);
}


/** Chamada por transacoes.ts (registrar/ultimas/desfazer) pra saber de quem é o chat. */
export async function obterUidPorChat(chatId: number): Promise<string | null> {
  const snap = await db().collection("telegramChats").doc(String(chatId)).get();
  if (!snap.exists) return null;
  return (snap.data() as { uid: string }).uid;
}
/** Chamada pelo webhook quando a pessoa manda /desvincular no bot. Devolve o texto da resposta. */
export async function desvincularPorChat(chatId: number): Promise<string> {
  const chatIdStr = String(chatId);
  const chatSnap = await db().collection("telegramChats").doc(chatIdStr).get();

  if (!chatSnap.exists) {
    return "Este chat não está vinculado a nenhuma conta.";
  }

  const uid = (chatSnap.data() as { uid: string }).uid;
  await desvincularUid(uid);
  return "Pronto, desvinculei sua conta. Para usar de novo, gere um novo código em Minha conta, no app.";
}
