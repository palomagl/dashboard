// ==============================================
// Chamadas à API do Telegram
// ==============================================
// O token do bot só existe no servidor (variável TELEGRAM_BOT_TOKEN na Vercel,
// sem o prefixo VITE_). Com VITE_ ele iria parar no JavaScript que o navegador
// baixa, e qualquer pessoa poderia controlar o bot.

const TEMPO_LIMITE_MS = 8_000;

/**
 * Envia uma mensagem de texto. Devolve se deu certo.
 *
 * Não lança erro: uma resposta que não chegou não deve derrubar o webhook.
 * O problema fica registrado no log da Vercel — sem o token, que vai na URL.
 */
export async function enviarMensagem(token: string, chatId: number, texto: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: texto }),
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });

    if (!res.ok) {
      const corpo = await res.text().catch(() => "");
      console.error(`[telegram] sendMessage falhou: ${res.status} ${corpo.slice(0, 200)}`);
      return false;
    }
    return true;
  } catch (erro) {
    console.error("[telegram] sendMessage não completou:", (erro as Error)?.name ?? erro);
    return false;
  }
}
