/**
 * Shell-ul comun al aplicației (root layout).
 *
 * DE CE există acest fișier și de ce e obligatoriu:
 * în App Router, layout-ul rădăcină e SINGURUL loc unde se scriu <html> și <body>.
 * Paginile nu le redeclară — ele randează doar `children`. Layout-ul nu se re-randează
 * la navigarea între rute, deci aici pun tot ce trebuie să rămână stabil: fonturi,
 * metadata, iar mai târziu shell-ul de chat al agentului (bara laterală cu sesiuni,
 * providerul de temă). Dacă aș pune astea în fiecare pagină, s-ar reconstrui la fiecare
 * navigare și starea vizuală ar sări.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/**
 * DE CE fonturile se încarcă prin `next/font` și nu prin <link> către Google Fonts:
 * Next descarcă fișierele la build și le servește din propriul domeniu. Rezultatul e
 * că nu mai există o cerere către un terțiu la runtime (mai rapid, fără dependență
 * externă) și textul nu mai sare când fontul se schimbă. Ne dă și o variabilă CSS,
 * pe care Tailwind o folosește ca token (`--font-sans` în globals.css).
 */
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

/**
 * DE CE metadata se exportă ca obiect și nu se scrie <title> de mână:
 * layout-ul rulează pe server, deci Next poate genera <head> înainte să trimită HTML-ul.
 * Contează pentru ce vede un crawler sau un link preview — un <title> pus din JavaScript
 * de client ar ajunge prea târziu.
 */
export const metadata: Metadata = {
  title: "SkillForge",
  description: "Copilot personal de skills și carieră"
};

/**
 * DE CE tipul e `LayoutProps<"/">` și nu un tip scris de mână:
 * Next 16 generează tipuri din arborele real de rute (`.next/types`). Așa, dacă mai târziu
 * adaug un layout cu parametri dinamici (ex. `/chat/[sessionId]`), tipul lui `params` vine
 * din numele folderului — nu îl inventez eu și nu poate ieși din sincron cu rutele.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      {/* `min-h-full flex flex-col` pregătește terenul pentru UI-ul de chat de la pasul următor:
          zona de mesaje va crește, iar inputul va rămâne lipit jos. */}
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
