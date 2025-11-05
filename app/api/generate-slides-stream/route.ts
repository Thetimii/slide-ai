import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSlidesWithProgress, type ProgressUpdate } from '@/lib/ai-pipeline/streaming-orchestrator'
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
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const supabase = await createClient()
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Unauthorized' })}\n\n`)
          )
          controller.close()
          return
        }
        
        // Parse and validate request body
        const body = await request.json()
        const validatedData = GenerateSlidesRequestSchema.parse(body)
        
        // Send initial status
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'status', 
            step: 'init',
            message: '🚀 Starting AI slide generation...' 
          })}\n\n`)
        )
        
        // Prepare input for AI pipeline
        const combinedPrompt = validatedData.slides
          .map((slide, idx) => `Slide ${idx + 1}: ${slide.content}`)
          .join('\n\n')
        
        const pipelineInput = {
          prompt: combinedPrompt,
          num_slides: validatedData.numSlides,
          tone: validatedData.theme,
          style: validatedData.style,
          use_word_for_word: validatedData.useVerbatim,
        }
        
        // Run AI pipeline with progress callbacks
        const assembledSlides = await generateSlidesWithProgress(
          pipelineInput,
          (progress) => {
            // Send progress update to client
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(progress)}\n\n`)
            )
          }
        )
        
        // Transform to database format
        const slidesJSON = {
          slides: assembledSlides,
          meta: {
            uniformDesign: validatedData.useUniformDesign,
            theme: validatedData.theme,
            style: validatedData.style,
          },
        }
        
        // Send progress: Saving to database
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'status',
            step: 'saving',
            message: '💾 Saving presentation...' 
          })}\n\n`)
        )
        
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
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              message: 'Failed to save presentation' 
            })}\n\n`)
          )
          controller.close()
          return
        }
        
        // Save to prompts history
        await supabase.from('prompts_history').insert({
          user_id: user.id,
          input_text: combinedPrompt,
          ai_response: { slides: assembledSlides },
        })
        
        // Send final success
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'complete',
            presentation 
          })}\n\n`)
        )
        
        controller.close()
      } catch (error) {
        if (error instanceof z.ZodError) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              message: 'Invalid request data',
              details: error.errors 
            })}\n\n`)
          )
        } else {
          console.error('Error in generate-slides-stream:', error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              message: error instanceof Error ? error.message : 'Internal server error' 
            })}\n\n`)
          )
        }
        controller.close()
      }
    },
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
