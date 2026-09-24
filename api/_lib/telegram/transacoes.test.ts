import { describe, it, expect, vi, beforeEach } from "vitest";
import { idDaTransacao, dataHojeSaoPaulo } from "./transacoes";

// obterUidPorChat é a única ponta de I/O que dá pra isolar sem um emulador
// do Firestore: com ela mockada, testamos o "chat não vinculado" (comUid
// devolve o aviso e nunca chega a tocar no Firestore) sem precisar de banco
// de verdade. O caminho "vinculado" (ler/gravar a transação em si) fica para
// teste manual/no emulador — não coberto aqui.
vi.mock("./vinculo.js", () => ({
  obterUidPorChat: vi.fn(),
}));

import { obterUidPorChat } from "./vinculo.js";
import { registrarTransacao, listarUltimas, desfazerUltima } from "./transacoes";

describe("idDaTransacao", () => {
  it("é determinístico: o mesmo update_id sempre dá o mesmo id", () => {
    expect(idDaTransacao(123456)).toBe(idDaTransacao(123456));
  });

  it("update_id diferente dá id diferente (evita colisão)", () => {
    expect(idDaTransacao(1)).not.toBe(idDaTransacao(2));
  });

  it("tem o prefixo tg_, pra identificar a origem só de olhar o id", () => {
    expect(idDaTransacao(42)).toMatch(/^tg_[a-f0-9]{24}$/);
  });
});

describe("dataHojeSaoPaulo", () => {
  it("formata em YYYY-MM-DD", () => {
    expect(dataHojeSaoPaulo(new Date("2026-09-23T12:00:00Z"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("usa o fuso America/Sao_Paulo, não UTC — 00:30 UTC já é dia anterior em SP", () => {
    // 2026-09-23T00:30:00Z é 2026-09-22 21:30 em São Paulo (UTC-3).
    expect(dataHojeSaoPaulo(new Date("2026-09-23T00:30:00Z"))).toBe("2026-09-22");
  });

  it("2026-09-23T15:00:00Z é 2026-09-23 em São Paulo", () => {
    expect(dataHojeSaoPaulo(new Date("2026-09-23T15:00:00Z"))).toBe("2026-09-23");
  });
});

describe("chat não vinculado", () => {
  beforeEach(() => {
    vi.mocked(obterUidPorChat).mockReset();
  });

  it("registrarTransacao não grava nada e avisa", async () => {
    vi.mocked(obterUidPorChat).mockResolvedValue(null);
    const resposta = await registrarTransacao(999, 1, {
      type: "expense",
      amount: 30,
      description: "mercado",
    });
    expect(resposta).toMatch(/não está vinculada/i);
    expect(obterUidPorChat).toHaveBeenCalledWith(999);
  });

  it("listarUltimas avisa em vez de listar", async () => {
    vi.mocked(obterUidPorChat).mockResolvedValue(null);
    const resposta = await listarUltimas(999);
    expect(resposta).toMatch(/não está vinculada/i);
  });

  it("desfazerUltima avisa em vez de apagar", async () => {
    vi.mocked(obterUidPorChat).mockResolvedValue(null);
    const resposta = await desfazerUltima(999);
    expect(resposta).toMatch(/não está vinculada/i);
  });
});
