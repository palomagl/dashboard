import { useMemo, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useDias } from "@/lib/aoVivo";
import { dayKey } from "@/lib/dates";
import { Cabecalho, IconePagina } from "../Cabecalho";
import { HabitosCard, TarefasCard } from "../cards/Rotina";
import { FocoCard, FraseRotina, RotinaSemanaCard, SemanaCard } from "../cards/RotinaCards";

/** Os 7 dias (segunda a domingo) da semana de hoje, voltando `atras` semanas. */
function semanaDe(atras: number): string[] {
  const hoje = new Date();
  const segunda = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  segunda.setDate(segunda.getDate() - ((segunda.getDay() + 6) % 7) - atras * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(segunda);
    d.setDate(segunda.getDate() + i);
    return dayKey(d);
  });
}

export default function RotinaDesktop() {
  const { t } = useLocale();
  const [atras, setAtras] = useState(0);
  const semana = useMemo(() => semanaDe(atras), [atras]);
  const { dias } = useDias(semana[0], semana[6]);

  return (
    <>
      <Cabecalho icone={<IconePagina Icone={CalendarCheck} />} titulo={t("navRotina")} subtitulo={t("rotinaSubtitulo")} />

      <div className="space-y-4 wide:space-y-5">
        <SemanaCard
          semana={semana}
          dias={dias}
          ehSemanaAtual={atras === 0}
          onAnterior={() => setAtras((a) => a + 1)}
          onProxima={() => setAtras((a) => Math.max(0, a - 1))}
          onHoje={() => setAtras(0)}
        />
        <div className="grid grid-cols-12 items-stretch gap-4 wide:gap-5">
          <TarefasCard comFiltros className="col-span-7 min-w-0" />
          <HabitosCard className="col-span-5 min-w-0" />
        </div>
        <div className="grid grid-cols-12 items-stretch gap-4 wide:gap-5">
          <div className="col-span-7 grid min-w-0">
            <RotinaSemanaCard semana={semana} dias={dias} />
          </div>
          <FocoCard className="col-span-5 min-w-0" />
        </div>
        <FraseRotina />
      </div>
    </>
  );
}
