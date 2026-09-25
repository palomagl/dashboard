// ==============================================
// Metas
// ==============================================
// Uma meta mede o que faz sentido para ela: "Ler 6 livros" anda de livro em
// livro, "Intercâmbio" anda em reais guardados. E cada uma tem o seu prazo:
// um mês específico ("até dez/2026") ou longo prazo, sem data.
//
// As metas antigas só tinham um texto de objetivo ("R$ 5.000"), um texto de
// prazo ("Dez/2026") e uma porcentagem. `lerMeta` entende esses textos, então
// elas aparecem do jeito novo sem precisar migrar nada no banco.

import { dayKey } from "./dates";
import type { Goal, TipoMeta } from "./db";

export type { TipoMeta };

export interface MetaVista {
  id: string;
  titulo: string;
  icone: string;
  tipo: TipoMeta;
  /** Aonde quer chegar (6 livros, 30000 reais). Em "porcentagem", 100. */
  alvo: number;
  /** Onde está agora, na mesma unidade do alvo. */
  atual: number;
  unidade: string;
  /** 0 a 100. */
  pct: number;
  concluida: boolean;
  /** "YYYY-MM" (vale até o fim desse mês), ou null = longo prazo. */
  prazo: string | null;
  /** O texto antigo de prazo, quando não deu para entender como mês. */
  prazoTexto: string | null;
  /** Meses até o prazo, contando o mês atual (mínimo 1). null sem prazo. */
  mesesRestantes: number | null;
  prazoPassou: boolean;
  /** Termina em até 12 meses? Se não, é longo prazo. */
  curtoPrazo: boolean;
  falta: number;
  /** Quanto precisa andar por mês para chegar no prazo. */
  porMes: number | null;
}

const MESES_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_EN = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Ícones que a pessoa pode escolher (emoji: cada meta com a sua cara). */
export const ICONES_META = ["🎯", "📚", "✈️", "💰", "🏠", "🚗", "🎓", "💪", "🏃‍♀️", "🧘‍♀️", "💻", "🎨", "🎸", "🌱", "❤️", "⭐"];

const SUGESTOES: [RegExp, string][] = [
  [/livro|\bler\b|leitura|book|read/i, "📚"],
  [/interc[aâ]mbio|viag|viaj|europa|trip|travel|passagem/i, "✈️"],
  [/reserva|guardar|poupa|econom|invest|emerg|saving/i, "💰"],
  [/casa|ap(to|artamento)|morar|home|house/i, "🏠"],
  [/carro|moto|cnh|habilita|\bcar\b/i, "🚗"],
  [/curso|faculdade|formar|estud|prova|ingl[eê]s|idioma|english|study/i, "🎓"],
  [/corr|maratona|\bkm\b|run/i, "🏃‍♀️"],
  [/academia|treino|muscula|emagre|\bkg\b|gym|workout/i, "💪"],
  [/medita|yoga/i, "🧘‍♀️"],
  [/notebook|computador|laptop|celular|phone/i, "💻"],
  [/desenh|pint|arte|art/i, "🎨"],
  [/viol[aã]o|guitarra|m[uú]sica|music/i, "🎸"],
];

export function sugerirIcone(titulo: string): string {
  return SUGESTOES.find(([re]) => re.test(titulo))?.[1] ?? "🎯";
}

/** "30 mil", "30k", "R$ 30.000,00", "1.5" -> número. */
export function lerNumero(texto: string): number | null {
  let t = texto.trim().toLowerCase().replace(/^r\$\s*/, "");
  let mult = 1;
  if (/\s*mil$/.test(t)) {
    mult = 1000;
    t = t.replace(/\s*mil$/, "");
  } else if (/k$/.test(t)) {
    mult = 1000;
    t = t.replace(/k$/, "");
  }
  // "30.000" e "30.000,50" usam ponto de milhar; "1.5" é decimal.
  const normal = t.includes(",")
    ? t.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(t)
      ? t.replace(/\./g, "")
      : t;
  const n = Number(normal);
  return normal !== "" && Number.isFinite(n) ? n * mult : null;
}

/** O texto de objetivo das metas antigas: "R$ 5.000" -> dinheiro, "12 livros" -> quantidade. */
export function interpretarObjetivo(texto: string): { tipo: TipoMeta; alvo: number; unidade: string } | null {
  const limpo = texto.trim();
  if (!limpo) return null;
  if (/^r\$/i.test(limpo) || /\breais\b/i.test(limpo)) {
    const n = lerNumero(limpo.replace(/\breais\b/i, "").trim());
    return n && n > 0 ? { tipo: "dinheiro", alvo: n, unidade: "" } : null;
  }
  const m = limpo.match(/^([\d.,]+\s*(?:mil|k)?)\s*(.*)$/i);
  if (!m) return null;
  const n = lerNumero(m[1]);
  if (!n || n <= 0) return null;
  return { tipo: "quantidade", alvo: n, unidade: m[2].trim() };
}

