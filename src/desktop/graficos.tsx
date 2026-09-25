import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Fatia {
  chave: string;
  rotulo: string;
  valor: number;
  cor: string;
}

/**
 * Rosca em SVG puro. Cada fatia é um arco de círculo; entre elas fica um vão
 * de 2px na cor do card (em vez de borda). Passar o mouse numa fatia troca o
 * texto do meio pelo valor dela — o "tooltip" mora no centro.
 */
export function Rosca({
  fatias,
  tamanho = 150,
  espessura = 20,
  centro,
  formatar,
  trilho,
  destaque,
  onDestaque,
}: {
  fatias: Fatia[];
  tamanho?: number;
  espessura?: number;
  centro: ReactNode;
  formatar: (valor: number) => string;
  trilho: string;
  destaque?: string | null;
  onDestaque?: (chave: string | null) => void;
}) {
  const [interno, setInterno] = useState<string | null>(null);
  const ativo = destaque !== undefined ? destaque : interno;
  const mudar = onDestaque ?? setInterno;

  const r = (tamanho - espessura) / 2;
  const c = tamanho / 2;
  const circ = 2 * Math.PI * r;
  const total = fatias.reduce((s, f) => s + Math.max(0, f.valor), 0);
  const visiveis = fatias.filter((f) => f.valor > 0);
  const vao = visiveis.length > 1 ? 2 : 0;

  let acumulado = 0;
  const arcos = visiveis.map((f) => {
    const comprimento = (f.valor / total) * circ;
    const arco = { ...f, inicio: acumulado, comprimento: Math.max(0.5, comprimento - vao) };
    acumulado += comprimento;
    return arco;
  });

  const fatiaAtiva = arcos.find((a) => a.chave === ativo);
  const pct = fatiaAtiva && total > 0 ? Math.round((fatiaAtiva.valor / total) * 100) : 0;

  return (
    <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} className="-rotate-90" role="img">
        <circle cx={c} cy={c} r={r} fill="none" stroke={trilho} strokeWidth={espessura} />
        {arcos.map((a) => (
          <circle
            key={a.chave}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={a.cor}
            strokeWidth={ativo === a.chave ? espessura + 4 : espessura}
            strokeDasharray={`${a.comprimento} ${circ - a.comprimento}`}
            strokeDashoffset={-a.inicio}
            className={cn("cursor-pointer transition-[stroke-width,opacity] duration-200", ativo && ativo !== a.chave && "opacity-40")}
            style={{ pointerEvents: "stroke" }}
            onMouseEnter={() => mudar(a.chave)}
            onMouseLeave={() => mudar(null)}
          >
            <title>{`${a.rotulo}: ${formatar(a.valor)}`}</title>
          </circle>
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center" aria-live="polite">
        {fatiaAtiva ? (
          <>
            <span className="text-[15px] font-bold leading-tight">{formatar(fatiaAtiva.valor)}</span>
            <span className="mt-0.5 max-w-[80%] truncate text-[11px] text-muted-foreground">
              {fatiaAtiva.rotulo} · {pct}%
            </span>
          </>
        ) : (
          centro
        )}
      </div>
    </div>
  );
}

/**
 * Card de número (KPI) no formato das referências: ícone à esquerda, rótulo e
 * valor ao lado; embaixo, o detalhe e a linhazinha. O detalhe ocupa a largura
 * toda para caber mesmo nos cards estreitos de notebook.
 */
export function Kpi({
  Icone,
  cor,
  rotulo,
  valor,
  rodape,
  grafico,
  acao,
  atraso = 0,
}: {
  Icone: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  cor: string;
  rotulo: ReactNode;
  valor: ReactNode;
  rodape?: ReactNode;
  grafico?: ReactNode;
  acao?: ReactNode;
  atraso?: number;
}) {
  return (
    <div
      className="cartao cartao-interativo flex min-w-0 flex-col justify-between gap-3 p-[18px] animate-fade-in wide:p-5"
      style={{ animationDelay: `${atraso}ms` }}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px]"
          style={{ backgroundColor: `color-mix(in srgb, ${cor} 13%, transparent)` }}
        >
          <Icone className="h-5 w-5" style={{ color: cor }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="rotulo-kpi truncate" title={typeof rotulo === "string" ? rotulo : undefined}>{rotulo}</p>
            {acao}
          </div>
          <p className="mt-1 truncate text-[22px] font-bold leading-tight tracking-tight tabular-nums wide:text-2xl">{valor}</p>
        </div>
      </div>
      {(rodape || grafico) && (
        <div className="flex min-h-[28px] items-end justify-between gap-2 text-xs">
          <div className="min-w-0 flex-1 truncate">{rodape}</div>
          {grafico && <div className="pointer-events-none -mb-1 hidden shrink-0 xl:block">{grafico}</div>}
        </div>
      )}
    </div>
  );
}

/** "↑ 8% vs mês passado" com a cor certa (subir gasto é ruim; subir entrada é bom). */
export function Delta({ pct, bomQuandoSobe, sufixo }: { pct: number | null; bomQuandoSobe: boolean; sufixo: string }) {
  if (pct === null) return <span className="text-muted-foreground">{sufixo}</span>;
  const sobe = pct >= 0;
  const bom = sobe === bomQuandoSobe;
  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold", bom ? "text-positivo" : "text-negativo")}>
      {sobe ? "↑" : "↓"} {Math.abs(Math.round(pct))}%<span className="font-normal text-muted-foreground">{sufixo}</span>
    </span>
  );
}
