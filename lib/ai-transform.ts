import { AISlide, Slide, SlideElement, THEME_PRESETS, CANVAS_WIDTH, CANVAS_HEIGHT } from './types'

/**
 * Transforms AI-generated slides into renderable slide objects with proper layout
 */
export function transformAISlideToRenderable(
  aiSlide: AISlide,
  index: number
): Slide {
  const theme = THEME_PRESETS[aiSlide.theme] || THEME_PRESETS['modern-blue']
  
  const elements: SlideElement[] = []
  
  // Add decorative elements from AI (background shapes, accents)
  if (aiSlide.decorations && aiSlide.decorations.length > 0) {
    aiSlide.decorations.forEach((decoration, decIdx) => {
      const decorElement: SlideElement = {
        id: `decoration-${index}-${decIdx}`,
        type: decoration.type === 'line' ? 'rect' : decoration.type === 'circle' ? 'shape' : 'rect',
        props: {
          x: decoration.position.x,
          y: decoration.position.y,
          width: decoration.size.width,
          height: decoration.size.height,
          rotation: decoration.rotation || 0,
          opacity: decoration.opacity || 0.3,
          zIndex: 0, // Behind text
        },
        style: {
          fill: decoration.color,
          radius: decoration.type === 'circle' ? decoration.size.width / 2 : 8,
        },
      }
      elements.push(decorElement)
    })
  }
  
  // Add title element
  const titleElement: SlideElement = {
    id: `title-${index}`,
    type: 'text',
    props: {
      x: 100,
      y: 200,
      width: CANVAS_WIDTH - 200,
      height: 150,
      zIndex: 10, // Above decorations
    },
    style: {
      ...theme.titleStyle,
    },
    content: aiSlide.title,
  }
  elements.push(titleElement)
  
  // Add content/body element
  const bodyElement: SlideElement = {
    id: `body-${index}`,
    type: 'text',
    props: {
      x: 150,
      y: 400,
      width: CANVAS_WIDTH - 300,
      height: 350,
      zIndex: 10, // Above decorations
    },
    style: {
      ...theme.bodyStyle,
    },
    content: aiSlide.content,
  }
  elements.push(bodyElement)
  
  return {
    id: `slide-${index}-${Date.now()}`,
    background: theme.background,
    elements,
    meta: {
      title: aiSlide.title,
      notes: aiSlide.content,
      theme: aiSlide.theme,
    },
  }
}

/**
 * Transforms an array of AI slides into a complete slides JSON object
 */
export function transformAISlidesToJSON(aiSlides: AISlide[]) {
  return {
    slides: aiSlides.map((slide, index) => transformAISlideToRenderable(slide, index)),
  }
}
