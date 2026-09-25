// ==============================================
// Camada de dados (Firestore)
// ==============================================
// Substitui o antigo api.ts, que falava com um backend Express. A forma das
// funções foi mantida de propósito (`tasksApi.list()`, `.create()`, ...) para
// que os widgets mudassem só o import.
//
// Tudo mora embaixo de users/{uid}. Quem garante que ninguém alcança o espaço
// de outra pessoa são as regras em firestore.rules, avaliadas no servidor.

import {
  collection,
  deleteDoc,
  doc,
  documentId,
  endAt,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  startAt,
  updateDoc,
  addDoc,
  increment,
  deleteField,
  onSnapshot,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { dayKey, lastNDays } from "./dates";
import { isDoneOn, toggle as toggleHabit, type HabitProgress } from "./habits";

// ==============================================
// Base
// ==============================================

function uid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error("Não autenticado");
  return user.uid;
}

function col(nome: string) {
  return collection(db, "users", uid(), nome);
}

function ref(nome: string, id: string) {
  return doc(db, "users", uid(), nome, id);
}

/** O Firestore recusa campos `undefined`: some com eles antes de gravar. */
function semIndefinidos<T extends Record<string, unknown>>(dados: T): T {
  return Object.fromEntries(Object.entries(dados).filter(([, v]) => v !== undefined)) as T;
}

function comId<T>(snap: QueryDocumentSnapshot<DocumentData>): T {
  return { id: snap.id, ...snap.data() } as T;
}

async function listar<T>(nome: string, campo = "createdAt", dir: "asc" | "desc" = "asc"): Promise<T[]> {
  const snap = await getDocs(query(col(nome), orderBy(campo, dir)));
  return snap.docs.map((d) => comId<T>(d));
}

async function criar<T extends { id: string }>(nome: string, dados: Record<string, unknown>): Promise<T> {
  const payload = { ...dados, createdAt: Timestamp.now() };
  const criado = await addDoc(col(nome), payload);
  return { id: criado.id, ...payload } as unknown as T;
}

/**
 * Soma ao contador do dia. É o que alimenta o gráfico semanal.
 *
 * O histórico é guardado por dia em vez de recontado a partir das tarefas de
 * propósito: se você conclui 5 tarefas na segunda e apaga 3 na quarta, a
 * segunda continua tendo sido um dia de 5.
 */
async function contarNoDia(campo: "tasksCompleted" | "habitsCompleted", delta: number, dia: string = dayKey()) {
  if (delta === 0) return;
  await setDoc(ref("days", dia), { [campo]: increment(delta) }, { merge: true });
}

/**
 * Anota no dia O QUE foi feito, além de quanto: o nome da tarefa concluída, o
 * hábito marcado, o progresso da meta. É o que a tela "o que eu fiz nesse
 * dia" mostra. O nome vai junto de propósito: se a tarefa for apagada depois,
 * o dia continua dizendo o que foi feito. `null` tira a anotação (desfazer).
 */
async function anotarNoDia(
  dia: string,
  campo: "tarefas" | "habitos" | "metas",
  id: string,
  valor: unknown | null
) {
  if (valor === null) {
    // O dia pode nem existir ainda (nada a desfazer): isso não é erro.
    await updateDoc(ref("days", dia), { [`${campo}.${id}`]: deleteField() }).catch(() => {});
    return;
  }
  await setDoc(ref("days", dia), { [campo]: { [id]: valor } }, { merge: true });
}

// ==============================================
// PERFIL
// ==============================================

export interface User {
  id: string;
  name: string;
  email: string;
  photoURL: string | null;
}

export const userApi = {
  /** Cria o perfil no primeiro acesso, a partir do que o Google devolveu. */
  async ensure(dados: { name: string; email: string; photoURL: string | null }): Promise<User> {
    const perfil = doc(db, "users", uid());
    const atual = await getDoc(perfil);

    if (!atual.exists()) {
      await setDoc(perfil, { ...dados, createdAt: Timestamp.now() });
      return { id: uid(), ...dados };
    }

    const guardado = atual.data();
    return {
      id: uid(),
      // O nome pode ter sido editado no app; o do Google não sobrescreve.
      name: guardado.name ?? dados.name,
      email: guardado.email ?? dados.email,
      photoURL: guardado.photoURL ?? dados.photoURL,
    };
  },

  async updateProfile(dados: { name: string; email: string }): Promise<User> {
    await updateDoc(doc(db, "users", uid()), { name: dados.name });
    const atual = await getDoc(doc(db, "users", uid()));
    const d = atual.data() ?? {};
    return { id: uid(), name: d.name, email: d.email, photoURL: d.photoURL ?? null };
  },
};

