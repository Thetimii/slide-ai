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
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
  }, [isDarkMode, mounted])
  
  if (!mounted) {
    return <>{children}</>
  }
  
  return <>{children}</>
}
