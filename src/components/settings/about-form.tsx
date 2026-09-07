"use client";

/**
 * Preferințe → Despre aplicație: la ce servește SkillForge, scris progresiv, ca un răspuns de chat.
 *
 * DE CE textul nu e scris aici, în interfață:
 * scopul secțiunii nu e paragraful, ci mecanismul. Textul vine de la `/api/about` bucată cu
 * bucată, iar componenta asta îl citește DE MÂNĂ — fără SDK, fără cheie de API. La pasul
 * următor, pe server, array-ul de bucăți e înlocuit cu un model de limbaj real, iar fișierul
 * de aici rămâne aproape neatins: protocolul e același. Ce pare „magie" într-un hook gata
 * făcut (`useChat`) e exact codul de mai jos.
 *
 * DE CE nu folosim `EventSource`, deși `/api/about` vorbește SSE:
 * `EventSource` face doar GET și nu poate trimite un corp de cerere. La `/api/chat` avem de
 * trimis mesajele și profilul, deci va fi POST — iar `EventSource` n-ar mai fi o opțiune.
 * Citim cu `fetch` + `getReader()` de la început, ca să scriem clientul o singură dată.
 */

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * DE CE nu există stare „idle":
 * cererea pornește la montarea componentei, nu la apăsarea unui buton. În momentul în care
 * secțiunea e pe ecran, stream-ul deja curge — o stare de „încă n-am pornit" ar fi o minciună
 * pe care ar trebui s-o tratăm în UI degeaba.
 */
type StreamState = "streaming" | "done" | "error";

