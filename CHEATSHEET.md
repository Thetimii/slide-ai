# 🛠️ Developer Cheat Sheet

Quick reference for common development tasks.

## 📝 Common Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
# (Run in Supabase SQL Editor)
-- Reset presentations for testing
DELETE FROM presentations WHERE user_id = 'your-user-id';

-- Check demo users
SELECT * FROM users WHERE is_demo = true;

-- View all presentations
SELECT id, title, user_id, created_at FROM presentations ORDER BY created_at DESC;
```

## 🔑 Environment Variables

```env
# Client-side (NEXT_PUBLIC_*)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Server-only (no prefix)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
OPENROUTER_API_KEY=sk-or-...
```

## 🎨 Tailwind Utilities

```jsx
// Buttons
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary Action</button>

// Cards
<div className="card p-6">Card Content</div>
<div className="glass p-4">Glass Effect</div>

// Colors
bg-bg          // Main background (#0B0D0F)
text-fg        // Main text (#F2F3F5)
text-muted     // Muted text (#A3A7AE)
bg-primary     // Primary accent (#89C2FF)
bg-accent      // Gold accent (#F5C26B)
bg-surface-1   // Elevated surface (#121418)
```

## 🗄️ Supabase Client Usage

```typescript
// Browser (client components)
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// Server (server components, API routes)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// Admin operations (API routes only)
import { createServiceRoleClient } from '@/lib/supabase/service-role'
const supabase = createServiceRoleClient()
```

## 🧠 Zustand Store Usage

```typescript
import { useEditorStore } from '@/lib/store'

// Read state
const { presentation, currentSlideIndex } = useEditorStore()

// Update state
const { setPresentation, updateSlide } = useEditorStore()

// All available state
{
  presentation,
  currentSlideIndex,
  selectedElementId,
  zoom,
  panX,
  panY,
  isSaving,
  lastSaved,
  // ... and actions
}
```

## 🎯 Type Imports

```typescript
import {
  Presentation,
  Slide,
  SlideElement,
  THEME_PRESETS,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from '@/lib/types'
```

## 🤖 AI Generation Example

```typescript
// In your component
const response = await fetch('/api/generate-slides', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Faith Over Fear',
    style: 'modern gradient blue, bold titles',
    notes: 'Your sermon notes here...',
    presentationTitle: 'Sunday Service - Week 1',
  }),
})

const { presentation } = await response.json()
```

## 🎨 Adding a New Theme

Edit `lib/types.ts`:

```typescript
export const THEME_PRESETS: Record<string, ThemePreset> = {
  // ... existing themes
  'my-custom-theme': {
    name: 'My Custom Theme',
    background: {
      type: 'gradient',
      gradient: {
        angle: 45,
        colors: ['#123456', '#654321'],
      },
    },
    titleStyle: {
      fontFamily: 'DM Sans',
      fontSize: 72,
      fontWeight: 700,
      fill: '#FFFFFF',
      align: 'center',
    },
    bodyStyle: {
      fontFamily: 'Inter',
      fontSize: 36,
      fontWeight: 400,
      fill: '#E6E9EF',
      align: 'center',
      lineHeight: 1.5,
    },
  },
}
```

## 🧩 Creating a New Component

```typescript
// components/MyComponent.tsx
'use client'

import { useEditorStore } from '@/lib/store'

export default function MyComponent() {
  const { presentation } = useEditorStore()

  return <div className="card p-6">{/* Your component */}</div>
}
```

## 📡 Creating a New API Route

```typescript
// app/api/my-route/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Your logic here

  return NextResponse.json({ success: true })
}
```

## 🐛 Debugging Tips

```typescript
// Check Zustand state
import { useEditorStore } from '@/lib/store'
console.log('Store:', useEditorStore.getState())

// Check Supabase session
const {
  data: { session },
} = await supabase.auth.getSession()
console.log('Session:', session)

// Check API errors
fetch('/api/my-route')
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error)
```

## 📊 Useful SQL Queries

```sql
-- Find orphaned presentations (user deleted)
SELECT p.* FROM presentations p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL;

-- Count slides per presentation
SELECT
  id,
  title,
  jsonb_array_length(slides_json->'slides') as slide_count
FROM presentations
ORDER BY slide_count DESC;

-- Most active users
SELECT
  user_id,
  COUNT(*) as presentation_count
FROM presentations
GROUP BY user_id
ORDER BY presentation_count DESC;

-- Recent AI generations
SELECT
  user_id,
  created_at,
  LEFT(input_text, 100) as preview
FROM prompts_history
ORDER BY created_at DESC
LIMIT 10;
```

## 🧪 Testing Scenarios

### Test Demo User Flow

1. Clear cookies
2. Visit `/dashboard`
3. Should auto-create demo user
4. Check Supabase Auth for anonymous user

### Test AI Generation

1. Click "Generate Slides"
2. Enter realistic notes (100+ words)
3. Check console for errors
4. Verify slides appear

### Test Editor

1. Select text element
2. Change font size in inspector
3. Verify immediate update in canvas

### Test RLS

1. Try accessing another user's presentation
2. Should fail with 401 or empty result

## 🚀 Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Supabase schema.sql run in production
- [ ] Auth redirect URLs configured
- [ ] OpenRouter API key has credits
- [ ] Test demo user creation
- [ ] Test AI generation
- [ ] Test editor functionality
- [ ] Verify RLS policies work
- [ ] Check error logs
- [ ] Set up monitoring (Sentry, etc.)

## 📚 File Structure Quick Reference

```
app/
  api/              → API routes
  dashboard/        → Editor page
  page.tsx          → Landing page
  layout.tsx        → Root layout

components/         → React components

lib/
  supabase/         → Supabase clients
  types.ts          → TypeScript types
  store.ts          → Zustand state
  openrouter.ts     → AI integration
  ai-transform.ts   → AI → Renderable
  utils.ts          → Helper functions

supabase/
  schema.sql        → Database schema
```

## 🎓 Key Concepts

### Demo Users

- Created automatically on first visit
- `is_demo = true` in database
- Can create and edit presentations
- Must signup to export
- Data transferred on signup

### RLS (Row Level Security)

- Every table query checks user ID
- `auth.uid()` matches `user_id` column
- Prevents cross-user data access
- Automatic with Supabase client

### Zustand Store

- Global state for editor
- Subscribe to changes with `useEditorStore()`
- Actions modify state directly
- No reducers, no actions creators

---

**Pro Tip**: Keep this file open while developing for quick reference! 🚀
