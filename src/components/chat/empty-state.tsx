"use client";

/**
 * Ecranul de conversație nouă: numele aplicației, salutul și sugestiile.
 *
 * DE CE ecranul de start e o componentă separată, nu un `if` în `chat.tsx`:
 * e primul lucru pe care îl vede utilizatorul și singurul loc unde aplicația poate spune ce
 * știe să facă. Va crește (la Faza 4 va arăta obiectivul din profil, la Faza 6 planul curent),
 * deci merită fișier propriu.
 *
 * DE CE salutul folosește numele din profil:
 * e prima dovadă vizibilă că aplicația NU e un chat generic. Cerința din
 * `docs/requirements.md` §1 e ca profilul să fie nucleul — dacă nici ecranul de start nu-l
 * folosește, promisiunea nu se vede.
 *
 * DE CE sugestiile doar pre-completează inputul, fără să trimită:
 * utilizatorul trebuie să poată ajusta întrebarea înainte de trimitere. O sugestie care
 * trimite direct fură controlul și, la Faza 3, ar consuma bani pe o întrebare neintenționată.
 */

import { CalendarClock, GraduationCap, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Registrul de sugestii.
 * DE CE un tablou și nu patru butoane scrise de mână: adăugarea sau ștergerea unei sugestii
 * devine o linie de date, nu o modificare de JSX. Iar `prompt` stă lângă `label`, deci nu se
 * poate întâmpla să schimbi eticheta și să uiți textul.
 */
const SUGGESTIONS = [
  {
    label: "Plan de învățare",
    icon: CalendarClock,
    prompt: "Fă-mi un plan de învățare pe 3 luni pentru obiectivul meu, cu 8 ore pe săptămână."
  },
  {
    label: "Gap analysis",
    icon: Target,
    prompt: "Compară skill-urile mele cu ce cere obiectivul meu și spune-mi ce-mi lipsește, în ordinea impactului."
  },
  {
    label: "Pregătire interviu",
    icon: GraduationCap,
    prompt: "Ce mă vor întreba la un interviu pentru rolul spre care merg, dat fiind stack-ul meu actual?"
  },
  {
    label: "Alege tu",
    icon: Sparkles,
    prompt: "Uită-te la profilul meu și spune-mi tu care e cel mai util pas următor."
  }
] as const;

type EmptyStateProps = {
  userName: string;
  onPickSuggestion: (prompt: string) => void;
  /** Composer-ul, primit ca element: pe ecranul de start el stă între salut și sugestii. */
  composer: React.ReactNode;
};

export function EmptyState({ userName, onPickSuggestion, composer }: EmptyStateProps) {
  return (
    // `justify-center` cu un pic de aer în plus sus: ca pe mock, blocul stă puțin peste mijloc,
    // nu perfect centrat — altfel sugestiile ajung prea jos pe ecranele înalte.
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-4 pb-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">SkillForge</span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Salut, {userName}. Ce învățăm astăzi?</h1>
      </div>

      {composer}

      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map(suggestion => (
          <Button
            key={suggestion.label}
            variant="outline"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => onPickSuggestion(suggestion.prompt)}
          >
            <suggestion.icon />
            {suggestion.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
