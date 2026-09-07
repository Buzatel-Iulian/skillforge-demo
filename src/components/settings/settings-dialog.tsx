"use client";

/**
 * Preferințele: fereastră separată, cu navigație în stânga și conținut în dreapta.
 *
 * DE CE `Dialog` și nu un panou inline sau un ecran propriu:
 * setările sunt o paranteză, nu o destinație. Un panou inline ar împinge conversația din
 * layout; un ecran separat (rută `/settings`) ar însemna că ieși din conversație, pierzi
 * contextul și trebuie să navighezi înapoi. Dialogul le rezolvă pe amândouă: apare peste,
 * se închide cu Escape, iar conversația rămâne exact unde era.
 *
 * DE CE două panouri și nu o listă lungă cu tot:
 * preferințele vor crește (la Faza 6 „Memorie", la Faza 9 „Cont"). Cu navigație laterală,
 * fiecare secțiune nouă e o intrare în registru; într-o listă lungă, ar fi încă un derulaj.
 *
 * DE CE starea de deschidere stă în store și nu aici:
 * dialogul se deschide de la rândul de utilizator din sidebar — o componentă care nu-l
 * conține. Prin store, orice buton din aplicație poate deschide direct secțiunea potrivită.
 */

import { Info, Settings, Sparkles, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AboutForm } from "@/components/settings/about-form";
import { AppearanceForm } from "@/components/settings/appearance-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { ProvidersForm } from "@/components/settings/providers-form";
import { useAppStore, type SettingsSection } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

/**
 * Registrul de secțiuni: id → etichetă, iconiță, descriere, conținut.
 *
 * DE CE registru și nu `if (section === "general") ... else if (...)`:
 * navigația din stânga și panoul din dreapta se generează amândouă din aceeași sursă. Așa e
 * imposibil să adaugi o intrare în meniu fără conținut, sau invers — greșeala clasică atunci
 * când cele două liste sunt scrise separat.
 */
const SECTIONS: {
  id: SettingsSection;
  label: string;
  icon: typeof Settings;
  description: string;
  Content: () => React.ReactNode;
}[] = [
  {
    id: "general",
    label: "General",
    icon: Settings,
    description: "Cum arată și cum se comportă aplicația.",
    Content: AppearanceForm
  },
  {
    id: "profil",
    label: "Profilul tău",
    icon: UserRound,
    description: "Din datele astea se va construi contextul trimis agentului.",
    Content: ProfileForm
  },
  {
    id: "providere",
    label: "Providere",
    icon: Sparkles,
    description: "Ce model de limbaj folosește agentul.",
    Content: ProvidersForm
  },
  {
    id: "despre",
    label: "Despre aplicație",
    icon: Info,
    description: "La ce servește SkillForge — text adus de pe server, în streaming.",
    Content: AboutForm
  }
];

export function SettingsDialog() {
  const open = useAppStore(state => state.settingsOpen);
  const setOpen = useAppStore(state => state.setSettingsOpen);
  const section = useAppStore(state => state.settingsSection);
  const setSection = useAppStore(state => state.setSettingsSection);

  const active = SECTIONS.find(item => item.id === section) ?? SECTIONS[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/*
        `p-0 gap-0` anulează spațierea implicită a dialogului: aici marginile le desenează
        cele două panouri, altfel ar apărea un chenar de aer între ele.
        Înălțimea fixă (`h-[min(36rem,90vh)]`) e ce ține navigația pe loc când conținutul
        din dreapta e mai lung — fără ea, fereastra ar sălta la fiecare schimbare de secțiune.
      */}
      <DialogContent className="grid h-[min(36rem,90vh)] w-full gap-0 overflow-hidden p-0 sm:max-w-3xl md:grid-cols-[13rem_1fr]">
        <DialogHeader className="sr-only">
          <DialogTitle>Preferințe</DialogTitle>
          <DialogDescription>Setările aplicației, profilul tău și providerul de LLM.</DialogDescription>
        </DialogHeader>

        {/*
          Panoul de navigație. Pe mobil devine un rând orizontal deasupra conținutului:
          o coloană de 13rem ar mânca jumătate din lățimea unui telefon.
        */}
        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b bg-muted/40 p-2 md:flex-col md:overflow-visible md:border-r md:border-b-0 md:p-3">
          <span className="hidden px-2 pb-1 text-xs font-medium text-muted-foreground md:block">Setări</span>
          {SECTIONS.map(item => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => setSection(item.id)}
              className={cn(
                "shrink-0 justify-start gap-2 font-normal md:w-full",
                item.id === active.id && "bg-accent text-accent-foreground"
              )}
            >
              <item.icon />
              {item.label}
            </Button>
          ))}
        </nav>

        {/*
          Panoul de conținut. Se derulează independent de navigație.

          DE CE `h-full` și nu `min-h-full`:
          o secțiune care vrea să-și lipească bara de acțiuni la baza ferestrei (vezi
          `about-form.tsx`) folosește `flex-1`. `flex-1` are nevoie de o înălțime DEFINITĂ în
          părinte ca să știe de ce să se agațe; `min-h-full` dă doar un minim, deci înălțimea
          rămâne „cât conținutul" și panoul crește sub marginea ferestrei.
          `min-h-0` e perechea obligatorie: un item de grid, ca și unul de flex, are implicit
          `min-height: auto` și refuză să coboare sub înălțimea conținutului — fără el,
          `overflow-y-auto` n-ar avea ce derula, panoul s-ar întinde pur și simplu.

          DE CE un `div` și nu `ScrollArea` din shadcn (aici e diferența care costă o oră):
          `ScrollArea` (Radix) inserează între viewport și copil un wrapper cu `display: table`,
          care se dimensionează după conținut. Într-un astfel de wrapper, procentele de înălțime
          se rezolvă circular, deci `h-full` pe copil nu mai înseamnă nimic și rețeta de mai sus
          se rupe fără niciun mesaj de eroare.
        */}
        <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto p-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold tracking-tight">{active.label}</h2>
            <p className="text-sm text-muted-foreground">{active.description}</p>
          </div>
          <Separator />
          <active.Content />
        </div>
      </DialogContent>
    </Dialog>
  );
}
