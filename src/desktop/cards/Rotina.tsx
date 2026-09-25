import { useMemo, useState } from "react";
import { ArrowRight, Check, Flame, Pencil, Plus, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocale } from "@/contexts/LocaleContext";
import { executar } from "@/lib/acoes";
import { habitsApi, tasksApi, type Task } from "@/lib/db";
import { useHabitos, useTarefas, type HabitoAoVivo } from "@/lib/aoVivo";
import { cn } from "@/lib/utils";
import {
  CATEGORIAS_TAREFA,
  ETIQUETA_TAREFA,
  ICONES_HABITO,
  OPCOES_ICONE_HABITO,
  ROTULO_TAREFA,
  useCores,
} from "../categorias";
import { Confirmar } from "../Formularios";
import { Barra, BotaoIcone, Cartao, CartaoTopo, Esqueleto, LinkVerTodas, Vazio } from "../ui";

// ==============================================
// Tarefas de hoje
// ==============================================

function Marcador({ feito }: { feito: boolean }) {
  return (
    <span
      className={cn(
        "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-2 transition-colors",
        feito ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/35 group-hover/marcar:border-primary"
      )}
    >
      {feito && <Check className="h-3 w-3" strokeWidth={3.5} />}
    </span>
  );
}

function SeletorCategoria({ valor, onChange, className }: { valor: string; onChange: (v: string) => void; className?: string }) {
  const { t } = useLocale();
  return (
    <Select value={valor} onValueChange={onChange}>
      <SelectTrigger className={cn("h-9 w-[130px] rounded-lg bg-background", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CATEGORIAS_TAREFA.map((c) => (
          <SelectItem key={c} value={c}>
            {t(ROTULO_TAREFA[c])}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function LinhaTarefa({ tarefa }: { tarefa: Task }) {
  const { t } = useLocale();
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(tarefa.title);
  const [categoria, setCategoria] = useState(tarefa.category);

  const alternar = () =>
    executar(() => tasksApi.update(tarefa.id, { completed: !tarefa.completed }), { erro: t("erroAoSalvar") });
  const excluir = () => executar(() => tasksApi.delete(tarefa.id), { erro: t("erroAoExcluir") });
  const salvar = async () => {
    if (!titulo.trim()) return;
    const ok = await executar(() => tasksApi.update(tarefa.id, { title: titulo.trim(), category: categoria }), {
      erro: t("erroAoSalvar"),
    });
    if (ok !== null) setEditando(false);
  };

  if (editando) {
    return (
      <li className="flex items-center gap-2 rounded-xl bg-secondary/70 p-2">
        <Input
          autoFocus
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") salvar();
            if (e.key === "Escape") setEditando(false);
          }}
          className="h-9 flex-1 rounded-lg bg-background"
        />
        <SeletorCategoria valor={categoria} onChange={setCategoria} />
        <BotaoIcone rotulo={t("save")} onClick={salvar} className="text-primary">
          <Check className="h-4 w-4" />
        </BotaoIcone>
        <BotaoIcone rotulo={t("cancel")} onClick={() => setEditando(false)}>
          <X className="h-4 w-4" />
        </BotaoIcone>
      </li>
    );
  }

  return (
    <li className="group flex min-h-[46px] items-center gap-3 rounded-xl px-1.5 transition-colors hover:bg-secondary/60">
      <button
        type="button"
        onClick={alternar}
        className="group/marcar flex min-w-0 flex-1 items-center gap-3 py-2.5 text-left"
        aria-label={tarefa.completed ? t("uncompleteTask") : t("completeTask")}
      >
        <Marcador feito={tarefa.completed} />
        <span className={cn("truncate text-sm", tarefa.completed && "text-muted-foreground line-through")}>{tarefa.title}</span>
      </button>
      <span
        className={cn(
          "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold",
          ETIQUETA_TAREFA[tarefa.category] ?? ETIQUETA_TAREFA.Geral
        )}
      >
        {t(ROTULO_TAREFA[tarefa.category] ?? "categoryGeneral")}
      </span>
      <div className="flex w-0 overflow-hidden opacity-0 transition-all group-focus-within:w-[68px] group-focus-within:opacity-100 group-hover:w-[68px] group-hover:opacity-100">
        <BotaoIcone rotulo={t("editTask")} onClick={() => setEditando(true)}>
          <Pencil className="h-3.5 w-3.5" />
        </BotaoIcone>
        <BotaoIcone rotulo={t("deleteTask")} onClick={excluir} className="hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </BotaoIcone>
      </div>
    </li>
  );
}

export function TarefasCard({
  limite,
  comFiltros = false,
  className,
}: {
  /** Início mostra poucas e manda para Rotina; em Rotina, todas. */
  limite?: number;
  /** Chips por área (o antigo "Áreas da rotina"), filtrando a lista. */
  comFiltros?: boolean;
  className?: string;
}) {
  const { t } = useLocale();
  const cores = useCores();
  const { itens, pronto } = useTarefas();
  const [adicionando, setAdicionando] = useState(false);
  const [nova, setNova] = useState("");
  const [categoria, setCategoria] = useState("Geral");
  const [filtro, setFiltro] = useState<string | null>(null);

  const feitas = itens.filter((x) => x.completed).length;
  const pct = itens.length > 0 ? (feitas / itens.length) * 100 : 0;

  const porArea = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const x of itens) {
      const c = (CATEGORIAS_TAREFA as readonly string[]).includes(x.category) ? x.category : "Geral";
      contagem.set(c, (contagem.get(c) ?? 0) + 1);
    }
    return CATEGORIAS_TAREFA.filter((c) => contagem.has(c)).map((c) => ({ c, n: contagem.get(c)! }));
  }, [itens]);

  // Pendentes primeiro; dentro de cada grupo, a ordem de criação (mais nova em cima).
  const ordenadas = useMemo(() => {
    const lista = filtro ? itens.filter((x) => (x.category || "Geral") === filtro) : itens;
    return [...lista.filter((x) => !x.completed), ...lista.filter((x) => x.completed)];
  }, [itens, filtro]);
  const visiveis = limite ? ordenadas.slice(0, limite) : ordenadas;

  const adicionar = async () => {
    if (!nova.trim()) return;
    const ok = await executar(() => tasksApi.create({ title: nova.trim(), completed: false, category: categoria }), {
      erro: t("erroAoAdicionar"),
    });
    if (ok) {
      setNova("");
      setCategoria("Geral");
      setAdicionando(false);
    }
  };

  return (
    <Cartao className={cn("flex flex-col", className)}>
      <CartaoTopo
        ponto={cores.serie("tarefas")}
        titulo={t("tasksTitle")}
        subtitulo={`${feitas} ${t("tasksOf")} ${itens.length} ${t("tasksCompletedOf")}`}
        acao={
          <BotaoIcone rotulo={adicionando ? t("close") : t("novaTarefa")} onClick={() => setAdicionando((v) => !v)}>
            {adicionando ? <X className="h-4 w-4" /> : <Plus className="h-[18px] w-[18px]" />}
          </BotaoIcone>
        }
      />
      <Barra pct={pct} cor={cores.serie("tarefas")} className="mb-4" />

      {comFiltros && porArea.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label={t("routineAreas")}>
          <Chip ativo={filtro === null} onClick={() => setFiltro(null)}>
            {t("filtroTodas")} <span className="opacity-60">{itens.length}</span>
          </Chip>
          {porArea.map(({ c, n }) => (
            <Chip key={c} ativo={filtro === c} onClick={() => setFiltro(filtro === c ? null : c)}>
              {t(ROTULO_TAREFA[c])} <span className="opacity-60">{n}</span>
            </Chip>
          ))}
        </div>
      )}

      {adicionando && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-secondary/70 p-2 animate-fade-in">
          <Input
            autoFocus
            placeholder={t("tasksPlaceholder")}
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") adicionar();
              if (e.key === "Escape") setAdicionando(false);
            }}
            className="h-9 flex-1 rounded-lg bg-background"
          />
          <SeletorCategoria valor={categoria} onChange={setCategoria} />
          <Button size="sm" className="h-9 rounded-lg" onClick={adicionar} disabled={!nova.trim()}>
            {t("tasksAdd")}
          </Button>
        </div>
      )}

      {!pronto ? (
        <Esqueleto linhas={3} />
      ) : visiveis.length === 0 ? (
        <Vazio>{t("tasksEmpty")}</Vazio>
      ) : (
        <ul className={cn("-mx-1.5 divide-y divide-border/60", !limite && "max-h-[400px] overflow-y-auto pr-1")}>
          {visiveis.map((x) => (
            <LinhaTarefa key={x.id} tarefa={x} />
          ))}
        </ul>
      )}

      {limite && ordenadas.length > limite && (
        <div className="mt-auto flex justify-end pt-3">
          <LinkVerTodas para="/rotina">
            {t("verTodasN").replace("{n}", String(ordenadas.length))} <ArrowRight className="h-3.5 w-3.5" />
          </LinkVerTodas>
        </div>
      )}
    </Cartao>
  );
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        ativo
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border/80 text-muted-foreground hover:border-primary/30 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

