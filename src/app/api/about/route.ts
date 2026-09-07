/**
 * Route Handler — `/api/about`. Primul cod din proiect care trimite date ÎN TIMP, nu dintr-o dată.
 *
 * DE CE există pasul ăsta înaintea LLM-ului:
 * la pasul următor, `/api/chat` va face exact ce face fișierul de aici — deschide un stream și
 * împinge bucăți de text pe măsură ce le are. Singura diferență va fi de unde vin bucățile:
 * acum dintr-un array scris de noi, atunci de la model. Ca să vezi mecanismul curat, îl
 * separăm de tot ce ține de chei de API, SDK-uri și facturi: aplicația merge pe orice laptop,
 * imediat, fără configurare.
 *
 * DE CE `runtime = "nodejs"` scris explicit, deși e valoarea implicită:
 * la Faza 3 alegerea devine o decizie reală (Node vs. Edge), iar streaming-ul merge pe amândouă.
 * O ținem vizibilă în fișier ca să fie un loc unde se discută, nu o valoare implicită invizibilă.
 */

export const runtime = "nodejs";

/**
 * Descrierea aplicației. **Singurul loc în care e scris textul**, și e pe server.
 *
 * DE CE nu stă în componenta de UI:
 * dacă textul ar fi în `about-form.tsx`, ar fi doar un paragraf hardcodat — n-ar demonstra
 * nimic, iar la pasul următor n-am avea ce înlocui. Aici, textul e „conținutul generat pe
 * server": îl schimb de aici, fără să ating interfața, exact cum răspunsul modelului va veni
 * de pe server fără ca interfața să știe cine l-a scris.
 *
 * ATENȚIE, e intenționat: textul conține rânduri goale. Vezi mai jos de ce sunt o capcană
 * pentru protocolul SSE — și de ce `JSON.stringify` o dezamorsează.
 */
const ABOUT_TEXT = `SkillForge este copilotul tău personal de skills și carieră.

Nu e un chat generic: aplicația îți cunoaște profilul real — stack-ul cu care lucrezi, skill-urile tale cu nivel la fiecare și obiectivul spre care mergi — și răspunde în contextul lui.

De aici încolo poate să-ți spună concret ce-ți lipsește ca să ajungi unde vrei, să-ți construiască un plan de învățare pe pașii tăi, nu pe ai altcuiva, și să țină minte între sesiuni ce ai terminat deja.

Textul pe care tocmai l-ai citit nu e scris în interfață. A venit de pe server, bucată cu bucată, prin exact același mecanism prin care va veni răspunsul modelului de limbaj la pasul următor.`;

/**
 * Tăiem textul în bucăți de câteva cuvinte.
 *
 * DE CE nu trimitem textul întreg dintr-un singur `enqueue`:
 * un singur mesaj n-ar fi streaming, ar fi un răspuns normal livrat pe un canal mai complicat.
 * Bucățile imită felul în care un model produce text — token cu token — deci clientul pe
 * care îl scriem acum e deja clientul de care avem nevoie la Faza 3.
 *
 * `\S+\s*` = un cuvânt împreună cu spațiul de după el, ca să nu pierdem spațiile și rândurile
 * noi la reasamblare pe client: bucățile lipite cap la cap trebuie să dea textul original.
 */
function toChunks(text: string, wordsPerChunk = 4): string[] {
  const words = text.match(/\S+\s*/g) ?? [];
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(""));
  }

  return chunks;
}

/**
 * Pauza dintre bucăți. DE CE 120ms și nu 0:
 * fără pauză, tot textul ar pleca în aceeași milisecundă și ai vedea un paragraf apărut
 * instantaneu — adică n-ai vedea nimic. Întârzierea e didactică, nu tehnică: la Faza 3
 * dispare, fiindcă ritmul îl dă modelul.
 */
const CHUNK_DELAY_MS = 120;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET() {
  const encoder = new TextEncoder();

  /**
   * `ReadableStream` = corpul răspunsului, dar scris în timp.
   *
   * DE CE `Response` primește un stream în loc de un string:
   * un `Response` normal se trimite când e gata tot. Cu un stream, headerele pleacă imediat,
   * iar corpul continuă să curgă cât timp noi mai avem ce împinge. Browserul primește primele
   * bucăți în timp ce serverul încă lucrează la restul — ăsta e tot secretul „textului care se
   * scrie singur" din orice interfață de chat.
   *
   * `start(controller)` rulează imediat ce cineva începe să citească stream-ul. `enqueue`
   * împinge octeți în el, `close` îi spune clientului că nu mai vine nimic.
   */
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (const chunk of toChunks(ABOUT_TEXT)) {
          /**
           * FORMATUL SSE, pe scurt: un eveniment e `data: <payload>\n\n`.
           *
           * DE CE `JSON.stringify` pe payload — capcana nr. 1 a protocolului:
           * `\n\n` E SEPARATORUL dintre evenimente. Textul nostru conține rânduri goale
           * (paragrafele din `ABOUT_TEXT`), deci trimis brut ar rupe protocolul: clientul ar
           * citi jumătate de paragraf ca eveniment complet și ar pierde restul.
           * `JSON.stringify` transformă orice rând nou în `\n` (două caractere, nu unul),
           * deci payload-ul e garantat pe o singură linie. Clientul face `JSON.parse` și
           * primește textul exact, cu rândurile lui cu tot.
           */
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          await sleep(CHUNK_DELAY_MS);
        }

        /**
         * Evenimentul de final.
         * DE CE un marcaj explicit, când oricum închidem stream-ul imediat după:
         * închiderea conexiunii nu spune DE CE s-a închis — o rețea căzută arată la fel.
         * `[DONE]` e diferența dintre „textul s-a terminat" și „legătura s-a rupt". E aceeași
         * convenție folosită de API-urile de LLM, deci clientul de aici o va recunoaște și acolo.
         */
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch {
        /**
         * DE CE nu tratăm asta ca pe o eroare adevărată:
         * dacă utilizatorul închide fereastra de preferințe sau apasă „Reia", clientul anulează
         * cererea, iar `enqueue` pe un stream fără cititor aruncă. E cursul normal al lucrurilor,
         * nu o defecțiune — n-avem cui raporta nimic, conexiunea deja nu mai există.
         */
      }
    }
  });

  return new Response(stream, {
    headers: {
      // Tipul care spune „ăsta e un flux de evenimente, nu un document care se termină acum".
      "Content-Type": "text/event-stream; charset=utf-8",
      /**
       * DE CE `no-transform` pe lângă `no-cache` — capcana care se vede abia în producție:
       * un proxy sau un CDN care crede că îți face un bine îți poate tampona (buffer-ui) sau
       * comprima răspunsul, ca să-l livreze eficient, dintr-o bucată. Adică exact opusul a ce
       * vrem: pe laptop merge, pe deploy textul apare tot deodată, la final. `no-transform` îi
       * interzice explicit să se atingă de corpul răspunsului.
       */
      "Cache-Control": "no-cache, no-transform"
    }
  });
}
