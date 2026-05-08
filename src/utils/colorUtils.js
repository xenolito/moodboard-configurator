export const colorDistance = (r1, g1, b1, r2, g2, b2) =>
  Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)

export const isColorMatch = (r, g, b, targetColor, threshold = 40) =>
  colorDistance(r, g, b, ...targetColor) < threshold
