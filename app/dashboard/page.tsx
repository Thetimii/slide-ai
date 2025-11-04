'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEditorStore } from '@/lib/store'
import { Presentation } from '@/lib/types'
import EditorCanvas from '@/components/EditorCanvas'
import SlidesList from '@/components/SlidesList'
import RightInspector from '@/components/RightInspector'
import Topbar from '@/components/Topbar'
import GenerateSlidesModal from '@/components/GenerateSlidesModal'
import ThemeProvider from '@/components/ThemeProvider'

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const { presentation, setPresentation } = useEditorStore()
  const isRightPanelOpen = useEditorStore(state => state.isRightPanelOpen)
  const supabase = createClient()
  
  useEffect(() => {
    initializeUser()
  }, [])
  
  async function initializeUser() {
    try {
      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Create demo user
        const response = await fetch('/api/create-demo-user', {
          method: 'POST',
        })
        
        if (!response.ok) {
          throw new Error('Failed to create demo user')
        }
        
        const { session: newSession } = await response.json()
        
        // Set the session
        await supabase.auth.setSession({
          access_token: newSession.access_token,
          refresh_token: newSession.refresh_token,
        })
      }
      
      // Load user's presentations
      await loadPresentations()
    } catch (error) {
      console.error('Failed to initialize user:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  async function loadPresentations() {
    const { data, error } = await supabase
      .from('presentations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) {
      console.error('Failed to load presentations:', error)
      return
    }
    
    if (data && data.length > 0) {
      setPresentation(data[0] as Presentation)
    } else {
      // Show generate modal if no presentations
      setShowGenerateModal(true)
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Loading workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-gray-900 light:bg-gray-50">
        {/* Left Sidebar - Slides List */}
        <div className="w-64 border-r border-gray-700 light:border-gray-200">
          <SlidesList />
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          <Topbar onGenerateClick={() => setShowGenerateModal(true)} />
          <EditorCanvas />
        </div>

        {/* Right Inspector Panel */}
        <div 
          className={`border-l border-gray-700 light:border-gray-200 transition-all duration-300 ease-in-out ${
            isRightPanelOpen ? 'w-80' : 'w-0 overflow-hidden'
          }`}
        >
          <RightInspector />
        </div>
      </div>
      
      {showGenerateModal && (
        <GenerateSlidesModal 
          onClose={() => setShowGenerateModal(false)} 
          onSuccess={async () => {
            setShowGenerateModal(false)
            await loadPresentations()
          }}
        />
      )}
    </ThemeProvider>
  )
}
