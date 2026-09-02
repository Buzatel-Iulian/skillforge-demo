/**
 * Configurația PostCSS — singurul loc prin care Tailwind se leagă de build.
 *
 * DE CE arată atât de scurt (și de ce nu există `tailwind.config.js`):
 * la Tailwind v4 configurarea s-a mutat din JavaScript în CSS. Plugin-ul de mai jos scanează
 * fișierele, vede ce clase folosim și generează doar CSS-ul necesar; tema (culori, radius,
 * fonturi) se declară cu `@theme` direct în `src/app/globals.css`.
 *
 * Consecință practică, ușor de ratat: uneltele care au nevoie să cunoască tema nu mai au
 * un fișier de config din care s-o citească. De asta în `.prettierrc` i-am spus explicit
 * plugin-ului de Tailwind unde e foaia de stil (`tailwindStylesheet`) — fără ea nu ar
 * recunoaște tokenii proiectului când reordonează clasele.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {}
  }
};

export default config;
