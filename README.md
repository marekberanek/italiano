# Italiano

Mobile app (Expo / React Native) for learning Italian: vocabulary with repetition, dictionary lookup with translation, lessons (grammar, situations, numbers, alphabet, weekdays, months) and pronunciation via the system TTS.

More detail: **[ARCHITECTURE.md](./ARCHITECTURE.md)** · Auth/sync design: **[docs/PLAN-auth-sync-offline.md](./docs/PLAN-auth-sync-offline.md)** · Full cloud setup (Supabase, Vercel, EAS, OAuth): **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)**

---

## Requirements

- **Node.js** 22 LTS (recommended) or 20+; avoid odd non-LTS versions if ESLint warns about `engines`
- **npm**
- For iOS: **Xcode** + simulator (macOS)
- For Android: **Android Studio** + emulator, or a physical device with USB debugging
- **Vercel CLI** for local backend: `npm i -g vercel` (or use `npx vercel` in `backend/`)
- (Optional) **DeepL API** key for real translation in the *Search* tab
- (Optional) **Supabase** free project for sign-in (Google / Apple) and cloud vocabulary sync

---

## 0. Clone the repository

```bash
git clone https://github.com/marekberanek/italiano.git
cd italiano
```

---

## 1. Backend (DeepL proxy) — run this first

The app’s *Search* tab calls your backend; the backend holds `DEEPL_API_KEY` so it never ships in the mobile binary.

### 1.1 DeepL API key (optional but needed for real translation)

1. Sign up at [DeepL API](https://www.deepl.com/pro-api).
2. Create an **API key** in the dashboard.
3. Free keys end with **`:fx`** — the proxy picks `api-free.deepl.com` vs `api.deepl.com` from that suffix.
4. Keep **Czech** and **Italian** enabled (default).

### 1.2 Install and configure `backend/`

```bash
cd backend
npm install --registry https://registry.npmjs.org/
```

Create **`backend/.env`** (this file is gitignored; do **not** commit secrets):

```bash
echo "DEEPL_API_KEY=xxxxxxxx:fx" > .env
```

Use **`.env`** (not `.env.local`) for `vercel dev` — older Vercel CLI versions load `.env` reliably for local dev. After editing `.env`, restart `vercel dev`.

### 1.3 Log in to Vercel (first time only)

```bash
vercel login
```

Prefer a recent CLI (`npm i -g vercel@latest`) — it uses a simpler device-code flow if GitHub redirect gets stuck.

### 1.4 Start the local API

From `backend/`:

```bash
vercel dev
# or: npm start   (same command, see backend/package.json)
```

Default URL: **http://localhost:3000**. Smoke test:

```bash
curl -s -X POST http://127.0.0.1:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"query":"dobrý den"}' | jq .
```

You should see JSON with `it` and `cz`. If you see `DEEPL_API_KEY is not configured`, check `backend/.env`, spelling of `DEEPL_API_KEY`, and restart `vercel dev`.

### 1.5 Backend troubleshooting

| Problem | Likely cause |
|---------|----------------|
| `DEEPL_API_KEY is not configured` | Missing `backend/.env`, wrong variable name, or `vercel dev` not restarted after creating the file. |
| `DeepL 403` / `456` | Invalid key, quota, or language not allowed on your plan. |
| `vercel dev` recursive error | Do not name an npm script `dev` that runs `vercel dev` — this repo uses `npm start` instead. |
| `npm install` timeout to `repo.plus4u.net` | Use `npm install --registry https://registry.npmjs.org/` or set `registry=https://registry.npmjs.org/` in `~/.npmrc`. |

### 1.6 Deploy backend to Vercel (production)

1. In `backend/`: `vercel link` (once), then `vercel --prod` or connect the GitHub repo in the Vercel dashboard.
2. **Project → Settings → Environment Variables:** set `DEEPL_API_KEY`, and (for account delete/export) `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — see §3 and [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) §6.
3. Copy the deployed base URL (e.g. `https://your-project.vercel.app`) — you will use it in the app `.env` as `EXPO_PUBLIC_TRANSLATE_ENDPOINT` and optionally `EXPO_PUBLIC_CONTENT_BASE_URL`.

---

## 2. Supabase (optional — sign-in + cloud vocabulary)

Skip this section if you only want offline lessons and local vocabulary.

### 2.1 Create an account and project

1. Go to [supabase.com](https://supabase.com) and sign up (e.g. with GitHub).
2. **New project** → pick a name, choose an **EU region** (e.g. Frankfurt / Ireland), set a database password, create the project.
3. Wait until the project is **healthy** (green) in the dashboard.

### 2.2 API keys for the mobile app

In the Supabase dashboard: **Project Settings → API**

- **Project URL** → copy into `EXPO_PUBLIC_SUPABASE_URL` in the app root `.env`.
- **`anon` `public` key** → copy into `EXPO_PUBLIC_SUPABASE_ANON_KEY`.  
  Safe to ship in the app; **Row Level Security** protects data.

Never put the **service_role** key in the app — only on the server (Vercel env for `api/account/*`).

### 2.3 Database schema (migrations)

SQL migrations live in **`supabase/migrations/`** (e.g. `profiles`, `vocab_items`, `study_events`, RLS).

**Option A — Supabase CLI (recommended for repeat deploys)**

```bash
brew install supabase/tap/supabase   # or see https://supabase.com/docs/guides/cli
supabase login
cd /path/to/italiano
supabase link --project-ref <your-project-ref>   # from Dashboard → Project Settings → General
supabase db push
```

**Option B — Dashboard SQL**

Open **SQL Editor**, paste the contents of the migration file(s), run.

### 2.4 Auth providers (Google + Apple)

Sign-in is opt-in: skip this section if you only need offline vocabulary. For full sign-in, enable at least Google. Apple is iOS-only and requires a paid Apple Developer account.

#### 2.4.1 Google

1. **Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com)) → create / pick a project (e.g. `italiano`).
2. **APIs & Services → OAuth consent screen** → **External**, fill in app name and support e-mail, save.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - **Application type: Web application** (this is the one Supabase needs).
   - **Authorized redirect URIs** → add **exactly**:  
     `https://<your-project-ref>.supabase.co/auth/v1/callback`  
     (replace `<your-project-ref>` with the host from Supabase **Project Settings → API → Project URL**).
   - Save and copy **Client ID** and **Client Secret**.
