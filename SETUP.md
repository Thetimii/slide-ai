# AI Church Slide Builder - Setup Guide

## 🚀 Getting Started

This guide will walk you through setting up the AI Church Slide Builder from scratch.

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:

- Next.js 14
- React and React DOM
- Supabase client libraries
- Zustand for state management
- React Konva for the canvas editor
- Zod for validation
- TailwindCSS for styling

## Step 2: Supabase Setup

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish setting up (2-3 minutes)
3. Note your project URL and API keys

### Run Database Schema

1. In your Supabase dashboard, go to the **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL Editor and click **Run**

This creates:

- All necessary tables (users, presentations, prompts_history, exports, transfer_links)
- Row Level Security (RLS) policies
- Storage bucket for exports
- Indexes for performance

### Get Your API Keys

1. Go to **Settings** → **API**
2. Copy your **Project URL** (looks like `https://xxxxx.supabase.co`)
3. Copy your **anon/public** key (safe for browser)
4. Copy your **service_role** key (⚠️ keep secret, server-only)

## Step 3: OpenRouter Setup

### Get an API Key

1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up or log in
3. Go to **API Keys**
4. Create a new API key
5. Copy the key (starts with `sk-or-...`)

### Add Credits (Optional)

OpenRouter uses a pay-per-use model:

- GPT-3.5-turbo costs ~$0.0015 per request
- $5 credit gives you ~3,000+ slide generations
- Free tier available for testing

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Edit `.env.local` and replace placeholders:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here

# Server-only (never expose to client)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenRouter API Key
OPENROUTER_API_KEY=sk-or-your_actual_key_here
```

**Important**: Never commit `.env.local` to version control!

## Step 5: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ✅ Verify Setup

### Test Landing Page

1. Visit `http://localhost:3000`
2. You should see the premium gradient hero section
3. Click "Start Free in the Editor"

### Test Demo User Creation

1. You'll be redirected to `/dashboard`
2. An anonymous user should be created automatically
3. Check Supabase dashboard → **Authentication** → you should see 1 anonymous user
4. Check **Table Editor** → `users` → you should see 1 row with `is_demo = true`

### Test AI Slide Generation

1. Click "Generate Slides" in the dashboard
2. Fill in the form:
   - **Presentation Title**: "Test Sermon - Week 1"
   - **Topic**: "Faith Over Fear"
   - **Style**: "modern gradient blue, bold titles"
   - **Notes**: Paste some sample sermon notes (at least 50 words)
3. Click "Generate Slides"
4. Wait 3-5 seconds for AI processing
5. Slides should appear in the editor

### Test Editor Functionality

1. Click on a slide in the left sidebar
2. Click on text elements in the canvas to select them
3. Use the right inspector to change:
   - Font family
   - Font size
   - Text color
   - Alignment
4. Changes should update in real-time
5. Add a new slide with the "+" button
6. Duplicate or delete slides

## 🐛 Troubleshooting

### "Failed to create demo user"

- **Check**: Supabase service role key is correct in `.env.local`
- **Check**: Schema SQL ran successfully
- **Check**: No errors in Supabase logs (Dashboard → Logs)

### "Failed to generate slides"

- **Check**: OpenRouter API key is valid
- **Check**: You have credits in your OpenRouter account
- **Check**: Notes are between 10-5000 characters
- **Check**: Network tab for API errors

### TypeScript Errors

- **Run**: `npm install` to ensure all type definitions are installed
- **Note**: Some lint errors in the editor are cosmetic and won't affect runtime

### Supabase RLS Errors

- **Check**: All policies created correctly (should see them in **Authentication** → **Policies**)
- **Check**: User session exists (check browser DevTools → Application → Cookies)
- **Try**: Clear cookies and refresh to create a new demo user

### Cannot Read Presentations

- **Check**: RLS policy for `presentations` table allows SELECT for authenticated users
- **Check**: User ID matches between auth user and presentation `user_id`
- **Check**: Supabase client is initialized correctly

## 📊 Database Schema Overview

### `users`

- `id` (UUID, PK) - User identifier
- `email` (TEXT) - Email address (null for demo users)
- `is_demo` (BOOLEAN) - True for anonymous demo users
- `created_at` (TIMESTAMPTZ) - Account creation time

### `presentations`

- `id` (UUID, PK) - Presentation identifier
- `user_id` (UUID, FK → users) - Owner
- `title` (TEXT) - Presentation title
- `slides_json` (JSONB) - Full slide data structure
- `created_at` (TIMESTAMPTZ) - Creation time

### `prompts_history`

- Logs all AI generation requests
- Used for analytics and debugging

### `exports`

- Tracks all export operations
- Links to storage bucket files

### `transfer_links`

- Manages demo → real user data transfers
- Prevents duplicate transfers

## 🎯 Next Steps

Once setup is complete:

1. **Customize Themes**: Edit `lib/types.ts` → `THEME_PRESETS`
2. **Add Export**: Implement `app/api/export/route.ts`
3. **Add Auth UI**: Integrate Supabase Auth UI for signup
4. **Deploy**: Push to Vercel (auto-detects Next.js)

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Environment Variables in Vercel

Add all variables from `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`

## 📞 Support

If you run into issues:

1. Check the **README.md** for detailed documentation
2. Review Supabase logs for database errors
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

---

**You're all set!** 🎉 Start creating beautiful church slides with AI.
