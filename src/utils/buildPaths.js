import { getBaseUrl } from './baseUrl.js'

export const buildRenderPath  = (ambientId, modelId, variantId) =>
  `${getBaseUrl()}ambients/${ambientId}/renders/${modelId}__${variantId}.webp`

export const buildBasePath    = (ambientId) =>
  `${getBaseUrl()}ambients/${ambientId}/base.webp`

export const buildMaskPath    = (ambientId, maskFile) =>
  `${getBaseUrl()}${maskFile}`

export const buildThumbPath   = (variantId) =>
  `${getBaseUrl()}textures/thumb_${variantId}.webp`
