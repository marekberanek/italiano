# Deployment — Italiano (cloud-only)

This document is a **linear recipe** that takes you from a fresh laptop to a
working build of the **Italiano** app on your phone, with **everything in the
cloud** — no `vercel dev`, no Metro, no Mac in the loop while you test.

By the end you will have:

- backend (DeepL proxy + content + account API) running on **Vercel**,
- auth + DB on **Supabase** (Google sign-in),
- mobile binaries built by **EAS** and installed via **TestFlight** /
  **Internal app sharing** so you can use the phone alone.

> Architecture: **[ARCHITECTURE.md](../ARCHITECTURE.md)** ·
> Sync design: **[PLAN-auth-sync-offline.md](./PLAN-auth-sync-offline.md)**
> Local dev (Metro, `vercel dev`): **[../README.md](../README.md)**

---

## 0. What you'll set up (once)

| # | Service | Purpose | Cost (free tier) |
|---|---------|---------|------------------|
| 1 | **GitHub** | source of truth | $0 |
| 2 | **Supabase** (EU) | Auth + Postgres + RLS | $0 (1 project, ~50k MAU) |
| 3 | **Google Cloud Console** | OAuth client for Google sign-in | $0 |
| 4 | **DeepL API** | translation source | $0 (500k chars/month) |
| 5 | **Vercel** | serverless API + content bundle | $0 (hobby plan) |
| 6 | **Expo / EAS** | mobile build pipeline | $0 (limited builds/month) |
| 7 | **Apple Developer** ($99/yr) | only if you want **TestFlight** on iOS | paid |
| 8 | **Google Play console** ($25 once) | only if you want a **Play track** on Android | paid |

> Apple Sign-In is currently **hidden** in the app (see `app/(tabs)/profile.tsx`).
> The recipe below sets up **Google sign-in only**. To re-enable Apple later,
> follow §2.5 (kept at the end for reference).

---

## 1. GitHub — push the repo

```bash
git remote -v   # confirm origin = git@github.com:<you>/italiano.git
git push -u origin main
```

Branch convention:

- `main` → Vercel **Production** + EAS `production` profile.
- `dev`  → Vercel **Preview** URLs (each PR has its own).

---

## 2. Supabase — project, auth, DB

### 2.1 Create the project

