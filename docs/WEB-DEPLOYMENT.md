# Web / PWA deployment — Italiano

Step-by-step guide to ship the **browser version** of Italiano as an installable
Progressive Web App (PWA). No Apple Developer account required — users add the
app to their home screen from Safari or Chrome.

**Production URL (web):** `https://italiano-prod.vercel.app`

> Mobile / EAS deployment: **[DEPLOYMENT.md](./DEPLOYMENT.md)**  
> Architecture overview: **[ARCHITECTURE.md](../ARCHITECTURE.md)**

---

## 1. What you are deploying

| Piece | Vercel project | Repo path | URL example |
|-------|----------------|-----------|-------------|
| **Web / PWA** (static + service worker) | `italiano-prod` (root) | `/` | `https://italiano-prod.vercel.app` |
| **API** (DeepL, content, account) | `italiano-api` | `backend/` | `https://italiano-api.vercel.app` |
| **Auth + DB** | — | — | `https://<ref>.supabase.co` |

The web app and the API are **two separate Vercel projects** on the **same Git
repo**. The web project proxies `/api/*` to the backend via
[`vercel.json`](../vercel.json), so the browser never hits CORS issues.

```text
Browser  →  italiano-prod.vercel.app/api/translate
              ↓ (Vercel rewrite)
            italiano-api.vercel.app/api/translate
```

**Prerequisites:** `italiano-api` must already be deployed and working (see
[DEPLOYMENT.md §3](./DEPLOYMENT.md)). Supabase project with Google auth enabled
(see [DEPLOYMENT.md §2](./DEPLOYMENT.md)).

---

## 2. One-time setup

### 2.1 Link the Vercel web project (repo root)

```bash
cd /path/to/italiano    # ROOT — not backend/
npx vercel link
```

- Answer **Y** to set up this directory.
- **Link to existing project** → choose **`italiano-prod`**.
- **Do not** link to `italiano-api` — that belongs under `backend/`.
- When asked to pull env vars → **n** (configure manually below).

Confirm in **Vercel Dashboard → italiano-prod → Settings → General**:

| Setting | Value |
|---------|-------|
| Root Directory | `.` (empty / repo root) |
| Framework Preset | Other |
| Build Command | `npm run build:web` (from `vercel.json`) |
| Output Directory | `dist` |

The backend project **`italiano-api`** must keep **Root Directory = `backend`**.

### 2.2 Environment variables (web project only)

**Vercel → italiano-prod → Settings → Environment Variables** — add for **Production**
and **Preview**:

