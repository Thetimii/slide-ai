'use client'

import { useState } from 'react'
import { Presentation } from '@/lib/types'

interface GenerateSlidesModalProps {
  onClose: () => void
  onSuccess: (presentation: Presentation) => void
}

interface SlideInput {
  id: string
  content: string
}

export default function GenerateSlidesModal({ onClose, onSuccess }: GenerateSlidesModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'config' | 'content'>('config')
  const [numSlides, setNumSlides] = useState(3)
  const [useUniformDesign, setUseUniformDesign] = useState(false)
  const [useVerbatim, setUseVerbatim] = useState(false)
  const [slideInputs, setSlideInputs] = useState<SlideInput[]>([
    { id: '1', content: '' },
    { id: '2', content: '' },
    { id: '3', content: '' },
  ])
  const [formData, setFormData] = useState({
    presentationTitle: '',
    theme: 'Modern Cinematic',
    style: 'cinematic gradients, professional typography, elegant spacing',
  })

  const updateNumSlides = (num: number) => {
    setNumSlides(num)
    const newInputs: SlideInput[] = []
    for (let i = 0; i < num; i++) {
      newInputs.push(slideInputs[i] || { id: String(i + 1), content: '' })
    }
    setSlideInputs(newInputs)
  }

  const updateSlideContent = (id: string, content: string) => {
    setSlideInputs(prev => 
      prev.map(slide => slide.id === id ? { ...slide, content } : slide)
    )
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presentationTitle: formData.presentationTitle,
          theme: formData.theme,
          style: formData.style,
          numSlides,
          slides: slideInputs,
          useUniformDesign,
          useVerbatim,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate slides')
      }
      
      const { presentation } = await response.json()
      onSuccess(presentation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  
  if (step === 'config') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 m-4 bg-white dark:bg-surface-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Configure Slides</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 dark:text-muted hover:text-gray-700 dark:hover:text-fg transition-colors"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); setStep('content'); }} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Presentation Title
              </label>
              <input
                type="text"
                value={formData.presentationTitle}
                onChange={(e) => setFormData({ ...formData, presentationTitle: e.target.value })}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-surface-2 border border-gray-300 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
                placeholder="e.g., Sunday Service - Faith Over Fear"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Number of Slides
              </label>
              <div className="flex flex-wrap gap-2">
                {[2, 3, 4, 5, 6, 8, 10].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => updateNumSlides(num)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      numSlides === num
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 dark:bg-surface-2 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-surface-3'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Design Theme
              </label>
              <select
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-surface-2 border border-gray-300 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
              >
                <option value="Modern Cinematic">Modern Cinematic</option>
                <option value="Minimal Elegant">Minimal Elegant</option>
                <option value="Bold Typography">Bold Typography</option>
                <option value="Soft Gradients">Soft Gradients</option>
                <option value="Dark Moody">Dark Moody</option>
                <option value="Light Airy">Light Airy</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useUniformDesign}
                  onChange={(e) => setUseUniformDesign(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 dark:border-white/20 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Use uniform design across all slides
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useVerbatim}
                  onChange={(e) => setUseVerbatim(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 dark:border-white/20 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Use my text word-for-word (don't let AI rewrite)
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-surface-2 text-gray-700 dark:text-fg rounded-xl hover:bg-gray-300 dark:hover:bg-surface-3 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
              >
                Next: Add Content →
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="card w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 m-4 bg-white dark:bg-surface-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">
            Slide Content ({numSlides} slides)
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 dark:text-muted hover:text-gray-700 dark:hover:text-fg transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            {slideInputs.map((slide, index) => (
              <div key={slide.id} className="p-4 bg-gray-50 dark:bg-surface-2 rounded-xl">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Slide {index + 1}
                </label>
                <textarea
                  value={slide.content}
                  onChange={(e) => updateSlideContent(slide.id, e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white dark:bg-surface-3 border border-gray-300 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none text-gray-900 dark:text-white"
                  placeholder={`Enter content for slide ${index + 1}...`}
                  required
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setStep('config')}
              className="px-6 py-3 bg-gray-200 dark:bg-surface-2 text-gray-700 dark:text-fg rounded-xl hover:bg-gray-300 dark:hover:bg-surface-3 transition-colors"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating...
                </span>
              ) : (
                'Generate Slides'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