1. [supabase.com](https://supabase.com) → **New project** → name `italiano-prod`,
   region `eu-central-1` (Frankfurt) or `eu-west-1` (Ireland).
2. From **Settings → API** copy:
   - `Project URL` → `https://<ref>.supabase.co`
   - `anon` public key (**safe** to ship in the mobile binary, RLS protects
     data),
   - `service_role` secret key (**never** ships to mobile; server-only).

### 2.2 Apply DB migrations

Repo already contains the SQL in `supabase/migrations/`.

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref <ref>
supabase db push
```

This creates `profiles`, `vocab_items`, `study_events` with RLS and the
auto-create-profile trigger.

### 2.3 Enable Google as auth provider

1. **Google Cloud Console** → create project `italiano`.
2. **APIs & Services → OAuth consent screen** → External, fill product info +
   support e-mail.
3. **Credentials → Create OAuth Client ID**:
   - **Web application** (this one ends up in Supabase) — Authorized redirect URI:
     `https://<ref>.supabase.co/auth/v1/callback`.
   - (Later, when you build with EAS) add **iOS** Client ID with the bundle id
     from `app.json`, and **Android** Client ID with the package name + the
     SHA-1 you get from `eas credentials`.
4. **Supabase Dashboard → Authentication → Providers → Google**:
   - **Enable**,
   - paste **Client ID** + **Client Secret** of the Web application.
5. (Optional) toggle **Skip nonce check** if Expo's Google flow complains.

### 2.4 Auth → URL configuration

The app comes back from OAuth via the **deep link** `italiano://`. Both URLs
have to be on Supabase's allow-list, otherwise sign-in fails with
*Invalid redirect URL*.

**Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL**: `italiano://`
- **Redirect URLs** → add: `italiano://`
  (matches `expo.scheme` in `app.json` and what `makeRedirectUri({ scheme: "italiano" })` produces in `lib/auth/auth-context.tsx`).
- If you ever ship a **web build**, add the matching `https://…/auth-callback`
  URL too.

### 2.5 (Optional, later) Apple Sign-In

Apple Sign-In is **disabled in the UI** for now. To turn it on you also need:

1. **Apple Developer → Identifiers → Services IDs** → create
   `com.italiano.web`. In the Service ID detail enable *Sign In with Apple*,
   **Configure** → Domain `<ref>.supabase.co`, Return URL
   `https://<ref>.supabase.co/auth/v1/callback`.
2. **Apple Developer → Keys** → New Key, enable *Sign In with Apple*, download
   the `.p8` (only once!).
3. **Supabase → Apple provider** → Service ID, Team ID, Key ID, paste `.p8`
   contents.
4. In `app/(tabs)/profile.tsx` un-hide the *Přihlásit přes Apple* button
   (currently commented out).

---

## 3. Vercel — deploy the backend

The Expo app talks to `https://<your-app>.vercel.app/api/...` for translation,
content, and account endpoints. **`DEEPL_API_KEY` and the Supabase
service-role key never leave Vercel** — that's why they live on the server.

### 3.1 Get a DeepL key

1. Sign up at [DeepL API](https://www.deepl.com/pro-api), pick the **Free**
   plan.
2. Copy the API key. **Free** keys end with `:fx`; the proxy
   (`backend/api/translate.ts`) auto-picks `api-free.deepl.com` from that
   suffix.

### 3.2 First deploy

```bash
cd backend
npm i -g vercel@latest
vercel login
vercel link        # creates / links a Vercel project (use the suggested name or change it)
vercel --prod      # first production deploy
```

When Vercel asks for the **project name**, pick something free, e.g.
`italiano-app`. That gives you `https://italiano-app.vercel.app`. If the name
is taken, Vercel adds a suffix; you can rename later in **Settings → General →
Project Name** (the old subdomain stops working immediately, so update the app
`.env` right after).

### 3.3 Set env vars (Production **and** Preview)

**Vercel Dashboard → Project → Settings → Environment Variables**:

| Key | Value | Used by |
|-----|-------|---------|
| `DEEPL_API_KEY` | DeepL API key (`xxxxxxx:fx`) | `api/translate.ts` |
| `CONTENT_VERSION` | `2` (bump on lesson JSON changes) | `api/content-manifest.ts` |
| `SUPABASE_URL` | `https://<ref>.supabase.co` | `api/account/*` |
| `SUPABASE_ANON_KEY` | Supabase **anon** key | `api/account/*` (verifies user JWT) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service role** key | `api/account/*` (admin actions) |

Set the same values for **Production** and **Preview** environments. After
saving, redeploy: **Deployments → … → Redeploy** (or push a new commit).

### 3.4 (Optional) Region

In `backend/vercel.json` add `"regions": ["fra1"]` for lower EU latency.

### 3.5 Smoke-test the live API

```bash
curl -sS -X POST https://italiano-app.vercel.app/api/translate \
  -H "Content-Type: application/json" \
  -d '{"query":"postel"}' | jq .
# expected: { "it": "letto", "cz": "postel", "p": "letto", ... }

curl -sS https://italiano-app.vercel.app/api/content-manifest | jq .
# expected: { "version": 2, "bundles": [...] }
```

If `/api/translate` returns **500 / 503**, `DEEPL_API_KEY` is missing or wrong.

### 3.6 Existing endpoints (reference)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/translate` | DeepL proxy (no auth) |
| `GET /api/content-manifest` | Bundle manifest (versions) |
| `GET /api/content-bundle?bundle=…` | Single JSON bundle |
| `POST/DELETE /api/account/delete` | Delete user (verifies JWT, then `auth.admin.deleteUser` with service role) |
| `GET /api/account/export` | Export profile + vocab — verified by Bearer JWT |

### 3.7 (Optional) Custom domain

Free plan allows unlimited domains in **Settings → Domains**:

- add `api.italiano.tld` → Vercel prints the DNS record (CNAME / A) to add at
  your registrar, manages the certificate automatically.
- update the mobile `.env` with `https://api.italiano.tld`.

---

## 4. Mobile app — point it at the cloud

`EXPO_PUBLIC_*` values are **baked into the JS bundle** at build time, both for
Metro dev builds and EAS production builds. Two places need to match:

### 4.1 Local `.env` (used by `npx expo start` and EAS builds)

```env
EXPO_PUBLIC_TRANSLATE_ENDPOINT=https://italiano-app.vercel.app/api/translate
EXPO_PUBLIC_CONTENT_BASE_URL=https://italiano-app.vercel.app
EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxx
```

Then **always restart Metro with `-c`** after touching `.env`:

```bash
npx expo start -c
```

### 4.2 (Optional) `app.json` defaults

If you don't want to ship a `.env` (e.g. on CI), put the **same** values into
`app.json → expo.extra`:

```jsonc
"extra": {
  "translateEndpoint": "https://italiano-app.vercel.app/api/translate",
  "contentBaseUrl": "https://italiano-app.vercel.app",
  "supabaseUrl": "https://<ref>.supabase.co",
  "supabaseAnonKey": "sb_publishable_xxxxxxxx"
}
```

> ❗ **Never** put `DEEPL_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or any other
> secret into the mobile config — both `.env` and `expo.extra` end up inside
> the binary that anyone can decompile.

---

## 5. EAS — build & install on your phone

This is the step that makes the app run on a phone **without your laptop**.

### 5.1 Tooling

```bash
npm i -g eas-cli
eas login
```

In the **repo root**:

```bash
eas init                  # creates a new Expo project, fills app.json → extra.eas.projectId
eas build:configure       # generates eas.json
```

> If you previously ran `eas init --id italiano` and got *Invalid UUID
> appId*, delete the bogus block from `app.json` (`extra.eas.projectId`) and
> run `eas init` **without** `--id` so EAS can mint a real UUID.

### 5.2 `eas.json` (sketch)

```json
{
  "build": {
    "preview":    { "distribution": "internal", "channel": "preview" },
    "production": { "channel": "production" }
  },
  "submit": { "production": {} }
}
```

`distribution: "internal"` is the magic flag — EAS gives you a download link
(or TestFlight invite) usable from the phone, no store review needed.

### 5.3 iOS — TestFlight (requires Apple Developer $99/yr)

```bash
eas build -p ios --profile preview
```

EAS handles signing (`eas credentials`), uploads to App Store Connect, and
prints a TestFlight link. On the phone:

1. Install **TestFlight** from App Store.
2. Open the e-mail invite → **Accept** → **Install**.
3. Launch *italiano*, tap **Přihlásit Googlem**, search *postel* → expect
   `letto`.

> No Apple Developer account yet? Use the **iOS Simulator build**:
> `eas build -p ios --profile preview --simulator`, then drag the resulting
> `.app.tar.gz` onto a running simulator. Real-device install is not possible
> without a paid account.

### 5.4 Android — Internal app sharing (no Play console required)

```bash
eas build -p android --profile preview
```

EAS prints an **APK download URL**:

1. Open the link **on the phone** (Wi-Fi is enough).
2. Allow installs from unknown sources for your browser, install the APK.
3. Launch *italiano* and verify Google sign-in + search.

> For Play **Internal track** later: `eas submit -p android --latest` (needs a
> Play console one-off $25).

### 5.5 OTA updates (later)

After the first binary is on the phone, JS-only changes can be pushed in
seconds:

```bash
eas update --branch preview --message "fix grammar layout"
```

The phone picks up the bundle on next launch. Native changes (new plugin,
Info.plist) still require a fresh `eas build`.

---

## 6. End-to-end smoke test (on the phone)

1. Open *italiano*.
2. **Hledat → "postel"** → result `letto` (proves Vercel + DeepL).
3. **+ Přidat do slovíček** → switch to **Slovíčka** → row appears (proves
   AsyncStorage).
4. **Profil → Přihlásit Googlem** → opens system browser, returns to the app
   signed-in (proves Supabase URL config + Google client + deep link).
5. **Profil → Synchronizovat** → no error (proves Postgres + RLS +
   `EXPO_PUBLIC_SUPABASE_*`).
6. Close + relaunch the app offline — vocab + lessons still work (proves
   bundled JSON + cache).

---

## 7. Iterating after go-live

| What changed | What to do |
|--------------|------------|
| Backend code (`backend/api/*.ts`) | `git push` — Vercel auto-redeploys `main` to production, PRs get preview URLs. |
| Lesson JSON (`backend/content/*.json`) | Bump `CONTENT_VERSION` in Vercel envs **and** redeploy, so manifest hash changes and clients refetch. |
| Mobile JS (UI, hooks) | `eas update --branch preview` — instant. |
| Native deps / new plugin | `eas build` again. |
| Supabase schema | Add a new file in `supabase/migrations/`, `supabase db push`. |

---

## 8. Secrets — where each value belongs

| Key | Mobile (`.env` / `extra`) | Vercel env | Supabase | Git |
|-----|---------------------------|------------|----------|-----|
| `EXPO_PUBLIC_TRANSLATE_ENDPOINT` | ✅ | — | — | ✅ (URL only) |
| `EXPO_PUBLIC_CONTENT_BASE_URL` | ✅ | — | — | ✅ |
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ | — | — | ✅ |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ | — | — | ✅ (anon key is not secret) |
| `DEEPL_API_KEY` | ❌ | ✅ | — | ❌ |
| `SUPABASE_URL` (server) | — | ✅ | — | ❌ |
| `SUPABASE_ANON_KEY` (server) | — | ✅ | — | ❌ |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌❌ NEVER | ✅ (serverless only) | — | ❌ |
| Google OAuth Client Secret | ❌ | ❌ | ✅ | ❌ |
| Apple `.p8` (later) | ❌ | ❌ | ✅ | ❌ |

> **Service role key** = full DB access, **bypasses RLS**. It belongs **only**
> on the server (Vercel env).

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| *Hledat* spinner forever, then "Vypršel čas (10 s)" | App points at a host the phone can't reach | Use the Vercel HTTPS URL in `.env`, then `npx expo start -c` (or rebuild with EAS). |
| "Server vrátil 500/503" on translate | Missing `DEEPL_API_KEY` on Vercel | Add it under Settings → Env Vars and **Redeploy**. |
| Google sign-in returns *Unsupported provider* | Provider not enabled or wrong project | Re-check §2.3 (toggle ON, Web Client ID + Secret). |
| *Invalid redirect URL* after Google login | `italiano://` not in allow-list | Add it under Auth → URL Configuration (§2.4). |
| EAS build fails: *Invalid UUID appId* | `app.json` has a bogus `extra.eas.projectId` | Remove that block, run `eas init` (no `--id`). |
| Vocab not syncing across devices | User signed-in on only one device, or RLS blocks | Profile → Synchronizovat; check Supabase logs. |

---

## 10. Cost ballpark

| Service | Free tier suffices when… | Paid kicks in at |
|---------|--------------------------|------------------|
| Supabase | <50k monthly active users, <500 MB DB | bigger usage |
| Vercel | <100 GB bandwidth/month, hobby usage | high traffic |
| Expo / EAS | a few builds/month | priority queue, more concurrency |
| DeepL Free | <500k characters/month | DeepL Pro |
| Apple Dev | — | $99/year (TestFlight + App Store) |
| Google Play | — | $25 one-off (Play Store) |

---

*Keep this doc in sync with every cloud-stack change. For day-to-day local
development (Metro, `vercel dev`, hot reload) see [README.md](../README.md).*
