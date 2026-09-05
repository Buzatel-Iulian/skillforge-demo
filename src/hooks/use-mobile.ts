import * as React from "react";

/**
 * Spune dacă suntem pe ecran mic. Sidebar-ul o folosește ca să devină `Sheet` pe mobil.
 *
 * DE CE fișierul ăsta e adaptat față de varianta generată de shadcn:
 * varianta originală apela `setState` direct în corpul unui `useEffect`, ceea ce provoacă o
 * a doua randare imediat după prima (și e semnalat ca eroare de regulile React 19 din ESLint).
 *
 * DE CE `useSyncExternalStore` e răspunsul corect aici:
 * `matchMedia` e exact ce descrie numele hook-ului — o stare care trăiește în afara lui React.
 * Cu el, React citește valoarea când are nevoie și se reabonează singur, fără randare în plus.
 * Bonus: primește un „snapshot de server", deci nu mai trebuie ghicit ce se întâmplă la SSR.
 *
 * DE CE presupunem desktop pe server (`false`):
 * pe server nu există viewport, deci nu se poate ști. Presupunem desktop — la fel ca varianta
 * shadcn — iar prima randare din browser corectează valoarea dacă e nevoie.
 */
const MOBILE_BREAKPOINT = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onStoreChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

function getSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
