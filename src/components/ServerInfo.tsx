/**
 * Component SERVER — rulează pe server, la fiecare cerere.
 *
 * DE CE nu are nicio directivă:
 * absența lui "use client" e alegerea implicită din App Router. Codul acestui fișier nu
 * intră în bundle-ul de browser: se execută pe server, iar utilizatorul primește doar
 * HTML-ul produs. Verificabil: în DevTools → Network nu apare niciun JavaScript care să
 * conțină textul de mai jos.
 *
 * DE CE e important pentru SkillForge, nu doar ca demonstrație:
 * exact aici e locul unde se poate atinge, în siguranță, ce nu are voie să ajungă la client —
 * `process.env.ANTHROPIC_API_KEY`, baza de date, profilul utilizatorului. Componenta server
 * poate fi `async` și poate aștepta direct date (fără `useEffect` și fără endpoint intermediar).
 * De la faza 2, persona construită din profil se va compune într-un astfel de fișier.
 *
 * DE CE `await connection()`:
 * Next prerandează implicit ce poate prerenda. Fără linia asta, `new Date()` ar fi evaluat
 * o singură dată, la build, și pagina ar afișa la infinit ora build-ului — ceea ce ar rata
 * complet ideea demonstrației. `connection()` spune: „nu prerenda, așteaptă o cerere reală".
 * E necesar fiindcă nu folosim niciun API de request (`cookies()`, `headers()`) care ar marca
 * automat randarea ca dinamică. A înlocuit `unstable_noStore` din versiunile mai vechi.
 */

import { connection } from "next/server";

export async function ServerInfo() {
  await connection();

  const acum = new Date();

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Component server</span>
        <code className="font-mono text-xs text-muted-foreground">fără directivă</code>
      </div>

      <p className="font-mono text-3xl font-semibold tabular-nums">
        {acum.toLocaleTimeString("ro-RO", { hour12: false })}
      </p>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <dt>Node</dt>
        <dd className="font-mono">{process.version}</dd>
        <dt>Randat la</dt>
        <dd className="font-mono">{acum.toISOString()}</dd>
      </dl>

      <p className="text-sm text-muted-foreground">
        Ora e calculată pe server, la cerere. Nu se mișcă până la un refresh — spre deosebire de contorul de lângă, care
        se schimbă fără să întrebe serverul.
      </p>
    </div>
  );
}
