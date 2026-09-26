import { createContext, useContext, useState, type CSSProperties } from "react";
import { Check, Pencil, StickyNote, Trash2, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/contexts/LocaleContext";
import { executar } from "@/lib/acoes";
import { notesApi } from "@/lib/db";
import { useNotas, type NotaAoVivo } from "@/lib/aoVivo";
import { cn } from "@/lib/utils";
import { Cabecalho, IconePagina } from "../Cabecalho";
import { BotaoIcone, Esqueleto } from "../ui";

// ----------------------------------------------
// Mural de post-its
// ----------------------------------------------
// A cor gravada em cada nota continua sendo a classe que o celular usa
// ("bg-widget-goals/20"...). Aqui ela só escolhe a cor do papel.

const PAPEIS: { classe: string; papel: string; dobra: string; nome: string }[] = [
  { classe: "bg-widget-goals/20", papel: "#ffe99a", dobra: "#f3d56d", nome: "corAmarelo" },
  { classe: "bg-widget-notes/20", papel: "#ffd4e2", dobra: "#f7b5cb", nome: "corRosa" },
  { classe: "bg-widget-tasks/20", papel: "#c9f1e3", dobra: "#a3e2cc", nome: "corVerde" },
  { classe: "bg-widget-habits/20", papel: "#e2d9ff", dobra: "#cbbdfb", nome: "corLilas" },
];

const papelDe = (classe: string) => PAPEIS.find((p) => p.classe === classe) ?? PAPEIS[0];

/** Cada nota ganha sempre a mesma inclinação e o mesmo alfinete (pelo id). */
function sorteio(id: string) {
  // FNV-1a com uma misturada no fim: ids parecidos ("abc1", "abc2") caem longe.
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h = (h ^ (h >>> 15)) >>> 0;
  const giros = [-3, 2, -1.5, 2.8, -2.4, 1.2, -0.8, 3.2];
  const alfinetes = ["#e5484d", "#3e8ef7", "#12a58a", "#f5a524", "#8e6cf0"];
  return { giro: giros[h % giros.length], alfinete: alfinetes[Math.floor(h / giros.length) % alfinetes.length] };
}

function Alfinete({ cor }: { cor: string }) {
  return (
    <span
      aria-hidden
      className="absolute left-1/2 top-2 h-[15px] w-[15px] -translate-x-1/2 rounded-full"
      style={{
        background: `radial-gradient(circle at 35% 30%, #ffffffcc 0 2px, ${cor} 3px)`,
        boxShadow: "0 2px 3px rgba(40,20,0,.35), 1px 4px 5px rgba(40,20,0,.18)",
      }}
    />
  );
}

function estiloPapel(classe: string, giro = 0): CSSProperties {
  const { papel, dobra } = papelDe(classe);
  return {
    // Uma pontinha dobrada no canto de baixo.
    backgroundImage: `linear-gradient(to bottom, #ffffff40, transparent 35%), linear-gradient(135deg, ${papel} calc(100% - 20px), ${dobra} calc(100% - 20px))`,
    transform: `rotate(${giro}deg)`,
    boxShadow: "0 12px 18px -10px rgba(60,35,5,.45), 0 2px 4px rgba(60,35,5,.12)",
    color: "#3a2f1f",
  };
}

function Cores({ valor, onMudar }: { valor: string; onMudar: (classe: string) => void }) {
  const { t } = useLocale();
  const { compacto } = useFormato();
  return (
    <div className={cn("flex items-center", compacto ? "gap-1" : "gap-1.5")} role="radiogroup" aria-label={t("cor")}>
      {PAPEIS.map((p) => (
        <button
          key={p.classe}
          type="button"
          role="radio"
          aria-checked={valor === p.classe}
          aria-label={t(p.nome as "corAmarelo")}
          onClick={() => onMudar(p.classe)}
          className={cn(
            "rounded-full border border-black/10 transition-transform",
            compacto ? "h-4 w-4" : "h-5 w-5",
            valor === p.classe ? "scale-110 ring-2 ring-[#3a2f1f]/50 ring-offset-1 ring-offset-transparent" : "hover:scale-110"
          )}
          style={{ backgroundColor: p.papel }}
        />
      ))}
    </div>
  );
}

const TAMANHO = "w-[208px] min-h-[196px] xl:w-[222px] wide:w-[236px]";
/** No celular: duas colunas que ocupam a largura toda, papel um pouco menor. */
const TAMANHO_CELULAR = "w-full min-h-[150px]";

const Compacto = createContext(false);

function useFormato() {
  const compacto = useContext(Compacto);
  return {
    compacto,
    tamanho: compacto ? TAMANHO_CELULAR : TAMANHO,
    espaco: compacto ? "px-4 pb-3 pt-7" : "px-5 pb-4 pt-8",
    letra: compacto ? "text-[19px] leading-[1.15]" : "text-[21px] leading-[1.2]",
  };
}

function PostIt({ nota }: { nota: NotaAoVivo }) {
  const { t, locale } = useLocale();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(nota.content);
  const [cor, setCor] = useState(nota.color);
  const { giro: giroCheio, alfinete } = sorteio(nota.id);
  const { compacto, tamanho, espaco, letra } = useFormato();
  // No celular, menos torto: com duas colunas, inclinar muito encosta no vizinho.
  const giro = compacto ? giroCheio * 0.5 : giroCheio;

  const abrir = () => {
    setTexto(nota.content);
    setCor(nota.color);
    setEditando(true);
  };
  const salvar = async () => {
    if (!texto.trim()) return;
    const ok = await executar(() => notesApi.update(nota.id, { content: texto.trim(), color: cor }), { erro: t("erroAoSalvar") });
    if (ok !== null) setEditando(false);
  };
  const excluir = () => executar(() => notesApi.delete(nota.id), { erro: t("erroAoExcluir") });

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-[3px] transition-[transform,box-shadow] duration-200 animate-fade-in",
        "hover:z-10 hover:!rotate-0 hover:scale-[1.04] focus-within:z-10 focus-within:!rotate-0",
        espaco,
        tamanho
      )}
      style={estiloPapel(editando ? cor : nota.color, editando ? 0 : giro)}
    >
      <Alfinete cor={alfinete} />
      {editando ? (
        <>
          <Textarea
            autoFocus
            value={texto}
            aria-label={t("notesEdit")}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) salvar();
              if (e.key === "Escape") setEditando(false);
            }}
            className={cn(
              "min-h-[110px] flex-1 resize-none border-0 bg-white/40 p-2 font-script text-[#3a2f1f] shadow-none focus-visible:ring-1 focus-visible:ring-[#3a2f1f]/30",
              letra
            )}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
            <Cores valor={cor} onMudar={setCor} />
            <div className="ml-auto flex">
              <BotaoIcone rotulo={t("cancel")} onClick={() => setEditando(false)} className="h-7 w-7 text-[#3a2f1f]/70 hover:bg-black/5 hover:text-[#3a2f1f]">
                <X className="h-4 w-4" />
              </BotaoIcone>
              <BotaoIcone rotulo={t("save")} onClick={salvar} className="h-7 w-7 text-[#3a2f1f] hover:bg-black/5">
                <Check className="h-4 w-4" />
              </BotaoIcone>
            </div>
          </div>
        </>
      ) : (
        <>
          <p
            className={cn("flex-1 whitespace-pre-wrap break-words font-script", letra, compacto && "cursor-text")}
            onClick={compacto ? abrir : undefined}
          >
            {nota.content}
          </p>
          <div className="mt-3 flex h-7 items-center justify-between">
            {nota.criadaEm && (
              <span className="text-[11px] font-medium text-[#3a2f1f]/55">
                {nota.criadaEm.toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", { day: "numeric", month: "short" })}
              </span>
            )}
            <div
              className={cn(
                "ml-auto flex transition-opacity group-focus-within:opacity-100 group-hover:opacity-100",
                compacto ? "opacity-70" : "opacity-0"
              )}
            >
              <BotaoIcone rotulo={t("notesEdit")} onClick={abrir} className="h-7 w-7 text-[#3a2f1f]/70 hover:bg-black/5 hover:text-[#3a2f1f]">
                <Pencil className="h-3.5 w-3.5" />
              </BotaoIcone>
              <BotaoIcone rotulo={t("notesDelete")} onClick={excluir} className="h-7 w-7 text-[#3a2f1f]/70 hover:bg-black/5 hover:text-rose-700">
                <Trash2 className="h-3.5 w-3.5" />
              </BotaoIcone>
            </div>
          </div>
        </>
      )}
    </article>
  );
}

