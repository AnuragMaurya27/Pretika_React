# CLAUDE.md — Pretika (React web)

Pretika is a Hindi horror‑stories platform (read · write · audio). This repo is the
**React + Vite web frontend**. It talks to the **HauntedVoiceUniverse** .NET API.

## Stack
- React 19 + Vite 8, React Router v7, `@tanstack/react-query`, Zustand, framer-motion,
  i18next (hi/en), lucide-react, axios, react-hot-toast.
- Design system: indigo, light-only. Tokens + advanced UI layer (3D tilt, glass, aurora,
  Apple‑style shadows, `prefers-reduced-motion`) live in `src/index.css`.

## Run
```bash
npm install
npm run dev        # http://localhost:5173 (Vite proxies /api → VITE_API_BASE_URL)
npm run build      # production build to dist/
npm run lint
```

## API config (`.env`)
`VITE_API_BASE_URL` sets the backend. In dev, Vite proxies `/api`, `/uploads`, etc. to it
(the API has no CORS, so we stay same‑origin via the proxy — see `vite.config.js`).
- **Local API (default):** `http://localhost:5182`
- **Hosted API:** `https://pretika-api-1.onrender.com` (render free‑tier, cold‑starts)

### Running the local .NET API
The backend lives at `../HauntedVoiceUniverse` (.NET 8 target). This machine has .NET 10
but **not** the 8.0 runtime, so run with roll‑forward + an explicit content root:
```bash
PORT=5182 \
ASPNETCORE_ENVIRONMENT=Development \
ASPNETCORE_CONTENTROOT=/Users/anuragkivani/Downloads/HauntedVoiceUniverse \
DOTNET_ROLL_FORWARD=LatestMajor \
Jwt__SecretKey='<dev secret from appsettings.Development.json>' \
dotnet /Users/anuragkivani/Downloads/HauntedVoiceUniverse/bin/Debug/net8.0/HauntedVoiceUniverse.dll
```
It binds `http://0.0.0.0:$PORT` (Program.cs uses `PORT`, default 8080 — set it!) and needs
local Postgres (`localhost:5432`, db `Anurag_ki_vani_DBO`). Auth: email/password (Google is
disabled in the UI). Login does **not** require email verification.

## Gotchas
- **Content language** is a full word: `hindi` / `english` / `hinglish` — never the i18n
  codes `hi`/`en` (the API 500s on those). `localStorage["pretika_app_language"]` must be a
  full word; the lang store already uses them.
- **Category filtering** uses the category **slug** (`?category=urban-legends`), not the name.
  Only categories with `total_stories > 0` are shown.
- Stories/episodes are language‑filtered on Home; category browse drops the language filter so
  every story in a category shows (`useStories({ category, language: null })`).

## Layout of `src`
- `pages/` — routes (Home, Explore, StoryDetail, Reader, Login/Register/Forgot,
  CreatorProfile `/u/:username`, Profile, Wallet, Creator*, Chat, …).
- `components/` — `StoryCard`, `Tilt` (3D hover), `Seo` (per‑route head/JSON‑LD), `Img`
  (graceful fallbacks), navs, sheets, skeletons.
- `lib/` — `api.js` (axios + envelope unwrap + token refresh), `hooks.js` (react‑query),
  `constants.js`, `format.js`, `content.js`, `reading.js`.
- `store/` — `auth.js`, `lang.js` (Zustand). `i18n/` — translations.

## SEO / AdSense
`index.html` has OG/Twitter/JSON‑LD; per‑route meta via `<Seo …>` (supports `robots`,
`keywords`, `publishedTime` — auth/private pages are `noindex`, search results too).
Story pages emit Article + BreadcrumbList JSON‑LD; creator pages ProfilePage/Person.
- **Sitemap**: `npm run sitemap` (auto‑runs in `npm run build`) — `scripts/generate-sitemap.mjs`
  fetches stories/categories/creators from the hosted API and writes `public/sitemap.xml`.
  Never fails the build; override API with `SITEMAP_API_BASE`.
- **AdSense pages**: `/about`, `/contact`, `/privacy`, `/terms` (StaticPage shell,
  linked from the footer). Contact email lives in `src/pages/Contact.jsx` (`SUPPORT_EMAIL`).
- `public/og-cover.jpg` is the default share image; `public/_redirects` + `vercel.json`
  provide the SPA fallback (deep links must serve index.html, else nothing gets indexed).
- After AdSense approval: add `public/ads.txt` with the real `pub-…` ID.
