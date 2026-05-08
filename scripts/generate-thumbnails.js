#!/usr/bin/env node

/**
 * Script para generar thumbnails de las texturas diffuse
 * Uso: node scripts/generate-thumbnails.js [modelId]
 *
 * Si no se especifica modelId, procesa todos los modelos
 * Las texturas input y output están en public/textures/
 */

import sharp from 'sharp'
import { readdir, readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const MODELS_DIR = join(__dirname, '../public/models')
const TEXTURES_DIR = join(__dirname, '../public/textures')
const THUMB_SIZE = 128
const THUMB_QUALITY = 85

async function processModel(modelId) {
  console.log(`\n📦 Procesando modelo: ${modelId}`)

  const modelDir = join(MODELS_DIR, modelId)

  // Leer config.json
  let config
  try {
    const configPath = join(modelDir, 'config.json')
    const configData = await readFile(configPath, 'utf-8')
    config = JSON.parse(configData)
  } catch (error) {
    console.error(`  ❌ Error leyendo config.json: ${error.message}`)
    return
  }

  const format = config.textures?.format || 'webp'

  // Obtener todas las variantes de color de todos los grupos
  const colorVariants = new Set()

  if (config.textures?.Diffuse?.groups) {
    for (const group of config.textures.Diffuse.groups) {
      if (group.mode === 'tint') {
        // En modo tint, solo procesamos la baseTexture
        if (group.baseTexture) {
          colorVariants.add(group.baseTexture)
        }
      } else {
        // En modo texture, procesamos todas las variantes
        if (group.variants) {
          Object.values(group.variants).forEach(value => {
            if (value) colorVariants.add(value)
          })
        }
      }
    }
  }

  if (colorVariants.size === 0) {
    console.log('  ⚠️  No hay variantes de color para procesar')
    return
  }

  console.log(`  🎨 Variantes encontradas: ${colorVariants.size}`)

  let processed = 0
  let skipped = 0
  let errors = 0

  // Procesar cada variante
  for (const colorValue of colorVariants) {
    const inputFile = join(TEXTURES_DIR, `texture_diffuse_${colorValue}.${format}`)
    const outputFile = join(TEXTURES_DIR, `texture_diffuse_${colorValue}_thumb.${format}`)

    try {
      await sharp(inputFile)
        .resize(THUMB_SIZE, THUMB_SIZE, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: THUMB_QUALITY })
        .toFile(outputFile)

      processed++
      process.stdout.write('.')
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`\n  ⚠️  Textura no encontrada: texture_diffuse_${colorValue}.${format}`)
        skipped++
      } else {
        console.log(`\n  ❌ Error procesando ${colorValue}: ${error.message}`)
        errors++
      }
    }
  }

  console.log(`\n  ✅ Procesadas: ${processed} | ⚠️  Omitidas: ${skipped} | ❌ Errores: ${errors}`)
}

async function main() {
  console.log('🖼️  Generador de Thumbnails\n')

  const targetModel = process.argv[2]

  if (targetModel) {
    // Procesar un modelo específico
    await processModel(targetModel)
  } else {
    // Procesar todos los modelos
    const models = await readdir(MODELS_DIR, { withFileTypes: true })

    for (const model of models) {
      if (model.isDirectory()) {
        await processModel(model.name)
      }
    }
  }

  console.log('\n✨ Proceso completado\n')
}

main().catch(console.error)
