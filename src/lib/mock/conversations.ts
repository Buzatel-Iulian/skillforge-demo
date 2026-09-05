/**
 * Conversațiile inventate + răspunsul simulat al asistentului.
 *
 * DE CE avem nevoie de conversații false ca să construim UI-ul:
 * un ecran de chat gol nu arată nimic despre densitate, despre cum se rup rândurile lungi sau
 * despre cum se comportă lista la scroll. Cu date reale, greșelile de layout se văd imediat.
 *
 * DE CE conversațiile astea, cu textele astea:
 * sunt exact întrebările de referință din `docs/requirements.md` §3 — tranziția Java → AI
 * engineer, planul de 3 luni, continuarea după un modul terminat. Așa UI-ul e verificat pe
 * cazul real, nu pe „Lorem ipsum".
 *
 * DE CE răspunsurile sunt lungi și structurate:
 * răspunsul unui LLM arată așa. Dacă am pune „Salut!", bulele ar părea perfecte în UI și abia
 * la Faza 3 am descoperi că textul lung sparge layout-ul.
 *
 * ÎNLOCUIREA (Faza 3): tot ce e aici dispare. Conversațiile vor veni din store-ul alimentat de
 * răspunsul real al providerului, iar `buildMockReply` va fi înlocuit de streaming-ul din
 * `/api/chat`. Fișierul ăsta e singurul care trebuie atins.
 */
import type { Conversation, Message, Profile } from "@/lib/types";

/**
 * DE CE id-uri scrise de mână, și nu `crypto.randomUUID()`:
 * datele de start trebuie să fie identice la fiecare pornire. Cu id-uri aleatoare, starea
 * salvată în `localStorage` nu s-ar mai potrivi cu datele proaspete după un refresh.
 */
