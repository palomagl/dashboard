import { useEffect, useRef, useState } from "react";
import { Check, Copy, Send } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/contexts/LocaleContext";
import { telegramApi } from "@/lib/db";
import { useTelegram } from "@/lib/aoVivo";

/**
 * Vincular o Telegram sem sair da tela: gera o código (mesma rota que a
 * página Minha conta usa) e fecha sozinho quando o bot confirma o vínculo.
 */
export function TelegramDialog({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { t, locale } = useLocale();
  const status = useTelegram();
  const [codigo, setCodigo] = useState<{ codigo: string; expiraEm: Date } | null>(null);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);
  const estavaVinculado = useRef(!!status);

  // Vinculou enquanto a janela estava aberta: comemora e fecha.
  useEffect(() => {
    if (aberto && status && !estavaVinculado.current) {
      toast.success(t("telegramVinculadoAgora"));
      onFechar();
    }
    estavaVinculado.current = !!status;
  }, [status, aberto, onFechar, t]);

  useEffect(() => {
    if (!aberto) {
      setCodigo(null);
      setErro("");
      setCopiado(false);
    }
  }, [aberto]);

  const gerar = async () => {
    setErro("");
    setGerando(true);
    try {
      const resp = await telegramApi.gerarCodigo();
      setCodigo({ codigo: resp.codigo, expiraEm: new Date(resp.expiraEm) });
    } catch (e) {
      setErro((e as Error).message || t("accountErrorUnknown"));
    } finally {
      setGerando(false);
    }
  };

  const copiar = async () => {
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(`/start ${codigo.codigo}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* sem permissão de área de transferência: o texto está na tela */
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <span className="mb-2 grid h-12 w-12 place-items-center rounded-full bg-[#2AABEE]">
            <Send className="h-5 w-5 -translate-x-px translate-y-px text-white" />
          </span>
          <DialogTitle>{t("telegramConecteTitulo")}</DialogTitle>
          <DialogDescription>{t("accountTelegramDescription")}</DialogDescription>
        </DialogHeader>

        {erro && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{erro}</div>}

        {codigo ? (
          <div className="space-y-3 rounded-2xl bg-secondary p-5 text-center">
            <p className="text-xs text-muted-foreground">{t("accountTelegramInstructions")}</p>
            <div className="flex items-center justify-center gap-2">
              <code className="break-all font-mono text-xl font-bold tracking-wider">/start {codigo.codigo}</code>
              <button
                type="button"
                onClick={copiar}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-background hover:text-foreground"
                aria-label={t("copiar")}
                title={t("copiar")}
              >
                {copiado ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("accountTelegramExpiresAt")}{" "}
              {codigo.expiraEm.toLocaleTimeString(locale === "pt" ? "pt-BR" : "en-US", { hour: "2-digit", minute: "2-digit" })}
              {" · "}
              {t("telegramAguardando")}
            </p>
          </div>
        ) : (
          <Button className="h-11 w-full rounded-xl" onClick={gerar} disabled={gerando || status === undefined}>
            {gerando ? "..." : t("telegramGerarCodigo")}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
