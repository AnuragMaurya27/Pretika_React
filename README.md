# Pretika — Web (React)

A fully responsive, mobile-first **web version** of the Pretika Hindi-horror storytelling
app. Same backend API as the Flutter app, modern animated crimson-horror UI, English + Hindi
with a live language switch.

> Built with React 18 + Vite. Phone-first layout, centered "device frame" on desktop.

## Stack
- **React 18 + Vite** — fast dev/build
- **react-router-dom** — routing
- **@tanstack/react-query** — dynamic data fetching/caching
- **axios** — API client (token attach + auto refresh on 401)
- **zustand** — auth + language state
- **react-i18next** — English / Hindi localization
- **framer-motion** — page transitions, sheets, animations
- **lucide-react** — icons · **react-hot-toast** — toasts/snackbars

## Run it
```bash
cd Pretika-React
npm install
npm run dev      # http://localhost:5173
```
Build for production:
```bash
npm run build && npm run preview
```

## Configuration
Edit `.env`:
```
VITE_API_BASE_URL=https://pretika-api-1.onrender.com   # same backend as the app
# VITE_GOOGLE_CLIENT_ID=...   # optional, for Google sign-in on your web origin
# VITE_RAZORPAY_KEY=...       # optional, for coin recharge checkout
```

## ⚠️ CORS note (important for production)
The Pretika API has **no CORS headers** (it only ever served a native mobile app).
A browser therefore can't call it cross-origin. This project handles it two ways:

- **Dev:** Vite proxies `/api`, `/thumbnail`, `/uploads`, etc. to the API (see
  `vite.config.js`) so everything is same-origin and works out of the box.
- **Prod:** you must either
  1. serve this web build behind the same domain / a reverse proxy that forwards
     `/api` → the API, **or**
  2. enable CORS on the API for your web origin (an API-side change — needs approval).

Images render fine cross-origin (`<img>` isn't CORS-restricted); only XHR/fetch needs the proxy.

## Features built
- Splash → first-run **language gate** (English / हिन्दी), persisted
- **Auth:** login, register, forgot-password, Google sign-in (GIS), JWT + auto-refresh
- **Home feed:** greeting header, announcements, category chips, hero, trending / fresh /
  for-you rails, top creators — all live from the API, shimmer loading
- **Explore:** debounced search (stories + people) + category & sort filters
- **Story detail:** cover, creator, stats, like/save/share, about, tags, episode list with
  premium lock + coin unlock, comments (read + post)
- **Reader:** renders episode content (HTML / Quill-delta / plain text), font-size control,
  like, "finish" with +25 XP celebration, next-episode flow
- **Wallet:** balance card, recharge packs with Razorpay checkout, transaction history
- **Profile:** rank + XP progress, stats, saved stories, menu; **Edit profile** + avatar
  upload + become-creator
- **Chat:** private rooms list + inline message thread (polling)
- **Arena & Chat-guest:** themed "coming soon" / login states
- Graceful image fallbacks (free Unsplash horror art for stories, generated avatars)

## Design
Tokens copied 1:1 from the Flutter app's `CLAUDE.md` (`src/index.css`): light-mode only,
crimson `#CC0000`, Inter + Cinzel serif headings, 14px cards, pill chips, no drop shadows.

## Structure
```
src/
  lib/        api.js, constants.js, hooks.js, format.js, content.js
  store/      auth.js, lang.js
  i18n/       index.js, en.js, hi.js
  components/ Layout, BottomNav, StoryCard, Img, LanguageSheet, Skeleton, ...
  pages/      Splash, LanguageGate, Login, Register, Forgot, Home, Explore,
              StoryDetail, Reader, Wallet, Profile, EditProfile, Arena, Chat, NotFound
```
