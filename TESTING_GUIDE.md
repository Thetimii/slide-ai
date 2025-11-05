# Testing Guide - AI Slide Format Fix

## What Was Fixed

Fixed the format mismatch between AI pipeline output and editor expectations that caused `TypeError: currentSlide.elements is not iterable`.

## Quick Test

1. **Start the dev server** (if not running):

   ```bash
   npm run dev
   ```

2. **Open the app**: http://localhost:3000

3. **Create a new presentation**:

   - Click "Generate Slides" or similar button
   - Enter some content, e.g.:

     ```
     Title: Welcome to Church
     Content: Join us this Sunday for worship and fellowship. We have services at 9am and 11am.

     Title: Mission Statement
     Content: Our mission is to spread God's love and serve our community.
     ```

4. **Watch the generation process**:

   - Progress bar should appear
   - Status messages should update
   - Look for these steps:
     - "📝 Analyzing content and splitting into slides..."
     - "✅ Created X slide outlines"
     - "🎨 Designing slide 1/X..."
     - "📐 Planning layout composition..."
     - "💾 Saving presentation..."

5. **Check for errors**:

   - Open browser DevTools (F12)
   - Check Console tab for:
     - ❌ Should NOT see: `TypeError: currentSlide.elements is not iterable`
     - ✅ Should see: Successful generation logs
     - ✅ Should see: `[JSON Parser] ✅ Direct parse successful for...`

6. **Verify slide rendering**:
   - After generation completes, slides should appear in editor
   - Check that slides display:
     - Text (headline, subtext, body)
     - Background gradients
     - No blank/broken slides

## Expected Console Output (Success)

```
========================================
🚀 STARTING SLIDE GENERATION PIPELINE
========================================
Input: { promptLength: 150, numSlides: 2, tone: 'professional', ... }

--- STEP 1: SEGMENTATION ---
[JSON Parser] Attempting to parse response for: segmentation
[JSON Parser] ✅ Direct parse successful for segmentation
✅ Segmentation complete: 2 slides
Slide titles: ['Welcome to Church', 'Mission Statement']

--- PROCESSING SLIDE 1/2 ---
Title: Welcome to Church
Keywords: church, worship, community
  → Planning layout...
[JSON Parser] ✅ Direct parse successful for layout
  ✅ Layout complete: rule_of_thirds (5 elements)
  → Searching for images...
  ✅ Found 15 images for "church"
  → Generating blobs...
  ✅ Blob generated
  → Assembling slide...
  ✅ Slide 1 assembled

--- PROCESSING SLIDE 2/2 ---
...
```

## What to Look For

### ✅ Success Indicators

- [ ] No TypeScript/runtime errors in console
- [ ] Progress updates appear in modal
- [ ] Slides are created and saved to database
- [ ] Editor displays slides with elements
- [ ] Text is visible and properly positioned
- [ ] Background gradients applied

### ❌ Failure Indicators

- `TypeError: currentSlide.elements is not iterable` → Format still mismatched
- `JSON Parse Error` → AI returned invalid JSON
- `429 Too Many Requests` → Hit rate limit (wait 3 seconds, try again)
- Blank slides in editor → Conversion not working properly

## Debugging Steps

If you see errors:

1. **Check Database Format**:

   - Open Supabase dashboard
   - Check `presentations` table
   - Look at `slides_json` field
   - Verify it has this structure:
     ```json
     {
       "slides": [
         {
           "id": "slide-1",
           "background": { "type": "gradient", "gradient": {...} },
           "elements": [
             { "id": "element-0", "type": "text", "props": {...}, "content": "..." }
           ],
           "meta": { "title": "...", "theme": "..." }
         }
       ]
     }
     ```

2. **Check AI Responses**:

   - Look for console logs starting with `[JSON Parser]`
   - If you see "Aggressive cleanup attempted", AI is returning malformed JSON
   - Check if AI is following the explicit schema templates

3. **Verify Conversion**:
   - Add debug logging in `convertToEditorFormat()`:
     ```typescript
     console.log('Converting assembled slide:', assembled)
     console.log('Converted to editor format:', result)
     ```

## Manual Test Cases

### Test 1: Simple 2-Slide Presentation

```
Input: "Introduction to our church. We welcome everyone."
Expected: 1-2 slides with text and backgrounds
```

### Test 2: Multi-Slide with Keywords

```
Input:
"Worship Schedule: Sunday 9am and 11am
Bible Study: Wednesday 7pm
Community Service: Saturday 10am"
Expected: 3 slides with relevant images
```

### Test 3: Word-for-Word Mode

```
Input: "Keep this exact text: God is love."
Options: ✅ Use verbatim text
Expected: Slide with exact text "God is love."
```

## Performance Checks

- **Generation Time**: Should complete in 30-60 seconds (depending on # of slides)
- **Rate Limiting**: 3-second delays between AI calls (visible in logs)
- **Memory**: No memory leaks (check DevTools Memory tab)

## Success Criteria

✅ All tests pass without errors
✅ Slides render correctly in editor
✅ Database contains proper format
✅ No console errors or warnings (except CSS linting)
