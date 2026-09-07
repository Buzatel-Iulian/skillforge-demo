"use client";

/**
 * Starea aplicației: profil, conversații, provider, temă.
 *
 * DE CE un store global și nu `useState` în componente:
 * aceleași date sunt citite din trei locuri care nu se conțin unul pe altul — sidebar-ul
 * (lista de conversații), zona de chat (mesajele) și dialogul de preferințe (profilul, tema).
 * Cu `useState` ar trebui ridicate în layout și pasate prin toate nivelurile ca props. Numele
 * din profil e cazul limpede: apare în rândul de utilizator, în salutul de pe conversația nouă
 * și în formularul de editare.
 *
 * DE CE `persist` cu localStorage, deși mai târziu vine Supabase:
 * cerința e ca lista de conversații și profilul să supraviețuiască unui refresh chiar și fără
 * bază de date. `persist` face exact atât, iar la Faza 9 se înlocuiește stratul de storage —
 * componentele nu se ating, pentru că ele văd doar acest store.
 *
 * DE CE nicio funcție de aici nu face `fetch`:
 * în pasul ăsta nu există niciun apel către un model. `sendMessage` simulează un răspuns cu un
 * `setTimeout`, ca stările de UI („scrie…", stop, eroare) să existe și să fie verificabile.
 * La Faza 3 se schimbă DOAR interiorul lui `sendMessage`.
 */
import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type { ChatStatus, Conversation, Message, Profile, ProviderId, ThemePreference } from "@/lib/types";
import { DEFAULT_MODEL_ID, DEFAULT_PROVIDER_ID, PROVIDERS } from "@/lib/providers";
import { mockProfile } from "@/lib/mock/profile";
import { buildMockReply, mockConversations } from "@/lib/mock/conversations";

/** Secțiunile dialogului de preferințe. Ținute aici pentru ca orice buton din aplicație să poată deschide direct secțiunea potrivită. */
export type SettingsSection = "general" | "profil" | "providere" | "despre";

type AppState = {
  // --- date persistate ---
  profile: Profile;
  conversations: Conversation[];
  activeConversationId: string | null;
  providerId: ProviderId;
  modelId: string;
  theme: ThemePreference;

  // --- stare efemeră (NU se salvează: vezi `partialize`) ---
  status: ChatStatus;
  errorMessage: string | null;
  settingsOpen: boolean;
  settingsSection: SettingsSection;

  // --- acțiuni ---
  setProfile: (profile: Profile) => void;
  setTheme: (theme: ThemePreference) => void;
  selectProvider: (providerId: ProviderId) => void;
  setModel: (modelId: string) => void;
  startNewConversation: () => void;
  selectConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  sendMessage: (text: string) => void;
  stopStreaming: () => void;
  dismissError: () => void;
  openSettings: (section?: SettingsSection) => void;
  setSettingsOpen: (open: boolean) => void;
  setSettingsSection: (section: SettingsSection) => void;
};

/**
 * Referința către răspunsul simulat în curs.
 * DE CE stă în afara store-ului: e un detaliu de implementare al simulării, nu stare de UI.
 * La Faza 3 devine `AbortController`-ul cererii reale — butonul de stop va anula fetch-ul.
 */
let replyTimer: ReturnType<typeof setTimeout> | null = null;

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

