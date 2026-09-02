# <Nume integrare> — pași manuali

> Șablon. Se copiază în `docs/<integrare>/README.md` la pasul în care integrarea e adăugată efectiv.
> Regula e în [`AGENTS.md`](../AGENTS.md) §2. **Nu se scriu chei reale aici — doar numele variabilelor și de unde se obțin valorile.**

**La ce o folosim în SkillForge:** <o propoziție>
**Adăugată în:** Faza <n> · **Obligatorie / opțională:** <...>

---

## 1. Cont

- Unde se creează: <URL>
- Ce plan e necesar: <gratuit / plătit — și de ce>
- Ce e nevoie la înregistrare: <email, card, verificare telefon...>

## 2. De unde se generează cheia

Pas cu pas, cu drumul exact prin interfața lor:

1. <ex. Dashboard → Settings → API Keys → Create key>
2. <ce nume/scop i se dă cheii>
3. <unde se copiază — cheia se afișează o singură dată?>

## 3. Variabile de mediu

| Variabilă | Unde e folosită | Public? |
|---|---|---|
| `<NUME_VARIABILA>` | doar pe server (Route Handler) | NU — secret |

- Local: se pun în `.env.local` (ignorat de git). În `.env.example` intră doar numele, cu valoare placeholder.
- În producție: <unde se configurează, ex. Vercel → Project → Settings → Environment Variables>

## 4. Ce se configurează în dashboard-ul lor

- <ex. limită de consum lunar, domenii permise, politici de acces, webhook-uri, regiune>
- <ce lăsăm pe valorile implicite>

## 5. Cost

- Model de facturare: <ex. per milion de tokeni, separat intrare/ieșire>
- Cifre actuale: <valori, cu data la care au fost verificate>
- Ce e gratuit / limitele planului gratuit: <...>
- Ce umflă factura în SkillForge: <ex. context mare trimis la fiecare mesaj>

## 6. Cum verific că funcționează

1. <comanda sau acțiunea din aplicație>
2. Rezultat așteptat: <ce trebuie să văd>

## 7. La reinstalare / pe alt calculator / la deploy

- <ce trebuie refăcut: doar variabila de mediu? cheie nouă? configurare în dashboard?>

## 8. Erori frecvente

| Eroare | Cauză | Rezolvare |
|---|---|---|
| <mesajul exact> | <...> | <...> |
