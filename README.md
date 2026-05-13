# Prefabricados Duero — Ambient Configurator

Configurador y visualizador de ambientes de pavimento exterior para Prefabricados Duero. Permite al usuario explorar fotografías de ambientes reales, seleccionar zonas clicables, elegir modelo y color de producto, y ver el resultado con slider antes/después y descarga.

**Stack:** Vite 8 (Rolldown/Oxc) + React 19 — integrado en WordPress como plugin shortcode.

---

## Características

- **6 ambientes** seleccionables (adoquines, baldosas, bloques, baldosa técnica)
- **Detección de zona clicable** mediante máscara de color en canvas oculto (sin DOM)
- **Cursor dinámico** — cambia a `pointer` al pasar sobre la zona del pavimento
- **Hint de zona clicable** — al clicar fuera de zona se activa un tint generado en canvas sobre las zonas clicables; si el ambient tiene varias zonas se muestran secuencialmente una tras otra con el delay configurable (`hintSequenceDelay`); si `autohidePanel: true` el panel se cierra automáticamente en ese mismo click; configurable por zona en `config.json` (`hintZone`: `type`, `color`, `opacity`, `strokeWidth`, `animationTime`)
- **Auto-hint** — si el usuario no clica ninguna zona en `autoHint.timeToShow` segundos, la secuencia de hints se dispara automáticamente y se repite como `setInterval`; el timer se detiene permanentemente en cuanto el usuario clica una zona o selecciona un modelo/variante en el panel; activo cuando el ambient tiene zonas con `hintZone` definido; configurable por ambient en `config.json` (`autoHint: { timeToShow: 5 }`)
- **Botón volver** — muestra un botón `←` en la esquina inferior izquierda del viewer; la URL de destino se configura con `data-back-url` en el div raíz (`#ambient_viewer`) o con `backUrl` en el objeto ambient de `config.json`; si no se configura, el botón no aparece
- **Panel de producto** — bottom sheet con scroll en móvil (siempre visible debajo del viewer), panel lateral en desktop con altura igual al viewer; posición izquierda/derecha configurable (`panelSelectorPosition`)
- **Botón toggle siempre visible** — el botón de mostrar/ocultar el panel sobresale del borde del panel (izquierdo en panel-right, derecho en panel-left) y permanece siempre visible e interactivo; el icono cambia de dirección según posición y estado del panel
- **Apertura automática del panel** — si el ambient tiene una sola zona, el panel se abre automáticamente al cargar con animación de slide; el delay es configurable (`panelOpenDelay` en segundos); con múltiples zonas el panel nunca se abre automáticamente — el usuario debe clicar una zona primero
- **Selección automática de primera variante** — al clicar un modelo, se auto-selecciona la primera variante del primer grupo y se carga el render correspondiente; re-clicar el mismo modelo o la zona no resetea la selección activa
- **Pre-selección automática en zonas de modelo único** — cuando una zona tiene exactamente 1 modelo, ese modelo queda seleccionado automáticamente al abrir la zona; el selector de modelo se muestra pre-marcado y los grupos de color aparecen desplegados directamente
- **2 modos de variante:** color (tint con CSS `mix-blend-mode: multiply`) y textura Fusión®
- **Botones de acción siempre visibles** — comparar y descargar están siempre habilitados; sin render seleccionado, el slider compara la imagen base consigo misma y la descarga recae sobre la imagen base
- **Selector de modelo con thumbnail** — cada modelo muestra una imagen cuadrada (`public/models/thumb_{id}.webp`) y su nombre, con el mismo layout que los botones de variante
- **Slider antes/después con compare independiente** — al activar el compare el panel se oculta; cada mitad (izquierda/derecha) tiene un estado de modelo y color propio; clicar en una zona del viewer en compare abre el panel para esa mitad (el slot activo — «Antes»/«Después» — cambia según dónde se clicó respecto al handle del slider); clicar fuera de zona siempre oculta el panel; el cursor cambia a `pointer` sobre zonas clicables en ambas mitades; `baseRender` define el render inicial del lado izquierdo y el fondo del viewer (sustituye completamente a `base.webp` — si `baseRender` está presente, `base.webp` nunca se muestra); al desactivar compare solo el lado derecho permanece visible
- **Modal de información del producto** — botón «ⓘ» en las acciones del viewer abre una modal nativa `<dialog>` con los datos del modelo y variante actualmente visible. En modo zona única muestra nombre de zona, modelo y variante seleccionada; en ambients multi-zona (combined renders) muestra una fila por cada zona; en modo compare muestra dos columnas «Antes» / «Después» con la información de cada lado. Si el modelo tiene el campo `description` en `config.json` (HTML opcional), se muestra sanitizado debajo de los datos de variante. El botón se deshabilita automáticamente cuando no hay render cargado. La modal se cierra con el botón ×, tecla Escape o click en el backdrop.
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
│   │   ├── useRenderLoader.js        ← preload de imagen de render; console.warn si falla la carga
│   │   ├── useBeforeAfter.js         ← handlers del slider drag (CSS custom property, sin re-renders)
│   │   └── useZoneHintMasks.js       ← genera N blob URLs de hint (una por zona) cargando la máscara una sola vez
│   ├── modules/
│   │   ├── AmbientViewer/            ← visor de imagen + acciones
│   │   ├── ProductPanel/             ← panel con ModelSelector, GroupSelector, VariantButton
│   │   ├── Slider/BeforeAfterSlider  ← slider CSS clip-path antes/después
│   │   ├── InfoModal/InfoModal.jsx   ← modal <dialog> con info del modelo/variante activo
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
| Máscara | `public/ambients/{id}/mask.webp` | Máscara de zonas compartida por todas las zonas del ambient |
| Render (zona única) | `public/ambients/{id}/renders/{modelId}__{variantId}.webp` | Fotografía completa con producto colocado |
| Render (multi-zona combinado) | `public/ambients/{id}/renders/{prefix1}-{v1}--{prefix2}-{v2}--...webp` | Render con todas las zonas combinadas; el orden de los segmentos sigue el orden del array `zones` en `config.json` |
| Thumb modelo | `public/models/thumb_{modelId}.webp` | Thumbnail 128×128 para el botón de modelo en el panel |