/** O primeiro papel do mural: em branco, pronto para escrever. */
function NovoPostIt() {
  const { t } = useLocale();
  const [texto, setTexto] = useState("");
  const [cor, setCor] = useState(PAPEIS[0].classe);
  const { tamanho, espaco, letra } = useFormato();

  const colar = async () => {
    if (!texto.trim()) return;
    const ok = await executar(() => notesApi.create({ content: texto.trim(), color: cor }), { erro: t("erroAoAdicionar") });
    if (ok) setTexto("");
  };

  return (
    <div className={cn("relative flex flex-col rounded-[3px]", espaco, tamanho)} style={estiloPapel(cor)}>
      <span
        aria-hidden
        className="absolute -top-2.5 left-1/2 h-6 w-[88px] -translate-x-1/2 -rotate-2 rounded-[2px] bg-white/55 shadow-sm backdrop-blur-[1px]"
      />
      <Textarea
        placeholder={t("postItPlaceholder")}
        aria-label={t("notesPlaceholder")}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.ctrlKey || e.metaKey) && colar()}
        className={cn(
          "min-h-[96px] flex-1 resize-none border-0 bg-transparent p-0 font-script text-[#3a2f1f] shadow-none placeholder:text-[#3a2f1f]/45 focus-visible:ring-0",
          letra
        )}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <Cores valor={cor} onMudar={setCor} />
        <button
          type="button"
          onClick={colar}
          disabled={!texto.trim()}
          title={`${t("colarNoMural")} · ${t("atalhoSalvar")}`}
          className="ml-auto whitespace-nowrap rounded-full bg-[#3a2f1f] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          {t("colar")}
        </button>
      </div>
    </div>
  );
}

