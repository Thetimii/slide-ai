'use client'

import { useState, useCallback } from 'react'
import type { Presentation } from '@/lib/types'

export interface StreamProgress {
  type: 'status' | 'slide_preview' | 'error' | 'complete'
  step?: string
  message?: string
  slideIndex?: number
  totalSlides?: number
  slidePreview?: any
  percentage?: number
  presentation?: Presentation
}

export interface UseStreamingSlidesReturn {
  isGenerating: boolean
  progress: StreamProgress | null
  error: string | null
  generateSlides: (data: any) => Promise<void>
  cancel: () => void
}

export function useStreamingSlides(): UseStreamingSlidesReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<StreamProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  const cancel = useCallback(() => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      setIsGenerating(false)
      setError('Generation cancelled')
    }
  }, [abortController])

  const generateSlides = useCallback(async (data: any) => {
    setIsGenerating(true)
    setError(null)
    setProgress(null)

    const controller = new AbortController()
    setAbortController(controller)

    try {
      const response = await fetch('/api/generate-slides-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonData = line.slice(6)
            try {
              const update: StreamProgress = JSON.parse(jsonData)
              setProgress(update)

              if (update.type === 'error') {
                setError(update.message || 'An error occurred')
                setIsGenerating(false)
              } else if (update.type === 'complete') {
                setIsGenerating(false)
                // Success - presentation is in update.presentation
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError)
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Generation cancelled')
      } else {
        setError(err.message || 'Failed to generate slides')
      }
      setIsGenerating(false)
    } finally {
      setAbortController(null)
    }
  }, [])

  return {
    isGenerating,
    progress,
    error,
    generateSlides,
    cancel,
  }
}
