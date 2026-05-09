# Prefabricados Duero — Ambient Configurator

Configurador y visualizador de ambientes de pavimento exterior para Prefabricados Duero. Permite al usuario explorar fotografías de ambientes reales, seleccionar zonas clicables, elegir modelo y color de producto, y ver el resultado con slider antes/después y descarga.

**Stack:** Vite 8 (Rolldown/Oxc) + React 19 — integrado en WordPress como plugin shortcode.

---

## Características

- **6 ambientes** seleccionables (adoquines, baldosas, bloques, baldosa técnica)
- **Detección de zona clicable** mediante máscara de color en canvas oculto (sin DOM)
- **Cursor dinámico** — cambia a `pointer` al pasar sobre la zona del pavimento
- **Hint de zona clicable** — al clicar fuera de zona se activa un tint generado en canvas sobre las zonas clicables; si `autohidePanel: true` el panel se cierra automáticamente en ese mismo click; configurable por zona en `config.json` (`hintZone`: `type`, `color`, `opacity`, `strokeWidth`, `animationTime`)
- **Auto-hint** — si el usuario no clica ninguna zona en `autoHint.timeToShow` segundos, la animación del hint se dispara automáticamente y se repite como `setInterval` hasta que el usuario interactúe con una zona; solo activo cuando el ambient tiene más de una zona; configurable por ambient en `config.json` (`autoHint: { timeToShow: 5 }`)
- **Panel de producto** — bottom sheet con scroll en móvil (siempre visible debajo del viewer), panel lateral en desktop con altura igual al viewer; posición izquierda/derecha configurable (`panelSelectorPosition`)
- **Apertura automática del panel** — si el ambient tiene una sola zona, el panel se abre automáticamente al cargar con animación de slide; el delay es configurable (`panelOpenDelay` en segundos)
- **Selección automática de primera variante** — al clicar un modelo, se auto-selecciona la primera variante del primer grupo y se carga el render correspondiente; re-clicar el mismo modelo o la zona no resetea la selección activa
- **2 modos de variante:** color (tint con CSS `mix-blend-mode: multiply`) y textura Fusión®
- **Botones de acción siempre visibles** — comparar y descargar están siempre habilitados; sin render seleccionado, el slider compara la imagen base consigo misma y la descarga recae sobre la imagen base
- **Selector de modelo con thumbnail** — cada modelo muestra una imagen cuadrada (`public/models/thumb_{id}.webp`) y su nombre, con el mismo layout que los botones de variante
- **Slider antes/después** — `clip-path` CSS + CSS custom property `--slider-x`, drag con Pointer Events + `setPointerCapture`, cero re-renders durante el arrastre
- **Descarga de imagen** — `OffscreenCanvas.convertToBlob`, fallback `toBlob` para iOS Safari
- **Plugin WordPress** — shortcode `[pct_ambient_viewer ambient="adoquines"]`
- **Generador de thumbnails** — script `sharp` que lee `config.json` y procesa texturas fuente

---

## Estructura del proyecto

```
PD-MOODBOARDS/
├── public/
│   ├── config.json                   ← configuración de ambientes, zonas, modelos y variantes
│   ├── ambients/
│   │   └── {ambientId}/
│   │       ├── base.webp             ← fotografía base del ambiente (sin producto)
│   │       ├── mask.webp             ← máscara para detección de click
│   │       └── renders/
│   │           └── {modelId}__{variantId}.webp   ← imagen completa con producto colocado
│   ├── textures/
│   │   └── thumb_{variantId}.webp    ← thumbnails 128×128 para los botones de variante
│   └── models/
│       └── thumb_{modelId}.webp      ← thumbnails 128×128 para los botones de modelo
├── src/
│   ├── App.jsx                       ← estado global, switcher de ambientes, composición
│   ├── hooks/
│   │   ├── useAmbientConfig.js       ← fetch de config.json
│   │   ├── useMaskDetection.js       ← canvas oculto + detección de zona por pixel
│   │   ├── useRenderLoader.js        ← preload de imagen de render
│   │   ├── useBeforeAfter.js         ← handlers del slider drag (CSS custom property, sin re-renders)
│   │   └── useZoneHintMask.js        ← genera imagen de tint para hint de zona (canvas off-screen)
│   ├── modules/
│   │   ├── AmbientViewer/            ← visor de imagen + acciones
│   │   ├── ProductPanel/             ← panel con ModelSelector, GroupSelector, VariantButton
│   │   ├── Slider/BeforeAfterSlider  ← slider CSS clip-path antes/después
│   │   └── Download/useDownload.js   ← descarga de render como JPEG
│   ├── ui/
│   │   ├── IconButton.jsx            ← botón redondo con icono Lucide + Radix Tooltip (negro, flecha, Portal)
│   │   └── Spinner.jsx               ← spinner SVG
│   └── utils/
│       ├── baseUrl.js                ← lee window.pdMoodboardConfig.baseUrl (WP) o '/'
│       ├── buildPaths.js             ← buildRenderPath, buildBasePath, buildMaskPath, buildThumbPath, buildModelThumbPath
│       ├── colorUtils.js             ← colorDistance, isColorMatch (para máscara)
│       ├── isIOSSafari.js
│       └── isTouch.js
├── scripts/
│   └── generate-thumbnails.js        ← genera public/textures/thumb_*.webp desde src-assets/
└── src-assets/
    └── textures/                     ← texturas fuente (.gitignore) — input del script de thumbnails
```