**Separador de render (zona única):** doble guion bajo `__` entre `modelId` y `variantId` (nunca aparece en los IDs).

**Renders combinados (`combinedRenders: true`):** cada segmento es `{model.renderPrefix}-{variantId}`, separados por `--`. Ejemplo con 3 zonas: `botones-rojo--guia-rojo--pastillas-rojo.webp`. El campo `renderPrefix` debe declararse en cada modelo del ambient; si una zona tiene varios modelos, cada uno puede tener un prefijo distinto.

**Convención de máscara:**
- Cada zona se identifica por un color RGB único declarado en `zone.maskColor`; la detección usa tolerancia ±32 para cada canal
- **Negro `(0,0,0)`** → uso más habitual (zona única de pavimento/muro)
- **Multi-zona:** colores RGB distintos por zona (ej. `[0,0,0]`, `[255,0,0]`, `[0,255,0]`)
- **Blanco `(255,255,255)`** → no clicable (edificios, cielo, vegetación)
- Exportar sin anti-aliasing en los bordes para evitar falsos positivos

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
      "mask": "ambients/adoquines/mask.webp",
      "autoHint": { "timeToShow": 5 },
      "autohidePanel": true,
      "panelSelectorPosition": "right",
      "panelOpenDelay": 1,
      "hintSequenceDelay": 300,
      "baseRender": { "modelId": "adoquin_toro_20x10", "variantId": "rojo" },
      "zones": [
        {
          "id": "z1",
          "maskColor": [0, 0, 0],
          "label": "Pavimento",
          "hintZone": { "type": "layer", "color": "ffffff", "opacity": 0.5, "strokeWidth": 3, "animationTime": 500 },
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
                    { "id": "rojo",   "name": "Rojo",   "value": "f1a99f" },
                    { "id": "blanco", "name": "Blanco", "value": "" }
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
| `ambient.mask` | `string` | Ruta relativa al archivo de máscara; compartida por todas las zonas del ambient |
| `ambient.backUrl` | `string` | URL de destino del botón volver; alternativa a `data-back-url` en el div raíz. Si se omite y tampoco hay `data-back-url`, el botón no se muestra |
| `ambient.baseRender` | `object` \| `array` | Render inicial que actúa como fondo del viewer y lado izquierdo del compare. Cuando está definido, reemplaza completamente a `base.webp` (este no se muestra en ningún caso). En ambients de zona única: objeto `{ modelId, groupName, variantId }` — define solo el slot izquierdo del compare. En ambients con `combinedRenders: true`: array de objetos, uno por zona — define además el estado inicial del panel y la selección visible en el viewer (modelo y variante pre-seleccionados) |
| `ambient.baseRender.modelId` | `string` | (zona única) ID del modelo base |
| `ambient.baseRender.variantId` | `string` | (zona única) ID de la variante base |
| `ambient.baseRender[].zoneId` | `string` | (multi-zona) ID de la zona a la que corresponde esta entrada |
| `ambient.baseRender[].modelId` | `string` | (multi-zona) ID del modelo base para esa zona |
| `ambient.baseRender[].variantId` | `string` | (multi-zona) ID de la variante base para esa zona |
| `ambient.hintSequenceDelay` | `number` | Milisegundos de pausa entre hints consecutivos en ambients multi-zona (por defecto `300`) |
| `ambient.autoHint` | `object` | Configuración del auto-hint (opcional). Si ausente, no hay auto-hint |
| `ambient.autoHint.timeToShow` | `number` | Segundos de inactividad antes de disparar la secuencia de hints automáticamente; se repite como intervalo hasta que el usuario clica una zona |
| `ambient.autohidePanel` | `boolean` | Si es `true`, al clicar fuera de cualquier zona clicable (lo que dispara el hint) el panel de producto se oculta automáticamente. Por defecto `false` |
| `ambient.panelSelectorPosition` | `"right"` \| `"left"` | Posición del panel de producto en desktop. Por defecto `"right"`. Los botones de acción (comparar/descargar) se alinean en el lado opuesto automáticamente |
| `ambient.panelOpenDelay` | `number` | Segundos de espera antes de abrir el panel automáticamente. Solo tiene efecto cuando el ambient tiene una sola zona; con múltiples zonas se ignora. Si se omite o es `0`, el panel aparece inmediatamente con su transición CSS |
| `zone.maskColor` | `[r,g,b]` | Color RGB de la zona en la máscara. La detección usa tolerancia ±32 por canal |
| `model.renderPrefix` | `string` | Prefijo del segmento de este modelo en el filename del render combinado (ej. `"botones"`). Obligatorio en cada modelo cuando el ambient tiene `combinedRenders: true` |
| `zone.hintZone` | `object` | Configuración del hint de zona clicable (opcional; si ausente no se genera hint para esa zona) |
| `zone.hintZone.type` | `"invert"` \| `"layer"` \| `"stroke"` | Modo de visualización. `"invert"` invierte los colores de la imagen que hay debajo (recomendado). `"layer"` aplica una capa de color plano sobre la zona. `"stroke"` pinta solo el borde exterior. Por defecto `"layer"` |
| `zone.hintZone.color` | `string` | Hex sin `#` del color del hint. Solo para `type: "layer"` y `"stroke"` (por defecto `ffffff`) |
| `zone.hintZone.opacity` | `number` | Opacidad del hint, de `0` a `1`. Solo para `type: "layer"` y `"stroke"` (por defecto `0.7`) |
| `zone.hintZone.strokeWidth` | `number` | Grosor en píxeles del borde, solo para `type: "stroke"` (por defecto `3`) |
| `zone.hintZone.animationTime` | `number` | Milisegundos que permanece visible el hint antes de desvanecerse (por defecto `500`) |
| `group.mode` | `"tint"` \| `"texture"` | Modo de visualización de variantes |
| `group.baseTexture` | `string` | ID de variante a usar como textura base en modo `tint` |
| `variant.value` | `string` | Hex sin `#` del color tint (vacío = sin tint, textura natural) |
| `model.model_image` | `string` | Nombre del archivo de thumbnail del modelo (ej. `thumb_adoquin_toro_20x10.webp`), ubicado en `public/models/` |
| `model.description` | `string` | (Opcional) Texto HTML adicional del modelo que se muestra en la modal de información. Se sanitiza con DOMPurify antes de renderizar. Etiquetas permitidas: `p`, `br`, `b`, `i`, `em`, `strong`, `ul`, `ol`, `li`, `a` |
| `model_image_variant` | `string` | (Opcional, global) Sufijo de variante que se inserta en el nombre de archivo de los thumbnails de modelo. Si está definido con valor `"v2"`, el archivo `thumb_baldosa_aliste_20x20.webp` se solicita como `thumb_v2_baldosa_aliste_20x20.webp`. Si no está presente, los thumbnails se cargan con su nombre original |

### Variaciones con bisel

Los modelos cuyo `config.json` en PD-3D_VISUALIZER incluye `geometry.hasBisel: true` generan una entrada adicional en la lista de modelos con el sufijo `_bisel` en el `id`, colocada inmediatamente después del modelo base. Los grupos de la variación bisel incluyen sólo los grupos cuyo `availableFor` es `"both"` o está ausente; los grupos con `availableFor: "sin_bisel"` se excluyen (ej. el grupo Fusión® no está disponible para bisel).

Modelos con variación bisel actualmente: `adoquin_toro_20x10`, `adoquin_alcanices_12x12`, `adoquin_castellano_18-12-9x12`, `adoquin_guarena_24x12`.

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

Cuando el usuario clica en un área sin zona asignada, se activa la secuencia de hints: para cada zona con `hintZone` configurado se genera una imagen canvas que aplica un tint de color exclusivamente sobre los píxeles de esa zona en la `mask.webp`, dejando el resto transparente. Los hints se muestran uno tras otro: cada uno espera `animationTime` ms visible, se apaga, espera `hintSequenceDelay` ms, y pasa al siguiente.

El hook `useZoneHintMasks(maskUrl, zones)` carga la máscara **una sola vez** por ambient y genera N blob URLs (uno por zona) en paralelo via `Promise.all`. La detección del color de zona usa `isZonePixel` con tolerancia ±32 por canal RGB, lo que permite máscaras multi-color (negro, rojo, verde, etc.). Los blob URLs se revocan al desmontar o al cambiar el ambient.

- **`type: "invert"`** — genera un overlay blanco opaco sobre los píxeles de la zona; CSS `mix-blend-mode: difference` invierte en tiempo real los colores de la imagen base subyacente. No requiere `color` ni `opacity`.
- **`type: "layer"`** — pinta con el color y opacidad configurados los píxeles de la zona, dejando el resto transparente.
- **`type: "stroke"`** — detecta los píxeles fronterizos (donde la zona toca el exterior), los dilata mediante dos pasadas separables (horizontal + vertical), y pinta solo esa franja de `strokeWidth` px. El interior de la zona queda transparente.

### Detección de zona clicable (`useMaskDetection`)

Carga la máscara en un canvas fuera del DOM (`document.createElement('canvas')`). En cada movimiento o click del ratón, escala las coordenadas del cliente al espacio de píxeles de la imagen original teniendo en cuenta `object-fit: cover; object-position: bottom center` (escala proporcional + alineación inferior centrada), y llama a `getImageData(x, y, 1, 1)` para leer el color. Si el color coincide con el `maskColor` de alguna zona (distancia euclidiana < 40), devuelve el `id` de esa zona.

Si un render falla al cargar (archivo inexistente), `useRenderLoader` emite `console.warn` con la URL intentada para facilitar la depuración, sin romper la UI.

### Visualización de render

No se usa `mask-image` CSS. La imagen de render es una fotografía completa del ambiente con el producto ya colocado. Se superpone sobre la imagen base con `opacity: 0 → 1` (fade-in). Base y render son `<img>` absolutas con `object-fit: cover`.

### Slider antes/después (`BeforeAfterSlider`)

Sin canvas. Las dos imágenes ya existen como `<img>` absolutas en el DOM; el slider solo controla qué parte de cada una es visible:

- `ambient-base` (lado izquierdo) muestra el render del slot izquierdo si existe, si no la foto original
- `ambient-selected-render` con `clip-path: inset(0 0 0 var(--slider-x, 50%))` revela el render del slot derecho
- El handle `div.slider-handle` escribe directamente `containerRef.current.style.setProperty('--slider-x', x + '%')` en cada `pointermove` — sin `setState`, sin re-renders React
- El drag usa Pointer Events con `setPointerCapture` (mouse y touch unificados); el `click` del handle no propaga al container para evitar disparar la lógica de slot/zona

**Slots independientes en compare:** `App.jsx` instancia `useRenderLoader` dos veces en paralelo — una para el slot derecho (`selectedModelId`/`selectedVariant`) y otra para el slot izquierdo (`leftModelId`/`leftVariant`). El estado de cada slot persiste al desactivar y reactivar compare dentro del mismo ambient; se resetea al cambiar de ambient.

**Lógica de slot al clicar en compare:** el slot que se activa (izquierda/derecha) se determina comparando la posición X del click con el valor actual de `--slider-x` (no un 50% fijo), por lo que funciona correctamente con el handle en cualquier posición.

**Base deslizante (rolling base, modo normal):** La foto original actúa como base hasta la segunda selección confirmada. A partir de la segunda, `ambient-base` muestra la penúltima selección, de modo que el slider compara siempre penúltima vs última.

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
| `adoquines` | Adoquines | base.webp + mask.webp + renders completos; 1 zona |
| `baldosas-1` | Baldosas 1 | base.webp + mask.webp; renders pendientes |
| `baldosas-2` | Baldosas 2 | base.webp + mask.webp; renders pendientes |
| `bloques-1` | Bloques 1 | base.webp + mask.webp; renders pendientes |
| `bloques-2` | Bloques 2 | base.webp + mask.webp; renders pendientes |
| `baldosa-tecnica` | Baldosa Técnica | base.webp + mask.webp; 3 zonas (Pastillas, Botones, Direccional); renders pendientes |
