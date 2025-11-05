import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSlidesFullPipeline, type UserInput } from '@/lib/ai-pipeline/orchestrator'
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
    
    // Prepare input for AI pipeline
    const combinedPrompt = validatedData.slides
      .map((slide, idx) => `Slide ${idx + 1}: ${slide.content}`)
      .join('\n\n')
    
    const pipelineInput: UserInput = {
      prompt: combinedPrompt,
      num_slides: validatedData.numSlides,
      tone: validatedData.theme,
      style: validatedData.style,
      use_word_for_word: validatedData.useVerbatim,
    }
    
    // Run AI pipeline
    let assembledSlides
    try {
      assembledSlides = await generateSlidesFullPipeline(pipelineInput)
    } catch (aiError) {
      console.error('AI generation failed:', aiError)
      
      // Retry once
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        assembledSlides = await generateSlidesFullPipeline(pipelineInput)
      } catch (retryError) {
        console.error('AI retry failed:', retryError)
        return NextResponse.json(
          { error: 'Failed to generate slides. Please try again.' },
          { status: 422 }
        )
      }
    }
    
    // Transform to database format
    const slidesJSON = {
      slides: assembledSlides,
      meta: {
        uniformDesign: validatedData.useUniformDesign,
        theme: validatedData.theme,
        style: validatedData.style,
      },
    }
    
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
      input_text: combinedPrompt,
      ai_response: { slides: assembledSlides },
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
