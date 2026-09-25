import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CircleCheck,
  Eye,
  FileText,
  Home,
  LineChart,
  Moon,
  Receipt,
  StickyNote,
  Target,
  User,
  Wallet,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useLocale } from "@/contexts/LocaleContext";
import { useTema } from "@/hooks/useTema";
import { useContas, useHabitos, useMetas, useNotas, useTarefas, useTransacoes } from "@/lib/aoVivo";
import { ICONES_HABITO } from "./categorias";
import { diaMes } from "./formato";
import { useDinheiro, useValores } from "./valores";

// A busca do cabeçalho: procura em tudo (páginas, tarefas, transações,
// notas, metas, hábitos e contas) e leva direto para a página certa.
// Abre com Ctrl+K (⌘K no Mac) ou "/".

const Contexto = createContext<{ abrir: () => void }>({ abrir: () => {} });

export function useBusca() {
  return useContext(Contexto);
}

export function BuscaProvider({ children }: { children: ReactNode }) {
  const [aberta, setAberta] = useState(false);
  const abrir = useCallback(() => setAberta(true), []);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      const digitando = alvo && (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.isContentEditable);
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setAberta((a) => !a);
      } else if (e.key === "/" && !digitando) {
        e.preventDefault();
        setAberta(true);
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  const valor = useMemo(() => ({ abrir }), [abrir]);

  return (
    <Contexto.Provider value={valor}>
      {children}
      <BuscaDialog aberta={aberta} onMudar={setAberta} />
    </Contexto.Provider>
  );
}

function BuscaDialog({ aberta, onMudar }: { aberta: boolean; onMudar: (v: boolean) => void }) {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const { alternar: alternarTema, escuro } = useTema();
  const { alternar: alternarValores, ocultos } = useValores();
  const dinheiro = useDinheiro();
  const tarefas = useTarefas().itens;
  const transacoes = useTransacoes().itens;
  const notas = useNotas().itens;
  const metas = useMetas().itens;
  const habitos = useHabitos().itens;
  const contas = useContas().itens;

  const ir = (rota: string) => {
    onMudar(false);
    navigate(rota);
  };
  const fazer = (acao: () => void) => {
    onMudar(false);
    acao();
  };

  const paginas = [
    { rota: "/", rotulo: t("navInicio"), Icone: Home },
    { rota: "/financas", rotulo: t("tabFinancas"), Icone: LineChart },
    { rota: "/rotina", rotulo: t("navRotina"), Icone: CalendarDays },
    { rota: "/notas", rotulo: t("tabNotas"), Icone: FileText },
    { rota: "/account", rotulo: t("accountTitle"), Icone: User },
  ];

  return (
    <Dialog open={aberta} onOpenChange={onMudar}>
      <DialogContent className="max-w-xl overflow-hidden rounded-2xl p-0 shadow-2xl">
        <DialogTitle className="sr-only">{t("search")}</DialogTitle>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:rounded-lg [&_[cmdk-item][data-selected='true']]:bg-secondary [&_[cmdk-item][data-selected='true']]:text-foreground [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4">
      <CommandInput placeholder={t("buscaPlaceholder")} />
      <CommandList className="max-h-[420px]">
        <CommandEmpty>{t("buscaNada")}</CommandEmpty>

        <CommandGroup heading={t("buscaPaginas")}>
          {paginas.map((p) => (
            <CommandItem key={p.rota} value={`pagina ${p.rotulo}`} onSelect={() => ir(p.rota)}>
              <p.Icone className="mr-2 text-muted-foreground" />
              {p.rotulo}
            </CommandItem>
          ))}
          <CommandItem value={`acao ${escuro ? t("themeLight") : t("themeDark")}`} onSelect={() => fazer(alternarTema)}>
            <Moon className="mr-2 text-muted-foreground" />
            {escuro ? t("themeLight") : t("themeDark")}
          </CommandItem>
          <CommandItem value={`acao ${ocultos ? t("valoresMostrar") : t("valoresOcultar")}`} onSelect={() => fazer(alternarValores)}>
            <Eye className="mr-2 text-muted-foreground" />
            {ocultos ? t("valoresMostrar") : t("valoresOcultar")}
          </CommandItem>
        </CommandGroup>

        {tarefas.length > 0 && (
          <CommandGroup heading={t("tasksTitle")}>
            {tarefas.map((x) => (
              <CommandItem key={x.id} value={`tarefa ${x.title} ${x.id}`} onSelect={() => ir("/rotina")}>
                <CircleCheck className={`mr-2 ${x.completed ? "text-primary" : "text-muted-foreground"}`} />
                <span className={x.completed ? "text-muted-foreground line-through" : ""}>{x.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {habitos.length > 0 && (
          <CommandGroup heading={t("habitsTitle")}>
            {habitos.map((h) => {
              const Icone = ICONES_HABITO[h.icon] ?? ICONES_HABITO.Leaf;
              return (
                <CommandItem key={h.id} value={`habito ${h.name} ${h.id}`} onSelect={() => ir("/rotina")}>
                  <Icone className="mr-2 text-muted-foreground" />
                  {h.name}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {transacoes.length > 0 && (
          <CommandGroup heading={t("financesTransactions")}>
            {transacoes.slice(0, 200).map((x) => (
              <CommandItem
                key={x.id}
                value={`transacao ${x.description} ${x.category ?? ""} ${x.id}`}
                onSelect={() => ir("/financas")}
              >
                <Wallet className="mr-2 text-muted-foreground" />
                <span className="flex-1 truncate">{x.description}</span>
                <span className="ml-3 text-xs text-muted-foreground">
                  {diaMes(x.date, locale)} · {dinheiro(x.type === "income" ? x.amount : -x.amount, { centavos: true, sinal: true })}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {contas.length > 0 && (
          <CommandGroup heading={t("financesBills")}>
            {contas.map((c) => (
              <CommandItem key={c.id} value={`conta ${c.name} ${c.category} ${c.id}`} onSelect={() => ir("/financas")}>
                <Receipt className="mr-2 text-muted-foreground" />
                <span className="flex-1 truncate">{c.name}</span>
                <span className="ml-3 text-xs text-muted-foreground">
                  {t("financesDay")} {c.dueDate} · {dinheiro(c.amount, { centavos: true })}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {metas.length > 0 && (
          <CommandGroup heading={t("metasTitulo")}>
            {metas.map((m) => (
              <CommandItem key={m.id} value={`meta ${m.title} ${m.id}`} onSelect={() => ir("/financas")}>
                <Target className="mr-2 text-muted-foreground" />
                <span className="flex-1 truncate">{m.title}</span>
                <span className="ml-3 text-xs text-muted-foreground">{m.progress}%</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {notas.length > 0 && (
          <CommandGroup heading={t("tabNotas")}>
            {notas.map((n) => (
              <CommandItem key={n.id} value={`nota ${n.content} ${n.id}`} onSelect={() => ir("/notas")}>
                <StickyNote className="mr-2 text-muted-foreground" />
                <span className="truncate">{n.content}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