---

## Assets — Convenciones de nomenclatura

### Imágenes de ambiente

| Archivo | Ruta | Descripción |
|---|---|---|
| Base | `public/ambients/{id}/base.webp` | Fotografía sin producto (1920×1080 recomendado) |
| Máscara | `public/ambients/{id}/mask.webp` | Negra = clicable, blanca = no clicable |
| Render | `public/ambients/{id}/renders/{modelId}__{variantId}.webp` | Fotografía completa con producto colocado |
| Thumb modelo | `public/models/thumb_{modelId}.webp` | Thumbnail 128×128 para el botón de modelo en el panel |

**Separador de render:** doble guion bajo `__` entre `modelId` y `variantId` (nunca aparece en los IDs).

**Convención de máscara:**
- **Negro `(0,0,0)`** → zona clicable (pavimento / muro)
- **Blanco `(255,255,255)`** → zona no clicable (edificios, cielo, vegetación)
- Exportar sin anti-aliasing en los bordes para evitar falsos positivos
- Multi-zona futura: colores RGB distintos por zona (`[255,0,0]`, `[0,255,0]`, etc.)

### Thumbnails

- Ruta: `public/textures/thumb_{variantId}.webp`
- Tamaño: 128×128 px
- Generados por: `npm run thumbs`
- Fuente: `src-assets/textures/{variantId}.webp` (no versionado en git)

---

## `public/config.json`

Define todos los ambientes, zonas, modelos y variantes de la app.

