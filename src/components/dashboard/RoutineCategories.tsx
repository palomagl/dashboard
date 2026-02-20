import { useState, useEffect, useMemo } from "react";
import { Briefcase, Heart, GraduationCap, Home, LayoutGrid, Sparkles } from "lucide-react";
import { tasksApi, Task } from "@/lib/api";
import { useLocale } from "@/contexts/LocaleContext";
import type { TranslationKey } from "@/lib/translations";

const CATEGORY_KEYS = ["Trabalho", "Saúde", "Estudos", "Bem-estar", "Casa", "Geral"] as const;
const ICON_MAP = {
  Trabalho: Briefcase,
  Saúde: Heart,
  Estudos: GraduationCap,
  "Bem-estar": Sparkles,
  Casa: Home,
  Geral: LayoutGrid,
} as const;
const COLOR_MAP = {
  Trabalho: "text-widget-tasks",
  Saúde: "text-widget-habits",
  Estudos: "text-widget-goals",
  "Bem-estar": "text-widget-notes",
  Casa: "text-widget-tasks",
  Geral: "text-widget-habits",
} as const;
const LABEL_KEYS: Record<(typeof CATEGORY_KEYS)[number], TranslationKey> = {
  Trabalho: "categoryWork",
  Saúde: "categoryHealth",
  Estudos: "categoryStudy",
  "Bem-estar": "categoryWellbeing",
  Casa: "categoryHome",
  Geral: "categoryGeneral",
};

export function RoutineCategories() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { t } = useLocale();

  useEffect(() => {
    tasksApi.list().then(setTasks).catch(() => {});
  }, []);

  const countByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORY_KEYS.forEach((c) => (counts[c] = 0));
    tasks.forEach((task) => {
      if (CATEGORY_KEYS.includes(task.category as (typeof CATEGORY_KEYS)[number])) {
        counts[task.category] = (counts[task.category] ?? 0) + 1;
      } else {
        counts["Geral"] = (counts["Geral"] ?? 0) + 1;
      }
    });
    return counts;
  }, [tasks]);

  return (
    <div className="glass-card glass-card-hover rounded-xl p-5 animate-fade-in" style={{ animationDelay: "300ms" }}>
      <div className="mb-4">
        <h3 className="font-semibold text-lg">{t("routineAreas")}</h3>
        <p className="text-sm text-muted-foreground">{t("routineAreasSubtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CATEGORY_KEYS.map((categoryKey) => {
          const count = countByCategory[categoryKey] ?? 0;
          const Icon = ICON_MAP[categoryKey];
          const color = COLOR_MAP[categoryKey];
          const label = t(LABEL_KEYS[categoryKey]);
          const tasksLabel = count === 1 ? t("tasksCountOne") : t("tasksCount");
          return (
            <button
              type="button"
              key={categoryKey}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left"
            >
              <div className={`p-2 rounded-lg bg-background/50 shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{label}</p>
                <p className="text-xs text-muted-foreground">
                  {count} {tasksLabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
