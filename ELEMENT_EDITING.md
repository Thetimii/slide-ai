# Element Editing Feature

## Overview

Users can now click any element on the canvas and edit its properties in the right inspector panel.

## Supported Elements

### 1. Text Elements

- **Content**: Edit text directly in textarea
- **Font Family**: Inter, DM Sans, Arial, Georgia
- **Font Size**: 12-200px
- **Text Color**: Color picker
- **Alignment**: Left, Center, Right

### 2. Image Elements

- **Preview**: Shows current image
- **Replace Image**:
  - Search Pexels API with keyword
  - Browse results in grid
  - Click thumbnail to replace
- **Size**: Width/Height controls (50-1600px width, 50-900px height)
- **Corner Radius**: 0-100px slider
- **Opacity**: 0-100% slider

### 3. Blob Elements (SVG Shapes)

- **Preview**: Shows current blob shape
- **Regenerate**: 🎲 Generate new variation with random parameters
- **Size**: Width/Height controls (100-800px, step: 50px)
- **Color**: Color picker for blob fill
- **Opacity**: 0-100% slider (default 30%)

### 4. Universal Controls (All Elements)

- **Position**: X/Y coordinates (grid-based, step: 10px)
  - X: 0-1600px
  - Y: 0-900px

## API Endpoints

### `/api/pexels-search`

- **Method**: GET
- **Query Params**:
  - `q`: Search query (required)
  - `per_page`: Results count (default: 12)
- **Returns**: Array of Pexels photos with `src.large` and `src.small` URLs
- **Env Required**: `PEXELS_API_KEY`

### `/api/generate-blob`

- **Method**: POST
- **Body**:
  ```json
  {
    "complexity": 0.3-0.8,
    "contrast": 0.3-0.8,
    "color": "#667eea"
  }
  ```
- **Returns**: `{ svg: "<svg>...</svg>" }`
- **Uses**: `lib/design-utils/blob-generator.ts` with `blobs` package

## User Flow

1. **Select Element**: Click any element on canvas
2. **Edit Properties**: Right panel shows element-specific controls
3. **Image Search**:
   - Enter keyword (e.g., "mountains")
   - Press Enter or click Search
   - Click result thumbnail to replace image
4. **Blob Regeneration**:
   - Click "🎲 Generate New Variation"
   - New random blob generated with similar parameters
   - Adjust size, color, opacity as needed
5. **Position Adjustment**:
   - Use X/Y inputs to move element
   - Grid-snapping with 10px steps

## Setup Required

Add to `.env.local`:

```bash
PEXELS_API_KEY=your_api_key_here
```

Get API key from: https://www.pexels.com/api/

## Technical Details

- **State Management**: Zustand store (`updateElement`, `setSelectedElementId`)
- **Canvas**: Konva.js for rendering
- **Blob Generation**: `blobs` package v2 with `svgPath` function
- **Image Search**: Pexels API v1 with landscape orientation filter
- **Real-time Updates**: Changes immediately reflected on canvas

## Future Enhancements

Potential additions:

- Delete element button
- Duplicate element button
- Z-index controls (bring to front/back)
- Rotation controls
- Image filters (brightness, contrast, saturation)
- Undo/redo functionality
- Keyboard shortcuts for common actions
