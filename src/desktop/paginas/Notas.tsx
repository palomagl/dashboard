import { useState } from "react";
import { Check, Pencil, Plus, StickyNote, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/contexts/LocaleContext";
import { executar } from "@/lib/acoes";
import { notesApi } from "@/lib/db";
import { useNotas, type NotaAoVivo } from "@/lib/aoVivo";
import { cn } from "@/lib/utils";
import { Cabecalho, IconePagina } from "../Cabecalho";
import { BotaoIcone, Cartao, Esqueleto, Vazio } from "../ui";

// Mesmas cores de nota do celular (as classes ficam gravadas em cada nota).
const CORES = ["bg-widget-tasks/20", "bg-widget-habits/20", "bg-widget-goals/20", "bg-widget-notes/20"];
const BOLINHA: Record<string, string> = {
  "bg-widget-tasks/20": "bg-widget-tasks",
  "bg-widget-habits/20": "bg-widget-habits",
  "bg-widget-goals/20": "bg-widget-goals",
  "bg-widget-notes/20": "bg-widget-notes",
};

function Nota({ nota }: { nota: NotaAoVivo }) {
  const { t, locale } = useLocale();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(nota.content);

  const salvar = async () => {
    if (!texto.trim()) return;
    const ok = await executar(() => notesApi.update(nota.id, { content: texto.trim() }), { erro: t("erroAoSalvar") });
    if (ok !== null) setEditando(false);
  };
  const excluir = () => executar(() => notesApi.delete(nota.id), { erro: t("erroAoExcluir") });

  return (
    <article className={cn("group relative mb-4 break-inside-avoid rounded-[20px] p-5 animate-fade-in", nota.color)}>
      {editando ? (
        <div className="space-y-2">
          <Textarea
            autoFocus
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) salvar();
              if (e.key === "Escape") setEditando(false);
            }}
            className="min-h-[110px] resize-none rounded-xl bg-background/80"
          />
          <div className="flex justify-end gap-1">
            <BotaoIcone rotulo={t("cancel")} onClick={() => setEditando(false)}>
              <X className="h-4 w-4" />
            </BotaoIcone>
            <BotaoIcone rotulo={t("save")} onClick={salvar} className="text-primary">
              <Check className="h-4 w-4" />
            </BotaoIcone>
          </div>
        </div>
      ) : (
        <>
          <p className="whitespace-pre-wrap break-words pr-6 text-sm leading-relaxed">{nota.content}</p>
          {nota.criadaEm && (
            <p className="mt-3 text-[11px] text-foreground/50">
              {nota.criadaEm.toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", { day: "numeric", month: "short" })}
            </p>
          )}
          <div className="absolute right-3 top-3 flex gap-0.5 rounded-lg bg-background/80 p-0.5 opacity-0 shadow-sm transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            <BotaoIcone rotulo={t("notesEdit")} onClick={() => setEditando(true)} className="h-7 w-7">
              <Pencil className="h-3.5 w-3.5" />
            </BotaoIcone>
            <BotaoIcone rotulo={t("notesDelete")} onClick={excluir} className="h-7 w-7 hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </BotaoIcone>
          </div>
        </>
      )}
    </article>
  );
}

export default function NotasDesktop() {
  const { t } = useLocale();
  const { itens, pronto } = useNotas();
  const [texto, setTexto] = useState("");
  const [cor, setCor] = useState(CORES[0]);

  const adicionar = async () => {
    if (!texto.trim()) return;
    const ok = await executar(() => notesApi.create({ content: texto.trim(), color: cor }), { erro: t("erroAoAdicionar") });
    if (ok) setTexto("");
  };

  return (
    <>
      <Cabecalho
        icone={<IconePagina Icone={StickyNote} />}
        titulo={t("tabNotas")}
        subtitulo={`${itens.length} ${t("notesSubtitle")} · ${t("notasSubtitulo")}`}
      />

      <Cartao className="mb-6">
        <Textarea
          placeholder={t("notesPlaceholder")}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.ctrlKey || e.metaKey) && adicionar()}
          className="min-h-[88px] resize-none rounded-xl border-0 bg-secondary/60 text-[15px] focus-visible:ring-1"
        />
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-2" role="radiogroup" aria-label={t("cor")}>
            {CORES.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={cor === c}
                aria-label={c}
                onClick={() => setCor(c)}
                className={cn(
                  "h-6 w-6 rounded-full ring-offset-2 ring-offset-card transition-all",
                  BOLINHA[c],
                  cor === c ? "ring-2 ring-foreground/40" : "opacity-60 hover:opacity-100"
                )}
              />
            ))}
          </div>
          <span className="ml-auto hidden text-xs text-muted-foreground xl:inline">{t("atalhoSalvar")}</span>
          <Button onClick={adicionar} disabled={!texto.trim()} className="h-10 rounded-xl px-5">
            <Plus className="mr-1.5 h-4 w-4" /> {t("salvarNota")}
          </Button>
        </div>
      </Cartao>

      {!pronto ? (
        <Esqueleto linhas={3} />
      ) : itens.length === 0 ? (
        <Vazio className="min-h-[200px]">{t("notesEmpty")}</Vazio>
      ) : (
        <div className="columns-2 gap-4 xl:columns-3 2xl:columns-4">
          {itens.map((n) => (
            <Nota key={n.id} nota={n} />
          ))}
        </div>
      )}
    </>
  );
}
