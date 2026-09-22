// ==============================================
// Hábitos: "feito hoje?" e sequência
// ==============================================
// Um hábito não guarda `completed: boolean`, porque um booleano não sabe que
// dia é hoje — marcado na segunda, ficaria marcado para sempre. Ele guarda a
// última data em que foi concluído, e "feito hoje" vira uma comparação. Assim
// o hábito abre sozinho na virada do dia, sem nada precisar rodar.

import { previousDay } from "./dates";

/** Estado guardado para desfazer uma marcação feita por engano. */
export interface HabitUndo {
  streak: number;
  lastCompletedOn: string | null;
}

export interface HabitProgress {
  streak: number;
  lastCompletedOn: string | null;
  /** Como o hábito estava antes da marcação de hoje. `null` quando não há o que desfazer. */
  undo?: HabitUndo | null;
}

/** O hábito foi concluído nesse dia? */
export function isDoneOn(habit: HabitProgress, day: string): boolean {
  return habit.lastCompletedOn === day;
}

/**
 * Marca ou desmarca o hábito no dia informado, devolvendo o novo estado.
 *
 * Ao marcar, guarda o estado anterior em `undo`. Desmarcar restaura esse estado
 * exato — sem isso, marcar por engano e desmarcar destruiria a sequência, já que
 * a data anterior teria se perdido.
 */
export function toggle(habit: HabitProgress, today: string): HabitProgress {
  if (isDoneOn(habit, today)) {
    if (habit.undo) {
      return {
        streak: habit.undo.streak,
        lastCompletedOn: habit.undo.lastCompletedOn,
        undo: null,
      };
    }
    // Sem estado anterior (hábito criado já marcado, ou dado vindo de fora):
    // desconta o dia de hoje sem nunca deixar a sequência negativa.
    return {
      streak: Math.max(0, habit.streak - 1),
      lastCompletedOn: null,
      undo: null,
    };
  }

  const emendaComOntem = habit.lastCompletedOn === previousDay(today);
  return {
    streak: emendaComOntem ? habit.streak + 1 : 1,
    lastCompletedOn: today,
    undo: { streak: habit.streak, lastCompletedOn: habit.lastCompletedOn },
  };
}