| Key | Value | Notes |
|-----|-------|-------|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | From Supabase → Project Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_…` or legacy `anon` key | Safe to expose; RLS protects data |

**Not required on web** (the app uses same-origin `/api/*` via rewrite):

- `EXPO_PUBLIC_TRANSLATE_ENDPOINT`
- `EXPO_PUBLIC_CONTENT_BASE_URL`

**Never** put server secrets (`DEEPL_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) in
the web project — they stay on `italiano-api` only.

### 2.3 Supabase — URL configuration

Open (replace `<ref>` with your project id, e.g. `akxtiooloqgpksffermk`):

`https://supabase.com/dashboard/project/<ref>/auth/url-configuration`

**Redirect URLs** — add every origin where users can sign in:

```text
http://localhost:8081/**
http://localhost:3000/**
https://italiano-prod.vercel.app/**
https://italiano-prod.vercel.app/auth/callback
https://*-marek-beranek-s-projects.vercel.app/**
```

If Vercel also assigns a deployment-specific URL (e.g. `italiano-xyz-marek-beranek-s-projects.vercel.app`),
add that origin too. Preview deploys match the `*-marek-beranek-s-projects.vercel.app`
wildcard. Custom domain later: append e.g. `https://italiano.example.com/**`.

**Site URL** — set to your primary web origin:

```text
https://italiano-prod.vercel.app
```

Keep `italiano://` in **Redirect URLs** if you also ship the native app; it does
not need to be the Site URL when web is primary.

**iOS PWA (Add to Home Screen):** OAuth returns to `/auth/callback`. If sign-in
still fails in the installed app, open `https://italiano-prod.vercel.app` in
**Safari** (not the home-screen icon), sign in there, then use the PWA — or
ensure **Site URL** is `https://italiano-prod.vercel.app`, not `italiano://`.

### 2.4 Google Cloud — no change for web

Google OAuth **Authorized redirect URI** stays a single Supabase callback:

```text
https://<ref>.supabase.co/auth/v1/callback
```

Do **not** add `localhost` or your Vercel domain to Google — Supabase handles
the second hop back to your app using the Redirect URLs from §2.3.

Provider credentials (Client ID + Secret) are configured in **Supabase →
Authentication → Providers → Google**, not in Vercel.

### 2.5 Neural TTS (optional, recommended for web)

On-device voices in Safari PWA sound robotic. For natural Italian pronunciation,
enable **cloud TTS** on the **API** project (`italiano-api`), not on `italiano-prod`.

**Vercel → italiano-api → Settings → Environment Variables** — add for **Production**
and **Preview**:

| Key | Value | Notes |
|-----|-------|-------|
| `OPENAI_API_KEY` | `sk-…` | From [OpenAI API keys](https://platform.openai.com/api-keys). When unset, `/api/tts` returns **503** and the web app falls back to the OS synthesizer (same robotic voice as before). |
| `OPENAI_TTS_MODEL` *(optional)* | `tts-1-hd` | Default if omitted. `tts-1` is cheaper; `tts-1-hd` sounds better. |
| `OPENAI_TTS_VOICE` *(optional)* | `nova` | Default if omitted. Multilingual; works well for Italian. |

After adding the key, **redeploy `italiano-api`**. The web app calls
`italiano-prod.vercel.app/api/tts` (rewrite → backend). **Sign-in is required**
— the endpoint uses the same Supabase Bearer JWT as translate.

**Cost (rough):** short words are fractions of a cent with `tts-1-hd`; audio is
cached in the browser for the session so repeated plays of the same word are free.

**Local backend:** add the same keys to `backend/.env` (see
[`backend/.env.example`](../backend/.env.example)), then `cd backend && npx vercel dev`.

Full backend env reference: **[DEPLOYMENT.md §3.3](./DEPLOYMENT.md)**.

---

## 3. Deploy

### Automatic (recommended)

Connect the repo to the `italiano-prod` Vercel project. Every push to `main` triggers:

```bash
npm run build:web
```

which runs `expo export -p web` and injects the service worker precache list.

### Manual

```bash
cd /path/to/italiano
npm run build:web
npx vercel --prod
```

Production URL: `https://italiano-prod.vercel.app`.
Ensure it is listed in Supabase Redirect URLs (§2.3) before testing Google
sign-in.

---

## 4. Local development

### Quick UI (hot reload, no service worker)

```bash
cp .env.example .env    # if needed — set EXPO_PUBLIC_SUPABASE_*
npx expo start --web -c
```

Opens `http://localhost:8081`. Vocabulary and lessons work offline via bundled
JSON + `localStorage`. **Translate / API calls** need the rewrite proxy (below)
because the dev server does not forward `/api/*`.

### Full stack + PWA (recommended for API / auth testing)

```bash
npm run build:web
npx vercel dev
```

Uses root `vercel.json` rewrites locally (often `http://localhost:3000`).
Google sign-in requires `http://localhost:3000/**` in Supabase Redirect URLs.

### Static bundle only (UI / SW, no live API)

```bash
npm run build:web
npx serve dist
```

`/api/*` is **not** proxied — translate and content precache from API will fail
unless you use `vercel dev` instead.

---

## 5. Post-deploy smoke test

1. Open `https://italiano-prod.vercel.app`.
2. **Chrome DevTools → Application** — Manifest present, Service Worker
   registered.
3. **Lekce** — open any lesson (rewrite + content API).
4. **Profil → Přihlásit Googlem** — redirect to Google, return signed-in.
5. **Hledat → postel** — result `letto` (rewrite + DeepL + JWT).
6. **TTS** — while signed in, tap play on a word; with `OPENAI_API_KEY` on
   `italiano-api` the voice should sound natural (neural). Without the key, OS
   voice fallback is unchanged.
7. **Slovíčka** — add a word, reload — still there (`localStorage`).
8. **Offline** — after one online visit: DevTools → Network → Offline → reload.
   Lessons, vocab, and quiz work; search shows a network error. Neural TTS needs
   network; cached words in the same session may still play from memory.

### Install on device

| Platform | Action |
|----------|--------|
| Android Chrome | Menu → **Install app** / banner |
| iPhone Safari | Share → **Add to Home Screen** |
| Desktop Chrome | Install icon in address bar |

---

## 6. Updating after go-live

| Change | Action |
|--------|--------|
| Web UI / hooks only | `git push` → Vercel rebuilds `italiano-prod` |
| New lesson JSON on server | `npm run content:push` + ensure `italiano-api` is redeployed; users get new bundles on next online visit (SW + content sync) |
| Backend API logic | `git push` → `italiano-api` redeploys; web rewrite picks it up automatically |
| New Supabase redirect (custom domain) | Add `https://new-domain/**` in Supabase → URL Configuration |
| Bump PWA cache | Any new `git push` rebuilds `sw.js` with a new precache hash |

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| **Invalid redirect URL** after Google | Web origin missing in Supabase | Add `https://italiano-prod.vercel.app/**` and `/auth/callback` (§2.3) |
| iOS PWA: blank OAuth window / *address is invalid* | Wrong Site URL (`italiano://`) or bare-origin redirect | Set Site URL to `https://italiano-prod.vercel.app`; redeploy with `/auth/callback` route |
| Google **redirect_uri_mismatch** | Wrong URI in Google Console | Only `https://<ref>.supabase.co/auth/v1/callback` in Google |
| Translate 404 / failed fetch on web | Rewrite missing or wrong backend URL | Check root [`vercel.json`](../vercel.json) `destination` points to `italiano-api.vercel.app` |
| Translate works on Vercel, not on `expo start --web` | Metro has no `/api` proxy | Use `vercel dev` after `build:web`, or test on deployed URL |
| Build fails on Vercel | Missing env or deps | Set `EXPO_PUBLIC_SUPABASE_*`; ensure `npm run build:web` passes locally |
| Lessons empty offline | First visit was offline | Open online once so service worker precaches bundles |
| Přihlášení OK but not signed in on localhost | Stale session / cache | Hard refresh; restart with `npx expo start --web -c` |
| Service Worker not registered (DevTools empty) | Broken `sw.js` on deploy (build placeholder bug) | Redeploy after fix; open `/sw.js` — must **not** contain `__PRECACHE_URLS__`; check Console for errors |
| TTS still robotic on web | `OPENAI_API_KEY` missing on `italiano-api` or not signed in | Add key (§2.5), redeploy API, sign in, hard refresh; check Network → `POST /api/tts` returns `audio/mpeg` not 503 |
| TTS silent / no play | 401 (expired session) or blocked autoplay | Re-login in Profil; tap play again (user gesture) |
| Can't find **Authentication** in dashboard | Wrong product (e.g. Vercel) | Use [supabase.com/dashboard](https://supabase.com/dashboard), not vercel.com |

Direct Supabase links (replace `<ref>`):

- URL Configuration: `https://supabase.com/dashboard/project/<ref>/auth/url-configuration`
- Google provider: `https://supabase.com/dashboard/project/<ref>/auth/providers`

---

## 8. Secrets checklist (web)

| Key | Web Vercel | `italiano-api` Vercel | Mobile `.env` | Git |
|-----|------------|-------------------------|---------------|-----|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ | — | ✅ | ✅ |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ | — | ✅ | ✅ |
| `EXPO_PUBLIC_TRANSLATE_ENDPOINT` | — | — | ✅ | ✅ |
| `DEEPL_API_KEY` | ❌ | ✅ | ❌ | ❌ |
| `OPENAI_API_KEY` *(optional, neural TTS)* | ❌ | ✅ | ❌ | ❌ |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | ✅ | ❌ | ❌ |

---

*Last updated for PWA layout: root `vercel.json`, `npm run build:web`,
`public/sw.js`, Supabase PKCE web auth, optional OpenAI neural TTS (`/api/tts`).*
