import { AISlidesResponseSchema } from './types'

export interface OpenRouterRequest {
  title: string
  style: string
  notes: string
}

export async function callOpenRouter(request: OpenRouterRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }
  
  const systemPrompt = `You convert sermon/worship notes into visually engaging slides with creative layouts. ALWAYS return valid JSON matching this schema: {"slides":[{"title":string,"content":string,"theme":string,"decorations":[{"type":"circle"|"rect"|"line","color":string,"position":{"x":number,"y":number},"size":{"width":number,"height":number},"rotation":number,"opacity":number}]}]}. 

Guidelines for content:
- Keep titles short and punchy (5-8 words max)
- Content should be <= 40 words, clear and concise
- Break content into logical slides
- Each slide should be self-contained
- Prefer bullet points or short phrases over paragraphs

Guidelines for visual design:
- Use theme names: "modern-blue", "minimal-light", or "warm-gradient"
- Add 2-5 decorative elements per slide for visual interest
- Decorations should include: circles, rectangles, lines, dots
- Position decorations strategically (corners, edges, behind text)
- Use subtle colors that complement the theme (pastels, soft gradients)
- Vary sizes: small accents (20-50px) and larger background shapes (100-300px)
- Apply 0-45 degree rotations for dynamic feel
- Use 0.1-0.3 opacity for background elements, 0.5-0.8 for accents
- Create visual hierarchy with shapes (e.g., circles behind titles, lines as dividers)
- Distribute decorations asymmetrically for modern aesthetic

Example decoration positions:
- Top-right corner: {"x": 1400, "y": 100, "width": 200, "height": 200}
- Bottom-left: {"x": 100, "y": 700, "width": 150, "height": 150}
- Behind title: {"x": 100, "y": 150, "width": 300, "height": 80}
- Side accent: {"x": 1500, "y": 400, "width": 50, "height": 300}

Example color schemes by theme:
- modern-blue: "#89C2FF", "#A8D5FF", "#C4E4FF" (light blues)
- minimal-light: "#E0E0E0", "#F5F5F5", "#CCCCCC" (soft grays)
- warm-gradient: "#F5C26B", "#FFD88A", "#FFE6B3" (warm golds)

Be creative! Mix circles, rectangles, and lines. Use rotation. Layer with opacity. Create depth and interest.
`

  const userPrompt = `TITLE: ${request.title}
STYLE: ${request.style}
NOTES:
${request.notes}

Return JSON only.`

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b:free',
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
        temperature: 0.2,
        top_p: 0.9,
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
    const validated = AISlidesResponseSchema.parse(parsedContent)
    
    return validated
  } catch (error) {
    console.error('OpenRouter call failed:', error)
    throw error
  }
}
