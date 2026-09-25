// ==============================================
// Dados ao vivo (Firestore onSnapshot)
// ==============================================
// Usado pelo layout de computador. Em vez de cada card buscar a sua cópia
// (antes a Home lia as transações três vezes), cada coleção tem UMA escuta
// compartilhada: todos os cards leem do mesmo lugar e se atualizam juntos.
//
// De brinde, o que chega de fora aparece sozinho: um gasto mandado pelo
// Telegram entra na tela na hora, sem recarregar a página.
//
// As gravações continuam passando pelas funções de db.ts (tasksApi,
// transactionsApi, ...). O Firestore avisa a escuta da mudança local na
// mesma hora, então a tela reage ao clique sem esperar a rede.

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  collection,
  documentId,
  endAt,
  onSnapshot,
  orderBy,
  query,
  startAt,
  type DocumentData,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { dayKey, previousDay } from "./dates";
import { isDoneOn, type HabitUndo } from "./habits";
import { telegramApi, type Bill, type Goal, type Task, type TelegramStatus, type Transaction } from "./db";

// ----------------------------------------------
// Tipos como a tela usa
// ----------------------------------------------

/** Transação com a hora em que foi lançada (createdAt), quando existe. */
export interface TransacaoAoVivo extends Transaction {
  criadaEm: Date | null;
}

export interface HabitoAoVivo {
  id: string;
  name: string;
  icon: string;
  /** Sequência guardada, mesmo que já tenha quebrado. */
  streak: number;
  lastCompletedOn: string | null;
  undo?: HabitUndo | null;
  /** Feito hoje? Calculado na hora de ler, não guardado. */
  completed: boolean;
  /** Sequência que ainda vale: feito hoje ou ontem. Um "12" parado há uma semana vira 0. */
  sequenciaViva: number;
}

export interface NotaAoVivo {
  id: string;
  content: string;
  color: string;
  criadaEm: Date | null;
}

/** Timestamp do Firestore, Date ou texto -> Date. */
export function paraData(valor: unknown): Date | null {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  const comToDate = valor as { toDate?: () => Date };
  if (typeof comToDate.toDate === "function") return comToDate.toDate();
  if (typeof valor === "string" || typeof valor === "number") {
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
  }
  return null;
}

// ----------------------------------------------
// Uma escuta por coleção, compartilhada
// ----------------------------------------------

interface Estado<T> {
  itens: T[];
  /** Já chegou a primeira resposta (mesmo que vazia)? */
  pronto: boolean;
}

interface Colecao<T> {
  subscribe: (avisar: () => void) => () => void;
  getSnapshot: () => Estado<T>;
}

const INICIAL = { itens: [], pronto: false };

function criarColecao<T>(
  nome: string,
  campo: string,
  direcao: "asc" | "desc",
  mapear: (id: string, dados: DocumentData) => T
): Colecao<T> {
  let estado: Estado<T> = INICIAL as Estado<T>;
  let cancelar: (() => void) | null = null;
  let dono: string | null = null;
  let desligarDepois: ReturnType<typeof setTimeout> | null = null;
  const ouvintes = new Set<() => void>();

  const avisar = () => ouvintes.forEach((f) => f());

  function ligar() {
    const uid = auth.currentUser?.uid ?? null;
    if (!uid) return;
    if (cancelar && uid === dono) return;

    cancelar?.();
    dono = uid;
    estado = INICIAL as Estado<T>;
    cancelar = onSnapshot(
      query(collection(db, "users", uid, nome), orderBy(campo, direcao)),
      (snap) => {
        estado = { itens: snap.docs.map((d) => mapear(d.id, d.data())), pronto: true };
        avisar();
      },
      (erro) => {
        // Depois de sair da conta, a escuta ainda viva leva um "sem
        // permissão" — isso é esperado e não é notícia.
        if (auth.currentUser) console.error(`Falha ao acompanhar ${nome}:`, erro);
        estado = { ...estado, pronto: true };
        avisar();
      }
    );
  }

  function desligar() {
    cancelar?.();
    cancelar = null;
    dono = null;
    estado = INICIAL as Estado<T>;
  }

  return {
    subscribe(avisarMudanca) {
      ouvintes.add(avisarMudanca);
      if (desligarDepois) {
        clearTimeout(desligarDepois);
        desligarDepois = null;
      }
      ligar();
      return () => {
        ouvintes.delete(avisarMudanca);
        // Trocar de página desmonta um card e monta outro logo em seguida:
        // um respiro antes de desligar evita derrubar e religar a escuta.
        if (ouvintes.size === 0) {
          desligarDepois = setTimeout(() => {
            if (ouvintes.size === 0) desligar();
          }, 2000);
        }
      };
    },
    getSnapshot: () => estado,
  };
}

const tarefas = criarColecao<Task>("tasks", "createdAt", "desc", (id, d) => ({
  id,
  title: d.title ?? "",
  completed: d.completed === true,
  category: d.category ?? "Geral",
}));

interface HabitoGuardado {
  id: string;
  name: string;
  icon: string;
  streak: number;
  lastCompletedOn: string | null;
  undo?: HabitUndo | null;
}

const habitos = criarColecao<HabitoGuardado>("habits", "createdAt", "asc", (id, d) => ({
  id,
  name: d.name ?? "",
  icon: d.icon ?? "Leaf",
  streak: d.streak ?? 0,
  lastCompletedOn: d.lastCompletedOn ?? null,
  undo: d.undo ?? null,
}));

