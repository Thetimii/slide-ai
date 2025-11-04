import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    
    // Create anonymous auth user
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
    
    if (authError || !authData.user) {
      console.error('Failed to create anonymous user:', authError)
      return NextResponse.json(
        { error: 'Failed to create demo user' },
        { status: 500 }
      )
    }
    
    // Insert user record with is_demo = true
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        is_demo: true,
      } as any)
      .select()
      .single()
    
    if (userError) {
      console.error('Failed to create user record:', userError)
      return NextResponse.json(
        { error: 'Failed to create user record' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      user: userData,
      session: authData.session,
    })
  } catch (error) {
    console.error('Error in create-demo-user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
