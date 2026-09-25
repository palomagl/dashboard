import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Send, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/contexts/LocaleContext";
import { useHabitos, useTarefas, useTelegram } from "@/lib/aoVivo";
import { cn } from "@/lib/utils";
import { useCores } from "../categorias";
import { TelegramDialog } from "../TelegramDialog";

const FRASES = {
  pt: [
    "Grandes conquistas começam com pequenos hábitos.",
    "Feito é melhor que perfeito.",
    "Um dia de cada vez, uma tarefa de cada vez.",
    "Constância vence intensidade.",
    "O que você repete todo dia vira quem você é.",
    "Pequenos passos também te levam longe.",
    "Cuide do hoje: o amanhã agradece.",
  ],
  en: [
    "Great achievements start with small habits.",
    "Done is better than perfect.",
    "One day at a time, one task at a time.",
    "Consistency beats intensity.",
    "What you repeat every day becomes who you are.",
    "Small steps take you far too.",
    "Take care of today; tomorrow will thank you.",
  ],
};

/** Uma frase por dia — a mesma o dia inteiro, outra amanhã. */
function fraseDoDia(locale: "pt" | "en") {
  const inicio = new Date(new Date().getFullYear(), 0, 0).getTime();
  const diaDoAno = Math.floor((Date.now() - inicio) / 86_400_000);
  const lista = FRASES[locale];
  return lista[diaDoAno % lista.length];
}

/**
 * Card da coluna direita da Início: quanto do dia já foi feito (tarefas +
 * hábitos) e a frase do dia ("Grandes conquistas começam...").
 */
export function FraseCard({ className }: { className?: string }) {
  const { t, locale } = useLocale();
  const cores = useCores();
  const tarefas = useTarefas().itens;
  const habitos = useHabitos().itens;
  const total = tarefas.length + habitos.length;
  const feitos = tarefas.filter((x) => x.completed).length + habitos.filter((h) => h.completed).length;
  const pct = total > 0 ? feitos / total : 0;
  const r = 44;
  const circ = 2 * Math.PI * r;

  return (
    <section
      className={cn(
        "cartao relative flex min-h-[180px] flex-col items-center justify-center overflow-hidden px-8 py-8 text-center animate-fade-in",
        className
      )}
    >
      {/* Brilho suave no fundo, sem imagem. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 110%, hsl(var(--primary) / 0.12), transparent 60%), radial-gradient(60% 50% at 90% 0%, hsl(262 83% 58% / 0.07), transparent 70%)",
        }}
      />
      {total > 0 && (
        <>
          <div className="relative h-[108px] w-[108px]" role="img" aria-label={t("hojeFeitos").replace("{feitos}", String(feitos)).replace("{total}", String(total))}>
            <svg viewBox="0 0 108 108" className="h-full w-full -rotate-90">
              <circle cx="54" cy="54" r={r} fill="none" stroke={cores.trilho} strokeWidth="8" />
              <circle
                cx="54"
                cy="54"
                r={r}
                fill="none"
                stroke={cores.serie("tarefas")}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pct)}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold tabular-nums">{Math.round(pct * 100)}%</span>
              <span className="text-[11px] text-muted-foreground">{t("hojeProgresso")}</span>
            </div>
          </div>
          <p className="relative mt-2 text-xs text-muted-foreground">
            {t("hojeFeitos").replace("{feitos}", String(feitos)).replace("{total}", String(total))}
          </p>
          <div className="relative my-6 w-12 border-t border-border" aria-hidden="true" />
        </>
      )}
      <Sprout className="relative h-7 w-7 text-primary" strokeWidth={1.75} />
      <p className="relative mt-3 max-w-[240px] text-[15px] font-medium leading-relaxed text-foreground/75">
        {fraseDoDia(locale)}
      </p>
      <Heart className="relative mt-3 h-4 w-4 text-foreground/50" />
    </section>
  );
}

/** Faixa do Telegram (rodapé de Início e Finanças). */
export function TelegramFaixa({ className }: { className?: string }) {
  const { t } = useLocale();
  const status = useTelegram();
  const [aberto, setAberto] = useState(false);
  const vinculado = !!status;

  return (
    <section
      className={cn(
        "cartao relative flex items-center gap-4 overflow-hidden px-5 py-4 animate-fade-in wide:px-6",
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(90deg, hsl(var(--primary) / 0.07), hsl(199 89% 55% / 0.05) 55%, transparent)",
      }}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#2AABEE] shadow-[0_6px_16px_-6px_#2AABEE]">
        <Send className="h-5 w-5 -translate-x-px translate-y-px text-white" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{vinculado ? t("telegramConectadoTitulo") : t("telegramConecteTitulo")}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {vinculado ? t("telegramConectadoTexto") : t("telegramConecteTexto")}
        </p>
      </div>
      {vinculado ? (
        <Button asChild variant="outline" className="h-10 shrink-0 rounded-xl bg-card px-5">
          <Link to="/account">{t("gerenciar")}</Link>
        </Button>
      ) : (
        <Button className="h-10 shrink-0 rounded-xl px-6" onClick={() => setAberto(true)} disabled={status === undefined}>
          {t("telegramConectar")}
        </Button>
      )}
      <TelegramDialog aberto={aberto} onFechar={() => setAberto(false)} />
    </section>
  );
}
