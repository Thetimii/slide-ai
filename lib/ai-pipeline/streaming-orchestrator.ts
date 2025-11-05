import { createBlob } from '../design-utils/blob-generator'
import { generateGradient, getThemedGradient } from '../design-utils/gradient-generator'
import { generateGrainTexture } from '../design-utils/texture-generator'
import { searchPexels, selectBestImage, type PexelsImage } from '../design-utils/pexels-client'
import { getIconForKeyword, type IconConfig } from '../design-utils/icon-mapper'
import type {
  UserInput,
  SlideSegment,
  LayoutPlan,
  SlideAssets,
  AssembledSlide,
  RefinementResult,
  CompositionType,
  LayoutElement,
} from './orchestrator'

// Progress update types
export interface ProgressUpdate {
  type: 'status' | 'slide_preview' | 'error' | 'complete'
  step?: string
  message?: string
  slideIndex?: number
  totalSlides?: number
  slidePreview?: Partial<AssembledSlide>
  percentage?: number
}

type ProgressCallback = (update: ProgressUpdate) => void

// ============= STREAMING ORCHESTRATOR =============
export async function generateSlidesWithProgress(
  input: UserInput,
  onProgress: ProgressCallback
): Promise<AssembledSlide[]> {
  onProgress({
    type: 'status',
    step: 'segmentation',
    message: '📝 Analyzing content and splitting into slides...',
    percentage: 5,
  })
  
  // Step 1-2: Segmentation
  const segments = await segmentText(input)
  
  onProgress({
    type: 'status',
    step: 'segmentation_complete',
    message: `✅ Created ${segments.length} slide outlines`,
    totalSlides: segments.length,
    percentage: 15,
  })
  
  const assembledSlides: AssembledSlide[] = []
  const progressPerSlide = 70 / segments.length // 70% of progress for slide processing
  
  // Process each slide
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const baseProgress = 15 + (i * progressPerSlide)
    
    onProgress({
      type: 'status',
      step: 'slide_start',
      message: `🎨 Designing slide ${i + 1}/${segments.length}: "${segment.title}"`,
      slideIndex: i + 1,
      totalSlides: segments.length,
      percentage: baseProgress,
    })
    
    // Step 3: Layout planning
    onProgress({
      type: 'status',
      step: 'layout',
      message: `  📐 Planning layout composition...`,
      slideIndex: i + 1,
      percentage: baseProgress + progressPerSlide * 0.2,
    })
    
    const layout = await planLayout(segment, input.style)
    
    onProgress({
      type: 'status',
      step: 'layout_complete',
      message: `  ✓ Layout: ${layout.composition}`,
      slideIndex: i + 1,
      percentage: baseProgress + progressPerSlide * 0.3,
    })
    
    // Step 4-8: Asset generation
    onProgress({
      type: 'status',
      step: 'assets',
      message: `  🖼️  Generating visuals (blobs, gradients, icons)...`,
      slideIndex: i + 1,
      percentage: baseProgress + progressPerSlide * 0.4,
    })
    
    const assets = await generateAssets(layout, segment, input.style, input.tone)
    
    if (assets.image) {
      onProgress({
        type: 'status',
        step: 'image_found',
        message: `  📸 Found image by ${assets.image.photographer}`,
        slideIndex: i + 1,
        percentage: baseProgress + progressPerSlide * 0.6,
      })
    }
    
    // Step 10: Assembly
    onProgress({
      type: 'status',
      step: 'assembling',
      message: `  🔧 Assembling slide elements...`,
      slideIndex: i + 1,
      percentage: baseProgress + progressPerSlide * 0.8,
    })
    
    const assembled = assembleSlide(segment, layout, assets, {
      improvements: [],
      final_score: 85,
    })
    
    assembledSlides.push(assembled)
    
    // Send slide preview
    onProgress({
      type: 'slide_preview',
      step: 'slide_complete',
      message: `✅ Slide ${i + 1} complete!`,
      slideIndex: i + 1,
      totalSlides: segments.length,
      slidePreview: assembled,
      percentage: baseProgress + progressPerSlide,
    })
  }
  
  onProgress({
    type: 'status',
    step: 'finalizing',
    message: '🎉 All slides designed! Finalizing presentation...',
    percentage: 95,
  })
  
  return assembledSlides
}

// ============= Helper Functions (from orchestrator) =============

