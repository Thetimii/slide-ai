import { svgPath } from 'blobs/v2'

export interface BlobParams {
  seed: string
  complexity: number // 0-1 (maps to extraPoints)
  contrast: number // 0-1 (maps to randomness)
  color: string // hex color
}

export interface BlobOutput {
  svg: string
  seed: string
  params: BlobParams
}

/**
 * Generate decorative blob SVG using blobs v2 library
 */
export function createBlob(params: BlobParams): BlobOutput {
  const { seed, complexity, contrast, color } = params
  
  // Ensure values are in valid range (0, 1]
  const validComplexity = Math.max(0.1, Math.min(1, complexity))
  const validContrast = Math.max(0.1, Math.min(1, contrast))
  
  // Map to v2 API parameters
  // extraPoints: 1-20 (more points = more complex)
  // randomness: 0-10 (higher = more variation)
  const extraPoints = Math.floor(validComplexity * 19) + 1 // 1-20
  const randomness = validContrast * 10 // 0-10
  
  const path = svgPath({
    seed,
    extraPoints,
    randomness,
    size: 400,
  })
  
  // Wrap in SVG with color
  const svg = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
    <path d="${path}" fill="${color}"/>
  </svg>`
  
  return {
    svg,
    seed,
    params,
  }
}

/**
 * Generate random blob with sensible defaults
 */
export function generateRandomBlob(color?: string): BlobOutput {
  const seeds = [
    'calmwave',
    'softflow',
    'organicshape',
    'fluidform',
    'gentlecurve',
    'smoothblob',
    'naturalform',
    'abstractshape',
  ]
  
  return createBlob({
    seed: seeds[Math.floor(Math.random() * seeds.length)],
    complexity: 0.4 + Math.random() * 0.4, // 0.4-0.8
    contrast: 0.3 + Math.random() * 0.4, // 0.3-0.7
    color: color || '#EFB7C6',
  })
}
