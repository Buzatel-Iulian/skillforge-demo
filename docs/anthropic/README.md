# Anthropic

> Integrarea a intrat la **Faza 3 — Agentul: apel la LLM și streaming**.
>
> **În acest fișier nu există chei reale.** Doar numele variabilelor și de unde se iau valorile. Cheia ta stă exclusiv în `.env.local`, care e gitignorat.

## Ce face

Anthropic e providerul de LLM implicit al SkillForge: modelul care scrie efectiv răspunsurile din chat. Când trimiți un mesaj, `src/app/api/chat/route.ts` cheamă Anthropic prin Vercel AI SDK și întoarce răspunsul **în streaming** — de aceea textul apare bucată cu bucată, nu dintr-odată la final.

Fără ea, aplicația rămâne o interfață goală: composer-ul funcționează, dar nu are cine să răspundă. Alegerea providerului stă într-un singur loc (`src/lib/providers.ts`), tocmai ca la Faza 5 să se poată adăuga OpenAI fără să se atingă restul codului.

## Cont & chei

1. **Cont:** [console.anthropic.com](https://console.anthropic.com) → `Sign up`. E un cont de **API** (Anthropic Console), diferit de abonamentul Claude.ai — un abonament Claude Pro **nu** îți dă acces la API și invers.
2. **Credit:** API-ul se plătește separat, în avans. `Console → Billing → Add credits`. Fără credit, primele cereri se întorc cu eroare de limită (429), chiar dacă cheia e corectă. Minimul e de câțiva dolari și ajunge pentru tot cursul.
3. **Cheia:** `Console → Settings → API Keys → Create Key`. Dă-i un nume care spune de unde vine (ex. `skillforge-local`), ca s-o poți revoca punctual mai târziu.
4. **Permisiuni:** o cheie obișnuită de workspace e suficientă — are acces la Messages API, adică exact ce folosim. **Nu** e nevoie de o cheie de tip Admin; principiul e cât mai puține permisiuni.
5. ⚠️ **Cheia se afișează O SINGURĂ DATĂ**, la creare. Dacă închizi fereastra fără s-o copiezi, nu se mai poate recupera — trebuie generată alta. Copiaz-o direct în `.env.local`.
6. **Dacă o cheie a ajuns vreodată public** (screenshot la curs, commit din greșeală, mesaj pe chat): `Console → Settings → API Keys → Revoke` și generează alta. Nu e suficient să ștergi linia din fișier — cheia rămâne validă până e revocată.

## Variabile de mediu

| Variabilă           | Fișier       | Ajunge în browser?              |
| ------------------- | ------------ | ------------------------------- |
| `ANTHROPIC_API_KEY` | `.env.local` | NU (fără prefix `NEXT_PUBLIC_`) |

Rândul adăugat în `.env.example` (fără valoare reală):

```dotenv
ANTHROPIC_API_KEY=""
```

**De ce numele contează:** în Next.js o variabilă ajunge în browser **doar** dacă numele ei începe cu `NEXT_PUBLIC_`. Un `NEXT_PUBLIC_ANTHROPIC_API_KEY` ar fi lipit în bundle-ul JavaScript și l-ar putea citi oricine din DevTools. Prefixul înseamnă „public" — nu-l pune niciodată pe o cheie.

Variabila se citește **doar** în `src/app/api/chat/route.ts`, și **doar în interiorul funcției `POST`**. Nu la nivel de modul: un `throw` scris acolo ar face să cadă `next build` pe orice calculator fără `.env.local`.

**În producție (Vercel):** `Project → Settings → Environment Variables` → `ANTHROPIC_API_KEY`, pentru mediile `Production`, `Preview` și `Development`. După adăugare e nevoie de un **redeploy** — variabilele se citesc la build/pornire, nu la fiecare cerere.

## Pași manuali

Ce nu poate face agentul și trebuie făcut de mână:

1. crearea contului pe [console.anthropic.com](https://console.anthropic.com) și confirmarea adresei de email;
2. **adăugarea de credit** (`Billing → Add credits`) — fără el, cheia e validă dar cererile eșuează;
3. generarea cheii (`Settings → API Keys → Create Key`) și copierea ei **în momentul afișării**;
4. `cp .env.example .env.local`, completarea valorii și **repornirea** lui `npm run dev`;
5. opțional, dar recomandat: `Settings → Limits` → o limită lunară de cheltuială, ca o buclă greșită să nu producă o factură surpriză;
6. la deploy: aceeași variabilă în Vercel, plus redeploy;
7. la reinstalare sau pe alt calculator: pașii 4 (și 3 dacă n-ai păstrat cheia nicăieri).

## Cost & limite

**Model de facturare:** per token, **separat pentru intrare și ieșire**. Un token e aproximativ 4 caractere; un răspuns de chat obișnuit are câteva sute de tokeni.

Prețuri la data verificării (**2026-09-07**), în dolari per **milion de tokeni**:

| Model                                 | Context | Intrare $/1M | Ieșire $/1M |
| ------------------------------------- | ------- | ------------ | ----------- |
| Claude Opus 5 (`claude-opus-5`)       | 1M      | $5.00        | $25.00      |
| Claude Sonnet 5 (`claude-sonnet-5`)   | 1M      | $2.00        | $10.00      |
| Claude Haiku 4.5 (`claude-haiku-4-5`) | 200K    | $1.00        | $5.00       |

SkillForge pornește pe **Claude Opus 5** — primul model din registrul `src/lib/providers.ts`, adică `DEFAULT_MODEL_ID`. Prețurile se schimbă; sursa oficială e [anthropic.com/pricing](https://www.anthropic.com/pricing).

**Plan gratuit:** nu există un tier gratuit pentru API. Anthropic oferă uneori credit de start la înregistrare, dar nu te baza pe el.

**Rate limits** care ne pot afecta: sunt exprimate în cereri/minut și tokeni/minut și cresc pe măsură ce cheltuiești (tier-uri). Pe tier-ul de început se ating ușor dacă trimiți multe mesaje la rând — răspunsul e `429`, iar aplicația îl afișează ca „Ai depășit limita de cereri sau creditul contului".

**Ce umflă factura exact în SkillForge:**

- **conversația se retrimite ÎNTREAGĂ la fiecare mesaj.** API-ul nu ține minte nimic între cereri; istoricul e context de intrare, plătit din nou de fiecare dată. Al zecelea mesaj dintr-o conversație costă la intrare cât primele nouă la un loc;
- **răspunsurile lungi** — ieșirea e de 5 ori mai scumpă decât intrarea;
- de la Faza 4, **profilul (persona)** intră în fiecare cerere, deci se plătește la fiecare mesaj;
- butonul **Stop** oprește generarea, deci și tokenii de ieșire care ar fi urmat. E și un buton de cost, nu doar de răbdare.

## Verificare

**1. Fără cheie, aplicația tot pornește** (asta e cerința: oricine poate clona proiectul):

```bash
mv .env.local /tmp/ && npm run build && mv /tmp/.env.local .
# aşteptat: build-ul trece, ruta ƒ /api/chat apare în listă
```

**2. Cu cheia lipsă, chat-ul dă un mesaj clar, nu o eroare de server:**

```bash
curl -s -X POST http://localhost:3000/api/chat -H 'content-type: application/json' \
  -d '{"messages":[{"id":"1","role":"user","parts":[{"type":"text","text":"salut"}]}]}'
# aşteptat: status 400 şi
# {"error":"Cheia ANTHROPIC_API_KEY nu e configurată pe server. ..."}
```

**3. Cu cheia pusă, răspunsul vine ca stream SSE — evenimentele sosesc pe rând, nu toate deodată:**

```bash
curl -sN -X POST http://localhost:3000/api/chat -H 'content-type: application/json' \
  -d '{"messages":[{"id":"1","role":"user","parts":[{"type":"text","text":"Spune-mi ceva scurt."}]}]}'
# aşteptat:
# data: {"type":"start"}
# data: {"type":"text-delta","delta":"Sigur"}
# data: {"type":"text-delta","delta":", uite"}
# ...
# data: [DONE]
```

**4. În interfață:** `npm run dev` → scrie o întrebare → Enter. Textul apare bucată cu bucată, butonul devine `Stop` cât timp modelul lucrează, iar pagina nu se reîncarcă.

**5. Cheia nu ajunge în browser:**

```bash
grep -r "ANTHROPIC_API_KEY" .next/static   # aşteptat: niciun rezultat
```

În DevTools → `Network` → cererea `chat`: în `Payload` sunt doar mesajele, iar în `Response` doar evenimentele SSE. Nicăieri cheia.

### Erori tipice și ce înseamnă fiecare

| Ce vezi în interfață                                               | Cauză                                              | Ce faci                                                                   |
| ------------------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------- |
| „Cheia ANTHROPIC_API_KEY nu e configurată pe server."              | lipsește `.env.local` sau variabila e goală        | completează variabila și **repornește** `npm run dev`                     |
| „Cheia ... a fost respinsă de Anthropic." (401/403)                | cheie greșită, trunchiată la copiere, sau revocată | regenerează cheia în Console → API Keys                                   |
| „Ai depășit limita de cereri sau creditul contului." (429)         | rate limit **sau** credit epuizat                  | așteaptă un minut; dacă persistă, verifică `Billing`                      |
| „Modelul „..." nu există sau nu e disponibil pe contul tău." (404) | id de model greșit în `src/lib/providers.ts`       | corectează id-ul în registru                                              |
| „Anthropic nu a putut răspunde acum."                              | eroare 5xx la ei, sau rețea                        | reîncearcă; verifică [status.anthropic.com](https://status.anthropic.com) |

Mesajul brut al SDK-ului **nu** se afișează niciodată în interfață — poate conține detalii de cont. Traducerea se face în `describeProviderError` din `src/app/api/chat/route.ts`.
