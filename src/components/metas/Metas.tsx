import { useMemo, useState } from "react";
import { Minus, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocale } from "@/contexts/LocaleContext";
import { executar } from "@/lib/acoes";
import { goalsApi, type Goal } from "@/lib/db";
import { lerMeta, lerNumero, mesCurto, progressoDe, type MetaVista } from "@/lib/metas";
import { cn } from "@/lib/utils";
import { useCores } from "@/desktop/categorias";

// A lista de metas, igual no computador (Finanças) e no celular (Progresso):
// cada meta com o seu emoji, andando na sua unidade (livros, reais...) e
// separada por prazo — próximos 12 meses, longo prazo e concluídas.

const reais = (v: number) => `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`;
const numero = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

/** "2 de 6 livros", "R$ 4.500 de R$ 30.000". */
export function useTextosMeta() {
  const { t, locale } = useLocale();
  return {
    quanto(v: MetaVista, objetivoTexto?: string) {
      if (v.tipo === "dinheiro") return t("metaDeDinheiro").replace("{atual}", reais(v.atual)).replace("{alvo}", reais(v.alvo));
      if (v.tipo === "quantidade")
        return t("metaDeQuantidade").replace("{atual}", numero(v.atual)).replace("{alvo}", numero(v.alvo)).replace("{unidade}", v.unidade).trim();
      return objetivoTexto?.trim() || "";
    },
    prazo(v: MetaVista) {
      if (v.prazo) return (v.prazoPassou ? t("metaPrazoEra") : t("metaAte")).replace("{mes}", mesCurto(v.prazo, locale));
      return v.prazoTexto || t("longoPrazo");
    },
    ritmo(v: MetaVista) {
      if (v.concluida) return t("metaBatida");
      if (v.tipo === "porcentagem" || v.prazoPassou) return "";
      if (v.porMes === null) {
        return v.tipo === "dinheiro"
          ? t("metaFaltam").replace("{quanto}", reais(v.falta))
          : t("metaFaltam").replace("{quanto}", `${numero(v.falta)} ${v.unidade}`.trim());
      }
      if (v.tipo === "dinheiro") return t("metaGuardePorMes").replace("{valor}", reais(Math.ceil(v.porMes)));
      if (v.porMes >= 1) return t("metaPorMes").replace("{n}", numero(v.porMes));
      return t("metaUmACada").replace("{n}", String(Math.ceil(1 / v.porMes)));
    },
  };
}

/** Grava o novo "atual" (e converte a meta antiga para o jeito novo, já que agora sabemos a unidade). */
function mudarAtual(meta: Goal, v: MetaVista, novo: number, erro: string) {
  const atual = Math.max(0, Math.round(novo * 100) / 100);
  if (v.tipo === "porcentagem") {
    const pct = Math.max(0, Math.min(100, atual));
    return executar(() => goalsApi.update(meta.id, { progress: pct }), { erro });
  }
  const dados: Partial<Goal> = { atual, progress: progressoDe(atual, v.alvo) };
  if (!meta.tipo) {
    dados.tipo = v.tipo;
    dados.alvo = v.alvo;
    dados.unidade = v.unidade;
    if (meta.prazo === undefined && v.prazo) dados.prazo = v.prazo;
  }
  return executar(() => goalsApi.update(meta.id, dados), { erro });
}

function GuardarDinheiro({ meta, v }: { meta: Goal; v: MetaVista }) {
  const { t } = useLocale();
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const valor = lerNumero(texto);
  const ok = valor !== null && valor > 0;

  const aplicar = async (sinal: 1 | -1) => {
    if (!ok) return;
    const feito = await mudarAtual(meta, v, v.atual + sinal * valor, t("erroAoSalvar"));
    if (feito !== null) {
      setTexto("");
      setAberto(false);
    }
  };

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg bg-secondary px-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/70"
        >
          <Plus className="h-3.5 w-3.5" /> {t("metaGuardar")}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" collisionPadding={{ top: 12, bottom: 88 }} className="w-60 rounded-2xl p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            aplicar(1);
          }}
          className="space-y-2"
        >
          <label className="block text-xs font-semibold text-muted-foreground" htmlFor={`guardar-${meta.id}`}>
            {t("metaQuantoGuardou")}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
            <Input
              id={`guardar-${meta.id}`}
              autoFocus
              inputMode="decimal"
              placeholder="0,00"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="h-10 rounded-xl pl-10 tabular-nums"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" size="sm" className="rounded-xl" disabled={!ok} onClick={() => aplicar(-1)}>
              {t("metaTirar")}
            </Button>
            <Button type="submit" size="sm" className="rounded-xl" disabled={!ok}>
              {t("metaGuardar")}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function BotaoPasso({ rotulo, onClick, children }: { rotulo: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      title={rotulo}
      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-secondary text-foreground transition-colors hover:bg-secondary/70"
    >
      {children}
    </button>
  );
}

