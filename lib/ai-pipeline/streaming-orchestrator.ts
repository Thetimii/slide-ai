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
  console.log('\n========================================')
  console.log('🚀 STARTING SLIDE GENERATION PIPELINE')
  console.log('========================================')
  console.log('Input:', {
    promptLength: input.prompt.length,
    numSlides: input.num_slides,
    tone: input.tone,
    style: input.style,
    useWordForWord: input.use_word_for_word,
  })
  
  onProgress({
    type: 'status',
    step: 'segmentation',
    message: '📝 Analyzing content and splitting into slides...',
    percentage: 5,
  })
  
  // Step 1-2: Segmentation
  console.log('\n--- STEP 1: SEGMENTATION ---')
  const segments = await segmentText(input)
  console.log('✅ Segmentation complete:', segments.length, 'slides')
  console.log('Slide titles:', segments.map(s => s.title))
  
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
    
    console.log(`\n--- PROCESSING SLIDE ${i + 1}/${segments.length} ---`)
    console.log('Title:', segment.title)
    console.log('Keywords:', segment.keywords.join(', '))
    
    onProgress({
      type: 'status',
      step: 'slide_start',
      message: `🎨 Designing slide ${i + 1}/${segments.length}: "${segment.title}"`,
      slideIndex: i + 1,
      totalSlides: segments.length,
      percentage: baseProgress,
    })
    
    // Step 3: Layout planning
    console.log('  → Planning layout...')
    onProgress({
      type: 'status',
      step: 'layout',
      message: `  📐 Planning layout composition...`,
      slideIndex: i + 1,
      percentage: baseProgress + progressPerSlide * 0.2,
    })
    
    const layout = await planLayout(segment, input.style)
    console.log('  ✅ Layout complete:', layout.composition, `(${layout.elements?.length || 0} elements)`)
    
    onProgress({
      type: 'status',
      step: 'layout_complete',
      message: `  ✓ Layout: ${layout.composition}`,
      slideIndex: i + 1,
      percentage: baseProgress + progressPerSlide * 0.3,
    })
    
    // Step 4-8: Asset generation
    console.log('  → Generating assets (blobs, gradients, icons, images)...')
    onProgress({
      type: 'status',
      step: 'assets',
      message: `  🖼️  Generating visuals (blobs, gradients, icons)...`,
      slideIndex: i + 1,
      percentage: baseProgress + progressPerSlide * 0.4,
    })
    
    const assets = await generateAssets(layout, segment, input.style, input.tone)
    console.log('  ✅ Assets generated:', {
      blobs: assets.blobs.length,
      icons: assets.icons.length,
      hasImage: !!assets.image,
      imageBy: assets.image?.photographer,
    })
    
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
    console.log('  → Assembling slide...')
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
    console.log(`  ✅ Slide ${i + 1} assembled successfully!`)
    
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
  
  console.log('\n--- FINALIZING ---')
  onProgress({
    type: 'status',
    step: 'finalizing',
    message: '🎉 All slides designed! Finalizing presentation...',
    percentage: 95,
  })
  
  console.log('✅ PIPELINE COMPLETE!')
  console.log('Total slides generated:', assembledSlides.length)
  console.log('========================================\n')
  
  return assembledSlides
}

// ============= Helper Functions (from orchestrator) =============

