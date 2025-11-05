'use client'

import { useEditorStore } from '@/lib/store'
import { THEME_PRESETS } from '@/lib/types'
import { useState, useEffect } from 'react'

export default function RightInspector() {
  const { 
    presentation, 
    currentSlideIndex, 
    selectedElementId,
    updateElement,
    updateSlide,
    toggleRightPanel,
  } = useEditorStore()
  
  const [imageSearchQuery, setImageSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [regeneratingBlob, setRegeneratingBlob] = useState(false)
  
  if (!presentation || !presentation.slides_json?.slides) return null
  
  const currentSlide = presentation.slides_json.slides[currentSlideIndex]
  if (!currentSlide) return null
  
  const selectedElement = currentSlide?.elements.find(el => el.id === selectedElementId)
  
  // Search Pexels for images
  const searchPexels = async (query: string) => {
    if (!query.trim()) return
    
    setIsSearching(true)
    try {
      const response = await fetch(`/api/pexels-search?q=${encodeURIComponent(query)}&per_page=12`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(Array.isArray(data) ? data : [])
      } else {
        console.error('Search failed:', await response.text())
        setSearchResults([])
      }
    } catch (error) {
      console.error('Failed to search images:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }
  
  // Regenerate blob with new variation
  const regenerateBlob = async (element: any) => {
    setRegeneratingBlob(true)
    try {
      const response = await fetch('/api/generate-blob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complexity: Math.random() * 0.3 + 0.5, // 0.5-0.8
          contrast: Math.random() * 0.3 + 0.4, // 0.4-0.7
        })
      })
      
      if (response.ok) {
        const { svg } = await response.json()
        updateElement(currentSlideIndex, element.id, {
          content: svg,
        })
      }
    } catch (error) {
      console.error('Failed to regenerate blob:', error)
    } finally {
      setRegeneratingBlob(false)
    }
  }
  
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
        
        {/* Image Element Editor */}
        {selectedElement && selectedElement.type === 'image' && (
          <div className="space-y-4">
            {/* Current Image Preview */}
            <div className="space-y-2">
              <label className="text-sm text-muted">Current Image</label>
              <div className="relative w-full h-32 bg-surface-2 rounded-xl overflow-hidden">
                <img 
                  src={selectedElement.content} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Image Search */}
            <div className="space-y-2">
              <label className="text-sm text-muted">Replace Image</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageSearchQuery}
                  onChange={(e) => setImageSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchPexels(imageSearchQuery)}
                  placeholder="Search Pexels..."
                  className="flex-1 px-3 py-2 bg-surface-2 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={() => searchPexels(imageSearchQuery)}
                  disabled={isSearching}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSearching ? '...' : 'Search'}
                </button>
              </div>
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm text-muted">Results ({searchResults.length})</label>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {searchResults.map((photo: any) => (
                    <button
                      key={photo.id}
                      onClick={() => {
                        updateElement(currentSlideIndex, selectedElement.id, {
                          content: photo.src.large,
                        })
                        setSearchResults([])
                        setImageSearchQuery('')
                      }}
                      className="relative h-24 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                    >
                      <img 
                        src={photo.src.small} 
                        alt={photo.alt}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Size Controls */}
            <div className="space-y-3">
              <label className="text-sm text-muted">Size</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted mb-1 block">Width</label>
                  <input
                    type="number"
                    value={selectedElement.props.width}
                    onChange={(e) => {
                      updateElement(currentSlideIndex, selectedElement.id, {
                        props: {
                          ...selectedElement.props,
                          width: parseInt(e.target.value),
                        },
                      })
                    }}
                    className="w-full px-2 py-1 bg-surface-2 border border-white/10 rounded-lg text-sm"
                    min="50"
                    max="1600"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Height</label>
                  <input
                    type="number"
                    value={selectedElement.props.height}
                    onChange={(e) => {
                      updateElement(currentSlideIndex, selectedElement.id, {
                        props: {
                          ...selectedElement.props,
                          height: parseInt(e.target.value),
                        },
                      })
                    }}
                    className="w-full px-2 py-1 bg-surface-2 border border-white/10 rounded-lg text-sm"
                    min="50"
                    max="900"
                  />
                </div>
              </div>
            </div>
            
            {/* Corner Radius */}
            <div className="space-y-2">
              <label className="text-sm text-muted">Corner Radius</label>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedElement.style?.radius || 8}
                onChange={(e) => {
                  updateElement(currentSlideIndex, selectedElement.id, {
                    style: {
                      ...selectedElement.style,
                      radius: parseInt(e.target.value),
                    },
                  })
                }}
                className="w-full"
              />
              <div className="text-xs text-muted text-right">{selectedElement.style?.radius || 8}px</div>
            </div>
            
            {/* Opacity */}
            <div className="space-y-2">
              <label className="text-sm text-muted">Opacity</label>
              <input
                type="range"
                min="0"
                max="100"
                value={(selectedElement.props.opacity || 1) * 100}
                onChange={(e) => {
                  updateElement(currentSlideIndex, selectedElement.id, {
                    props: {
                      ...selectedElement.props,
                      opacity: parseInt(e.target.value) / 100,
                    },
                  })
                }}
                className="w-full"
              />
              <div className="text-xs text-muted text-right">{Math.round((selectedElement.props.opacity || 1) * 100)}%</div>
            </div>
          </div>
        )}
        
        {/* Blob/Shape Element Editor */}
        {selectedElement && selectedElement.type === 'shape' && selectedElement.content?.includes('<svg') && (
          <div className="space-y-4">
            {/* Blob Preview */}
            <div className="space-y-2">
              <label className="text-sm text-muted">Blob Shape</label>
              <div className="relative w-full h-32 bg-surface-2 rounded-xl overflow-hidden flex items-center justify-center">
                <div 
                  dangerouslySetInnerHTML={{ __html: selectedElement.content }}
                  className="w-24 h-24"
                />
              </div>
            </div>
            
            {/* Regenerate Blob */}
            <button
              onClick={() => regenerateBlob(selectedElement)}
              disabled={regeneratingBlob}
              className="w-full px-4 py-2 bg-primary hover:bg-primary/90 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {regeneratingBlob ? 'Generating...' : '🎲 Generate New Variation'}
            </button>
            
            {/* Size Controls */}
            <div className="space-y-3">
              <label className="text-sm text-muted">Size</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted mb-1 block">Width</label>
                  <input
                    type="number"
                    value={selectedElement.props.width}
                    onChange={(e) => {
                      updateElement(currentSlideIndex, selectedElement.id, {
                        props: {
                          ...selectedElement.props,
                          width: parseInt(e.target.value),
                        },
                      })
                    }}
                    className="w-full px-2 py-1 bg-surface-2 border border-white/10 rounded-lg text-sm"
                    min="100"
                    max="800"
                    step="50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Height</label>
                  <input
                    type="number"
                    value={selectedElement.props.height}
                    onChange={(e) => {
                      updateElement(currentSlideIndex, selectedElement.id, {
                        props: {
                          ...selectedElement.props,
                          height: parseInt(e.target.value),
                        },
                      })
                    }}
                    className="w-full px-2 py-1 bg-surface-2 border border-white/10 rounded-lg text-sm"
                    min="100"
                    max="800"
                    step="50"
                  />
                </div>
              </div>
            </div>
            
            {/* Blob Color */}
            <div className="space-y-2">
              <label className="text-sm text-muted">Blob Color</label>
              <input
                type="color"
                value={selectedElement.style?.fill || '#667eea'}
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
            
            {/* Opacity */}
            <div className="space-y-2">
              <label className="text-sm text-muted">Opacity</label>
              <input
                type="range"
                min="0"
                max="100"
                value={(selectedElement.props.opacity || 0.3) * 100}
                onChange={(e) => {
                  updateElement(currentSlideIndex, selectedElement.id, {
                    props: {
                      ...selectedElement.props,
                      opacity: parseInt(e.target.value) / 100,
                    },
                  })
                }}
                className="w-full"
              />
              <div className="text-xs text-muted text-right">{Math.round((selectedElement.props.opacity || 0.3) * 100)}%</div>
            </div>
          </div>
        )}
        
        {/* Universal Position Controls - Shows for ANY selected element */}
        {selectedElement && (
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="space-y-3">
              <label className="text-sm text-muted">Position</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted mb-1 block">X</label>
                  <input
                    type="number"
                    value={selectedElement.props.x}
                    onChange={(e) => {
                      updateElement(currentSlideIndex, selectedElement.id, {
                        props: {
                          ...selectedElement.props,
                          x: parseInt(e.target.value),
                        },
                      })
                    }}
                    className="w-full px-2 py-1 bg-surface-2 border border-white/10 rounded-lg text-sm"
                    min="0"
                    max="1600"
                    step="10"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Y</label>
                  <input
                    type="number"
                    value={selectedElement.props.y}
                    onChange={(e) => {
                      updateElement(currentSlideIndex, selectedElement.id, {
                        props: {
                          ...selectedElement.props,
                          y: parseInt(e.target.value),
                        },
                      })
                    }}
                    className="w-full px-2 py-1 bg-surface-2 border border-white/10 rounded-lg text-sm"
                    min="0"
                    max="900"
                    step="10"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
