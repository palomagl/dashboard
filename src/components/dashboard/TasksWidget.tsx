import { useState, useEffect } from "react";
import { Plus, Circle, CheckCircle2, Trash2, X, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tasksApi, Task } from "@/lib/api";
import { useLocale } from "@/contexts/LocaleContext";
import type { TranslationKey } from "@/lib/translations";

const categories = ["Trabalho", "Saúde", "Estudos", "Bem-estar", "Casa", "Geral"];
const CATEGORY_KEYS: Record<string, TranslationKey> = {
  Trabalho: "categoryWork", Saúde: "categoryHealth", Estudos: "categoryStudy",
  "Bem-estar": "categoryWellbeing", Casa: "categoryHome", Geral: "categoryGeneral",
};

export function TasksWidget() {
  const { t } = useLocale();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newCategory, setNewCategory] = useState("Geral");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingCategory, setEditingCategory] = useState("");

  useEffect(() => {
    tasksApi.list().then(setTasks).catch(() => {});
  }, []);

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    try {
      await tasksApi.update(id, { completed: !task.completed });
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    } catch {}
  };

  const deleteTask = async (id: string) => {
    try {
      await tasksApi.delete(id);
      setTasks(tasks.filter(t => t.id !== id));
    } catch {}
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    try {
      const task = await tasksApi.create({ title: newTask, completed: false, category: newCategory });
      setTasks([task, ...tasks]);
      setNewTask("");
      setNewCategory("Geral");
      setShowAddForm(false);
    } catch {}
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditingTitle(task.title);
    setEditingCategory(task.category);
  };

  const saveEdit = async () => {
    if (!editingTitle.trim() || !editingId) return;
    try {
      await tasksApi.update(editingId, { title: editingTitle, category: editingCategory });
      setTasks(tasks.map(t => t.id === editingId ? { ...t, title: editingTitle, category: editingCategory } : t));
      setEditingId(null);
    } catch {}
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
    setEditingCategory("");
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div className="glass-card glass-card-hover rounded-xl p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-widget-tasks" />
            {t("tasksTitle")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {completedCount} {t("tasksOf")} {tasks.length} {t("tasksCompletedOf")}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </Button>
      </div>

      <div className="h-1.5 bg-secondary rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-widget-tasks rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {showAddForm && (
        <div className="space-y-2 mb-4 p-3 bg-secondary/30 rounded-lg animate-fade-in">
          <Input
            placeholder={t("tasksPlaceholder")}
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            className="bg-background/50 border-border/50"
            autoFocus
          />
          <div className="flex gap-2">
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="bg-background/50 border-border/50 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{t(CATEGORY_KEYS[cat] ?? "categoryGeneral")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={addTask} size="sm" className="bg-widget-tasks hover:bg-widget-tasks/90">
              {t("tasksAdd")}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group
              ${task.completed 
                ? 'bg-secondary/30 opacity-60' 
                : 'bg-secondary/50 hover:bg-secondary'
              }`}
          >
            {editingId === task.id ? (
              <>
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="flex-1 h-8 bg-background/50 border-border/50"
                  autoFocus
                />
                <Select value={editingCategory} onValueChange={setEditingCategory}>
                  <SelectTrigger className="w-28 h-8 bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{t(CATEGORY_KEYS[cat] ?? "categoryGeneral")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button type="button" onClick={saveEdit} className="p-1" aria-label={t("save")}>
                  <Check className="w-4 h-4 text-emerald-500" />
                </button>
                <button type="button" onClick={cancelEdit} className="p-1" aria-label={t("cancel")}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => toggleTask(task.id)} className="shrink-0" aria-label={task.completed ? t("uncompleteTask") : t("completeTask")}>
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-widget-tasks" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground group-hover:text-widget-tasks transition-colors" />
                  )}
                </button>
                <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </span>
                <span className="text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded">
                  {t(CATEGORY_KEYS[task.category] ?? "categoryGeneral")}
                </span>
                <button type="button" onClick={() => startEditing(task)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1" aria-label={t("editTask")}>
                  <Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" />
                </button>
                <button type="button" onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1" aria-label={t("deleteTask")}>
                  <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </button>
              </>
            )}
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {t("tasksEmpty")}
          </div>
        )}
      </div>
    </div>
  );
}
