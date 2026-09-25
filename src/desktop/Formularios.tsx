import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CreditCard, Layers, Plus, Receipt, Repeat, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocale } from "@/contexts/LocaleContext";
import { executar } from "@/lib/acoes";
import { dayKey } from "@/lib/dates";
import {
  billsApi,
  CATEGORIAS_TRANSACAO,
  goalsApi,
  transactionsApi,
  type Bill,
  type CategoriaTransacao,
  type Goal,
  type Transaction,
} from "@/lib/db";
import { cn } from "@/lib/utils";
import { lerValor } from "./calculos";
import { CATEGORIAS_CONTA, normalizarCategoria } from "./categorias";

function valorParaTexto(v: number | undefined) {
  if (v === undefined) return "";
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function Campo({ rotulo, children, className }: { rotulo: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-semibold text-muted-foreground">{rotulo}</span>
      {children}
    </label>
  );
}

const campo = "h-11 rounded-xl bg-background";

function Janela({
  aberto,
  onFechar,
  titulo,
  descricao,
  children,
  onSalvar,
  salvando,
  podeSalvar,
  rodapeExtra,
  largura = "max-w-md",
}: {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
  onSalvar: () => void;
  salvando: boolean;
  podeSalvar: boolean;
  /** Fica à esquerda, antes de Cancelar/Salvar. */
  rodapeExtra?: ReactNode;
  largura?: string;
}) {
  const { t } = useLocale();
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (podeSalvar && !salvando) onSalvar();
  };
  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className={cn(largura, "max-h-[92vh] overflow-y-auto rounded-3xl")}>
        <form onSubmit={enviar} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
            {descricao && <DialogDescription>{descricao}</DialogDescription>}
          </DialogHeader>
          <div className="space-y-4">{children}</div>
          <DialogFooter className="gap-2 sm:gap-0">
            {rodapeExtra && <div className="flex items-center sm:mr-auto">{rodapeExtra}</div>}
            <Button type="button" variant="ghost" className="rounded-xl" onClick={onFechar}>
              {t("cancel")}
            </Button>
            <Button type="submit" className="rounded-xl" disabled={!podeSalvar || salvando}>
              {salvando ? "..." : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------
// Transação
// ----------------------------------------------

export function TransacaoDialog({
  aberto,
  onFechar,
  inicial,
  tipoInicial = "expense",
}: {
  aberto: boolean;
  onFechar: () => void;
  inicial?: Transaction;
  /** Para os atalhos "Gasto" e "Entrada". */
  tipoInicial?: Transaction["type"];
}) {
  const { t } = useLocale();
  const [tipo, setTipo] = useState<Transaction["type"]>("expense");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState<CategoriaTransacao>("Outros");
  const [data, setData] = useState(dayKey());
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setTipo(inicial?.type ?? tipoInicial);
    setDescricao(inicial?.description ?? "");
    setValor(valorParaTexto(inicial?.amount));
    setCategoria(normalizarCategoria(inicial?.category));
    setData(inicial?.date || dayKey());
  }, [aberto, inicial, tipoInicial]);

  const numero = lerValor(valor);
  const podeSalvar = descricao.trim().length > 0 && numero > 0 && !!data;

  const salvar = async () => {
    setSalvando(true);
    const dados = { description: descricao.trim(), amount: numero, type: tipo, category: categoria, date: data };
    const ok = await executar(
      async () => {
        if (inicial) await transactionsApi.update(inicial.id, dados);
        else await transactionsApi.create(dados);
      },
      { erro: inicial ? t("erroAoSalvar") : t("erroAoAdicionar") }
    );
    setSalvando(false);
    if (ok !== null) onFechar();
  };

  return (
    <Janela
      aberto={aberto}
      onFechar={onFechar}
      titulo={inicial ? t("financesEditTransaction") : t("financesNewTransaction")}
      onSalvar={salvar}
      salvando={salvando}
      podeSalvar={podeSalvar}
    >
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1" role="radiogroup" aria-label={t("tipo")}>
        {(["expense", "income"] as const).map((op) => (
          <button
            key={op}
            type="button"
            role="radio"
            aria-checked={tipo === op}
            onClick={() => setTipo(op)}
            className={cn(
              "rounded-lg py-2 text-sm font-semibold transition-colors",
              tipo === op ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {op === "expense" ? t("gasto") : t("entrada")}
          </button>
        ))}
      </div>
      <Campo rotulo={t("financesDescription")}>
        <Input autoFocus value={descricao} onChange={(e) => setDescricao(e.target.value)} className={campo} placeholder={t("exDescricao")} />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo={t("financesAmount")}>
          <Input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} className={campo} placeholder="0,00" />
        </Campo>
        <Campo rotulo={t("data")}>
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className={campo} />
        </Campo>
      </div>
      <Campo rotulo={t("financeCategoryField")}>
        <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaTransacao)}>
          <SelectTrigger className={campo}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIAS_TRANSACAO.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Campo>
    </Janela>
  );
}

