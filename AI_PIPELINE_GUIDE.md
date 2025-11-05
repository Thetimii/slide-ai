# AI Slide Designer Pipeline Guide

## Overview

This app uses a **10-step AI pipeline** to transform user input into beautifully designed slides with professional layouts, gradients, blobs, heroicons, textures, and Pexels images.

## Architecture

### AI Model

All AI steps use **`openai/gpt-oss-20b:free`** from OpenRouter for cost-effective, high-quality generation.

### 10-Step Pipeline

#### **Step 1: User Input**

```typescript
{
  prompt: string,           // User's content or topic
  num_slides: number,       // 2-10 slides
  tone: string,             // 'modern minimal', 'bold pastel', etc.
  style: string,            // Design style preferences
  use_word_for_word: bool   // Use exact text vs AI rewriting
}
```

#### **Step 2: Text Segmentation**

AI splits content into logical slides with:

- `title` (3-7 words)
- `subtitle` (optional)
- `body_text` (15-40 words)
- `keywords` (2-4 visual keywords)

#### **Step 3: Layout Planning**

AI chooses composition and element positions:

- **Composition Types:**

  - `rule_of_thirds`: Professional, balanced (1/3 intersections)
  - `centered`: Symmetric, traditional
  - `asymmetric`: Dynamic, modern

- **Elements:**
  - Headline (x, y, width, align)
  - Body text (x, y, width)
  - Image placeholder
  - Icon placeholder
  - Decorative blobs

#### **Step 4: Image Selection**

- Queries **Pexels API** using slide keywords
- Selects best match based on tone and composition
- Falls back gracefully if no results

#### **Step 5: Blob Generation**

- Uses `blobs` library to create organic SVG shapes
- Parameters: `seed`, `complexity (0-1)`, `contrast (0-1)`, `color`
- Generated per slide for visual interest

#### **Step 6: Gradient Generation**

- Creates background gradients:
  - **Linear**: angled color transitions
  - **Radial**: circular spread
  - **Conic**: rotational gradient
- Themed palettes based on style

#### **Step 7: Icon Selection**

- Semantic mapping: keywords → Heroicons
- Examples:
  - "growth" → `RocketLaunchIcon`
  - "security" → `ShieldCheckIcon`
  - "love" → `HeartIcon`
  - "data" → `ChartBarIcon`

#### **Step 8: Texture Layer**

- Generates grain/noise overlays using Canvas API
- Opacity: 0.15-0.3
- Blend mode: overlay
- Adds warmth and realism

#### **Step 9: AI Refinement** _(Optional)_

- Vision model evaluates design:
  - Visual hierarchy
  - Color contrast
  - Spacing
  - Balance
- Returns score (0-100) and improvements

#### **Step 10: Final Assembly**

Combines all layers into comprehensive JSON:

```json
{
  "background": {
    "gradient": {
      "from": "#EFB7C6",
      "to": "#FFFFFF",
      "angle": 135,
      "type": "linear"
    },
    "texture": {
      "type": "grain",
      "opacity": 0.2,
      "dataUrl": "data:image/png;base64..."
    }
  },
  "shapes": [
    {
      "type": "blob",
      "seed": "slide-1",
      "svg": "<path d='...'/>",
      "x": 50,
      "y": 600,
      "width": 400,
      "height": 300,
      "color": "#EFB7C6"
    }
  ],
  "icons": [
    {
      "name": "RocketLaunchIcon",
      "color": "#111",
      "variant": "outline",
      "position": { "x": 1400, "y": 750 },
      "size": 48
    }
  ],
  "image": {
    "url": "https://images.pexels.com/photos/.../",
    "photographer": "John Doe",
    "fit": "cover",
    "x": 900,
    "y": 200,
    "width": 600,
    "height": 500
  },
  "text": {
    "headline": "Grow Your Business with AI",
    "subtext": "Transform your workflow",
    "body": "Auto-designed slides with perfect balance.",
    "color": "#111111",
    "font": "DM Sans"
  },
  "meta": {
    "slide_index": 1,
    "composition": "rule_of_thirds",
    "score": 85,
    "keywords": ["growth", "AI", "business"]
  }
}
```

## Code Structure

