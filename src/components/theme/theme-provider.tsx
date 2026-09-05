"use client";

/**
 * Traduce preferința de temă a utilizatorului în clasa `.dark` pe `<html>`.
 *
 * DE CE există componenta asta, în loc să pună fiecare componentă clase de culoare:
 * în Tailwind v4 + shadcn, tema e un set de variabile CSS redefinite sub `.dark`
 * (vezi `globals.css`). Nimeni nu are nevoie să știe ce temă e activă — clasele `bg-background`
 * și `text-foreground` iau valoarea potrivită singure. Un singur loc atinge documentul: acesta.
 *
 * DE CE „sistem" nu e o a treia culoare, ci o regulă:
 * „sistem" înseamnă „urmează sistemul de operare". Trebuie ASCULTAT, nu doar citit o dată:
 * dacă utilizatorul trece macOS-ul pe dark la apus, aplicația trebuie să se schimbe fără
 * refresh. De aici listener-ul pe `matchMedia("(prefers-color-scheme: dark)")`.
 *
 * DE CE tema se schimbă DOAR din preferințe (nu există buton în header):
 * e o setare, nu o acțiune frecventă. Un buton permanent în header ar ocupa spațiu în zona în
 * care vrem doar conversația — iar cerința de produs e explicită: centrul rămâne curat.
 */

import { useEffect } from "react";
import { useAppStore, useStoreHydration } from "@/store/useAppStore";
import type { ResolvedTheme, ThemePreference } from "@/lib/types";

/** Interogarea sistemului de operare. Constantă, ca să nu apară scrisă greșit în două locuri. */
const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Din preferință + starea sistemului rezultă tema efectivă.
 * DE CE o funcție pură, exportată: e singura regulă de decizie a temei, deci trebuie să fie
 * citibilă separat de efectele React.
 */
export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === "sistem") return systemPrefersDark ? "dark" : "light";
  return preference;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore(state => state.theme);

  /**
   * DE CE ne interesează dacă starea a fost rehidratată:
   * înainte de rehidratare, `theme` e valoarea implicită („sistem"), nu alegerea salvată de
   * utilizator. Dacă am aplica-o, cineva care a ales „light" ar vedea o clipă tema sistemului.
   * (Scriptul din `layout.tsx` acoperă chiar și acea clipă, înainte de primul paint.)
   */
  const hydrated = useStoreHydration();

  useEffect(() => {
    if (!hydrated) return;

    const media = window.matchMedia(DARK_QUERY);

    const apply = () => {
      const resolved = resolveTheme(theme, media.matches);
      // `toggle` cu al doilea argument: adaugă clasa când e dark, o scoate când e light.
      document.documentElement.classList.toggle("dark", resolved === "dark");
      // `color-scheme` spune browserului cum să deseneze ce NU controlăm noi:
      // scrollbar-uri, câmpuri native, meniul de select.
      document.documentElement.style.colorScheme = resolved;
    };

    apply();

    /**
     * DE CE ne abonăm doar pe „sistem":
     * la „light" sau „dark" alegerea utilizatorului bate sistemul de operare, deci un eveniment
     * de la el nu trebuie să schimbe nimic. Abonamentul e și curățat la demontare — altfel, la
     * fiecare schimbare de temă am lăsa în urmă un listener care mai ascultă degeaba.
     */
    if (theme !== "sistem") return;

    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, hydrated]);

  return children;
}
