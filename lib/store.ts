'use client'

import { create } from 'zustand'
import { Presentation, Slide, SlideElement, SlidesJSON } from '@/lib/types'

// Debounce timeout for auto-saving
let saveTimeout: NodeJS.Timeout | null = null

// Auto-save function with debouncing
async function savePresentation(presentation: Presentation) {
  // Clear previous timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  
  // Debounce: wait 1 second before saving
  saveTimeout = setTimeout(async () => {
    try {
      const response = await fetch('/api/presentations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: presentation.id,
          slides_json: presentation.slides_json,
        }),
      })
      
      if (response.ok) {
        console.log('✅ Presentation saved')
        useEditorStore.getState().setLastSaved(new Date())
      } else {
        console.error('❌ Failed to save presentation')
      }
    } catch (error) {
      console.error('❌ Save error:', error)
    }
  }, 1000) // 1 second debounce
}

interface EditorState {
  // Current presentation
  presentation: Presentation | null
  setPresentation: (presentation: Presentation | null) => void
  
  // Current slide index
  currentSlideIndex: number
  setCurrentSlideIndex: (index: number) => void
  
  // Selected element on canvas
  selectedElementId: string | null
  setSelectedElementId: (id: string | null) => void
  
  // Zoom and pan
  zoom: number
  setZoom: (zoom: number) => void
  
  panX: number
  panY: number
  setPan: (x: number, y: number) => void
  
  // UI state
  isRightPanelOpen: boolean
  toggleRightPanel: () => void
  isDarkMode: boolean
  toggleDarkMode: () => void
  
  // Slide operations
  addSlide: (slide: Slide) => void
  updateSlide: (index: number, slide: Slide) => void
  deleteSlide: (index: number) => void
  duplicateSlide: (index: number) => void
  reorderSlides: (fromIndex: number, toIndex: number) => void
  
  // Element operations
  updateElement: (slideIndex: number, elementId: string, updates: Partial<SlideElement>) => void
  deleteElement: (slideIndex: number, elementId: string) => void
  
  // Saving state
  isSaving: boolean
  setIsSaving: (saving: boolean) => void
  lastSaved: Date | null
  setLastSaved: (date: Date) => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  presentation: null,
  currentSlideIndex: 0,
  selectedElementId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  isRightPanelOpen: true,
  isDarkMode: true,
  isSaving: false,
  lastSaved: null,
  
  // Setters
  setPresentation: (presentation) => set({ presentation, currentSlideIndex: 0 }),
  setCurrentSlideIndex: (index) => set({ currentSlideIndex: index, selectedElementId: null }),
  setSelectedElementId: (id) => set({ selectedElementId: id }),
  setZoom: (zoom) => set({ zoom }),
  setPan: (panX, panY) => set({ panX, panY }),
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  setIsSaving: (isSaving) => set({ isSaving }),
  setLastSaved: (lastSaved) => set({ lastSaved }),
  
  // Slide operations
  addSlide: (slide) => {
    const { presentation } = get()
    if (!presentation) return
    
    const slides = [...presentation.slides_json.slides, slide]
    const updatedPresentation = {
      ...presentation,
      slides_json: { slides },
    }
    
    set({
      presentation: updatedPresentation,
      currentSlideIndex: slides.length - 1,
    })
    
    // Auto-save to database
    savePresentation(updatedPresentation)
  },
  
  updateSlide: (index, slide) => {
    const { presentation } = get()
    if (!presentation) return
    
    const slides = [...presentation.slides_json.slides]
    slides[index] = slide
    
    const updatedPresentation = {
      ...presentation,
      slides_json: { slides },
    }
    
    set({
      presentation: updatedPresentation,
    })
    
    // Auto-save to database
    savePresentation(updatedPresentation)
  },
  
  deleteSlide: (index) => {
    const { presentation, currentSlideIndex } = get()
    if (!presentation || presentation.slides_json.slides.length <= 1) return
    
    const slides = presentation.slides_json.slides.filter((_, i) => i !== index)
    const newIndex = currentSlideIndex >= slides.length ? slides.length - 1 : currentSlideIndex
    
    const updatedPresentation = {
      ...presentation,
      slides_json: { slides },
    }
    
    set({
      presentation: updatedPresentation,
      currentSlideIndex: newIndex,
    })
    
    // Auto-save to database
    savePresentation(updatedPresentation)
  },
  
  duplicateSlide: (index) => {
    const { presentation } = get()
    if (!presentation) return
    
    const slideToDuplicate = presentation.slides_json.slides[index]
    const newSlide = {
      ...slideToDuplicate,
      id: `slide-${Date.now()}`,
      elements: slideToDuplicate.elements.map((el) => ({
        ...el,
        id: `${el.id}-copy-${Date.now()}`,
      })),
    }
    
    const slides = [
      ...presentation.slides_json.slides.slice(0, index + 1),
      newSlide,
      ...presentation.slides_json.slides.slice(index + 1),
    ]
    
    const updatedPresentation = {
      ...presentation,
      slides_json: { slides },
    }
    
    set({
      presentation: updatedPresentation,
      currentSlideIndex: index + 1,
    })
    
    // Auto-save to database
    savePresentation(updatedPresentation)
  },
  
  reorderSlides: (fromIndex, toIndex) => {
    const { presentation } = get()
    if (!presentation) return
    
    const slides = [...presentation.slides_json.slides]
    const [removed] = slides.splice(fromIndex, 1)
    slides.splice(toIndex, 0, removed)
    
    const updatedPresentation = {
      ...presentation,
      slides_json: { slides },
    }
    
    set({
      presentation: updatedPresentation,
      currentSlideIndex: toIndex,
    })
    
    // Auto-save to database
    savePresentation(updatedPresentation)
  },
  
  // Element operations
  updateElement: (slideIndex, elementId, updates) => {
    const { presentation } = get()
    if (!presentation) return
    
    const slides = [...presentation.slides_json.slides]
    const slide = slides[slideIndex]
    
    const elements = slide.elements.map((el) =>
      el.id === elementId ? { ...el, ...updates } : el
    )
    
    slides[slideIndex] = { ...slide, elements }
    
    const updatedPresentation = {
      ...presentation,
      slides_json: { slides },
    }
    
    set({
      presentation: updatedPresentation,
    })
    
    // Auto-save to database
    savePresentation(updatedPresentation)
  },
  
  deleteElement: (slideIndex, elementId) => {
    const { presentation } = get()
    if (!presentation) return
    
    const slides = [...presentation.slides_json.slides]
    const slide = slides[slideIndex]
    
    const elements = slide.elements.filter((el) => el.id !== elementId)
    slides[slideIndex] = { ...slide, elements }
    
    const updatedPresentation = {
      ...presentation,
      slides_json: { slides },
    }
    
    set({
      presentation: updatedPresentation,
      selectedElementId: null,
    })
    
    // Auto-save to database
    savePresentation(updatedPresentation)
  },
}))
