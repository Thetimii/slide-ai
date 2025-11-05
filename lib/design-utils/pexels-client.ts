export interface PexelsImage {
  id: number
  url: string
  photographer: string
  photographerUrl: string
  src: {
    original: string
    large2x: string
    large: string
    medium: string
    small: string
    portrait: string
    landscape: string
    tiny: string
  }
  alt: string
  avgColor: string
}

export interface PexelsSearchResult {
  total_results: number
  page: number
  per_page: number
  photos: PexelsImage[]
  next_page: string
}

/**
 * Search Pexels for images by keyword
 */
export async function searchPexels(
  query: string,
  orientation: 'landscape' | 'portrait' | 'square' = 'landscape',
  perPage: number = 10
): Promise<PexelsImage[]> {
  const apiKey = process.env.PEXELS_API_KEY
  
  if (!apiKey) {
    console.warn('PEXELS_API_KEY not configured, returning empty results')
    return []
  }
  
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=${perPage}`
    
    const response = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
    })
    
    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`)
    }
    
    const data: PexelsSearchResult = await response.json()
    return data.photos
  } catch (error) {
    console.error('Pexels search failed:', error)
    return []
  }
}

/**
 * Select best image based on composition and tone
 */
export function selectBestImage(
  images: PexelsImage[],
  tone: string
): PexelsImage | null {
  if (images.length === 0) return null
  
  // Simple heuristic: prefer images with certain color tones
  const toneKeywords: Record<string, string[]> = {
    warm: ['warm', 'orange', 'yellow', 'red'],
    cool: ['blue', 'cyan', 'purple'],
    minimal: ['white', 'gray', 'simple'],
    vibrant: ['colorful', 'bright', 'vivid'],
  }
  
  const keywords = toneKeywords[tone.toLowerCase()] || []
  
  // Score images based on alt text matching
  const scoredImages = images.map((img) => {
    let score = 0
    const altLower = img.alt.toLowerCase()
    
    keywords.forEach((keyword) => {
      if (altLower.includes(keyword)) score += 1
    })
    
    return { img, score }
  })
  
  // Sort by score, return highest
  scoredImages.sort((a, b) => b.score - a.score)
  
  return scoredImages[0].img
}
