import blobs2 from 'blobs'

export interface BlobParams {
  seed: string
  complexity: number // 0-1
  contrast: number // 0-1
  color: string // hex color
}

export interface BlobOutput {
  svg: string
  seed: string
  params: BlobParams
}

/**
 * Generate decorative blob SVG using blobs library
 */
export function createBlob(params: BlobParams): BlobOutput {
  const { seed, complexity, contrast, color } = params
  
  const blobSvg = blobs2({
    seed,
    complexity: Math.floor(complexity * 10) + 3, // 3-13 range
    contrast: Math.floor(contrast * 10) + 3, // 3-13 range
    color,
    guides: false,
    size: 400,
  })
  
  return {
    svg: blobSvg as string,
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
