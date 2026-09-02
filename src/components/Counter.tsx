"use client";

/**
 * Component CLIENT — rulează în browser.
 *
 * DE CE are nevoie de "use client" (și ce se întâmplă fără el):
 * în App Router totul e Server Component până ceri altfel. Un Server Component se execută
 * o dată, pe server, iar în browser ajunge doar HTML-ul rezultat — deci nu există nici
 * interactivitate, nici stare, nici ciclu de viață. `useState` are nevoie de exact ce
 * lipsește acolo: o instanță de React care trăiește în browser și poate re-randa după un
 * click. Fără directiva de sus, build-ul cade cu eroarea că un hook nu poate fi folosit
 * într-un Server Component ("You're importing a component that needs `useState`...").
 * Nu e o eroare de configurare — e granița dintre cele două lumi, semnalizată la timp.
 *
 * DE CE contează pentru SkillForge:
 * inputul de chat, butonul de „stop" în timpul streaming-ului și lista de mesaje care crește
 * token cu token sunt toate stare care se schimbă în browser. Vor fi componente client.
 * Cheia de API a providerului de LLM NU are ce căuta într-un astfel de fișier: tot codul
 * de aici ajunge, în clar, în bundle-ul trimis utilizatorului.
 *
 * "use client" nu înseamnă „doar în browser": componenta e randată o dată și pe server,
 * pentru HTML-ul inițial, apoi „hidratată" în browser. De asta valoarea de start (0) e
 * aceeași în ambele locuri — dacă aș porni de la `Math.random()`, serverul și clientul ar
 * produce rezultate diferite și React ar raporta o nepotrivire de hidratare.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Component client</span>
        <code className="font-mono text-xs text-muted-foreground">&quot;use client&quot;</code>
      </div>

      <p className="text-3xl font-semibold tabular-nums">{count}</p>

      <div className="flex gap-2">
        {/* Handler-ul de click e cod care trebuie să existe în browser — de aici vine
            obligația directivei "use client" din capul fișierului. */}
        <Button size="sm" onClick={() => setCount(c => c + 1)}>
          Incrementează
        </Button>
        <Button size="sm" variant="outline" onClick={() => setCount(0)}>
          Reset
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Numărul crește fără cerere către server: starea trăiește în browser. La refresh se pierde — memoria între
        sesiuni e o cerință separată, de la faza 6.
      </p>
    </div>
  );
}