// ==============================================
// TELEGRAM
// ==============================================
// O vínculo em si — telegramChats/{chatId} e a escrita de verdade em
// users/{uid}.telegram — é feito só pelo servidor, com o Admin SDK. O
// cliente nunca grava isso direto: só lê ao vivo, pra tela, e chama as
// rotas que pedem ou desfazem o vínculo.

export interface TelegramStatus {
  chatId: string;
  vinculadoEm: Date;
}

export interface CodigoVinculo {
  /** Ex.: "K7M2P9XQ". Mandar como "/start K7M2P9XQ" pro bot. */
  codigo: string;
  /** ISO 8601. */
  expiraEm: string;
}

async function cabecalhoAutorizacao(): Promise<HeadersInit> {
  const usuario = auth.currentUser;
  if (!usuario) throw new Error("Não autenticado");
  const token = await usuario.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export const telegramApi = {
  /** Observa users/{uid}.telegram ao vivo. Chama `cb(null)` quando não há vínculo. */
  observar(cb: (status: TelegramStatus | null) => void): () => void {
    return onSnapshot(doc(db, "users", uid()), (snap) => {
      const dado = snap.data()?.telegram as { chatId: string; vinculadoEm: Timestamp } | undefined;
      cb(dado ? { chatId: dado.chatId, vinculadoEm: dado.vinculadoEm.toDate() } : null);
    });
  },

  async gerarCodigo(): Promise<CodigoVinculo> {
    const res = await fetch("/api/telegram/vinculo", {
      method: "POST",
      headers: await cabecalhoAutorizacao(),
    });
    if (!res.ok) throw new Error("Não foi possível gerar o código. Tente de novo.");
    return res.json();
  },

  async desvincular(): Promise<void> {
    const res = await fetch("/api/telegram/vinculo", {
      method: "DELETE",
      headers: await cabecalhoAutorizacao(),
    });
    if (!res.ok) throw new Error("Não foi possível desvincular. Tente de novo.");
  },
};

// ==============================================
// TAREFAS
// ==============================================

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: string;
  /** "YYYY-MM-DD" do dia em que foi concluída. Ausente nas antigas e nas abertas. */
  completedOn?: string;
}

export const tasksApi = {
  list: () => listar<Task>("tasks", "createdAt", "desc"),

  create: (dados: Omit<Task, "id">) => criar<Task>("tasks", { ...dados }),

  async update(id: string, dados: Partial<Task>): Promise<Task> {
    // Concluir ou reabrir uma tarefa mexe no contador do dia, então
    // precisamos saber como ela estava antes.
    const extra: Record<string, unknown> = {};
    if (dados.completed !== undefined) {
      const atual = await getDoc(ref("tasks", id));
      const guardada = atual.data();
      const antes = guardada?.completed === true;
      if (antes !== dados.completed) {
        if (dados.completed) {
          const hoje = dayKey();
          await contarNoDia("tasksCompleted", 1, hoje);
          await anotarNoDia(hoje, "tarefas", id, {
            titulo: dados.title ?? guardada?.title ?? "",
            categoria: dados.category ?? guardada?.category ?? "Geral",
          });
          extra.completedOn = hoje;
        } else {
          // Reabrir desconta do dia em que ela foi concluída — não de hoje.
          // Tarefas concluídas antes de existir o completedOn caem em hoje,
          // como sempre foi.
          const dia: string = guardada?.completedOn ?? dayKey();
          await contarNoDia("tasksCompleted", -1, dia);
          await anotarNoDia(dia, "tarefas", id, null);
          extra.completedOn = deleteField();
        }
      }
    }
    await updateDoc(ref("tasks", id), { ...dados, ...extra });
    const depois = await getDoc(ref("tasks", id));
    return { id, ...depois.data() } as Task;
  },

  async delete(id: string) {
    await deleteDoc(ref("tasks", id));
  },
};

