/**
 * Route Handler — `/api/chat`. Singurul loc din aplicație care are voie să vorbească cu Anthropic.
 *
 * DE CE apelul stă pe server și nu în browser:
 * 1. **cheia** — orice cod de client ajunge, în clar, în bundle-ul pe care oricine îl poate citi
 *    din DevTools. O cheie de API pusă acolo e o cheie publicată;
 * 2. **costul** — fiecare răspuns se plătește. Dacă apelul ar pleca din browser, oricine poate
 *    trimite cereri cu cheia ta, la nesfârșit, fără să treacă prin aplicația ta;
 * 3. **controlul** — abia aici putem, la pașii următori, să limităm numărul de cereri, să
 *    tăiem contextul trimis sau să schimbăm providerul, fără să atingem interfața.
 *
 * DE CE `runtime = "nodejs"` scris explicit, deși e valoarea implicită în Next 16:
 * e o decizie reală, nu un detaliu. Alternativa (Edge) pornește mai repede și e mai aproape de
 * utilizator, dar rulează într-un mediu redus — fără API-uri de Node, cu limite de timp și de
 * memorie mai mici. Node ne dă mediul complet, de care vom avea nevoie la Faza 9 (bază de date).
 * Streaming-ul merge pe amândouă — de asta e o alegere, nu o constrângere.
 * ATENȚIE: în Next 16 runtime-ul Edge e **deprecated**; `"nodejs"` e drumul recomandat.
 *
 * DE CE ruta și interfața se fac în ACELAȘI pas:
 * un endpoint fără interfață se poate testa doar cu `curl`, iar o interfață fără endpoint n-are
 * ce afișa. Abia împreună se vede lucrul care contează: textul care curge pe ecran.
 */

import {
  APICallError,
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  validateUIMessages
} from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { DEFAULT_MODEL_ID, DEFAULT_PROVIDER_ID } from "@/lib/providers";

export const runtime = "nodejs";

/**
 * Mesajul afișat când cheia lipsește.
 * DE CE e o constantă și nu text inline: e singurul mesaj de eroare pe care îl va vedea oricine
 * clonează proiectul fără `.env.local`. Trebuie să spună exact ce are de făcut, nu „a apărut o
 * eroare". Textul e în română pentru că îl citește utilizatorul.
 */
const MISSING_KEY_MESSAGE =
  "Cheia ANTHROPIC_API_KEY nu e configurată pe server. Copiază .env.example în .env.local, completează cheia și repornește `npm run dev`. Pașii sunt în docs/anthropic/README.md.";

