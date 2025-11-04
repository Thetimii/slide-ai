import { z } from 'zod'

export interface SlideInput {
  id: string
  content: string
}

export interface OpenRouterRequest {
  theme: string
  style: string
  slides: SlideInput[]
  useUniformDesign: boolean
  useVerbatim: boolean
}

// Cinematic slide element schema
const ElementSchema = z.object({
  type: z.enum(['text', 'shape', 'gradient', 'image']),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  content: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.string().optional(),
  color: z.string().optional(),
  opacity: z.number().optional(),
  rotation: z.number().optional(),
  blur: z.number().optional(),
  shadow: z.object({
    x: z.number(),
    y: z.number(),
    blur: z.number(),
    color: z.string(),
  }).optional(),
  gradient: z.object({
    type: z.enum(['linear', 'radial']),
    colors: z.array(z.string()),
    angle: z.number().optional(),
  }).optional(),
  animation: z.object({
    type: z.enum(['fadeIn', 'slideIn', 'scale', 'none']),
    duration: z.number(),
    delay: z.number(),
  }).optional(),
  texture: z.string().optional(),
  parallaxDepth: z.number().optional(),
})

const CinematicSlideSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  mood: z.string(),
  composition: z.string(),
  background: z.object({
    type: z.enum(['solid', 'gradient', 'image']),
    colors: z.array(z.string()).optional(),
    gradientAngle: z.number().optional(),
    imageUrl: z.string().optional(),
    blur: z.number().optional(),
  }),
  elements: z.array(ElementSchema),
})

const CinematicResponseSchema = z.object({
  meta: z.object({
    theme: z.string(),
    totalSlides: z.number(),
    uniformDesign: z.boolean(),
  }),
  slides: z.array(CinematicSlideSchema),
})

export async function callOpenRouter(request: OpenRouterRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }
  
  const systemPrompt = `You are a professional visual designer specializing in cinematic presentation design. 
Generate a JSON following the schema below. Each slide must look like it was designed by a real designer — soft gradients, good typography rhythm, spacing, motion, texture, and color harmony. 
Do not make anything childish or PowerPoint-like.

REQUIRED JSON SCHEMA:
{
  "meta": {
    "theme": string,
    "totalSlides": number,
    "uniformDesign": boolean
  },
  "slides": [
    {
      "id": string,
      "title": string (optional),
      "mood": string (e.g., "calm", "energetic", "reverent", "bold"),
      "composition": string (e.g., "centered", "asymmetric", "split", "layered"),
      "background": {
        "type": "solid" | "gradient" | "image",
        "colors": [string, string?],
        "gradientAngle": number (0-360),
        "blur": number (0-20)
      },
      "elements": [
        {
          "type": "text" | "shape" | "gradient",
          "x": number (0-1600),
          "y": number (0-900),
          "width": number,
          "height": number,
          "content": string (for text),
          "fontSize": number (16-180),
          "fontFamily": "'Inter', 'Playfair Display', 'Montserrat', 'Crimson Pro'",
          "fontWeight": "300" | "400" | "600" | "700" | "900",
          "color": string (hex),
          "opacity": number (0-1),
          "rotation": number (-45 to 45),
          "blur": number (0-15),
          "shadow": {
            "x": number,
            "y": number,
            "blur": number,
            "color": string
          },
          "gradient": {
            "type": "linear" | "radial",
            "colors": [string, string],
            "angle": number
          },
          "animation": {
            "type": "fadeIn" | "slideIn" | "scale" | "none",
            "duration": number (0.3-2),
            "delay": number (0-1)
          },
          "texture": "grain" | "noise" | "none",
          "parallaxDepth": number (0-5)
        }
      ]
    }
  ]
}

DESIGN PRINCIPLES:
1. Typography Hierarchy: Use font sizes from 16px (captions) to 180px (hero titles)
2. Spacing & Rhythm: Elements should breathe, use rule of thirds
3. Color Harmony: Stick to 2-3 main colors, use opacity for depth
4. Motion: Subtle animations (fadeIn, slideIn), stagger delays
5. Texture: Add grain/noise overlays at 0.05-0.15 opacity for warmth
6. Shadows: Soft, realistic shadows (10-40px blur)
7. Gradients: Smooth, multi-stop gradients (not harsh)
8. Composition: Asymmetric layouts are more professional than centered

THEME INTERPRETATIONS:
- "Modern Cinematic": Deep blues/purples, large sans-serif, dramatic shadows
- "Minimal Elegant": Whites/grays, serif fonts, lots of negative space
- "Bold Typography": Huge text (120-180px), high contrast, geometric shapes
- "Soft Gradients": Pastel gradients, rounded shapes, gentle animations
- "Dark Moody": Dark backgrounds (#0a0a0a-#1a1a1a), gold/white accents
- "Light Airy": Light backgrounds (#f5f5f5-#ffffff), subtle colors

IMPORTANT:
- Canvas is 1600×900px
- If useUniformDesign=true, use same composition/colors across all slides
- If useVerbatim=true, use exact user text without rewriting
- Each slide should have 3-8 elements (text + decorative shapes)
- Always include subtle background gradients or textures
- Use font weights strategically: 300 for elegance, 700-900 for impact`

  const slidesDescription = request.slides
    .map((s, i) => `Slide ${i + 1}: ${s.content}`)
    .join('\n\n')

  const userPrompt = `THEME: ${request.theme}
STYLE: ${request.style}
UNIFORM DESIGN: ${request.useUniformDesign ? 'Yes - maintain consistent design language' : 'No - vary designs'}
USE VERBATIM TEXT: ${request.useVerbatim ? 'Yes - use exact text provided' : 'No - you can refine text'}
NUMBER OF SLIDES: ${request.slides.length}

SLIDE CONTENT:
${slidesDescription}

Generate ${request.slides.length} cinematic slides. Return ONLY valid JSON matching the schema above.`

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 4000,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter API error:', errorText)
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response structure from OpenRouter')
    }
    
    const content = data.choices[0].message.content
    let parsedContent: any
    
    try {
      parsedContent = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse AI response:', content)
      throw new Error('AI returned invalid JSON')
    }
    
    // Validate with Zod
    const validated = CinematicResponseSchema.parse(parsedContent)
    
    return validated
  } catch (error) {
    console.error('OpenRouter call failed:', error)
    throw error
  }
}
