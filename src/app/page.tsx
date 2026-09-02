/**
 * Pagina principală — ruta `/`.
 *
 * DE CE ruta se naște din numele fișierului:
 * în App Router, `src/app/page.tsx` ESTE ruta `/`, iar `src/app/demo/page.tsx` e `/demo`.
 * Nu există un fișier de rutare în care să declar căile (ca `createBrowserRouter` la
 * React + Vite): structura de foldere e configurația de rutare. De asta stabilim structura
 * acum — la pașii următori adăugăm `/chat` fără să atingem nimic altceva.
 *
 * DE CE nu are "use client": e Server Component (implicit). Codul lui nu ajunge în browser.
 */
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">SkillForge</h1>
        <p className="text-muted-foreground">
          Copilot personal de skills și carieră. Acesta e scheletul: agentul AI intră la pașii următori, pe ruta{" "}
          <code className="font-mono text-sm">/api/chat</code>.
        </p>
      </div>

      {/*
        DE CE <Link> și nu <a href="/demo">:
        <a> face o navigare de browser — se descarcă din nou tot documentul, se pierde starea
        din React și ecranul clipește. <Link> face navigare client-side: Next încarcă doar
        bucata de rută care lipsește și o montează în arborele existent. În plus, prefetch-ează
        ruta când link-ul intră în viewport, deci navigarea pare instantanee.
        Regulă în proiect: pentru rute interne se folosește DOAR <Link>.

        DE CE `render={...}` și nu `asChild`:
        butonul de shadcn din acest proiect e construit peste Base UI, care expune
        polimorfismul prin prop-ul `render`. Așa <Link> primește stilul de buton,
        dar rămâne un <a> real în DOM — adică se poate deschide în tab nou.

        DE CE e nevoie și de `nativeButton={false}`:
        Base UI presupune implicit că un buton e un <button> nativ și, dacă găsește altceva,
        avertizează în consolă — pe bună dreptate: un <a> nu trimite formulare și nu are
        aceleași semantici pentru tastatură și cititoarele de ecran. Prop-ul spune explicit
        „știu că nu e <button>", iar Base UI adaugă atunci rolul și comportamentul potrivite.
        Regulă în proiect: `render` cu alt element decât <button> vine mereu cu `nativeButton={false}`.
      */}
      <div className="flex gap-3">
        <Button nativeButton={false} render={<Link href="/demo" />}>
          Vezi pagina /demo
        </Button>
      </div>
    </main>
  );
}
