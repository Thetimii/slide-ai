import { createBlob } from '../design-utils/blob-generator'
import { generateGradient, getThemedGradient } from '../design-utils/gradient-generator'
import { generateGrainTexture } from '../design-utils/texture-generator'
import { searchPexels, selectBestImage, type PexelsImage } from '../design-utils/pexels-client'
import { getIconForKeyword, type IconConfig } from '../design-utils/icon-mapper'

// ============= STEP 1: User Input Schema =============
export interface UserInput {
  prompt: string
  num_slides: number
  tone: string
  style: string
  use_word_for_word: boolean
}

// ============= STEP 2: Text Segmentation =============
export interface SlideSegment {
  slide_index: number
  title: string
  subtitle: string
  body_text: string
  keywords: string[]
}

export async function segmentText(input: UserInput): Promise<SlideSegment[]> {
  const systemPrompt = `You are a presentation designer. Split the user's content into ${input.num_slides} logical slides with clear structure.

Return valid JSON:
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

Extract 2-4 keywords per slide for visual search. Keep titles short (3-7 words). Body text should be concise (15-40 words).`

  const userPrompt = input.use_word_for_word
    ? `Use this text word-for-word, split into ${input.num_slides} slides:\n\n${input.prompt}`
    : `Transform this into ${input.num_slides} professional slides:\n\n${input.prompt}\n\nTone: ${input.tone}\nStyle: ${input.style}`

  const response = await callOpenRouterFree({
    systemPrompt,
    userPrompt,
  })

  // Validate response
  if (!response || !Array.isArray(response.slides)) {
    console.warn('AI returned invalid segmentation, using fallback')
    return getDefaultSegments(input)
  }

  // Ensure each slide has required fields
  return response.slides.map((slide: any, idx: number) => ({
    slide_index: slide.slide_index || idx + 1,
    title: slide.title || `Slide ${idx + 1}`,
    subtitle: slide.subtitle || '',
    body_text: slide.body_text || '',
    keywords: Array.isArray(slide.keywords) ? slide.keywords : ['presentation', 'slide'],
  }))
}

// Fallback segmentation when AI fails
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

// ============= STEP 3: Layout Planning =============
export type CompositionType = 'rule_of_thirds' | 'centered' | 'asymmetric'

export interface LayoutElement {
  type: 'headline' | 'body' | 'image_placeholder' | 'icon_placeholder' | 'blob'
  x: number // 0-1600
  y: number // 0-900
  width?: number
  height?: number
  align?: 'left' | 'center' | 'right'
}

export interface LayoutPlan {
  composition: CompositionType
  elements: LayoutElement[]
}

export async function planLayout(segment: SlideSegment, style: string): Promise<LayoutPlan> {
  const systemPrompt = `You are a visual designer. Plan element positions for a 1600x900px slide using professional composition rules.

Return valid JSON:
{
  "composition": "rule_of_thirds" | "centered" | "asymmetric",
  "elements": [
    {"type": "headline", "x": 100, "y": 200, "width": 1400, "align": "left"},
    {"type": "body", "x": 100, "y": 350, "width": 700},
    {"type": "image_placeholder", "x": 900, "y": 200, "width": 600, "height": 500},
    {"type": "blob", "x": 50, "y": 600, "width": 400, "height": 300},
    {"type": "icon_placeholder", "x": 1400, "y": 750}
  ]
}

Rules:
- rule_of_thirds: Align key elements on 1/3 intersections (533, 1067 for x; 300, 600 for y)
- centered: Symmetric, title at top center, content centered
- asymmetric: Dynamic, off-center composition, visual weight balanced
- Always include headline and at least one decorative element (blob or icon)
- Style: ${style}`

  const userPrompt = `Slide ${segment.slide_index}:
Title: ${segment.title}
Subtitle: ${segment.subtitle}
Body: ${segment.body_text}
Keywords: ${segment.keywords.join(', ')}

Plan layout positions.`

  const response = await callOpenRouterFree({
    systemPrompt,
    userPrompt,
  })

  // Validate and provide fallback if AI returns invalid structure
  if (!response || !Array.isArray(response.elements)) {
    console.warn('AI returned invalid layout, using fallback')
    return getDefaultLayout(segment)
  }

  return response
}

// Fallback layout when AI fails
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

// ============= STEP 4: Image Selection =============
export async function selectImage(keywords: string[], tone: string): Promise<PexelsImage | null> {
  // Try first keyword
  const primaryKeyword = keywords[0] || 'abstract'
  const images = await searchPexels(primaryKeyword, 'landscape', 15)
  
  if (images.length > 0) {
    return selectBestImage(images, tone)
  }
  
  // Fallback to second keyword
  if (keywords[1]) {
    const fallbackImages = await searchPexels(keywords[1], 'landscape', 15)
    if (fallbackImages.length > 0) {
      return selectBestImage(fallbackImages, tone)
    }
  }
  
  return null
}

