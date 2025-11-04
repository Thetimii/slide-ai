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
  
  const systemPrompt = `You are a professional presentation designer creating stunning church slides. Return valid JSON matching this schema: 
{"slides":[{"title":string,"content":string,"theme":string,"layout":"hero"|"split"|"minimal"|"quote"|"focus"}]}

CRITICAL DESIGN RULES:
1. Choose appropriate layouts for content:
   - "hero": Bold statements, main titles (large centered text)
   - "split": Two-part messages, comparisons
   - "minimal": Scripture verses, quotes (lots of white space)
   - "quote": Memorable phrases, key takeaways
   - "focus": Single word/phrase emphasis

2. Content Guidelines:
   - Titles: 3-6 words maximum (punchy, memorable)
   - Body: 15-30 words max (never full sentences)
   - Use line breaks (\n) strategically for rhythm
   - Scripture references: "John 3:16" format
   - Key phrases in ALL CAPS for emphasis

3. Theme Selection:
   - "modern-blue": Contemporary worship, youth events
   - "minimal-light": Scripture, reflective moments  
   - "warm-gradient": Comfort, community, welcome messages
   - "dark-elegant": Sophisticated, memorial services
   - "ocean-depth": Baptism, renewal themes
   - "sunset-glow": Hope, new beginnings

4. Professional Patterns:
   - Start with impactful hero slide
   - Alternate layouts for visual interest
   - End with memorable quote/call-to-action
   - Never repeat same layout 3x in a row

EXAMPLE OUTPUT:
{
  "slides": [
    {
      "title": "Faith Over Fear",
      "content": "When doubt creeps in\nGod's promises remain",
      "theme": "modern-blue",
      "layout": "hero"
    },
    {
      "title": "What Does Faith Look Like?",
      "content": "TRUST in the unseen\nSTEP when it's uncomfortable\nBELIEVE before you see results",
      "theme": "modern-blue",
      "layout": "split"
    },
    {
      "title": "John 3:16",
      "content": "For God so loved the world that he gave his one and only Son",
      "theme": "minimal-light",
      "layout": "quote"
    }
  ]
}`

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
