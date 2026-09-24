// ==============================================
// Transações criadas pelo bot do Telegram
// ==============================================
// Só chega aqui quem já provou, por telegramChats/{chatId}, que fala em nome
// de um uid — nenhuma função aqui confia em texto vindo do Telegram sozinho.
// A interpretação do texto (parser.ts) já aconteceu antes; aqui só decide
// onde e como gravar.

import { createHash } from "node:crypto";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { obterAppAdmin } from "../firebase-admin.js";
import { obterUidPorChat } from "./vinculo.js";
import type { TransacaoInterpretada } from "./parser.js";

function db() {
  return getFirestore(obterAppAdmin());
}

/** "YYYY-MM-DD" em America/Sao_Paulo — o mesmo formato de transactions.date usado pelo app. */
export function dataHojeSaoPaulo(agora: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(agora);

  const parte = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${parte("year")}-${parte("month")}-${parte("day")}`;
}

/**
 * ID determinístico a partir do update_id do Telegram: se o Telegram reenviar
 * o mesmo update (timeout, falha de rede), a segunda tentativa cai no mesmo
 * documento em vez de criar um lançamento duplicado.
 */
export function idDaTransacao(updateId: number): string {
  return "tg_" + createHash("sha256").update(String(updateId)).digest("hex").slice(0, 24);
}

function formatarReais(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const NAO_VINCULADO =
  "Essa conta ainda não está vinculada. Abra o app, vá em Minha conta, gere um código e manda /start CODIGO aqui.";

/** Resolve o uid do chat antes de tocar em qualquer transação; sem vínculo, nem tenta. */
async function comUid(chatId: number, acao: (uid: string) => Promise<string>): Promise<string> {
  const uid = await obterUidPorChat(chatId);
  if (!uid) return NAO_VINCULADO;
  return acao(uid);
}

/** Chamada pelo webhook pra /gasto, /entrada e texto livre já interpretado. */
export async function registrarTransacao(
  chatId: number,
  updateId: number,
  transacao: TransacaoInterpretada
): Promise<string> {
  return comUid(chatId, async (uid) => {
    const ref = db().collection("users").doc(uid).collection("transactions").doc(idDaTransacao(updateId));
    const existente = await ref.get();

    // Já existe (o Telegram reenviou o mesmo update): não grava de novo, só
    // confirma de novo — pra quem está do outro lado, o resultado é o mesmo.
    if (!existente.exists) {
      await ref.set({
        description: transacao.description,
        amount: transacao.amount,
        type: transacao.type,
        date: dataHojeSaoPaulo(),
        // O bot ainda não pergunta categoria — fica "Outros" até a pessoa
        // reclassificar na tela de Finanças, se quiser.
        category: "Outros",
        source: "telegram",
        telegramChatId: String(chatId),
        createdAt: Timestamp.now(),
      });
    }

    const rotulo = transacao.type === "income" ? "Entrada" : "Gasto";
    const emoji = transacao.type === "income" ? "💰" : "💸";
    return `${emoji} ${rotulo} de ${formatarReais(transacao.amount)} em ${transacao.description} registrado(a). Já aparece nas suas Finanças.`;
  });
}

/** Chamada pelo webhook em /ultimas. */
export async function listarUltimas(chatId: number, limite = 5): Promise<string> {
  return comUid(chatId, async (uid) => {
    const snap = await db()
      .collection("users")
      .doc(uid)
      .collection("transactions")
      .orderBy("createdAt", "desc")
      .limit(limite)
      .get();

    if (snap.empty) return "Você ainda não tem nenhuma transação registrada.";

    const linhas = snap.docs.map((doc) => {
      const t = doc.data() as { type: string; amount: number; description: string };
      const sinal = t.type === "income" ? "+" : "-";
      return `${sinal} ${formatarReais(t.amount)} — ${t.description}`;
    });

    return ["📋 Últimas transações:", "", ...linhas].join("\n");
  });
}

/** Chamada pelo webhook em /desfazer. Só apaga a última transação criada por ESTE chat. */
export async function desfazerUltima(chatId: number): Promise<string> {
  return comUid(chatId, async (uid) => {
    // Sem índice composto: busca as últimas N por createdAt (índice padrão de
    // campo único, sempre existe) e filtra por chat na memória. N=20 cobre
    // qualquer sequência realista de uso misto entre app e bot.
    const snap = await db()
      .collection("users")
      .doc(uid)
      .collection("transactions")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const doTelegram = snap.docs.find((doc) => {
      const t = doc.data() as { source?: string; telegramChatId?: string };
      return t.source === "telegram" && t.telegramChatId === String(chatId);
    });

    if (!doTelegram) {
      return "Não achei nenhuma transação recente registrada por aqui pra desfazer.";
    }

    const t = doTelegram.data() as { type: string; amount: number; description: string };
    await doTelegram.ref.delete();

    const rotulo = t.type === "income" ? "entrada" : "gasto";
    return `✅ Desfeito: ${rotulo} de ${formatarReais(t.amount)} em ${t.description}.`;
  });
}
