"use client";

/**
 * Preferințe → Profilul tău. Formularul cel mai important din aplicație.
 *
 * DE CE contează atât de mult un formular banal:
 * din exact câmpurile astea se va construi „persona" — system prompt-ul agentului (Faza 4).
 * Ce nu e completat aici, agentul nu va putea ști, iar răspunsurile vor redeveni generice.
 * De asta câmpurile nu sunt „nice to have": sunt sursa contextului.
 *
 * DE CE skill-urile se editează ca text („nume: nivel" pe linie) și nu cu un rând de câmpuri
 * pentru fiecare skill:
 * un profil real are 10–20 de skill-uri. Un editor cu rânduri, butoane de adăugare și select
 * pe fiecare rând ar fi mai frumos în captură, dar mult mai lent de completat și de corectat.
 * Textul se lipește dintr-un CV într-o secundă. La Faza 4, când agentul le va putea actualiza
 * singur, aici va rămâne doar corectura manuală.
 *
 * DE CE nu salvăm la fiecare tastă:
 * un profil pe jumătate scris („React: interm") ar ajunge în starea salvată și, mai târziu, în
 * system prompt. Salvăm explicit, la buton, după validare.
 */

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/useAppStore";
import { SKILL_LEVELS, type Skill, type SkillLevel } from "@/lib/types";

/** Profilul → text pentru `Textarea`. O pereche pe linie. */
function skillsToText(skills: Skill[]): string {
  return skills.map(skill => `${skill.name}: ${skill.level}`).join("\n");
}

/**
 * Text → skill-uri, cu raportarea liniilor greșite.
 *
 * DE CE întoarce și erorile, în loc să arunce sau să ignore:
 * dacă am ignora liniile invalide, utilizatorul ar salva și ar constata că jumătate din
 * skill-uri au dispărut, fără să afle de ce. Dacă am arunca, ar pierde tot textul. Așa îi
 * putem arăta exact ce linie n-am înțeles.
 */
function parseSkills(text: string): { skills: Skill[]; errors: string[] } {
  const skills: Skill[] = [];
  const errors: string[] = [];

  text
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .forEach(line => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        errors.push(`„${line}" — lipsește „:" dintre nume și nivel`);
        return;
      }

      const name = line.slice(0, separatorIndex).trim();
      const level = line
        .slice(separatorIndex + 1)
        .trim()
        .toLowerCase();

      if (!name) {
        errors.push(`„${line}" — lipsește numele skill-ului`);
        return;
      }
      if (!SKILL_LEVELS.includes(level as SkillLevel)) {
        errors.push(`„${line}" — nivel necunoscut („${level}")`);
        return;
      }

      skills.push({ name, level: level as SkillLevel });
    });

  return { skills, errors };
}

export function ProfileForm() {
  const profile = useAppStore(state => state.profile);
  const setProfile = useAppStore(state => state.setProfile);

  const [name, setName] = useState(profile.name);
  const [stack, setStack] = useState(profile.stack);
  const [goal, setGoal] = useState(profile.goal);
  const [skillsText, setSkillsText] = useState(() => skillsToText(profile.skills));
  const [errors, setErrors] = useState<string[]>([]);

  /**
   * DE CE NU există aici un `useEffect` care sincronizează câmpurile cu store-ul:
   * conținutul dialogului se montează în momentul în care preferințele se deschid și se
   * demontează la închidere. Deci valorile inițiale de mai sus sunt citite din store exact
   * atunci — la fiecare deschidere, proaspete. Un efect de sincronizare ar fi cod care nu
   * apucă niciodată să facă ceva util (dialogul pornește închis, iar starea salvată e citită
   * din `localStorage` cu mult înainte de primul click), în schimb ar aduce un risc real:
   * ar putea suprascrie ce tocmai a tastat utilizatorul.
   */

  function handleSave() {
    const { skills, errors: parseErrors } = parseSkills(skillsText);
    setErrors(parseErrors);
    if (parseErrors.length > 0) {
      toast.error("Profilul nu a fost salvat: sunt linii de skill-uri pe care nu le-am înțeles.");
      return;
    }

    setProfile({ name: name.trim() || profile.name, stack: stack.trim(), skills, goal: goal.trim() });
    toast.success("Profil salvat");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-name">Nume</Label>
        <Input id="profile-name" value={name} onChange={event => setName(event.target.value)} />
        <p className="text-xs text-muted-foreground">Apare în sidebar și în salutul de pe ecranul de start.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-stack">Stack actual</Label>
        <Input
          id="profile-stack"
          value={stack}
          onChange={event => setStack(event.target.value)}
          placeholder="Ex. Java 21, Spring Boot, PostgreSQL"
        />
        <p className="text-xs text-muted-foreground">Tehnologiile cu care lucrezi acum, nu cele pe care le vrei.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-skills">Skills</Label>
        <Textarea
          id="profile-skills"
          value={skillsText}
          onChange={event => setSkillsText(event.target.value)}
          rows={8}
          className="font-mono text-xs"
          placeholder={"Java: avansat\nReact: începător"}
        />
        <p className="text-xs text-muted-foreground">
          O pereche pe linie, în formatul <span className="font-mono">nume: nivel</span>. Niveluri permise:{" "}
          {SKILL_LEVELS.join(", ")}.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-goal">Obiectiv</Label>
        <Textarea
          id="profile-goal"
          value={goal}
          onChange={event => setGoal(event.target.value)}
          rows={3}
          placeholder="Ex. Să trec de la Java backend la AI engineer în 6 luni"
        />
        <p className="text-xs text-muted-foreground">
          Cu cât e mai concret (rol + orizont de timp), cu atât planul propus va fi mai util.
        </p>
      </div>

      {/* Alerta apare doar după o încercare de salvare — nu te ceartă în timp ce scrii. */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Linii pe care nu le-am putut citi</AlertTitle>
          <AlertDescription>
            <ul className="list-inside list-disc">
              {errors.map(error => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave}>Salvează profilul</Button>
      </div>
    </div>
  );
}