```json
{
  "ambients": [
    {
      "id": "adoquines",
      "name": "Adoquines",
      "base": "ambients/adoquines/base.webp",
      "panelSelectorPosition": "right",
      "panelOpenDelay": 1,
      "autoHint": { "timeToShow": 5 },
      "zones": [
        {
          "id": "z1",
          "maskColor": [0, 0, 0],
          "label": "Pavimento",
          "mask": "ambients/adoquines/mask.webp",
          "hintZone": { "type": "layer", "color": "ffffff", "opacity": 0.7, "strokeWidth": 3, "animationTime": 500 },
          "models": [
            {
              "id": "adoquin_toro_20x10",
              "name": "Adoquín Toro 20×10",
              "model_image": "thumb_adoquin_toro_20x10.webp",
              "groups": [
                {
                  "name": "Color",
                  "mode": "tint",
                  "baseTexture": "blanco",
                  "variants": [
                    { "id": "blanco", "name": "Blanco", "value": "" },
                    { "id": "rojo",   "name": "Rojo",   "value": "f1a99f" }
                  ]
                },
                {
                  "name": "Fusión®",
                  "mode": "texture",
                  "variants": [
                    { "id": "fusion_jupiter", "name": "Jupiter" }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Campos de config.json

| Campo | Tipo | Descripción |
|---|---|---|
| `ambient.id` | `string` | ID kebab-case del ambiente (usado en rutas de assets y shortcode) |
| `ambient.base` | `string` | Ruta relativa a la imagen base |
| `zone.maskColor` | `[r,g,b]` | Color RGB de la zona en la máscara (negro = `[0,0,0]`) |
| `zone.mask` | `string` | Ruta relativa al archivo de máscara |
| `group.mode` | `"tint"` \| `"texture"` | Modo de visualización de variantes |
| `group.baseTexture` | `string` | ID de variante a usar como textura base en modo `tint` |
| `variant.value` | `string` | Hex sin `#` del color tint (vacío = sin tint, textura natural) |
| `zone.hintZone` | `object` | Configuración del hint de zona clicable (opcional; si ausente se usan defaults) |
| `zone.hintZone.type` | `"layer"` \| `"stroke"` | Modo de visualización: capa de color sobre la zona (`layer`) o borde exterior (`stroke`). Por defecto `layer` |
| `zone.hintZone.color` | `string` | Hex sin `#` del color del hint (por defecto `ffffff`) |
| `zone.hintZone.opacity` | `number` | Opacidad del hint, de `0` a `1` (por defecto `0.7`) |
| `zone.hintZone.strokeWidth` | `number` | Grosor en píxeles del borde, solo para `type: "stroke"` (por defecto `3`) |
| `zone.hintZone.animationTime` | `number` | Milisegundos que permanece visible el hint antes de desvanecerse (por defecto `500`) |
| `ambient.autoHint` | `object` | Configuración del auto-hint (opcional). Si ausente, no hay auto-hint |
| `ambient.autoHint.timeToShow` | `number` | Segundos de inactividad antes de disparar el hint automáticamente; se repite como intervalo hasta que el usuario clica una zona. Solo activo cuando el ambient tiene más de una zona |
| `ambient.panelSelectorPosition` | `"right"` \| `"left"` | Posición del panel de producto en desktop. Por defecto `"right"`. Los botones de acción (comparar/descargar) se alinean en el lado opuesto automáticamente |
| `ambient.panelOpenDelay` | `number` | Segundos de espera antes de abrir el panel automáticamente cuando el ambient tiene una sola zona. Si se omite o es `0`, el panel aparece inmediatamente con su transición CSS |
| `ambient.autohidePanel` | `boolean` | Si es `true`, al clicar fuera de cualquier zona clicable (lo que dispara el hint) el panel de producto se oculta automáticamente. Por defecto `false` (panel permanece abierto) |
| `model.model_image` | `string` | Nombre del archivo de thumbnail del modelo (ej. `thumb_adoquin_toro_20x10.webp`), ubicado en `public/models/` |

### Modos de variante

**`mode: "tint"`** — todas las variantes comparten la misma textura base (`baseTexture`). El thumbnail muestra esa textura y un overlay `::after` con `mix-blend-mode: multiply` aplica el color `#value` sobre ella. Si `value` es vacío (`""`), se muestra la textura natural (color base).

**`mode: "texture"`** — cada variante tiene su propia textura. El thumbnail muestra `thumb_{variant.id}.webp`. No hay overlay de color.

---

## Comandos

```bash
npm run dev          # Servidor de desarrollo en localhost:5173
npm run build        # Build de producción en dist/
npm run build:wp     # Build + deploy al plugin WordPress local
npm run deploy:wp    # Solo rsync de dist/ y assets al plugin WP (sin rebuild)
npm run thumbs       # Genera thumbnails 128×128 desde src-assets/textures/
npm run lint         # ESLint
npm run preview      # Preview del build de producción
```

---

## Generación de thumbnails

El script lee `public/config.json`, recoge todos los `variantId` únicos de cada grupo y genera los thumbnails con `sharp`.

**Fuente:** `src-assets/textures/{variantId}.webp` (no versionado en git)  
**Salida:** `public/textures/thumb_{variantId}.webp` (128×128, calidad 85%)

```bash
npm run thumbs
```

Para modo `tint`, el script recoge el `baseTexture` del grupo (no los `id` de cada variante), ya que todas comparten la misma imagen base. Para modo `texture`, recoge cada `variant.id`.

---

## Arquitectura técnica

### Hint de zona clicable (`.zone-hint`)

Cuando el usuario clica en un área sin zona asignada, se activa `.zone-hint`: una imagen generada en canvas que aplica un tint de color exclusivamente sobre los píxeles negros (zona clicable) de la `mask.webp`, dejando el resto completamente transparente. El resultado es un overlay que resalta solo la zona clicable sin afectar el resto de la imagen. Se desvanece tras `animationTime` ms.

