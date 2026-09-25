import { useEffect, useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocale } from "@/contexts/LocaleContext";
import { billsApi, type Bill } from "@/lib/db";
import { cn } from "@/lib/utils";
import { contaDaLinha, lerPlanilha, planejarImportacao, type LinhaPlanilha } from "./contas";
import { dataDoDia } from "./formato";
import { ESTILO_TIPO } from "./cards/Contas";
import { useDinheiro } from "./valores";

/**
 * O Excel em português salva CSV em Windows-1252 quando não é "UTF-8": sem
 * isso, "Descrição" viraria "DescriÃ§Ã£o". Tenta UTF-8 e cai para 1252.
 */
async function lerTexto(arquivo: File): Promise<string> {
  const bytes = await arquivo.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

const TIPO_ROTULO: Record<string, string> = { fixa: "tipoFixa", parcela: "tipoParcela", cartao: "tipoCartao", avulsa: "tipoAvulsa" };

export function ImportarContasDialog({
  aberto,
  onFechar,
  existentes,
}: {
  aberto: boolean;
  onFechar: () => void;
  existentes: Bill[];
}) {
  const { t, locale } = useLocale();
  const dinheiro = useDinheiro();
  const entrada = useRef<HTMLInputElement>(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [lidas, setLidas] = useState<{ linhas: LinhaPlanilha[]; erros: string[] } | null>(null);
  const [importando, setImportando] = useState(false);
  const [arrastando, setArrastando] = useState(false);

  useEffect(() => {
    if (!aberto) {
      setLidas(null);
      setNomeArquivo("");
      setImportando(false);
    }
  }, [aberto]);

  const plano = useMemo(() => (lidas ? planejarImportacao(lidas.linhas, existentes) : null), [lidas, existentes]);

  const abrirArquivo = async (arquivo: File | undefined) => {
    if (!arquivo) return;
    setNomeArquivo(arquivo.name);
    setLidas(lerPlanilha(await lerTexto(arquivo)));
  };

  const importar = async () => {
    if (!plano) return;
    setImportando(true);
    try {
      await Promise.all([
        ...plano.novas.map((l) => billsApi.create(contaDaLinha(l))),
        ...plano.atualizar.map((a) => billsApi.update(a.id, a.mudancas)),
      ]);
      toast.success(
        t("importacaoFeita").replace("{novas}", String(plano.novas.length)).replace("{atualizadas}", String(plano.atualizar.length))
      );
      onFechar();
    } catch (erro) {
      console.error("Falha ao importar contas:", erro);
      toast.error(t("erroAoAdicionar"));
      setImportando(false);
    }
  };

  const situacaoDaLinha = (l: LinhaPlanilha) => {
    if (plano?.novas.includes(l)) return { texto: t("importNova"), classe: "bg-primary/10 text-primary" };
    if (plano?.atualizar.some((a) => a.linha === l)) return { texto: t("importAtualiza"), classe: "bg-amber-500/10 text-amber-700 dark:text-amber-400" };
    return { texto: t("importJaExiste"), classe: "bg-secondary text-muted-foreground" };
  };

  const total = plano ? plano.novas.length + plano.atualizar.length : 0;

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-w-3xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" /> {t("importarPlanilhaTitulo")}
          </DialogTitle>
          <DialogDescription>{t("importarPlanilhaTexto")}</DialogDescription>
        </DialogHeader>

        <input
          ref={entrada}
          type="file"
          accept=".csv,text/csv,.txt"
          className="hidden"
          onChange={(e) => abrirArquivo(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastando(false);
            abrirArquivo(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-6 text-sm transition-colors",
            arrastando ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          )}
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{nomeArquivo || t("escolherArquivo")}</span>
          <span className="text-xs text-muted-foreground">{t("formatoPlanilha")}</span>
        </button>

        {lidas && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                {t("importNovasN").replace("{n}", String(plano?.novas.length ?? 0))}
              </span>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-700 dark:text-amber-400">
                {t("importAtualizaN").replace("{n}", String(plano?.atualizar.length ?? 0))}
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-1 font-semibold text-muted-foreground">
                {t("importIguaisN").replace("{n}", String(plano?.iguais.length ?? 0))}
              </span>
            </div>

            {lidas.erros.length > 0 && (
              <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                {lidas.erros.slice(0, 4).map((e) => (
                  <p key={e}>{e}</p>
                ))}
                {lidas.erros.length > 4 && <p>+{lidas.erros.length - 4}</p>}
              </div>
            )}

            <div className="max-h-[320px] overflow-y-auto rounded-2xl border border-border/80">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-secondary text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-semibold">{t("data")}</th>
                    <th className="px-3 py-2 font-semibold">{t("financesDescription")}</th>
                    <th className="px-3 py-2 font-semibold">{t("tipo")}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t("financesAmount")}</th>
                    <th className="px-3 py-2 font-semibold">{t("situacao")}</th>
                    <th className="px-3 py-2 font-semibold" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {lidas.linhas.map((l) => {
                    const s = situacaoDaLinha(l);
                    return (
                      <tr key={l.linha} className={cn(s.texto === t("importJaExiste") && "opacity-60")}>
                        <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                          {dataDoDia(l.vencimento).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US")}
                        </td>
                        <td className="px-3 py-2">
                          {l.nome}
                          {l.parcela && <span className="ml-1 text-muted-foreground">{l.parcela}</span>}
                          <span className="block text-[11px] text-muted-foreground">{l.categoria}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-semibold", ESTILO_TIPO[l.tipo])}>
                            {t(TIPO_ROTULO[l.tipo] as "tipoFixa")}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums">
                          {dinheiro(l.valor, { centavos: true })}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs">{l.paga ? t("contaPaga") : t("filtroAPagar")}</td>
                        <td className="px-3 py-2">
                          <span className={cn("whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold", s.classe)}>{s.texto}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" className="rounded-xl" onClick={onFechar}>
            {t("cancel")}
          </Button>
          <Button className="rounded-xl" onClick={importar} disabled={!plano || total === 0 || importando}>
            {importando ? "..." : total === 0 && lidas ? t("nadaNovo") : t("importarN").replace("{n}", String(total))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
