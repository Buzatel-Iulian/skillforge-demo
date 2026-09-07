"use client";

/**
 * Composer-ul: cutia din care utilizatorul trimite un mesaj.
 *
 * DE CE e o componentă separată, folosită în două locuri:
 * apare centrat pe ecranul de conversație nouă și lipit jos într-o conversație existentă.
 * Aceeași cutie, două poziții — dacă ar fi scrisă de două ori, comportamentul tastaturii ar
 * ajunge inevitabil diferit între ele.
 *
 * DE CE e „controlată" (primește `value` din afară):
 * butoanele de sugestii de pe ecranul de start trebuie să pre-completeze inputul. Dacă textul
 * ar trăi în starea internă a acestei componente, sugestiile n-ar avea cum să-l scrie.
 *
 * DE CE textul NU stă în store-ul global:
 * e o ciornă de moment, nu date ale utilizatorului. În store ar fi salvat în localStorage și
 * ar reapărea, ciudat, la următoarea deschidere a aplicației.
 */

import { useEffect, useRef } from "react";
import { Plus, Send, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { PROVIDERS, PROVIDER_LIST, getModelLabel } from "@/lib/providers";
import { useAppStore } from "@/store/useAppStore";
import type { ChatStatus } from "ai";

/** Înălțimea maximă a cutiei de text. Peste ea, textul se derulează în loc să împingă ecranul. */
const MAX_HEIGHT_PX = 200;

type ChatInputProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  status: ChatStatus;
  onStop: () => void;
};

export function ChatInput({ value, onValueChange, onSubmit, status, onStop }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const providerId = useAppStore(state => state.providerId);
  const modelId = useAppStore(state => state.modelId);
  const selectProvider = useAppStore(state => state.selectProvider);
  const setModel = useAppStore(state => state.setModel);

  /**
   * Butonul devine „Stop" din clipa în care cererea a plecat, nu abia când sosește textul.
   *
   * DE CE amândouă stările: `submitted` = am trimis, modelul încă se gândește; `streaming` =
   * textul curge. În ambele, cererea e deschisă și trebuie să o poți opri — o generare lungă
   * costă bani chiar și în secundele de dinaintea primului cuvânt.
   *
   * DE CE derivăm din `status` și nu ținem un `isStreaming` propriu: o a doua stare, ținută în
   * paralel, s-ar putea contrazice cu hook-ul exact în cazurile care contează (eroare, oprire).
   */
  const isBusy = status === "submitted" || status === "streaming";

  /**
   * Creșterea în înălțime odată cu textul.
   * DE CE se face din JavaScript și nu din CSS: un `<textarea>` nu se poate dimensiona după
   * conținut din CSS. Trucul e să resetăm înălțimea la `auto` (ca `scrollHeight` să reflecte
   * conținutul real, nu înălțimea de dinainte) și abia apoi s-o fixăm.
   */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value]);

  /**
   * DE CE Enter trimite și Shift+Enter face rând nou:
   * e convenția din orice aplicație de chat — cel mai frecvent gest primește tasta cea mai
   * ieftină. `isComposing` protejează scrierea cu diacritice sau IME: acolo Enter confirmă
   * caracterul, iar dacă am trimite mesajul, textul s-ar rupe la jumătate.
   */
  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (isBusy || !value.trim()) return;
    onSubmit();
  }

  return (
    <div className="rounded-2xl border bg-card shadow-sm transition-colors focus-within:border-ring/60">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={event => onValueChange(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Întreabă-mă ce să înveți mai departe…"
        aria-label="Mesaj pentru SkillForge"
        // `resize-none` fiindcă înălțimea o gestionăm noi; fără bordură proprie, pentru că
        // bordura o desenează cutia din jur — altfel s-ar vedea două.
        className="max-h-[200px] min-h-0 resize-none border-0 bg-transparent px-4 py-3 text-base shadow-none focus-visible:ring-0 md:text-sm dark:bg-transparent"
      />

      {/* Rândul de jos AL CUTIEI: stânga = atașamente (rezervat), dreapta = provider + trimite. */}
      <div className="flex items-center justify-between gap-2 px-2 pb-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Adaugă atașament"
                onClick={() => toast.info("Atașamentele intră la Modul 6.")}
              />
            }
          >
            <Plus />
          </TooltipTrigger>
          <TooltipContent>Atașamente (Modul 6)</TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-1">
          {/*
            DE CE providerul se alege din composer, nu doar din preferințe:
            e o decizie pe care o iei chiar înainte de a trimite mesajul — la Faza 5, când vom
            compara costuri, vei vrea să schimbi providerul între două întrebări, nu să intri
            în setări. Lista se construiește din registrul de providere, deci un provider nou
            apare aici fără să modificăm componenta.
          */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" className="gap-1.5 font-normal text-muted-foreground" />}
            >
              <span className="text-foreground">{PROVIDERS[providerId].label}</span>
              <span className="hidden sm:inline">{getModelLabel(providerId, modelId)}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {PROVIDER_LIST.map((provider, index) => (
                <div key={provider.id}>
                  {index > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="flex items-center gap-2">
                    {provider.label}
                    {!provider.available && (
                      <Badge variant="secondary" className="font-normal">
                        Faza 5
                      </Badge>
                    )}
                  </DropdownMenuLabel>
                  {provider.available ? (
                    provider.models.map(model => (
                      <DropdownMenuItem
                        key={model.id}
                        onClick={() => {
                          if (provider.id !== providerId) selectProvider(provider.id);
                          setModel(model.id);
                        }}
                      >
                        <span className="flex-1">{model.label}</span>
                        {provider.id === providerId && model.id === modelId && (
                          <span className="text-xs text-muted-foreground">activ</span>
                        )}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>Se adaugă la pasul cu al doilea provider</DropdownMenuItem>
                  )}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/*
            DE CE UN SINGUR buton care comută între „trimite" și „stop":
            sunt acțiuni care nu pot exista simultan — cât timp răspunsul se scrie, nu ai ce
            trimite. Două butoane ar însemna unul mereu dezactivat, adică zgomot.
          */}
          {isBusy ? (
            <Button size="icon-sm" variant="secondary" onClick={onStop} aria-label="Oprește răspunsul">
              <Square />
            </Button>
          ) : (
            <Button size="icon-sm" onClick={onSubmit} disabled={!value.trim()} aria-label="Trimite mesajul">
              <Send />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
