"use client";

/**
 * Sidebar-ul: „+ New" sus, lista de conversații la mijloc, utilizatorul jos.
 *
 * DE CE sus e UN SINGUR buton:
 * SkillForge face un lucru — te ajută să înveți spre un obiectiv. Un meniu cu „Projects",
 * „Artifacts", „Scheduled" ar sugera funcționalități care nu există și ar dilua exact mesajul
 * care contează. Restul (profil, temă, providere) sunt setări, deci stau în preferințe.
 *
 * DE CE lista de conversații e centrul sidebar-ului:
 * memoria între sesiuni e o cerință de bază (`docs/requirements.md` §4). Lista e dovada
 * vizibilă că aplicația ține minte — de asta ocupă tot spațiul dintre buton și utilizator.
 *
 * DE CE folosim componenta `sidebar` de la shadcn și nu un `<aside>` scris de mână:
 * ea rezolvă deja partea grea — pe ecran mic sidebar-ul devine un `Sheet` (panou glisant),
 * are stare deschis/închis, scurtătură de tastatură și gestionează focusul. Rescris manual,
 * ar fi cod de întreținut fără niciun câștig.
 */

import { useState } from "react";
import { ChevronUp, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore, useStoreHydration } from "@/store/useAppStore";
import type { Conversation } from "@/lib/types";

