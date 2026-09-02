# Documentația SkillForge

## Ce construim

[`requirements.md`](requirements.md) — **sursa de adevăr**: ce este aplicația și pentru cine, cerințele pe faze (ce intră acum, ce lăsăm pentru mai târziu), cerințele non-funcționale (chei de API, date personale, cost) și glosarul.

Când se schimbă ceva pe drum, se actualizează acolo, nu doar în conversație.

## Integrări externe

Fiecare integrare externă are propriul folder, cu pașii manuali pe care trebuie să-i facă omul: cont, generare de chei, click-uri în dashboard-ul lor, costuri. Codul îl scrie agentul; pașii manuali se uită imediat dacă nu-i notează nimeni — la reinstalare, pe alt calculator sau la deploy îi cauți de la zero.

| Integrare        | La ce pas a intrat | Link |
| ---------------- | ------------------ | ---- |
| _(încă niciuna)_ | —                  | —    |

Formatul obligatoriu al unui astfel de fișier: [`_template/README.md`](_template/README.md).

Când se adaugă o integrare, în **același commit** intră și: fișierul `docs/<integrare>/README.md`, rândul din tabelul de mai sus, și variabilele noi în `.env.example`.

**În `docs/` nu se scriu niciodată chei reale** — doar numele variabilelor. Valorile stau exclusiv în `.env.local`, care e gitignorat.

## Convenții pentru agenți

[`../AGENTS.md`](../AGENTS.md) — regulile pe care le urmează agenții AI care lucrează în proiect (fișier canonic; `CLAUDE.md` și `.github/copilot-instructions.md` se generează din el).