/** "Dez/2026", "12/2026", "dezembro de 2026", "2027" -> "YYYY-MM". */
export function lerPrazoTexto(texto: string): string | null {
  const t = texto.trim().toLowerCase();
  if (!t) return null;
  const numerico = t.match(/^(\d{1,2})\s*[/-]\s*(\d{4})$/);
  if (numerico) {
    const mes = Number(numerico[1]);
    return mes >= 1 && mes <= 12 ? `${numerico[2]}-${String(mes).padStart(2, "0")}` : null;
  }
  const iso = t.match(/^(\d{4})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}`;
  const soAno = t.match(/^(\d{4})$/);
  if (soAno) return `${soAno[1]}-12`;
  const nome = t.match(/^([a-zç]{3})[a-zç]*\.?\s*(?:\/|de|-)?\s*(\d{4})$/);
  if (nome) {
    const i = MESES_PT.indexOf(nome[1]) >= 0 ? MESES_PT.indexOf(nome[1]) : MESES_EN.indexOf(nome[1]);
    return i >= 0 ? `${nome[2]}-${String(i + 1).padStart(2, "0")}` : null;
  }
  return null;
}

/** "2026-12" -> "dez/2026". */
export function mesCurto(prazo: string, locale: string = "pt"): string {
  const [ano, mes] = prazo.split("-").map(Number);
  return `${(locale === "pt" ? MESES_PT : MESES_EN)[mes - 1]}/${ano}`;
}

/** Soma meses a "YYYY-MM". */
export function somarMesesAoMes(mes: string, n: number): string {
  const [a, m] = mes.split("-").map(Number);
  const total = a * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

function mesesAte(prazo: string, hoje: string): number {
  const [a1, m1] = hoje.split("-").map(Number);
  const [a2, m2] = prazo.split("-").map(Number);
  return (a2 - a1) * 12 + (m2 - m1) + 1;
}

export function progressoDe(atual: number, alvo: number): number {
  if (alvo <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((atual / alvo) * 100)));
}

/** A meta como a tela usa, venha ela do jeito novo ou do antigo. */
export function lerMeta(g: Goal, hoje: string = dayKey()): MetaVista {
  let tipo: TipoMeta;
  let alvo: number;
  let atual: number;
  let unidade = g.unidade ?? "";

  if (g.tipo && g.tipo !== "porcentagem" && g.alvo && g.alvo > 0) {
    tipo = g.tipo;
    alvo = g.alvo;
    atual = g.atual ?? 0;
  } else if (g.tipo === "porcentagem") {
    tipo = "porcentagem";
    alvo = 100;
    atual = g.progress ?? 0;
  } else {
    // Meta antiga: tenta entender o texto do objetivo.
    const lido = interpretarObjetivo(g.target ?? "");
    if (lido) {
      tipo = lido.tipo;
      alvo = lido.alvo;
      unidade = lido.unidade;
      const bruto = ((g.progress ?? 0) / 100) * alvo;
      atual = tipo === "quantidade" ? Math.round(bruto) : Math.round(bruto * 100) / 100;
    } else {
      tipo = "porcentagem";
      alvo = 100;
      atual = g.progress ?? 0;
    }
  }

  const prazo = g.prazo !== undefined ? g.prazo : lerPrazoTexto(g.deadline ?? "");
  const pct = tipo === "porcentagem" ? Math.max(0, Math.min(100, atual)) : progressoDe(atual, alvo);
  const concluida = pct >= 100;
  const meses = prazo ? mesesAte(prazo, hoje) : null;
  const falta = Math.max(0, alvo - atual);

  return {
    id: g.id,
    titulo: g.title,
    icone: g.icone || sugerirIcone(g.title),
    tipo,
    alvo,
    atual,
    unidade,
    pct,
    concluida,
    prazo,
    prazoTexto: !prazo && g.deadline && g.prazo === undefined ? g.deadline : null,
    mesesRestantes: meses === null ? null : Math.max(1, meses),
    prazoPassou: meses !== null && meses < 1 && !concluida,
    curtoPrazo: meses !== null && meses <= 12,
    falta,
    porMes: meses !== null && !concluida ? falta / Math.max(1, meses) : null,
  };
}

/** Os campos antigos (texto de objetivo e prazo), gravados junto para o que ainda lê só eles. */
export function textosLegados(
  dados: { tipo: TipoMeta; alvo: number; unidade: string; prazo: string | null; objetivoTexto?: string },
  locale: string,
  semPrazo: string
): { target: string; deadline: string } {
  const target =
    dados.tipo === "dinheiro"
      ? `R$ ${dados.alvo.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`
      : dados.tipo === "quantidade"
        ? `${dados.alvo.toLocaleString("pt-BR")} ${dados.unidade}`.trim()
        : dados.objetivoTexto?.trim() || "100%";
  return { target, deadline: dados.prazo ? mesCurto(dados.prazo, locale) : semPrazo };
}
