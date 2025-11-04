import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callOpenRouter } from '@/lib/openrouter'
import { transformAISlidesToJSON } from '@/lib/ai-transform'
import { z } from 'zod'

const GenerateSlidesRequestSchema = z.object({
  title: z.string().min(1).max(100),
  style: z.string().min(1).max(200),
  notes: z.string().min(10).max(5000),
  presentationTitle: z.string().min(1).max(200),
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
        title: validatedData.title,
        style: validatedData.style,
        notes: validatedData.notes,
      })
    } catch (aiError) {
      console.error('AI generation failed:', aiError)
      
      // Retry once
      try {
        aiResponse = await callOpenRouter({
          title: validatedData.title,
          style: validatedData.style,
          notes: validatedData.notes,
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
    const slidesJSON = transformAISlidesToJSON(aiResponse.slides)
    
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
      input_text: validatedData.notes,
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
