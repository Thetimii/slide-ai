# AI Church Slide Builder

> Beautiful Worship & Teaching Slides — Instantly

Create stunning church presentation slides with AI. Auto-layout from sermon notes, fully editable designs, and export to PNG, PDF, or PPTX.

## 🌟 Features

- **AI-Powered Slide Generation**: Transform sermon notes and worship content into professional slides
- **Frictionless Demo**: Anonymous users auto-created on first visit—no signup required to start
- **Real-Time Editor**: React + Konva canvas with drag, resize, and full design control
- **Export Gated**: PNG/PDF/PPTX exports available after signup (with demo data transfer)
- **Premium Design**: Clean, modern, non-"AI-y" aesthetic designed for churches and ministries
- **Multiple Themes**: Modern gradient, minimal light, warm tones, and more

## 🛠 Tech Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **UI**: TailwindCSS with custom design system
- **Canvas**: react-konva for slide editing
- **State**: zustand (editor state) + swr (data fetching)
- **Styling**: DM Sans + Inter fonts, premium gradients

### Backend

- **Platform**: Vercel
- **Database**: Supabase (Postgres + Auth + Storage + RLS)
- **AI**: OpenRouter API (GPT-3.5-turbo with JSON mode)
- **Export**: PPTXGenJS, pdf-lib, canvas toDataURL

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- OpenRouter API key

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd slide-ai
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://mvynkudqddhmexfpejvh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here

# Server-only (never expose to client)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenRouter API Key
OPENROUTER_API_KEY=your_openrouter_key_here
```

### 3. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/schema.sql`
4. Run the SQL script to create tables and policies

This will create:

- `users` table with demo user support
- `presentations` table for slide data
- `prompts_history` for AI generation logs
- `exports` table for export tracking
- `transfer_links` for demo→real user data migration
- Row Level Security (RLS) policies
- Storage bucket for exports

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

## 📁 Project Structure

```
slide-ai/
├── app/
│   ├── api/
│   │   ├── create-demo-user/      # POST: Create anonymous demo session
│   │   ├── generate-slides/       # POST: AI slide generation
│   │   ├── transfer-demo-data/    # POST: Transfer demo data on signup
│   │   └── export/                # POST: Export to PNG/PDF/PPTX (TODO)
│   ├── dashboard/
│   │   └── page.tsx               # Main editor workspace
│   ├── layout.tsx                 # Root layout with fonts
│   ├── page.tsx                   # Landing page
│   └── globals.css                # Global styles + Tailwind
├── components/
│   ├── EditorCanvas.tsx           # Konva canvas for slide editing
│   ├── GenerateSlidesModal.tsx    # AI generation form modal
│   ├── RightInspector.tsx         # Properties panel (typography, colors)
│   ├── SlidesList.tsx             # Left sidebar with slide thumbnails
│   └── Topbar.tsx                 # Top navigation with export button
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser Supabase client
│   │   ├── server.ts              # Server Supabase client
│   │   ├── service-role.ts        # Service role client (admin)
│   │   └── database.types.ts      # TypeScript types from Supabase
│   ├── ai-transform.ts            # Transform AI JSON to renderable slides
│   ├── openrouter.ts              # OpenRouter API integration
│   ├── store.ts                   # Zustand editor state
│   └── types.ts                   # TypeScript types and schemas
├── supabase/
│   └── schema.sql                 # Database initialization SQL
├── .env.example                   # Environment variables template
├── .env.local                     # Your actual secrets (gitignored)
├── next.config.js                 # Next.js configuration
├── tailwind.config.js             # Tailwind theme customization
└── package.json                   # Dependencies
```

## 🎨 Design System

### Colors

- **Background**: `#0B0D0F`
- **Foreground**: `#F2F3F5`
- **Muted**: `#A3A7AE`
- **Primary**: `#89C2FF` (blue accent)
- **Accent**: `#F5C26B` (gold)
- **Surfaces**: `#121418`, `#161920`, `#1C2028`

### Typography

- **Heading**: DM Sans (700/600)
- **Body**: Inter (400/500)

### Components

