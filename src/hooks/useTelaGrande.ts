import { useSyncExternalStore } from "react";

/** Acompanha uma media query ao vivo (redimensionar a janela troca o valor). */
export function useMedia(consulta: string): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const mql = window.matchMedia(consulta);
      mql.addEventListener("change", avisar);
      return () => mql.removeEventListener("change", avisar);
    },
    () => window.matchMedia(consulta).matches,
    () => false
  );
}

/**
 * Notebook ou monitor: a partir de 1024px o app troca para o layout com menu
 * lateral (src/desktop). Abaixo disso fica o layout de celular de sempre.
 */
export function useTelaGrande(): boolean {
  return useMedia("(min-width: 1024px)");
}
