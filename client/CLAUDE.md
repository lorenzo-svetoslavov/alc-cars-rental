## Claude Code — alc-cars-rental (client)

Este proyecto es un monorepo pnpm con dos apps: `admin/` y `client/`. Este
CLAUDE.md cubre la app `client/` (Astro).

## Stack

- Astro 7 (adaptador `@astrojs/vercel`)
- Tailwind CSS 4 (vía `@tailwindcss/vite`) + daisyUI 5
- Flatpickr — selector de fechas (reservas)
- Alpine.js — interactividad ligera en componentes `.astro`
- Supabase — base de datos / backend (`src/lib/supabase.ts`)
- Zod — validación de datos
- Gestor de paquetes: **pnpm** (no usar npm ni yarn). Node >= 22.12.0

## Comandos

Desde la raíz del monorepo:

- `pnpm run dev:client` — servidor de desarrollo del cliente
- `pnpm run dev:admin` — servidor de desarrollo del panel admin

Desde `client/`:

- `pnpm run dev` — servidor de desarrollo
- `pnpm run build` — build de producción
- `pnpm run preview` — previsualizar el build
- `pnpm run astro -- <comando>` — CLI de Astro (`check`, `add`, `info`…)

No hay scripts de lint ni de test configurados en el proyecto.

Al arrancar el servidor de desarrollo, usar modo background:

```
astro dev --background
```

Gestionarlo con `astro dev stop`, `astro dev status` y `astro dev logs`.

## Estructura (client/src)

- `assets/` — imágenes y assets estáticos
- `components/fleet/` — catálogo de coches: `CarCard`, `CarFilters`,
  `CarGallery`, `CarPriceBadge`, `CarSpecs`, `FleetGrid`
- `components/home/` — componentes de la home: `Hero`, `WhyChooseUs`, `FAQ`,
  `Location`, `CTABanner`
- `components/shared/` — compartidos entre secciones (`RentalSearchFields.astro`)
- `layouts/` — `BaseLayout`, `Header`, `Footer`
- `lib/`
  - `cars.ts` — lógica y consultas relacionadas con coches
  - `rental-search.ts` — lógica de búsqueda de alquiler
  - `supabase.ts` — cliente de Supabase
- `pages/` — rutas (file-based routing de Astro): `auth/`, `legal/`,
  `mi-cuenta/`, `rent-a-car/`, `reserva/`
- `styles/global.css` — estilos globales y configuración de tema Tailwind/daisyUI
- `types/` — tipos TypeScript compartidos (`car.ts`)

## Convenciones

- Componentes `.astro` por defecto. Usar Alpine.js (`x-data`, `x-show`, `x-on`)
  para interactividad en cliente; evitar añadir un framework de UI pesado para
  algo que Alpine ya resuelve.
- Componentes del catálogo de coches van en `components/fleet/` con prefijo `Car*`.
- Estilado con clases de Tailwind/daisyUI; evitar CSS custom salvo que
  daisyUI no cubra el caso.
- Tipar en `lib/` y `types/` las respuestas de Supabase — no usar `any`.
- Rutas y textos de cara al usuario en español.

## Diseño / marca

- El **naranja corporativo predomina siempre** en el diseño: botones
  primarios, CTAs y acentos. No introducir otro color como color de acento
  principal sin confirmarlo antes con el usuario.

## Reglas críticas

- **Nunca borrar, truncar ni resetear la base de datos de Supabase**
  (tablas, filas en bloque, migraciones destructivas) sin confirmación
  explícita del usuario en el chat. Ningún `DROP`/`DELETE` masivo ni
  migración irreversible sin autorización expresa, incluso si parece
  necesario para arreglar un bug.
- Antes de escribir o modificar código, revisar los skills disponibles y
  aplicarlos para mejorar la calidad del código.

## Documentación

Documentación completa: https://docs.astro.build

Consultar estas guías antes de trabajar en tareas relacionadas:

- [Páginas, rutas dinámicas y middleware](https://docs.astro.build/en/guides/routing/)
- [Componentes Astro](https://docs.astro.build/en/basics/astro-components/)
- [Componentes de frameworks (React, Vue, Svelte…)](https://docs.astro.build/en/guides/framework-components/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Estilos y Tailwind](https://docs.astro.build/en/guides/styling/)
- [Internacionalización](https://docs.astro.build/en/guides/internationalization/)

<!--
Nota para el mantenedor (no se carga en el contexto):
CLAUDE.md es contexto, no aplicación forzada. Para garantizar que la regla
de "nunca borrar la base de datos" se cumpla siempre, considera además un
PreToolUse hook o restringir los permisos del rol de Supabase que usa
Claude Code, en vez de depender solo de esta instrucción.
-->
