import { useTelaGrande } from "@/hooks/useTelaGrande";
import { useLocale } from "@/contexts/LocaleContext";
import { useNotas } from "@/lib/aoVivo";
import NotasDesktop, { MuralNotas } from "@/desktop/paginas/Notas";

export default function Notas() {
  const telaGrande = useTelaGrande();
  const { t } = useLocale();
  const { itens } = useNotas();
  if (telaGrande) return <NotasDesktop />;

  // No celular, o mesmo mural de post-its, em duas colunas.
  return (
    <div className="max-w-2xl space-y-3">
      <div className="px-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <span className="h-2 w-2 rounded-full bg-widget-notes" />
          {t("tabNotas")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {itens.length} {t("notesSubtitle")} · {t("notasSubtitulo")}
        </p>
      </div>
      <MuralNotas compacto />
    </div>
  );
}
