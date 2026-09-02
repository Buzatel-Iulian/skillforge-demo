# SkillForge

Copilot personal de skills și carieră. O aplicație web în centrul căreia stă un **agent AI** care îmi cunoaște profilul real (stack, skill-uri și nivelul la fiecare, obiectivul spre care merg), răspunde în contextul meu și îmi propune pași concreți de învățare.

Se construiește pas cu pas, pe module, ca material de curs: chat cu răspuns în streaming, system prompt generat din profil, memorie între sesiuni și — mai târziu — unelte pe care agentul le folosește singur. Modelul de limbaj se apelează doar de pe server, iar providerul e schimbabil.

## Cum se rulează

Nu există încă cod de aplicație — **Faza 0** a pus la punct doar documentele și convențiile. Instrucțiunile de rulare apar aici la Faza 1 (schelet Next.js + chat cu streaming).

Singura comandă existentă acum, pentru sincronizarea instrucțiunilor pentru agenți:

```sh
sh scripts/sync-agent-instructions.sh          # regenerează CLAUDE.md și .github/copilot-instructions.md
sh scripts/sync-agent-instructions.sh --check  # verifică dacă sunt sincronizate
```

## Documente

| Fișier | Ce conține |
|---|---|
| [docs/requirements.md](docs/requirements.md) | **Sursa de adevăr:** ce construim și pentru cine, cerințele pe faze, cerințele non-funcționale (chei de API, date personale, cost), glosarul |
| [AGENTS.md](AGENTS.md) | Convențiile pentru agenții AI care lucrează în proiect (în engleză). Fișier canonic — `CLAUDE.md` și `.github/copilot-instructions.md` sunt generate din el |
| `docs/<integrare>/README.md` | Pașii manuali pentru fiecare integrare externă: cont, generare cheie, variabile de mediu, configurare în dashboard, costuri. Șablon: [docs/_template-integrare.md](docs/_template-integrare.md) |

Când se schimbă ceva pe drum, se actualizează în `docs/requirements.md`, nu doar în conversație.
