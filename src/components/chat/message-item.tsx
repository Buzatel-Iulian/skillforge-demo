"use client";

/**
 * Un singur mesaj din conversație.
 *
 * DE CE mesajul e o componentă proprie, nu doar un `<div>` în listă:
 * aici se va complica cel mai mult la pașii următori — Markdown, blocuri de cod, citări din
 * notițe (RAG), apeluri de unelte afișate în bulă. Dacă toată logica ar sta în `message-list`,
 * fișierul acela ar deveni de necitit exact când devine interesant.
 *
 * DE CE user la dreapta și assistant la stânga:
 * e convenția pe care o citește oricine fără explicații — „ce am spus eu" vs. „ce mi s-a
 * răspuns". Alinierea singură transmite rolul, fără să fie nevoie de etichete mari.
 */

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { isTextUIPart, type UIMessage } from "ai";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * ⚠️ Capcana de format a Fazei 3, cea care costă cel mai mult timp dacă n-o știi.
 *
 * Un mesaj din SDK **nu are `content` de tip string**. Are `parts` — bucăți TIPATE: text,
 * raționament, apeluri de unelte, fișiere. Cine scrie `message.content` primește `undefined`,
 * vede bule goale și trage concluzia că streaming-ul nu funcționează.
 *
 * DE CE formatul e așa: un răspuns modern nu mai e un singur bloc de text. La Faza 6, când
 * agentul va apela unelte, în același mesaj vor apărea și bucăți de tip „am căutat în notițe" —
 * imposibil de reprezentat într-un string. Aici luăm doar bucățile de text și le lipim.
 *
 * `isTextUIPart` e verificatorul SDK-ului: îngustează tipul, deci nu avem nevoie de `as`.
 */
function getMessageText(message: UIMessage): string {
  return message.parts
    .filter(isTextUIPart)
    .map(part => part.text)
    .join("");
}

export function MessageItem({ message, userInitials }: { message: UIMessage; userInitials: string }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const text = getMessageText(message);

  /**
   * DE CE copierea are nevoie de `try/catch`:
   * `navigator.clipboard` cere context securizat (https sau localhost) și poate fi refuzată de
   * browser. Fără tratare, butonul ar părea pur și simplu stricat, fără nicio explicație.
   */
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Mesaj copiat");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Browserul nu a permis copierea în clipboard.");
    }
  }

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <Avatar className="mt-0.5 size-7 shrink-0">
        <AvatarFallback className={cn("text-xs", isUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
          {isUser ? userInitials : "SF"}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex max-w-[85%] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        <span className="px-1 text-xs text-muted-foreground">{isUser ? "Tu" : "SkillForge"}</span>

        {/*
          `group` de aici e ce face butonul de copiere să apară la hover peste bulă.
          DE CE butonul stă ÎN interiorul bulei și nu lângă ea: lângă bulă ar muta textul la
          apariție și ar fi greu de nimerit pe telefon. În bulă, poziția lui e stabilă.
        */}
        <div
          className={cn(
            "group relative rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
            isUser ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted"
          )}
        >
          {/*
            Cursorul care clipește cât timp bula e încă goală.
            DE CE: prima bucată de la model poate întârzia o secundă. O bulă complet goală arată
            ca un bug; un cursor arată că răspunsul a început și se scrie.
          */}
          {text || <span className="inline-block h-4 w-2 animate-pulse rounded-xs bg-muted-foreground/60" />}

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleCopy}
                  aria-label="Copiază mesajul"
                  className={cn(
                    "absolute -top-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
                    isUser ? "-left-9" : "-right-9"
                  )}
                />
              }
            >
              {copied ? <Check /> : <Copy />}
            </TooltipTrigger>
            <TooltipContent>{copied ? "Copiat" : "Copiază"}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
