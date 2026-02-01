# 🚀 SyllabiQ Quick Start Guide

## Setup in 3 Minutes

### 1️⃣ Install Dependencies
\\\ash
npm install
\\\

### 2️⃣ Configure Supabase (Optional for testing)
\\\ash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# (You can skip this step to test the UI without auth)
\\\

### 3️⃣ Start Development Server
\\\ash
npm run dev
\\\

Open **http://localhost:3000** 🎉

---

## 🗺️ Quick Navigation

| Page | URL | Description |
|------|-----|-------------|
| **Landing** | http://localhost:3000 | Welcome page with theme showcase |
| **Sign Up** | http://localhost:3000/auth/signup | Create new account |
| **Login** | http://localhost:3000/auth/login | Sign in to existing account |
| **Dashboard** | http://localhost:3000/dashboard | Student dashboard (protected) |

---

## ✨ What's Included

### 🎨 UI Components
- **Button** - 4 variants (primary, secondary, outline, ghost)
- **Card** - Glassmorphism effects with hover states
- **Input/Textarea** - With labels, icons, and error states
- **Modal** - Backdrop blur with 4 sizes
- **Loading** - Spinners and skeleton loaders

### 🔐 Authentication
- Sign up with email, password, full name, and grade
- Login with email and password
- Password reset flow
- Protected routes with middleware
- Auth context for state management

### 📊 Dashboard
- Progress statistics overview
- Subject cards with progress tracking
- Recent activity feed
- Responsive grid layout
- Welcome section with user info

### 🎯 Theme Features
- **Deep Navy** (#000510) - OLED-friendly background
- **Electric Cyan** (#00D4FF) - AI highlights
- **Golden Yellow** (#FFD700) - Exam tips
- **Glassmorphism** - Frosted glass UI
- **Neon Glow** - Interactive effects
- **Data Saver Mode** - Low bandwidth option

---

## 🧪 Testing Without Supabase

You can test the UI without setting up Supabase:

1. Navigate to pages directly:
   - Landing: http://localhost:3000
   - Login UI: http://localhost:3000/auth/login
   - Signup UI: http://localhost:3000/auth/signup

2. The UI will render, but authentication won't work until Supabase is configured.

---

## 🔧 Setting Up Supabase (For Full Functionality)

### Create a Supabase Project
1. Go to https://supabase.com
2. Click **"New Project"**
3. Fill in project details
4. Wait for database to initialize (~2 minutes)

### Get Your Credentials
1. Go to **Settings** → **API**
2. Copy **Project URL**
3. Copy **anon/public key**

### Update Environment Variables
\\\env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\\\

### Restart Dev Server
\\\ash
npm run dev
\\\

Now authentication will work! 🎉

---

## 📱 Test the Theme

### Desktop View
- Open http://localhost:3000
- See glassmorphism cards
- Hover over feature cards for neon glow
- Click buttons to see effects

### Mobile View
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select a mobile device
4. Test responsive layout

### Data Saver Mode
1. Open browser console
2. Run: \document.documentElement.setAttribute('data-saver', 'true')\
3. See simplified UI with no animations

---

## 🎓 Sample User Data

When testing, use these formats:

**Sign Up:**
- Full Name: John Doe
- Email: john@example.com
- Grade: 10 (select from dropdown)
- Password: password123

**Login:**
- Email: (use your signup email)
- Password: (use your signup password)

---

## 🐛 Troubleshooting

### Port 3000 Already in Use
\\\ash
# Kill existing process
npx kill-port 3000

# Or use a different port
npm run dev -- -p 3001
\\\

### Build Errors
\\\ash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
\\\

### Auth Not Working
1. Check \.env.local\ has correct Supabase credentials
2. Verify credentials are copied exactly (no extra spaces)
3. Restart dev server after changing env variables

---

## 📚 Component Usage Examples

### Button
\\\	sx
import { Button } from '@/components/ui';

<Button variant="primary" size="md">
  Click Me
</Button>
\\\

### Card
\\\	sx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

<Card variant="glass" hover glow>
  <CardHeader>
    <CardTitle>My Card</CardTitle>
  </CardHeader>
  <CardContent>
    Card content here
  </CardContent>
</Card>
\\\

### Input
\\\	sx
import { Input } from '@/components/ui';

<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
/>
\\\

---

## 🎯 Next Steps

1. **Test the UI** - Explore all pages and components
2. **Setup Supabase** - Enable authentication
3. **Customize Theme** - Modify colors in \globals.css\
4. **Add Content** - Start building study pack features
5. **Deploy** - Host on Vercel/Netlify

---

## 📖 Full Documentation

See **IMPLEMENTATION_COMPLETE.md** for:
- Complete file structure
- All component APIs
- Database schema
- Future development roadmap

---

**Happy Coding! 🚀**

Team Lucid Edge | Hackathon Master Build