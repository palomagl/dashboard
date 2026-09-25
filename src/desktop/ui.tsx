import { useId, type ComponentType, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// Peças pequenas repetidas pelos cards do layout de computador.

export function Cartao({
  className,
  children,
  as: Tag = "section",
  ...resto
}: {
  className?: string;
  children: ReactNode;
  as?: "section" | "div" | "article" | "aside";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={cn("cartao cartao-interativo p-5 wide:p-6 animate-fade-in", className)} {...resto}>
      {children}
    </Tag>
  );
}

/** Título de card: ícone ou bolinha colorida, título, subtítulo e ações à direita. */
export function CartaoTopo({
  icone,
  ponto,
  titulo,
  subtitulo,
  acao,
  className,
}: {
  icone?: ReactNode;
  ponto?: string;
  titulo: ReactNode;
  subtitulo?: ReactNode;
  acao?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 mb-4", className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold leading-6 tracking-tight">
          {ponto && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ponto }} />}
          {icone}
          <span className="truncate">{titulo}</span>
        </h2>
        {subtitulo && <p className="mt-0.5 text-xs text-muted-foreground truncate">{subtitulo}</p>}
      </div>
      {acao && <div className="flex shrink-0 items-center gap-1">{acao}</div>}
    </div>
  );
}

/** Quadradinho com ícone em cor suave (o fundo é a própria cor em ~12%). */
export function IconeSuave({
  Icone,
  cor,
  tamanho = "md",
  redondo = false,
  className,
}: {
  Icone: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  cor: string;
  tamanho?: "sm" | "md" | "lg";
  redondo?: boolean;
  className?: string;
}) {
  const caixa = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-11 w-11" }[tamanho];
  const icone = { sm: "h-4 w-4", md: "h-[18px] w-[18px]", lg: "h-5 w-5" }[tamanho];
  return (
    <span
      className={cn("grid shrink-0 place-items-center", redondo ? "rounded-full" : "rounded-xl", caixa, className)}
      style={{ backgroundColor: `color-mix(in srgb, ${cor} 13%, transparent)` }}
    >
      <Icone className={icone} style={{ color: cor }} />
    </span>
  );
}

/** Controle segmentado em pílula (7 dias / 30 dias / 3 meses). */
export function Segmentado<T extends string>({
  opcoes,
  valor,
  onChange,
  rotulo,
}: {
  opcoes: { valor: T; rotulo: string }[];
  valor: T;
  onChange: (v: T) => void;
  rotulo: string;
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="inline-flex w-fit shrink-0 gap-0.5 rounded-full border border-border/80 bg-background p-0.5">
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          onClick={() => onChange(o.valor)}
          className={cn(
            "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
            valor === o.valor
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

/** Mini gráfico de linha com área suave, para os cards de número. */
export function Sparkline({
  valores,
  cor,
  largura = 76,
  altura = 34,
  className,
}: {
  valores: number[];
  cor: string;
  largura?: number;
  altura?: number;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  // Sem movimento nenhum, uma linha reta no zero não diz nada.
  if (valores.length < 2 || valores.every((v) => v === 0)) return null;
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const faixa = max - min || 1;
  const margem = 3;
  const pontos = valores.map((v, i) => {
    const x = (i / (valores.length - 1)) * largura;
    const y = margem + (1 - (v - min) / faixa) * (altura - margem * 2);
    return [x, y] as const;
  });
  // Curva suave (Catmull-Rom -> Bézier) para ficar com a cara das referências.
  let d = `M ${pontos[0][0]} ${pontos[0][1]}`;
  for (let i = 0; i < pontos.length - 1; i++) {
    const p0 = pontos[i - 1] ?? pontos[i];
    const p1 = pontos[i];
    const p2 = pontos[i + 1];
    const p3 = pontos[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }
  const area = `${d} L ${largura} ${altura} L 0 ${altura} Z`;
  return (
    // Estica na largura que a classe der (mais estreito em notebook), sem engrossar a linha.
    <svg
      width={className ? undefined : largura}
      height={altura}
      viewBox={`0 0 ${largura} ${altura}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity={0.22} />
          <stop offset="100%" stopColor={cor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sp-${id})`} />
      <path d={d} fill="none" stroke={cor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Barra de progresso fina. */
export function Barra({ pct, cor, className, altura = "h-1.5" }: { pct: number; cor: string; className?: string; altura?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-full bg-secondary", altura, className)}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: cor }}
      />
    </div>
  );
}

/** Botão só de ícone, discreto. */
export function BotaoIcone({
  children,
  rotulo,
  className,
  ...resto
}: { children: ReactNode; rotulo: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...resto}
    >
      {children}
    </button>
  );
}

/** Estado vazio de card. */
export function Vazio({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-border px-6 py-8 text-center text-sm text-muted-foreground", className)}>
      {children}
    </div>
  );
}

/** Linhas cinza enquanto a primeira resposta do banco não chega. */
export function Esqueleto({ linhas = 3, className }: { linhas?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden="true">
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-secondary" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/5 animate-pulse rounded bg-secondary" />
            <div className="h-2.5 w-1/4 animate-pulse rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Link discreto "Ver todas →" — navega (para) ou age (onClick). */
export function LinkVerTodas({ children, onClick, para }: { children: ReactNode; onClick?: () => void; para?: string }) {
  const classe =
    "flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10";
  if (para) {
    return (
      <Link to={para} className={classe}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classe}>
      {children}
    </button>
  );
}
