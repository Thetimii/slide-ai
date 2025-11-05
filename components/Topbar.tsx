'use client'

import { useEditorStore } from '@/lib/store'

interface TopbarProps {
  onGenerateClick: () => void
}

export default function Topbar({ onGenerateClick }: TopbarProps) {
  const { presentation, toggleRightPanel, isRightPanelOpen, toggleDarkMode, isDarkMode, lastSaved } = useEditorStore()
  
  // Format last saved time
  const formatLastSaved = (date: Date | null) => {
    if (!date) return 'Not saved'
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 10) return 'Saved just now'
    if (seconds < 60) return `Saved ${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `Saved ${minutes}m ago`
    return 'Saved'
  }
  
  return (
    <div className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-1 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="font-heading text-xl font-bold text-gray-900 dark:text-white">Slide Builder</h1>
        {presentation && (
          <>
            <span className="text-gray-600 dark:text-muted text-sm">
              {presentation.title || 'Untitled Presentation'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatLastSaved(lastSaved)}
            </span>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleDarkMode}
          className="p-2 hover:bg-gray-100 dark:hover:bg-surface-2 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          )}
        </button>

        {/* Panel Toggle */}
        <button 
          onClick={toggleRightPanel}
          className="p-2 hover:bg-gray-100 dark:hover:bg-surface-2 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
          title={isRightPanelOpen ? 'Hide inspector' : 'Show inspector'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        </button>

        <button onClick={onGenerateClick} className="btn-secondary text-sm">
          Generate New
        </button>
        
        <button className="btn-primary text-sm">
          Export
        </button>
      </div>
    </div>
  )
}
