import { FinancesWidget } from "@/components/dashboard/FinancesWidget";
import { useTelaGrande } from "@/hooks/useTelaGrande";
import FinancasDesktop from "@/desktop/paginas/Financas";

export default function Financas() {
  const telaGrande = useTelaGrande();
  if (telaGrande) return <FinancasDesktop />;

  return (
    <div className="max-w-2xl">
      <FinancesWidget />
    </div>
  );
}