// ============= STEP 5-8: Asset Generation =============
export interface SlideAssets {
  blobs: Array<{ svg: string; x: number; y: number; width: number; height: number; color: string }>
  gradient: { css: string; type: string; colors: string[] }
  icons: IconConfig[]
  texture: { dataUrl: string; opacity: number }
  image: PexelsImage | null
}

export async function generateAssets(
  layout: LayoutPlan,
  segment: SlideSegment,
  style: string,
  tone: string
): Promise<SlideAssets> {
  // Get themed gradient
  const gradient = getThemedGradient(style)
  
  // Ensure layout.elements exists and is an array
  const elements = Array.isArray(layout?.elements) ? layout.elements : []
  
  // Generate blobs for decorative elements
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
  
  // Map icons from keywords
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
  
  // Generate texture (client-side only, server returns placeholder)
  const texture = generateGrainTexture(1600, 900, 0.2)
  
  // Search for image
  const image = await selectImage(segment.keywords, tone)
  
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

// ============= STEP 9: AI Refinement =============
export interface RefinementResult {
  improvements: string[]
  final_score: number
}

export async function refineSlide(
  slide: AssembledSlide
): Promise<RefinementResult> {
  const systemPrompt = `You are a design critic. Evaluate this slide design and suggest improvements.

Consider:
- Visual hierarchy (is the headline prominent?)
- Color contrast (is text readable?)
- Spacing (does it breathe?)
- Balance (is weight distributed well?)
- Harmony (do colors work together?)

Return JSON:
{
  "improvements": ["suggestion 1", "suggestion 2"],
  "final_score": 85
}

Score 0-100 where 90+ is excellent, 70-89 is good, below 70 needs work.`

  const userPrompt = `Evaluate this slide:
Title: ${slide.text.headline}
Composition: ${slide.meta.composition}
Background: ${slide.background.gradient.type} gradient
Elements: ${slide.shapes.length} shapes, ${slide.icons.length} icons
Has image: ${slide.image ? 'yes' : 'no'}`

  const response = await callOpenRouterFree({
    systemPrompt,
    userPrompt,
  })

  return response
}

// ============= STEP 10: Final Assembly =============
export interface AssembledSlide {
  background: {
    gradient: {
      from: string
      to: string
      angle: number
      type: string
    }
    texture: {
      type: string
      opacity: number
      dataUrl?: string
    }
  }
  shapes: Array<{
    type: 'blob'
    seed: string
    color: string
    complexity: number
    contrast: number
    svg: string
    x: number
    y: number
    width: number
    height: number
  }>
  icons: Array<{
    name: string
    color: string
    variant: 'outline' | 'solid'
    position: { x: number; y: number }
    size: number
  }>
  image: {
    url: string
    photographer: string
    fit: 'cover' | 'contain'
    x?: number
    y?: number
    width?: number
    height?: number
  } | null
  text: {
    headline: string
    subtext: string
    body: string
    color: string
    font: string
  }
  meta: {
    slide_index: number
    composition: CompositionType
    score: number
    keywords: string[]
  }
}

export function assembleSlide(
  segment: SlideSegment,
  layout: LayoutPlan,
  assets: SlideAssets,
  refinement: RefinementResult
): AssembledSlide {
  // Safely access layout.elements
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

// ============= MAIN ORCHESTRATOR =============
export async function generateSlidesFullPipeline(
  input: UserInput
): Promise<AssembledSlide[]> {
  console.log('🚀 Starting AI slide generation pipeline...')
  
  // Step 1-2: Segmentation
  console.log('📝 Step 1-2: Segmenting text into slides...')
  const segments = await segmentText(input)
  
  const assembledSlides: AssembledSlide[] = []
  
  // Process each slide
  for (const segment of segments) {
    console.log(`🎨 Processing slide ${segment.slide_index}/${segments.length}`)
    
    // Step 3: Layout planning
    console.log('  📐 Step 3: Planning layout...')
    const layout = await planLayout(segment, input.style)
    
    // Step 4-8: Asset generation
    console.log('  🖼️  Step 4-8: Generating assets...')
    const assets = await generateAssets(layout, segment, input.style, input.tone)
    
    // Step 10: Assembly (skip refinement for speed, or do it async)
    console.log('  🔧 Step 10: Assembling slide...')
    const assembled = assembleSlide(segment, layout, assets, {
      improvements: [],
      final_score: 85,
    })
    
    assembledSlides.push(assembled)
  }
  
  console.log('✅ Pipeline complete!')
  return assembledSlides
}

// ============= HELPER: Call OpenRouter Free Model =============
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
  
  return JSON.parse(content)
}
