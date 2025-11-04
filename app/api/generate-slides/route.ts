import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callOpenRouter } from '@/lib/openrouter'
import { transformAISlidesToJSON } from '@/lib/ai-transform'
import { z } from 'zod'

const SlideInputSchema = z.object({
  id: z.string(),
  content: z.string().min(1),
})

const GenerateSlidesRequestSchema = z.object({
  presentationTitle: z.string().min(1).max(200),
  theme: z.string().min(1).max(100),
  style: z.string().min(1).max(200),
  numSlides: z.number().int().min(1).max(20),
  slides: z.array(SlideInputSchema),
  useUniformDesign: z.boolean(),
  useVerbatim: z.boolean(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = GenerateSlidesRequestSchema.parse(body)
    
    // Call OpenRouter AI to generate slides
    let aiResponse
    try {
      aiResponse = await callOpenRouter({
        theme: validatedData.theme,
        style: validatedData.style,
        slides: validatedData.slides,
        useUniformDesign: validatedData.useUniformDesign,
        useVerbatim: validatedData.useVerbatim,
      })
    } catch (aiError) {
      console.error('AI generation failed:', aiError)
      
      // Retry once
      try {
        aiResponse = await callOpenRouter({
          theme: validatedData.theme,
          style: validatedData.style,
          slides: validatedData.slides,
          useUniformDesign: validatedData.useUniformDesign,
          useVerbatim: validatedData.useVerbatim,
        })
      } catch (retryError) {
        console.error('AI retry failed:', retryError)
        return NextResponse.json(
          { error: 'Failed to generate slides. Please try again.' },
          { status: 422 }
        )
      }
    }
    
    // Transform AI slides to renderable format
    const slidesJSON = transformAISlidesToJSON(aiResponse)
    
    // Save to database
    const { data: presentation, error: dbError } = await supabase
      .from('presentations')
      .insert({
        user_id: user.id,
        title: validatedData.presentationTitle,
        slides_json: slidesJSON,
      })
      .select()
      .single()
    
    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save presentation' },
        { status: 500 }
      )
    }
    
    // Save to prompts history
    await supabase.from('prompts_history').insert({
      user_id: user.id,
      input_text: JSON.stringify(validatedData.slides),
      ai_response: aiResponse,
    })
    
    return NextResponse.json({
      presentation,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error in generate-slides:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