// ==============================================
// Hábitos diários
// ==============================================

function Habito({ habito, onExcluir }: { habito: HabitoAoVivo; onExcluir: () => void }) {
  const { t } = useLocale();
  const cores = useCores();
  const Icone = ICONES_HABITO[habito.icon] ?? ICONES_HABITO.Leaf;
  const roxo = cores.serie("habitos");
  const alternar = () => executar(() => habitsApi.toggle(habito.id), { erro: t("erroAoSalvar") });

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={alternar}
        aria-pressed={habito.completed}
        className={cn(
          "flex h-full min-h-[92px] w-full flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-3 text-center ring-1 transition-all",
          habito.completed ? "ring-transparent" : "bg-secondary/70 ring-transparent hover:bg-secondary hover:ring-border"
        )}
        style={
          habito.completed
            ? {
                backgroundColor: `color-mix(in srgb, ${roxo} 11%, transparent)`,
                boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${roxo} 45%, transparent)`,
              }
            : undefined
        }
      >
        <Icone className="h-5 w-5" style={{ color: habito.completed ? roxo : undefined }} />
        <span className="line-clamp-2 text-xs font-medium leading-snug">{habito.name}</span>
        <span className="flex items-center gap-0.5 text-[11px] tabular-nums text-muted-foreground">
          <Flame className={cn("h-3 w-3", habito.sequenciaViva > 0 ? "text-orange-500" : "text-muted-foreground/60")} />
          {habito.sequenciaViva}
        </span>
      </button>
      {habito.completed && (
        <span
          className="pointer-events-none absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full text-white"
          style={{ backgroundColor: roxo }}
        >
          <Check className="h-2.5 w-2.5" strokeWidth={4} />
        </span>
      )}
      <button
        type="button"
        onClick={onExcluir}
        aria-label={`${t("delete")}: ${habito.name}`}
        title={t("delete")}
        className="absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function HabitosCard({ limite, className }: { limite?: number; className?: string }) {
  const { t } = useLocale();
  const cores = useCores();
  const { itens, pronto } = useHabitos();
  const [adicionando, setAdicionando] = useState(false);
  const [nome, setNome] = useState("");
  const [icone, setIcone] = useState("Leaf");
  const [excluir, setExcluir] = useState<HabitoAoVivo | null>(null);

  const feitos = itens.filter((h) => h.completed).length;
  const visiveis = limite ? itens.slice(0, limite) : itens;

  const adicionar = async () => {
    if (!nome.trim()) return;
    const ok = await executar(() => habitsApi.create({ name: nome.trim(), icon: icone, completed: false, streak: 0 }), {
      erro: t("erroAoAdicionar"),
    });
    if (ok) {
      setNome("");
      setIcone("Leaf");
      setAdicionando(false);
    }
  };

  return (
    <Cartao className={cn("flex flex-col", className)}>
      <CartaoTopo
        ponto={cores.serie("habitos")}
        titulo={t("habitsTitle")}
        subtitulo={`${feitos} ${t("tasksOf")} ${itens.length} ${t("habitsTodayCount")}`}
        acao={
          <BotaoIcone rotulo={adicionando ? t("close") : t("habitsAdd")} onClick={() => setAdicionando((v) => !v)}>
            {adicionando ? <X className="h-4 w-4" /> : <Plus className="h-[18px] w-[18px]" />}
          </BotaoIcone>
        }
      />

      {adicionando && (
        <div className="mb-3 space-y-2 rounded-xl bg-secondary/70 p-2 animate-fade-in">
          <div className="flex gap-2">
            <Input
              autoFocus
              placeholder={t("habitsPlaceholder")}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") adicionar();
                if (e.key === "Escape") setAdicionando(false);
              }}
              className="h-9 flex-1 rounded-lg bg-background"
            />
            <Button size="sm" className="h-9 rounded-lg" onClick={adicionar} disabled={!nome.trim()}>
              {t("add")}
            </Button>
          </div>
          <div className="flex gap-1.5" role="radiogroup" aria-label={t("icone")}>
            {OPCOES_ICONE_HABITO.map((chave) => {
              const I = ICONES_HABITO[chave];
              return (
                <button
                  key={chave}
                  type="button"
                  role="radio"
                  aria-checked={icone === chave}
                  aria-label={chave}
                  onClick={() => setIcone(chave)}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg transition-colors",
                    icone === chave ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  <I className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!pronto ? (
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[92px] animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : itens.length === 0 ? (
        <Vazio>{t("habitsEmpty")}</Vazio>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {visiveis.map((h) => (
            <Habito key={h.id} habito={h} onExcluir={() => setExcluir(h)} />
          ))}
        </div>
      )}

      {limite && itens.length > limite && (
        <div className="mt-auto flex justify-end pt-3">
          <LinkVerTodas para="/rotina">
            {t("verTodasN").replace("{n}", String(itens.length))} <ArrowRight className="h-3.5 w-3.5" />
          </LinkVerTodas>
        </div>
      )}

      <Confirmar
        aberto={!!excluir}
        titulo={t("excluirHabitoTitulo").replace("{nome}", excluir?.name ?? "")}
        descricao={t("excluirHabitoTexto")}
        onFechar={() => setExcluir(null)}
        onConfirmar={() => excluir && executar(() => habitsApi.delete(excluir.id), { erro: t("erroAoExcluir") })}
      />
    </Cartao>
  );
}
