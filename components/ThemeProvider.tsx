'use client'

import { useEffect, useState } from 'react'
import { useEditorStore } from '@/lib/store'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const isDarkMode = useEditorStore(state => mounted ? state.isDarkMode : true)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (!mounted) return
    
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.remove('light')
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
    }
  }, [isDarkMode, mounted])
  
  if (!mounted) {
    // Return with default dark theme during SSR
    return <div className="dark">{children}</div>
  }
  
  return <div className={isDarkMode ? 'dark' : 'light'}>{children}</div>
}
