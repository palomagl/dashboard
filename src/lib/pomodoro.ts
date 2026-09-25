// ==============================================
// Tempos do Pomodoro (editáveis)
// ==============================================
// 25/5/15 é o clássico, mas tem dia de foco de 1h com 20 min de descanso.
// Os tempos ficam no aparelho (para abrir na hora) e no perfil do Firestore
// (para o celular e o computador usarem os mesmos).

import { useEffect, useSyncExternalStore } from "react";
import { auth } from "./firebase";
import { pomodoroApi } from "./db";

export interface TemposPomodoro {
  /** Minutos. */
  foco: number;
  pausa: number;
  pausaLonga: number;
  /** Quantos focos até a pausa longa. */
  ciclo: number;
}

export type ModoPomodoro = "focus" | "short" | "long";

export const TEMPOS_PADRAO: TemposPomodoro = { foco: 25, pausa: 5, pausaLonga: 15, ciclo: 4 };

export const SUGESTOES_POMODORO: TemposPomodoro[] = [
  { foco: 25, pausa: 5, pausaLonga: 15, ciclo: 4 },
  { foco: 50, pausa: 10, pausaLonga: 20, ciclo: 3 },
  { foco: 60, pausa: 20, pausaLonga: 30, ciclo: 3 },
  { foco: 90, pausa: 20, pausaLonga: 30, ciclo: 2 },
];

const CHAVE = "mr_pomodoro_tempos";

const limitar = (v: unknown, min: number, max: number, padrao: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : padrao;
};

/** Qualquer coisa -> tempos válidos (foco de 1 a 180 min, pausas até 60/90, ciclo de 1 a 8). */
export function limparTempos(t: Partial<TemposPomodoro> | null | undefined): TemposPomodoro {
  return {
    foco: limitar(t?.foco, 1, 180, TEMPOS_PADRAO.foco),
    pausa: limitar(t?.pausa, 1, 60, TEMPOS_PADRAO.pausa),
    pausaLonga: limitar(t?.pausaLonga, 1, 90, TEMPOS_PADRAO.pausaLonga),
    ciclo: limitar(t?.ciclo, 1, 8, TEMPOS_PADRAO.ciclo),
  };
}

export function segundosDo(modo: ModoPomodoro, t: TemposPomodoro): number {
  return (modo === "focus" ? t.foco : modo === "short" ? t.pausa : t.pausaLonga) * 60;
}

/** 25 -> "25 min", 60 -> "1h", 90 -> "1h30". */
export function minutosCurto(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

export const mesmosTempos = (a: TemposPomodoro, b: TemposPomodoro) =>
  a.foco === b.foco && a.pausa === b.pausa && a.pausaLonga === b.pausaLonga && a.ciclo === b.ciclo;

// ----------------------------------------------
// Estado compartilhado (celular e computador)
// ----------------------------------------------

function lerLocal(): TemposPomodoro {
  try {
    const bruto = localStorage.getItem(CHAVE);
    return bruto ? limparTempos(JSON.parse(bruto)) : TEMPOS_PADRAO;
  } catch {
    return TEMPOS_PADRAO;
  }
}

let atuais: TemposPomodoro = lerLocal();
const ouvintes = new Set<() => void>();
let sincronizadoCom: string | null = null;

function aplicar(novos: TemposPomodoro) {
  atuais = novos;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(novos));
  } catch {
    // Sem armazenamento: vale só enquanto a página estiver aberta.
  }
  ouvintes.forEach((f) => f());
}

export async function definirTemposPomodoro(t: Partial<TemposPomodoro>) {
  const novos = limparTempos(t);
  aplicar(novos);
  if (auth.currentUser) await pomodoroApi.salvar(novos);
}

export function useTemposPomodoro(): TemposPomodoro {
  const tempos = useSyncExternalStore(
    (f) => {
      ouvintes.add(f);
      return () => ouvintes.delete(f);
    },
    () => atuais,
    () => atuais
  );

  // Uma vez por conta: puxa os tempos salvos no perfil (vindos do outro aparelho).
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || sincronizadoCom === uid) return;
    sincronizadoCom = uid;
    pomodoroApi
      .ler()
      .then((remotos) => {
        if (remotos && !mesmosTempos(limparTempos(remotos), atuais)) aplicar(limparTempos(remotos));
      })
      .catch(() => {
        sincronizadoCom = null;
      });
  }, []);

  return tempos;
}
