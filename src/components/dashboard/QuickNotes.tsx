import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { notesApi, Note } from "@/lib/db";
import { executar, carregar } from "@/lib/acoes";
import { useLocale } from "@/contexts/LocaleContext";

const colors = [
  "bg-widget-tasks/20",
  "bg-widget-habits/20", 
  "bg-widget-goals/20",
  "bg-widget-notes/20",
];

export function QuickNotes() {
  const { t } = useLocale();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  useEffect(() => {
    carregar(() => notesApi.list(), "notas").then((lista) => lista && setNotes(lista));
  }, []);

  const addNote = async () => {
    if (!newNote.trim()) return;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const note = await executar(
      () => notesApi.create({ content: newNote.trim(), color }),
      { erro: t("erroAoAdicionar") }
    );
    if (!note) return;
    setNotes([note, ...notes]);
    setNewNote("");
  };

  const deleteNote = async (id: string) => {
    const feito = await executar(() => notesApi.delete(id), { erro: t("erroAoExcluir") });
    if (feito === null) return;
    setNotes(notes.filter(n => n.id !== id));
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditingContent(note.content);
  };

  const saveEdit = async () => {
    if (!editingContent.trim() || !editingId) return;
    const salvo = await executar(
      () => notesApi.update(editingId, { content: editingContent.trim() }),
      { erro: t("erroAoSalvar") }
    );
    if (salvo === null) return;
    setNotes(notes.map(n => n.id === editingId ? { ...n, content: editingContent.trim() } : n));
    setEditingId(null);
    setEditingContent("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent("");
  };

  return (
    <div className="glass-card glass-card-hover rounded-xl p-5 animate-fade-in" style={{ animationDelay: "250ms" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-widget-notes" />
            {t("notesTitle")}
          </h3>
          <p className="text-sm text-muted-foreground">{notes.length} {t("notesSubtitle")}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Textarea
          placeholder={t("notesPlaceholder")}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="bg-secondary/50 border-border/50 min-h-[60px] resize-none"
        />
        <Button onClick={addNote} size="icon" className="shrink-0 h-auto bg-widget-notes hover:bg-widget-notes/90">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
        {notes.map((note) => (
          <div key={note.id} className={`p-3 rounded-lg ${note.color} group relative`}>
            {editingId === note.id ? (
              <div className="flex gap-2">
                <Textarea value={editingContent} onChange={(e) => setEditingContent(e.target.value)} className="bg-background/50 border-border/50 min-h-[60px] resize-none flex-1" autoFocus />
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={saveEdit} className="p-1" aria-label={t("save")}><Check className="w-4 h-4 text-emerald-500" /></button>
                  <button type="button" onClick={cancelEdit} className="p-1" aria-label={t("cancel")}><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm pr-12">{note.content}</p>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => startEditing(note)} aria-label={t("notesEdit")}><Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" /></button>
                  <button type="button" onClick={() => deleteNote(note.id)} aria-label={t("notesDelete")}><Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" /></button>
                </div>
              </>
            )}
          </div>
        ))}
        {notes.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            {t("notesEmpty")}
          </div>
        )}
      </div>
    </div>
  );
}