// ----------------------------------------------
// Conta
// ----------------------------------------------

type ComoPaga = "avulsa" | "parcela" | "fixa" | "cartao";

const ATALHOS_VEZES: Record<"parcela" | "fixa", number[]> = {
  parcela: [2, 3, 4, 5, 6, 10, 12],
  fixa: [3, 6, 12, 24],
};

function dataCurta(chave: string) {
  return `${chave.slice(8)}/${chave.slice(5, 7)}/${chave.slice(0, 4)}`;
}

export function ContaDialog({ aberto, onFechar, inicial }: { aberto: boolean; onFechar: () => void; inicial?: Bill }) {
  const { t } = useLocale();
  const todas = useContas().itens;
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState(dayKey());
  const [tipo, setTipo] = useState<ComoPaga>("avulsa");
  // null = o padrão do tipo (3 parcelas, 12 meses) até a pessoa mexer.
  const [vezes, setVezes] = useState<string | null>(null);
  const [valorTotal, setValorTotal] = useState(false);
  const [jaPaguei, setJaPaguei] = useState(false);
  const [primeira, setPrimeira] = useState("2");
  const [categoria, setCategoria] = useState("Compras");
  const [tipoTocado, setTipoTocado] = useState(false);
  const [categoriaTocada, setCategoriaTocada] = useState(false);
  const [nasProximas, setNasProximas] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setNome(inicial?.name ?? "");
    setValor(valorParaTexto(inicial?.amount));
    setVencimento(inicial ? vencimentoDe(inicial) : dayKey());
    setTipo(inicial?.tipo ?? "avulsa");
    setVezes(null);
    setValorTotal(false);
    setJaPaguei(false);
    setPrimeira("2");
    setCategoria(inicial?.category ?? "Compras");
    setTipoTocado(!!inicial);
    setCategoriaTocada(!!inicial);
    setNasProximas(true);
  }, [aberto, inicial]);

  // Enquanto a pessoa não escolheu, o nome sugere tipo e categoria
  // ("Internet" -> todo mês/Serviços, "Cartão Vó" -> cartão).
  useEffect(() => {
    if (inicial || !nome.trim()) return;
    const palpite = classificar(nome);
    if (!categoriaTocada) setCategoria(palpite.categoria);
    if (!tipoTocado) setTipo(palpite.tipo);
  }, [nome, inicial, categoriaTocada, tipoTocado]);

  const numero = lerValor(valor);
  const vezesTexto = vezes ?? (tipo === "fixa" ? "12" : "3");
  const n = parseInt(vezesTexto, 10);
  const repete = !inicial && (tipo === "parcela" || tipo === "fixa");
  const nValido = !repete || (n >= 2 && n <= 120);
  const inicio = repete && tipo === "parcela" && jaPaguei ? parseInt(primeira, 10) : 1;
  const inicioValido = !repete || (inicio >= 1 && inicio <= n);
  const podeSalvar = nome.trim().length > 0 && numero > 0 && !!vencimento && nValido && inicioValido;

  const proximas = useMemo(() => (inicial?.parcela ? proximasParcelas(inicial, todas) : []), [inicial, todas]);

  // O que vai ser criado, para mostrar antes de salvar.
  const previa = useMemo(() => {
    if (!repete || !podeSalvar) return null;
    return gerarRepeticoes(
      { nome: nome.trim(), valor: numero, vencimento, categoria, tipo },
      n,
      { primeira: inicio, valorTotal: tipo === "parcela" && valorTotal }
    );
  }, [repete, podeSalvar, nome, numero, vencimento, categoria, tipo, n, inicio, valorTotal]);

  const categorias = CATEGORIAS_CONTA.includes(categoria) ? CATEGORIAS_CONTA : [...CATEGORIAS_CONTA, categoria];

  const salvar = async () => {
    setSalvando(true);
    const ok = await executar(
      async () => {
        if (inicial) {
          const mudancas = { name: nome.trim(), amount: numero, category: categoria, tipo };
          await billsApi.update(inicial.id, { ...mudancas, vencimento, dueDate: String(Number(vencimento.slice(8))) });
          if (nasProximas) await Promise.all(proximas.map((c) => billsApi.update(c.id, mudancas)));
          return;
        }
        const contas = previa ?? gerarRepeticoes({ nome: nome.trim(), valor: numero, vencimento, categoria, tipo }, 1);
        await Promise.all(contas.map((c) => billsApi.create(c)));
      },
      { erro: inicial ? t("erroAoSalvar") : t("erroAoAdicionar") }
    );
    setSalvando(false);
    if (ok !== null) onFechar();
  };

  const opcoes: { valor: ComoPaga; Icone: typeof Receipt; rotulo: string; dica: string }[] = [
    { valor: "avulsa", Icone: Receipt, rotulo: t("comoUmaVez"), dica: t("comoUmaVezDica") },
    { valor: "parcela", Icone: Layers, rotulo: t("comoParcelada"), dica: t("comoParceladaDica") },
    { valor: "fixa", Icone: Repeat, rotulo: t("comoTodoMes"), dica: t("comoTodoMesDica") },
    { valor: "cartao", Icone: CreditCard, rotulo: t("comoCartao"), dica: t("comoCartaoDica") },
  ];

  const rotuloValor = inicial?.parcela
    ? t("valorDaParcela")
    : tipo === "fixa" && repete
      ? t("valorPorMes")
      : tipo === "parcela" && repete
        ? valorTotal
          ? t("valorTotalCompra")
          : t("valorDaParcela")
        : t("financesAmount");

  const rotuloVencimento = !repete ? t("vencimento") : inicio > 1 ? t("proximaVenceEm") : t("primeiroVencimento");

  return (
    <Janela
      aberto={aberto}
      onFechar={onFechar}
      titulo={inicial ? t("financesEditBill") : t("financesNewBill")}
      descricao={inicial?.parcela ? `${t("tipoParcela")} ${inicial.parcela}` : undefined}
      onSalvar={salvar}
      salvando={salvando}
      podeSalvar={podeSalvar}
      largura="max-w-lg"
    >
      <Campo rotulo={t("financesBillName")}>
        <Input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} className={campo} placeholder={t("exConta")} />
      </Campo>

      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-muted-foreground">{t("comoEConta")}</span>
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={t("comoEConta")}>
          {opcoes.map(({ valor: v, Icone, rotulo, dica }) => {
            const ativo = tipo === v;
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => {
                  setTipo(v);
                  setTipoTocado(true);
                }}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl border px-1.5 pb-2 pt-2.5 text-center transition-colors",
                  ativo
                    ? "border-primary bg-primary/[0.07] text-foreground ring-1 ring-primary"
                    : "border-border/80 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                <Icone className={cn("h-5 w-5", ativo && "text-primary")} />
                <span className="text-[13px] font-semibold leading-tight">{rotulo}</span>
                <span className="text-[10.5px] leading-tight text-muted-foreground">{dica}</span>
              </button>
            );
          })}
        </div>
      </div>

      {repete && (
        <div className="space-y-2 rounded-2xl bg-secondary/60 p-3">
          <span className="text-xs font-semibold text-muted-foreground">
            {tipo === "parcela" ? t("emQuantasVezes") : t("quantosMeses")}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {ATALHOS_VEZES[tipo as "parcela" | "fixa"].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setVezes(String(q))}
                aria-pressed={n === q}
                className={cn(
                  "h-9 min-w-[44px] rounded-xl px-2.5 text-sm font-semibold tabular-nums transition-colors",
                  n === q ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-card/70"
                )}
              >
                {tipo === "parcela" ? `${q}x` : q}
              </button>
            ))}
            <Input
              type="number"
              min={2}
              max={120}
              value={vezesTexto}
              onChange={(e) => setVezes(e.target.value)}
              aria-label={tipo === "parcela" ? t("emQuantasVezes") : t("quantosMeses")}
              className="h-9 w-[72px] rounded-xl bg-card text-center tabular-nums"
            />
          </div>
          {tipo === "parcela" && (
            <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm">
              <input
                type="checkbox"
                checked={jaPaguei}
                onChange={(e) => setJaPaguei(e.target.checked)}
                className="h-4 w-4 accent-[hsl(var(--primary))]"
              />
              {t("jaPagueiAlgumas")}
              {jaPaguei && (
                <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                  {t("proximaParcela")}
                  <Input
                    type="number"
                    min={2}
                    max={n || 120}
                    value={primeira}
                    onChange={(e) => setPrimeira(e.target.value)}
                    aria-label={t("proximaParcela")}
                    className="h-8 w-14 rounded-lg bg-card text-center tabular-nums"
                  />
                  {t("deN").replace("{n}", Number.isFinite(n) ? String(n) : "?")}
                </span>
              )}
            </label>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Campo rotulo={rotuloValor}>
            <Input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} className={campo} placeholder="0,00" />
          </Campo>
          {repete && tipo === "parcela" && (
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-0.5 text-[11px] font-semibold" role="radiogroup" aria-label={t("financesAmount")}>
              {[false, true].map((total) => (
                <button
                  key={String(total)}
                  type="button"
                  role="radio"
                  aria-checked={valorTotal === total}
                  onClick={() => setValorTotal(total)}
                  className={cn(
                    "rounded-md py-1 transition-colors",
                    valorTotal === total ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {total ? t("valorEhTotal") : t("valorEhParcela")}
                </button>
              ))}
            </div>
          )}
        </div>
        <Campo rotulo={rotuloVencimento}>
          <Input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} className={campo} />
        </Campo>
      </div>

      <Campo rotulo={t("financeCategoryField")}>
        <Select
          value={categoria}
          onValueChange={(v) => {
            setCategoria(v);
            setCategoriaTocada(true);
          }}
        >
          <SelectTrigger className={campo}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categorias.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Campo>
    </Janela>
  );
}