export async function POST(request: Request) {
  /**
   * Cheia se citește AICI, în interiorul handler-ului — nu la nivel de modul.
   *
   * DE CE contează atât de mult:
   * codul de la nivel de modul se execută la import, iar `next build` importă fiecare rută ca
   * să-i genereze manifestul. Un `if (!key) throw` scris în afara funcției ar face să cadă
   * build-ul pe orice calculator fără `.env.local` — deci proiectul n-ar mai putea fi pornit
   * de cineva care încă nu și-a făcut cont la Anthropic. Cerința e explicită: aplicația trebuie
   * să se compileze și fără cheie.
   *
   * DE CE lipsa cheii e 400 și nu 500:
   * 500 înseamnă „serverul s-a stricat" — te trimite să cauți un bug care nu există. 400
   * înseamnă „cererea nu poate fi onorată în starea asta de configurare", iar interfața poate
   * afișa un mesaj util în loc de o pagină de eroare.
   */
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: MISSING_KEY_MESSAGE }, { status: 400 });
  }

  /**
   * DE CE ruta întreabă registrul din `src/lib/providers.ts` în loc să-și scrie propriul id:
   * un id de model duplicat în două fișiere e un id care va rămâne în urmă într-unul din ele.
   * Registrul spune CE model folosim; ruta știe doar CU CE cheie se apelează.
   */
  if (DEFAULT_PROVIDER_ID !== "anthropic") {
    return Response.json(
      { error: `Providerul implicit „${DEFAULT_PROVIDER_ID}" nu e încă implementat în /api/chat.` },
      { status: 400 }
    );
  }

  /**
   * Mesajele vin din browser, deci sunt **date nesigure**: oricine poate trimite orice la
   * `/api/chat`, nu doar interfața noastră. `validateUIMessages` e validatorul SDK-ului pentru
   * formatul de UI — dacă forma nu e cea așteptată, aruncă, iar noi răspundem 400 în loc să
   * lăsăm o eroare neînțeleasă să iasă din `streamText`.
   */
  let messages;
  try {
    const body: unknown = await request.json();
    messages = await validateUIMessages({
      messages: (body as { messages?: unknown } | null)?.messages
    });
  } catch {
    return Response.json({ error: "Cererea nu conține o listă validă de mesaje." }, { status: 400 });
  }

  // Instanța de provider se creează per cerere, cu cheia citită mai sus. Așa cheia rămâne o
  // variabilă locală a handler-ului: nu există niciun obiect de modul care s-o țină minte.
  const anthropic = createAnthropic({ apiKey });

  const result = streamText({
    model: anthropic(DEFAULT_MODEL_ID),
    /**
     * DE CE traducem mesajele înainte de a le da modelului:
     * sunt DOUĂ formate diferite, intenționat. `UIMessage` descrie ce se AFIȘEAZĂ (are `id`,
     * are `parts` — bucăți tipate: text, unelte, fișiere). `ModelMessage` descrie ce se TRIMITE
     * modelului: doar rol și conținut, fără nimic din ce ține de interfață. `convertToModelMessages`
     * face conversia și aruncă ce n-are ce căuta într-un prompt.
     */
    messages: await convertToModelMessages(messages)
  });

  /**
   * Răspunsul e un stream de evenimente SSE — exact protocolul scris de mână la Faza 2.5.
   * `toUIMessageStream` transformă bucățile modelului în evenimente pe care `useChat` le
   * înțelege, iar `createUIMessageStreamResponse` le ambalează într-un `Response` cu headerele
   * potrivite (`text/event-stream`, `no-cache`). Sub `useChat` nu e magie: sunt aceleași
   * `data: {...}` care pot fi văzute cu `curl -N`.
   *
   * NOTĂ de versiune: în AI SDK 7, `result.toUIMessageStreamResponse()` încă merge, dar e
   * marcat deprecated și dispare la următoarea versiune majoră. Perechea de mai jos e forma
   * curentă, recomandată de documentația din `node_modules/ai/docs/`.
   */
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onError: describeProviderError
    })
  });
}

/**
 * Traduce erorile providerului în text pe care îl poate citi un om.
 *
 * DE CE nu trimitem în interfață mesajul brut al SDK-ului:
 * el poate conține detalii de cont, id-uri de organizație sau fragmente din cererea trimisă —
 * lucruri care n-au ce căuta pe ecranul utilizatorului. În plus, „AI_APICallError: 401
 * Unauthorized" nu-i spune nimănui ce are de făcut.
 *
 * DE CE implicit SDK-ul ascunde eroarea („An error occurred."):
 * tocmai ca să nu scape detalii de server către client. Când o înlocuim, răspunderea de a nu
 * scăpa nimic devine a noastră — de asta aici se compune text scris de noi, nu `error.message`.
 */
function describeProviderError(error: unknown): string {
  // Logăm doar tipul și codul de status. Cheia NU apare niciodată în loguri — nici direct,
  // nici indirect prin corpul cererii sau prin headere.
  if (APICallError.isInstance(error)) {
    console.error(`[/api/chat] eroare de la provider, status ${error.statusCode ?? "necunoscut"}`);

    switch (error.statusCode) {
      case 400:
        return "Anthropic a respins cererea. Verifică modelul ales în docs/anthropic/README.md.";
      case 401:
      case 403:
        return "Cheia ANTHROPIC_API_KEY a fost respinsă de Anthropic. Verifică dacă e copiată complet și dacă mai e activă în consola lor.";
      case 404:
        return `Modelul „${DEFAULT_MODEL_ID}" nu există sau nu e disponibil pe contul tău. Vezi lista din src/lib/providers.ts.`;
      case 429:
        return "Ai depășit limita de cereri sau creditul contului Anthropic. Încearcă peste un minut sau verifică soldul în consola lor.";
      default:
        return "Anthropic nu a putut răspunde acum. Încearcă din nou peste câteva momente.";
    }
  }

  console.error(`[/api/chat] eroare neașteptată: ${error instanceof Error ? error.name : typeof error}`);
  return "Răspunsul nu a putut fi generat. Vezi consola serverului pentru detalii.";
}