4. **Supabase Dashboard → Authentication → Providers → Google**:
   - Toggle **Enable Sign in with Google** → **on**.
   - Paste the Web **Client ID** and **Client Secret** from step 3, save.
5. **Authentication → URL Configuration**:
   - **Site URL**: `italiano://`
   - **Redirect URLs** → add `italiano://` (the Expo deep-link scheme from `app.json` → `expo.scheme`).

> If sign-in still returns `Unsupported provider: provider is not enabled`, the Google toggle is off in Supabase, or the app talks to a different Supabase project than the one you configured (check `EXPO_PUBLIC_SUPABASE_URL`).

#### 2.4.2 Apple (optional, iOS only)

Requires Apple Developer Program ($99/year). Full step-by-step: **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** §4.3.

The app uses **`expo-apple-authentication`** (native flow) and exchanges the `id_token` via `signInWithIdToken({ provider: "apple" })`. In Supabase you only need to enable the **Apple** provider with your Service ID, Team ID, Key ID and `.p8` private key contents.

### 2.5 Wire the backend (Vercel) to Supabase

For `GET /api/account/export` and `DELETE /api/account/delete`, set on the **same Vercel project** as the `backend/`:

| Variable | Where to copy from |
|----------|---------------------|
| `SUPABASE_URL` | Same as `EXPO_PUBLIC_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | Same as `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → **Project Settings → API** → `service_role` (server only) |

---

## 3. Mobile app (Expo)

Run this **after** the backend is up (or skip translate URL if you only need offline mode).

### 3.1 Install dependencies

From the **repository root** (`italiano/`, next to `package.json`):

```bash
npm install --registry https://registry.npmjs.org/
```

### 3.2 Environment file

```bash
cp .env.example .env
```

Edit **`.env`** in the project root:

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_TRANSLATE_ENDPOINT` | Full URL to `POST /api/translate`. See **host matrix** below. |
| `EXPO_PUBLIC_SUPABASE_URL` | From Supabase §2.2 (leave empty to disable cloud auth/sync UI). |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | From Supabase §2.2. |
| `EXPO_PUBLIC_CONTENT_BASE_URL` | Optional; same origin as your deployed backend without `/api/...` path, e.g. `https://your-project.vercel.app`, for remote lesson JSON. |

**Pick the right host for your runtime** (otherwise the app spins forever waiting for a request that never lands):

| Runtime | Use |
|---------|-----|
| iOS Simulator | `http://127.0.0.1:3000/api/translate` (simulator shares the Mac's `localhost`) |
| Android Emulator | `http://10.0.2.2:3000/api/translate` (emulator alias for the host) |
| Physical phone in Expo Go | `http://<your-Mac-LAN-IP>:3000/api/translate` — get IP via `ipconfig getifaddr en0` (Wi-Fi). Same Wi-Fi as the Mac! |
| Production | `https://<your-project>.vercel.app/api/translate` |

Restart Metro after any change: `Ctrl+C`, then `npm start`.

You can mirror values in `app.json` → `expo.extra` for EAS builds without committing `.env`.

### 3.3 Run Expo

```bash
npm start
# or: npx expo start
```

Then press **`i`** (iOS simulator), **`a`** (Android), or scan the QR code in **Expo Go** (same Wi‑Fi as your PC, or use tunnel mode).

```bash
npm run ios
npm run android
npm run web
```

### 3.4 Behaviour without configuration

- **No `EXPO_PUBLIC_TRANSLATE_ENDPOINT`:** *Search* uses a **local fallback** (no real DeepL).
- **No Supabase env vars:** Profile / cloud sync features stay disabled; local vocabulary still works.
- **No `EXPO_PUBLIC_CONTENT_BASE_URL`:** lessons use **bundled** JSON under `assets/data/` plus any cached copy in AsyncStorage. User vocabulary is **not** part of that sync.

---

## 4. Other useful commands

```bash
npm run lint               # ESLint (Expo)
npx tsc --noEmit           # TypeScript check
npm run generate:grammar   # regenerate assets/data/grammar.json
```

---

## 5. Repository layout (short)

| Path | Purpose |
|------|---------|
| `app/` | Expo Router — screens and navigation |
| `assets/data/` | Bundled JSON lessons |
| `components/` | Shared UI |
| `constants/theme.ts` | Design tokens |
| `hooks/` | `useVocabStore`, `useItalianTts`, … |
| `lib/` | API clients, auth, vocab storage, content sync |
| `backend/` | Vercel serverless: translate, content, account |
| `supabase/migrations/` | Postgres schema for profiles / vocab / events |

---

## License

Private project — adjust as needed.
