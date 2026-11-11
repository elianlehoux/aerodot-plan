# Aerodot Plan

Herramienta web para armar un plan de vuelo, guardarlo en el navegador y bajarlo en PDF sobre el formulario de EANA.

**Demo:** https://aerodot-plan.vercel.app · **Estado:** en desarrollo.

- Los planes se guardan en el `localStorage` del navegador. No hay cuentas ni servidor.
- El PDF se arma en el navegador con [pdf-lib](https://pdf-lib.js.org/) sobre `public/forms/plan-de-vuelo-eana.pdf`.
- Es un proyecto aparte de [Aerodot](https://aerodot.vercel.app) y no comparte código con la biblioteca.

## Correrlo en local

Hace falta Node 22.12 o más nuevo (lo pide Astro 6).

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # sitio estático en dist/
```

## Dónde está cada cosa

| Qué | Dónde |
| --- | --- |
| Lista de planes | `src/pages/index.astro`, `src/scripts/flight-plan-list.js` |
| Editor y PDF | `src/pages/editar.astro`, `src/scripts/flight-plan-editor.js` |
| Campos del plan y guardado | `src/data/flight-plan.js` |

## Stack

Astro, JavaScript, pdf-lib.

## Licencia

Código: [MIT](LICENSE). La fuente Inter tiene su propia licencia en `public/fonts/LICENSE.txt`.
