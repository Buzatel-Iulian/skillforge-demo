/**
 * Registrul de providere de LLM.
 *
 * DE CE un registru (obiect indexat) și nu lanțuri de `if`:
 * la Faza 5 adăugăm al doilea provider, iar la comparația de costuri poate un al treilea.
 * Cu `if (provider === "anthropic") ... else if (...)` fiecare adăugare ar cere modificări în
 * composer, în preferințe și în ruta de chat. Cu registrul, adaugi o intrare aici și toate
 * listele din UI se actualizează singure, pentru că iterează peste el.
 *
 * DE CE stă în `src/lib/` și NU în `src/lib/mock/`:
 * nu e o dată inventată. Id-urile de aici sunt cele reale, pe care le va folosi Route
 * Handler-ul de la Faza 3. Mock-ul se aruncă; registrul rămâne.
 *
 * ATENȚIE: aici nu apare nicio cheie de API. Registrul spune CE modele există; CU CE cheie se
 * apelează e treaba serverului (`process.env.ANTHROPIC_API_KEY`), niciodată a acestui fișier —
 * el ajunge în browser.
 */
import type { ProviderId, ProviderInfo } from "@/lib/types";

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  anthropic: {
    id: "anthropic",
    label: "Anthropic",
    description: "Providerul implicit al SkillForge. Se conectează la Faza 3, dintr-un Route Handler.",
    available: true,
    models: [
      { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
      { id: "claude-opus-5", label: "Claude Opus 5" },
      { id: "claude-sonnet-5", label: "Claude Sonnet 5" }
    ]
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    description: "Al doilea provider, pentru comparație de răspunsuri și costuri. Intră la Faza 5.",
    available: false,
    // Gol intenționat: modelele se completează la pasul în care integrăm efectiv providerul,
    // împreună cu `docs/openai/README.md`. Nu inventăm id-uri care s-ar dovedi greșite.
    models: []
  }
};

/** Providerul implicit al aplicației. Singurul loc care decide cu ce pornește un utilizator nou. */
export const DEFAULT_PROVIDER_ID: ProviderId = "anthropic";
export const DEFAULT_MODEL_ID = PROVIDERS[DEFAULT_PROVIDER_ID].models[0].id;

/** Lista pentru iterat în UI. Ordinea de aici e ordinea afișată — de asta nu folosim `Object.values` la fiecare randare. */
export const PROVIDER_LIST: ProviderInfo[] = [PROVIDERS.anthropic, PROVIDERS.openai];

/**
 * Eticheta de afișat pentru un model.
 * DE CE o funcție și nu textul direct în componentă: dacă un model lipsește din registru
 * (ex. stare veche salvată în localStorage), UI-ul trebuie să afișeze ceva rezonabil,
 * nu `undefined`.
 */
export function getModelLabel(providerId: ProviderId, modelId: string): string {
  return PROVIDERS[providerId]?.models.find(model => model.id === modelId)?.label ?? modelId;
}
