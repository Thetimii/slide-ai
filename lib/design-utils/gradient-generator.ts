export interface GradientParams {
  colors: string[] // Array of hex colors
  type: 'linear' | 'radial' | 'conic'
  angle?: number // 0-360 degrees (for linear)
}

export interface GradientOutput {
  css: string
  params: GradientParams
}

/**
 * Generate CSS gradient string
 */
export function generateGradient(params: GradientParams): GradientOutput {
  const { colors, type, angle = 135 } = params
  
  let css: string
  
  if (type === 'linear') {
    css = `linear-gradient(${angle}deg, ${colors.join(', ')})`
  } else if (type === 'radial') {
    css = `radial-gradient(circle, ${colors.join(', ')})`
  } else if (type === 'conic') {
    css = `conic-gradient(from ${angle}deg, ${colors.join(', ')})`
  } else {
    css = `linear-gradient(${angle}deg, ${colors.join(', ')})`
  }
  
  return {
    css,
    params,
  }
}

/**
 * Generate random gradient from predefined palettes
 */
export function generateRandomGradient(): GradientOutput {
  const palettes = [
    ['#667eea', '#764ba2'], // Purple
    ['#f093fb', '#f5576c'], // Pink
    ['#4facfe', '#00f2fe'], // Blue
    ['#43e97b', '#38f9d7'], // Green
    ['#fa709a', '#fee140'], // Warm
    ['#30cfd0', '#330867'], // Cool
    ['#a8edea', '#fed6e3'], // Pastel
    ['#ff9a9e', '#fecfef'], // Soft pink
  ]
  
  const palette = palettes[Math.floor(Math.random() * palettes.length)]
  const angle = Math.floor(Math.random() * 360)
  
  return generateGradient({
    colors: palette,
    type: 'linear',
    angle,
  })
}

/**
 * Get themed gradient based on style
 */
export function getThemedGradient(style: string): GradientOutput {
  const styleMap: Record<string, string[]> = {
    'modern minimal': ['#f5f5f5', '#ffffff'],
    'bold pastel': ['#ffd1dc', '#ffb3d9'],
    'corporate': ['#1e3a8a', '#3b82f6'],
    'warm': ['#fbbf24', '#f59e0b'],
    'cool': ['#06b6d4', '#0891b2'],
    'dark': ['#0a0a0a', '#1a1a1a'],
  }
  
  const colors = styleMap[style.toLowerCase()] || ['#667eea', '#764ba2']
  
  return generateGradient({
    colors,
    type: 'linear',
    angle: 135,
  })
}
