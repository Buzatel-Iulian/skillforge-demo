"use client";

/**
 * Preferințe → General → Appearance: singurul loc din care se schimbă tema.
 *
 * DE CE trei opțiuni și nu un comutator light/dark:
 * „sistem" nu e o a treia culoare, e o delegare — „fă ce face sistemul meu de operare".
 * Fără ea, cineva care ține laptopul pe schimbare automată la apus ar trebui să vină să
 * schimbe tema manual de două ori pe zi. E și valoarea implicită, pentru că nu presupunem
 * nimic despre preferința utilizatorului până n-o exprimă.
 *
 * DE CE `ToggleGroup` și nu un `select`:
 * sunt trei opțiuni scurte, exclusive, cu iconițe recognoscibile. Toate vizibile deodată =
 * o alegere, nu o căutare. Un `select` ar ascunde două din trei opțiuni în spatele unui click.
 */

import { Monitor, Moon, Sun } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/useAppStore";
import type { ThemePreference } from "@/lib/types";

/**
 * Registrul de opțiuni de temă.
 * DE CE tablou și nu trei `ToggleGroupItem` scrise de mână: eticheta, iconița și valoarea stau
 * împreună, deci nu se pot desincroniza. Iar dacă apare o a patra temă („contrast ridicat"),
 * se adaugă o linie.
 */
const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Monitor }[] = [
  { value: "sistem", label: "Sistem", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon }
];

/**
 * DE CE avem nevoie de o verificare de tip, deși valorile vin din registrul nostru:
 * `ToggleGroup` lucrează cu `string[]` (e generic, pentru orice set de opțiuni), deci TypeScript
 * nu poate ști singur că valoarea primită e una dintre cele trei teme. Garda asta face
 * conversia explicită și verificabilă — alternativa ar fi un `as ThemePreference` care ar
 * ascunde exact greșeala pe care vrem s-o prindem (o valoare adăugată în UI și uitată în tip).
 */
function isThemePreference(value: string): value is ThemePreference {
  return THEME_OPTIONS.some(option => option.value === value);
}

export function AppearanceForm() {
  const theme = useAppStore(state => state.theme);
  const setTheme = useAppStore(state => state.setTheme);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-col gap-1">
        <Label>Appearance</Label>
        <p className="text-xs text-muted-foreground">
          „Sistem” urmărește setarea sistemului de operare și se schimbă fără refresh.
        </p>
      </div>

      {/*
        DE CE `value` e un tablou și `onValueChange` primește un tablou:
        ToggleGroup din Base UI e construit pentru selecție multiplă, iar cazul cu o singură
        valoare e doar tabloul de lungime 1. `next` poate fi și `undefined` — când utilizatorul
        apasă opțiunea deja activă. Atunci nu schimbăm nimic: o temă trebuie să rămână aleasă.
      */}
      <ToggleGroup
        value={[theme]}
        onValueChange={([next]) => {
          if (next && isThemePreference(next)) setTheme(next);
        }}
        variant="outline"
        aria-label="Tema aplicației"
      >
        {THEME_OPTIONS.map(option => (
          <ToggleGroupItem key={option.value} value={option.value} aria-label={option.label}>
            <option.icon />
            <span className="hidden sm:inline">{option.label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
