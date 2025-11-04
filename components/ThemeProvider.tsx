'use client'

import { useEffect } from 'react'
import { useEditorStore } from '@/lib/store'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isDarkMode = useEditorStore(state => state.isDarkMode)
  
  useEffect(() => {
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
  }, [isDarkMode])
  
  return <>{children}</>
}
