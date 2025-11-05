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

  try {
    const response = await callOpenRouterFree({ systemPrompt, userPrompt })

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
  const systemPrompt = `You are a JSON-only API. Return ONLY valid JSON with NO commentary, explanations, or markdown.

Task: Plan element positions for a 1600x900px slide.

REQUIRED OUTPUT FORMAT (copy this structure exactly):
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

Valid composition values: "rule_of_thirds", "centered", "asymmetric"
Valid element types: "headline", "body", "image_placeholder", "blob", "icon_placeholder"

IMPORTANT: 
- Start your response with { and end with }
- No text before or after the JSON
- No explanations or commentary
- Use double quotes for all strings
- Style preference: ${style}`

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

async function callOpenRouterFree({
  systemPrompt,
  userPrompt,
}: {
  systemPrompt: string
  userPrompt: string
}): Promise<any> {
  console.log('[OpenRouter] 📤 Making API call...')
  console.log('[OpenRouter] User prompt length:', userPrompt.length, 'chars')
  
  const apiKey = process.env.OPENROUTER_API_KEY
  
  if (!apiKey) {
    console.error('[OpenRouter] ❌ API key not configured')
    throw new Error('OPENROUTER_API_KEY not configured')
  }
  
  const requestBody = {
    model: 'qwen/qwen3-235b-a22b:free',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  }
  
  console.log('[OpenRouter] Request config:', {
    model: requestBody.model,
    responseFormat: requestBody.response_format,
    messageCount: requestBody.messages.length,
    maxTokens: requestBody.max_tokens,
  })
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('[OpenRouter] ❌ API error:', response.status, errorText)
    throw new Error(`OpenRouter API error: ${response.status}`)
  }
  
  console.log('[OpenRouter] ✅ API call successful')
  
  const data = await response.json()
  const content = data.choices[0].message.content
  
  console.log('[OpenRouter] Response received, length:', content.length, 'chars')
  
  // Extract the context from system prompt for better logging
  const context = systemPrompt.includes('presentation designer') || systemPrompt.includes('Split the user')
    ? 'segmentation' 
    : systemPrompt.includes('Plan element positions') || systemPrompt.includes('1600x900px')
    ? 'layout'
    : 'unknown'
  
  return extractJSON(content, context)
}
