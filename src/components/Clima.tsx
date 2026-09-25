import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { CIDADE, type Ceu, type Clima } from "@/lib/clima";
import type { TranslationKey } from "@/lib/translations";

interface Visual {
  Icone: LucideIcon;
  /** Fundo suave + cor do ícone. */
  classe: string;
  /** Anel em volta do círculo (a "aura"), em hsl com transparência. */
  aura: string;
}

const SOL: Visual = { Icone: Sun, classe: "bg-amber-400/15 text-amber-500", aura: "hsl(43 96% 56% / 0.08)" };
const LUA: Visual = { Icone: Moon, classe: "bg-indigo-500/10 text-indigo-500", aura: "hsl(239 84% 67% / 0.06)" };

const VISUAIS: Record<Ceu, { dia: Visual; noite: Visual }> = {
  limpo: { dia: SOL, noite: LUA },
  poucasNuvens: {
    dia: { Icone: CloudSun, classe: "bg-amber-400/15 text-amber-500", aura: "hsl(43 96% 56% / 0.08)" },
    noite: { Icone: CloudMoon, classe: "bg-indigo-500/10 text-indigo-500", aura: "hsl(239 84% 67% / 0.06)" },
  },
  nublado: {
    dia: { Icone: Cloud, classe: "bg-slate-400/15 text-slate-500 dark:text-slate-300", aura: "hsl(215 16% 57% / 0.08)" },
    noite: { Icone: Cloud, classe: "bg-slate-400/15 text-slate-500 dark:text-slate-300", aura: "hsl(215 16% 57% / 0.08)" },
  },
  neblina: {
    dia: { Icone: CloudFog, classe: "bg-slate-400/15 text-slate-500 dark:text-slate-300", aura: "hsl(215 16% 57% / 0.08)" },
    noite: { Icone: CloudFog, classe: "bg-slate-400/15 text-slate-500 dark:text-slate-300", aura: "hsl(215 16% 57% / 0.08)" },
  },
  garoa: {
    dia: { Icone: CloudDrizzle, classe: "bg-sky-400/15 text-sky-500", aura: "hsl(199 89% 60% / 0.08)" },
    noite: { Icone: CloudDrizzle, classe: "bg-sky-400/15 text-sky-500", aura: "hsl(199 89% 60% / 0.08)" },
  },
  chuva: {
    dia: { Icone: CloudRain, classe: "bg-blue-500/15 text-blue-500", aura: "hsl(217 91% 60% / 0.08)" },
    noite: { Icone: CloudRain, classe: "bg-blue-500/15 text-blue-500", aura: "hsl(217 91% 60% / 0.08)" },
  },
  neve: {
    dia: { Icone: CloudSnow, classe: "bg-cyan-400/15 text-cyan-500", aura: "hsl(188 86% 53% / 0.08)" },
    noite: { Icone: CloudSnow, classe: "bg-cyan-400/15 text-cyan-500", aura: "hsl(188 86% 53% / 0.08)" },
  },
  tempestade: {
    dia: { Icone: CloudLightning, classe: "bg-violet-500/15 text-violet-500", aura: "hsl(258 90% 66% / 0.08)" },
    noite: { Icone: CloudLightning, classe: "bg-violet-500/15 text-violet-500", aura: "hsl(258 90% 66% / 0.08)" },
  },
};

const ROTULO_CEU: Record<Ceu, TranslationKey> = {
  limpo: "ceuLimpo",
  poucasNuvens: "ceuPoucasNuvens",
  nublado: "ceuNublado",
  neblina: "ceuNeblina",
  garoa: "ceuGaroa",
  chuva: "ceuChuva",
  neve: "ceuNeve",
  tempestade: "ceuTempestade",
};

/** O visual do céu agora; sem clima (carregando ou sem internet), sol ou lua pela hora. */
export function visualDoCeu(clima: Clima | null): Visual {
  if (!clima) {
    const hora = new Date().getHours();
    return hora >= 18 || hora < 6 ? LUA : SOL;
  }
  return VISUAIS[clima.ceu][clima.dia ? "dia" : "noite"];
}

/** "18° · nublado em Sapiranga". */
export function useResumoClima(clima: Clima | null): string | null {
  const { t } = useLocale();
  if (!clima) return null;
  return t("climaResumo")
    .replace("{temp}", String(clima.temperatura))
    .replace("{ceu}", t(ROTULO_CEU[clima.ceu]))
    .replace("{cidade}", CIDADE.nome);
}
