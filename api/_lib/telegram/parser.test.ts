import { describe, it, expect } from "vitest";
import { interpretarValorBR, interpretarMensagem, interpretarComando } from "./parser";

describe("interpretarValorBR", () => {
  it("número inteiro", () => {
    expect(interpretarValorBR("30")).toBe(30);
  });

  it("vírgula como decimal", () => {
    expect(interpretarValorBR("30,50")).toBe(30.5);
    expect(interpretarValorBR("30,5")).toBe(30.5);
  });

  it("ponto como separador de milhar, vírgula como decimal", () => {
    expect(interpretarValorBR("1.250,90")).toBe(1250.9);
  });

  it("aceita o prefixo R$", () => {
    expect(interpretarValorBR("R$50")).toBe(50);
    expect(interpretarValorBR("r$ 1.250,90")).toBe(1250.9);
  });

  it("ponto sozinho não é decimal (não é o formato brasileiro)", () => {
    expect(interpretarValorBR("30.50")).toBeNull();
  });

  it("recusa zero, negativo e texto sem número", () => {
    expect(interpretarValorBR("0")).toBeNull();
    expect(interpretarValorBR("-30")).toBeNull();
    expect(interpretarValorBR("mercado")).toBeNull();
  });
});

describe("interpretarMensagem — casos normais", () => {
  it("gastei 30 reais no mercado", () => {
    expect(interpretarMensagem("gastei 30 reais no mercado")).toEqual({
      type: "expense",
      amount: 30,
      description: "Mercado",
    });
  });

  it("gastei 20 de gasolina", () => {
    expect(interpretarMensagem("gastei 20 de gasolina")).toEqual({
      type: "expense",
      amount: 20,
      description: "Gasolina",
    });
  });

  it("recebi 2500 de salário — receita", () => {
    expect(interpretarMensagem("recebi 2500 de salário")).toEqual({
      type: "income",
      amount: 2500,
      description: "Salário",
    });
  });

  it("uber 18 — sem verbo, assume gasto", () => {
    expect(interpretarMensagem("uber 18")).toEqual({
      type: "expense",
      amount: 18,
      description: "Uber",
    });
  });
});

describe("interpretarMensagem — valores brasileiros", () => {
  it("com vírgula", () => {
    expect(interpretarMensagem("gastei 30,50 no mercado")?.amount).toBe(30.5);
  });

  it("com milhar e centavos", () => {
    expect(interpretarMensagem("recebi 1.250,90 de freela")?.amount).toBe(1250.9);
  });
});

describe("interpretarMensagem — número colado em palavra não é confundido com o valor", () => {
  it("ignora o \"10\" de \"dia10\" e pega o valor de verdade", () => {
    expect(interpretarMensagem("comprei um tenis no cartao pra pagar dia10, 100")).toEqual({
      type: "expense",
      amount: 100,
      description: "Um tenis cartao pagar dia10,",
    });
  });
});

describe("interpretarMensagem — receitas", () => {
  it("ganhei também é receita", () => {
    expect(interpretarMensagem("ganhei 100 de bônus")?.type).toBe("income");
  });

  it("caiu também é receita", () => {
    expect(interpretarMensagem("caiu 300 do freela")?.type).toBe("income");
  });
});

describe("interpretarMensagem — mensagens ambíguas ou inválidas", () => {
  it("sem nenhum valor", () => {
    expect(interpretarMensagem("almoço no shopping")).toBeNull();
  });

  it("só o valor, sem descrição depois de limpar", () => {
    expect(interpretarMensagem("30")).toBeNull();
    expect(interpretarMensagem("gastei 30 reais")).toBeNull();
  });

  it("texto vazio", () => {
    expect(interpretarMensagem("")).toBeNull();
  });
});

describe("interpretarComando", () => {
  it("/gasto 30 mercado", () => {
    expect(interpretarComando("expense", "30 mercado")).toEqual({
      type: "expense",
      amount: 30,
      description: "Mercado",
    });
  });

  it("/entrada 2500 salário", () => {
    expect(interpretarComando("income", "2500 salário")).toEqual({
      type: "income",
      amount: 2500,
      description: "Salário",
    });
  });

  it("descrição com mais de uma palavra", () => {
    expect(interpretarComando("expense", "45,90 mercado do bairro")).toEqual({
      type: "expense",
      amount: 45.9,
      description: "Mercado bairro",
    });
  });

  it("sem argumento nenhum", () => {
    expect(interpretarComando("expense", "")).toBeNull();
  });

  it("primeiro token não é um valor", () => {
    expect(interpretarComando("expense", "mercado 30")).toBeNull();
  });

  it("só o valor, sem descrição", () => {
    expect(interpretarComando("expense", "30")).toBeNull();
  });
});
