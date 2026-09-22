import { describe, it, expect } from "vitest";
import { isDoneOn, toggle, type HabitProgress } from "./habits";

const HOJE = "2026-09-22";
const ONTEM = "2026-09-21";

function habito(over: Partial<HabitProgress> = {}): HabitProgress {
  return { streak: 0, lastCompletedOn: null, undo: null, ...over };
}

describe("isDoneOn", () => {
  it("e' falso para um habito que nunca foi marcado", () => {
    expect(isDoneOn(habito(), HOJE)).toBe(false);
  });

  it("e' verdadeiro quando foi marcado nesse dia", () => {
    expect(isDoneOn(habito({ lastCompletedOn: HOJE }), HOJE)).toBe(true);
  });

  it("e' falso hoje quando so' foi marcado ontem", () => {
    // Este e' o bug do booleano: marcou ontem, hoje tem que aparecer aberto,
    // sem ninguem precisar rodar nada na virada do dia.
    expect(isDoneOn(habito({ lastCompletedOn: ONTEM }), HOJE)).toBe(false);
  });
});

describe("toggle - marcando", () => {
  it("comeca a sequencia em 1 na primeira vez", () => {
    const r = toggle(habito(), HOJE);
    expect(r.streak).toBe(1);
    expect(r.lastCompletedOn).toBe(HOJE);
  });

  it("soma 1 quando o anterior foi ontem", () => {
    const r = toggle(habito({ streak: 4, lastCompletedOn: ONTEM }), HOJE);
    expect(r.streak).toBe(5);
    expect(r.lastCompletedOn).toBe(HOJE);
  });

  it("recomeca em 1 quando pulou um dia", () => {
    const r = toggle(habito({ streak: 12, lastCompletedOn: "2026-09-19" }), HOJE);
    expect(r.streak).toBe(1);
  });

  it("atravessa a virada de mes sem quebrar a sequencia", () => {
    const r = toggle(habito({ streak: 3, lastCompletedOn: "2026-08-31" }), "2026-09-01");
    expect(r.streak).toBe(4);
  });
});

describe("toggle - desmarcando", () => {
  it("volta exatamente ao estado anterior quando desmarca", () => {
    const antes = habito({ streak: 4, lastCompletedOn: ONTEM });
    const marcado = toggle(antes, HOJE);
    const desmarcado = toggle(marcado, HOJE);

    expect(desmarcado.streak).toBe(4);
    expect(desmarcado.lastCompletedOn).toBe(ONTEM);
  });

  it("marcar e desmarcar duas vezes nao infla a sequencia", () => {
    let h: HabitProgress = habito({ streak: 4, lastCompletedOn: ONTEM });
    h = toggle(h, HOJE);
    h = toggle(h, HOJE);
    h = toggle(h, HOJE);
    expect(h.streak).toBe(5);
    expect(h.lastCompletedOn).toBe(HOJE);
  });

  it("zera com seguranca quando nao ha estado anterior guardado", () => {
    const r = toggle(habito({ streak: 1, lastCompletedOn: HOJE }), HOJE);
    expect(r.streak).toBe(0);
    expect(r.lastCompletedOn).toBe(null);
  });

  it("nunca deixa a sequencia negativa", () => {
    const r = toggle(habito({ streak: 0, lastCompletedOn: HOJE }), HOJE);
    expect(r.streak).toBe(0);
  });
});
