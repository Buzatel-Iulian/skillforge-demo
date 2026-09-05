"use client";

/**
 * Preferințe → Providere: ce model de limbaj folosește agentul.
 *
 * DE CE secțiunea există deja, deși nu se face niciun apel:
 * „providerul e schimbabil" e un principiu tehnic din `docs/requirements.md` §4, nu o
 * funcționalitate de la Faza 5. Dacă alegerea providerului n-ar avea loc în UI de la început,
 * ea ar ajunge o constantă ascunsă în cod — exact ce vrem să evităm.
 *
 * DE CE nu apare nicio cheie de API în acest ecran:
 * cheia stă pe server, în `.env.local`. Un câmp „API key" în interfață ar însemna că cheia
 * trece prin browser — adică exact greșeala pe care aplicația e construită să o evite. Aici
 * se alege DOAR ce model se folosește; cu ce cheie se apelează e treaba serverului.
 */

import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PROVIDER_LIST } from "@/lib/providers";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

export function ProvidersForm() {
  const providerId = useAppStore(state => state.providerId);
  const modelId = useAppStore(state => state.modelId);
  const selectProvider = useAppStore(state => state.selectProvider);
  const setModel = useAppStore(state => state.setModel);

  return (
    <div className="flex flex-col gap-6">
      {/*
        Lista se construiește iterând registrul din `src/lib/providers.ts`.
        DE CE contează: la Faza 5, OpenAI devine `available: true` și primește modele — ecranul
        ăsta nu se atinge. Un `if (provider === "anthropic")` ar fi cerut modificări aici.
      */}
      {PROVIDER_LIST.map((provider, index) => (
        <div key={provider.id} className="flex flex-col gap-3">
          {index > 0 && <Separator />}

          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{provider.label}</span>
                {provider.id === providerId && <Badge variant="secondary">activ</Badge>}
                {!provider.available && <Badge variant="outline">indisponibil</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">{provider.description}</p>
            </div>

            <Button
              variant={provider.id === providerId ? "secondary" : "outline"}
              size="sm"
              disabled={!provider.available || provider.id === providerId}
              onClick={() => selectProvider(provider.id)}
            >
              {provider.id === providerId ? "Selectat" : "Folosește"}
            </Button>
          </div>

          {provider.models.length > 0 && (
            <div className="flex flex-col gap-1">
              {provider.models.map(model => {
                const isActive = provider.id === providerId && model.id === modelId;
                return (
                  // Rândul de model e un `Button` din shadcn, nu un `<button>` stilat de mână:
                  // primește gratuit stările de focus și disabled ale restului aplicației.
                  <Button
                    key={model.id}
                    variant="ghost"
                    onClick={() => {
                      if (provider.id !== providerId) selectProvider(provider.id);
                      setModel(model.id);
                    }}
                    className={cn(
                      "h-auto justify-between px-2 py-1.5 font-normal",
                      isActive && "bg-accent text-accent-foreground"
                    )}
                  >
                    <span>{model.label}</span>
                    {/* Id-ul real e afișat intenționat: e valoarea care va ajunge în cererea de la Faza 3. */}
                    <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                      {model.id}
                      {isActive && <Check className="size-3.5" />}
                    </span>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <p className="border-t pt-4 text-xs text-muted-foreground">
        Alegerea de aici e salvată local și se vede și în composer. Apelul real către provider intră la pasul următor,
        dintr-un Route Handler pe server.
      </p>
    </div>
  );
}
