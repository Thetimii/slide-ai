import { z } from 'zod'

// ============ DATABASE TYPES ============

export interface User {
  id: string
  email: string | null
  is_demo: boolean
  created_at: string
}

export interface Presentation {
  id: string
  user_id: string
  title: string | null
  slides_json: SlidesJSON
  created_at: string
}

export interface PromptHistory {
  id: string
  user_id: string
  input_text: string
  ai_response: any
  created_at: string
}

export interface Export {
  id: string
  user_id: string
  presentation_id: string
  format: 'PNG' | 'PDF' | 'PPTX'
  file_path: string | null
  created_at: string
}

export interface TransferLink {
  id: string
  demo_user_id: string
  real_user_id: string | null
  claimed: boolean
  created_at: string
}

// ============ SLIDE SCHEMA ============

export type BackgroundType = 'solid' | 'gradient' | 'image'

export interface SolidBackground {
  color: string
}

export interface GradientBackground {
  angle: number
  colors: string[]
}

export interface ImageBackground {
  url: string
}

export interface Background {
  type: BackgroundType
  solid?: SolidBackground
  gradient?: GradientBackground
  image?: ImageBackground
}

export type ElementType = 'text' | 'rect' | 'image' | 'shape'

export interface ElementProps {
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  opacity?: number
  zIndex?: number
}

export interface ElementStyle {
  fontFamily?: string
  fontSize?: number
  fontWeight?: number
  fill?: string
  align?: 'left' | 'center' | 'right'
  letterSpacing?: number
  lineHeight?: number
  radius?: number
}

export interface SlideElement {
  id: string
  type: ElementType
  props: ElementProps
  style?: ElementStyle
  content?: string // text content or image URL
}

export interface SlideMeta {
  title: string
  notes?: string
  theme: string
}

export interface Slide {
  id: string
  background: Background
  elements: SlideElement[]
  meta: SlideMeta
}

export interface SlidesJSON {
  slides: Slide[]
}

// ============ AI RESPONSE SCHEMA ============

// Schema returned by OpenRouter AI
export const AISlideSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  theme: z.string().min(1),
  layout: z.enum(['hero', 'split', 'minimal', 'quote', 'focus']).optional().default('hero'),
})

export const AISlidesResponseSchema = z.object({
  slides: z.array(AISlideSchema),
})

export type AISlide = z.infer<typeof AISlideSchema>
export type AISlidesResponse = z.infer<typeof AISlidesResponseSchema>

// ============ API REQUEST/RESPONSE TYPES ============

export interface GenerateSlidesRequest {
  title: string
  style: string
  notes: string
  presentationTitle: string
}

export interface GenerateSlidesResponse {
  presentation: Presentation
}

export interface CreateDemoUserResponse {
  user: User
  session: any
}

export interface TransferDemoDataRequest {
  demo_user_id: string
}

export interface ExportRequest {
  presentation_id: string
  format: 'PNG' | 'PDF' | 'PPTX'
}

export interface ExportResponse {
  export: Export
  signedUrl: string
}

// ============ THEME PRESETS ============

export interface ThemePreset {
  name: string
  background: Background
  titleStyle: ElementStyle
  bodyStyle: ElementStyle
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
  'modern-blue': {
    name: 'Modern Blue',
    background: {
      type: 'gradient',
      gradient: {
        angle: 32,
        colors: ['#0B1220', '#1C2B4A'],
      },
    },
    titleStyle: {
      fontFamily: 'DM Sans',
      fontSize: 72,
      fontWeight: 700,
      fill: '#FFFFFF',
      align: 'center',
    },
    bodyStyle: {
      fontFamily: 'Inter',
      fontSize: 36,
      fontWeight: 500,
      fill: '#E6E9EF',
      align: 'center',
      lineHeight: 1.5,
    },
  },
  'minimal-light': {
    name: 'Minimal Light',
    background: {
      type: 'solid',
      solid: {
        color: '#FFFFFF',
      },
    },
    titleStyle: {
      fontFamily: 'DM Sans',
      fontSize: 68,
      fontWeight: 700,
      fill: '#0B0D0F',
      align: 'center',
    },
    bodyStyle: {
      fontFamily: 'Inter',
      fontSize: 34,
      fontWeight: 400,
      fill: '#1A1D22',
      align: 'center',
      lineHeight: 1.5,
    },
  },
  'warm-gradient': {
    name: 'Warm Gradient',
    background: {
      type: 'gradient',
      gradient: {
        angle: 135,
        colors: ['#2D1810', '#5C3A21'],
      },
    },
    titleStyle: {
      fontFamily: 'DM Sans',
      fontSize: 70,
      fontWeight: 700,
      fill: '#F5C26B',
      align: 'center',
    },
    bodyStyle: {
      fontFamily: 'Inter',
      fontSize: 36,
      fontWeight: 400,
      fill: '#F2F3F5',
      align: 'center',
      lineHeight: 1.5,
    },
  },
  'dark-elegant': {
    name: 'Dark Elegant',
    background: {
      type: 'solid',
      solid: {
        color: '#0A0A0A',
      },
    },
    titleStyle: {
      fontFamily: 'DM Sans',
      fontSize: 75,
      fontWeight: 700,
      fill: '#FFFFFF',
      align: 'center',
      letterSpacing: -1,
    },
    bodyStyle: {
      fontFamily: 'Inter',
      fontSize: 36,
      fontWeight: 300,
      fill: '#A0A0A0',
      align: 'center',
      lineHeight: 1.7,
    },
  },
  'ocean-depth': {
    name: 'Ocean Depth',
    background: {
      type: 'gradient',
      gradient: {
        angle: 180,
        colors: ['#0C2340', '#16425B', '#1A5F7A'],
      },
    },
    titleStyle: {
      fontFamily: 'DM Sans',
      fontSize: 72,
      fontWeight: 700,
      fill: '#FFFFFF',
      align: 'center',
    },
    bodyStyle: {
      fontFamily: 'Inter',
      fontSize: 36,
      fontWeight: 400,
      fill: '#E0F4FF',
      align: 'center',
      lineHeight: 1.5,
    },
  },
  'sunset-glow': {
    name: 'Sunset Glow',
    background: {
      type: 'gradient',
      gradient: {
        angle: 45,
        colors: ['#1A1A2E', '#3E2C41', '#4A1C40'],
      },
    },
    titleStyle: {
      fontFamily: 'DM Sans',
      fontSize: 70,
      fontWeight: 700,
      fill: '#FFB6C1',
      align: 'center',
    },
    bodyStyle: {
      fontFamily: 'Inter',
      fontSize: 34,
      fontWeight: 400,
      fill: '#FFC8D3',
      align: 'center',
      lineHeight: 1.6,
    },
  },
}

// Canvas dimensions for the editor
export const CANVAS_WIDTH = 1600
export const CANVAS_HEIGHT = 900
