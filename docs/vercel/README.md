# Vercel — pași manuali

## Ce face

Găzduiește aplicația SkillForge online: construiește proiectul Next.js la fiecare push pe GitHub și îl servește pe un URL public. Fără ea, aplicația rulează doar pe calculatorul tău, iar „merge la mine" nu poate fi verificat de nimeni.

**Adăugată la:** Faza 2 (interfața pe date inventate) — intenționat **înainte** de orice integrare cu un model de limbaj, ca să existe o versiune de siguranță care se poate publica.
**Obligatorie / opțională:** opțională pentru dezvoltare, obligatorie pentru a arăta aplicația altcuiva.

## Cont & chei

- Cont: <https://vercel.com/signup> — planul **Hobby** (gratuit) e suficient pentru acest proiect.
- Cel mai simplu e autentificarea cu contul de GitHub: așa Vercel vede direct repo-urile și nu mai trebuie configurat nimic pentru acces.
- **Nu ai nevoie de nicio cheie de API de la Vercel** pentru deploy din interfață. Un token (`Account Settings → Tokens`) e necesar doar dacă vrei deploy din linia de comandă sau din CI.

### Înainte de deploy: repo pe GitHub

1. Creează un repo nou (privat sau public) pe <https://github.com/new>. Nu bifa „Add a README" — proiectul are deja unul.
2. Local, în rădăcina proiectului:
   ```bash
   git add .
   git commit -m "SkillForge: interfața pe date inventate"
   git remote add origin git@github.com:<utilizator>/<repo>.git
   git push -u origin master
   ```
3. Verifică pe GitHub că **NU** apare niciun fișier `.env.local`. E ignorat prin `.gitignore`, dar verificarea costă 5 secunde și o cheie publicată nu se mai poate „retrage".

## Variabile de mediu

În faza asta aplicația nu are nevoie de nicio variabilă ca să funcționeze — deploy-ul trece fără să configurezi nimic. Singura variabilă existentă e cea de demonstrație folosită de `/api/hello`:

| Variabilă              | Fișier (local) | Ajunge în browser?                    |
| ---------------------- | -------------- | ------------------------------------- |
| `SKILLFORGE_GREETING`  | `.env.local`   | NU (fără prefix `NEXT_PUBLIC_`)       |
| `NEXT_PUBLIC_APP_NAME` | `.env.local`   | DA (prefixul `NEXT_PUBLIC_` = public) |

În producție se configurează în: **Vercel → Project → Settings → Environment Variables**, separat pentru `Production`, `Preview` și `Development`.

Cheile de LLM (`ANTHROPIC_API_KEY`, la Faza 3) se adaugă **doar** acolo, niciodată în repo. După ce adaugi sau schimbi o variabilă, e nevoie de un **redeploy** — variabilele se citesc la build/pornire, nu la fiecare cerere.

## Pași manuali

Ce nu poate face agentul:

1. **Import proiect:** Vercel → `Add New… → Project` → alege repo-ul de pe GitHub. Framework-ul e detectat automat („Next.js"); comenzile implicite de build sunt corecte, nu le modifica.
2. **Deploy:** apasă `Deploy` și așteaptă. Primul build durează câteva minute (instalează dependințele de la zero).
3. **Branch de producție:** Settings → Git → `Production Branch`. Repo-ul acestui proiect folosește `master`, nu `main` — verifică valoarea, altfel push-urile tale ajung doar în `Preview`.
4. **Protecția URL-ului (opțional):** Settings → Deployment Protection, dacă nu vrei ca aplicația să fie publică.
5. **Domeniu propriu (opțional):** Settings → Domains.
6. La fiecare push pe branch-ul de producție, Vercel face automat deploy. Pentru orice altă ramură primești un URL de `Preview` — util ca să arăți o versiune fără s-o publici.

## Cost & limite

- **Hobby: gratuit**, pentru proiecte necomerciale. Include build-uri automate, HTTPS și URL-uri de preview.
- Limite relevante pentru noi, pe planul gratuit: număr limitat de build-uri pe zi și un plafon lunar de transfer/execuție. Pentru un proiect de curs nu se ating.
- **Ce va umfla factura mai târziu (nu Vercel, ci providerul de LLM):** de la Faza 3, fiecare răspuns costă tokeni. Un URL public + o cheie de API înseamnă că oricine deschide aplicația consumă pe cheia ta — de asta Deployment Protection devine relevantă exact atunci.
- Verifică cifrele actuale înainte să te bazezi pe ele: <https://vercel.com/pricing>.

## Verificare

1. Local, înainte de deploy:
   ```bash
   npm run build
   ```
   Trebuie să treacă. Vercel rulează exact aceeași comandă — un build care cade local va cădea și acolo.
2. După deploy, deschide URL-ul primit și verifică: ecranul de start apare, lista de conversații e populată, preferințele se deschid, tema se schimbă din General → Appearance.
3. `https://<proiect>.vercel.app/api/hello` → dacă `SKILLFORGE_GREETING` nu e configurată în Vercel, răspunde cu 500 și mesajul care spune ce variabilă lipsește. E comportamentul corect, nu un bug — și e exact ce vei vedea la Faza 3 dacă uiți cheia de API.

## Erori frecvente

| Eroare                                             | Cauză                                                  | Rezolvare                                                      |
| -------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| Build-ul cade cu erori de TypeScript / ESLint      | Vercel rulează build de producție, mai strict ca `dev` | Rulează `npm run build` local și repară înainte de push        |
| Deploy reușit, dar aplicația arată versiunea veche | Push-ul a mers pe alt branch decât cel de producție    | Settings → Git → Production Branch (`master` la acest proiect) |
| `500` pe `/api/hello` în producție                 | Variabila de mediu nu e configurată în Vercel          | Settings → Environment Variables, apoi **redeploy**            |
| O variabilă nouă nu se vede în aplicație           | Variabilele se citesc la build                         | Redeploy după fiecare modificare                               |
