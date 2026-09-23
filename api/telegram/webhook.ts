// ==============================================
// POST /api/telegram/webhook
// ==============================================
// O Telegram chama este endereço a cada mensagem enviada ao bot.
//
// Tudo acontece ANTES de responder o HTTP: interpretar, enviar a resposta no
// chat e só então devolver 200. Nada fica rodando depois da resposta — numa
// função serverless isso não é garantido, e o trabalho poderia ser cortado no
// meio. O que o bot faz aqui leva frações de segundo, então não há motivo para
// processamento assíncrono.
//
// Sobre o status devolvido: qualquer coisa diferente de 2xx faz o Telegram
// reenviar o mesmo update depois. Por isso, se a mensagem de resposta falhar,
// o webhook ainda devolve 200: reenviar não conserta um token errado, e uma
// resposta perdida não estraga nenhum dado.

import { responder, type TelegramUpdate } from "../_lib/telegram/bot.js";
import { enviarMensagem } from "../_lib/telegram/cliente.js";
import { CABECALHO_SEGREDO, segredoValido } from "../_lib/telegram/seguranca.js";

export async function POST(request: Request): Promise<Response> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const segredo = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!token || !segredo) {
    console.error("[telegram] TELEGRAM_BOT_TOKEN ou TELEGRAM_WEBHOOK_SECRET não configurados.");
    return new Response("Configuração incompleta", { status: 500 });
  }

  if (!segredoValido(request.headers.get(CABECALHO_SEGREDO), segredo)) {
    return new Response("Não autorizado", { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }

  const resposta = responder(update);

  // O texto da mensagem não vai para o log: vai ter valores e gastos.
  console.info(
    `[telegram] update ${update?.update_id} · chat ${update?.message?.chat?.type ?? "-"} · ` +
      (resposta ? "respondido" : "ignorado")
  );

  if (resposta) {
    await enviarMensagem(token, resposta.chatId, resposta.texto);
  }

  return new Response("ok", { status: 200 });
}
