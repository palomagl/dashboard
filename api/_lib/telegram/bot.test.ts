import { describe, it, expect } from "vitest";
import { lerComando, responder, MENSAGENS, type TelegramUpdate } from "./bot";

function privado(text?: string): TelegramUpdate {
  return {
    update_id: 1,
    message: { message_id: 10, chat: { id: 42, type: "private" }, ...(text !== undefined && { text }) },
  };
}

describe("lerComando", () => {
  it("separa comando e argumento", () => {
    expect(lerComando("/start abc123")).toEqual({ comando: "start", argumento: "abc123" });
  });

  it("tira o @NomeDoBot que vem do menu de comandos", () => {
    expect(lerComando("/ajuda@MinhaRotinaBot")).toEqual({ comando: "ajuda", argumento: "" });
  });

  it("ignora maiúsculas e espaços nas pontas", () => {
    expect(lerComando("  /AJUDA  ")).toEqual({ comando: "ajuda", argumento: "" });
  });

  it("não trata texto comum como comando", () => {
    expect(lerComando("gastei 25,90 mercado")).toBeNull();
  });

  it("uma barra sozinha não é comando", () => {
    expect(lerComando("/")).toBeNull();
  });
});

describe("responder", () => {
  it("/start dá as boas-vindas", () => {
    expect(responder(privado("/start"))).toEqual({ chatId: 42, texto: MENSAGENS.boasVindas });
  });

  it("/start com código (link de vínculo) também dá as boas-vindas por enquanto", () => {
    expect(responder(privado("/start CODIGO123"))?.texto).toBe(MENSAGENS.boasVindas);
  });

  it("/ajuda e /help mostram a ajuda", () => {
    expect(responder(privado("/ajuda"))?.texto).toBe(MENSAGENS.ajuda);
    expect(responder(privado("/help"))?.texto).toBe(MENSAGENS.ajuda);
    expect(responder(privado("/ajuda@MinhaRotinaBot"))?.texto).toBe(MENSAGENS.ajuda);
  });

  it("comando que não existe avisa e aponta para a ajuda", () => {
    expect(responder(privado("/gasto 10 pão"))?.texto).toBe(MENSAGENS.comandoDesconhecido);
  });

  it("texto comum avisa que o registro ainda não existe", () => {
    expect(responder(privado("gastei 25,90 mercado"))?.texto).toBe(MENSAGENS.textoAindaNao);
  });

  it("mensagem sem texto (áudio, foto) avisa que só entende texto", () => {
    expect(responder(privado(undefined))?.texto).toBe(MENSAGENS.soTexto);
  });

  it("fica quieto em grupo", () => {
    const grupo: TelegramUpdate = {
      update_id: 2,
      message: { message_id: 11, chat: { id: -100, type: "group" }, text: "/ajuda" },
    };
    expect(responder(grupo)).toBeNull();
  });

  it("ignora updates sem mensagem", () => {
    expect(responder({ update_id: 3 })).toBeNull();
  });
});
