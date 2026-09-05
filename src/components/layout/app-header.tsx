"use client";

/**
 * Header-ul zonei centrale. Intenționat aproape gol.
 *
 * DE CE există totuși:
 * pe ecran mic sidebar-ul e ascuns, deci trebuie să existe un loc fix din care se deschide
 * (`SidebarTrigger`). Iar când derulezi o conversație lungă, titlul de sus e singurul indiciu
 * despre unde te afli.
 *
 * DE CE NU are bară de acțiuni și, în special, NU are buton de temă:
 * cerința de produs e ca centrul să conțină doar strictul necesar. Tema se schimbă din
 * preferințe → General → Appearance, într-un singur loc. Un comutator de temă în header e
 * tentant („e la un click") dar ocupă permanent spațiu pentru o acțiune făcută o dată la
 * câteva luni.
 */

import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAppStore } from "@/store/useAppStore";

export function AppHeader() {
  const conversations = useAppStore(state => state.conversations);
  const activeConversationId = useAppStore(state => state.activeConversationId);

  const activeTitle = conversations.find(conversation => conversation.id === activeConversationId)?.title;

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-2">
      <SidebarTrigger aria-label="Comută sidebar-ul" />
      {/* `truncate` fiindcă titlul vine din primul mesaj al utilizatorului: poate fi oricât de lung. */}
      <span className="truncate text-sm text-muted-foreground">{activeTitle ?? "Conversație nouă"}</span>
    </header>
  );
}
