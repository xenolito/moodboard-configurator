#!/usr/bin/env node

/**
 * Genera thumbnails 128×128 de las texturas de tile para los botones UI del configurador.
 *
 * Input:  src-assets/textures/{variantId}.webp   (texturas fuente del 3D visualizer)
 * Output: public/textures/thumb_{variantId}.webp
 *
 * Uso: node scripts/generate-thumbnails.js
 */

import sharp from 'sharp'
import { readFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT        = join(__dirname, '..')
const CONFIG_FILE = join(ROOT, 'public/config.json')
const INPUT_DIR   = join(ROOT, 'src-assets/textures')
const OUTPUT_DIR  = join(ROOT, 'public/textures')
const THUMB_SIZE  = 128
const QUALITY     = 85

async function collectTextureIds(config) {
  const ids = new Set()
  for (const ambient of config.ambients) {
    for (const zone of ambient.zones) {
      for (const model of (zone.models ?? [])) {
        for (const group of (model.groups ?? [])) {
          if (group.mode === 'tint') {
            if (group.baseTexture) ids.add(group.baseTexture)
          } else {
            for (const variant of (group.variants ?? [])) {
              if (variant.id) ids.add(variant.id)
            }
          }
        }
      }
    }
  }
  return ids
}

async function main() {
  console.log('🖼️  Generador de Thumbnails — Moodboard Configurator\n')

  if (!existsSync(CONFIG_FILE)) {
    console.error('❌ No se encontró public/config.json')
    process.exit(1)
  }

  const config = JSON.parse(await readFile(CONFIG_FILE, 'utf-8'))
  const ids    = await collectTextureIds(config)

  if (ids.size === 0) {
    console.log('⚠️  No hay texturas para procesar en config.json')
    return
  }

  await mkdir(OUTPUT_DIR, { recursive: true })
  console.log(`🎨 Texturas únicas encontradas: ${ids.size}\n`)

  let ok = 0, skipped = 0, errors = 0

  for (const id of ids) {
    const inputFile  = join(INPUT_DIR,  `${id}.webp`)
    const outputFile = join(OUTPUT_DIR, `thumb_${id}.webp`)

    if (!existsSync(inputFile)) {
      console.log(`  ⚠️  No encontrada: src-assets/textures/${id}.webp`)
      skipped++
      continue
    }

    try {
      await sharp(inputFile)
        .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover', position: 'center' })
        .webp({ quality: QUALITY })
        .toFile(outputFile)
      process.stdout.write('.')
      ok++
    } catch (err) {
      console.log(`\n  ❌ Error procesando ${id}: ${err.message}`)
      errors++
    }
  }

  console.log(`\n\n✅ Generadas: ${ok} | ⚠️  Omitidas: ${skipped} | ❌ Errores: ${errors}`)
  console.log('\n✨ Proceso completado\n')
}

main().catch(console.error)
