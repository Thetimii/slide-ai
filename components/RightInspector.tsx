'use client'

import { useEditorStore } from '@/lib/store'
import { THEME_PRESETS } from '@/lib/types'

export default function RightInspector() {
  const { 
    presentation, 
    currentSlideIndex, 
    selectedElementId,
    updateElement,
    updateSlide,
    toggleRightPanel,
  } = useEditorStore()
  
  if (!presentation) return null
  
  const currentSlide = presentation.slides_json.slides[currentSlideIndex]
  const selectedElement = currentSlide?.elements.find(el => el.id === selectedElementId)
  
  return (
    <div className="relative h-full">
      {/* Collapse Button */}
      <button
        onClick={toggleRightPanel}
        className="absolute top-4 -left-10 z-10 bg-surface-2 hover:bg-surface-3 border border-white/10 rounded-lg p-2 transition-colors"
        title="Toggle panel"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={2} 
          stroke="currentColor" 
          className="w-5 h-5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      <div className="p-6 space-y-6 h-full overflow-y-auto">
      <div>
        <h3 className="font-heading font-semibold mb-4">Slide Properties</h3>
        
        {/* Theme selector */}
        <div className="space-y-2">
          <label className="text-sm text-muted">Theme</label>
          <select
            value={currentSlide.meta.theme}
            onChange={(e) => {
              const themeName = e.target.value
              const theme = THEME_PRESETS[themeName]
              if (theme) {
                const updatedSlide = {
                  ...currentSlide,
                  background: theme.background,
                  meta: {
                    ...currentSlide.meta,
                    theme: themeName,
                  },
                }
                updateSlide(currentSlideIndex, updatedSlide)
              }
            }}
            className="w-full px-3 py-2 bg-surface-2 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {Object.entries(THEME_PRESETS).map(([key, theme]) => (
              <option key={key} value={key}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Background color (if solid) */}
        {currentSlide.background.type === 'solid' && currentSlide.background.solid && (
          <div className="space-y-2 mt-4">
            <label className="text-sm text-muted">Background Color</label>
            <input
              type="color"
              value={currentSlide.background.solid.color}
              onChange={(e) => {
                const updatedSlide = {
                  ...currentSlide,
                  background: {
                    ...currentSlide.background,
                    solid: {
                      color: e.target.value,
                    },
                  },
                }
                updateSlide(currentSlideIndex, updatedSlide)
              }}
              className="w-full h-10 rounded-xl cursor-pointer"
            />
          </div>
        )}
      </div>
      
      <div className="border-t border-white/5 pt-6">
        <h3 className="font-heading font-semibold mb-4">
          {selectedElement ? 'Element Properties' : 'Select an element to edit'}
        </h3>
        
        {selectedElement && selectedElement.type === 'text' && (
          <div className="space-y-4">
            {/* Text content */}
            <div className="space-y-2">
              <label className="text-sm text-muted">Text Content</label>
              <textarea
                value={selectedElement.content || ''}
                onChange={(e) => {
                  updateElement(currentSlideIndex, selectedElement.id, {
                    content: e.target.value,
                  })
                }}
                className="w-full px-3 py-2 bg-surface-2 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={4}
              />
            </div>
            
            {/* Font family */}
            <div className="space-y-2">
              <label className="text-sm text-muted">Font Family</label>
              <select
                value={selectedElement.style?.fontFamily || 'Inter'}
                onChange={(e) => {
                  updateElement(currentSlideIndex, selectedElement.id, {
                    style: {
                      ...selectedElement.style,
                      fontFamily: e.target.value,
                    },
                  })
                }}
                className="w-full px-3 py-2 bg-surface-2 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Inter">Inter</option>
                <option value="DM Sans">DM Sans</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
              </select>
            </div>
            
            {/* Font size */}
            <div className="space-y-2">
              <label className="text-sm text-muted">Font Size</label>
              <input
                type="number"
                value={selectedElement.style?.fontSize || 36}
                onChange={(e) => {
                  updateElement(currentSlideIndex, selectedElement.id, {
                    style: {
                      ...selectedElement.style,
                      fontSize: parseInt(e.target.value),
                    },
                  })
                }}
                className="w-full px-3 py-2 bg-surface-2 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                min="12"
                max="200"
              />
            </div>
            
            {/* Text color */}
            <div className="space-y-2">
              <label className="text-sm text-muted">Text Color</label>
              <input
                type="color"
                value={selectedElement.style?.fill || '#FFFFFF'}
                onChange={(e) => {
                  updateElement(currentSlideIndex, selectedElement.id, {
                    style: {
                      ...selectedElement.style,
                      fill: e.target.value,
                    },
                  })
                }}
                className="w-full h-10 rounded-xl cursor-pointer"
              />
            </div>
            
            {/* Alignment */}
            <div className="space-y-2">
              <label className="text-sm text-muted">Alignment</label>
              <div className="flex gap-2">
                {['left', 'center', 'right'].map((align) => (
                  <button
                    key={align}
                    onClick={() => {
                      updateElement(currentSlideIndex, selectedElement.id, {
                        style: {
                          ...selectedElement.style,
                          align: align as 'left' | 'center' | 'right',
                        },
                      })
                    }}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs transition-colors ${
                      selectedElement.style?.align === align
                        ? 'bg-primary text-bg'
                        : 'bg-surface-2 hover:bg-surface-3'
                    }`}
                  >
                    {align.charAt(0).toUpperCase() + align.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
