'use client'

import { useState } from 'react'
import { Presentation } from '@/lib/types'

interface GenerateSlidesModalProps {
  onClose: () => void
  onSuccess: (presentation: Presentation) => void
}

export default function GenerateSlidesModal({ onClose, onSuccess }: GenerateSlidesModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    presentationTitle: '',
    title: '',
    style: 'modern gradient blue purple, bold titles',
    notes: '',
  })
  
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
        body: JSON.stringify(formData),
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
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 m-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold">Generate Slides</h2>
          <button 
            onClick={onClose}
            className="text-muted hover:text-fg transition-colors"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Presentation Title
            </label>
            <input
              type="text"
              value={formData.presentationTitle}
              onChange={(e) => setFormData({ ...formData, presentationTitle: e.target.value })}
              className="w-full px-4 py-2 bg-surface-2 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Faith Over Fear — Week 1"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Topic/Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-surface-2 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Faith Over Fear"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Style Preferences
            </label>
            <input
              type="text"
              value={formData.style}
              onChange={(e) => setFormData({ ...formData, style: e.target.value })}
              className="w-full px-4 py-2 bg-surface-2 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., modern gradient, warm colors, bold titles"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Notes/Content
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 bg-surface-2 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary h-48 resize-none"
              placeholder="Paste your sermon notes, worship lyrics, or teaching points here..."
              required
            />
            <p className="text-xs text-muted mt-1">
              Minimum 10 characters, maximum 5000 characters
            </p>
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate Slides'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
