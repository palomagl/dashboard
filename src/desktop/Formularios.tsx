import { useEffect, useState, type FormEvent, type ReactNode } from "react";
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
}: {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
  onSalvar: () => void;
  salvando: boolean;
  podeSalvar: boolean;
}) {
  const { t } = useLocale();
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (podeSalvar && !salvando) onSalvar();
  };
  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-w-md rounded-3xl">
        <form onSubmit={enviar} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
            {descricao && <DialogDescription>{descricao}</DialogDescription>}
          </DialogHeader>
          <div className="space-y-4">{children}</div>
          <DialogFooter className="gap-2 sm:gap-0">
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
}: {
  aberto: boolean;
  onFechar: () => void;
  inicial?: Transaction;
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
    setTipo(inicial?.type ?? "expense");
    setDescricao(inicial?.description ?? "");
    setValor(valorParaTexto(inicial?.amount));
    setCategoria(normalizarCategoria(inicial?.category));
    setData(inicial?.date || dayKey());
  }, [aberto, inicial]);

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

export function ContaDialog({ aberto, onFechar, inicial }: { aberto: boolean; onFechar: () => void; inicial?: Bill }) {
  const { t } = useLocale();
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [dia, setDia] = useState("");
  const [categoria, setCategoria] = useState("Serviços");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setNome(inicial?.name ?? "");
    setValor(valorParaTexto(inicial?.amount));
    setDia(inicial?.dueDate ?? "");
    setCategoria(inicial?.category ?? "Serviços");
  }, [aberto, inicial]);

  const numero = lerValor(valor);
  const diaNum = parseInt(dia, 10);
  const podeSalvar = nome.trim().length > 0 && numero > 0 && diaNum >= 1 && diaNum <= 31;

  const salvar = async () => {
    setSalvando(true);
    const dados = { name: nome.trim(), amount: numero, dueDate: String(diaNum), category: categoria };
    const ok = await executar(
      async () => {
        if (inicial) await billsApi.update(inicial.id, dados);
        else await billsApi.create({ ...dados, paid: false });
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
      titulo={inicial ? t("financesEditBill") : t("financesNewBill")}
      onSalvar={salvar}
      salvando={salvando}
      podeSalvar={podeSalvar}
    >
      <Campo rotulo={t("financesBillName")}>
        <Input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} className={campo} placeholder={t("exConta")} />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo={t("financesAmount")}>
          <Input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} className={campo} placeholder="0,00" />
        </Campo>
        <Campo rotulo={t("diaVencimento")}>
          <Input type="number" min={1} max={31} value={dia} onChange={(e) => setDia(e.target.value)} className={campo} placeholder="10" />
        </Campo>
      </div>
      <Campo rotulo={t("financeCategoryField")}>
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className={campo}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIAS_CONTA.map((c) => (
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
