"use client";

/**
 * Starea aplicației: profil, LISTA de conversații, provider, temă.
 *
 * DE CE un store global și nu `useState` în componente:
 * aceleași date sunt citite din locuri care nu se conțin unul pe altul — sidebar-ul (lista de
 * conversații), header-ul (titlul celei active) și dialogul de preferințe (profilul, tema). Cu
 * `useState` ar trebui ridicate în layout și pasate prin toate nivelurile ca props. Numele din
 * profil e cazul limpede: apare în rândul de utilizator și în salutul de pe conversația nouă.
 *
 * ⚠️ CINE DEȚINE MESAJELE — decizia cea mai importantă a Fazei 3.
 * Store-ul ține **lista** de conversații: id, titlu, care e selectată. **Mesajele conversației
 * deschise NU mai trec pe aici** — sunt ale hook-ului `useChat` din `chat/chat.tsx`, care ține
 * cererea deschisă și primește bucățile de stream.
 *
 * DE CE nu le ținem în amândouă locurile:
 * pentru că nu se poate. Un răspuns care curge produce zeci de actualizări pe secundă; ele
 * ajung întâi la `useChat`. Dacă store-ul ar păstra o copie, ar trebui sincronizată la fiecare
 * bucată, iar la prima întrerupere (stop, eroare, schimbat conversația) cele două ar diverge —
 * și ai depana o stare care nu există întreagă în niciun loc. Alegerea trebuie făcută explicit,
 * nu întâmplător: `useChat` deține conversația activă, store-ul deține lista.
 *
 * CE A DISPĂRUT de aici la Faza 3:
 * `sendMessage` (trimitea un mesaj și programa un răspuns inventat), `stopStreaming`,
 * `status`/`errorMessage`, `setTimeout`-ul care ținea răspunsul simulat și comanda de test
 * `/eroare`. Toate erau schele pentru un agent care nu exista. Acum trimiterea o face
 * `sendMessage` al lui `useChat`, oprirea o face `stop()`, iar erorile sunt reale.
 */
import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type { Conversation, Profile, ProviderId, ThemePreference } from "@/lib/types";
import { DEFAULT_MODEL_ID, DEFAULT_PROVIDER_ID, PROVIDERS } from "@/lib/providers";
import { mockProfile } from "@/lib/mock/profile";
import { mockConversations } from "@/lib/mock/conversations";

/** Secțiunile dialogului de preferințe. Ținute aici pentru ca orice buton din aplicație să poată deschide direct secțiunea potrivită. */
export type SettingsSection = "general" | "profil" | "providere" | "despre";

/**
 * Exact ce ajunge în `localStorage` — vezi `partialize`.
 * DE CE un tip separat: forma salvată și forma din memorie NU sunt aceleași, iar `migrate`
 * trebuie să lucreze pe cea salvată. Fără tipul ăsta, migrarea ar fi scrisă „pe încredere".
 */
type PersistedState = {
  profile: Profile;
  conversations: Conversation[];
  providerId: ProviderId;
  modelId: string;
  theme: ThemePreference;
};

type AppState = {
  // --- date persistate ---
  profile: Profile;
  conversations: Conversation[];
  providerId: ProviderId;
  modelId: string;
  theme: ThemePreference;

  // --- stare efemeră (NU se salvează: vezi `partialize`) ---
  activeConversationId: string;
  settingsOpen: boolean;
  settingsSection: SettingsSection;

  // --- acțiuni ---
  setProfile: (profile: Profile) => void;
  setTheme: (theme: ThemePreference) => void;
  selectProvider: (providerId: ProviderId) => void;
  setModel: (modelId: string) => void;
  startNewConversation: () => void;
  selectConversation: (id: string) => void;
  saveConversation: (id: string, firstMessage: string) => void;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  openSettings: (section?: SettingsSection) => void;
  setSettingsOpen: (open: boolean) => void;
  setSettingsSection: (section: SettingsSection) => void;
};

/**
 * Storage inert, folosit doar pe server (vezi `storage` mai jos).
 * DE CE nu aruncă erori: pe server nu e nimic de salvat și nimic de citit — trebuie doar să
 * nu se plângă nimeni. `getItem` întoarce `null`, adică „nu există stare salvată".
 */
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined
};

