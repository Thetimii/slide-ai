# 🚀 Quick Start - AI Church Slide Builder

Get up and running in **5 minutes**!

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- An OpenRouter API key (free tier available)

## Step 1: Install Dependencies (1 min)

```bash
npm install
```

## Step 2: Set Up Supabase (2 min)

### Create Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Wait for setup to complete

### Run Schema

1. Dashboard → SQL Editor → New Query
2. Copy/paste contents of `supabase/schema.sql`
3. Click **Run**

### Get Keys

1. Settings → API
2. Copy **Project URL** and **anon key**

## Step 3: Configure Environment (1 min)

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your_service_key
OPENROUTER_API_KEY=sk-or-...your_key
```

Get OpenRouter key: [openrouter.ai/keys](https://openrouter.ai/keys)

## Step 4: Run! (1 min)

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## ✅ Test It Works

1. Click **"Start Free in the Editor"**
2. Click **"Generate Slides"**
3. Fill in:
   - Title: "Test Sermon"
   - Topic: "Faith Over Fear"
   - Notes: "For God has not given us a spirit of fear, but of power and love and self-discipline. - 2 Timothy 1:7"
4. Click **"Generate Slides"**
5. Wait 3-5 seconds
6. Edit the slides!

## 🎨 What You Can Do

### In the Editor:

- ✅ Click elements to select
- ✅ Drag to move
- ✅ Right panel: change fonts, colors, alignment
- ✅ Left sidebar: add/duplicate/delete slides
- ✅ Theme selector: switch between presets

### Try These Commands:

- Select text → Change font size
- Select text → Change color
- Click "+" to add blank slide
- Click 📋 to duplicate slide
- Switch theme dropdown

## 🐛 Troubleshooting

### "Failed to create demo user"

→ Check Supabase service role key in `.env.local`

### "Failed to generate slides"

→ Check OpenRouter API key and credits

### TypeScript errors?

→ Normal until `npm install` completes. Restart VS Code if needed.

### Can't see slides?

→ Check browser console (F12) for errors
→ Check Supabase dashboard → Table Editor → presentations

## 📚 Next Steps

1. **Customize themes**: Edit `lib/types.ts` → `THEME_PRESETS`
2. **Add more fonts**: Update `tailwind.config.js`
3. **Try different AI models**: Change model in `lib/openrouter.ts`
4. **Deploy**: Push to GitHub → Connect Vercel → Add env vars

## 📖 Full Documentation

- **README.md** - Complete feature overview
- **SETUP.md** - Detailed setup guide
- **ARCHITECTURE.md** - Component architecture
- **supabase/schema.sql** - Database structure

## 🆘 Need Help?

Common issues:

1. Make sure all env vars are set correctly
2. Verify Supabase schema ran successfully
3. Check you have OpenRouter credits
4. Clear browser cookies and try again

---

**That's it!** You now have a fully functional AI-powered church slide builder running locally. 🎉

Ready to customize? Check out the component files in `/components` and start building!
