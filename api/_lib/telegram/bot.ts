// ==============================================
// Bot do Telegram: o que responder
// ==============================================
// Recebe o update que o Telegram mandou e devolve a resposta (ou nada). Não
// faz rede nem lê variável de ambiente diretamente — quem faz isso é o `io`
// que a chamadora injeta, o que deixa dar para testar sem bot, sem token e
// sem Firestore de verdade. Quem envia a resposta e quem monta o `io` de
// produção é o webhook.
//
// A pasta começa com "_" de propósito: a Vercel não transforma o que está em
// api/_lib em endpoint público.

/** Só o pedaço do update que o bot usa. O Telegram manda muito mais. */
export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    text?: string;
  };
}

export interface Resposta {
  chatId: number;
  texto: string;
}

/**
 * O que os comandos /start CODIGO e /desvincular precisam fazer, além de
 * responder — ambos leem e escrevem no Firestore. Injetado para o bot.ts
 * continuar puro e testável sem depender do Admin SDK.
 */
export interface Io {
  vincular: (chatId: number, codigo: string) => Promise<string>;
  desvincular: (chatId: number) => Promise<string>;
}

export const MENSAGENS = {
  boasVindas: [
    "Olá! 👋 Eu sou o bot do Minha Rotina.",
    "",
    "Em breve você vai poder registrar gastos e entradas mandando uma mensagem aqui, e eles vão aparecer direto nas suas Finanças.",
    "",
    "Veja o que já dá para fazer em /ajuda.",
  ].join("\n"),

  ajuda: [
    "📋 Comandos disponíveis",
    "",
    "/start – apresentação do bot",
    "/ajuda – esta lista",
    "/desvincular – desfaz o vínculo desta conta com o Telegram",
    "",
    "🔜 Em breve",
    "• Registrar por texto, por exemplo: gastei 25,90 mercado",
    "• Ver o saldo do mês e desfazer o último registro",
  ].join("\n"),

  textoAindaNao:
    "Ainda não sei registrar mensagens — isso chega em breve. Por enquanto, veja /ajuda.",

  comandoDesconhecido: "Não conheço esse comando. Veja os disponíveis em /ajuda.",

  soTexto: "Por enquanto eu só entendo mensagens de texto.",
} as const;

/**
 * Separa "/start@MinhaRotinaBot abc" em comando "start" e argumento "abc".
 * Devolve null quando o texto não é um comando.
 *
 * O "@NomeDoBot" aparece quando alguém toca num comando do menu; tirar ele
 * aqui evita que "/ajuda@Bot" caia em "comando desconhecido".
 */
export function lerComando(texto: string): { comando: string; argumento: string } | null {
  const limpo = texto.trim();
  if (!limpo.startsWith("/")) return null;

  const [primeira, ...resto] = limpo.split(/\s+/);
  const comando = primeira.slice(1).split("@")[0].toLowerCase();
  if (!comando) return null;

  return { comando, argumento: resto.join(" ") };
}

export async function responder(update: TelegramUpdate, io: Io): Promise<Resposta | null> {
  const mensagem = update.message;
  if (!mensagem) return null;

  // Finanças são pessoais: o bot só conversa no privado. Em grupo ele fica
  // quieto, para não expor nada nem responder a mensagens de outras pessoas.
  if (mensagem.chat.type !== "private") return null;

  const chatId = mensagem.chat.id;
  const texto = mensagem.text;

  if (texto === undefined) return { chatId, texto: MENSAGENS.soTexto };

  const cmd = lerComando(texto);
  if (!cmd) return { chatId, texto: MENSAGENS.textoAindaNao };

  switch (cmd.comando) {
    case "start":
      // t.me/bot?start=CODIGO chega aqui como "/start CODIGO": é o vínculo
      // da Fase 2. Sem argumento, é só a apresentação de sempre.
      if (cmd.argumento) {
        return { chatId, texto: await io.vincular(chatId, cmd.argumento) };
      }
      return { chatId, texto: MENSAGENS.boasVindas };
    case "ajuda":
    case "help":
      return { chatId, texto: MENSAGENS.ajuda };
    case "desvincular":
      return { chatId, texto: await io.desvincular(chatId) };
    default:
      return { chatId, texto: MENSAGENS.comandoDesconhecido };
  }
}
