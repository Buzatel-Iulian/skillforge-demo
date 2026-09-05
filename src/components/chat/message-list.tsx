"use client";

/**
 * Lista de mesaje a conversației active, plus stările ei.
 *
 * DE CE lista e separată de `chat.tsx`:
 * `chat.tsx` decide CE se afișează (ecran de start sau conversație). Aici e strict CUM arată o
 * conversație și cum se comportă la derulare. Sunt două motive diferite de schimbare, deci
 * două fișiere.
 *
 * DE CE conține și `Skeleton` și indicatorul „scrie…":
 * sunt stări ale aceleiași liste. Ținute aici, nu pot fi uitate la Faza 3 — când mesajele vor
 * veni prin streaming, componenta rămâne aceeași, doar sursa datelor se schimbă.
 */

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageItem } from "@/components/chat/message-item";
import type { ChatStatus, Message } from "@/lib/types";

type MessageListProps = {
  messages: Message[];
  status: ChatStatus;
  userInitials: string;
  isLoading: boolean;
};

export function MessageList({ messages, status, userInitials, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  /**
   * Derularea automată la ultimul mesaj.
   * DE CE depinde și de `status`: când apare indicatorul „scrie…", lista crește în înălțime;
   * fără dependența asta, indicatorul ar rămâne sub marginea vizibilă și ai crede că aplicația
   * n-a făcut nimic. `block: "end"` derulează doar containerul, nu toată pagina.
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, status]);

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        {isLoading ? <MessagesSkeleton /> : null}

        {!isLoading &&
          messages.map(message => <MessageItem key={message.id} message={message} userInitials={userInitials} />)}

        {status === "streaming" && <TypingIndicator />}

        {/* Ancoră invizibilă pentru derulare. Mai fiabilă decât calculul manual al lui scrollTop. */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

/**
 * Starea de încărcare.
 * DE CE forme, nu un spinner: un spinner spune „așteaptă", formele spun „vine o listă de
 * mesaje". Utilizatorul înțelege ce urmează, iar saltul de layout la apariția datelor e mai mic.
 */
function MessagesSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      {[0, 1].map(index => (
        <div key={index} className="flex flex-col gap-6">
          <div className="flex flex-row-reverse gap-3">
            <Skeleton className="size-7 rounded-full" />
            <Skeleton className="h-12 w-52 rounded-2xl" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="size-7 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-[min(28rem,70vw)]" />
              <Skeleton className="h-4 w-[min(22rem,60vw)]" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Indicatorul „scrie…".
 * DE CE trei puncte animate și nu textul „se încarcă": ocupă exact locul unde va apărea bula de
 * răspuns, deci nu mai există un salt când textul începe să curgă.
 * DE CE `aria-live="polite"`: cine folosește cititor de ecran trebuie să afle că a început
 * răspunsul, fără să fie întrerupt în mijlocul altei citiri.
 */
function TypingIndicator() {
  return (
    <div className="flex gap-3" aria-live="polite">
      <Avatar className="mt-0.5 size-7 shrink-0">
        <AvatarFallback className="bg-muted text-xs">SF</AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-muted px-4 py-4">
        <span className="sr-only">SkillForge scrie…</span>
        {[0, 150, 300].map(delay => (
          <span
            key={delay}
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
