import { describe, it, expect } from "vitest";
import { dayKey, previousDay, lastNDays } from "./dates";

describe("dayKey", () => {
  it("formata a data como YYYY-MM-DD", () => {
    expect(dayKey(new Date(2026, 8, 22, 14, 0))).toBe("2026-09-22");
  });

  it("preenche mes e dia com zero a esquerda", () => {
    expect(dayKey(new Date(2026, 0, 5, 9, 30))).toBe("2026-01-05");
  });

  it("usa o fuso local, nao UTC", () => {
    // 01:30 UTC de 23/09 e' 22:30 de 22/09 em Sao Paulo.
    // Marcar um habito nesse horario tem que contar como dia 22.
    const instante = new Date("2026-09-23T01:30:00Z");
    expect(instante.toISOString().slice(0, 10)).toBe("2026-09-23");
    expect(dayKey(instante)).toBe("2026-09-22");
  });

  it("vira o dia a meia-noite local, nao antes", () => {
    expect(dayKey(new Date(2026, 8, 22, 23, 59, 59))).toBe("2026-09-22");
    expect(dayKey(new Date(2026, 8, 23, 0, 0, 0))).toBe("2026-09-23");
  });
});

describe("previousDay", () => {
  it("volta um dia", () => {
    expect(previousDay("2026-09-22")).toBe("2026-09-21");
  });

  it("atravessa a virada de mes", () => {
    expect(previousDay("2026-09-01")).toBe("2026-08-31");
  });

  it("atravessa a virada de ano", () => {
    expect(previousDay("2026-01-01")).toBe("2025-12-31");
  });

  it("lida com ano bissexto", () => {
    expect(previousDay("2028-03-01")).toBe("2028-02-29");
  });
});

describe("lastNDays", () => {
  it("devolve os ultimos N dias em ordem, terminando hoje", () => {
    expect(lastNDays(3, new Date(2026, 8, 22))).toEqual([
      "2026-09-20",
      "2026-09-21",
      "2026-09-22",
    ]);
  });

  it("atravessa a virada de mes", () => {
    expect(lastNDays(3, new Date(2026, 8, 1))).toEqual([
      "2026-08-30",
      "2026-08-31",
      "2026-09-01",
    ]);
  });
});
