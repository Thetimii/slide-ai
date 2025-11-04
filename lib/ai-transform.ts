import { AISlide, Slide, SlideElement, THEME_PRESETS, CANVAS_WIDTH, CANVAS_HEIGHT } from './types'

/**
 * Transforms AI-generated slides into renderable slide objects with proper layout
 */
export function transformAISlideToRenderable(
  aiSlide: AISlide,
  index: number
): Slide {
  const theme = THEME_PRESETS[aiSlide.theme] || THEME_PRESETS['modern-blue']
  const layout = aiSlide.layout || 'hero'
  
  const elements: SlideElement[] = []
  
  // HERO LAYOUT - Large centered title, smaller subtitle below
  if (layout === 'hero') {
    elements.push({
      id: `title-${index}`,
      type: 'text',
      props: {
        x: 100,
        y: 280,
        width: CANVAS_WIDTH - 200,
        height: 200,
        zIndex: 10,
      },
      style: {
        ...theme.titleStyle,
        fontSize: 85,
        fontWeight: 700,
        align: 'center',
      },
      content: aiSlide.title,
    })
    
    if (aiSlide.content) {
      elements.push({
        id: `subtitle-${index}`,
        type: 'text',
        props: {
          x: 200,
          y: 520,
          width: CANVAS_WIDTH - 400,
          height: 150,
          zIndex: 10,
        },
        style: {
          ...theme.bodyStyle,
          fontSize: 32,
          fontWeight: 400,
          align: 'center',
        },
        content: aiSlide.content,
      })
    }
  }
  
  // SPLIT LAYOUT - Title top-left, content spans right side
  else if (layout === 'split') {
    elements.push({
      id: `title-${index}`,
      type: 'text',
      props: {
        x: 80,
        y: 120,
        width: 600,
        height: 120,
        zIndex: 10,
      },
      style: {
        ...theme.titleStyle,
        fontSize: 52,
        fontWeight: 700,
        align: 'left',
      },
      content: aiSlide.title,
    })
    
    elements.push({
      id: `content-${index}`,
      type: 'text',
      props: {
        x: 80,
        y: 280,
        width: CANVAS_WIDTH - 160,
        height: 520,
        zIndex: 10,
      },
      style: {
        ...theme.bodyStyle,
        fontSize: 38,
        fontWeight: 500,
        align: 'left',
        lineHeight: 1.6,
      },
      content: aiSlide.content,
    })
  }
  
  // MINIMAL LAYOUT - Small title, large quote-style content centered
  else if (layout === 'minimal') {
    elements.push({
      id: `title-${index}`,
      type: 'text',
      props: {
        x: 200,
        y: 200,
        width: CANVAS_WIDTH - 400,
        height: 80,
        zIndex: 10,
      },
      style: {
        ...theme.titleStyle,
        fontSize: 28,
        fontWeight: 600,
        align: 'center',
      },
      content: aiSlide.title,
    })
    
    elements.push({
      id: `quote-${index}`,
      type: 'text',
      props: {
        x: 180,
        y: 320,
        width: CANVAS_WIDTH - 360,
        height: 400,
        zIndex: 10,
      },
      style: {
        ...theme.bodyStyle,
        fontSize: 44,
        fontWeight: 400,
        align: 'center',
        lineHeight: 1.7,
      },
      content: aiSlide.content,
    })
  }
  
  // QUOTE LAYOUT - Large quote marks, centered text
  else if (layout === 'quote') {
    // Add decorative quote marks
    elements.push({
      id: `quote-mark-${index}`,
      type: 'text',
      props: {
        x: 250,
        y: 200,
        width: 150,
        height: 150,
        zIndex: 5,
        opacity: 0.15,
      },
      style: {
        fontSize: 200,
        fill: theme.titleStyle.fill,
        align: 'left',
      },
      content: '"',
    })
    
    elements.push({
      id: `quote-text-${index}`,
      type: 'text',
      props: {
        x: 200,
        y: 300,
        width: CANVAS_WIDTH - 400,
        height: 350,
        zIndex: 10,
      },
      style: {
        ...theme.bodyStyle,
        fontSize: 46,
        fontWeight: 500,
        align: 'center',
        lineHeight: 1.6,
      },
      content: aiSlide.content,
    })
    
    elements.push({
      id: `attribution-${index}`,
      type: 'text',
      props: {
        x: 200,
        y: 680,
        width: CANVAS_WIDTH - 400,
        height: 60,
        zIndex: 10,
      },
      style: {
        ...theme.titleStyle,
        fontSize: 24,
        fontWeight: 600,
        align: 'center',
      },
      content: aiSlide.title,
    })
  }
  
  // FOCUS LAYOUT - Massive single word/phrase
  else if (layout === 'focus') {
    elements.push({
      id: `focus-${index}`,
      type: 'text',
      props: {
        x: 100,
        y: 300,
        width: CANVAS_WIDTH - 200,
        height: 300,
        zIndex: 10,
      },
      style: {
        ...theme.titleStyle,
        fontSize: 120,
        fontWeight: 900,
        align: 'center',
        letterSpacing: -2,
      },
      content: aiSlide.title,
    })
    
    if (aiSlide.content) {
      elements.push({
        id: `focus-sub-${index}`,
        type: 'text',
        props: {
          x: 200,
          y: 620,
          width: CANVAS_WIDTH - 400,
          height: 80,
          zIndex: 10,
        },
        style: {
          ...theme.bodyStyle,
          fontSize: 28,
          fontWeight: 400,
          align: 'center',
        },
        content: aiSlide.content,
      })
    }
  }
  
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
