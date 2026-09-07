# SkillForge

Copilot personal de skills și carieră. O aplicație web în centrul căreia stă un **agent AI** care cunoaște profilul real al utilizatorului (stack, skill-uri și nivelul la fiecare, obiectivul spre care merge), răspunde în contextul lui și îi propune pași concreți de învățare.

Se construiește pas cu pas, ca material de curs: chat cu răspuns în streaming, system prompt generat din profil, memorie între sesiuni, unelte pe care agentul le folosește singur și RAG pe notițe proprii. Modelul de limbaj se cheamă **de pe server**, printr-un provider de LLM configurat cu o cheie care nu ajunge niciodată în browser.

**Stadiul actual:** interfața completă, pe date inventate (Faza 2). **Niciun apel către un model de limbaj și nicio cheie de API** — proiectul pornește pe orice laptop, fără configurare. Agentul intră la pasul următor.

## Cum se rulează

```bash
npm install
npm run dev   # http://localhost:3000
```

Aplicația pornește și se compilează **și fără nicio cheie** — doar că, fără cheie, chat-ul îți spune asta în loc să răspundă. Ca să vorbească cu modelul:

```bash
cp .env.example .env.local   # completează ANTHROPIC_API_KEY; fișierul nu se comite
```

De unde iei cheia, cât costă și cum verifici că merge: [`docs/anthropic/README.md`](docs/anthropic/README.md).

Variabilele de mediu se citesc la pornirea serverului — după ce modifici `.env.local`, repornește `npm run dev`.

| Comandă                | Ce face                                                   |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | server de dezvoltare (Turbopack)                          |
| `npm run build`        | build de producție                                        |
| `npm run start`        | rulează build-ul de producție                             |
| `npm run lint`         | ESLint                                                    |
| `npm run format`       | formatează tot proiectul cu Prettier                      |
| `npm run format:check` | verifică formatarea fără să modifice (varianta pentru CI) |

### Ce e de văzut acum

- `/` — aplicația: pune o întrebare și **răspunsul real al modelului apare bucată cu bucată**, fără reîncărcarea paginii; cât timp scrie, butonul devine `Stop`. Sidebar cu conversații (selectare, redenumire, ștergere), composer cu `Enter` = trimite și `Shift+Enter` = rând nou;
- **rândul de utilizator, jos în sidebar** → deschide preferințele: profilul tău (nume, stack, skills, obiectiv), tema (sistem / light / dark) și providerul de LLM;
- `/api/chat` — Route Handler-ul care cheamă Anthropic. Singurul loc care atinge cheia de API. Ce vede browserul se poate verifica direct: `curl -N -X POST http://localhost:3000/api/chat -H 'content-type: application/json' -d '{"messages":[{"id":"1","role":"user","parts":[{"type":"text","text":"salut"}]}]}'`;
- `/demo` — un component client (contor cu stare în browser) lângă un component server (ora calculată la cerere), ca diferența dintre ele să se vadă pe ecran;
- `/api/hello` — endpoint propriu care citește o variabilă de mediu. **E strămoșul lui `/api/chat`**: același tip de rută, același mecanism pentru cheie.

### Unde stau lucrurile

| Cale                       | Ce e                                                                             |
| -------------------------- | -------------------------------------------------------------------------------- |
| `src/components/layout/`   | sidebar-ul și header-ul                                                          |
| `src/components/chat/`     | zona de conversație: listă, mesaj, composer, ecran de start                      |
| `src/components/settings/` | fereastra de preferințe și formularele ei                                        |
| `src/components/ui/`       | componente shadcn — generate, nu se editează manual                              |
| `src/app/api/chat/`        | Route Handler-ul care cheamă modelul — singurul loc cu acces la cheie            |
| `src/lib/mock/`            | ce a mai rămas din datele inventate: titlurile conversațiilor de start           |
| `src/store/useAppStore.ts` | starea aplicației — **lista** de conversații, profil, temă (Zustand + `persist`) |

## Vite + React vs. Next.js

De ce am ales Next.js pentru o aplicație cu agent AI, și nu un SPA clasic:

|                             | Vite + React                                                               | Next.js (App Router)                                                                            |
| --------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Routing**                 | bibliotecă separată (React Router), rutele se declară în cod               | din structura de foldere: `src/app/demo/page.tsx` → `/demo`, fără configurare                   |
| **Unde rulează codul**      | tot în browser; ai nevoie de un server separat pentru orice logică privată | implicit pe server (Server Components); `"use client"` marchează explicit ce coboară în browser |
| **Variabile de mediu**      | tot ce e prefixat `VITE_` e inline-uit în bundle la build → **public**     | fără prefix = rămâne pe server; doar `NEXT_PUBLIC_` ajunge în browser                           |
| **Cheia de API a unui LLM** | nu are unde să stea în siguranță — ai nevoie de un backend în plus         | stă pe server, într-un Route Handler din același proiect                                        |
| **Deploy**                  | fișiere statice + (separat) un backend de întreținut                       | o singură aplicație care conține și UI-ul și serverul                                           |

Concluzia practică: cu Vite ar fi trebuit două proiecte (SPA + backend pentru chei și streaming). Cu Next.js, browserul cheamă ruta noastră, ruta cheamă providerul de LLM, iar cheia nu părăsește serverul.

## Documente

| Fișier                                               | Ce conține                                                                                                                                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [docs/requirements.md](docs/requirements.md)         | **Sursa de adevăr:** ce construim și pentru cine, cerințele pe faze, cerințele non-funcționale (chei de API, date personale, cost), glosarul                                             |
| [docs/README.md](docs/README.md)                     | Indexul documentației + tabelul integrărilor externe                                                                                                                                     |
| [docs/_template/README.md](docs/_template/README.md) | Formatul obligatoriu pentru documentația unei integrări (cont, chei, variabile, pași manuali, cost, verificare)                                                                          |
| [docs/vercel/README.md](docs/vercel/README.md)       | Pașii manuali pentru publicare: repo pe GitHub, import în Vercel, variabile de mediu în producție, costuri                                                                               |
| [AGENTS.md](AGENTS.md)                               | Convențiile pentru agenții AI care lucrează în proiect. Fișier canonic — `CLAUDE.md` și `.github/copilot-instructions.md` se generează din el cu `sh scripts/sync-agent-instructions.sh` |

Când se schimbă ceva pe drum, se actualizează în `docs/requirements.md`, nu doar în conversație. Cheile reale stau exclusiv în `.env.local` (gitignorat) — în `docs/` se scriu doar numele variabilelor.