/** Titlul unei conversații noi se derivă din primul mesaj — la fel ca în aplicațiile reale de chat. */
function buildTitle(firstMessage: string): string {
  const clean = firstMessage.trim().replace(/\s+/g, " ");
  return clean.length > 48 ? `${clean.slice(0, 48)}…` : clean || "Conversație nouă";
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: mockProfile,
      conversations: mockConversations,
      providerId: DEFAULT_PROVIDER_ID,
      modelId: DEFAULT_MODEL_ID,
      theme: "sistem",

      /**
       * DE CE `activeConversationId` e mereu un `string`, niciodată `null` (schimbare la Faza 3):
       * el e acum și **cheia sub care `useChat` își ține mesajele** (`useChat({ id })`). O
       * conversație nouă are deci un id de la bun început, chiar dacă nu apare încă în listă —
       * altfel id-ul s-ar naște abia la primul mesaj, `useChat` ar vedea o cheie nouă chiar în
       * timpul trimiterii, s-ar reseta și mesajul ar dispărea de sub degete.
       *
       * DE CE e efemer (nu se salvează):
       * mesajele nu se salvează la pasul ăsta. Dacă am reține ce conversație era deschisă, la
       * refresh ai vedea un titlu în header și o conversație goală dedesubt. Mai onest e să
       * pornim de fiecare dată pe o conversație nouă; istoricul persistent vine la Faza 9.
       *
       * Valoarea nu e randată niciodată în HTML, deci un id diferit pe server față de browser
       * nu poate produce o eroare de hidratare.
       */
      activeConversationId: crypto.randomUUID(),
      settingsOpen: false,
      settingsSection: "general",

      setProfile: profile => set({ profile }),
      setTheme: theme => set({ theme }),

      /**
       * DE CE schimbarea providerului resetează și modelul:
       * un model aparține unui provider. Dacă am păstra `modelId` la schimbare, ar rămâne un
       * model care nu există în noul provider — exact bug-ul pe care un registru bine folosit
       * trebuie să-l facă imposibil.
       */
      selectProvider: providerId => {
        const firstModel = PROVIDERS[providerId].models[0];
        set({ providerId, modelId: firstModel?.id ?? "" });
      },
      setModel: modelId => set({ modelId }),

      /**
       * DE CE „conversație nouă" generează un id, dar NU adaugă nimic în listă:
       * altfel fiecare click pe „+ New" ar lăsa în sidebar o conversație goală, fără titlu.
       * Conversația intră în listă la primul mesaj (`saveConversation`) — atunci avem și din ce
       * să-i facem titlul. Până atunci, id-ul există doar ca să aibă `useChat` unde scrie.
       */
      startNewConversation: () => set({ activeConversationId: crypto.randomUUID() }),

      selectConversation: id => set({ activeConversationId: id }),

      /**
       * Naște conversația în listă, la primul mesaj trimis.
       * DE CE verifică întâi dacă există: la al doilea mesaj din aceeași conversație funcția e
       * apelată din nou; fără verificare, titlul s-ar rescrie după fiecare replică.
       */
      saveConversation: (id, firstMessage) =>
        set(state =>
          state.conversations.some(conversation => conversation.id === id)
            ? state
            : {
                conversations: [
                  { id, title: buildTitle(firstMessage), createdAt: new Date().toISOString() },
                  ...state.conversations
                ]
              }
        ),

      renameConversation: (id, title) =>
        set(state => ({
          conversations: state.conversations.map(conversation =>
            conversation.id === id ? { ...conversation, title: title.trim() || conversation.title } : conversation
          )
        })),

      /**
       * DE CE ștergerea trebuie să atingă și `activeConversationId`:
       * dacă ștergi conversația deschisă, id-ul activ ar rămâne să indice ceva inexistent, iar
       * `useChat` ar continua să arate mesajele unei conversații care nu mai e în listă. Trecem
       * explicit pe o conversație nouă — adică pe un id nou, deci și pe o listă goală de mesaje.
       */
      deleteConversation: id =>
        set(state => ({
          conversations: state.conversations.filter(conversation => conversation.id !== id),
          activeConversationId: state.activeConversationId === id ? crypto.randomUUID() : state.activeConversationId
        })),

      openSettings: section => set({ settingsOpen: true, settingsSection: section ?? get().settingsSection }),
      setSettingsOpen: open => set({ settingsOpen: open }),
      setSettingsSection: section => set({ settingsSection: section })
    }),
    {
      name: "skillforge-app",

      /**
       * DE CE `skipHydration` și rehidratare manuală (vezi `useStoreHydration`):
       * pagina e randată mai întâi pe server, unde `localStorage` nu există. Dacă store-ul s-ar
       * citi din localStorage în timpul primei randări din browser, HTML-ul serverului și cel
       * al clientului ar diferi, iar React ar raporta o eroare de hidratare. Așa: prima randare
       * folosește datele de start (identice pe server și în browser), iar starea salvată intră
       * imediat după montare.
       */
      skipHydration: true,

      /**
       * DE CE storage-ul e ales printr-o funcție cu verificare de `window`:
       * modulul ăsta e importat și în timpul randării pe server (și la `next build`), unde
       * `localStorage` nu are ce căuta. Fără verificare, build-ul avertizează că `localStorage`
       * nu e disponibil — iar în alte medii ar fi de-a dreptul o eroare. Pe server dăm un
       * storage inert: nu are ce să citească, fiindcă starea utilizatorului e în browserul lui.
       */
      storage: createJSONStorage(() => (typeof window === "undefined" ? noopStorage : window.localStorage)),

      /**
       * DE CE nu salvăm tot:
       * starea dialogului de preferințe e de moment (salvată, ai deschide aplicația și ți-ar
       * sări în față). Iar `activeConversationId` a ieșit de aici la Faza 3 — vezi motivul de
       * pe câmp: fără mesaje salvate, o conversație redeschisă ar apărea goală.
       */
      partialize: state => ({
        profile: state.profile,
        conversations: state.conversations,
        providerId: state.providerId,
        modelId: state.modelId,
        theme: state.theme
      }),

      /**
       * Versiunea 2 — prima migrare reală, exact cazul anticipat la Faza 2.
       *
       * DE CE e nevoie de ea:
       * versiunea 1 salva în `localStorage` conversații CU mesaje, plus `activeConversationId`.
       * Cine a folosit aplicația înainte de Faza 3 are asta pe disc. Fără migrare, mesajele
       * vechi ar rămâne acolo pentru totdeauna, citite de nimeni, iar id-ul activ ar redeschide
       * o conversație goală. Aici le tăiem, o singură dată, la prima încărcare după update.
       */
      version: 2,
      migrate: persistedState => {
        const state = persistedState as Partial<PersistedState> & {
          conversations?: Array<Conversation & { messages?: unknown }>;
        };

        /**
         * Construim obiectul câmp cu câmp, în loc să facem `{ ...state, ... }`.
         * DE CE: forma veche mai conținea `activeConversationId`, iar zustand suprascrie starea
         * curentă cu tot ce primește de aici. Copiat orbește, id-ul vechi ar reveni la fiecare
         * pornire și ar redeschide o conversație fără mesaje. Ce nu enumerăm, dispare.
         */
        return {
          profile: state.profile,
          conversations: (state.conversations ?? mockConversations).map(({ id, title, createdAt }) => ({
            id,
            title,
            createdAt
          })),
          providerId: state.providerId,
          modelId: state.modelId,
          theme: state.theme
        } satisfies Partial<PersistedState>;
      }
    }
  )
);

/**
 * Citește starea salvată din `localStorage`, după ce componenta s-a montat în browser.
 *
 * DE CE e nevoie de un hook și nu se întâmplă automat:
 * am cerut `skipHydration: true` tocmai ca prima randare să fie identică pe server și în
 * browser. Prețul e că rehidratarea trebuie pornită explicit — aici.
 *
 * DE CE întoarce un boolean:
 * cât timp starea salvată nu a fost citită, lista de conversații e cea de start, nu a
 * utilizatorului. Componentele folosesc valoarea asta ca să afișeze `Skeleton` în loc de date
 * care s-ar schimba sub ochii lui — și așa avem un motiv REAL pentru starea de încărcare,
 * nu una simulată.
 */
export function useStoreHydration(): boolean {
  const [hydrated, setHydrated] = useState(() => useAppStore.persist.hasHydrated());

  useEffect(() => {
    const unsubscribe = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    void useAppStore.persist.rehydrate();
    return unsubscribe;
  }, []);

  return hydrated;
}
