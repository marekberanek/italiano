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
2. From **Project Settings → API** copy and stash safely:
   - **Project URL** → `https://<ref>.supabase.co`
   - **`anon` public** key (**safe** to ship in the mobile binary, RLS protects
     data),
   - **`service_role` secret** key (**never** ships to mobile; server-only).

> **What is `<ref>`?** A short alphanumeric **Project Reference ID** that
> Supabase generates for every project. You can read it in three places:
>
> - in the **Project URL** itself — it's the subdomain before `.supabase.co`
>   (e.g. `https://bkqoecnghxjrzasztbsz.supabase.co` → ref =
>   `bkqoecnghxjrzasztbsz`),
> - in the browser address bar on the dashboard:
>   `https://supabase.com/dashboard/project/<ref>`,
> - in **Project Settings → General → Reference ID** (the dashboard even has a
>   little "copy" button next to it).
>
> You'll reuse the same `<ref>` everywhere below — in `supabase link`, in the
> Google OAuth redirect URI, and in `EXPO_PUBLIC_SUPABASE_URL` (§4.1).

> **Where exactly is the `service_role` key?** Supabase's UI changed in 2025;
> use whichever path you see:
>
> - **Newer dashboard (2025+):** left sidebar **Project Settings (⚙)** →
>   **API Keys** tab. You'll see two cards:
>   - **Publishable** (`sb_publishable_…`) — same role as the old `anon`,
>     *put it into the mobile app*.
>   - **Secret** (`sb_secret_…`) — same role as the old `service_role`,
>     **server-only**. Click **Reveal** to see it (it's hidden by default).
> - **Legacy dashboard:** **Project Settings → API → Project API keys**, the
>   row labelled **`service_role` (secret)** with a **Reveal / Copy** button.
> - Direct link: `https://supabase.com/dashboard/project/<ref>/settings/api`.
>
> ⚠️ The `service_role` / `Secret` key bypasses **all** Row-Level Security.
> It belongs **only** in Vercel env vars (`SUPABASE_SERVICE_ROLE_KEY`, §3.3).
> Never paste it into `app.json`, `.env` of the Expo app, screenshots, chat,
> or git. If you ever leak it, hit **Rotate** in the same screen and update
> Vercel before re-deploy.

### 2.2 Apply DB migrations

Repo already contains the SQL in `supabase/migrations/`. Pick **one** of:

#### Option A — `npm run db:migrate` (no extra tools)

The repo ships `scripts/db-migrate.mjs`, a small Node script that runs every
file in `supabase/migrations/` in filename order over a direct Postgres
connection. It only needs **one** env var:

1. Supabase Dashboard → open the project → green **Connect** (top bar) →
   **Session pooler** (URI, port `5432`, host `*.pooler.supabase.com`, user
   `postgres.<ref>`). Copy it. Replace `[YOUR-PASSWORD]` with the database
   password from project creation (or reset it under **Database** (left nav,
   ikona válce) → **Settings** — *not* under ⚙ Project Settings; Supabase moved
   connection strings out of Project Settings in 2025).
2. Add to `backend/.env.local` (gitignored):

   ```env
   SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@<host>:6543/postgres
   ```

3. From the repo root run:

   ```bash
   npm run db:migrate
   ```

   The script is idempotent — every shipped migration uses
   `create … if not exists` / `add column if not exists` / `drop policy if
   exists` + `create policy`, so re-running it on an existing project is
   safe.

#### Option B — Supabase CLI

```bash
brew install supabase/tap/supabase
supabase login
# Replace <ref> with your Project Reference ID, e.g.
#   supabase link --project-ref bkqoecnghxjrzasztbsz
supabase link --project-ref <ref>
supabase db push
```

Either path creates `profiles`, `vocab_items`, `study_events` with RLS,
the auto-create-profile trigger, **and explicit `GRANT`s** on the
`authenticated` role (newer Supabase projects no longer auto-grant DML on
`public.*`, which previously caused
`permission denied for table vocab_items` at runtime).

It also creates the `content_bundles` + `content_meta` tables that hold
all lesson content (read-only for users) — see § 2.6 for how to seed them.

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

**Standalone / EAS builds** return from Google via the custom scheme
`italiano://` (`expo.scheme` in `app.json`). That URL must be on Supabase's
allow-list, otherwise sign-in fails with *Invalid redirect URL*.

**Expo Go** is different: `expo-linking` resolves OAuth return URLs to
`exp://…` (the Expo client), not `italiano://`. If Supabase only allows
`italiano://`, the browser never hands control back to Expo Go and
`openAuthSessionAsync` can spin indefinitely. The app therefore uses an
`exp://…/--/auth/callback`-style redirect in the Expo Go client; add that
pattern to **Redirect URLs** as well (see [Supabase redirect URL
wildcards](https://supabase.com/docs/guides/auth/redirect-urls) — e.g.
`exp://**` for local dev, or the exact URL Metro prints for your machine).

**Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL**: `italiano://` (or your production web origin if you ship web).
- **Redirect URLs** → at minimum add:
  - `italiano://` — matches `makeRedirectUri({ scheme: "italiano" })` for
    standalone / dev builds (`lib/auth/auth-context.tsx`).
  - One or more **`exp://…`** entries (or a documented wildcard) — required
    when testing **Google sign-in inside Expo Go**.
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

### 2.6 Seed lesson content into the DB

All lesson content (vocabulary, grammar, alphabet, pronunciation, situations,
…) lives in `public.content_bundles` in Supabase. The mobile app downloads it
via `/api/content-manifest` + `/api/content-bundle` and caches it in
AsyncStorage. **Users cannot modify or delete this content** — RLS only
grants `select` to `anon` / `authenticated`; writes require the service role
key and only happen via the script below.

Personal vocabulary (`public.vocab_items`) is a completely separate table —
adding a word from a lesson via the *“+ přidat do slovíček”* button creates a
row there, owned by the user. The lesson row itself stays untouched.

#### Push the bundles

The repo ships ~19 JSON files under `assets/data/` (the same files Expo
Router would otherwise bundle into the app binary). They are uploaded to
Supabase by `scripts/content-push.mjs`.

1. `backend/.env.local` must already have `SUPABASE_URL` +
   `SUPABASE_SERVICE_ROLE_KEY` (set during § 3.3 / dashboard *Project
   Settings → API*). The service role key bypasses RLS and is the only way
   to write to `content_bundles`.
2. From the repo root run:

   ```bash
   npm run db:migrate     # one-off — creates tables
   npm run content:push   # uploads/refreshes all bundles
   ```

   The script reads the bundle ID list from `lib/content/bundle-ids.ts`,
   computes a SHA-256 short hash per payload (stored in
   `content_bundles.version`) and bumps `content_meta.value` (key
   `'version'`) to a fresh ISO timestamp so existing app installs notice the
   change and re-pull on next sync.

3. Verify in the Supabase SQL editor:

   ```sql
   select id, version, jsonb_typeof(payload), updated_at
     from public.content_bundles
     order by id;

   select * from public.content_meta;
   ```

4. Re-run `npm run content:push` whenever you change an `assets/data/*.json`
   file (e.g. after `npm run generate:content`). The script is idempotent —
   only the changed payloads get a new hash and clients will re-download
   only what they need.

#### Adding a new bundle

1. Add the JSON file to `assets/data/<id>.json`.
2. Append the new ID to `CONTENT_BUNDLE_IDS` in `lib/content/bundle-ids.ts`
   **and** to `CONTENT_BUNDLE_IDS_FALLBACK` in
   `backend/api/_lib/bundle-ids.ts` (the latter is only used when DB is
   empty / unreachable).
3. Run `npm run content:push`.

#### Fallback behaviour

- DB unreachable / not yet seeded → `/api/content-manifest` returns the
  static `CONTENT_BUNDLE_IDS_FALLBACK` list with a short cache (10 s) so the
  client keeps working until the seed is done. `/api/content-bundle` will
  return `503` for known-but-unseeded bundle IDs and `404` for unknown ones.
- Mobile app offline → it keeps using whatever it cached in AsyncStorage,
  and as a last resort the JSON files bundled into the app binary.

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
`italiano-api`. That gives you `https://italiano-api.vercel.app`. If the name
is taken, Vercel adds a suffix; you can rename later in **Settings → General →
Project Name** (the old subdomain stops working immediately, so update the app
`.env` right after).

### 3.3 Set env vars (Production **and** Preview)

These are the variables every deployed function will read at runtime:

| Key | Value | Used by |
|-----|-------|---------|
| `DEEPL_API_KEY` | DeepL API key (`xxxxxxx:fx`) | `api/translate.ts` |
| `CONTENT_VERSION` | `2` for the first deploy; bump (`3`, `4`, …) every time you change `backend/content/*.json` | `api/content-manifest.ts` |
| `SUPABASE_URL` | `https://<ref>.supabase.co` | `api/translate.ts` (auth gate) and `api/account/*` |
| `SUPABASE_ANON_KEY` | Supabase **anon** key | `api/translate.ts` and `api/account/*` (verifies user JWT) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service role** key | `api/account/*` (admin actions) |

> **What is `CONTENT_VERSION`?** A short string (typically a monotonically
> increasing integer) that ships in the response of `GET /api/content-manifest`.
> The mobile app caches the lesson bundles in `AsyncStorage` together with this
> stamp; when the value differs from what the device remembers, the app
> re-downloads every bundle in `lib/content/sync-content.ts`.
>
> - **Default in code** (when env is unset): `"2"`. For the **first deploy** just
>   set it to `2` — that matches the JSON shipped in this repo.
> - **Bump it (`3`, `4`, …) every time you edit any file in
>   `backend/content/*.json`** (e.g. add new curated vocab, tweak numbers).
>   Otherwise users keep the cached, stale lessons forever.
> - Any string works (you could use `2026.05.10.1`), but a plain integer is
>   easiest to keep monotonic.
> - Don't set it to an empty value — clients then think "the version changed"
>   on every launch and re-download bundles needlessly.

You can put them in via **Dashboard** *or* **CLI** — pick one workflow:

#### Option A — Dashboard (clicking)

**Vercel Dashboard → Project → Settings → Environment Variables**, add each
key, tick **Production** *and* **Preview**, save. Then redeploy from
**Deployments → … → Redeploy** (or just push a new commit).

#### Option B — CLI (recommended, easier to keep in sync)

```bash
cd backend

# Push secrets into the cloud (you’ll be prompted for the value each time).
# Repeat for every environment you want to populate.
vercel env add DEEPL_API_KEY               production
vercel env add DEEPL_API_KEY               preview
vercel env add CONTENT_VERSION             production preview
vercel env add SUPABASE_URL                production preview
vercel env add SUPABASE_ANON_KEY           production preview
vercel env add SUPABASE_SERVICE_ROLE_KEY   production preview

# Re-deploy so the new envs take effect
vercel --prod
```

#### What about local `.env.local` / `.env.production`?

Vercel **does not upload** any `.env*` from your machine when deploying. The
deployed functions only see what lives in the dashboard. The `.env*` files
play a role only locally (`vercel dev`, lint/build):

| File (in `backend/`) | Read by | Useful for |
|----------------------|---------|------------|
| `.env.local` | `vercel dev` (highest priority, **git-ignored**) | your laptop secrets |
| `.env.development` | `vercel dev` | shared dev defaults |
| `.env.production` | `next build` only on your laptop; **ignored** by cloud Vercel | rarely needed for an API-only project |
| `.env` | fallback for all modes locally | non-secret defaults you can commit |

Keep things in sync with two CLI helpers:

```bash
# Pull cloud values back to a local file (great for switching machines)
cd backend
vercel env pull .env.local                                # pulls "development" by default
vercel env pull --environment=production .env.production  # only if you really need it locally

# Inspect what's stored remotely
vercel env ls
```

So the practical pattern is:

- **Locally** (`vercel dev`): edit `backend/.env.local` (test DeepL key, dev
  Supabase ref). Git-ignored.
- **Cloud (Production/Preview):** push values via `vercel env add` (or
  Dashboard) — they live only in Vercel.
- Want to mirror cloud → local? `vercel env pull` writes them into
  `.env.local` for you.

### 3.4 (Optional) Region

In `backend/vercel.json` add `"regions": ["fra1"]` for lower EU latency.

### 3.5 Smoke-test the live API

`/api/translate` requires a Supabase Bearer JWT (DeepL is a paid quota — only
signed-in mobile users get a translation). Grab a token with the supabase CLI
or sign in inside the app and read it from `expo-secure-store`:

```bash
# Anonymous request → 401 (expected behaviour)
curl -isS -X POST https://italiano-api.vercel.app/api/translate \
  -H "Content-Type: application/json" \
  -d '{"query":"postel"}'
# HTTP/1.1 401  …  {"error":"Missing Authorization Bearer token"}

# Signed-in request → 200 with translation
JWT="<paste a fresh Supabase access token here>"
curl -sS -X POST https://italiano-api.vercel.app/api/translate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{"query":"postel"}' | jq .
# expected: { "it": "letto", "cz": "postel", "p": "letto", ... }

curl -sS https://italiano-api.vercel.app/api/content-manifest | jq .
# expected: { "version": "<ISO timestamp>", "bundles": [...] }
```

If `/api/translate` returns **500 / 503**, `DEEPL_API_KEY` is missing or wrong.
If it returns **401** even with a valid-looking token, check that
`SUPABASE_URL` and `SUPABASE_ANON_KEY` are set on Vercel (the endpoint uses
them to call `auth.getUser`).

If `/api/content-manifest` returns `version: "fallback"` and a short cache,
the DB is unreachable or empty — run `npm run content:push` (see § 2.6).
A successful seed flips the version to an ISO timestamp.

### 3.6 Existing endpoints (reference)

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `POST /api/translate` | DeepL proxy used by Hledat (Search) screen | **Bearer JWT** (Supabase) — protects paid DeepL quota |
| `GET /api/content-manifest` | Bundle manifest (versions) | Public |
| `GET /api/content-bundle?bundle=…` | Single JSON bundle | Public |
| `POST/DELETE /api/account/delete` | Delete user (verifies JWT, then `auth.admin.deleteUser` with service role) | **Bearer JWT** |
| `GET /api/account/export` | Export profile + vocab | **Bearer JWT** |
| `GET /api/openapi` | OpenAPI 3.1 spec (machine-readable) | Public |
| `GET /api/docs` | Interactive **Scalar API Reference** UI | Public |

> JWT verification logic is shared in `backend/api/_lib/auth.ts`
> (`requireSupabaseUser`). Endpoints just call it and return the typed
> `{ status, error }` envelope on failure.
| `GET /api/` | Tiny landing page with links to the above |

> **Live docs:** open <https://italiano-api.vercel.app/api/docs> (or
> `http://localhost:3000/api/docs` while running `vercel dev`). The viewer
> reads the spec from `/api/openapi` (kept in `backend/api/openapi.ts`). When
> you add a new endpoint, update both the handler **and** the `paths` block in
> the spec so the docs stay in sync.

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
EXPO_PUBLIC_TRANSLATE_ENDPOINT=https://italiano-api.vercel.app/api/translate
EXPO_PUBLIC_CONTENT_BASE_URL=https://italiano-api.vercel.app
EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxx
```

Then **always restart Metro with `-c`** after touching `.env`:

```bash
npx expo start -c
```

### 4.2 (Optional) `app.json` defaults

If you don't want to ship a `.env` (e.g. on CI), put the **same** values into
`app.json → expo.extra`. **`process.env.EXPO_PUBLIC_*` always wins over
`Constants.expoConfig.extra` (see `lib/auth/config.ts`)** — so a `.env` value
will override whatever you have in `app.json`.

If you keep both a `.env` (local dev) and `.env.production` (EAS prod build),
make sure both files **point at the same Supabase project** until you really
want a separate dev/prod stack — otherwise dev runs and the shipped app see
different vocab data, and OAuth callbacks have to be configured twice.

```jsonc
"extra": {
  "translateEndpoint": "https://italiano-api.vercel.app/api/translate",
  "contentBaseUrl": "https://italiano-api.vercel.app",
  "supabaseUrl": "https://<ref>.supabase.co",
  "supabaseAnonKey": "sb_publishable_xxxxxxxx"
}
```

> ❗ **Never** put `DEEPL_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or any other
> secret into the mobile config — both `.env` and `expo.extra` end up inside
> the binary that anyone can decompile.

### 4.3 Local notification reminders

The app schedules **local-only** notifications (`expo-notifications`) to nudge
the user to revise a random word from their vocabulary. There is **no push
service**, no Expo push token, no Supabase table — everything is planned on
the device based on the user's preferences in **Profile → Připomínky**:

- **Vlastní rozvrh** — pick weekdays (Po–Ne) + an exact time (one notification
  per selected day at that time).
- **Náhodně** — pick 1×/2×/3× a day; the app spreads notifications randomly
  inside the **9:00–21:00** window.

Every time the user adds/removes a word, opens the app, or saves new settings,
the scheduler cancels all previously planned notifications and re-plans the
next batch (up to ~8 weeks ahead for `schedule`, ~14 days for `random`,
capped well below the iOS 64-notification limit). Tapping a notification
deep-links into the quiz screen with `?startWord=<clientUuid>` and runs a
**single-card mini quiz** for that word.

> **iOS + Expo Go (SDK 53+):** local notifications are no longer supported in
> Expo Go on iOS — testing on iPhone requires a **development build**:
> `eas build --profile development --platform ios` and reinstall on the device.
> Android continues to work in Expo Go.

The `expo-notifications` plugin is already wired in `app.json`. No EAS secrets
need to change.

---

## 5. EAS — build & install on your phone

This is the step that makes the app run on a phone **without your laptop**.

### 5.0 Marketing version (single source of truth)

The user-visible **semver** (`1.2.3` in the About screen, App Store listing, etc.)
comes only from **`package.json` → `"version"`**. Root `app.config.ts` merges
`app.json` and injects that value into Expo’s `expo.version` — you do **not**
maintain a duplicate `version` field inside `app.json`.

Before a store-facing build, bump semver explicitly (pick one):

```bash
npm run release:patch   # 1.0.0 → 1.0.1  (bugfixes)
npm run release:minor   # 1.0.0 → 1.1.0  (new features, backwards compatible)
npm run release:major   # 1.0.0 → 2.0.0  (breaking / big milestone)
```

Each script runs `npm version …`, which updates `package.json` + `package-lock.json`,
creates a **git commit** and a **git tag** `vX.Y.Z`. Your working tree must be clean.

**Native build numbers** (iOS `CFBundleVersion`, Android `versionCode`) are separate:
`eas.json` uses `"autoIncrement": true` on the `production` profile and
`"appVersionSource": "remote"` so EAS bumps them on the server for every
production build — no manual edits.

Workflow in practice: `npm run release:minor` → `git push --follow-tags` →
`eas build -p ios --profile production` (and/or Android).

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
  "cli": { "appVersionSource": "remote" },
  "build": {
    "preview":    { "distribution": "internal", "channel": "preview" },
    "production": { "channel": "production", "autoIncrement": true }
  },
  "submit": { "production": {} }
}
```

`autoIncrement` + remote `appVersionSource` let EAS bump iOS/Android **build
numbers** on the server; the marketing semver still comes from `package.json`
(see §5.0).

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
| *Hledat* shows "Vyhledávání slovíček vyžaduje přihlášení" | User isn't signed in (translate endpoint requires Bearer JWT) | Tap **Přejít na profil** and sign in with Google. |
| Translate returns 401 even when signed in | `SUPABASE_URL` / `SUPABASE_ANON_KEY` missing on Vercel, or token expired | Add the env vars and **Redeploy**; in the app sign out and back in. |
| Google sign-in returns *Unsupported provider* | Provider not enabled or wrong project | Re-check §2.3 (toggle ON, Web Client ID + Secret). |
| *Invalid redirect URL* after Google login | Redirect not in allow-list | Add `italiano://` for builds; in **Expo Go** add the matching `exp://…` URL or wildcard (§2.4). |
| Google login **spins forever** after confirming in the browser | Expo Go uses `exp://…`, not `italiano://` | Add `exp://…` / wildcard to Supabase Redirect URLs (§2.4), or test Google sign-in in a **development build**. |
| EAS build fails: *Invalid UUID appId* | `app.json` has a bogus `extra.eas.projectId` | Remove that block, run `eas init` (no `--id`). |
| Vocab not syncing across devices | User signed-in on only one device, or RLS blocks | Profile → Synchronizovat; check Supabase logs. |
| Lessons empty / *Bundle not yet seeded* (HTTP 503) | `content_bundles` is empty | Run `npm run db:migrate && npm run content:push` (§ 2.6). |
| `/api/content-manifest` returns `version: "fallback"` | DB unreachable or `SUPABASE_URL` / `SUPABASE_ANON_KEY` not set on Vercel | Add the env vars (§ 3.3) and redeploy; also re-run `content:push` if the table is empty. |

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
