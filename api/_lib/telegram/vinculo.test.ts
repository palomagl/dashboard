import { describe, it, expect } from "vitest";
import { gerarCodigo } from "./vinculo";

// Só a parte sem Firestore: geração do código. criarCodigo/vincularPorCodigo/
// desvincular* precisam do Admin SDK de verdade (ou de um emulador), então
// ficam fora do escopo destes testes.
describe("gerarCodigo", () => {
  it("tem 8 caracteres", () => {
    expect(gerarCodigo()).toHaveLength(8);
  });

  it("só usa o alfabeto sem 0/O/1/I/L, para não confundir ao digitar", () => {
    for (let i = 0; i < 200; i++) {
      expect(gerarCodigo()).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
    }
  });

  it("não repete sempre o mesmo código", () => {
    const codigos = new Set(Array.from({ length: 50 }, () => gerarCodigo()));
    expect(codigos.size).toBeGreaterThan(1);
  });
});
