/**
 * Ruta `/demo` — a doua rută a aplicației.
 *
 * DE CE există: ca structura de rutare să fie stabilită înainte să adăugăm ecrane reale.
 * Un folder nou în `src/app/` = o rută nouă; fișierul `page.tsx` din el = ce se randează.
 * Când vine chat-ul, `src/app/chat/page.tsx` se adaugă exact la fel, fără configurare.
 *
 * DE CE cele două componente sunt puse una lângă alta:
 * ca diferența dintre „rulează în browser" și „rulează pe server" să se vadă pe ecran, nu
 * doar în teorie. Contorul se schimbă la click, fără să întrebe serverul. Ora nu se schimbă
 * până la refresh, fiindcă e produsă pe server. Pagina asta e un Server Component care
 * randează un component client — direcția funcționează doar în sensul ăsta: serverul poate
 * include client, dar un component client nu poate importa cod de server.
 */
import Link from "next/link";
import { Counter } from "@/components/Counter";
import { ServerInfo } from "@/components/ServerInfo";
import { Button } from "@/components/ui/button";

export default function DemoPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Client vs. server</h1>
        <p className="text-muted-foreground">
          Aceeași pagină, două tipuri de cod. Diferența dintre ele decide unde poate sta cheia de API a providerului de
          LLM.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Counter />
        <ServerInfo />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* `nativeButton={false}`: elementul randat e un <a>, nu un <button> — vezi comentariul din pagina principală. */}
        <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
          Înapoi la pagina principală
        </Button>

        {/*
          DE CE aici e <a> și nu <Link>, deși regula proiectului spune <Link> pentru rute interne:
          `/api/hello` nu e o pagină din React, e un endpoint HTTP care întoarce JSON.
          Navigarea client-side nu are ce să monteze din el, deci <Link> ar fi greșit ca intenție.
          Un <a> normal cere resursa exact cum o va cere codul nostru mai târziu cu `fetch`.
        */}
        <a
          href="/api/hello"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Vezi răspunsul de la /api/hello
        </a>
      </div>
    </main>
  );
}