async function segmentText(input: UserInput): Promise<SlideSegment[]> {
  const systemPrompt = `You are a presentation designer. Split the user's content into ${input.num_slides} logical slides with clear structure.

CRITICAL: Return ONLY valid JSON with properly escaped quotes. Do not include any markdown formatting or code fences.

Expected format:
{
  "slides": [
    {
      "slide_index": 1,
      "title": "Main Title",
      "subtitle": "Optional subtitle",
      "body_text": "Key points or description",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}

Rules:
- Extract 2-4 keywords per slide for visual search
- Keep titles short (3-7 words)
- Body text should be concise (15-40 words)
- Escape any quotes in text with backslash: \\"
- Do not use line breaks within strings`

  const userPrompt = input.use_word_for_word
    ? `Use this text word-for-word, split into ${input.num_slides} slides:\n\n${input.prompt}`
    : `Transform this into ${input.num_slides} professional slides:\n\n${input.prompt}\n\nTone: ${input.tone}\nStyle: ${input.style}`

  const response = await callOpenRouterFree({ systemPrompt, userPrompt })

  if (!response || !Array.isArray(response.slides)) {
    return getDefaultSegments(input)
  }

  return response.slides.map((slide: any, idx: number) => ({
    slide_index: slide.slide_index || idx + 1,
    title: slide.title || `Slide ${idx + 1}`,
    subtitle: slide.subtitle || '',
    body_text: slide.body_text || '',
    keywords: Array.isArray(slide.keywords) ? slide.keywords : ['presentation', 'slide'],
  }))
}

function getDefaultSegments(input: UserInput): SlideSegment[] {
  const segments: SlideSegment[] = []
  const lines = input.prompt.split('\n').filter(l => l.trim())
  
  for (let i = 0; i < input.num_slides; i++) {
    segments.push({
      slide_index: i + 1,
      title: lines[i] || `Slide ${i + 1}`,
      subtitle: '',
      body_text: lines[i] || input.prompt.substring(0, 100),
      keywords: ['presentation', 'slide'],
    })
  }
  
  return segments
}

async function planLayout(segment: SlideSegment, style: string): Promise<LayoutPlan> {
  const systemPrompt = `You are a visual designer. Plan element positions for a 1600x900px slide using professional composition rules.

CRITICAL: Return ONLY valid JSON. Do not include markdown formatting or code fences.

Expected format:
{
  "composition": "rule_of_thirds",
  "elements": [
    {"type": "headline", "x": 100, "y": 200, "width": 1400, "align": "left"},
    {"type": "body", "x": 100, "y": 350, "width": 700},
    {"type": "image_placeholder", "x": 900, "y": 200, "width": 600, "height": 500},
    {"type": "blob", "x": 50, "y": 600, "width": 400, "height": 300},
    {"type": "icon_placeholder", "x": 1400, "y": 750}
  ]
}

Composition types: "rule_of_thirds", "centered", "asymmetric"
Element types: "headline", "body", "image_placeholder", "blob", "icon_placeholder"

Rules:
- rule_of_thirds: Align on 1/3 intersections (x: 533, 1067; y: 300, 600)
- centered: Symmetric, title at top center
- asymmetric: Dynamic, off-center, balanced
- Always include headline and at least one decorative element
- Style: ${style}`

  const userPrompt = `Slide ${segment.slide_index}:
Title: ${segment.title}
Subtitle: ${segment.subtitle}
Body: ${segment.body_text}
Keywords: ${segment.keywords.join(', ')}

Plan layout positions.`

  const response = await callOpenRouterFree({ systemPrompt, userPrompt })

  if (!response || !Array.isArray(response.elements)) {
    return getDefaultLayout(segment)
  }

  return response
}

function getDefaultLayout(segment: SlideSegment): LayoutPlan {
  return {
    composition: 'centered',
    elements: [
      { type: 'headline', x: 100, y: 250, width: 1400, align: 'center' },
      { type: 'body', x: 200, y: 450, width: 1200, align: 'center' },
      { type: 'blob', x: 50, y: 650, width: 300, height: 250 },
      { type: 'icon_placeholder', x: 1350, y: 700 },
    ],
  }
}