// ==============================================
// HÁBITOS
// ==============================================

/**
 * O `completed` aqui é calculado, não guardado: ele quer dizer
 * "concluído hoje". No Firestore existe `lastCompletedOn` — ver habits.ts.
 */
export interface Habit {
  id: string;
  name: string;
  icon: string;
  completed: boolean;
  streak: number;
}

interface HabitDoc extends HabitProgress {
  name: string;
  icon: string;
}

function habitParaWidget(id: string, doc: HabitDoc, hoje: string): Habit {
  return {
    id,
    name: doc.name,
    icon: doc.icon,
    streak: doc.streak ?? 0,
    completed: isDoneOn(doc, hoje),
  };
}

export const habitsApi = {
  async list(): Promise<Habit[]> {
    const hoje = dayKey();
    const snap = await getDocs(query(col("habits"), orderBy("createdAt", "asc")));
    return snap.docs.map((d) => habitParaWidget(d.id, d.data() as HabitDoc, hoje));
  },

  async create(dados: Omit<Habit, "id">): Promise<Habit> {
    const hoje = dayKey();
    const novo: HabitDoc = {
      name: dados.name,
      icon: dados.icon,
      streak: 0,
      lastCompletedOn: null,
      undo: null,
    };
    const criado = await addDoc(col("habits"), { ...novo, createdAt: Timestamp.now() });
    return habitParaWidget(criado.id, novo, hoje);
  },

  async toggle(id: string): Promise<Habit> {
    const hoje = dayKey();
    const snap = await getDoc(ref("habits", id));
    if (!snap.exists()) throw new Error("Hábito não encontrado");

    const atual = snap.data() as HabitDoc;
    const estavaFeito = isDoneOn(atual, hoje);
    const novo = toggleHabit(atual, hoje);

    await updateDoc(ref("habits", id), {
      streak: novo.streak,
      lastCompletedOn: novo.lastCompletedOn,
      undo: novo.undo ?? null,
    });
    await contarNoDia("habitsCompleted", estavaFeito ? -1 : 1);
    await anotarNoDia(hoje, "habitos", id, estavaFeito ? null : { nome: atual.name, icone: atual.icon });

    return habitParaWidget(id, { ...atual, ...novo }, hoje);
  },

  async delete(id: string) {
    await deleteDoc(ref("habits", id));
  },
};

// ==============================================
// METAS
// ==============================================

export interface Goal {
  id: string;
  title: string;
  progress: number;
  target: string;
  deadline: string;
}

export const goalsApi = {
  list: () => listar<Goal>("goals"),
  create: (dados: Omit<Goal, "id">) => criar<Goal>("goals", { ...dados }),
  async update(id: string, dados: Partial<Goal>) {
    // Mudou o progresso: anota no dia "de quanto para quanto" — o "de" é o do
    // primeiro ajuste do dia, para o dia mostrar o avanço total.
    if (dados.progress !== undefined) {
      const hoje = dayKey();
      const [meta, dia] = await Promise.all([getDoc(ref("goals", id)), getDoc(ref("days", hoje))]);
      const antes = meta.data();
      const jaAnotado = dia.data()?.metas?.[id];
      await anotarNoDia(hoje, "metas", id, {
        titulo: dados.title ?? antes?.title ?? "",
        de: jaAnotado?.de ?? antes?.progress ?? 0,
        para: dados.progress,
      });
    }
    await updateDoc(ref("goals", id), dados);
  },
  async delete(id: string) {
    await deleteDoc(ref("goals", id));
  },
};

// ==============================================
// HISTÓRICO DO DIA
// ==============================================

export const diasApi = {
  /** Uma sessão de foco do Pomodoro terminou: conta no dia de hoje. */
  async registrarFoco() {
    await setDoc(ref("days", dayKey()), { focos: increment(1) }, { merge: true });
  },
};

// ==============================================
// NOTAS
// ==============================================

export interface Note {
  id: string;
  content: string;
  color: string;
  createdAt: string;
}

export const notesApi = {
  list: () => listar<Note>("notes", "createdAt", "desc"),
  create: (dados: { content: string; color: string }) => criar<Note>("notes", { ...dados }),
  async update(id: string, dados: Partial<Note>) {
    await updateDoc(ref("notes", id), dados);
  },
  async delete(id: string) {
    await deleteDoc(ref("notes", id));
  },
};