export function AboutForm() {
  const [text, setText] = useState("");
  const [state, setState] = useState<StreamState>("streaming");
  /**
   * `runId` e singurul rol al butonului „Reia": îl incrementează, iar efectul — care îl are ca
   * dependență — pornește o cerere nouă.
   * DE CE prin dependență și nu chemând funcția de fetch direct din `onClick`:
   * așa există un singur loc care pornește stream-ul și un singur loc care îl anulează
   * (cleanup-ul efectului). Cu două căi de pornire, una dintre ele rămâne fără anulare.
   */
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    /**
     * DE CE `AbortController`:
     * fereastra de preferințe se poate închide în mijlocul stream-ului. Fără anulare, cererea
     * ar continua și `setText` ar scrie într-o componentă demontată — o scurgere de memorie și
     * un avertisment în consolă. `controller.abort()` din cleanup rupe și `fetch`-ul, și
     * citirea din `reader`.
     */
    const controller = new AbortController();

    /**
     * DE CE acumulăm local și nu cu `setText(prev => prev + chunk)`:
     * în development, React montează componenta de două ori (StrictMode), deci efectul rulează
     * de două ori. Cu adunare peste starea precedentă, un text pornit înainte de anulare s-ar
     * putea lipi de al doilea — și ai vedea cuvinte dublate fără să înțelegi de ce. Acumulatorul
     * ăsta aparține unei singure rulări a efectului, deci fiecare rulare scrie textul ei.
     */
    let accumulated = "";

    async function readStream() {
      try {
        const response = await fetch("/api/about", { signal: controller.signal });

        // `response.body` e `null` pentru un răspuns fără corp (ex. 204) — TypeScript ne obligă
        // să tratăm cazul, și bine face: fără el, `getReader()` ar pica la runtime.
        if (!response.ok || !response.body) {
          throw new Error(`Răspuns neașteptat de la /api/about: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        /**
         * CAPCANA NR. 2: o bucată de rețea NU coincide cu un eveniment SSE.
         * Rețeaua livrează octeți când îi convine ei: poți primi două evenimente lipite sau
         * jumătate de eveniment. De asta ținem un `buffer` — tot ce am primit și n-am apucat
         * să interpretez — și tăiem din el doar evenimentele COMPLETE.
         */
        let buffer = "";
        let finished = false;

        while (!finished) {
          const { done, value } = await reader.read();
          if (done) break;

          /**
           * CAPCANA NR. 1: `{ stream: true }`.
           * În UTF-8 un caracter ca `ă`, `ș` sau `ț` ocupă doi octeți, iar granița dintre două
           * bucăți de rețea poate cădea FIX între ei. Fără `stream: true`, decodorul consideră
           * fiecare bucată un text de sine stătător, nu știe să aștepte al doilea octet și
           * scoate un `�`. Cu el, ține octetul incomplet și îl lipește de bucata următoare.
           * Într-o aplicație în română, greșeala asta se vede de la prima rulare.
           */
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split("\n\n");
          /**
           * DE CE `pop()`: ultima parte de după ultimul `\n\n` e, prin definiție, incompletă —
           * separatorul ei încă n-a sosit. O punem înapoi în buffer, ca început al bucății
           * următoare. Dacă am procesa-o acum, `JSON.parse` ar primi un text tăiat la mijloc.
           */
          buffer = events.pop() ?? "";

          for (const event of events) {
            const line = event.trim();
            // Ignorăm liniile care nu sunt `data:` (comentariile de keep-alive `: ping` sunt
            // legale în SSE, iar la Faza 3 pot apărea și alte tipuri de evenimente).
            if (!line.startsWith("data:")) continue;

            const payload = line.slice("data:".length).trim();

            if (payload === "[DONE]") {
              finished = true;
              break;
            }

            // Perechea lui `JSON.stringify` de pe server: aici textul își recapătă rândurile noi.
            accumulated += JSON.parse(payload) as string;
            setText(accumulated);
          }
        }

        setState("done");
      } catch (error) {
        /**
         * DE CE anularea NU e eroare:
         * `fetch` aruncă și când cererea a fost oprită de noi. Dacă am afișa asta ca eroare,
         * fiecare închidere a ferestrei ar lăsa în urmă un mesaj roșu pentru ceva care a
         * funcționat perfect. Verificăm cine a oprit cererea înainte să dăm vina pe server.
         */
        if (controller.signal.aborted) return;

        console.error(error);
        setState("error");
      }
    }

    readStream();

    return () => controller.abort();
  }, [runId]);

  /**
   * DE CE resetăm starea aici, în handler, și nu în corpul efectului:
   * un `setState` sincron la începutul efectului ar declanșa încă un render înainte ca primul
   * să se fi așezat. Butonul e oricum singura cale de repornire, deci el curăță ce lasă în
   * urmă rularea precedentă, iar efectul se ocupă doar de citit.
   */
  function restart() {
    setText("");
    setState("streaming");
    setRunId(id => id + 1);
  }

  return (
    /**
     * LAYOUT — bara de jos stă la BAZA panoului, nu lipită sub text.
     * Fereastra de preferințe are înălțime fixă, deci bara trebuie să fie mereu în același loc,
     * indiferent cât text a curs. Rețeta are trei piese, și toate trei trebuie să existe:
     *   1. panoul din dreapta are înălțime DEFINITĂ (`h-full` în settings-dialog.tsx);
     *   2. secțiunea de aici e `flex min-h-0 flex-1 flex-col`, iar bara de jos are `mt-auto`;
     *   3. cutia de text e `min-h-0 flex-1 overflow-y-auto` — crește cât are loc, apoi derulează.
     *
     * DE CE `min-h-0` apare de DOUĂ ori (pe secțiune și pe cutie):
     * un item flex are implicit `min-height: auto`, adică refuză să coboare sub înălțimea
     * conținutului lui. Fără `min-h-0`, textul lung împinge cutia, cutia împinge secțiunea,
     * secțiunea împinge panoul — și bara de jos ajunge sub marginea ferestrei.
     */
    <section className="flex min-h-0 flex-1 flex-col gap-4">
      {/*
        `aria-live="polite"` — textul apare după ce cititorul de ecran a terminat de citit ce
        avea, deci un utilizator care nu vede ecranul află că a sosit conținut nou. Cerința
        6.6 din requirements: exact ce ne va trebui și pentru răspunsurile modelului.
      */}
      <div
        aria-live="polite"
        className="min-h-0 flex-1 overflow-y-auto rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap"
      >
        {state === "error" ? (
          <span className="text-destructive">
            N-am putut citi descrierea de la server. Verifică dacă `npm run dev` rulează și apasă „Reia”.
          </span>
        ) : (
          <>
            {text}
            {/*
              Cursorul care clipește cât timp curge textul.
              DE CE un `span` cu fundal și nu un caracter „|”: rămâne pe linie lângă ultimul
              cuvânt, oriunde ar fi el, fără să miște textul când dispare.
            */}
            {state === "streaming" && (
              <span
                className={cn("ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-foreground")}
                aria-hidden="true"
              />
            )}
          </>
        )}
      </div>

      {/* `mt-auto` împinge bara asta la baza secțiunii, chiar dacă textul de deasupra e scurt. */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p className="text-xs text-muted-foreground">
          Textul vine în streaming de la <code className="font-mono">/api/about</code>, bucată cu bucată. Niciun model
          de limbaj implicat încă — doar mecanismul.
        </p>
        {/*
          DE CE butonul rămâne activ și în timpul stream-ului:
          o apăsare în mijlocul textului schimbă `runId`, deci efectul face cleanup — adică
          `abort()` pe cererea în curs — și pornește una nouă. E fix demonstrația anulării:
          textul se golește și repornește, fără ca cele două rulări să se amestece.
        */}
        <Button variant="outline" size="sm" onClick={restart}>
          <RotateCcw />
          Reia
        </Button>
      </div>
    </section>
  );
}
