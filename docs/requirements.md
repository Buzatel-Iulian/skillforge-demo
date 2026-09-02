# SkillForge — Cerințe

> Acest fișier este **sursa de adevăr** pentru ce construim. Orice schimbare de direcție se scrie AICI, nu doar în conversație. Vezi [Cum se schimbă cerințele](#9-cum-se-schimbă-cerințele).
>
> Ultima actualizare: 2026-09-02 · Faza curentă: **Faza 0 — documente și convenții**

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

| Problema cu un chat generic | Ce cerință rezultă |
|---|---|
| Dă sfaturi generice, valabile pentru oricine | System prompt construit din profilul real (§4, §5 Faza 2) |
| Uită de la o sesiune la alta cine ești | Memorie persistentă între sesiuni (§5 Faza 3, Faza 6) |
| Profilul nu crește — îl reintroduci de fiecare dată | Profil salvat, editabil, care se actualizează în timp |
| E un tab de chat al altcuiva, nu unealta ta | Aplicație proprie, cu date proprii și providere schimbabile |

---

## 3. Întrebări de referință

Acestea sunt **criteriul de „funcționează bine?"**. La finalul fazelor 1–3 aplicația trebuie să răspundă bine la toate trei.

**1. „Ce-mi lipsește ca să trec de la Java backend la AI engineer?"**
Răspunsul trebuie să: pornească de la skill-urile deja existente în profil (nu le repredă), numească explicit golurile față de obiectiv, și le ordoneze după impact. Un răspuns care ar fi identic pentru orice utilizator = eșec.

**2. „Fă-mi un plan de 3 luni pentru Next.js + AI SDK."**
Răspunsul trebuie să: fie calibrat pe nivelul din profil (un senior backend nu începe de la sintaxă), să conțină pași concreți și verificabili (nu „învață React"), și să se încadreze în timpul declarat de utilizator.

**3. „Ține minte că am terminat modulul de streaming — ce urmează?"**
Răspunsul trebuie să: rețină faptul (persistent, disponibil în sesiunea următoare), și să continue **din punctul acela** al planului existent, nu să regenereze un plan nou de la zero.

---

## 4. Principii tehnice (valabile în toate fazele)

Acestea nu se negociază de la fază la fază:

1. **Agent AI în centru**, nu un formular care trimite un text la un model și afișează rezultatul. Agentul are context (profil + memorie), iar de la Faza 5 și unelte pe care le folosește singur.
2. **Răspuns în streaming** — textul apare progresiv, nu după 20 de secunde de spinner.
3. **System prompt construit din profil**, generat la runtime. Nu hardcodat în cod.
4. **Memorie între sesiuni** — ce s-a stabilit sau s-a terminat rămâne disponibil la următoarea deschidere a aplicației.
5. **LLM-ul se apelează DOAR de pe server.** Cheia de API nu ajunge niciodată în browser, în bundle-ul de client sau într-un URL.
6. **Provider schimbabil** — codul aplicației nu depinde de un singur furnizor de LLM, ca să putem compara răspunsuri și costuri.

### Stack fixat

- **Next.js (App Router) + TypeScript** — o singură aplicație, cu UI și server în același proiect.
- **Vercel AI SDK** — streaming către UI și abstracția de provider.
- **Route Handler** (`app/api/.../route.ts`) — singurul loc de unde se apelează modelul.
- **Provider implicit: Anthropic (Claude).** Al doilea provider: OpenAI (Faza 4), pentru comparație.
- **Persistență:** `localStorage` în fazele 2–5; **Supabase** din Faza 6.

---

## 5. Cerințe pe faze

Regula de lucru a cursului: **un concept nou pe fază**. Ce nu e listat într-o fază nu se implementează în avans.

### Faza 0 — Documente și convenții *(faza curentă)*

**Scop:** să existe o sursă de adevăr și convenții pe care agenții le citesc singuri, fără să fie reexplicate la fiecare pas.

**Intră:** acest fișier; `AGENTS.md` (convenții, în engleză) cu `CLAUDE.md` și `.github/copilot-instructions.md` generate din el prin script; `README.md` scurt; `.gitignore`; șablonul pentru documentația de integrare.

**Nu intră:** niciun cod de aplicație, nicio dependință instalată.

**Gata când:** `docs/requirements.md` e suficient singur ca să știi ce urmează, iar scriptul de sincronizare rulează și în mod `--check`.

---

### Faza 1 — Chat cu streaming, de pe server

**Scop:** primul răspuns de LLM în interfață, cu cheia în siguranță pe server.

**Intră:**
- schelet Next.js (App Router, TypeScript);
- pagină de chat: listă de mesaje, input, stare de „se scrie";
- Route Handler `/api/chat` care apelează Anthropic prin AI SDK și returnează un stream;
- cheia din variabila de mediu `ANTHROPIC_API_KEY`, citită doar pe server; `.env.example` cu numele variabilei;
- tratarea a trei erori: cheie lipsă/invalidă, provider indisponibil, limită de rate;
- `docs/anthropic/README.md` — pașii manuali (cont, generare cheie, variabilă, costuri), conform regulii de integrare.

**Nu intră:** profil, persistență (istoricul se pierde la refresh), al doilea provider, unelte, autentificare.

**Gata când:** pui o întrebare, răspunsul apare progresiv, iar `ANTHROPIC_API_KEY` nu apare nicăieri în ce ajunge în browser.

---

### Faza 2 — Profil și persona

**Scop:** răspunsuri în contextul MEU. Aici aplicația încetează să fie un chat generic.

**Intră:**
- model de profil: stack curent, skill-uri cu nivel (ex. 1–5), obiectiv, timp disponibil pe săptămână, preferințe de învățare;
- ecran de editare a profilului, salvat în `localStorage`;
- construirea system prompt-ului („persona") din profil, la fiecare cerere;
- profilul e trimis de browser la `/api/chat` împreună cu mesajele (serverul nu are încă stare);
- export și ștergere profil (cerință de date personale, §6);
- afișarea, în UI, a faptului că profilul e folosit în răspuns (transparență).

**Nu intră:** istoric persistent al conversațiilor, memorie de fapte, profil pe server.

**Gata când:** aceeași întrebare, cu două profile diferite, produce două răspunsuri clar diferite — și întrebarea de referință nr. 1 (§3) primește un răspuns care nu ar fi valabil pentru altcineva.

---

### Faza 3 — Memorie între sesiuni

**Scop:** continuitate. Agentul își amintește ce s-a stabilit și ce s-a terminat.

**Intră:**
- istoric de conversații salvat în `localStorage` (listă de sesiuni, redeschidere);
- „fapte reținute" — memorie structurată, separată de istoricul brut (ex. *„a terminat modulul de streaming"*, *„țintă: AI engineer până în iunie"*), cu adăugare/ștergere manuală din UI;
- injectarea controlată în context: profil + fapte reținute + ultimele mesaje, nu tot istoricul (limită de tokeni și cost);
- ecran în care se vede ce ține minte aplicația despre tine.

**Nu intră:** extragerea automată a faptelor de către agent (aceea depinde de unelte — Faza 5), sincronizare între device-uri.

**Gata când:** întrebarea de referință nr. 3 (§3) funcționează după închiderea și redeschiderea browserului.

---

### Faza 4 — Al doilea provider și costul

**Scop:** să demonstrăm că providerul e schimbabil și să vedem ce costă fiecare răspuns.

**Intră:**
- OpenAI ca al doilea provider, în spatele aceleiași abstracții;
- selector de provider/model în UI, cu provider implicit din configurație pe server;
- numărul de tokeni consumați și costul estimat per răspuns;
- `docs/openai/README.md` cu pașii manuali și costurile;
- posibilitatea de a pune aceeași întrebare pe două providere și a compara răspunsurile.

**Nu intră:** rutare automată între modele în funcție de cost, cache de răspunsuri.

**Gata când:** schimbi providerul din UI fără să modifici cod, iar costul estimat apare pentru ambele.

---

### Faza 5 — Unelte (tool calling)

**Scop:** agentul acționează, nu doar răspunde.

**Intră:**
- unealtă de căutare în notițele proprii (`searchNotes`);
- unealtă de actualizare a planului de învățare (`updateLearningPlan`) — agentul marchează un pas ca terminat sau adaugă pași;
- unealtă de scriere în memorie (`rememberFact`) — extragerea automată a faptelor din Faza 3;
- afișarea în UI a apelurilor de unelte (ce a apelat agentul și cu ce argumente) — vizibilitate, nu cutie neagră;
- confirmarea utilizatorului înainte de uneltele care scriu date.

**Nu intră:** unelte care apelează servicii externe, execuție de cod, unelte cu efecte ireversibile.

**Gata când:** ceri „am terminat modulul X" și planul din aplicație se actualizează efectiv, cu apelul de unealtă vizibil în interfață.

---

### Faza 6 — Supabase: date pe server și autentificare

**Scop:** datele mele să nu mai trăiască într-un singur browser.

**Intră:**
- Supabase: schemă pentru profil, sesiuni de chat, fapte reținute, planuri de învățare;
- autentificare (login), cu datele legate de utilizator;
- Row Level Security — fiecare utilizator vede doar datele lui;
- migrare din `localStorage` în cont, la prima autentificare;
- serverul construiește persona din baza de date, nu din ce trimite browserul (vezi riscul din §6);
- `docs/supabase/README.md` cu pașii manuali.

**Nu intră:** roluri și permisiuni, echipe, partajare de planuri între utilizatori.

**Gata când:** intri de pe alt calculator, te autentifici și găsești același profil, aceeași memorie și același plan.

---

### Faza 7 — Deploy și observabilitate

**Scop:** aplicația e online și se vede ce se întâmplă în ea.

**Intră:** deploy (Vercel), variabile de mediu în mediul de producție, jurnalizarea cererilor de LLM (model, tokeni, cost, latență, erori), tablou simplu de consum, `docs/vercel/README.md`.

**Nu intră:** scalare, mai multe medii (staging/prod) dincolo de minimul necesar, alerte complexe.

**Gata când:** aplicația e accesibilă pe un URL public, iar pentru fiecare răspuns există o înregistrare cu model, tokeni și cost.

---

### Non-scop (explicit amânat)

Nu construim, până când nu apare aici o cerință explicită: aplicație mobilă nativă; multi-user cu roluri și organizații; plăți și abonamente; fine-tuning de modele; RAG pe corpus mare (indexare de mii de documente); colaborare în timp real; internaționalizare a interfeței.

---

## 6. Cerințe non-funcționale

### 6.1 Chei de API și secrete

- Cheile stau **numai** în variabile de mediu, citite **numai** în cod care rulează pe server (Route Handlers).
- Nume folosite: `ANTHROPIC_API_KEY` (Faza 1), `OPENAI_API_KEY` (Faza 4), variabilele Supabase (Faza 6 — cheia `service_role` nu ajunge niciodată în client).
- Nicio cheie în: cod, componente client, URL-uri, log-uri, mesaje de eroare afișate utilizatorului, documentație, git.
- `.env.local` este ignorat de git. `.env.example` conține **doar numele** variabilelor, cu valori de tip placeholder.
- În documentația de integrare se scriu **numele variabilelor și de unde se obțin valorile**, niciodată valorile reale.
- Dacă o cheie a fost expusă vreodată: se revocă și se regenerează, nu se „curăță" doar din fișier.

### 6.2 Datele personale din profil

Profilul conține date despre carieră: rol actual, angajator (opțional), skill-uri, nivel, obiective, timp disponibil. Sunt date personale, chiar dacă nu sunt sensibile legal.

- **Unde stau, pe fază:** Fazele 2–5 → `localStorage`, doar în browserul utilizatorului, pe un singur device. Faza 6 → Supabase, legat de contul lui, protejat prin Row Level Security.
- **Cine le vede:** utilizatorul. Plus **providerul de LLM**: profilul și faptele reținute sunt trimise la fiecare cerere, ca parte din system prompt. Acest lucru trebuie spus explicit în interfață — utilizatorul trebuie să știe ce iese din aplicație.
- **Minimizare:** trimitem în context doar ce e relevant pentru întrebare (profil + fapte reținute + ultimele mesaje), nu tot istoricul. Câmpurile opționale (ex. angajator) rămân opționale.
- **Control:** din Faza 2 utilizatorul poate exporta profilul (JSON) și îl poate șterge complet. Ștergerea înseamnă ștergere reală, nu marcaj.
- **Risc cunoscut, acceptat până la Faza 6:** cât timp profilul vine de la browser, serverul îl primește ca dată de intrare și îl poate include în system prompt. Este acceptabil pentru un singur utilizator, în dezvoltare; **nu** e acceptabil în producție cu mai mulți utilizatori. La Faza 6 sursa profilului devine baza de date, iar intrarea din browser nu mai e de încredere.

### 6.3 Cost

- Costul se urmărește per provider și model (preț per milion de tokeni, separat intrare/ieșire). De la Faza 4, costul estimat al fiecărui răspuns e vizibil în UI.
- **Cifrele concrete de preț și limitele planurilor stau în `docs/<integrare>/README.md`**, nu aici — prețurile se schimbă, și nu vrem două locuri care se contrazic.
- Măsuri de control: limită de tokeni în răspuns, context trimis controlat (§6.2), model mai ieftin pentru sarcini simple atunci când e evident.

### 6.4 Performanță

- Primul token trebuie să apară repede (țintă: sub ~2 secunde în condiții normale); streaming-ul e mecanismul principal prin care aplicația *pare* rapidă.
- Interfața rămâne utilizabilă în timp ce răspunsul se scrie; răspunsul poate fi oprit din UI.

### 6.5 Erori și fiabilitate

Tratate explicit, cu mesaj clar în UI (fără stack trace, fără detalii de cheie): cheie lipsă sau invalidă; provider indisponibil sau în timeout; limită de rate atinsă; răspuns întrerupt în timpul streaming-ului; date invalide de profil.

### 6.6 Accesibilitate și interfață

Minim asumat: navigare cu tastatura pe fluxul de chat, contrast lizibil, `aria-live` pentru textul care se scrie progresiv, funcționare pe ecran de telefon. Nu urmărim conformitate WCAG completă în fazele 1–5.

---

## 7. Documentația pentru pașii manuali

Regulă fixă a proiectului: **fiecare integrare externă primește `docs/<integrare>/README.md`** cu partea care se face de mână (cont, generare cheie, variabilă de mediu, configurare în dashboard, costuri, verificare). Codul îl scrie agentul; pașii manuali se uită imediat dacă nu-i notează nimeni — la reinstalare, pe alt calculator sau la deploy.

Șablon: [`docs/_template-integrare.md`](_template-integrare.md). Regula, în forma citită de agenți: [`AGENTS.md`](../AGENTS.md).

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
