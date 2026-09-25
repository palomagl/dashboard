import { useMemo, useState } from "react";
import { ArrowRight, Clock, Pencil, Plus, Trash2 } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { transactionsApi } from "@/lib/db";
import { executar } from "@/lib/acoes";
import { useTransacoes, type TransacaoAoVivo } from "@/lib/aoVivo";
import { cn } from "@/lib/utils";
import { ICONE_CATEGORIA, ICONE_ENTRADA, normalizarCategoria, useCores } from "../categorias";
import { diaMes, hora } from "../formato";
import { BotaoIcone, Cartao, CartaoTopo, Esqueleto, IconeSuave, LinkVerTodas, Segmentado, Vazio } from "../ui";
import { useDinheiro } from "../valores";
import { TransacaoDialog } from "../Formularios";

export function LinhaTransacao({
  tx,
  onEditar,
  onExcluir,
}: {
  tx: TransacaoAoVivo;
  onEditar?: () => void;
  onExcluir?: () => void;
}) {
  const { t, locale } = useLocale();
  const cores = useCores();
  const dinheiro = useDinheiro();
  const entrada = tx.type === "income";
  const categoria = normalizarCategoria(tx.category);
  const cor = entrada ? cores.serie("saldo") : cores.categoria(categoria);
  const Icone = entrada ? ICONE_ENTRADA : ICONE_CATEGORIA[categoria];
  const quando = [diaMes(tx.date, locale), hora(tx.criadaEm, locale)].filter(Boolean).join(" • ");

  return (
    <li className="group flex items-center gap-3 rounded-xl px-1 py-2.5 transition-colors hover:bg-secondary/60">
      <IconeSuave Icone={Icone} cor={cor} tamanho="lg" className="rounded-[14px]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{tx.description}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{quando}</p>
      </div>
      {(onEditar || onExcluir) && (
        <div className="flex opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          {onEditar && (
            <BotaoIcone rotulo={t("financesEditTransaction")} onClick={onEditar}>
              <Pencil className="h-3.5 w-3.5" />
            </BotaoIcone>
          )}
          {onExcluir && (
            <BotaoIcone rotulo={t("financesDeleteTransaction")} onClick={onExcluir} className="hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </BotaoIcone>
          )}
        </div>
      )}
      <div className="shrink-0 text-right">
        <p className={cn("text-sm font-bold tabular-nums", entrada ? "text-positivo" : "text-negativo")}>
          {dinheiro(entrada ? tx.amount : -tx.amount, { centavos: true, sinal: true })}
        </p>
        <p className="mt-0.5 flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cor }} />
          {entrada ? t("entrada") : categoria}
        </p>
      </div>
    </li>
  );
}

/** Coluna "Últimas transações" da Início: só leitura, com link para Finanças. */
export function UltimasTransacoes({ quantidade = 6, className }: { quantidade?: number; className?: string }) {
  const { t } = useLocale();
  const { itens, pronto } = useTransacoes();
  const ultimas = itens.slice(0, quantidade);

  return (
    <Cartao className={className}>
      <CartaoTopo
        icone={<Clock className="h-[18px] w-[18px] text-foreground/70" />}
        titulo={t("recentTransactionsTitle")}
        acao={
          <LinkVerTodas para="/financas">
            {t("recentTransactionsSeeAll")} <ArrowRight className="h-3.5 w-3.5" />
          </LinkVerTodas>
        }
      />
      {!pronto ? (
        <Esqueleto linhas={5} />
      ) : ultimas.length === 0 ? (
        <Vazio>{t("recentTransactionsEmpty")}</Vazio>
      ) : (
        <ul className="-mx-1 divide-y divide-border/60">
          {ultimas.map((tx) => (
            <LinhaTransacao key={tx.id} tx={tx} />
          ))}
        </ul>
      )}
    </Cartao>
  );
}

type Filtro = "todas" | "income" | "expense";

/** Finanças: transações com filtro, adicionar, editar e excluir. */
export function TransacoesCard({ className }: { className?: string }) {
  const { t } = useLocale();
  const { itens, pronto } = useTransacoes();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [todas, setTodas] = useState(false);
  const [dialogo, setDialogo] = useState<{ aberto: boolean; tx?: TransacaoAoVivo }>({ aberto: false });

  const filtradas = useMemo(() => (filtro === "todas" ? itens : itens.filter((x) => x.type === filtro)), [itens, filtro]);
  const visiveis = todas ? filtradas : filtradas.slice(0, 6);

  const excluir = (id: string) => executar(() => transactionsApi.delete(id), { erro: t("erroAoExcluir") });

  return (
    <Cartao className={cn("flex flex-col", className)} id="transacoes">
      <CartaoTopo
        icone={<Clock className="h-[18px] w-[18px] text-foreground/70" />}
        titulo={t("transacoesRecentes")}
        subtitulo={`${filtradas.length} ${t("financesTransactions").toLowerCase()}`}
        acao={
          <>
            {filtradas.length > 6 && (
              <LinkVerTodas onClick={() => setTodas((v) => !v)}>
                {todas ? t("verMenos") : t("recentTransactionsSeeAll")} <ArrowRight className="h-3.5 w-3.5" />
              </LinkVerTodas>
            )}
            <BotaoIcone rotulo={t("financesNewTransaction")} onClick={() => setDialogo({ aberto: true })}>
              <Plus className="h-4 w-4" />
            </BotaoIcone>
          </>
        }
      />
      <div className="mb-3">
        <Segmentado<Filtro>
          rotulo={t("financesTransactions")}
          valor={filtro}
          onChange={setFiltro}
          opcoes={[
            { valor: "todas", rotulo: t("filtroTodas") },
            { valor: "income", rotulo: t("financeOverviewIncome") },
            { valor: "expense", rotulo: t("financeOverviewExpenses") },
          ]}
        />
      </div>
      {!pronto ? (
        <Esqueleto linhas={5} />
      ) : visiveis.length === 0 ? (
        <Vazio>{t("recentTransactionsEmpty")}</Vazio>
      ) : (
        <ul className={cn("-mx-1 divide-y divide-border/60", todas && "max-h-[520px] overflow-y-auto pr-1")}>
          {visiveis.map((tx) => (
            <LinhaTransacao
              key={tx.id}
              tx={tx}
              onEditar={() => setDialogo({ aberto: true, tx })}
              onExcluir={() => excluir(tx.id)}
            />
          ))}
        </ul>
      )}
      <TransacaoDialog aberto={dialogo.aberto} inicial={dialogo.tx} onFechar={() => setDialogo({ aberto: false })} />
    </Cartao>
  );
}
