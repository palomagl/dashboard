import { describe, it, expect } from "vitest";
import type { Goal } from "./db";
import { interpretarObjetivo, lerMeta, lerNumero, lerPrazoTexto, sugerirIcone, textosLegados } from "./metas";

const HOJE = "2026-09-25";
const meta = (over: Partial<Goal>): Goal => ({ id: "m", title: "Meta", progress: 0, target: "", deadline: "", ...over });

describe("metas: leitura dos textos antigos", () => {
  it("entende números do jeito brasileiro", () => {
    expect(lerNumero("30 mil")).toBe(30000);
    expect(lerNumero("R$ 30.000")).toBe(30000);
    expect(lerNumero("1.250,50")).toBe(1250.5);
    expect(lerNumero("30k")).toBe(30000);
    expect(lerNumero("abc")).toBeNull();
  });

  it("objetivo em reais vira meta de dinheiro; '12 livros' vira quantidade", () => {
    expect(interpretarObjetivo("R$ 5.000")).toEqual({ tipo: "dinheiro", alvo: 5000, unidade: "" });
    expect(interpretarObjetivo("12 livros")).toEqual({ tipo: "quantidade", alvo: 12, unidade: "livros" });
    expect(interpretarObjetivo("ficar em paz")).toBeNull();
  });

  it("prazo em texto vira mês", () => {
    expect(lerPrazoTexto("Dez/2026")).toBe("2026-12");
    expect(lerPrazoTexto("12/2026")).toBe("2026-12");
    expect(lerPrazoTexto("2027")).toBe("2027-12");
    expect(lerPrazoTexto("dezembro de 2026")).toBe("2026-12");
    expect(lerPrazoTexto("Sem prazo")).toBeNull();
  });

  it("meta antiga aparece com valores de verdade", () => {
    const v = lerMeta(meta({ title: "Viagem dos sonhos", progress: 24, target: "R$ 5.000", deadline: "Dez/2026" }), HOJE);
    expect(v.tipo).toBe("dinheiro");
    expect(v.atual).toBe(1200);
    expect(v.prazo).toBe("2026-12");
    expect(v.icone).toBe("✈️");
  });
});

describe("metas: do jeito novo", () => {
  it("ler 6 livros até dezembro: 2 lidos, faltam 4 em 4 meses", () => {
    const v = lerMeta(meta({ title: "Ler 6 livros", tipo: "quantidade", alvo: 6, atual: 2, unidade: "livros", prazo: "2026-12" }), HOJE);
    expect(v.pct).toBe(33);
    expect(v.mesesRestantes).toBe(4);
    expect(v.falta).toBe(4);
    expect(v.porMes).toBe(1);
    expect(v.curtoPrazo).toBe(true);
    expect(v.icone).toBe("📚");
  });

  it("intercâmbio de 30 mil é longo prazo, sem ritmo mensal", () => {
    const v = lerMeta(meta({ title: "Intercâmbio", tipo: "dinheiro", alvo: 30000, atual: 4500, prazo: null }), HOJE);
    expect(v.pct).toBe(15);
    expect(v.curtoPrazo).toBe(false);
    expect(v.porMes).toBeNull();
    expect(v.falta).toBe(25500);
  });

  it("prazo que já passou e não terminou", () => {
    const v = lerMeta(meta({ tipo: "quantidade", alvo: 10, atual: 3, prazo: "2026-06" }), HOJE);
    expect(v.prazoPassou).toBe(true);
    expect(v.curtoPrazo).toBe(true);
  });

  it("grava os textos antigos junto", () => {
    expect(textosLegados({ tipo: "dinheiro", alvo: 30000, unidade: "", prazo: null }, "pt", "Longo prazo")).toEqual({
      target: "R$ 30.000",
      deadline: "Longo prazo",
    });
    expect(textosLegados({ tipo: "quantidade", alvo: 6, unidade: "livros", prazo: "2026-12" }, "pt", "")).toEqual({
      target: "6 livros",
      deadline: "dez/2026",
    });
    expect(sugerirIcone("Juntar pro intercâmbio")).toBe("✈️");
  });
});
