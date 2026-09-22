import { useState, useEffect } from "react";
import { Target, Plus, Trash2, X, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { goalsApi, Goal } from "@/lib/db";
import { executar, carregar } from "@/lib/acoes";
import { useLocale } from "@/contexts/LocaleContext";

export function GoalsWidget() {
  const { t } = useLocale();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: "", target: "", deadline: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState({ title: "", target: "", deadline: "" });

  useEffect(() => {
    carregar(() => goalsApi.list(), "metas").then((lista) => lista && setGoals(lista));
  }, []);

  const addGoal = async () => {
    if (!newGoal.title.trim() || !newGoal.target.trim()) return;
    const goal = await executar(
      () => goalsApi.create({
        title: newGoal.title.trim(), progress: 0,
        target: newGoal.target.trim(), deadline: newGoal.deadline.trim() || t("goalsNoDeadline"),
      }),
      { erro: t("erroAoAdicionar") }
    );
    if (!goal) return;
    setGoals([...goals, goal]);
    setNewGoal({ title: "", target: "", deadline: "" });
    setShowAddForm(false);
  };

  const deleteGoal = async (id: string) => {
    const feito = await executar(() => goalsApi.delete(id), { erro: t("erroAoExcluir") });
    if (feito === null) return;
    setGoals(goals.filter(g => g.id !== id));
  };

  const updateProgress = async (id: string, delta: number) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    const newProgress = Math.max(0, Math.min(100, goal.progress + delta));
    if (newProgress === goal.progress) return;
    const salvo = await executar(
      () => goalsApi.update(id, { progress: newProgress }),
      { erro: t("erroAoSalvar") }
    );
    if (salvo === null) return;
    setGoals(goals.map(g => g.id === id ? { ...g, progress: newProgress } : g));
  };

  const startEditing = (goal: Goal) => {
    setEditingId(goal.id);
    setEditingGoal({ title: goal.title, target: goal.target, deadline: goal.deadline });
  };

  const saveEdit = async () => {
    if (!editingGoal.title.trim() || !editingGoal.target.trim() || !editingId) return;
    const dados = {
      title: editingGoal.title.trim(),
      target: editingGoal.target.trim(),
      deadline: editingGoal.deadline.trim() || t("goalsNoDeadline"),
    };
    const salvo = await executar(
      () => goalsApi.update(editingId, dados),
      { erro: t("erroAoSalvar") }
    );
    if (salvo === null) return;
    setGoals(goals.map(g => g.id === editingId ? { ...g, ...dados } : g));
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingGoal({ title: "", target: "", deadline: "" });
  };

  return (
    <div className="glass-card glass-card-hover rounded-xl p-5 animate-fade-in" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-widget-goals" />
            {t("goalsTitle")}
          </h3>
          <p className="text-sm text-muted-foreground">{goals.length} {t("goalsSubtitle")}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </Button>
      </div>

      {showAddForm && (
        <div className="space-y-2 mb-4 p-3 bg-secondary/30 rounded-lg animate-fade-in">
          <Input placeholder={t("goalsNamePlaceholder")} value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} className="bg-background/50 border-border/50" autoFocus />
          <div className="flex gap-2">
            <Input placeholder={t("goalsTargetPlaceholder")} value={newGoal.target} onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })} className="bg-background/50 border-border/50" />
            <Input placeholder={t("goalsDeadlinePlaceholder")} value={newGoal.deadline} onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })} className="bg-background/50 border-border/50 w-28" />
          </div>
          <Button onClick={addGoal} size="sm" className="w-full bg-widget-goals hover:bg-widget-goals/90">{t("goalsAdd")}</Button>
        </div>
      )}

      <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
        {goals.map((goal) => (
          <div key={goal.id} className="space-y-2 group">
            {editingId === goal.id ? (
              <div className="space-y-2 p-2 bg-secondary/30 rounded-lg">
                <Input value={editingGoal.title} onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })} className="bg-background/50 border-border/50 h-8" placeholder={t("goalsNamePlaceholder")} />
                <div className="flex gap-2">
                  <Input value={editingGoal.target} onChange={(e) => setEditingGoal({ ...editingGoal, target: e.target.value })} className="bg-background/50 border-border/50 h-8 flex-1" placeholder={t("goalsTargetPlaceholder")} />
                  <Input value={editingGoal.deadline} onChange={(e) => setEditingGoal({ ...editingGoal, deadline: e.target.value })} className="bg-background/50 border-border/50 h-8 w-24" placeholder={t("goalsDeadlinePlaceholder")} />
                  <button type="button" onClick={saveEdit} className="p-1" aria-label={t("save")}><Check className="w-4 h-4 text-emerald-500" /></button>
                  <button type="button" onClick={cancelEdit} className="p-1" aria-label={t("cancel")}><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{goal.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{goal.deadline}</span>
                    <button type="button" onClick={() => startEditing(goal)} className="opacity-0 group-hover:opacity-100 transition-opacity" aria-label={t("goalsEdit")}>
                      <Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" />
                    </button>
                    <button type="button" onClick={() => deleteGoal(goal.id)} className="opacity-0 group-hover:opacity-100 transition-opacity" aria-label={t("goalsDelete")}>
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => updateProgress(goal.id, -10)} className="text-xs text-muted-foreground hover:text-foreground px-1" aria-label={t("goalsDecrease")}>−</button>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-widget-goals rounded-full transition-all duration-500" style={{ width: `${goal.progress}%` }} />
                  </div>
                  <button type="button" onClick={() => updateProgress(goal.id, 10)} className="text-xs text-muted-foreground hover:text-foreground px-1" aria-label={t("goalsIncrease")}>+</button>
                  <span className="text-xs font-medium text-muted-foreground min-w-[60px] text-right">{goal.target}</span>
                </div>
              </>
            )}
          </div>
        ))}
        {goals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {t("goalsEmpty")}
          </div>
        )}
      </div>
    </div>
  );
}
