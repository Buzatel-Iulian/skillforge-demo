/**
 * Profilul inventat cu care pornește aplicația.
 *
 * DE CE datele inventate stau AICI și nu împrăștiate în componente:
 * la Faza 4 profilul va fi editat de utilizator și citit din `localStorage`, iar la Faza 9 din
 * Supabase. Dacă valorile ar fi scrise direct în UI („Nicolae" într-un `<h1>`), înlocuirea lor
 * ar însemna vânătoare prin toate fișierele. Așa, sursa se schimbă într-un singur loc.
 *
 * DE CE profilul ăsta, și nu unul generic („John Doe, Frontend Developer"):
 * cerințele (§3 din docs/requirements.md) cer ca aplicația să răspundă bine la întrebări de
 * tipul „ce-mi lipsește ca să trec de la Java backend la AI engineer?". Ca să putem judeca
 * dacă UI-ul arată informația potrivită, profilul de test trebuie să fie exact acel caz.
 */
import type { Profile } from "@/lib/types";

export const mockProfile: Profile = {
  name: "Nicolae",
  stack: "Java 21, Spring Boot, PostgreSQL, Docker",
  skills: [
    { name: "Java", level: "avansat" },
    { name: "Spring Boot", level: "avansat" },
    { name: "SQL & modelare de date", level: "avansat" },
    { name: "TypeScript", level: "intermediar" },
    { name: "React", level: "începător" },
    { name: "Next.js", level: "începător" },
    { name: "Prompt engineering", level: "începător" }
  ],
  goal: "Să trec de la Java backend la AI engineer în 6 luni, cu accent pe aplicații web cu LLM"
};