async function segmentText(input: UserInput): Promise<SlideSegment[]> {
  const systemPrompt = `You are a professional church presentation designer following 2025 trends.

2025 CHURCH CONTENT PRINCIPLES:
- Authentic, conversational tone (not overly formal)
- Short, punchy headlines (3-7 words MAX)
- Subtitles add context, not repetition
- Body text: One key idea per slide (15-30 words)
- Visual hierarchy: Headline > Subtitle > Body
- Each slide tells ONE story, makes ONE point
- Vary the approach: some slides text-heavy, others image-focused
- Use active voice, present tense
- Relatable language, avoid churchy jargon

CONTENT VARIETY:
- Slide 1: Bold statement or question
- Slide 2: Scripture or quote (short)
- Slide 3: Practical application
- Slide 4: Call to action or reflection
- Mix up the rhythm, avoid repetition

CRITICAL RULES:
1. Return ONLY valid JSON
2. Start response with { and end with }
3. No markdown, no code fences, no commentary
4. Make each slide UNIQUE and INTERESTING
5. Escape quotes in text with backslash

REQUIRED OUTPUT FORMAT:
{
  "slides": [
    {
      "slide_index": 1,
      "title": "Bold Short Headline",
      "subtitle": "Supporting context in 5-8 words",
      "body_text": "One clear idea. 15-30 words max. Make it punchy.",
      "keywords": ["relevant", "search", "terms"]
    }
  ]
}

FIELD REQUIREMENTS:
- slide_index: number (1, 2, 3, etc.)
- title: string (3-7 words, compelling and varied)
- subtitle: string (5-8 words or empty "", adds context)
- body_text: string (15-30 words, ONE key point)
- keywords: array of 3-4 specific strings (for finding relevant images)

Generate EXACTLY ${input.num_slides} slides. Make each one DIFFERENT.`

  const userPrompt = input.use_word_for_word
    ? `Use this text word-for-word, split into ${input.num_slides} slides:\n\n${input.prompt}`
    : `Transform this into ${input.num_slides} modern, engaging church slides:\n\n${input.prompt}\n\nTone: ${input.tone}\nStyle: ${input.style}\n\nMake each slide unique and visually interesting.`

  try {
    const response = await callGeminiAPI({ systemPrompt, userPrompt })

    if (!response || !Array.isArray(response.slides)) {
      console.warn('[Segmentation] ⚠️  AI returned invalid format, using fallback')
      return getDefaultSegments(input)
    }

    const mappedSlides = response.slides.map((slide: any, idx: number) => ({
      slide_index: slide.slide_index || idx + 1,
      title: slide.title || `Slide ${idx + 1}`,
      subtitle: slide.subtitle || '',
      body_text: slide.body_text || '',
      keywords: Array.isArray(slide.keywords) ? slide.keywords : ['presentation', 'slide'],
    }))
    
    console.log('[Segmentation] ✅ Successfully parsed', mappedSlides.length, 'slides')
    return mappedSlides
  } catch (error) {
    console.error('[Segmentation] ❌ Error during segmentation:', error)
    console.warn('[Segmentation] ⚠️  Falling back to default segmentation')
    return getDefaultSegments(input)
  }
}

