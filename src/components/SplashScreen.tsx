import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

// Quanto tempo a marca fica na tela, no mínimo, e quanto dura o desaparecer.
//
// Ela não é enfeite: cobre o tempo real em que o Firebase restaura a sessão do
// IndexedDB. Só que esse tempo varia de 100ms a meio segundo, e uma splash que
// pisca parece defeito. O mínimo existe para ela parecer intencional.
//
// Mexa aqui se achar lenta ou rápida demais. Acima de ~1s começa a irritar num
// app que você abre dez vezes por dia para marcar uma coisa e fechar.
const MINIMO_MS = 700;
const FADE_MS = 300;

// Medido a partir do carregamento do app, não da montagem do componente: o que
// importa é quanto tempo a pessoa já esperou desde que tocou no ícone.
const INICIO = Date.now();

export function SplashScreen({ pronto }: { pronto: boolean }) {
  const [visivel, setVisivel] = useState(true);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    if (!pronto) return;

    const espera = Math.max(0, MINIMO_MS - (Date.now() - INICIO));
    const comecarASair = setTimeout(() => setSaindo(true), espera);
    const sumir = setTimeout(() => setVisivel(false), espera + FADE_MS);

    return () => {
      clearTimeout(comecarASair);
      clearTimeout(sumir);
    };
  }, [pronto]);

  if (!visivel) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background
        transition-opacity ease-out ${saindo ? "opacity-0" : "opacity-100"}`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <Logo className="w-20 h-20 animate-fade-in motion-reduce:animate-none" />
      <p
        className="mt-5 text-sm font-semibold tracking-[0.2em] uppercase text-foreground/80
          animate-fade-in motion-reduce:animate-none [animation-delay:150ms] [animation-fill-mode:backwards]"
      >
        Minha Rotina
      </p>
    </div>
  );
}
