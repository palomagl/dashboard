import { describe, it, expect } from "vitest";
import { chaveDoErro, ehTransitorio } from "./authErrors";

describe("chaveDoErro", () => {
  it("nomeia erros de configuração, que tentar de novo nunca resolve", () => {
    expect(chaveDoErro("auth/unauthorized-domain")).toBe("loginErroDominio");
    expect(chaveDoErro("auth/operation-not-allowed")).toBe("loginErroProvedor");
  });

  it("nomeia a falta de rede", () => {
    expect(chaveDoErro("auth/network-request-failed")).toBe("loginErroRede");
  });

  it("nomeia a desistência da pessoa, que não é falha", () => {
    expect(chaveDoErro("auth/popup-closed-by-user")).toBe("loginGoogleCancelado");
    expect(chaveDoErro("auth/cancelled-popup-request")).toBe("loginGoogleCancelado");
    expect(chaveDoErro("auth/user-cancelled")).toBe("loginGoogleCancelado");
  });

  it("nomeia a navegação privada, onde o storage não existe", () => {
    expect(chaveDoErro("auth/web-storage-unsupported")).toBe("loginErroPrivado");
  });

  it("nomeia a conta bloqueada e o excesso de tentativas", () => {
    expect(chaveDoErro("auth/user-disabled")).toBe("loginErroContaBloqueada");
    expect(chaveDoErro("auth/too-many-requests")).toBe("loginErroMuitasTentativas");
  });

  it("nomeia a falha ao gravar o perfil", () => {
    expect(chaveDoErro("permission-denied")).toBe("loginErroPermissao");
  });

  it("cai numa mensagem genérica para o que não conhece", () => {
    expect(chaveDoErro("auth/algo-que-nao-existe")).toBe("loginGoogleError");
    expect(chaveDoErro(undefined)).toBe("loginGoogleError");
    expect(chaveDoErro("")).toBe("loginGoogleError");
  });
});

describe("ehTransitorio", () => {
  it("considera rede e indisponibilidade passageiras", () => {
    expect(ehTransitorio("auth/network-request-failed")).toBe(true);
    expect(ehTransitorio("unavailable")).toBe(true);
    expect(ehTransitorio("deadline-exceeded")).toBe(true);
    expect(ehTransitorio("auth/internal-error")).toBe(true);
  });

  it("não insiste em erro de configuração nem de permissão", () => {
    // Tentar de novo aqui só faz a pessoa esperar por nada.
    expect(ehTransitorio("auth/unauthorized-domain")).toBe(false);
    expect(ehTransitorio("permission-denied")).toBe(false);
    expect(ehTransitorio("auth/operation-not-allowed")).toBe(false);
  });

  it("não insiste quando a pessoa desistiu", () => {
    expect(ehTransitorio("auth/popup-closed-by-user")).toBe(false);
  });

  it("não insiste no que não conhece", () => {
    expect(ehTransitorio(undefined)).toBe(false);
  });
});