/** O mural com os post-its. `compacto` = celular (duas colunas). */
export function MuralNotas({ compacto = false }: { compacto?: boolean }) {
  const { t } = useLocale();
  const { itens, pronto } = useNotas();

  return (
    <Compacto.Provider value={compacto}>
      <section
        aria-label={t("muralNotas")}
        className={cn("mural", compacto ? "min-h-[60vh] rounded-3xl p-5" : "rounded-[28px] p-6 wide:p-8")}
      >
        {!pronto ? (
          <Esqueleto linhas={3} />
        ) : (
          <div
            className={
              compacto
                ? "grid grid-cols-2 items-start gap-x-4 gap-y-6"
                : "flex flex-wrap content-start items-start gap-x-6 gap-y-7 wide:gap-x-8 wide:gap-y-9"
            }
          >
            <NovoPostIt />
            {itens.map((n) => (
              <PostIt key={n.id} nota={n} />
            ))}
          </div>
        )}
        {pronto && itens.length === 0 && (
          <p className="mt-6 text-center font-script text-2xl text-[#6b5337] dark:text-[#d9c3a3]">{t("muralVazio")}</p>
        )}
      </section>
    </Compacto.Provider>
  );
}

export default function NotasDesktop() {
  const { t } = useLocale();
  const { itens } = useNotas();

  return (
    <>
      <Cabecalho
        icone={<IconePagina Icone={StickyNote} />}
        titulo={t("tabNotas")}
        subtitulo={`${itens.length} ${t("notesSubtitle")} · ${t("notasSubtitulo")}`}
      />
      <MuralNotas />
    </>
  );
}
