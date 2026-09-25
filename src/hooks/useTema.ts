import { useCallback, useSyncExternalStore } from "react";

// O tema mora numa classe do <html> (index.html aplica o salvo antes de
// renderizar). Observar a classe deixa todos os botões de tema — o do
// cabeçalho e o do menu do perfil — sempre de acordo entre si.
function assinar(avisar: () => void) {
  const obs = new MutationObserver(avisar);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

export function useTema() {
  const escuro = useSyncExternalStore(
    assinar,
    () => document.documentElement.classList.contains("dark"),
    () => false
  );

  const alternar = useCallback(() => {
    const proximo = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", proximo);
    try {
      localStorage.setItem("theme", proximo ? "dark" : "light");
    } catch {
      /* storage bloqueado: vale só nesta sessão */
    }
  }, []);

  return { escuro, alternar };
}