export function MetaItem({ meta, onEditar }: { meta: Goal; onEditar: () => void }) {
  const { t } = useLocale();
  const cores = useCores();
  const textos = useTextosMeta();
  const v = lerMeta(meta);
  const cor = v.concluida ? cores.serie("saldo") : cores.serie("metas");
  const passo = v.tipo === "porcentagem" ? 10 : 1;
  const ritmo = textos.ritmo(v);

  return (
    <li className="group flex gap-3.5 py-3">
      <button
        type="button"
        onClick={onEditar}
        aria-label={`${t("goalsEdit")}: ${v.titulo}`}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-[22px] leading-none transition-transform hover:scale-105"
        style={{ backgroundColor: `color-mix(in srgb, ${cor} 14%, transparent)` }}
      >
        <span aria-hidden>{v.icone}</span>
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <button type="button" onClick={onEditar} className="min-w-0 truncate text-left text-sm font-semibold hover:underline">
            {v.titulo}
          </button>
          <span className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onEditar}
              aria-label={t("goalsEdit")}
              className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <span className="text-xs font-bold tabular-nums" style={{ color: v.concluida ? cor : undefined }}>
              {v.pct}%
            </span>
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {[textos.quanto(v, meta.target), textos.prazo(v)].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${v.pct}%`, backgroundColor: cor }} />
          </div>
          {/* Meta batida: sem botões (dá para mudar tocando nela). */}
          {v.concluida ? null : v.tipo === "dinheiro" ? (
            <GuardarDinheiro meta={meta} v={v} />
          ) : (
            <>
              <BotaoPasso rotulo={t("goalsDecrease")} onClick={() => mudarAtual(meta, v, v.atual - passo, t("erroAoSalvar"))}>
                <Minus className="h-3.5 w-3.5" />
              </BotaoPasso>
              <BotaoPasso rotulo={t("goalsIncrease")} onClick={() => mudarAtual(meta, v, v.atual + passo, t("erroAoSalvar"))}>
                <Plus className="h-3.5 w-3.5" />
              </BotaoPasso>
            </>
          )}
        </div>
        {ritmo && (
          <p className={cn("mt-1.5 text-[11px]", v.concluida ? "font-semibold" : "text-muted-foreground")} style={v.concluida ? { color: cor } : undefined}>
            {ritmo}
          </p>
        )}
        {v.prazoPassou && <p className="mt-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">{t("metaPrazoPassou")}</p>}
      </div>
    </li>
  );
}

/** As metas separadas por prazo. */
export function ListaMetas({ metas, onEditar, className }: { metas: Goal[]; onEditar: (m: Goal) => void; className?: string }) {
  const { t } = useLocale();
  const grupos = useMemo(() => {
    const vistas = metas.map((m) => ({ meta: m, v: lerMeta(m) }));
    const porPrazo = (a: { v: MetaVista }, b: { v: MetaVista }) => (a.v.prazo ?? "9999").localeCompare(b.v.prazo ?? "9999");
    return [
      { chave: "curto", titulo: t("metasProximos12"), itens: vistas.filter((x) => !x.v.concluida && x.v.curtoPrazo).sort(porPrazo) },
      { chave: "longo", titulo: t("metasLongoPrazo"), itens: vistas.filter((x) => !x.v.concluida && !x.v.curtoPrazo).sort(porPrazo) },
      { chave: "feitas", titulo: t("metasGrupoConcluidas"), itens: vistas.filter((x) => x.v.concluida) },
    ].filter((g) => g.itens.length > 0);
  }, [metas, t]);

  return (
    <div className={cn("space-y-3", className)}>
      {grupos.map((g) => (
        <section key={g.chave}>
          <h4 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {g.titulo}
            <span className="rounded-full bg-secondary px-1.5 py-px text-[10px] tabular-nums">{g.itens.length}</span>
          </h4>
          <ul className="divide-y divide-border/60">
            {g.itens.map(({ meta }) => (
              <MetaItem key={meta.id} meta={meta} onEditar={() => onEditar(meta)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
