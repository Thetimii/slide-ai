import { Slide, SlideElement, CANVAS_WIDTH, CANVAS_HEIGHT } from './types'

interface CinematicElement {
  type: 'text' | 'shape' | 'gradient' | 'image'
  x: number
  y: number
  width?: number
  height?: number
  content?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  color?: string
  opacity?: number
  rotation?: number
  blur?: number
  shadow?: {
    x: number
    y: number
    blur: number
    color: string
  }
  gradient?: {
    type: 'linear' | 'radial'
    colors: string[]
    angle?: number
  }
  animation?: {
    type: 'fadeIn' | 'slideIn' | 'scale' | 'none'
    duration: number
    delay: number
  }
  texture?: string
  parallaxDepth?: number
}

interface CinematicSlide {
  id: string
  title?: string
  mood: string
  composition: string
  background: {
    type: 'solid' | 'gradient' | 'image'
    colors?: string[]
    gradientAngle?: number
    imageUrl?: string
    blur?: number
  }
  elements: CinematicElement[]
}

/**
 * Transforms AI-generated cinematic slides into renderable slide objects
 */
export function transformCinematicSlide(
  cinematicSlide: CinematicSlide,
  index: number
): Slide {
  const elements: SlideElement[] = []
  
  // Transform each cinematic element to a renderable element
  cinematicSlide.elements.forEach((elem, elemIndex) => {
    if (elem.type === 'text') {
      elements.push({
        id: `elem-${index}-${elemIndex}`,
        type: 'text',
        props: {
          x: elem.x,
          y: elem.y,
          width: elem.width || 400,
          height: elem.height || 100,
          zIndex: 10 + elemIndex,
          opacity: elem.opacity || 1,
          rotation: elem.rotation || 0,
        },
        style: {
          fontSize: elem.fontSize || 32,
          fontFamily: elem.fontFamily || 'Inter',
          fontWeight: parseInt(elem.fontWeight || '400'),
          fill: elem.color || '#ffffff',
          align: 'left',
          lineHeight: 1.4,
        },
        content: elem.content || '',
      })
    } else if (elem.type === 'shape') {
      // Add shape as a rect element
      elements.push({
        id: `shape-${index}-${elemIndex}`,
        type: 'rect',
        props: {
          x: elem.x,
          y: elem.y,
          width: elem.width || 100,
          height: elem.height || 100,
          zIndex: 5 + elemIndex,
          opacity: elem.opacity || 0.5,
          rotation: elem.rotation || 0,
        },
        style: {
          fill: elem.color || '#ffffff',
        },
      })
    }
  })
  
  // Create background
  let background: any = {
    type: 'solid',
    fill: '#1a1a2e',
  }
  
  if (cinematicSlide.background.type === 'gradient' && cinematicSlide.background.colors) {
    background = {
      type: 'gradient',
      colors: cinematicSlide.background.colors,
      angle: cinematicSlide.background.gradientAngle || 135,
    }
  } else if (cinematicSlide.background.type === 'solid' && cinematicSlide.background.colors?.[0]) {
    background = {
      type: 'solid',
      fill: cinematicSlide.background.colors[0],
    }
  }
  
  return {
    id: `slide-${index}-${Date.now()}`,
    background,
    elements,
    meta: {
      title: cinematicSlide.title || `Slide ${index + 1}`,
      notes: cinematicSlide.mood,
      theme: 'cinematic',
    },
  }
}

/**
 * Transforms an array of cinematic slides into a complete slides JSON object
 */
export function transformAISlidesToJSON(cinematicResponse: { meta: any; slides: CinematicSlide[] }) {
  return {
    slides: cinematicResponse.slides.map((slide, index) => 
      transformCinematicSlide(slide, index)
    ),
  }
}
