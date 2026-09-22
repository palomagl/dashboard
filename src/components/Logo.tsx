// A marca do app. Desenhada inline em vez de <img src="logo.svg"> para herdar
// tamanho do contexto, não piscar enquanto carrega e funcionar dentro da splash
// antes de qualquer requisição de rede.
//
// As três cores são as mesmas do tema em index.css: teal (--widget-tasks),
// roxo (--widget-habits) e âmbar (--widget-goals).

let contador = 0;

export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  // Os ids dos gradientes precisam ser únicos: a logo aparece mais de uma vez
  // na mesma página, e ids repetidos fazem o navegador reusar o primeiro.
  const id = `logo-${contador++}`;

  return (
    <svg
      viewBox="4 7 56 53"
      className={className}
      role="img"
      aria-label="Minha Rotina"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${id}-teal`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2DD4BF" />
          <stop offset="1" stopColor="#0D9488" />
        </linearGradient>
        <linearGradient id={`${id}-roxo`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A78BFA" />
          <stop offset="1" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id={`${id}-ambar`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FBBF24" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id={`${id}-brilho`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.06" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path
        d="M15 9 H22 A9 9 0 0 1 31 18 V29 A5 5 0 0 1 26 34 H15 A9 9 0 0 1 6 25 V18 A9 9 0 0 1 15 9 Z"
        fill={`url(#${id}-teal)`}
      />
      <path
        d="M15 9 H22 A9 9 0 0 1 31 18 V29 A5 5 0 0 1 26 34 H15 A9 9 0 0 1 6 25 V18 A9 9 0 0 1 15 9 Z"
        fill={`url(#${id}-brilho)`}
      />

      <path
        d="M45 9 H48 A10 10 0 0 1 58 19 V22 A10 10 0 0 1 48 32 H39 A4 4 0 0 1 35 28 V19 A10 10 0 0 1 45 9 Z"
        fill={`url(#${id}-roxo)`}
      />
      <path
        d="M45 9 H48 A10 10 0 0 1 58 19 V22 A10 10 0 0 1 48 32 H39 A4 4 0 0 1 35 28 V19 A10 10 0 0 1 45 9 Z"
        fill={`url(#${id}-brilho)`}
      />

      <path
        d="M37 35 H48 A10 10 0 0 1 58 45 V48 A10 10 0 0 1 48 58 H43 A10 10 0 0 1 33 48 V39 A4 4 0 0 1 37 35 Z"
        fill={`url(#${id}-ambar)`}
      />
      <path
        d="M37 35 H48 A10 10 0 0 1 58 45 V48 A10 10 0 0 1 48 58 H43 A10 10 0 0 1 33 48 V39 A4 4 0 0 1 37 35 Z"
        fill={`url(#${id}-brilho)`}
      />
    </svg>
  );
}
