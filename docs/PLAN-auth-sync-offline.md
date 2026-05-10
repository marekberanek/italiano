# Plan: sign-in (Supabase Auth — Google + Apple), backend-side history and vocabulary, offline-first

This document is the **design and architectural plan** for the auth + sync feature. The repository now ships an implementation that follows it: **Supabase Auth + Supabase Postgres (EU region)**, with **Vercel** kept for the `translate` and `content-bundle` proxies.

Deployment details (where to run what, env variables, cloud setup) live in **[docs/DEPLOYMENT.md](./DEPLOYMENT.md)**.

---

## 1. Where user data lives today (status)

**Locally on the device** — and, once signed in, also in Supabase. The local store stays the source of truth for offline use:

| Data | Where |
|------|-------|
| Vocabulary, `learned`, `streak`, `nextId`, `clientUuid`, `updatedAt` | `lib/storage/vocab-store.ts` → AsyncStorage key `italiano.vocab.v1` |
| UI loading | `hooks/use-vocab-store.ts` |
| Cloud copy | Supabase tables `vocab_items` (synced via `lib/sync/vocab-sync.ts`) |

**Backend (`backend/`) currently exposes:**

- `api/translate.ts` — DeepL proxy.
- `api/content-manifest.ts` + `api/content-bundle.ts` — public lesson JSON for everyone.
- `api/account/delete.ts`, `api/account/export.ts` — account-management endpoints (verify Supabase JWT, use the service role only on the server).

**Authentication** is provided by **Supabase**; Vercel functions verify the **Supabase JWT** (via the user-scoped Supabase client) and operate against `auth.uid()` in the Supabase Postgres tables.

---

## 2. Goal: offline-first + accounts

1. **Without signing in** the app behaves as before (local vocabulary + lessons).
2. **After signing in** the data is **backed up** and on another device gets **pulled** (merge by rules below).
3. **Offline:** writes always go to the device first; sync happens once we have network (deletion queue / outbox).
4. **The user's own vocabulary** is never lost because of a sign-out (local data stays).

---

## 3. Sign-in with Google + Apple via Supabase Auth

### Principle

```
Mobile (Expo) ──OAuth (native flow)──► Supabase Auth (Google / Apple)
       ◄──── access + refresh JWT ───
       ──── Authorization: Bearer JWT ──► Vercel API / Supabase REST/RLS directly
```

- **Sessions and refresh tokens** are managed by the Supabase JS SDK (keys/JWT in Expo `SecureStore`).
- **The backend** verifies the JWT against **Supabase** (`auth.getUser(jwt)` on a user-scoped client) and only then uses the service role for admin operations.
- **Row Level Security (RLS)** in Postgres restricts every select/update to rows where `user_id = auth.uid()`. That means most CRUD operations can be called **directly from the app** through Supabase JS, with no custom API.

### Concrete libraries in Expo

- `@supabase/supabase-js` — Auth + DB client.
- `expo-auth-session` + `expo-web-browser` — Google native flow (or redirect).
- `expo-apple-authentication` — Apple Sign In on iOS.
- `expo-secure-store` — secure session storage.
- `react-native-url-polyfill/auto` — required by Supabase in RN.

### What must be set up in the clouds

- **Google Cloud Console:** OAuth Client IDs (iOS, Android, Web).
- **Apple Developer:** Service ID + Key, enable Sign In with Apple, set the Supabase callback domain.
- **Supabase:** enable the Google / Apple providers, fill in Client ID and Secret.

> Cloud step-by-step: see **DEPLOYMENT.md** (§ Cloud setup — Supabase, Google, Apple).

---

## 4. Data model (Supabase Postgres + RLS)

### Tables

| Table | Key columns | Purpose |
|-------|-------------|---------|
| `profiles` | `id uuid (= auth.users.id)`, `created_at`, `display_name?`, `locale?` | 1:1 with `auth.users`; safely shared user profile info |
| `vocab_items` | `id uuid PK`, `user_id uuid`, `client_uuid text`, `it`, `cz`, `p`, `learned bool`, `streak int`, `updated_at`, `deleted_at?` | Vocabulary items — replicated across devices |
| `study_events` | `id uuid PK`, `user_id uuid`, `kind text`, `payload jsonb`, `client_id text`, `created_at` | Append-only history (quiz answers, lesson opened, …) |
| `device_sync_state` | `user_id`, `device_id`, `last_pull_at`, `last_push_at` | Optional — pull cursor |

**Indexes:**
- `vocab_items (user_id, updated_at desc)`
- `vocab_items (user_id, client_uuid)` unique — idempotent upsert from the app.
- `study_events (user_id, created_at desc)`

### Row Level Security (policies, not raw SQL)

- Enable RLS on **every** table.
- `select / insert / update / delete` policies on `auth.uid() = user_id`.
- `profiles`: `select` for any signed-in user (own row only), `insert` on first sign-in (trigger on `auth.users`).

### Conflict resolution

- **Vocabulary:** merge key = `client_uuid`; `streak = max(local, remote)`, `learned = local OR remote`, `updated_at` decides for text fields.
- **Events:** append-only; `client_id` keeps things idempotent (deduplication).