```
lib/
├── ai-pipeline/
│   └── orchestrator.ts       # Main 10-step pipeline
├── design-utils/
│   ├── blob-generator.ts     # SVG blob creation
│   ├── gradient-generator.ts # CSS gradients
│   ├── texture-generator.ts  # Grain/noise overlays
│   ├── pexels-client.ts      # Image search
│   └── icon-mapper.ts        # Keyword → Heroicon mapping
app/api/
└── generate-slides/
    └── route.ts              # API endpoint using pipeline
```

## Setup

### 1. Install Dependencies

```bash
npm install @heroicons/react blobs
```

### 2. Environment Variables

Add to `.env.local`:

```bash
OPENROUTER_API_KEY=your_key_here
PEXELS_API_KEY=your_pexels_key  # Get from https://www.pexels.com/api/
```

### 3. Usage

```typescript
import { generateSlidesFullPipeline } from '@/lib/ai-pipeline/orchestrator'

const slides = await generateSlidesFullPipeline({
  prompt: 'How to build a startup in 2025',
  num_slides: 5,
  tone: 'modern minimal',
  style: 'bold pastel',
  use_word_for_word: false,
})
```

## Design Utilities

### Blob Generation

```typescript
import { createBlob } from '@/lib/design-utils/blob-generator'

const blob = createBlob({
  seed: 'myblob',
  complexity: 0.7,
  contrast: 0.5,
  color: '#EFB7C6',
})
// Returns: { svg: '<path...>', seed, params }
```

### Gradient Generation

```typescript
import { generateGradient } from '@/lib/design-utils/gradient-generator'

const gradient = generateGradient({
  colors: ['#667eea', '#764ba2'],
  type: 'linear',
  angle: 135,
})
// Returns: { css: 'linear-gradient(135deg, ...)', params }
```

### Texture Generation

```typescript
import { generateGrainTexture } from '@/lib/design-utils/texture-generator'

const texture = generateGrainTexture(1600, 900, 0.2)
// Returns: { dataUrl: 'data:image/png;base64...', params }
```

### Pexels Search

```typescript
import { searchPexels } from '@/lib/design-utils/pexels-client'

const images = await searchPexels('nature', 'landscape', 10)
// Returns: PexelsImage[]
```

### Icon Mapping

```typescript
import { getIconForKeyword } from '@/lib/design-utils/icon-mapper'

const icon = getIconForKeyword('growth')
// Returns: 'RocketLaunchIcon'
```

## Database Schema

Slides are stored in Supabase with this structure:

```sql
CREATE TABLE presentations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  slides_json jsonb NOT NULL,  -- Array of AssembledSlide objects
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Rendering

The `EditorCanvas` component renders slides using react-konva:

- **Background**: CSS gradient + texture overlay
- **Blobs**: SVG paths converted to Konva shapes
- **Icons**: Heroicons rendered as SVG
- **Images**: Konva Image nodes from Pexels URLs
- **Text**: Konva Text with proper typography

## Customization

### Add New Icon Mappings

Edit `lib/design-utils/icon-mapper.ts`:

```typescript
export const ICON_SEMANTIC_MAP = {
  // Add your mappings
  custom: 'CustomIcon',
}
```

### Add New Gradient Themes

Edit `lib/design-utils/gradient-generator.ts`:

```typescript
const styleMap = {
  'your-style': ['#color1', '#color2'],
}
```

### Adjust AI Prompts

Edit system prompts in `lib/ai-pipeline/orchestrator.ts` for different design styles.

## Performance

- **Average generation time**: 10-20 seconds for 5 slides
- **Parallelization**: Each slide processed sequentially (can be optimized)
- **Caching**: Texture overlays generated once per session
- **Rate limits**: Pexels API allows 200 requests/hour (free tier)

## Troubleshooting

### "Pexels API key not configured"

Add `PEXELS_API_KEY` to `.env.local`

### "Blob generation failed"

Check `blobs` library installation: `npm list blobs`

### "OpenRouter timeout"

Model may be overloaded. Pipeline includes 1-second retry delay.

### Images not loading

Verify Pexels API key and check console for CORS errors.

## Future Enhancements

- [ ] Parallel slide processing
- [ ] Real-time AI refinement with user feedback
- [ ] More blob styles (geometric, hand-drawn)
- [ ] Animation timeline generation
- [ ] Export to PowerPoint with full fidelity

## License

MIT - See LICENSE file