El hook `useZoneHintMask(maskUrl, tintHex, opacity, type, strokeWidth)` procesa la máscara una sola vez por ambient (canvas off-screen), devuelve un Object URL y lo revoca al desmontar. Si la zona no tiene `hintZone`, el hint se muestra con los valores por defecto (`ffffff` / `0.7` / `layer` / `500 ms`).

- **`type: "layer"`** — pinta con el color los píxeles negros (clickables) de la máscara, dejando el resto transparente.
- **`type: "stroke"`** — detecta los píxeles negros fronterizos (donde negro toca blanco), los dilata hacia el exterior mediante dos pasadas separables (horizontal + vertical), y pinta solo esa franja de `strokeWidth` px en los píxeles blancos adyacentes. El interior de la zona queda transparente.

### Detección de zona clicable (`useMaskDetection`)

Carga la máscara en un canvas fuera del DOM (`document.createElement('canvas')`). En cada movimiento o click del ratón, escala las coordenadas del cliente al espacio de píxeles de la imagen original y llama a `getImageData(x, y, 1, 1)` para leer el color. Si el color coincide con el `maskColor` de alguna zona (distancia euclidiana < 40), devuelve el `id` de esa zona.

### Visualización de render

No se usa `mask-image` CSS. La imagen de render es una fotografía completa del ambiente con el producto ya colocado. Se superpone sobre la imagen base con `opacity: 0 → 1` (fade-in). Base y render son `<img>` absolutas con `object-fit: cover`.

### Slider antes/después (`BeforeAfterSlider`)

Sin canvas. Las dos imágenes ya existen como `<img>` absolutas en el DOM; el slider solo controla qué parte de cada una es visible:

- `ambient-base` muestra la imagen anterior (o la foto original en la primera selección)
- `ambient-selected-render` con `clip-path: inset(0 0 0 var(--slider-x, 50%))` revela el render actual por la derecha
- El handle `div.slider-handle` escribe directamente `containerRef.current.style.setProperty('--slider-x', x + '%')` en cada `pointermove` — sin `setState`, sin re-renders React
- El drag usa Pointer Events con `setPointerCapture` (mouse y touch unificados)

**Base deslizante (rolling base):** La foto original actúa como base hasta la segunda selección confirmada. A partir de la segunda, `ambient-base` muestra la penúltima selección, de modo que el slider compara siempre penúltima vs última.

### Descarga (`useDownload`)

Siempre descarga el render de la selección actual como JPEG (calidad 0.92). Usa `OffscreenCanvas.convertToBlob` en navegadores modernos y `HTMLCanvasElement.toBlob` como fallback para iOS Safari.

---

## Integración WordPress

**Plugin:** `pct-ambientes-moodboards`  
**Shortcode:** `[pct_ambient_viewer ambient="adoquines"]`

El plugin lee `dist/index.html` (generado por Vite) con regex para hallar los archivos JS y CSS con hash. Inyecta `window.pdMoodboardConfig = { baseUrl: '...' }` mediante `wp_localize_script` para que la app construya las rutas de assets correctamente. Añade `type="module"` al tag `<script>` vía filtro `script_loader_tag`.

**Deploy al WP local:**

```bash
npm run build:wp
```

Sincroniza con rsync:
- `dist/` → `pct-ambientes-moodboards/dist/`
- `public/ambients/` → `pct-ambientes-moodboards/dist/ambients/`
- `public/textures/` → `pct-ambientes-moodboards/dist/textures/`
- `public/config.json` → `pct-ambientes-moodboards/dist/config.json`

---

## Build

Vite 8 con Rolldown y Oxc:

- **`drop: ['console', 'debugger']`** en producción (Oxc transform)
- Chunks separados para GSAP (`vendor-c`) y Radix UI (`vendor-d`)
- Todos los archivos con hash anónimo (`assets/[hash].js`, `assets/[hash].css`)

---

## Ambientes disponibles

| ID | Nombre | Assets |
|---|---|---|
| `adoquines` | Adoquines | base.webp + mask.webp |
| `baldosas-1` | Baldosas 1 | pendiente |
| `baldosas-2` | Baldosas 2 | pendiente |
| `bloques-1` | Bloques 1 | pendiente |
| `bloques-2` | Bloques 2 | pendiente |
| `baldosa-tecnica` | Baldosa Técnica | pendiente |