function getDefaultSegments(input: UserInput): SlideSegment[] {
  console.log('[Segmentation] Using default fallback segmentation')
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
  const systemPrompt = `You are an expert 2025 church slide designer. Create modern, trendy layouts that follow current design principles.

2025 CHURCH SLIDE DESIGN TRENDS:
- Minimalist with generous whitespace (breathing room is key)
- Bold, oversized typography (headlines 80-120px)
- Subtle texture overlays (grain, paper texture at 5-10% opacity)
- Organic shapes (blobs) as decorative accents in CORNERS or EDGES ONLY
- High-quality imagery with duotone or gradient overlays
- Asymmetric layouts with intentional imbalance
- Grid-based alignment (use 100px or 200px increments)
- Content-first: text must be readable, images support the message
- Modern serif fonts for scripture, sans-serif for contemporary messages
- Negative space is intentional design, not empty space

CRITICAL LAYOUT RULES - NEVER VIOLATE:
1. Images MUST NEVER overlap text elements
2. Text MUST be in clear, readable areas (solid background or gradient overlay)
3. Blobs go in CORNERS or behind images, NEVER over text
4. Create clear visual hierarchy: headline → image → body text
5. Each element needs breathing room (50px minimum spacing)
6. Split screen: 50/50 left-right OR top-bottom
7. If image is background, darken it with overlay (add note in composition)

LAYOUT VARIETY (rotate through these):
1. **Split Screen Left**: Text left (0-750), Image right (800-1600), blobs in corners
2. **Split Screen Right**: Image left (0-800), Text right (850-1600), blobs in corners
3. **Hero Image Background**: Full image (0-1600), text with dark overlay center, blob bottom-right
4. **Floating Card**: Image background (0-1600), white card (200,150,1200x600) with text, blob top-left
5. **Minimal Corner**: Large text top-left (80,100,800x400), small image bottom-right (1000,500,500x350), blob middle-left
6. **Text Focus**: Center text (300,250,1000x400), tiny image accent (100,600,400x250), blob top-right
7. **Magazine Grid**: Text top (100,80,1400x300), Image bottom (100,400,1400x420), no blobs

POSITIONING REQUIREMENTS (1600x900 canvas):
- Safe text zones: (80-750, 80-820) OR (850-1520, 80-820)
- Image zones: Can use full height (0-900) but must not overlap text
- Blobs: Only in corners: (0-300, 0-300), (1300-1600, 0-300), (0-300, 600-900), (1300-1600, 600-900)
- Headlines: 100-150px from top
- Body text: Below headline with 50px+ gap
- Grid alignment: All x/y positions MUST be multiples of 50 or 100

CRITICAL RULES - ENFORCE STRICTLY:
1. Return ONLY valid JSON
2. Start with { and end with }
3. No markdown, no code fences
4. Each slide MUST look DIFFERENT from previous
5. NEVER place blobs over text (only in corners/edges)
6. NEVER place images over text (use split screen or background)
7. Include at least 1 blob per slide (for visual interest)

REQUIRED OUTPUT FORMAT:
{
  "composition": "split_screen_left",
  "elements": [
    {"type": "headline", "x": 100, "y": 150, "width": 600, "align": "left"},
    {"type": "body", "x": 100, "y": 320, "width": 550},
    {"type": "image_placeholder", "x": 850, "y": 0, "width": 750, "height": 900},
    {"type": "blob", "x": 1300, "y": 600, "width": 300, "height": 300}
  ]
}

Style preference: ${style}`

  const userPrompt = `Design slide ${segment.slide_index}:
Title: "${segment.title}"
Subtitle: "${segment.subtitle}"
Body: "${segment.body_text}"
Keywords: ${segment.keywords.join(', ')}

REQUIREMENTS:
- Create a UNIQUE layout (different from slide ${segment.slide_index - 1})
- Images MUST NOT overlap text
- Blobs MUST be in corners/edges only
- Use 2025 church design trends
- Grid-based positioning (multiples of 50/100)
- Include grain/texture overlay instructions`

  const response = await callGeminiAPI({ systemPrompt, userPrompt })

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

// ============= FORMAT CONVERTER =============
/**
 * Converts AssembledSlide format (AI output) to Slide format (editor expects).
 * Transforms {shapes, icons, image, text, background} -> {elements[], background}
 */
import type { Slide, SlideElement } from '../types'

export function convertToEditorFormat(assembled: AssembledSlide): Slide {
  const elements: SlideElement[] = []
  let elementCounter = 0
  
  // Convert background (gradient + texture) to editor background format
  const background = {
    type: 'gradient' as const,
    gradient: {
      angle: assembled.background.gradient.angle,
      colors: [assembled.background.gradient.from, assembled.background.gradient.to],
    },
  }
  
  // Convert text elements (headline, subtext, body)
  if (assembled.text.headline) {
    elements.push({
      id: `element-${elementCounter++}`,
      type: 'text',
      props: {
        x: 100,
        y: 150,
        width: 1400,
        height: 120,
      },
      style: {
        fontFamily: assembled.text.font || 'DM Sans',
        fontSize: 72,
        fontWeight: 700,
        fill: assembled.text.color || '#111111',
        align: 'left',
      },
      content: assembled.text.headline,
    })
  }
  
  if (assembled.text.subtext) {
    elements.push({
      id: `element-${elementCounter++}`,
      type: 'text',
      props: {
        x: 100,
        y: 290,
        width: 1400,
        height: 60,
      },
      style: {
        fontFamily: assembled.text.font || 'DM Sans',
        fontSize: 36,
        fontWeight: 500,
        fill: assembled.text.color || '#111111',
        align: 'left',
      },
      content: assembled.text.subtext,
    })
  }
  
  if (assembled.text.body) {
    elements.push({
      id: `element-${elementCounter++}`,
      type: 'text',
      props: {
        x: 100,
        y: 380,
        width: 700,
        height: 400,
      },
      style: {
        fontFamily: assembled.text.font || 'DM Sans',
        fontSize: 24,
        fontWeight: 400,
        fill: assembled.text.color || '#111111',
        align: 'left',
        lineHeight: 1.6,
      },
      content: assembled.text.body,
    })
  }
  
  // Convert image if present
  if (assembled.image) {
    elements.push({
      id: `element-${elementCounter++}`,
      type: 'image',
      props: {
        x: assembled.image.x || 900,
        y: assembled.image.y || 200,
        width: assembled.image.width || 600,
        height: assembled.image.height || 500,
      },
      content: assembled.image.url,
    })
  }
  
  // Convert blobs/shapes (rendered as SVG shapes)
  assembled.shapes.forEach((shape) => {
    elements.push({
      id: `element-${elementCounter++}`,
      type: 'shape',
      props: {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        opacity: 0.3,
      },
      style: {
        fill: shape.color,
      },
      content: shape.svg, // Store SVG data
    })
  })
  
  // Convert icons (note: icons will need special handling in renderer)
  assembled.icons.forEach((icon) => {
    elements.push({
      id: `element-${elementCounter++}`,
      type: 'shape', // Using 'shape' type, will render as icon
      props: {
        x: icon.position.x,
        y: icon.position.y,
        width: icon.size,
        height: icon.size,
      },
      style: {
        fill: icon.color,
      },
      content: `icon:${icon.name}:${icon.variant}`, // Special format for icons
    })
  })
  
  return {
    id: `slide-${assembled.meta.slide_index}`,
    background,
    elements,
    meta: {
      title: assembled.meta.composition || 'Untitled',
      notes: `Keywords: ${assembled.meta.keywords.join(', ')}`,
      theme: 'ai-generated',
    },
  }
}

// ============= SAFE JSON PARSER =============
/**
 * Safely extract and parse JSON from AI responses.
 * Handles code fences, malformed quotes, and control characters.
 */
function extractJSON(input: string, context: string = 'unknown'): any {
  console.log(`[JSON Parser] Attempting to parse response for: ${context}`)
  console.log(`[JSON Parser] Raw input length: ${input.length} chars`)
  console.log(`[JSON Parser] First 200 chars:`, input.substring(0, 200))
  
  try {
    // Strategy 1: Try direct parse
    const parsed = JSON.parse(input)
    console.log(`[JSON Parser] ✅ Direct parse successful for ${context}`)
    return parsed
  } catch (directError) {
    console.log(`[JSON Parser] ⚠️  Direct parse failed for ${context}:`, 
      directError instanceof Error ? directError.message : String(directError))
  }
  
  try {
    // Strategy 2: Extract from code fences
    const match = input.match(/```json\s*([\s\S]*?)\s*```/)
    if (match) {
      console.log(`[JSON Parser] 🔍 Found JSON code fence for ${context}`)
      const jsonText = match[1].trim()
      const parsed = JSON.parse(jsonText)
      console.log(`[JSON Parser] ✅ Code fence parse successful for ${context}`)
      return parsed
    }
  } catch (fenceError) {
    console.log(`[JSON Parser] ⚠️  Code fence parse failed for ${context}:`,
      fenceError instanceof Error ? fenceError.message : String(fenceError))
  }
  
  try {
    // Strategy 3: Extract JSON object from text
    console.log(`[JSON Parser] 🔍 Searching for JSON object in text for ${context}`)
    const jsonMatch = input.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const extracted = jsonMatch[0]
      console.log(`[JSON Parser] Found JSON-like content, length:`, extracted.length)
      const parsed = JSON.parse(extracted)
      console.log(`[JSON Parser] ✅ Extraction parse successful for ${context}`)
      return parsed
    }
  } catch (extractError) {
    console.log(`[JSON Parser] ⚠️  Extraction failed for ${context}:`,
      extractError instanceof Error ? extractError.message : String(extractError))
  }
  
  try {
    // Strategy 4: Aggressive cleanup and retry
    console.log(`[JSON Parser] 🧹 Attempting aggressive cleanup for ${context}`)
    let cleaned = input.trim()
    
    // Remove any "commentary to=assistant{" or similar junk
    cleaned = cleaned.replace(/^[^{]*\{/, '{') // Remove everything before first {
    cleaned = cleaned.replace(/\}[^}]*$/, '}') // Remove everything after last }
    cleaned = cleaned
      .replace(/(\r\n|\n|\r)/gm, ' ') // Replace newlines with spaces
      .replace(/\\"/g, '"') // Fix escaped quotes
      .replace(/"|"/g, '"') // Fix smart quotes
      .replace(/[\u0000-\u001F]+/g, '') // Remove control characters
      .replace(/to=/g, '": "') // Fix malformed "to=" syntax
    
    const parsed = JSON.parse(cleaned)
    console.log(`[JSON Parser] ✅ Aggressive cleanup successful for ${context}`)
    return parsed
  } catch (cleanError) {
    console.error(`[JSON Parser] ❌ All strategies failed for ${context}`)
    console.error(`[JSON Parser] Final error:`, 
      cleanError instanceof Error ? cleanError.message : String(cleanError))
    console.error(`[JSON Parser] Full input (first 1000 chars):`, input.substring(0, 1000))
    throw new Error(`Failed to parse JSON for ${context}: ${cleanError instanceof Error ? cleanError.message : 'Unknown error'}`)
  }
}

// Rate limiter: Gemini free tier has rate limits
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 2000 // 2 seconds between requests

async function waitForRateLimit() {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest
    console.log(`[Rate Limiter] ⏳ Waiting ${waitTime}ms to respect rate limit...`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }
  
  lastRequestTime = Date.now()
}

async function callGeminiAPI({
  systemPrompt,
  userPrompt,
}: {
  systemPrompt: string
  userPrompt: string
}): Promise<any> {
  // Wait for rate limit before making request
  await waitForRateLimit()
  
  console.log('[Gemini API] 📤 Making API call...')
  console.log('[Gemini API] User prompt length:', userPrompt.length, 'chars')
  
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    console.error('[Gemini API] ❌ API key not configured')
    throw new Error('GEMINI_API_KEY not configured in environment variables')
  }
  
  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: systemPrompt + '\n\n' + userPrompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2000,
      responseMimeType: 'application/json',
    }
  }
  
  console.log('[Gemini API] Request config:', {
    model: 'gemini-2.5-flash-lite',
    temperature: 0.7,
    maxOutputTokens: 2000,
    responseMimeType: 'application/json',
  })
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Gemini API] ❌ API error:', response.status, errorText)
    throw new Error(`Gemini API error: ${response.status}`)
  }
  
  console.log('[Gemini API] ✅ API call successful')
  
  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text
  
  if (!content) {
    console.error('[Gemini API] ❌ No content in response:', JSON.stringify(data))
    throw new Error('No content in Gemini API response')
  }
  
  console.log('[Gemini API] Response received, length:', content.length, 'chars')
  
  // Extract the context from system prompt for better logging
  const context = systemPrompt.includes('presentation designer') || systemPrompt.includes('Split the user')
    ? 'segmentation' 
    : systemPrompt.includes('Plan element positions') || systemPrompt.includes('1600x900px')
    ? 'layout'
    : 'unknown'
  
  return extractJSON(content, context)
}