---

## 5. Sync (offline-first)

```
┌──────────────────────┐        ┌─────────────────────┐
│ Mobile (AsyncStorage)│        │ Supabase Postgres   │
│ - vocab + delete-q   │ ─push─►│ - vocab_items       │
│ - lastPulledAt       │ ◄pull──│ - study_events      │
└──────────────────────┘        └─────────────────────┘
```

1. **Write:** local mutation → save into `vocab-store` + (for deletions) push the `client_uuid` into the deletion queue (AsyncStorage).
2. **Push:** when online and signed in → `upsert` into `vocab_items` via Supabase JS (in batches), drain the deletion queue with `delete()`.
3. **Pull:** `select * where user_id = auth.uid()` (server-side `updated_at desc`).
4. **Merge:** following the rules in § 4; update local store and emit changes to the UI.
5. **Anonymous → signed-in:** dialog *"Merge local vocabulary with the account?"* (default YES).
6. **Sign-out:** local data stays; only the session is cleared and the outbox is paused.

> No custom `/sync/push` endpoint is needed. Supabase JS calls **directly** the PostgREST that is protected by RLS — **less code on Vercel.**
> Vercel endpoints are added only when we need **server-side logic** (e.g. `delete-account`, `export-data`).

---

## 6. Application layers (which files were added)

| Layer | Goal |
|-------|------|
| `lib/auth/supabase.ts` | Supabase client singleton with the `expo-secure-store` adapter. |
| `lib/auth/auth-context.tsx` / `lib/auth/use-auth.ts` | Hook with the session, `signInWithGoogle()`, `signInWithApple()`, `signOut()`. |
| `lib/storage/vocab-deletions.ts` | Queue of deleted `client_uuid`s (deletion outbox). |
| `lib/sync/vocab-sync.ts` | `pushVocabToRemote`, `pullVocabRows`, merge policy, `fullVocabSync`. |
| `app/(tabs)/profile.tsx` | Sign in / sign out / "Delete account" / "Export data". |
| `app/_layout.tsx` | Wraps the app in `AuthProvider`; the provider runs the post-sign-in sync. |

---

## 7. Lazy loading and splitting `grammar.json`

**Today:** a single `grammar` bundle (~88 KB JSON) — Metro can swallow that easily; the problem only grows with **orders of magnitude more** content or a **slow first-time download**.

**Recommendations (priority):**

1. **Split by chapter** (simplest from a product perspective):
   - `grammar-essere-avere.json`, `grammar-regular-are.json`, …
   - Extend the manifest with more `bundle` ids; the Grammar screen loads only the active chapter and prefetches the neighbours.
2. **Lazy route in Expo:** `grammar.tsx` `import()`s only UI modules dynamically — this **does not shrink** the JSON inside the bundle if the data stays in `assets/data/`. To save bundle size the data has to live **outside** the default bundle (separate files + load via `fetch` / sync cache).
3. **SQLite in the app** (`expo-sqlite`): for large dictionaries / history locally; JSON only as a seed — once user data grows.

**Pragmatic step:** while `grammar.json` stays under ~500 KB–1 MB the split is **optional**; once you generate hundreds more verbs, **introduce chapters as separate bundles** in the manifest (same mechanism as `content-bundle`).

---

## 8. Implementation phases

| Phase | Content |
|-------|---------|
| **0** | Create the Supabase project (EU); Google OAuth Client ID; Apple Sign In Service. See **DEPLOYMENT.md**. |
| **1** | App: `lib/auth/supabase.ts`, `useAuth` hook, **Profile** screen (Sign in with Google / Apple, Sign out). |
| **2** | Supabase migrations: `profiles`, `vocab_items`, `study_events` + RLS policies + trigger for `profiles`. |
| **3** | App: deletion outbox + `vocab-sync` (push/pull) + merge dialog on first sign-in. |
| **4** | UI: sync status indicator, "Delete account" (Vercel endpoint that calls the Supabase Admin SDK). |
| **5** | Data export / account deletion (GDPR). |

---

## 9. Security and privacy

- Refresh tokens in **`expo-secure-store`** (Keychain / Keystore), not in plain AsyncStorage.
- The Supabase **Service Role key** is **never** in the app — only on the server (Vercel env), used solely in `delete-account` / admin endpoints.
- The anon key in the app is fine (RLS protects the data).
- GDPR: ship `DELETE /api/account/delete` (calls `auth.admin.deleteUser` with the service role) and `GET /api/account/export`; reflect the response in the UI.

---

## 10. Summary

- **Auth + DB:** Supabase (EU); sign-in with **Google + Apple**; RLS handles most authorization, so `/sync` endpoints are not necessary.
- **Vercel** stays for `translate`, `content-bundle` and the admin endpoints (`delete-account`, `export-data`).
- **Offline-first:** writes always go local + outbox; pull on startup / when returning to foreground.
- **Lazy load grammar:** postponed for now; once content grows, split into multiple `content-bundle` ids.

Deployment and env variable details: **[docs/DEPLOYMENT.md](./DEPLOYMENT.md)**.
