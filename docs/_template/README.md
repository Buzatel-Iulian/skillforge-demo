# <Nume integrare>

> Șablon. Se copiază în `docs/<integrare>/README.md` la pasul în care integrarea intră efectiv în proiect
> (ex. `docs/anthropic/README.md`), împreună cu rândul din tabelul din [`../README.md`](../README.md).
>
> Toate cele șase secțiuni de mai jos sunt **obligatorii**. Dacă una nu se aplică, se scrie explicit de ce.
>
> **Fără chei reale aici — doar numele variabilelor.**

## Ce face

La ce ne folosește în SkillForge, în 2–3 propoziții: ce problemă rezolvă și ce s-ar rupe fără ea.
Plus: la ce pas / fază a intrat.

## Cont & chei

- Unde se creează contul (URL) și ce plan e necesar.
- De unde se generează cheia — drumul exact prin interfața lor (ex. `Dashboard → Settings → API Keys → Create key`).
- Ce scope / permisiuni are nevoie cheia și de ce (principiul: cât mai puține).
- Dacă cheia se afișează o singură dată, se spune aici.

## Variabile de mediu

| Variabilă                    | Fișier       | Ajunge în browser?              |
| ---------------------------- | ------------ | ------------------------------- |
| `NUMELE_EXACT_AL_VARIABILEI` | `.env.local` | NU (fără prefix `NEXT_PUBLIC_`) |

Rândul adăugat în `.env.example` (fără valoare reală):

```dotenv
NUMELE_EXACT_AL_VARIABILEI=""
```

În producție: unde se configurează aceeași variabilă (ex. Vercel → Project → Settings → Environment Variables).

## Pași manuali

Ce NU poate face agentul și trebuie făcut de mână:

1. click-uri în dashboard-ul lor (limite de consum, domenii permise, politici de acces);
2. migrări sau scripturi de rulat local;
3. domenii, redirect URL-uri sau webhook-uri de adăugat;
4. ce trebuie refăcut la reinstalare, pe alt calculator sau la deploy.

## Cost & limite

- Model de facturare (ex. per milion de tokeni, separat intrare/ieșire), cu cifrele de la data verificării.
- Ce oferă planul gratuit și unde se termină.
- Rate limits care ne pot afecta (cereri/minut, tokeni/minut).
- Ce umflă factura în SkillForge (ex. context mare trimis la fiecare mesaj).

## Verificare

Comanda sau ecranul care confirmă că merge, cu rezultatul așteptat:

```bash
# ex. curl http://localhost:3000/api/... → { "ok": true }
```

Plus erorile tipice ale acestei integrări și ce înseamnă fiecare.