export const mockConversations: Conversation[] = [
  {
    id: "conv-tranzitie-ai",
    title: "Ce-mi lipsește pentru AI engineer",
    createdAt: "2026-08-28T09:12:00.000Z",
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: "Ce-mi lipsește ca să trec de la Java backend la AI engineer?",
        createdAt: "2026-08-28T09:12:00.000Z"
      },
      {
        id: "msg-2",
        role: "assistant",
        content: `Pornind de la profilul tău (Java și Spring Boot la nivel avansat, TypeScript intermediar, React și Next.js începător), nu-ți lipsește fundamentul de inginerie — îți lipsesc trei lucruri specifice:

**1. Un strat de frontend pe care să poți livra singur.** Ai backend solid, dar un AI engineer e adesea singurul care duce o funcționalitate până la ecran. React și Next.js la nivel începător sunt principalul blocaj: nu la sintaxă, ci la modelul mental server/client.

**2. Lucrul cu LLM-uri ca sistem, nu ca API.** Un apel de completare îl scrii în 20 de minute. Partea grea e ce vine după: streaming către interfață, context construit din date reale, unelte pe care modelul le apelează, evaluare a răspunsurilor.

**3. Datele pentru retrieval.** Aici pleci cu avantaj — SQL și modelarea de date la nivel avansat înseamnă că partea de indexare și căutare îți va fi mult mai ușoară decât cuiva de pe frontend.

Ce NU-ți lipsește, deși mulți cred că da: matematica de antrenare a modelelor. Pentru rolul spre care mergi, nu antrenezi modele — le integrezi.`,
        createdAt: "2026-08-28T09:12:42.000Z"
      },
      {
        id: "msg-3",
        role: "user",
        content: "Deci de unde încep, concret, în prima lună?",
        createdAt: "2026-08-28T09:15:10.000Z"
      },
      {
        id: "msg-4",
        role: "assistant",
        content: `Prima lună, o singură temă: **granița server/client**, fiindcă de ea depinde tot restul.

- Săptămâna 1–2: o aplicație Next.js cu App Router în care să simți diferența dintre Server Component și Component client. Criteriu de trecere: poți explica de ce o cheie de API nu are ce căuta într-un fișier cu \`"use client"\`.
- Săptămâna 3: un Route Handler care întoarce date, apoi același endpoint cu răspuns în streaming.
- Săptămâna 4: primul apel către un provider de LLM, de pe server, cu răspunsul afișat progresiv.

Cu 8–10 ore pe săptămână, e realist. Spune-mi când termini streaming-ul și continuăm de acolo.`,
        createdAt: "2026-08-28T09:16:02.000Z"
      }
    ]
  },
  {
    id: "conv-plan-3-luni",
    title: "Plan 3 luni: Next.js + AI SDK",
    createdAt: "2026-08-29T18:40:00.000Z",
    messages: [
      {
        id: "msg-5",
        role: "user",
        content: "Fă-mi un plan de 3 luni pentru Next.js + AI SDK. Am cam 8 ore pe săptămână.",
        createdAt: "2026-08-29T18:40:00.000Z"
      },
      {
        id: "msg-6",
        role: "assistant",
        content: `96 de ore în total. Le împart pe trei luni, iar fiecare lună are un livrabil verificabil — nu „am citit documentația".

**Luna 1 — fundația (32h).** App Router, Server vs. Client Components, Route Handlers, variabile de mediu. Livrabil: o aplicație cu două rute și un endpoint care citește o cheie doar pe server.

**Luna 2 — agentul (32h).** AI SDK, streaming în interfață, system prompt construit din date, tratarea erorilor de provider. Livrabil: chat care răspunde token cu token și nu cade când cheia lipsește.

**Luna 3 — context și unelte (32h).** Memorie între sesiuni, tool calling, un provider al doilea pentru comparație de cost. Livrabil: agentul îți actualizează singur planul de învățare.

Sar peste Tailwind și shadcn ca subiecte separate — le prinzi din mers, nu merită ore dedicate având în vedere obiectivul tău.`,
        createdAt: "2026-08-29T18:41:15.000Z"
      }
    ]
  },
  {
    id: "conv-dupa-streaming",
    title: "Am terminat modulul de streaming",
    createdAt: "2026-09-01T11:05:00.000Z",
    messages: [
      {
        id: "msg-7",
        role: "user",
        content: "Ține minte că am terminat modulul de streaming — ce urmează?",
        createdAt: "2026-09-01T11:05:00.000Z"
      },
      {
        id: "msg-8",
        role: "assistant",
        content: `Notat: streaming — terminat. Ai încheiat săptămâna 3 din luna 1, deci ești cu o săptămână înaintea planului.

Următorul pas din planul tău e **primul apel real către un provider**, dar înainte de el ai o datorie mică de plătit: tratarea erorilor. Un stream care se rupe la jumătate arată în UI exact ca unul care încă scrie — și e cea mai greu de depanat stare dintre toate.

Deci: 2 ore pe stări de eroare (cheie lipsă, provider căzut, stream întrerupt), apoi treci la providerul real. Vrei să detaliez ce înseamnă fiecare?`,
        createdAt: "2026-09-01T11:05:38.000Z"
      }
    ]
  },
  {
    id: "conv-gap-analysis",
    title: "Gap analysis pentru rolul țintă",
    createdAt: "2026-09-01T20:22:00.000Z",
    messages: [
      {
        id: "msg-9",
        role: "user",
        content: "Compară profilul meu cu un anunț de AI engineer și spune-mi unde stau prost.",
        createdAt: "2026-09-01T20:22:00.000Z"
      },
      {
        id: "msg-10",
        role: "assistant",
        content: `Împart cerințele tipice în trei categorii, față de profilul tău:

**Acoperit bine:** backend și API-uri, baze de date, Docker, gândire de sistem. La astea ești peste nivelul cerut de obicei pentru un rol de intrare în AI.

**Parțial:** TypeScript (intermediar — suficient, dar te va încetini la tipuri generice), evaluarea răspunsurilor de LLM (n-ai făcut încă).

**Descoperit:** React/Next.js la nivel de producție, retrieval (embeddings, căutare semantică), observabilitate pe cost și latență.

Ordinea în care le-aș ataca nu e ordinea din listă: Next.js primul, fiindcă fără el nu poți livra nimic vizibil; retrieval al doilea, pentru că îți valorifică avantajul de SQL.`,
        createdAt: "2026-09-01T20:23:04.000Z"
      }
    ]
  },
  {
    id: "conv-interviu",
    title: "Pregătire interviu: system design",
    createdAt: "2026-09-02T08:30:00.000Z",
    messages: [
      {
        id: "msg-11",
        role: "user",
        content: "Ce mă întreabă la interviu despre arhitectura unei aplicații cu LLM?",
        createdAt: "2026-09-02T08:30:00.000Z"
      },
      {
        id: "msg-12",
        role: "assistant",
        content: `Trei întrebări apar aproape mereu, și toate trei au legătură cu ce construiești acum:

1. **„Unde ții cheia de API?"** Răspunsul corect e „pe server, într-o variabilă de mediu, apelul se face din backend". E o întrebare-filtru: cine răspunde „în frontend, într-un \`.env\`" arată că n-a livrat niciodată.
2. **„Cum ții costul sub control?"** Aici se așteaptă: context trimis controlat, model mai mic pentru sarcini simple, cache, măsurare per cerere.
3. **„Ce faci când providerul cade?"** Timeout, mesaj clar în UI, fallback pe alt provider — de asta merită ca providerul să fie schimbabil din prima zi.

Cu experiența ta de backend, la a doua și a treia ești deja acasă. Prima ține de setup, nu de vechime.`,
        createdAt: "2026-09-02T08:31:12.000Z"
      }
    ]
  }
];

/**
 * Răspunsul simulat al asistentului.
 *
 * DE CE simulăm un răspuns în loc să nu facem nimic la trimitere:
 * fără el nu am putea construi (și verifica) indicatorul „scrie…", butonul de stop și
 * derularea automată a listei. Toate stările astea trebuie să existe ÎNAINTE de datele reale,
 * altfel le descoperim lipsă exact când depanăm streaming-ul.
 *
 * DE CE răspunsul spune explicit că e simulat:
 * ca nimeni să nu creadă, nici la curs nici mai târziu, că aplicația vorbește deja cu un model.
 * La Faza 3 funcția asta dispare, iar textul vine prin streaming din `/api/chat`.
 */
export function buildMockReply(userMessage: string, profile: Profile): Message {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: `_Răspuns simulat — aplicația nu vorbește încă cu niciun model de limbaj._

Am primit: „${userMessage.trim()}"

Când agentul va fi conectat (Faza 3), aici va apărea răspunsul real, scris token cu token, construit din profilul tău: **${profile.stack}**, cu obiectivul „${profile.goal}".

Până atunci, interfața e completă: poți naviga prin conversații, le poți redenumi sau șterge, îți poți edita profilul și schimba tema — totul din preferințe.`,
    createdAt: new Date().toISOString()
  };
}
