# Prefabricados Duero — Ambient Configurator

Configurador y visualizador de ambientes de pavimento exterior para Prefabricados Duero. Permite al usuario explorar fotografías de ambientes reales, seleccionar zonas clicables, elegir modelo y color de producto, y ver el resultado con slider antes/después y descarga.

**Stack:** Vite 8 (Rolldown/Oxc) + React 19 — integrado en WordPress como plugin shortcode.

---

## Características

- **6 ambientes** seleccionables (adoquines, baldosas, bloques, baldosa técnica)
- **Detección de zona clicable** mediante máscara de color en canvas oculto (sin DOM)
- **Cursor dinámico** — cambia a `pointer` al pasar sobre la zona del pavimento
- **Panel de producto** — bottom sheet en móvil, panel lateral en desktop
- **2 modos de variante:** color (tint con CSS `mix-blend-mode: multiply`) y textura Fusión®
- **Slider antes/después** — canvas con clip, drag con Pointer Events + `setPointerCapture`
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
│   └── textures/
│       └── thumb_{variantId}.webp    ← thumbnails 128×128 para los botones UI
├── src/
│   ├── App.jsx                       ← estado global, switcher de ambientes, composición
│   ├── hooks/
│   │   ├── useAmbientConfig.js       ← fetch de config.json
│   │   ├── useMaskDetection.js       ← canvas oculto + detección de zona por pixel
│   │   ├── useRenderLoader.js        ← preload de imagen de render
│   │   └── useBeforeAfter.js         ← estado y handlers del slider drag
│   ├── modules/
│   │   ├── AmbientViewer/            ← visor de imagen + acciones
│   │   ├── ProductPanel/             ← panel con ModelSelector, GroupSelector, VariantButton
│   │   ├── Slider/BeforeAfterSlider  ← slider canvas antes/después
│   │   └── Download/useDownload.js   ← descarga de render como JPEG
│   ├── ui/
│   │   ├── IconButton.jsx            ← botón con icono Lucide + Radix Tooltip
│   │   └── Spinner.jsx               ← spinner SVG
│   └── utils/
│       ├── baseUrl.js                ← lee window.pdMoodboardConfig.baseUrl (WP) o '/'
│       ├── buildPaths.js             ← buildRenderPath, buildBasePath, buildMaskPath, buildThumbPath
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
      "zones": [
        {
          "id": "z1",
          "maskColor": [0, 0, 0],
          "label": "Pavimento",
          "mask": "ambients/adoquines/mask.webp",
          "models": [
            {
              "id": "adoquin_toro_20x10",
              "name": "Adoquín Toro 20×10",
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

### Detección de zona clicable (`useMaskDetection`)

Carga la máscara en un canvas fuera del DOM (`document.createElement('canvas')`). En cada movimiento o click del ratón, escala las coordenadas del cliente al espacio de píxeles de la imagen original y llama a `getImageData(x, y, 1, 1)` para leer el color. Si el color coincide con el `maskColor` de alguna zona (distancia euclidiana < 40), devuelve el `id` de esa zona.

### Visualización de render

No se usa `mask-image` CSS. La imagen de render es una fotografía completa del ambiente con el producto ya colocado. Se superpone sobre la imagen base con `opacity: 0 → 1` (fade-in). Base y render son `<img>` absolutas con `object-fit: cover`.

### Slider antes/después (`BeforeAfterSlider`)

Un `<canvas>` superpuesto cubre el viewer cuando el slider está activo. En cada frame:
1. `ctx.drawImage(base, 0, 0, W, H)` — imagen base completa
2. `ctx.save(); ctx.rect(px, 0, W - px, H); ctx.clip()` — recorte derecho
3. `ctx.drawImage(render, 0, 0, W, H)` — render en zona recortada
4. Línea divisoria blanca de 2px

El drag usa Pointer Events con `setPointerCapture` (mouse y touch unificados). `ResizeObserver` actualiza las dimensiones del canvas cuando el contenedor cambia de tamaño.

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
