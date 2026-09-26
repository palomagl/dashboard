import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocale } from "@/contexts/LocaleContext";
import { executar } from "@/lib/acoes";
import {
  definirTemposPomodoro,
  limparTempos,
  mesmosTempos,
  minutosCurto,
  SUGESTOES_POMODORO,
  useTemposPomodoro,
  type TemposPomodoro,
} from "@/lib/pomodoro";
import { cn } from "@/lib/utils";

type Rascunho = Record<keyof TemposPomodoro, string>;
const paraRascunho = (t: TemposPomodoro): Rascunho => ({
  foco: String(t.foco),
  pausa: String(t.pausa),
  pausaLonga: String(t.pausaLonga),
  ciclo: String(t.ciclo),
});

/** A engrenagem do Pomodoro: sugestões prontas (25/5, 50/10, 1h/20...) ou os seus próprios tempos. */
export function AjustesPomodoro({ className }: { className?: string }) {
  const { t } = useLocale();
  const tempos = useTemposPomodoro();
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<Rascunho>(paraRascunho(tempos));

  useEffect(() => {
    if (aberto) setRascunho(paraRascunho(tempos));
  }, [aberto, tempos]);

  const valido = Object.values(rascunho).every((v) => /^\d+$/.test(v.trim()) && Number(v) > 0);
  const escolhido = valido ? limparTempos(Object.fromEntries(Object.entries(rascunho).map(([k, v]) => [k, Number(v)]))) : null;

  const salvar = async (novos: TemposPomodoro) => {
    const ok = await executar(() => definirTemposPomodoro(novos), { erro: t("erroAoSalvar"), sucesso: t("pomodoroTemposSalvos") });
    if (ok !== null) setAberto(false);
  };

  const campos: { chave: keyof TemposPomodoro; rotulo: string; sufixo: string }[] = [
    { chave: "foco", rotulo: t("pomodoroFocus"), sufixo: "min" },
    { chave: "pausa", rotulo: t("pomodoroShortBreak"), sufixo: "min" },
    { chave: "pausaLonga", rotulo: t("pomodoroLongBreak"), sufixo: "min" },
    { chave: "ciclo", rotulo: t("pomodoroCicloRotulo"), sufixo: t("pomodoroFocos") },
  ];

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("pomodoroAjustar")}
          title={t("pomodoroAjustar")}
          className={cn(
            "grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
            className
          )}
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" collisionPadding={{ top: 12, bottom: 88 }} className="max-h-[var(--radix-popover-content-available-height)] w-[300px] overflow-y-auto rounded-2xl p-4 pb-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (escolhido) salvar(escolhido);
          }}
          className="space-y-3"
        >
          <div>
            <p className="text-sm font-semibold">{t("pomodoroTempos")}</p>
            <p className="text-xs text-muted-foreground">{t("pomodoroTemposDica")}</p>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {SUGESTOES_POMODORO.map((s) => {
              const ativo = escolhido !== null && mesmosTempos(s, escolhido);
              return (
                <button
                  key={`${s.foco}-${s.pausa}`}
                  type="button"
                  onClick={() => setRascunho(paraRascunho(s))}
                  aria-pressed={ativo}
                  className={cn(
                    "rounded-xl border px-2.5 py-2 text-left transition-colors",
                    ativo ? "border-primary bg-primary/[0.07] ring-1 ring-primary" : "border-border hover:border-primary/40"
                  )}
                >
                  <span className="block whitespace-nowrap text-sm font-semibold tabular-nums">
                    {s.foco < 60 ? s.foco : minutosCurto(s.foco)} / {s.pausa} min
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {t("pomodoroFocoEPausa")}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            {campos.map((c) => (
              <label key={c.chave} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{c.rotulo}</span>
                <span className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={c.chave === "ciclo" ? 8 : 180}
                    value={rascunho[c.chave]}
                    onChange={(e) => setRascunho((r) => ({ ...r, [c.chave]: e.target.value }))}
                    className="h-8 w-[68px] rounded-lg text-center tabular-nums"
                  />
                  <span className="w-10 text-xs text-muted-foreground">{c.sufixo}</span>
                </span>
              </label>
            ))}
          </div>

          <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t border-border/60 bg-popover px-4 py-3">
            <Button type="button" variant="ghost" size="sm" className="rounded-xl" onClick={() => setAberto(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" size="sm" className="rounded-xl" disabled={!escolhido}>
              {t("save")}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
