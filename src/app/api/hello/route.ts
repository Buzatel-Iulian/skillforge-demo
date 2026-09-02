/**
 * Route Handler — endpoint propriu, pe server. Ruta e `/api/hello`.
 *
 * ACESTA E STRĂMOȘUL LUI `src/app/api/chat/route.ts`.
 * La pașii următori, pe exact același tip de fișier, agentul SkillForge va chema modelul de
 * limbaj (Anthropic, apoi OpenAI) și va întoarce răspunsul în streaming. De asta pasul de
 * acum nu e un „hello world" decorativ: repetăm cele două lucruri de care depinde orice apel
 * către un LLM — un loc pe server de unde se cheamă modelul, și un loc sigur pentru cheia lui.
 *
 * DE CE modelul nu se cheamă direct din browser:
 * orice cerere pornită din browser își arată headerele în DevTools, iar orice cheie pusă în
 * cod de client ajunge în bundle-ul public. Cine deschide aplicația poate copia cheia și
 * consuma pe factura noastră. Singura variantă corectă e cea de aici: browserul cheamă
 * ruta noastră, ruta cheamă providerul, cheia nu părăsește serverul.
 *
 * DE CE numele variabilelor de mediu contează (partea care surprinde cel mai des):
 * în Next, o variabilă ajunge în browser DOAR dacă numele ei începe cu `NEXT_PUBLIC_`.
 * `SKILLFORGE_GREETING` (fără prefix) e citibilă doar în cod de server — aici, sau în
 * componente server. Dacă aș încerca s-o citesc într-un fișier cu "use client", aș primi
 * `undefined`, nu valoarea.
 * Diferența față de Vite, unde mulți se ard: acolo tot ce e prefixat `VITE_` e INLINE-uit în
 * bundle la build, deci ajunge public. `NEXT_PUBLIC_` face același lucru — la fel de public.
 * Prin urmare `ANTHROPIC_API_KEY` se numește exact așa, fără prefix, și se citește numai în
 * fișiere ca acesta.
 *
 * DE CE se exportă o funcție numită `GET`:
 * numele exportului E metoda HTTP tratată. Pentru chat vom exporta `POST` (mesajele se trimit
 * în corpul cererii, nu în URL), iar orice altă metodă primește automat 405.
 */

export async function GET() {
  /**
   * Citirea variabilei se face la fiecare cerere, nu la import.
   * DE CE: dacă aș citi-o o singură dată, la încărcarea modulului, o cheie schimbată în mediu
   * ar cere repornirea procesului. Iar în producție variabilele pot fi injectate per instanță.
   */
  const greeting = process.env.SKILLFORGE_GREETING;

  /**
   * DE CE tratăm explicit lipsa variabilei, cu 500 și un mesaj clar:
   * e cea mai frecventă cauză a unui endpoint care „nu merge" — `.env.local` inexistent sau
   * serverul de dev nepornit după ce a fost creat (variabilele se citesc la pornire).
   * La `/api/chat`, aceeași ramură va acoperi cheia de API lipsă. Mesajul spune CE variabilă
   * lipsește, niciodată ce valoare are alta — un mesaj de eroare e un loc din care se scurg secrete.
   */
  if (!greeting) {
    return Response.json(
      {
        ok: false,
        error: "Lipsește variabila SKILLFORGE_GREETING. Copiază .env.example în .env.local și repornește `npm run dev`."
      },
      { status: 500 }
    );
  }

  /**
   * DE CE `Response.json(...)` și nu `res.json(...)`:
   * Route Handlers lucrează cu Request/Response din platforma web (aceleași obiecte ca în
   * `fetch`), nu cu API-ul de Node din Express. Contează pentru pasul următor: un răspuns în
   * streaming e tot un `Response`, doar că are ca body un stream în loc de un text gata făcut.
   */
  return Response.json({
    ok: true,
    greeting,
    // Trimis intenționat, ca să se vadă ce înseamnă „calculat pe server, la cerere".
    servedAt: new Date().toISOString(),
    // ATENȚIE, regulă de aur: aici întorc VALOAREA unei variabile pentru că e un mesaj de
    // demonstrație. O cheie de API nu se întoarce niciodată în răspuns — despre ea se
    // raportează cel mult dacă există sau nu, ca mai jos.
    anthropicKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY)
  });
}