export function AppSidebar() {
  const hydrated = useStoreHydration();
  const { isMobile, setOpenMobile } = useSidebar();

  const conversations = useAppStore(state => state.conversations);
  const activeConversationId = useAppStore(state => state.activeConversationId);
  const profile = useAppStore(state => state.profile);
  const startNewConversation = useAppStore(state => state.startNewConversation);
  const selectConversation = useAppStore(state => state.selectConversation);
  const renameConversation = useAppStore(state => state.renameConversation);
  const deleteConversation = useAppStore(state => state.deleteConversation);
  const openSettings = useAppStore(state => state.openSettings);

  /** Conversația aflată în redenumire. `null` = dialogul e închis. */
  const [renaming, setRenaming] = useState<Conversation | null>(null);
  const [renameValue, setRenameValue] = useState("");

  /**
   * DE CE închidem sidebar-ul după selecție, dar numai pe mobil:
   * pe telefon sidebar-ul acoperă conversația — dacă ar rămâne deschis, ai alege un chat și
   * n-ai vedea rezultatul. Pe desktop stă lângă conținut, deci nu deranjează.
   */
  function closeOnMobile() {
    if (isMobile) setOpenMobile(false);
  }

  function handleNew() {
    startNewConversation();
    closeOnMobile();
  }

  function handleSelect(id: string) {
    selectConversation(id);
    closeOnMobile();
  }

  function handleDelete(conversation: Conversation) {
    deleteConversation(conversation.id);
    // Confirmarea e necesară: rândul dispare din listă, iar fără mesaj n-ai cum să știi dacă
    // ai șters ce voiai sau ai ratat click-ul.
    toast.success(`Conversație ștearsă: „${conversation.title}"`);
  }

  function submitRename() {
    if (!renaming) return;
    renameConversation(renaming.id, renameValue);
    setRenaming(null);
    toast.success("Titlu actualizat");
  }

  return (
    <>
      <Sidebar>
        <SidebarHeader className="gap-3 p-3">
          <div className="flex items-center gap-2 px-1">
            {/*
              Marca aplicației, desenată din tokenii temei.
              DE CE nu o imagine: un pătrat colorat cu inițialele se adaptează singur la temă
              și nu adaugă o cerere de rețea pentru ceva ce e, deocamdată, un placeholder.
            */}
            <span className="grid size-6 place-items-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground">
              SF
            </span>
            <span className="text-base font-semibold tracking-tight">SkillForge</span>
          </div>

          <Button onClick={handleNew} className="w-full justify-start gap-2">
            <Plus />
            New
          </Button>
        </SidebarHeader>

        {/*
          `overflow-hidden` pe container, derulare doar în `ScrollArea`.
          DE CE: `SidebarContent` are implicit `overflow-auto`, iar cu o listă lungă am fi avut
          două zone derulabile una în alta — două bare de scroll și o senzație de „lipicios".
          Aici stabilim clar cine derulează: lista, nu panoul.
        */}
        <SidebarContent className="overflow-hidden">
          <SidebarGroup className="min-h-0 flex-1">
            <SidebarGroupLabel>Chats and tasks</SidebarGroupLabel>

            {/*
              DE CE ScrollArea și nu `overflow-y-auto`:
              lista crește nelimitat, iar bara de derulare nativă arată diferit pe fiecare
              sistem de operare. ScrollArea o normalizează și o ascunde până la hover, deci
              lista nu sare în lățime când apare bara.
            */}
            <ScrollArea className="min-h-0 flex-1">
              <SidebarMenu>
                {!hydrated
                  ? [0, 1, 2, 3, 4].map(index => (
                      <SidebarMenuItem key={index} className="px-2 py-1.5">
                        <Skeleton className="h-4 w-full" />
                      </SidebarMenuItem>
                    ))
                  : conversations.map(conversation => (
                      <SidebarMenuItem key={conversation.id}>
                        <SidebarMenuButton
                          isActive={conversation.id === activeConversationId}
                          onClick={() => handleSelect(conversation.id)}
                          className="pr-8"
                        >
                          <span className="truncate">{conversation.title}</span>
                        </SidebarMenuButton>

                        {/*
                          Meniul pe rând, vizibil la hover (`showOnHover`).
                          DE CE ascuns implicit: cinci rânduri cu câte un buton mereu vizibil ar
                          transforma lista într-o bară de unelte. Acțiunile apar când ești pe rând.
                        */}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <SidebarMenuAction showOnHover aria-label={`Acțiuni pentru ${conversation.title}`} />
                            }
                          >
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" side="right" className="w-44">
                            <DropdownMenuItem
                              onClick={() => {
                                setRenaming(conversation);
                                setRenameValue(conversation.title);
                              }}
                            >
                              <Pencil />
                              Redenumește
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => handleDelete(conversation)}>
                              <Trash2 />
                              Șterge
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuItem>
                    ))}

                {hydrated && conversations.length === 0 && (
                  // Starea goală a listei: fără ea, un utilizator care și-a șters tot ar vedea
                  // un panou pustiu și ar crede că aplicația s-a stricat.
                  <p className="px-2 py-6 text-sm text-muted-foreground">
                    Nicio conversație încă. Apasă <span className="font-medium text-foreground">New</span> ca să începi.
                  </p>
                )}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          {/*
            Rândul de utilizator = intrarea în preferințe.
            DE CE aici și nu un buton „Setări" în header: e locul unde toată lumea caută
            setările de cont, iar header-ul rămâne curat. `ChevronUp` anunță că se deschide
            ceva peste conținut, nu că se navighează în altă parte.
          */}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                onClick={() => {
                  openSettings();
                  closeOnMobile();
                }}
                aria-label="Deschide preferințele"
              >
                <Avatar className="size-7">
                  <AvatarFallback className="bg-muted text-xs">{profile.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-left">{profile.name}</span>
                <ChevronUp className="text-muted-foreground" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/*
        Dialogul de redenumire.
        DE CE dialog și nu editare direct în listă (`contentEditable`):
        editarea în listă e greu de nimerit cu mouse-ul, nu are buton de anulare clar și se
        comportă imprevizibil pe mobil. Un dialog cu `Input` + `Label` e explicit și accesibil.
      */}
      <Dialog open={renaming !== null} onOpenChange={open => !open && setRenaming(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redenumește conversația</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rename-conversation">Titlu</Label>
            <Input
              id="rename-conversation"
              value={renameValue}
              onChange={event => setRenameValue(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter") submitRename();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              Anulează
            </Button>
            <Button onClick={submitRename} disabled={!renameValue.trim()}>
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
