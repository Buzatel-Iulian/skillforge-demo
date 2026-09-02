/**
 * Configurația ESLint.
 *
 * DE CE ESLint și Prettier stau separat, deși par să facă amândouă „curățenie":
 * Prettier decide FORMA (spații, ghilimele, unde se rupe rândul) și nu are opinii despre cod.
 * ESLint găsește GREȘELI (hook folosit greșit, `<img>` în loc de `next/image`, import care
 * trece granița server/client). Nu se suprapun, iar la pașii următori regulile de aici sunt
 * cele care prind cel mai devreme o eroare de tipul „ai chemat un hook într-un Server Component".
 */
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts"
  ])
]);

export default eslintConfig;
