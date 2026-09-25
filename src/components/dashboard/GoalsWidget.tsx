import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Goal } from "@/lib/db";
import { useMetas } from "@/lib/aoVivo";
import { useLocale } from "@/contexts/LocaleContext";
import { ListaMetas } from "@/components/metas/Metas";
import { MetaDialog } from "@/desktop/Formularios";

// Metas no celular (aba Progresso): a mesma lista do computador — cada meta
// na sua unidade (livros, reais...), separada por prazo — e o mesmo
// formulário para criar e editar.
export function GoalsWidget() {
  const { t } = useLocale();
  const { itens, pronto } = useMetas();
  const [dialogo, setDialogo] = useState<{ aberto: boolean; meta?: Goal }>({ aberto: false });
  const ativas = itens.filter((m) => m.progress < 100).length;

  return (
    <div className="glass-card glass-card-hover rounded-xl p-5 animate-fade-in" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-widget-goals" />
            {t("metasTitulo")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {ativas} {t("goalsSubtitle")}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setDialogo({ aberto: true })} aria-label={t("goalsAdd")}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {pronto && itens.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">{t("goalsEmpty")}</div>
      ) : (
        <ListaMetas metas={itens} onEditar={(m) => setDialogo({ aberto: true, meta: m })} className="pt-2" />
      )}

      <MetaDialog aberto={dialogo.aberto} inicial={dialogo.meta} onFechar={() => setDialogo({ aberto: false })} />
    </div>
  );
}
