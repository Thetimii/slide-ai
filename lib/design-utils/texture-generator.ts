export interface TextureParams {
  type: 'grain' | 'noise' | 'dots'
  opacity: number // 0-1
  blendMode: 'overlay' | 'multiply' | 'screen'
}

export interface TextureOutput {
  dataUrl: string
  params: TextureParams
}

/**
 * Generate grain texture using canvas
 */
export function generateGrainTexture(
  width: number = 1600,
  height: number = 900,
  opacity: number = 0.2
): TextureOutput {
  if (typeof window === 'undefined') {
    // Server-side: return placeholder
    return {
      dataUrl: '',
      params: { type: 'grain', opacity, blendMode: 'overlay' },
    }
  }
  
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    return {
      dataUrl: '',
      params: { type: 'grain', opacity, blendMode: 'overlay' },
    }
  }
  
  const imageData = ctx.createImageData(width, height)
  const data = imageData.data
  
  // Generate grain pattern
  for (let i = 0; i < data.length; i += 4) {
    const value = Math.random() * 255
    data[i] = value // R
    data[i + 1] = value // G
    data[i + 2] = value // B
    data[i + 3] = opacity * 255 // A
  }
  
  ctx.putImageData(imageData, 0, 0)
  
  return {
    dataUrl: canvas.toDataURL('image/png'),
    params: { type: 'grain', opacity, blendMode: 'overlay' },
  }
}

/**
 * Generate noise texture
 */
export function generateNoiseTexture(
  width: number = 1600,
  height: number = 900,
  opacity: number = 0.15
): TextureOutput {
  if (typeof window === 'undefined') {
    return {
      dataUrl: '',
      params: { type: 'noise', opacity, blendMode: 'overlay' },
    }
  }
  
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    return {
      dataUrl: '',
      params: { type: 'noise', opacity, blendMode: 'overlay' },
    }
  }
  
  const imageData = ctx.createImageData(width, height)
  const data = imageData.data
  
  // Perlin-like noise (simplified)
  for (let i = 0; i < data.length; i += 4) {
    const noise = Math.random() > 0.5 ? 255 : 0
    data[i] = noise
    data[i + 1] = noise
    data[i + 2] = noise
    data[i + 3] = opacity * 255
  }
  
  ctx.putImageData(imageData, 0, 0)
  
  return {
    dataUrl: canvas.toDataURL('image/png'),
    params: { type: 'noise', opacity, blendMode: 'overlay' },
  }
}

/**
 * Get CSS for texture overlay
 */
export function getTextureCSS(texture: TextureOutput): string {
  if (!texture.dataUrl) return ''
  
  return `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url(${texture.dataUrl});
    opacity: ${texture.params.opacity};
    mix-blend-mode: ${texture.params.blendMode};
    pointer-events: none;
  `
}