function createUserMessage(text: string): Message {
  return {
    id: crypto.randomUUID(),
    role: "user",
    content: text.trim(),
    createdAt: new Date().toISOString()
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: mockProfile,
      conversations: mockConversations,
      activeConversationId: null,
      providerId: DEFAULT_PROVIDER_ID,
      modelId: DEFAULT_MODEL_ID,
      theme: "sistem",

      status: "idle",
      errorMessage: null,
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
       * DE CE „conversație nouă" nu creează imediat un obiect în listă:
       * altfel fiecare click pe „+ New" ar lăsa în sidebar o conversație goală, fără titlu.
       * Conversația se naște la primul mesaj — atunci avem și din ce să-i facem titlul.
       */
      startNewConversation: () => set({ activeConversationId: null, status: "idle", errorMessage: null }),

      selectConversation: id => set({ activeConversationId: id, status: "idle", errorMessage: null }),

      renameConversation: (id, title) =>
        set(state => ({
          conversations: state.conversations.map(conversation =>
            conversation.id === id ? { ...conversation, title: title.trim() || conversation.title } : conversation
          )
        })),

      /**
       * DE CE ștergerea trebuie să atingă și `activeConversationId`:
       * dacă ștergi conversația deschisă, id-ul activ ar rămâne să indice ceva inexistent și
       * zona de chat ar randa gol, fără să știe de ce. Revenim explicit la ecranul de start.
       */
      deleteConversation: id =>
        set(state => ({
          conversations: state.conversations.filter(conversation => conversation.id !== id),
          activeConversationId: state.activeConversationId === id ? null : state.activeConversationId
        })),

      sendMessage: text => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const { activeConversationId, conversations, profile } = get();
        const userMessage = createUserMessage(trimmed);

        /**
         * Comandă de test pentru starea de eroare.
         * DE CE există: starea de eroare trebuie să poată fi văzută în UI fără să stricăm
         * intenționat ceva. La Faza 3 o înlocuiesc erorile reale (cheie lipsă, provider căzut).
         */
        if (trimmed === "/eroare") {
          set({
            status: "error",
            errorMessage:
              "Providerul nu a răspuns (eroare simulată). La Faza 3, aici ajung erorile reale de la /api/chat."
          });
          return;
        }

        if (activeConversationId === null) {
          // Prima replică a unei conversații noi: o creăm acum și o punem prima în listă.
          const conversation: Conversation = {
            id: crypto.randomUUID(),
            title: buildTitle(trimmed),
            createdAt: new Date().toISOString(),
            messages: [userMessage]
          };
          set({
            conversations: [conversation, ...conversations],
            activeConversationId: conversation.id,
            status: "streaming",
            errorMessage: null
          });
        } else {
          set({
            conversations: conversations.map(conversation =>
              conversation.id === activeConversationId
                ? { ...conversation, messages: [...conversation.messages, userMessage] }
                : conversation
            ),
            status: "streaming",
            errorMessage: null
          });
        }

        // Simularea „modelul se gândește". Întârzierea e vizibilă intenționat, ca indicatorul
        // „scrie…" să poată fi văzut și verificat.
        if (replyTimer) clearTimeout(replyTimer);
        replyTimer = setTimeout(() => {
          replyTimer = null;
          const targetId = get().activeConversationId;
          if (!targetId) return;
          const reply = buildMockReply(trimmed, profile);
          set(state => ({
            conversations: state.conversations.map(conversation =>
              conversation.id === targetId
                ? { ...conversation, messages: [...conversation.messages, reply] }
                : conversation
            ),
            status: "idle"
          }));
        }, 1400);
      },

      /**
       * DE CE butonul de stop există deja, fără streaming real:
       * e o cerință de produs, nu un detaliu tehnic — un răspuns lung trebuie să poată fi
       * oprit. Aici anulează răspunsul simulat; la Faza 3 va anula cererea (`AbortController`).
       */
      stopStreaming: () => {
        if (replyTimer) {
          clearTimeout(replyTimer);
          replyTimer = null;
        }
        set({ status: "idle" });
      },

      dismissError: () => set({ status: "idle", errorMessage: null }),

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
       * `status`, `errorMessage` și starea dialogului sunt de moment. Salvate, ar produce efecte
       * absurde — ai deschide aplicația și ar scrie „se încarcă…" sau ți-ar apărea o eroare de
       * acum trei zile.
       */
      partialize: state => ({
        profile: state.profile,
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        providerId: state.providerId,
        modelId: state.modelId,
        theme: state.theme
      }),

      /**
       * DE CE o versiune: prima migrare vine sigur.
       * Când profilul primește un câmp nou, starea salvată pe calculatorul cuiva va fi veche.
       * Cu `version` + `migrate` avem unde trata cazul, în loc să crape aplicația pe date vechi.
       */
      version: 1
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
