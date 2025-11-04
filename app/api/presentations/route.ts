import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: List all presentations for the current user
export async function GET(request: NextRequest) {
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
    
    // Fetch presentations
    const { data: presentations, error } = await supabase
      .from('presentations')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Failed to fetch presentations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch presentations' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ presentations })
  } catch (error) {
    console.error('Error in presentations route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH: Update a presentation
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { id, title, slides_json } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'Presentation ID required' },
        { status: 400 }
      )
    }
    
    // Update presentation
    const { data: presentation, error } = await supabase
      .from('presentations')
      .update({
        title: title || undefined,
        slides_json: slides_json || undefined,
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Failed to update presentation:', error)
      return NextResponse.json(
        { error: 'Failed to update presentation' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ presentation })
  } catch (error) {
    console.error('Error in presentations PATCH:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a presentation
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Presentation ID required' },
        { status: 400 }
      )
    }
    
    const { error } = await supabase
      .from('presentations')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Failed to delete presentation:', error)
      return NextResponse.json(
        { error: 'Failed to delete presentation' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in presentations DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
