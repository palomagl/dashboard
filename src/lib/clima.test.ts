import { describe, it, expect } from "vitest";
import { ceuDoCodigo } from "./clima";

describe("clima", () => {
  it("traduz os códigos da Open-Meteo em céu", () => {
    expect(ceuDoCodigo(0)).toBe("limpo");
    expect(ceuDoCodigo(2)).toBe("poucasNuvens");
    expect(ceuDoCodigo(3)).toBe("nublado");
    expect(ceuDoCodigo(45)).toBe("neblina");
    expect(ceuDoCodigo(53)).toBe("garoa");
    expect(ceuDoCodigo(63)).toBe("chuva");
    expect(ceuDoCodigo(81)).toBe("chuva");
    expect(ceuDoCodigo(95)).toBe("tempestade");
  });
});
