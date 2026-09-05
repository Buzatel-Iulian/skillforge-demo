/**
 * Tipurile aplicației, într-un singur loc.
 *
 * DE CE există fișierul ăsta separat de componente:
 * profilul, mesajele și conversațiile circulă prin toată aplicația (sidebar, chat, preferințe,
 * store). Dacă fiecare componentă și-ar declara propriul tip, la pasul următor — când datele
 * vin de la un LLM și apoi din Supabase — ar trebui schimbate în zece locuri. Aici e contractul.
 *
 * DE CE `createdAt` e `string` și nu `Date`:
 * starea se salvează în localStorage prin JSON. Un `Date` s-ar întoarce de acolo ca text, deci
 * tipul ar minți. Ținem ISO 8601 (`new Date().toISOString()`) și convertim doar la afișare.
 */

/** Rolul autorului unui mesaj. Aceleași două valori pe care le folosesc și API-urile de LLM. */
export type Role = "user" | "assistant";

/**
 * Nivelurile permise pentru un skill.
 * DE CE o listă fixă și nu text liber: nivelul ajunge în system prompt („intermediar la React"),
 * iar agentul calibrează planul după el. Text liber ar produce răspunsuri inconsistente.
 */
export const SKILL_LEVELS = ["începător", "intermediar", "avansat"] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export type Skill = {
  name: string;
  level: SkillLevel;
};

/**
 * Profilul utilizatorului — nucleul aplicației.
 * DE CE contează forma lui acum, deși încă nu vorbim cu un model: din exact aceste câmpuri se
 * va construi „persona" (system prompt-ul) la Faza 4. Ce nu e aici, agentul nu va putea ști.
 */
export type Profile = {
  name: string;
  stack: string;
  skills: Skill[];
  goal: string;
};

export type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
};

/**
 * Preferința de temă, așa cum o alege utilizatorul.
 * DE CE „sistem" e o valoare separată de light/dark: e o *regulă* („urmează sistemul de
 * operare"), nu o culoare. Tema efectiv aplicată se calculează din ea — vezi theme-provider.
 */
export type ThemePreference = "sistem" | "light" | "dark";

/** Tema efectiv aplicată pe document. „sistem" nu poate apărea aici — a fost deja rezolvat. */
export type ResolvedTheme = "light" | "dark";

export type ProviderId = "anthropic" | "openai";

export type ProviderModel = {
  id: string;
  label: string;
};

export type ProviderInfo = {
  id: ProviderId;
  label: string;
  description: string;
  /**
   * DE CE un provider poate fi „indisponibil":
   * OpenAI intră abia la Faza 5. Îl arătăm în listă, dezactivat, ca să fie vizibil de la
   * început că providerul e o piesă schimbabilă — nu o constantă ascunsă în cod.
   */
  available: boolean;
  models: ProviderModel[];
};

/**
 * Starea conversației în curs.
 * DE CE o declarăm acum, fără streaming real: din ea se aprind indicatorul „scrie…", butonul
 * de stop și alerta de eroare. La Faza 3 aceleași stări vor fi conduse de răspunsul real al
 * providerului, nu de un `setTimeout` — restul UI-ului nu va trebui rescris.
 */
export type ChatStatus = "idle" | "streaming" | "error";