const metas = criarColecao<Goal>("goals", "createdAt", "asc", (id, d) => ({
  id,
  title: d.title ?? "",
  progress: typeof d.progress === "number" ? d.progress : 0,
  target: d.target ?? "",
  deadline: d.deadline ?? "",
}));

const notas = criarColecao<NotaAoVivo>("notes", "createdAt", "desc", (id, d) => ({
  id,
  content: d.content ?? "",
  color: d.color ?? "bg-widget-tasks/20",
  criadaEm: paraData(d.createdAt),
}));

const contas = criarColecao<Bill>("bills", "createdAt", "asc", (id, d) => ({
  id,
  name: d.name ?? "",
  amount: Number(d.amount) || 0,
  dueDate: String(d.dueDate ?? ""),
  category: d.category ?? "Outros",
  paid: d.paid === true,
}));

const transacoes = criarColecao<TransacaoAoVivo>("transactions", "createdAt", "desc", (id, d) => ({
  id,
  description: d.description ?? "",
  amount: Number(d.amount) || 0,
  type: d.type === "income" ? "income" : "expense",
  date: d.date ?? "",
  category: d.category,
  criadaEm: paraData(d.createdAt),
}));

function useColecao<T>(colecao: Colecao<T>): Estado<T> {
  return useSyncExternalStore(colecao.subscribe, colecao.getSnapshot, colecao.getSnapshot);
}

// ----------------------------------------------
// Hooks
// ----------------------------------------------

export function useTarefas() {
  return useColecao(tarefas);
}

export function useMetas() {
  return useColecao(metas);
}

export function useNotas() {
  return useColecao(notas);
}

export function useContas() {
  return useColecao(contas);
}

export function useTransacoes() {
  return useColecao(transacoes);
}

export function useHabitos(): Estado<HabitoAoVivo> {
  const estado = useColecao(habitos);
  // "Hoje" é lido a cada render: se o app ficar aberto na virada do dia, os
  // hábitos abrem sozinhos na próxima atualização da tela.
  const hoje = dayKey();
  return useMemo(() => {
    const ontem = previousDay(hoje);
    return {
      pronto: estado.pronto,
      itens: estado.itens.map((h) => ({
        ...h,
        completed: isDoneOn(h, hoje),
        sequenciaViva: h.lastCompletedOn === hoje || h.lastCompletedOn === ontem ? h.streak : 0,
      })),
    };
  }, [estado, hoje]);
}

/**
 * Mantém as escutas ligadas enquanto o layout de computador está na tela,
 * para que trocar de página seja instantâneo. Não re-renderiza nada.
 */
export function useManterAoVivo() {
  useEffect(() => {
    const nada = () => {};
    const cancelar = [tarefas, habitos, metas, notas, contas, transacoes, telegram].map((c) =>
      c.subscribe(nada)
    );
    return () => cancelar.forEach((c) => c());
  }, []);
}

// ----------------------------------------------
// Telegram (documento do perfil)
// ----------------------------------------------

/** `undefined` enquanto carrega; `null` quando não há vínculo. */
type EstadoTelegram = TelegramStatus | null | undefined;

const telegram = (() => {
  let estado: EstadoTelegram = undefined;
  let cancelar: (() => void) | null = null;
  let desligarDepois: ReturnType<typeof setTimeout> | null = null;
  const ouvintes = new Set<() => void>();
  return {
    subscribe(avisar: () => void) {
      ouvintes.add(avisar);
      if (desligarDepois) {
        clearTimeout(desligarDepois);
        desligarDepois = null;
      }
      if (!cancelar && auth.currentUser) {
        cancelar = telegramApi.observar((status) => {
          estado = status;
          ouvintes.forEach((f) => f());
        });
      }
      return () => {
        ouvintes.delete(avisar);
        if (ouvintes.size === 0) {
          desligarDepois = setTimeout(() => {
            if (ouvintes.size > 0) return;
            cancelar?.();
            cancelar = null;
            estado = undefined;
          }, 2000);
        }
      };
    },
    getSnapshot: () => estado,
  };
})();

export function useTelegram(): EstadoTelegram {
  return useSyncExternalStore(telegram.subscribe, telegram.getSnapshot, telegram.getSnapshot);
}

// ----------------------------------------------
// Histórico por dia (tarefas e hábitos concluídos)
// ----------------------------------------------

export interface Dia {
  tarefas: number;
  habitos: number;
}

/**
 * Os contadores de days/{YYYY-MM-DD} entre dois dias (inclusive), ao vivo:
 * concluir uma tarefa aparece no gráfico da semana na mesma hora.
 */
export function useDias(inicio: string, fim: string): { dias: Map<string, Dia>; pronto: boolean } {
  const [estado, setEstado] = useState<{ chave: string; dias: Map<string, Dia> } | null>(null);
  const chave = `${inicio}|${fim}`;

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    return onSnapshot(
      query(collection(db, "users", uid, "days"), orderBy(documentId()), startAt(inicio), endAt(fim)),
      (snap) => {
        const dias = new Map<string, Dia>();
        snap.docs.forEach((d) => {
          const dados = d.data();
          dias.set(d.id, { tarefas: dados.tasksCompleted ?? 0, habitos: dados.habitsCompleted ?? 0 });
        });
        setEstado({ chave, dias });
      },
      (erro) => {
        if (auth.currentUser) console.error("Falha ao acompanhar o histórico:", erro);
        setEstado({ chave, dias: new Map() });
      }
    );
  }, [inicio, fim, chave]);

  const atual = estado?.chave === chave ? estado : null;
  return { dias: atual?.dias ?? new Map(), pronto: atual !== null };
}
