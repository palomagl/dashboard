import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useLocale } from "@/contexts/LocaleContext";
import { diasApi } from "@/lib/db";
import { segundosDo, useTemposPomodoro, type ModoPomodoro, type TemposPomodoro } from "@/lib/pomodoro";

// ==============================================
// Pomodoro do computador
// ==============================================
// Mesmo comportamento do widget do celular (tempos escolhidos em
// src/lib/pomodoro.ts — 25/5/15 de padrão —, pausa longa a cada N focos,
// sessões do dia salvas neste navegador com as mesmas chaves), mas:
//
// - mora no layout, não no card: trocar de página não zera o timer, e o menu
//   lateral mostra o tempo enquanto ele corre;
// - conta pelo relógio (hora de término), não por "menos 1 a cada segundo".
//   Com a aba em segundo plano o navegador atrasa os intervalos, e o timer
//   antigo andava mais devagar que o tempo de verdade;
// - mostra o tempo no título da aba.

export type { ModoPomodoro };

const SESSOES = "mr_pomodoro_sessions";
const CICLO = "mr_pomodoro_cycle";

// Mesmo formato do widget do celular, para as duas telas somarem juntas.
function chaveHoje() {
  return new Date().toISOString().slice(0, 10);
}

function lerSessoesHoje(): number {
  try {
    const bruto = localStorage.getItem(SESSOES);
    if (!bruto) return 0;
    const dados = JSON.parse(bruto);
    return dados.date === chaveHoje() ? dados.count : 0;
  } catch {
    return 0;
  }
}

function tocarAviso() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [880, 1108].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      ganho.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      ganho.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + i * 0.18 + 0.02);
      ganho.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.35);
      osc.connect(ganho).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.4);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {
    /* sem áudio: segue só com o aviso na tela */
  }
}

interface EstadoPomodoro {
  modo: ModoPomodoro;
  rodando: boolean;
  /** Segundos que faltam. */
  restante: number;
  /** 0..1 */
  progresso: number;
  sessoesHoje: number;
  /** Focos concluídos no ciclo atual. */
  ciclo: number;
  /** Os tempos escolhidos (minutos) e quantos focos tem o ciclo. */
  tempos: TemposPomodoro;
  /** Começou e ainda não terminou (rodando ou pausado no meio). */
  emAndamento: boolean;
  alternar: () => void;
  reiniciar: () => void;
  pular: () => void;
  trocarModo: (m: ModoPomodoro) => void;
}

const Contexto = createContext<EstadoPomodoro | null>(null);

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  const tempos = useTemposPomodoro();
  const [modo, setModo] = useState<ModoPomodoro>("focus");
  const [fimEm, setFimEm] = useState<number | null>(null); // rodando: hora de término
  const [restantePausado, setRestantePausado] = useState(() => segundosDo("focus", tempos));
  const duracao = segundosDo(modo, tempos);
  const [agora, setAgora] = useState(() => Date.now());
  const [sessoesHoje, setSessoesHoje] = useState(lerSessoesHoje);
  const [ciclo, setCiclo] = useState(() => {
    try {
      const c = Number(localStorage.getItem(CICLO) || 0);
      return Number.isNaN(c) ? 0 : c;
    } catch {
      return 0;
    }
  });

  const rodando = fimEm !== null;
  const restante = rodando ? Math.max(0, Math.ceil((fimEm - agora) / 1000)) : restantePausado;

  const trocarModo = useCallback(
    (m: ModoPomodoro) => {
      setModo(m);
      setFimEm(null);
      setRestantePausado(segundosDo(m, tempos));
    },
    [tempos]
  );

  // Mudou os tempos com o timer parado no começo: já mostra o novo tempo.
  // No meio de uma sessão, ela termina com o tempo que começou.
  const duracaoAnterior = useRef(duracao);
  useEffect(() => {
    if (!rodando && restantePausado === duracaoAnterior.current) setRestantePausado(duracao);
    duracaoAnterior.current = duracao;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duracao]);

  const concluir = useCallback(() => {
    tocarAviso();
    if (modo === "focus") {
      const total = sessoesHoje + 1;
      setSessoesHoje(total);
      const proximoCiclo = (ciclo + 1) % tempos.ciclo;
      setCiclo(proximoCiclo);
      try {
        localStorage.setItem(SESSOES, JSON.stringify({ date: chaveHoje(), count: total }));
        localStorage.setItem(CICLO, String(proximoCiclo));
      } catch {
        /* sem storage */
      }
      toast.success(t("pomodoroDone"));
      // Fica no histórico do dia ("o que eu fiz"). Se falhar, o timer segue.
      diasApi.registrarFoco().catch(() => {});
      trocarModo(proximoCiclo === 0 ? "long" : "short");
    } else {
      toast.success(t("pomodoroBreakDone"));
      trocarModo("focus");
    }
  }, [modo, sessoesHoje, ciclo, trocarModo, t, tempos.ciclo]);

  // Relógio: só anda enquanto roda.
  useEffect(() => {
    if (!rodando) return;
    const id = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(id);
  }, [rodando]);

  const concluirRef = useRef(concluir);
  concluirRef.current = concluir;
  useEffect(() => {
    if (rodando && restante === 0) concluirRef.current();
  }, [rodando, restante]);

  // Tempo no título da aba enquanto roda.
  useEffect(() => {
    if (!rodando) return;
    const original = document.title;
    const mm = String(Math.floor(restante / 60)).padStart(2, "0");
    const ss = String(restante % 60).padStart(2, "0");
    const rotulo = modo === "focus" ? t("pomodoroFocus") : t("pomodoroBreak");
    document.title = `${mm}:${ss} · ${rotulo}`;
    return () => {
      document.title = original;
    };
  }, [rodando, restante, modo, t]);

  const alternar = useCallback(() => {
    if (rodando) {
      setRestantePausado(restante);
      setFimEm(null);
    } else {
      const agoraMs = Date.now();
      setAgora(agoraMs);
      setFimEm(agoraMs + restantePausado * 1000);
    }
  }, [rodando, restante, restantePausado]);

  const reiniciar = useCallback(() => {
    setFimEm(null);
    setRestantePausado(duracao);
  }, [duracao]);

  const pular = useCallback(() => {
    setFimEm(null);
    if (modo === "focus") concluir();
    else trocarModo("focus");
  }, [modo, concluir, trocarModo]);

  const valor = useMemo<EstadoPomodoro>(
    () => ({
      modo,
      rodando,
      restante,
      progresso: Math.max(0, Math.min(1, 1 - restante / duracao)),
      sessoesHoje,
      ciclo: Math.min(ciclo, tempos.ciclo),
      tempos,
      emAndamento: rodando || restante < duracao,
      alternar,
      reiniciar,
      pular,
      trocarModo,
    }),
    [modo, rodando, restante, duracao, sessoesHoje, ciclo, tempos, alternar, reiniciar, pular, trocarModo]
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePomodoro(): EstadoPomodoro {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("usePomodoro precisa do PomodoroProvider");
  return ctx;
}

export function relogio(segundos: number): string {
  return `${String(Math.floor(segundos / 60)).padStart(2, "0")}:${String(segundos % 60).padStart(2, "0")}`;
}
