'use client'

import { create } from 'zustand'
import { Presentation, Slide, SlideElement, SlidesJSON } from '@/lib/types'

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
    set({
      presentation: {
        ...presentation,
        slides_json: { slides },
      },
      currentSlideIndex: slides.length - 1,
    })
  },
  
  updateSlide: (index, slide) => {
    const { presentation } = get()
    if (!presentation) return
    
    const slides = [...presentation.slides_json.slides]
    slides[index] = slide
    
    set({
      presentation: {
        ...presentation,
        slides_json: { slides },
      },
    })
  },
  
  deleteSlide: (index) => {
    const { presentation, currentSlideIndex } = get()
    if (!presentation || presentation.slides_json.slides.length <= 1) return
    
    const slides = presentation.slides_json.slides.filter((_, i) => i !== index)
    const newIndex = currentSlideIndex >= slides.length ? slides.length - 1 : currentSlideIndex
    
    set({
      presentation: {
        ...presentation,
        slides_json: { slides },
      },
      currentSlideIndex: newIndex,
    })
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
    
    set({
      presentation: {
        ...presentation,
        slides_json: { slides },
      },
      currentSlideIndex: index + 1,
    })
  },
  
  reorderSlides: (fromIndex, toIndex) => {
    const { presentation } = get()
    if (!presentation) return
    
    const slides = [...presentation.slides_json.slides]
    const [removed] = slides.splice(fromIndex, 1)
    slides.splice(toIndex, 0, removed)
    
    set({
      presentation: {
        ...presentation,
        slides_json: { slides },
      },
      currentSlideIndex: toIndex,
    })
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
    
    set({
      presentation: {
        ...presentation,
        slides_json: { slides },
      },
    })
  },
  
  deleteElement: (slideIndex, elementId) => {
    const { presentation } = get()
    if (!presentation) return
    
    const slides = [...presentation.slides_json.slides]
    const slide = slides[slideIndex]
    
    const elements = slide.elements.filter((el) => el.id !== elementId)
    slides[slideIndex] = { ...slide, elements }
    
    set({
      presentation: {
        ...presentation,
        slides_json: { slides },
      },
      selectedElementId: null,
    })
  },
}))
