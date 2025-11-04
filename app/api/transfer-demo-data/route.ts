import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const TransferRequestSchema = z.object({
  demo_user_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated real user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if user is demo
    const { data: userData } = await supabase
      .from('users')
      .select('is_demo')
      .eq('id', user.id)
      .single()
    
    if (userData?.is_demo) {
      return NextResponse.json(
        { error: 'Cannot transfer from demo user' },
        { status: 400 }
      )
    }
    
    // Parse request
    const body = await request.json()
    const { demo_user_id } = TransferRequestSchema.parse(body)
    
    // Transfer presentations
    const { error: presError } = await supabase
      .from('presentations')
      .update({ user_id: user.id })
      .eq('user_id', demo_user_id)
    
    if (presError) {
      console.error('Failed to transfer presentations:', presError)
    }
    
    // Transfer prompts history
    const { error: promptsError } = await supabase
      .from('prompts_history')
      .update({ user_id: user.id })
      .eq('user_id', demo_user_id)
    
    if (promptsError) {
      console.error('Failed to transfer prompts:', promptsError)
    }
    
    // Transfer exports
    const { error: exportsError } = await supabase
      .from('exports')
      .update({ user_id: user.id })
      .eq('user_id', demo_user_id)
    
    if (exportsError) {
      console.error('Failed to transfer exports:', exportsError)
    }
    
    // Create/update transfer link
    const { error: linkError } = await supabase
      .from('transfer_links')
      .insert({
        demo_user_id,
        real_user_id: user.id,
        claimed: true,
      })
    
    if (linkError) {
      console.error('Failed to create transfer link:', linkError)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Demo data transferred successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error in transfer-demo-data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
