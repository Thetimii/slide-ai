'use client'

import { useEditorStore } from '@/lib/store'
import { THEME_PRESETS } from '@/lib/types'

export default function SlidesList() {
  const { 
    presentation, 
    currentSlideIndex, 
    setCurrentSlideIndex,
    addSlide,
    duplicateSlide,
    deleteSlide,
  } = useEditorStore()
  
  if (!presentation) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-muted text-sm">
        No slides yet
      </div>
    )
  }
  
  // Safe access to slides with fallback
  const slides = Array.isArray(presentation.slides_json?.slides) 
    ? presentation.slides_json.slides 
    : []
  
  if (slides.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-muted text-sm">
        No slides yet
      </div>
    )
  }
  
  function handleAddSlide() {
    // Create a blank slide with default theme
    const theme = THEME_PRESETS['modern-blue']
    const newSlide = {
      id: `slide-${Date.now()}`,
      background: theme.background,
      elements: [
        {
          id: `title-${Date.now()}`,
          type: 'text' as const,
          props: {
            x: 100,
            y: 200,
            width: 1400,
            height: 150,
          },
          style: theme.titleStyle,
          content: 'New Slide',
        },
      ],
      meta: {
        title: 'New Slide',
        theme: 'modern-blue',
      },
    }
    addSlide(newSlide)
  }
  
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-gray-900 dark:text-white">Slides</h3>
        <button 
          onClick={handleAddSlide}
          className="text-primary hover:text-primary/80 text-xl"
          title="Add slide"
        >
          +
        </button>
      </div>
      
      <div className="space-y-2">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            onClick={() => setCurrentSlideIndex(index)}
            className={`
              group relative rounded-xl overflow-hidden cursor-pointer transition-all
              ${index === currentSlideIndex 
                ? 'ring-2 ring-primary shadow-lg' 
                : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-white/20'
              }
            `}
          >
            <div className="aspect-video bg-gray-200 dark:bg-surface-2 flex items-center justify-center p-4">
              <div className="text-center">
                <p className="text-xs font-medium truncate">
                  {slide.meta?.title || `Slide ${index + 1}`}
                </p>
                <p className="text-[10px] text-muted mt-1">
                  {Array.isArray(slide.elements) ? slide.elements.length : 0} elements
                </p>
              </div>
            </div>
            
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  duplicateSlide(index)
                }}
                className="bg-surface-1/90 hover:bg-surface-1 p-1 rounded text-xs"
                title="Duplicate"
              >
                📋
              </button>
              {slides.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('Delete this slide?')) {
                      deleteSlide(index)
                    }
                  }}
                  className="bg-surface-1/90 hover:bg-red-500/90 p-1 rounded text-xs"
                  title="Delete"
                >
                  🗑️
                </button>
              )}
            </div>
            
            <div className="absolute bottom-2 left-2 text-[10px] bg-surface-1/90 px-2 py-0.5 rounded">
              {index + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