// ----------------------------------------------
// Meta
// ----------------------------------------------

export function MetaDialog({ aberto, onFechar, inicial }: { aberto: boolean; onFechar: () => void; inicial?: Goal }) {
  const { t } = useLocale();
  const [titulo, setTitulo] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [prazo, setPrazo] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setTitulo(inicial?.title ?? "");
    setObjetivo(inicial?.target ?? "");
    setPrazo(inicial && inicial.deadline !== t("goalsNoDeadline") ? inicial.deadline : "");
  }, [aberto, inicial, t]);

  const podeSalvar = titulo.trim().length > 0 && objetivo.trim().length > 0;

  const salvar = async () => {
    setSalvando(true);
    const dados = { title: titulo.trim(), target: objetivo.trim(), deadline: prazo.trim() || t("goalsNoDeadline") };
    const ok = await executar(
      async () => {
        if (inicial) await goalsApi.update(inicial.id, dados);
        else await goalsApi.create({ ...dados, progress: 0 });
      },
      { erro: inicial ? t("erroAoSalvar") : t("erroAoAdicionar") }
    );
    setSalvando(false);
    if (ok !== null) onFechar();
  };

  return (
    <Janela
      aberto={aberto}
      onFechar={onFechar}
      titulo={inicial ? t("goalsEdit") : t("goalsAdd")}
      onSalvar={salvar}
      salvando={salvando}
      podeSalvar={podeSalvar}
    >
      <Campo rotulo={t("goalsNamePlaceholder")}>
        <Input autoFocus value={titulo} onChange={(e) => setTitulo(e.target.value)} className={campo} placeholder={t("exMeta")} />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo={t("objetivo")}>
          <Input value={objetivo} onChange={(e) => setObjetivo(e.target.value)} className={campo} placeholder={t("exObjetivo")} />
        </Campo>
        <Campo rotulo={t("goalsDeadlinePlaceholder")}>
          <Input value={prazo} onChange={(e) => setPrazo(e.target.value)} className={campo} placeholder={t("exPrazo")} />
        </Campo>
      </div>
    </Janela>
  );
}

// ----------------------------------------------
// Confirmação de exclusão
// ----------------------------------------------

export function Confirmar({
  aberto,
  titulo,
  descricao,
  onConfirmar,
  onFechar,
}: {
  aberto: boolean;
  titulo: string;
  descricao?: string;
  onConfirmar: () => void;
  onFechar: () => void;
}) {
  const { t } = useLocale();
  return (
    <AlertDialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <AlertDialogContent className="max-w-sm rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          {descricao && <AlertDialogDescription>{descricao}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              onConfirmar();
              onFechar();
            }}
          >
            {t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
