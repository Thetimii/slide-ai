import { NextResponse } from 'next/server'
import { createBlob } from '@/lib/design-utils/blob-generator'

export async function POST(request: Request) {
  try {
    const { complexity, contrast, color } = await request.json()

    // Generate a new blob with the provided parameters
    const blob = createBlob({
      seed: Math.random().toString(),
      complexity: complexity || (0.3 + Math.random() * 0.5), // 0.3-0.8
      contrast: contrast || (0.3 + Math.random() * 0.5), // 0.3-0.8
      color: color || '#667eea',
    })

    return NextResponse.json({ svg: blob.svg })
  } catch (error) {
    console.error('Blob generation error:', error)
    return NextResponse.json({ error: 'Failed to generate blob' }, { status: 500 })
  }
}