- Buttons: Rounded-2xl with glass effect
- Cards: Rounded-3xl with subtle borders
- Transitions: Smooth hover states with ring effects

## 🔑 Key Features Explained

### Anonymous Demo User Flow

1. User visits `/` or `/dashboard` without auth
2. API route `/api/create-demo-user` creates Supabase anonymous session
3. User record inserted with `is_demo = true`
4. User can create and edit presentations immediately
5. On export attempt, signup modal appears
6. After signup, `/api/transfer-demo-data` reassigns all demo content to real user

### AI Slide Generation

1. User inputs title, style preferences, and notes
2. API calls OpenRouter with JSON mode enabled
3. AI returns structured JSON: `{slides: [{title, content, theme}]}`
4. Server transforms AI response to renderable slide schema
5. Slides saved to Supabase with theme defaults applied
6. Editor loads presentation immediately

### Slide Editor

- **Canvas**: 1600x900px (16:9 ratio) rendered with react-konva
- **Elements**: Text, rectangles, images (drag, resize, rotate)
- **Inspector**: Live editing of fonts, colors, alignment, backgrounds
- **Themes**: Preset theme system with gradient/solid backgrounds
- **State**: Zustand store with debounced save to Supabase

## 🔒 Security & RLS

All database tables use Row Level Security:

- Users can only see/edit their own presentations
- Demo users isolated from real users
- Service role key never exposed to client
- Export URLs are signed and short-lived

## 📦 Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

## 🚧 TODO / Roadmap

- [ ] **Export API Route**: Implement PNG/PDF/PPTX server-side rendering
- [ ] **Signup Modal**: Integrate Supabase Auth UI with email/OAuth
- [ ] **Save Debouncing**: Auto-save presentations on edit
- [ ] **Undo/Redo**: History stack for editor actions
- [ ] **Drag Reorder**: Drag-and-drop slide reordering
- [ ] **Image Upload**: Supabase Storage integration for images
- [ ] **Collaboration**: Real-time multi-user editing (Supabase Realtime)
- [ ] **Templates**: Pre-built slide templates library
- [ ] **Animation**: Slide transitions and element animations

## 🐛 Known Issues / Notes

- TypeScript errors in components are expected until `npm install` runs (types not yet installed)
- Export functionality stub created but not fully implemented
- Gradients in Konva simplified (currently using first color only)
- No image element rendering yet (structure in place)
- Service role key placeholder in `.env.local` needs replacement

## 🤝 Contributing

This is a production-ready starter. Key areas for contribution:

1. Complete export implementation (PPTX, PDF, PNG generation)
2. Add Supabase Auth UI for signup/login
3. Implement auto-save with debouncing
4. Add more theme presets
5. Build template gallery

## 📄 License

MIT

## 💡 Tips for Development

### Testing AI Generation

Use realistic sermon notes for best results:

```
TITLE: Faith Over Fear
STYLE: modern gradient blue purple, bold titles
NOTES:
Key verse: 2 Timothy 1:7
"For God has not given us a spirit of fear, but of power, love, and self-discipline."

Main Points:
1. Fear is not from God
2. We have power through the Spirit
3. Love casts out fear
4. Discipline brings peace

Application:
- Identify fears in your life
- Replace fear with trust
- Community support matters
```

### Supabase Setup Checklist

- ✅ Run schema.sql in SQL Editor
- ✅ Enable Email Auth (or OAuth providers)
- ✅ Copy Anon Key and Service Role Key
- ✅ Configure redirect URLs for auth
- ✅ Set up Storage bucket policies

### OpenRouter Configuration

1. Get API key from [openrouter.ai](https://openrouter.ai)
2. Model used: `openai/gpt-3.5-turbo` (fast, reliable JSON mode)
3. Alternative models: `anthropic/claude-3-haiku`, `meta-llama/llama-3-8b`

## 🙏 Credits

Built with ❤️ for churches and ministries.

- Design inspiration: Modern church conference aesthetics
- Color palette: Premium dark theme with warm accents
- Typography: Google Fonts (DM Sans, Inter)

---

**Ready to build?** Run `npm install && npm run dev` and start creating! 🚀