// ==============================================
// FINANÇAS - Contas
// ==============================================

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  category: string;
  paid: boolean;
}

export const billsApi = {
  list: () => listar<Bill>("bills"),
  create: (dados: Omit<Bill, "id">) => criar<Bill>("bills", { ...dados }),
  async update(id: string, dados: Partial<Bill>) {
    await updateDoc(ref("bills", id), dados);
  },
  async delete(id: string) {
    await deleteDoc(ref("bills", id));
  },
};

// ==============================================
// FINANÇAS - Transações
// ==============================================

/**
 * Categorias das transações — mesma lista usada no seletor do formulário e no
 * gráfico "despesas por categoria". Transações antigas ou criadas pelo
 * Telegram (que ainda não pergunta categoria) usam "Outros" por padrão.
 */
export const CATEGORIAS_TRANSACAO = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Lazer",
  "Saúde",
  "Assinaturas",
  "Outros",
] as const;

export type CategoriaTransacao = (typeof CATEGORIAS_TRANSACAO)[number];

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  /** "YYYY-MM-DD". Guardado assim para dar para somar por mês; a tela é quem formata. */
  date: string;
  /** Ausente em transações antigas — quem lê trata como "Outros". */
  category?: CategoriaTransacao;
}

export const transactionsApi = {
  list: () => listar<Transaction>("transactions", "createdAt", "desc"),
  create: (dados: Omit<Transaction, "id">) => criar<Transaction>("transactions", { ...dados }),
  async update(id: string, dados: Partial<Transaction>) {
    await updateDoc(ref("transactions", id), dados);
  },
  async delete(id: string) {
    await deleteDoc(ref("transactions", id));
  },
};

// ==============================================
// ESTATÍSTICAS
// ==============================================

export interface QuickStatsData {
  /** "3/5" */
  tasksToday: string;
  /** Maior sequência viva entre os hábitos. */
  streak: number;
  activeGoals: number;
  monthlyBalance: number;
}

export interface WeeklyData {
  /** "YYYY-MM-DD" — a tela é quem vira isso em "Seg". */
  date: string;
  tasks: number;
  habits: number;
}

export const statsApi = {
  async quickStats(): Promise<QuickStatsData> {
    const hoje = dayKey();
    const mesAtual = hoje.slice(0, 7);

    const [tasks, habits, goals, transactions] = await Promise.all([
      tasksApi.list(),
      getDocs(col("habits")),
      goalsApi.list(),
      transactionsApi.list(),
    ]);

    const feitas = tasks.filter((t) => t.completed).length;

    // Uma sequência só conta como viva se o hábito foi feito hoje ou ontem.
    // Um "12" parado há uma semana não é sequência, é lembrança.
    const ontem = lastNDays(2, new Date())[0];
    const sequencias = habits.docs.map((d) => {
      const h = d.data() as HabitDoc;
      const viva = h.lastCompletedOn === hoje || h.lastCompletedOn === ontem;
      return viva ? h.streak ?? 0 : 0;
    });

    const doMes = transactions.filter((t) => t.date?.startsWith(mesAtual));
    const saldo = doMes.reduce(
      (soma, t) => soma + (t.type === "income" ? t.amount : -t.amount),
      0
    );

    return {
      tasksToday: `${feitas}/${tasks.length}`,
      streak: sequencias.length > 0 ? Math.max(...sequencias) : 0,
      activeGoals: goals.filter((g) => g.progress < 100).length,
      monthlyBalance: saldo,
    };
  },

  async weeklyChart(): Promise<WeeklyData[]> {
    const dias = lastNDays(7);

    // Os ids são "YYYY-MM-DD", que ordenam como texto — dá para pegar a semana
    // inteira numa consulta só em vez de sete leituras avulsas.
    const snap = await getDocs(
      query(col("days"), orderBy(documentId()), startAt(dias[0]), endAt(dias[6]))
    );

    const porDia = new Map(snap.docs.map((d) => [d.id, d.data()]));

    return dias.map((date) => ({
      date,
      tasks: porDia.get(date)?.tasksCompleted ?? 0,
      habits: porDia.get(date)?.habitsCompleted ?? 0,
    }));
  },
};
