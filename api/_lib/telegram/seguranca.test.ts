import { describe, it, expect } from "vitest";
import { segredoValido } from "./seguranca";

describe("segredoValido", () => {
  it("aceita o segredo certo", () => {
    expect(segredoValido("abc_123-XYZ", "abc_123-XYZ")).toBe(true);
  });

  it("recusa segredo diferente, inclusive de outro tamanho", () => {
    expect(segredoValido("abc", "abd")).toBe(false);
    expect(segredoValido("abc", "abcdef")).toBe(false);
  });

  it("recusa quando o cabeçalho não veio", () => {
    expect(segredoValido(null, "abc")).toBe(false);
    expect(segredoValido("", "abc")).toBe(false);
  });

  it("recusa quando o servidor está sem segredo configurado", () => {
    expect(segredoValido("", "")).toBe(false);
  });
});
