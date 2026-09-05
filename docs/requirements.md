# SkillForge — Cerințe

> Acest fișier este **sursa de adevăr** pentru ce construim. Orice schimbare de direcție se scrie AICI, nu doar în conversație. Vezi [Cum se schimbă cerințele](#9-cum-se-schimbă-cerințele).
>
> Ultima actualizare: 2026-09-02 · Faza curentă: **Faza 2 — interfața aplicației** (livrată)
>
> Numerotarea fazelor din acest fișier e a proiectului. Materialul de curs numără separat pașii de UI („primul pas de interfață"); când cele două diferă, numerotarea de aici e cea validă.

---

## 1. Ce este SkillForge și pentru cine

**SkillForge este un copilot personal de skills și carieră.** O aplicație web proprie, online, în centrul căreia stă un **agent AI** care:

- cunoaște profilul real al utilizatorului — stack-ul cu care lucrează, skill-urile și nivelul la fiecare, obiectivul spre care merge;
- răspunde **în contextul acelui profil**, nu generic;
- propune pași concreți de învățare spre obiectiv;
- ține minte progresul între sesiuni și îl folosește în răspunsurile următoare.

### Pentru cine

Pentru oricine vrea să crească profesional și are nevoie de un plan, indiferent din ce direcție vine:

- cineva de pe backend (ex. Java) care trece spre web și AI;
- cineva din frontend care vrea să învețe Python sau Java;
- un QA care vrea să treacă pe automatizare;
- un junior care nu știe încă ce să aprofundeze.

**Punctul comun nu e tehnologia, ci faptul că fiecare pornește dintr-un loc diferit și are un obiectiv diferit.** De aici rezultă cea mai importantă decizie de produs: **profilul e nucleul aplicației**, nu o setare opțională. Fără profil, aplicația nu are ce să ofere în plus față de un chat generic.

---

## 2. De ce nu e suficient un chat generic

| Problema cu un chat generic                         | Ce cerință rezultă                                          |
| --------------------------------------------------- | ----------------------------------------------------------- |
| Dă sfaturi generice, valabile pentru oricine        | System prompt construit din profilul real (§4, §5 Faza 4)   |
| Uită de la o sesiune la alta cine ești              | Memorie persistentă între sesiuni (§5 Faza 6, Faza 9)       |
| Profilul nu crește — îl reintroduci de fiecare dată | Profil salvat, editabil, care se actualizează în timp       |
| E un tab de chat al altcuiva, nu unealta ta         | Aplicație proprie, cu date proprii și providere schimbabile |

---

## 3. Întrebări de referință

Acestea sunt **criteriul de „funcționează bine?"**. La finalul fazelor 3–6 (agent, persona, memorie) aplicația trebuie să răspundă bine la toate trei.

**1. „Ce-mi lipsește ca să trec de la Java backend la AI engineer?"**
Răspunsul trebuie să: pornească de la skill-urile deja existente în profil (nu le repredă), numească explicit golurile față de obiectiv, și le ordoneze după impact. Un răspuns care ar fi identic pentru orice utilizator = eșec.

**2. „Fă-mi un plan de 3 luni pentru Next.js + AI SDK."**
Răspunsul trebuie să: fie calibrat pe nivelul din profil (un senior backend nu începe de la sintaxă), să conțină pași concreți și verificabili (nu „învață React"), și să se încadreze în timpul declarat de utilizator.

**3. „Ține minte că am terminat modulul de streaming — ce urmează?"**
Răspunsul trebuie să: rețină faptul (persistent, disponibil în sesiunea următoare), și să continue **din punctul acela** al planului existent, nu să regenereze un plan nou de la zero.

---

## 4. Principii tehnice (valabile în toate fazele)

Acestea nu se negociază de la fază la fază:

1. **Agent AI în centru**, nu un formular care trimite un text la un model și afișează rezultatul. Agentul are context (profil + memorie), iar de la Faza 7 și unelte pe care le folosește singur.
2. **Răspuns în streaming** — textul apare progresiv, nu după 20 de secunde de spinner.
3. **System prompt construit din profil**, generat la runtime. Nu hardcodat în cod.
4. **Memorie între sesiuni** — ce s-a stabilit sau s-a terminat rămâne disponibil la următoarea deschidere a aplicației.
5. **LLM-ul se apelează DOAR de pe server.** Cheia de API nu ajunge niciodată în browser, în bundle-ul de client sau într-un URL.
6. **Provider schimbabil** — codul aplicației nu depinde de un singur furnizor de LLM, ca să putem compara răspunsuri și costuri.

### Stack fixat

- **Next.js 16 (App Router) + TypeScript + React 19** — o singură aplicație, cu UI și server în același proiect. Structură cu `src/`, alias de import `@/*`, ESLint activ. Bundler: Turbopack (implicit în Next 16).
- **Tailwind CSS v4** — configurare „CSS-first": **nu există `tailwind.config.js`**, tema stă în `@theme`, în `src/app/globals.css`.
- **shadcn/ui** — componentele de UI se iau din shadcn (`components.json` în proiect, helperul `cn()` în `src/lib/utils.ts`), nu se scriu de mână.
- **Vercel AI SDK** — streaming către UI și abstracția de provider.
- **Route Handler** (`src/app/api/*/route.ts`) — singurul loc de unde se apelează modelul și singurul loc din care se poate folosi o cheie de API.
- **Provider implicit: Anthropic (Claude).** Al doilea provider: OpenAI, pentru comparație de răspunsuri și costuri.
- **Persistență:** `localStorage` la început; **Supabase** mai târziu.

### Convenții de proiect

Nu sunt detalii cosmetice — fără ele, diferențele dintre proiectele cursanților ar fi zgomot, nu cod:

- **Prettier, din start**, cu configurație fixă în `.prettierrc` și `prettier-plugin-tailwindcss` care reordonează clasele Tailwind într-o ordine canonică (diff-uri citibile, duplicate vizibile). Fiindcă Tailwind v4 nu are fișier de config, plugin-ul e legat explicit de foaia de stil prin `tailwindStylesheet`. Scripturi: `npm run format` și `npm run format:check` (al doilea nu modifică nimic — e cel pentru CI). `.prettierignore` stă în rădăcina proiectului și e complet (Prettier nu combină fișierele de ignore, folosește doar cel mai apropiat).
- **`.vscode/settings.json` comis în proiect** (format la salvare, Prettier ca formator implicit), ca toată grupa să aibă același setup.
- **Comentariile sunt în română și explică DE CE**, nu ce face codul.
- **Structura fișierelor:** `src/app/` (rute, un folder per rută), `src/app/api/` (Route Handlers), `src/components/` (componente proprii), `src/components/ui/` (shadcn, nu se editează manual), `src/lib/` (helpere, iar mai târziu agentul, persona, providerele), `docs/`, `scripts/`.
- **Documentația:** `docs/requirements.md` (acest fișier), `docs/README.md` (indexul + tabelul integrărilor), `docs/<integrare>/README.md` (pașii manuali, după `docs/_template/README.md`). Convențiile pentru agenți: `AGENTS.md`, cu `CLAUDE.md` și `.github/copilot-instructions.md` generate din el prin `scripts/sync-agent-instructions.sh`.
- **UI:** tot din **Tailwind + shadcn/ui** — zero CSS scris de mână, zero altă bibliotecă de componente. Componentele de UI se adaugă cu `npx shadcn@latest add <nume>`, nu se scriu de mână. **Toate iconițele din `lucide-react`**, singura sursă de iconițe.
- **Un component per fișier**, cu nume de fișier în `kebab-case` și componentă în `PascalCase`.
- **Registru, nu lanțuri de `if`:** listele care cresc (providere, secțiuni de preferințe, sugestii, opțiuni de temă) se declară ca date, iar UI-ul iterează peste ele. Așa o intrare nouă nu cere modificări în JSX.
- **Datele inventate stau NUMAI în `src/lib/mock/`.** Nicio valoare de test scrisă direct în componente — altfel înlocuirea lor cu date reale devine o vânătoare prin toate fișierele.
- **Starea aplicației într-un singur store** (`src/store/useAppStore.ts`, Zustand + `persist`, cheia `skillforge-app`). Ce e de moment (stare de încărcare, erori, dialoguri deschise) nu se salvează.

---

## 5. Cerințe pe faze

Regula de lucru a cursului: **un concept nou pe fază**. Ce nu e listat într-o fază nu se implementează în avans.

### Faza 0 — Documente și convenții _(livrată)_

**Scop:** să existe o sursă de adevăr și convenții pe care agenții le citesc singuri, fără să fie reexplicate la fiecare pas.

**Intrat:** acest fișier; `AGENTS.md` cu `CLAUDE.md` și `.github/copilot-instructions.md` generate prin `scripts/sync-agent-instructions.sh`; `README.md` scurt; `.gitignore`.

---

### Faza 1 — Scheletul aplicației _(livrată)_

**Scop:** un proiect care rulează, cu structura de rutare stabilită și cu cele două lucruri de care depinde orice apel către un LLM: un loc pe server de unde se cheamă modelul și un loc sigur unde stă cheia lui.

**Intrat:**

- proiect `skill-forge`: Next.js 16 + TypeScript + Tailwind v4 + ESLint, folder `src/`, alias `@/*`;
- shadcn/ui inițializat (`components.json`), componenta `button`, helperul `cn()` în `src/lib/utils.ts`;
- `src/app/layout.tsx` (shell comun, `<html>`/`<body>`, fonturi, metadata), `src/app/page.tsx` (ruta `/`), `src/app/globals.css` (Tailwind + tokenii shadcn);
- a doua rută, `src/app/demo/page.tsx` → `/demo`, cu navigare prin `<Link>` (client-side), nu `<a>`;
- `src/components/Counter.tsx` — component client (`"use client"` + `useState`) și `src/components/ServerInfo.tsx` — component server (fără directivă, `await connection()` ca să se randeze la cerere), afișate una lângă alta pe `/demo`, ca diferența să se vadă pe ecran;
- `src/app/api/hello/route.ts` — Route Handler care întoarce JSON și citește o variabilă de mediu fără prefix `NEXT_PUBLIC_`. **E strămoșul lui `src/app/api/chat/route.ts`**: pe același tip de rută va fi chemat modelul de limbaj, iar cheia lui va veni din același mecanism;
- `.env.example` (comis, doar nume de variabile) și `.env.local` (gitignorat, valorile reale);
- Prettier cu `prettier-plugin-tailwindcss`, `.prettierignore`, scripturile `format` / `format:check`, `.vscode/settings.json` comis;
- `docs/README.md` (index + tabelul integrărilor) și `docs/_template/README.md` (formatul obligatoriu al oricărui fișier de integrare) — locul și formatul există ÎNAINTE de prima cheie de API.

**Nu a intrat:** niciun apel către un LLM, nicio integrare externă, niciun profil, nicio persistență.

**Gata când:** `npm run build`, `npm run dev` și `npm run format` trec, `/` și `/demo` se încarcă, iar `/api/hello` întoarce JSON cu valoarea din `.env.local`.

---

### Faza 2 — Interfața aplicației, pe date inventate _(livrată)_

**Scop:** o versiune care merge și se poate publica ÎNAINTE de orice integrare cu un model de limbaj. Dacă am porni direct cu apeluri către LLM, timpul s-ar duce în chei de API și streaming, iar aplicația încă n-ar exista.

**Referință de layout:** capturi din interfața Claude (`docs/claude.example.png`) — de acolo se preiau **structura zonelor, ierarhia și spațierea**. NU se preiau numele, textele, iconițele de brand sau culorile: acelea sunt ale SkillForge.

**Intrat — structura de trei zone:**

- **Sidebar** (`src/components/layout/app-sidebar.tsx`, construit cu componenta `sidebar` din shadcn):
  - sus: **un singur buton, `+ New`**. Fără „Projects", „Artifacts", „Scheduled", „Customize" — aplicația face un lucru, iar meniul trebuie să spună asta;
  - mijloc: secțiunea **„Chats and tasks"** — lista de conversații într-un `ScrollArea`, cea activă evidențiată, iar pe hover un `DropdownMenu` cu **Redenumește** (dialog cu `Input` + `Label`) și **Șterge** (cu confirmare pe `toast`);
  - jos: rândul de utilizator — `Avatar` + numele din profil + `ChevronUp`, care **deschide preferințele**.
- **Header** (`src/components/layout/app-header.tsx`): doar `SidebarTrigger` + titlul conversației. Fără bară de acțiuni și, explicit, **fără buton de temă**.
- **Centru** (`src/components/chat/`): `chat.tsx` (decide ecran de start vs. conversație), `message-list.tsx`, `message-item.tsx`, `chat-input.tsx`, `empty-state.tsx`.

**Intrat — preferințele ca fereastră separată** (`src/components/settings/settings-dialog.tsx`): un `Dialog` cu două panouri — stânga navigația (`Settings` → General, `UserRound` → Profilul tău, `Sparkles` → Providere), dreapta conținutul. Nu e panou inline și nu înlocuiește conversația.

- **Profilul tău** (`settings/profile-form.tsx`): `Nume`, `Stack actual`, `Skills` (un `Textarea`, o pereche pe linie, în formatul `nume: nivel`) și `Obiectiv`, cu `Input`/`Textarea` + `Label`. Niveluri permise: `începător`, `intermediar`, `avansat`; liniile neînțelese sunt raportate într-un `Alert`, iar profilul nu se salvează până sunt corectate.
- **General → Appearance** (`settings/appearance-form.tsx`): `ToggleGroup` cu trei opțiuni — **sistem** (`Monitor`), **light** (`Sun`), **dark** (`Moon`). Tema se schimbă **doar de aici**. Implicit: `sistem`, calculat cu `matchMedia("(prefers-color-scheme: dark)")` + listener, ca schimbarea din sistemul de operare să se vadă fără refresh (`src/components/theme/theme-provider.tsx`).
- **Providere** (`settings/providers-form.tsx`): provider și model, generate din registru. OpenAI apare dezactivat, cu eticheta fazei în care intră. Aici nu există și nu va exista câmp pentru cheia de API — cheia stă pe server.

**Intrat — composer-ul** (`chat/chat-input.tsx`): cutie cu bordură, `Textarea` care crește cu textul (până la o înălțime maximă, apoi derulează), `Enter` trimite / `Shift+Enter` rând nou. Pe rândul de jos al cutiei: stânga `Plus` (loc rezervat pentru atașamente), dreapta providerul + modelul și un singur buton care comută între `Send` și `Square` (stop).

**Intrat — mesajele** (`chat/message-item.tsx`): `Avatar` + rolul, bula de user aliniată dreapta, cea de assistant la stânga, buton `Copy` **în interiorul bulei** (cu `Tooltip`) și confirmare pe `toast`.

**Intrat — stările de UI, făcute acum ca să nu fie uitate când vin datele reale:** ecran gol (conversație nouă, cu salut pe numele din profil și 3–4 sugestii care doar pre-completează inputul), `Skeleton` la încărcare, indicator „scrie…" animat, `Alert` pentru erori (declanșabil cu mesajul `/eroare`, cât timp nu există erori reale).

**Intrat — datele și starea:**

- **datele inventate stau NUMAI în `src/lib/mock/`**: `conversations.ts` (conversații cu mesaje + răspunsul simulat) și `profile.ts` (profilul). La Faza 3 se înlocuiesc dintr-o singură atingere;
- **starea aplicației în `src/store/useAppStore.ts`** (Zustand + `persist`, cheia `skillforge-app`): profilul, providerul și modelul, tema, conversațiile și `activeConversationId`. Așa lista de conversații supraviețuiește refresh-ului chiar și fără bază de date. Stările de moment (`status`, eroarea, dialogul deschis) sunt excluse din salvare.

**Nu a intrat (interzis explicit în această fază):** `src/app/api/chat/route.ts`, chei de API, orice SDK de LLM, Supabase, autentificare. Proiectul pornește pe orice laptop, fără configurare.

**Gata când:** `npm run build`, `npm run dev`, `npm run lint` și `npm run format` trec; se poate naviga prin conversații, redenumi, șterge, edita profilul și schimba tema; interfața funcționează la 390px lățime (pe mobil sidebar-ul intră în `Sheet`, deschis din `SidebarTrigger`); aplicația e publicabilă — repo pe GitHub + deploy pe Vercel, versiunea de siguranță dinaintea oricărei integrări.

---

### Faza 3 — Agentul: apel la LLM și streaming

**Scop:** primul răspuns real de model în interfață, cu cheia în siguranță pe server.

**Intră:**

- `src/app/api/chat/route.ts` — Route Handler care apelează Anthropic prin Vercel AI SDK și întoarce un stream;
- răspunsul apare progresiv în UI, cu posibilitatea de a-l opri;
- cheia din `ANTHROPIC_API_KEY`, citită doar pe server;
- tratarea a trei erori: cheie lipsă/invalidă, provider indisponibil, limită de rate;
- `docs/anthropic/README.md` — pașii manuali (cont, generare cheie, variabilă, costuri), plus rândul din indexul din `docs/README.md`.

**Nu intră:** profil, memorie, al doilea provider, unelte.

**Gata când:** pui o întrebare, răspunsul apare token cu token, iar `ANTHROPIC_API_KEY` nu apare nicăieri în ce ajunge în browser.

---

### Faza 4 — Profil și persona

**Scop:** răspunsuri în contextul MEU. Aici aplicația încetează să fie un chat generic.

**Intră:**

- model de profil: stack curent, skill-uri cu nivel (ex. 1–5), obiectiv, timp disponibil pe săptămână, preferințe de învățare;
- ecran de editare a profilului, salvat în `localStorage`;
- construirea system prompt-ului („persona") din profil, la fiecare cerere;
- profilul e trimis de browser la `/api/chat` împreună cu mesajele (serverul nu are încă stare) și e validat pe server;
- export și ștergere profil (cerință de date personale, §6);
- în UI se vede că răspunsul a folosit profilul (transparență).

**Nu intră:** istoric persistent al conversațiilor, memorie de fapte, profil pe server.

**Gata când:** aceeași întrebare, cu două profile diferite, produce două răspunsuri clar diferite — și întrebarea de referință nr. 1 (§3) primește un răspuns care nu ar fi valabil pentru altcineva.

---

### Faza 5 — Al doilea provider și costul

**Scop:** să demonstrăm că providerul e schimbabil și să vedem ce costă fiecare răspuns.

**Intră:** OpenAI ca al doilea provider, în spatele aceleiași abstracții; selector de provider/model în UI, cu implicit din configurația de server; numărul de tokeni și costul estimat per răspuns; `docs/openai/README.md`; posibilitatea de a compara aceeași întrebare pe două providere.

**Nu intră:** rutare automată între modele în funcție de cost, cache de răspunsuri.

**Gata când:** schimbi providerul din UI fără să modifici cod, iar costul estimat apare pentru ambele.

---

### Faza 6 — Memorie între sesiuni

**Scop:** continuitate. Agentul își amintește ce s-a stabilit și ce s-a terminat.

**Intră:** istoric de conversații în `localStorage` (listă de sesiuni, redeschidere); „fapte reținute" — memorie structurată, separată de istoricul brut (ex. _„a terminat modulul de streaming"_), cu adăugare/ștergere din UI; injectarea controlată în context (profil + fapte + ultimele mesaje, nu tot istoricul — limită de tokeni și cost); ecran în care se vede ce ține minte aplicația despre tine.

**Nu intră:** extragerea automată a faptelor de către agent (depinde de unelte — Faza 7), sincronizare între device-uri.

**Gata când:** întrebarea de referință nr. 3 (§3) funcționează după închiderea și redeschiderea browserului.

---

### Faza 7 — Unelte (tool calling)

**Scop:** agentul acționează, nu doar răspunde.

**Intră:** unealtă de actualizare a planului de învățare (`updateLearningPlan`) — agentul marchează un pas ca terminat sau adaugă pași; unealtă de scriere în memorie (`rememberFact`) — extragerea automată a faptelor din Faza 6; afișarea în UI a apelurilor de unelte (ce a apelat agentul și cu ce argumente), ca să nu fie cutie neagră; confirmarea utilizatorului înainte de uneltele care scriu date.

**Nu intră:** unelte care apelează servicii externe, execuție de cod, unelte cu efecte ireversibile.

**Gata când:** ceri „am terminat modulul X" și planul din aplicație se actualizează efectiv, cu apelul de unealtă vizibil în interfață.

---

### Faza 8 — Notițe și RAG

**Scop:** agentul caută în notițele mele înainte să răspundă.

**Intră:** notițe proprii (adăugare, listare); indexarea lor și căutare semantică; unealta `searchNotes`, folosită de agent atunci când întrebarea trimite la ele; citarea în răspuns a notiței folosite.

**Nu intră:** corpus mare (mii de documente), import automat din surse externe.

**Gata când:** o întrebare despre ceva scris doar în notițe primește un răspuns care citează notița, nu una inventată.

---

### Faza 9 — Supabase: date pe server și autentificare

**Scop:** datele mele să nu mai trăiască într-un singur browser.

**Intră:** schemă pentru profil, sesiuni de chat, fapte reținute, planuri și notițe; autentificare; Row Level Security (fiecare utilizator vede doar datele lui); migrare din `localStorage` în cont la prima autentificare; serverul construiește persona din baza de date, nu din ce trimite browserul (vezi riscul din §6.2); `docs/supabase/README.md`.

**Nu intră:** roluri și permisiuni, echipe, partajare de planuri între utilizatori.

**Gata când:** intri de pe alt calculator, te autentifici și găsești același profil, aceeași memorie și același plan.

---

### Faza 10 — Deploy și observabilitate

**Scop:** se vede ce se întâmplă în aplicație. Deploy-ul în sine s-a făcut deja la Faza 2 (versiunea de siguranță, înainte de orice integrare); aici se adaugă ce lipsește.

**Intră:** variabile de mediu configurate în producție pentru toate integrările adăugate între timp, jurnalizarea cererilor de LLM (model, tokeni, cost, latență, erori), tablou simplu de consum, `docs/vercel/README.md`.

**Nu intră:** scalare, medii multiple dincolo de minimul necesar, alerte complexe.

**Gata când:** aplicația e accesibilă pe un URL public, iar pentru fiecare răspuns există o înregistrare cu model, tokeni și cost.

---

### Non-scop (explicit amânat)

Nu construim, până când nu apare aici o cerință explicită: aplicație mobilă nativă; multi-user cu roluri și organizații; plăți și abonamente; fine-tuning de modele; RAG pe corpus mare (indexare de mii de documente — Faza 8 acoperă doar notițele proprii); colaborare în timp real; internaționalizare a interfeței.

## 6. Cerințe non-funcționale

### 6.1 Chei de API și secrete

- Cheile stau **numai** în variabile de mediu, citite **numai** în cod care rulează pe server (Route Handlers).
- Nume folosite: `ANTHROPIC_API_KEY` (Faza 3), `OPENAI_API_KEY` (Faza 5), variabilele Supabase (Faza 9 — cheia `service_role` nu ajunge niciodată în client).
- Nicio cheie în: cod, componente client, URL-uri, log-uri, mesaje de eroare afișate utilizatorului, documentație, git.
- `.env.local` este ignorat de git. `.env.example` conține **doar numele** variabilelor, cu valori de tip placeholder.
- În documentația de integrare se scriu **numele variabilelor și de unde se obțin valorile**, niciodată valorile reale.
- Dacă o cheie a fost expusă vreodată: se revocă și se regenerează, nu se „curăță" doar din fișier.

### 6.2 Datele personale din profil

Profilul conține date despre carieră: rol actual, angajator (opțional), skill-uri, nivel, obiective, timp disponibil. Sunt date personale, chiar dacă nu sunt sensibile legal.

- **Unde stau, pe fază:** Fazele 4–8 → `localStorage`, doar în browserul utilizatorului, pe un singur device. Faza 9 → Supabase, legat de contul lui, protejat prin Row Level Security.
- **Cine le vede:** utilizatorul. Plus **providerul de LLM**: profilul și faptele reținute sunt trimise la fiecare cerere, ca parte din system prompt. Acest lucru trebuie spus explicit în interfață — utilizatorul trebuie să știe ce iese din aplicație.
- **Minimizare:** trimitem în context doar ce e relevant pentru întrebare (profil + fapte reținute + ultimele mesaje), nu tot istoricul. Câmpurile opționale (ex. angajator) rămân opționale.
- **Control:** din Faza 4 utilizatorul poate exporta profilul (JSON) și îl poate șterge complet. Ștergerea înseamnă ștergere reală, nu marcaj.
- **Risc cunoscut, acceptat până la Faza 9:** cât timp profilul vine de la browser, serverul îl primește ca dată de intrare și îl poate include în system prompt. Este acceptabil pentru un singur utilizator, în dezvoltare; **nu** e acceptabil în producție cu mai mulți utilizatori. La Faza 9 sursa profilului devine baza de date, iar intrarea din browser nu mai e de încredere.

### 6.3 Cost

- Costul se urmărește per provider și model (preț per milion de tokeni, separat intrare/ieșire). De la Faza 5, costul estimat al fiecărui răspuns e vizibil în UI.
- **Cifrele concrete de preț și limitele planurilor stau în `docs/<integrare>/README.md`**, nu aici — prețurile se schimbă, și nu vrem două locuri care se contrazic.
- Măsuri de control: limită de tokeni în răspuns, context trimis controlat (§6.2), model mai ieftin pentru sarcini simple atunci când e evident.

### 6.4 Performanță

- Primul token trebuie să apară repede (țintă: sub ~2 secunde în condiții normale); streaming-ul e mecanismul principal prin care aplicația _pare_ rapidă.
- Interfața rămâne utilizabilă în timp ce răspunsul se scrie; răspunsul poate fi oprit din UI.

### 6.5 Erori și fiabilitate

Tratate explicit, cu mesaj clar în UI (fără stack trace, fără detalii de cheie): cheie lipsă sau invalidă; provider indisponibil sau în timeout; limită de rate atinsă; răspuns întrerupt în timpul streaming-ului; date invalide de profil.

### 6.6 Accesibilitate și interfață

Minim asumat: navigare cu tastatura pe fluxul de chat, contrast lizibil, `aria-live` pentru textul care se scrie progresiv, funcționare pe ecran de telefon. Nu urmărim conformitate WCAG completă în fazele 1–5.

---

## 7. Documentația pentru pașii manuali

Regulă fixă a proiectului: **fiecare integrare externă primește `docs/<integrare>/README.md`** cu partea care se face de mână (cont, generare cheie, variabilă de mediu, configurare în dashboard, costuri, verificare). Codul îl scrie agentul; pașii manuali se uită imediat dacă nu-i notează nimeni — la reinstalare, pe alt calculator sau la deploy.

Șablon și secțiuni obligatorii: [`docs/_template/README.md`](_template/README.md). Indexul integrărilor: [`docs/README.md`](README.md). Regula, în forma citită de agenți: [`AGENTS.md`](../AGENTS.md).

---

## 8. Glosar

Ca să numim la fel aceleași lucruri:

- **Agent** — sistemul care primește o întrebare având deja context (profil + memorie), decide ce să facă (răspunde sau apelează o unealtă) și produce răspunsul. Diferența față de „un apel la un model": contextul și deciziile îi aparțin aplicației, nu utilizatorului care scrie prompt-ul.
- **Provider** — furnizorul modelului de limbaj (Anthropic, OpenAI). Se configurează pe server și e schimbabil fără să rescriem aplicația.
- **Model** — varianta concretă folosită de la un provider (ex. un model Claude), cu preț și capabilități proprii.
- **Streaming** — răspunsul ajunge în interfață bucată cu bucată, pe măsură ce e generat, nu la final.
- **System prompt** — instrucțiunile trimise modelului înaintea conversației: cine e el, ce știe despre utilizator, cum să răspundă.
- **Persona** — system prompt-ul generat din profilul real al utilizatorului. „Persona" = profil transformat în instrucțiuni pentru agent.
- **Profil** — datele declarate de utilizator: stack, skill-uri cu nivel, obiectiv, timp disponibil. Se editează din UI.
- **Memorie** — ce reține aplicația între sesiuni: istoricul conversațiilor plus **fapte reținute** (afirmații scurte și structurate, ex. „a terminat modulul de streaming"). Memoria e a aplicației; modelul în sine nu ține minte nimic între cereri.
- **Unealtă (tool)** — o funcție pe care agentul o poate apela singur (caută în notițe, actualizează planul). Modelul cere apelul, aplicația îl execută și îi dă rezultatul.
- **Token** — unitatea în care modelele măsoară textul și în care se facturează. Contextul trimis + răspunsul = cost.
- **Route Handler** — fișierul de server din Next.js (`app/api/*/route.ts`) care primește cererea din browser. Singurul loc unde există cheia de API.
- **Fază** — un pas din curs, cu scop propriu și criteriu de „gata" (§5).

---

## 9. Cum se schimbă cerințele

1. Acest fișier e sursa de adevăr. Dacă discuția din chat contrazice ce e scris aici, **ce e scris aici câștigă** până e actualizat.
2. Când se schimbă direcția, se actualizează **aici**, în același pas cu codul: faza afectată, plus cerințele non-funcționale atinse. Nu se lasă decizia doar în conversație.
3. O cerință amânată nu se șterge — se mută în faza potrivită sau în **Non-scop**, ca să rămână urma deciziei.
4. Se actualizează data și faza curentă din capul fișierului.
5. `README.md` rămâne scurt și trimite aici; nu se copiază cerințe în el.
