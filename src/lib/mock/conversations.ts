/**
 * Lista de conversații cu care pornește aplicația.
 *
 * DE CE mai există fișierul, deși de la Faza 3 răspunsurile sunt reale:
 * agentul e conectat, dar **istoricul** nu se salvează încă nicăieri (baza de date intră la
 * Faza 9). Fără câteva rânduri de start, sidebar-ul ar fi gol la prima deschidere, iar nimeni
 * n-ar vedea cum arată lista, cum se comportă titlurile lungi sau meniul de pe rând.
 *
 * CE A DISPĂRUT AICI la Faza 3 și de ce:
 * - `messages` din fiecare conversație — mesajele conversației deschise sunt acum ale hook-ului
 *   `useChat` (vezi comentariul de pe `Conversation` din `src/lib/types.ts`). Ținute și aici,
 *   ar fi fost a doua copie a aceleiași stări;
 * - `buildMockReply` — răspunsul inventat. Nu mai are ce simula: textul vine de la model, prin
 *   `/api/chat`, bucată cu bucată.
 *
 * Titlurile rămân cele din `docs/requirements.md` §3 — întrebările de referință ale
 * proiectului, nu „Lorem ipsum".
 */
import type { Conversation } from "@/lib/types";

/**
 * DE CE id-uri scrise de mână, și nu `crypto.randomUUID()`:
 * datele de start trebuie să fie identice la fiecare pornire. Cu id-uri aleatoare, starea
 * salvată în `localStorage` nu s-ar mai potrivi cu datele proaspete după un refresh.
 */
export const mockConversations: Conversation[] = [
  {
    id: "conv-tranzitie-ai",
    title: "Ce-mi lipsește pentru AI engineer",
    createdAt: "2026-08-28T09:12:00.000Z"
  },
  {
    id: "conv-plan-3-luni",
    title: "Plan 3 luni: Next.js + AI SDK",
    createdAt: "2026-08-29T18:40:00.000Z"
  },
  {
    id: "conv-dupa-streaming",
    title: "Am terminat modulul de streaming",
    createdAt: "2026-09-01T11:05:00.000Z"
  },
  {
    id: "conv-gap-analysis",
    title: "Gap analysis pentru rolul țintă",
    createdAt: "2026-09-01T20:22:00.000Z"
  },
  {
    id: "conv-interviu",
    title: "Pregătire interviu: system design",
    createdAt: "2026-09-02T08:30:00.000Z"
  }
];
