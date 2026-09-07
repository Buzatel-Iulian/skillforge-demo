"use client";

/**
 * Zona centrală: aici trăiește conversația reală cu modelul.
 *
 * DE CE `"use client"` e AICI și nu mai sus:
 * `useChat` ține o cerere deschisă și primește bucăți de text în timp — are nevoie de browser.
 * Componenta asta e granița: deasupra ei (`src/app/page.tsx`) totul rămâne Server Component.
 *
 * DE CE folosim `useChat` și nu un `fetch` scris de mână:
 * la Faza 2.5 am citit un stream manual (`getReader()` + `TextDecoder` + tăiat pe `\n\n`) tocmai
 * ca să se vadă că nu e magie. Sub `useChat` e exact același protocol SSE. Diferența e că el mai
 * rezolvă și partea plictisitoare: adună bucățile în mesaje, ține starea cererii, anulează cu
 * `AbortController`, tratează deconectările. Rescris de mână, ar fi cod de întreținut fără câștig.
 *
 * DE CE zona centrală NU are bară de acțiuni:
 * cerința de produs e explicită — în centru doar strictul necesar. Acțiunile pe conversație stau
 * în sidebar, pe fiecare rând.
 */

import { useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/chat/chat-input";
import { EmptyState } from "@/components/chat/empty-state";
import { MessageList } from "@/components/chat/message-list";
import { useAppStore, useStoreHydration } from "@/store/useAppStore";

/**
 * Transportul: unde trimite hook-ul mesajele.
 *
 * DE CE îl scriem explicit, deși `/api/chat` e chiar valoarea implicită a SDK-ului:
 * o rută implicită e o rută invizibilă. Scrisă aici, legătura dintre interfață și Route Handler
 * se vede dintr-o privire — și se schimbă într-un singur loc.
 *
 * DE CE stă în afara componentei:
 * altfel s-ar construi un obiect nou la fiecare randare, adică de zeci de ori pe secundă cât
 * timp curge un răspuns. Configurația nu depinde de nimic din componentă, deci n-are motiv să
 * se recreeze.
 */
const chatTransport = new DefaultChatTransport({ api: "/api/chat" });

/** Inițialele pentru avatar. Extrase o dată, ca să nu se recalculeze la fiecare mesaj din listă. */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "EU";
  return parts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Scoate din eroare textul pe care îl poate citi un om.
 *
 * ⚠️ Capcană de care te lovești o singură dată: când `/api/chat` răspunde cu un status ≠ 200
 * (la noi: 400, „cheia nu e configurată"), transportul SDK-ului aruncă o eroare al cărei
 * `message` e **corpul brut al răspunsului** — adică JSON-ul nostru, ca text:
 * `{"error":"Cheia ANTHROPIC_API_KEY nu e configurată…"}`. Afișat direct, utilizatorul ar vedea
 * acoladele. Când eroarea apare în timpul stream-ului, `message` e deja textul curat, compus de
 * `onError`-ul din rută — de asta încercarea de parsare e într-un `try`, nu o condiție.
 */
function readableError(error: Error): string {
  try {
    const parsed: unknown = JSON.parse(error.message);
    if (typeof parsed === "object" && parsed !== null && "error" in parsed) {
      const message = (parsed as { error: unknown }).error;
      if (typeof message === "string" && message.length > 0) return message;
    }
  } catch {
    // Nu era JSON: e un mesaj deja lizibil, venit prin stream din `onError`-ul rutei.
  }

  return error.message || "Răspunsul nu a putut fi generat.";
}

export function Chat() {
  const [draft, setDraft] = useState("");
  const composerWrapperRef = useRef<HTMLDivElement>(null);

  const hydrated = useStoreHydration();
  const profile = useAppStore(state => state.profile);
  const activeConversationId = useAppStore(state => state.activeConversationId);
  const saveConversation = useAppStore(state => state.saveConversation);

  /**
   * DE CE dăm `id`-ul conversației hook-ului:
   * `useChat` ține mesajele pe cheia asta. Când selectezi altă conversație din sidebar, id-ul se
   * schimbă, hook-ul își reface starea și pornești curat. Fără el, ai vedea mesajele conversației
   * precedente lipite peste cea nouă.
   */
  const { messages, sendMessage, status, error, stop, clearError } = useChat({
    id: activeConversationId,
    transport: chatTransport
  });

  const initials = getInitials(profile.name);

  function focusComposer() {
    composerWrapperRef.current?.querySelector("textarea")?.focus();
  }

  function handleSubmit() {
    const text = draft.trim();
    if (!text) return;

    // Conversația se naște în listă la primul mesaj — abia acum avem din ce să-i facem titlul.
    if (messages.length === 0) saveConversation(activeConversationId, text);

    // Golim ciorna ÎNAINTE de trimitere: `sendMessage` e asincron, iar dacă am aștepta după el,
    // textul ar rămâne câteva sute de milisecunde în cutie și ai putea să-l trimiți de două ori.
    setDraft("");
    void sendMessage({ text });

    // Focus înapoi în cutie: într-un chat scrii mesaj după mesaj, nu mesaj-click-mesaj.
    focusComposer();
  }

  /**
   * DE CE sugestia mută focusul în textarea:
   * după click, cursorul trebuie să fie deja în text ca să poți ajusta întrebarea. Fără asta,
   * ai un input completat pe care trebuie să-l mai și clichezi — un pas inutil.
   */
  function handlePickSuggestion(prompt: string) {
    setDraft(prompt);
    focusComposer();
  }

  const composer = (
    <div ref={composerWrapperRef}>
      <ChatInput value={draft} onValueChange={setDraft} onSubmit={handleSubmit} status={status} onStop={stop} />
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/*
        DE CE alerta stă deasupra conversației, nu în locul ei:
        o eroare de provider nu trebuie să șteargă de pe ecran ce ai discutat până atunci.
        Vezi problema ȘI contextul, deci poți reîncerca fără să pierzi nimic.

        `error` vine direct din hook — nu ținem o stare de eroare paralelă, care s-ar putea
        contrazice cu el.
      */}
      {error && (
        <div className="mx-auto w-full max-w-3xl px-4 pt-4">
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Răspunsul nu a putut fi generat</AlertTitle>
            <AlertDescription>{readableError(error)}</AlertDescription>
            <AlertAction>
              <Button variant="ghost" size="sm" onClick={clearError}>
                Am înțeles
              </Button>
            </AlertAction>
          </Alert>
        </div>
      )}

      {messages.length > 0 ? (
        <>
          <MessageList messages={messages} status={status} userInitials={initials} isLoading={!hydrated} />
          {/* Composer-ul lipit jos: zona de mesaje se derulează, cutia rămâne mereu la îndemână. */}
          <div className="border-t bg-background/80 supports-backdrop-filter:backdrop-blur">
            <div className="mx-auto w-full max-w-3xl px-4 py-4">{composer}</div>
          </div>
        </>
      ) : (
        <EmptyState userName={profile.name} onPickSuggestion={handlePickSuggestion} composer={composer} />
      )}
    </div>
  );
}
