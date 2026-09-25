import { describe, it, expect } from "vitest";
import type { Bill, Carteira, Transaction } from "@/lib/db";
import {
  acumuladoNoPeriodo,
  gastosPorCategoria,
  saldoAtual,
  saldoPorDia,
  somaPorDia,
  totaisDoMes,
  lerValor,
  variacao,
} from "./calculos";

function tx(over: Partial<Transaction>): Transaction {
  return { id: "x", description: "x", amount: 0, type: "expense", date: "2026-09-22", ...over };
}

function conta(over: Partial<Bill>): Bill {
  return { id: "c", name: "c", amount: 0, dueDate: "10", category: "Outros", paid: false, ...over };
}

const TX = [
  tx({ amount: 1000, type: "income", date: "2026-09-05" }),
  tx({ amount: 120, date: "2026-09-22", category: "Alimentação" }),
  tx({ amount: 30, date: "2026-09-23", category: "Transporte" }),
  tx({ amount: 50, date: "2026-08-20", category: "Alimentação" }),
  tx({ amount: 400, type: "income", date: "2026-08-05" }),
];

describe("saldoAtual", () => {
  it("soma entradas, tira gastos e contas pagas", () => {
    const contas = [conta({ amount: 200, paid: true }), conta({ amount: 999, paid: false })];
    // 1000 + 400 - 120 - 30 - 50 - 200
    expect(saldoAtual(TX, contas)).toBe(1000);
  });

  it("conta não paga não mexe no saldo", () => {
    expect(saldoAtual(TX, [conta({ amount: 999 })])).toBe(1200);
  });
});

describe("saldoAtual com saldo informado (carteira)", () => {
  // O caso de verdade: 2970 no Pix + 312 em dinheiro + 120 separados pra internet.
  const carteira: Carteira = {
    saldos: [
      { nome: "Pix", valor: 2970 },
      { nome: "Dinheiro", valor: 312 },
      { nome: "Internet", valor: 120 },
    ],
    definidoEm: "2026-09-25T15:00:00.000Z",
  };
  const antes = new Date("2026-09-25T12:00:00.000Z");
  const depois = new Date("2026-09-25T18:00:00.000Z");

  it("parte do que foi informado e ignora o histórico antigo", () => {
    const velhas = TX.map((t) => ({ ...t, criadaEm: antes }));
    const pagaAntes = conta({ amount: 500, paid: true, pagaEm: "2026-09-20T10:00:00.000Z" });
    const importadaPaga = conta({ amount: 60, paid: true }); // veio da planilha como "Paga", sem pagaEm
    expect(saldoAtual(velhas, [pagaAntes, importadaPaga], carteira)).toBe(3402);
  });

  it("pagar a internet depois do ajuste tira 120", () => {
    const internet = conta({ name: "Internet", amount: 120, paid: true, pagaEm: "2026-09-25T19:00:00.000Z" });
    expect(saldoAtual([], [internet], carteira)).toBe(3282);
  });

  it("transações lançadas depois do ajuste entram e saem", () => {
    const novas = [
      { ...tx({ amount: 50, type: "income" }), criadaEm: depois },
      { ...tx({ amount: 30 }), criadaEm: depois },
      { ...tx({ amount: 999 }), criadaEm: null }, // sem hora: não dá pra saber, fica de fora
    ];
    expect(saldoAtual(novas, [], carteira)).toBe(3422);
  });

  it("a linha do saldo termina no saldo de hoje e desce no dia em que a conta foi paga", () => {
    const dias = ["2026-09-24", "2026-09-25", "2026-09-26"];
    const internet = conta({ amount: 120, paid: true, pagaEm: "2026-09-26T13:00:00.000Z" });
    const serie = saldoPorDia([], [internet], dias, carteira);
    expect(serie).toEqual([3402, 3402, 3282]);
  });
});

describe("totaisDoMes", () => {
  it("considera só o mês pedido", () => {
    expect(totaisDoMes(TX, "2026-09")).toEqual({ entradas: 1000, gastos: 150, saldo: 850 });
    expect(totaisDoMes(TX, "2026-08")).toEqual({ entradas: 400, gastos: 50, saldo: 350 });
  });
});

describe("somaPorDia e acumulado", () => {
  const dias = ["2026-09-21", "2026-09-22", "2026-09-23"];

  it("coloca cada gasto no seu dia", () => {
    expect(somaPorDia(TX, dias, "expense")).toEqual([0, 120, 30]);
    expect(somaPorDia(TX, dias, "income")).toEqual([0, 0, 0]);
  });

  it("acumula ao longo do período", () => {
    expect(acumuladoNoPeriodo(TX, dias).map((d) => d.gastos)).toEqual([0, 120, 150]);
  });

  it("o saldo do último dia é o saldo atual", () => {
    const serie = saldoPorDia(TX, [], dias);
    expect(serie[2]).toBe(saldoAtual(TX, []));
    // Voltando um dia, desfaz o gasto de 30 do dia 23.
    expect(serie[1]).toBe(serie[2] + 30);
  });
});

describe("gastosPorCategoria", () => {
  it("agrupa, ordena do maior para o menor e calcula o percentual", () => {
    const { lista, total } = gastosPorCategoria(TX);
    expect(total).toBe(200);
    expect(lista.map((x) => x.categoria)).toEqual(["Alimentação", "Transporte"]);
    expect(lista[0].pct).toBeCloseTo(85);
  });

  it("transação sem categoria cai em Outros", () => {
    const { lista } = gastosPorCategoria([tx({ amount: 10, category: undefined })]);
    expect(lista[0].categoria).toBe("Outros");
  });
});

describe("variacao", () => {
  it("compara com o mês anterior", () => {
    expect(variacao(150, 100)).toBeCloseTo(50);
    expect(variacao(50, 100)).toBeCloseTo(-50);
  });

  it("sem mês anterior não inventa porcentagem", () => {
    expect(variacao(100, 0)).toBeNull();
  });
});

describe("lerValor", () => {
  it("entende o jeito brasileiro e o com ponto", () => {
    expect(lerValor("58,90")).toBeCloseTo(58.9);
    expect(lerValor("1.250,90")).toBeCloseTo(1250.9);
    expect(lerValor("12.5")).toBeCloseTo(12.5);
    expect(lerValor("R$ 30")).toBe(30);
    expect(Number.isNaN(lerValor("abc"))).toBe(true);
  });
});
