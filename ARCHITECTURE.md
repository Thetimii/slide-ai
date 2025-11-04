# Slide AI - Component Architecture

## Component Hierarchy

```
App (Root Layout)
├── Landing Page (/)
│   └── Hero, Features, Footer
└── Dashboard (/dashboard)
    ├── Topbar
    │   ├── Logo/Title
    │   ├── Generate Button
    │   └── Export Button
    ├── SlidesList (Left Sidebar)
    │   ├── Slide Thumbnails
    │   ├── Add Slide Button
    │   └── Slide Actions (Duplicate, Delete)
    ├── EditorCanvas (Center)
    │   ├── Konva Stage
    │   ├── Background Layer
    │   └── Elements Layer (Text, Shapes, Images)
    ├── RightInspector (Right Sidebar)
    │   ├── Slide Properties
    │   │   ├── Theme Selector
    │   │   └── Background Controls
    │   └── Element Properties
    │       ├── Text Editor
    │       ├── Typography Controls
    │       ├── Color Picker
    │       └── Alignment Tools
    └── GenerateSlidesModal (Overlay)
        └── Form (Title, Style, Notes)
```

## State Management

### Zustand Store (`lib/store.ts`)

Global editor state managed with Zustand:

```typescript
{
  // Current presentation data
  presentation: Presentation | null

  // UI state
  currentSlideIndex: number
  selectedElementId: string | null
  zoom: number
  panX: number
  panY: number

  // Saving state
  isSaving: boolean
  lastSaved: Date | null

  // Actions
  setPresentation()
  addSlide()
  updateSlide()
  deleteSlide()
  duplicateSlide()
  updateElement()
  deleteElement()
  // ... more
}
```

### SWR for Data Fetching

Used for presentations list and remote data:

```typescript
const { data, error } = useSWR('/api/presentations', fetcher)
```

## Data Flow

### 1. Initial Load

```
User visits /dashboard
  → Check for auth session
  → If no session: POST /api/create-demo-user
  → Set session cookies
  → GET /api/presentations
  → Load latest presentation into store
  → Render EditorCanvas
```

### 2. AI Generation

```
User clicks "Generate"
  → GenerateSlidesModal opens
  → User fills form (title, style, notes)
  → POST /api/generate-slides
    → Server calls OpenRouter API
    → Transform AI JSON to renderable slides
    → Insert to Supabase
    → Return presentation
  → Store receives new presentation
  → EditorCanvas re-renders
  → Modal closes
```

### 3. Editing

```
User clicks element in canvas
  → setSelectedElementId(element.id)
  → RightInspector shows element properties

User changes property (e.g., font size)
  → updateElement(slideIndex, elementId, { style: { fontSize: 48 } })
  → Store updates presentation.slides_json
  → EditorCanvas re-renders affected element
  → Debounced save to Supabase (TODO)
```

### 4. Export (TODO)

```
User clicks "Export" → "PDF"
  → Check if demo user
  → If demo: show SignupModal
  → If real user: POST /api/export { presentation_id, format: 'PDF' }
    → Server renders slides to PDF
    → Upload to Supabase Storage
    → Return signed URL
  → Client downloads file
```

## API Routes

### `/api/create-demo-user`

- **Method**: POST
- **Auth**: None
- **Purpose**: Create anonymous Supabase session
- **Response**: `{ user, session }`

### `/api/generate-slides`

- **Method**: POST
- **Auth**: Required (demo or real)
- **Body**: `{ title, style, notes, presentationTitle }`
- **Purpose**: AI slide generation
- **Response**: `{ presentation }`

### `/api/presentations`

- **Method**: GET, PATCH, DELETE
- **Auth**: Required
- **Purpose**: CRUD for presentations
- **Response**: `{ presentations }` or `{ presentation }`

### `/api/transfer-demo-data`

- **Method**: POST
- **Auth**: Required (real user)
- **Body**: `{ demo_user_id }`
- **Purpose**: Transfer demo data to real account
- **Response**: `{ success: true }`

### `/api/export` (TODO)

- **Method**: POST
- **Auth**: Required (real user only)
- **Body**: `{ presentation_id, format }`
- **Purpose**: Export to PNG/PDF/PPTX
- **Response**: `{ signedUrl }`

## Component Props

### `EditorCanvas`

- No props (reads from Zustand store)
- Renders current slide from `presentation.slides_json.slides[currentSlideIndex]`
- Handles drag/resize/select interactions

### `RightInspector`

- No props (reads from Zustand store)
- Shows properties for `selectedElement`
- Updates via `updateElement` actions

### `SlidesList`

- No props (reads from Zustand store)
- Renders thumbnails for all slides
- Handles add/duplicate/delete actions

### `GenerateSlidesModal`

- `onClose: () => void`
- `onSuccess: (presentation) => void`
- Handles form submission and API call

### `Topbar`

- `onGenerateClick: () => void`
- Shows presentation title
- Export button (TODO: implement export flow)

## Styling System

### Tailwind Classes

Custom utilities defined in `globals.css`:

```css
.btn-primary     // Primary action button
.btn-secondary   // Secondary action button
.card           // Container card with glass effect
.glass          // Glass morphism effect;
```

### Theme Variables

Defined in `tailwind.config.js`:

- `bg`, `fg`, `muted` - Base colors
- `primary`, `accent` - Brand colors
- `surface-1`, `surface-2`, `surface-3` - Elevated surfaces
- `font-heading`, `font-sans` - Typography

## Performance Considerations

### Debounced Save

- Editor changes trigger debounced save (500ms delay)
- Prevents excessive API calls on every keystroke

### Optimistic Updates

- Store updates immediately
- Background sync to Supabase
- Conflict resolution on error

### Virtualization (Future)

- For large presentations (100+ slides)
- Render only visible slide thumbnails

### Konva Optimization

- Use `listening={false}` for static elements
- Cache complex shapes
- Batch updates with `batchDraw()`

## Testing Strategy

### Unit Tests (Future)

- Zustand store actions
- Type transformations (AI → Renderable)
- Utility functions

### Integration Tests

- API routes with mock Supabase
- Auth flow (demo user creation)
- Slide generation end-to-end

### E2E Tests

- User journey: Landing → Generate → Edit → Export
- Cross-browser testing
- Mobile responsiveness

## Deployment Checklist

- [ ] Set environment variables in Vercel
- [ ] Run Supabase schema.sql in production
- [ ] Configure Supabase auth redirect URLs
- [ ] Test demo user creation in production
- [ ] Verify RLS policies work correctly
- [ ] Test AI generation with real API keys
- [ ] Monitor error logs in Vercel and Supabase
- [ ] Set up analytics (PostHog, Plausible, etc.)

---

**Note**: This architecture is designed for scalability. Future additions (real-time collaboration, templates, animations) can be integrated without major refactoring.
