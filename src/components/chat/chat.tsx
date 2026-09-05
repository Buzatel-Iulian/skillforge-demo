"use client";

/**
 * Zona centrală: decide dacă vezi ecranul de start sau o conversație, și ține ciorna de input.
 *
 * DE CE decizia stă aici și nu în pagină:
 * pagina compune zonele (sidebar / header / centru) și nu trebuie să știe nimic despre starea
 * chat-ului. Aici e singurul loc care întreabă „există o conversație activă cu mesaje?".
 *
 * DE CE zona centrală NU are bară de acțiuni:
 * cerința de produs e explicită — în centru doar strictul necesar. Orice buton adăugat aici
 * (regenerează, exportă, șterge) fură atenția de la singurul lucru care contează: conversația.
 * Acțiunile pe conversație stau în sidebar, pe fiecare rând.
 */

import { useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/chat/chat-input";
import { EmptyState } from "@/components/chat/empty-state";
import { MessageList } from "@/components/chat/message-list";
import { useAppStore, useStoreHydration } from "@/store/useAppStore";

/** Inițialele pentru avatar. Extrase o dată, ca să nu se recalculeze la fiecare mesaj din listă. */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "EU";
  return parts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Chat() {
  const [draft, setDraft] = useState("");
  const composerWrapperRef = useRef<HTMLDivElement>(null);

  const hydrated = useStoreHydration();
  const profile = useAppStore(state => state.profile);
  const conversations = useAppStore(state => state.conversations);
  const activeConversationId = useAppStore(state => state.activeConversationId);
  const status = useAppStore(state => state.status);
  const errorMessage = useAppStore(state => state.errorMessage);
  const sendMessage = useAppStore(state => state.sendMessage);
  const stopStreaming = useAppStore(state => state.stopStreaming);
  const dismissError = useAppStore(state => state.dismissError);

  const activeConversation = conversations.find(conversation => conversation.id === activeConversationId) ?? null;
  const initials = getInitials(profile.name);

  function handleSubmit() {
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft("");
  }

  /**
   * DE CE sugestia mută focusul în textarea:
   * după click, cursorul trebuie să fie deja în text ca să poți ajusta întrebarea. Fără asta,
   * ai un input completat pe care trebuie să-l mai și clichezi — un pas inutil.
   */
  function handlePickSuggestion(prompt: string) {
    setDraft(prompt);
    composerWrapperRef.current?.querySelector("textarea")?.focus();
  }

  const composer = (
    <div ref={composerWrapperRef}>
      <ChatInput
        value={draft}
        onValueChange={setDraft}
        onSubmit={handleSubmit}
        status={status}
        onStop={stopStreaming}
      />
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/*
        DE CE alerta stă deasupra conversației, nu în locul ei:
        o eroare de provider nu trebuie să șteargă de pe ecran ce ai discutat până atunci.
        Vezi problema ȘI contextul, deci poți reîncerca fără să pierzi nimic.
      */}
      {status === "error" && errorMessage && (
        <div className="mx-auto w-full max-w-3xl px-4 pt-4">
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Răspunsul nu a putut fi generat</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
            <AlertAction>
              <Button variant="ghost" size="sm" onClick={dismissError}>
                Am înțeles
              </Button>
            </AlertAction>
          </Alert>
        </div>
      )}

      {activeConversation && activeConversation.messages.length > 0 ? (
        <>
          <MessageList
            messages={activeConversation.messages}
            status={status}
            userInitials={initials}
            isLoading={!hydrated}
          />
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
