import { NextResponse } from 'next/server'

const PEXELS_API_KEY = process.env.PEXELS_API_KEY

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const perPage = searchParams.get('per_page') || '12'

  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
  }

  if (!PEXELS_API_KEY) {
    return NextResponse.json({ error: 'PEXELS_API_KEY not configured' }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Pexels API error: ${response.status} - ${errorText}`)
      return NextResponse.json({ error: `Pexels API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    console.log(`Pexels search for "${query}": ${data.photos?.length || 0} results`)
    return NextResponse.json(data.photos || [])
  } catch (error) {
    console.error('Pexels search error:', error)
    return NextResponse.json({ error: 'Failed to search images' }, { status: 500 })
  }
}