async function generateAssets(
  layout: LayoutPlan,
  segment: SlideSegment,
  style: string,
  tone: string
): Promise<SlideAssets> {
  const gradient = getThemedGradient(style)
  const elements = Array.isArray(layout?.elements) ? layout.elements : []
  
  const blobs: SlideAssets['blobs'] = []
  elements
    .filter((e) => e.type === 'blob')
    .forEach((elem) => {
      const blobData = createBlob({
        seed: `slide-${segment.slide_index}`,
        complexity: 0.6,
        contrast: 0.5,
        color: gradient.params.colors[0],
      })
      blobs.push({
        svg: blobData.svg,
        x: elem.x,
        y: elem.y,
        width: elem.width || 400,
        height: elem.height || 400,
        color: gradient.params.colors[0],
      })
    })
  
  const icons: IconConfig[] = []
  elements
    .filter((e) => e.type === 'icon_placeholder')
    .forEach((elem, idx) => {
      const keyword = segment.keywords[idx] || 'default'
      icons.push({
        name: getIconForKeyword(keyword),
        variant: 'outline',
        color: gradient.params.colors[0],
        size: 48,
        position: { x: elem.x, y: elem.y },
      })
    })
  
  const texture = generateGrainTexture(1600, 900, 0.2)
  
  const primaryKeyword = segment.keywords[0] || 'abstract'
  const images = await searchPexels(primaryKeyword, 'landscape', 15)
  const image = images.length > 0 ? selectBestImage(images, tone) : null
  
  return {
    blobs,
    gradient: {
      css: gradient.css,
      type: gradient.params.type,
      colors: gradient.params.colors,
    },
    icons,
    texture: {
      dataUrl: texture.dataUrl,
      opacity: texture.params.opacity,
    },
    image,
  }
}

function assembleSlide(
  segment: SlideSegment,
  layout: LayoutPlan,
  assets: SlideAssets,
  refinement: RefinementResult
): AssembledSlide {
  const elements = Array.isArray(layout?.elements) ? layout.elements : []
  const imagePlaceholder = elements.find((e) => e.type === 'image_placeholder')
  
  return {
    background: {
      gradient: {
        from: assets.gradient.colors[0],
        to: assets.gradient.colors[1] || assets.gradient.colors[0],
        angle: 135,
        type: assets.gradient.type,
      },
      texture: {
        type: 'grain',
        opacity: assets.texture.opacity,
        dataUrl: assets.texture.dataUrl,
      },
    },
    shapes: assets.blobs.map((blob) => ({
      type: 'blob',
      seed: `slide-${segment.slide_index}`,
      color: blob.color,
      complexity: 0.6,
      contrast: 0.5,
      svg: blob.svg,
      x: blob.x,
      y: blob.y,
      width: blob.width,
      height: blob.height,
    })),
    icons: assets.icons,
    image: assets.image
      ? {
          url: assets.image.src.large,
          photographer: assets.image.photographer,
          fit: 'cover',
          x: imagePlaceholder?.x,
          y: imagePlaceholder?.y,
          width: imagePlaceholder?.width,
          height: imagePlaceholder?.height,
        }
      : null,
    text: {
      headline: segment.title,
      subtext: segment.subtitle,
      body: segment.body_text,
      color: '#111111',
      font: 'DM Sans',
    },
    meta: {
      slide_index: segment.slide_index,
      composition: layout.composition,
      score: refinement.final_score,
      keywords: segment.keywords,
    },
  }
}

async function callOpenRouterFree({
  systemPrompt,
  userPrompt,
}: {
  systemPrompt: string
  userPrompt: string
}): Promise<any> {
  const apiKey = process.env.OPENROUTER_API_KEY
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured')
  }
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b:free',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('OpenRouter error:', errorText)
    throw new Error(`OpenRouter API error: ${response.status}`)
  }
  
  const data = await response.json()
  const content = data.choices[0].message.content
  
  // Safely extract and parse JSON from AI response
  try {
    // Try to extract JSON from code fences first
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
    const cleanJson = jsonMatch ? jsonMatch[1].trim() : content.trim()
    
    return JSON.parse(cleanJson)
  } catch (parseError) {
    console.error('Failed to parse AI JSON response:', {
      error: parseError instanceof Error ? parseError.message : String(parseError),
      content: content.substring(0, 500), // First 500 chars for debugging
      contentLength: content.length,
    })
    
    // Try one more time with just the raw content
    try {
      return JSON.parse(content)
    } catch {
      throw new Error('AI returned invalid JSON. Please try again.')
    }
  }
}
