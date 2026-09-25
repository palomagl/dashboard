import { QuickNotes } from "@/components/dashboard/QuickNotes";
import { useTelaGrande } from "@/hooks/useTelaGrande";
import NotasDesktop from "@/desktop/paginas/Notas";

export default function Notas() {
  const telaGrande = useTelaGrande();
  if (telaGrande) return <NotasDesktop />;

  return (
    <div className="max-w-2xl">
      <QuickNotes />
    </div>
  );
}
