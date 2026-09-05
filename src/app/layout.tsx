/**
 * Shell-ul comun al aplicației (root layout).
 *
 * DE CE aici, și nu în pagină, stau providerii:
 * layout-ul nu se re-randează la navigare. Tema, tooltip-urile și notificările trebuie să
 * supraviețuiască schimbării rutei — dacă ar fi în pagină, s-ar reinițializa la fiecare
 * navigare (tema ar clipi, un toast în curs ar dispărea).
 *
 * DE CE layout-ul rămâne Server Component, deși copiii lui sunt componente client:
 * un Server Component poate randa componente client. Așa `<head>` și HTML-ul inițial se
 * generează pe server (bine pentru prima afișare), iar interactivitatea coboară doar unde e
 * cerută explicit. La Faza 4, aici se va putea citi profilul de pe server fără să schimbăm
 * structura.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "SkillForge",
  description: "Copilot personal de skills și carieră"
};

/**
 * Scriptul care aplică tema ÎNAINTE de primul paint.
 *
 * DE CE e nevoie de el, deși avem deja `ThemeProvider`:
 * providerul rulează în React, adică după ce browserul a desenat prima dată. Cine a ales tema
 * întunecată ar vedea o fracțiune de secundă de alb — sâcâitor și foarte vizibil. Scriptul de
 * aici e sincron: rulează înainte de desenare și pune clasa la timp.
 *
 * DE CE citește chiar `localStorage["skillforge-app"]`:
 * e cheia sub care salvează store-ul (`persist`). Formatul e `{ state: {...}, version: n }`,
 * de unde ne interesează doar `state.theme`. Totul e în `try/catch`: dacă utilizatorul are
 * cookie-urile/stocarea blocate, aplicația trebuie să pornească oricum, pe tema sistemului.
 */
const themeScript = `(function () {
  try {
    var raw = localStorage.getItem("skillforge-app");
    var preference = raw ? JSON.parse(raw).state.theme : "sistem";
    var dark = preference === "dark" ||
      (preference === "sistem" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  } catch (error) {}
})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // `suppressHydrationWarning`: scriptul de mai sus modifică clasa de pe <html> înainte ca
    // React să se hidrateze. Fără el, React ar raporta o nepotrivire pe care noi am produs-o
    // intenționat — și doar pentru acest element.
    <html
      lang="ro"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          {/*
            TooltipProvider o dată, la rădăcină: tooltip-urile împart o singură temporizare,
            deci trecerea rapidă a mouse-ului peste mai multe butoane nu deschide trei
            tooltip-uri suprapuse.
          */}
          <TooltipProvider>{children}</TooltipProvider>
          {/*
            Toaster-ul stă în afara conținutului: notificările se randează într-un portal, deci
            nu trebuie să fie într-un anumit loc din arbore. Culorile lui vin din tokenii temei,
            deci urmează automat modul light/dark.
          */}
          <Toaster position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
