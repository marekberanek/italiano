# Plán: přihlášení (Supabase Auth — Google + Apple), backendová historie a slovíčka, offline-first

Tento dokument je **návrh a architektonický plán** — v repozitáři zatím **není** implementace přihlášení ani ukládání uživatelských dat na serveru. Zvolený stack: **Supabase Auth + Supabase Postgres (EU region)**, zachovaný **Vercel** pro `translate` a `content-bundle` proxy.

Detaily nasazení (kde co spustit, env proměnné, kroky v Cloudu) jsou v samostatném souboru **[docs/DEPLOYMENT.md](./DEPLOYMENT.md)**.

---

## 1. Kde jsou dnes uživatelská data (status)

**Na backendu nejsou.** Uživatelská slovíčka a stav opakování žijí **výhradně v mobilní aplikaci**:

| Data | Kde |
|------|-----|
| Slovíčka, `learned`, `streak`, `nextId` | `lib/storage/vocab-store.ts` → klíč AsyncStorage `italiano.vocab.v1` |
| Načítání v UI | `hooks/use-vocab-store.ts` |

**Backend (`backend/`) dnes obsahuje jen:**

- `api/translate.ts` — proxy na DeepL.
- `api/content-manifest.ts` + `api/content-bundle.ts` — veřejný JSON lekcí pro všechny.

**Autentizace na backendu zatím není.** Po dokončení tohoto plánu ji bude vystavovat **Supabase**, Vercel funkce budou ověřovat **Supabase JWT** (JWKS) a pracovat s `auth.uid()` proti tabulkám v Supabase Postgres.

---

## 2. Cíl: offline-first + účet

1. **Bez přihlášení** aplikace funguje jako dnes (lokální slovíčka + lekce).
2. **Po přihlášení** se data **zálohují** a při dalším zařízení **stáhnou** (merge podle pravidel).
3. **Offline**: zápis vždy nejdřív lokálně; sync až při síti (outbox / fronta).
4. **Vlastní slovíčka uživatele** se nikdy neztratí kvůli odhlášení (lokální data zůstávají).

---

## 3. Přihlášení Google + Apple přes Supabase Auth

### Princip

```
Mobil (Expo) ──OAuth (native flow)──► Supabase Auth (Google / Apple)
       ◄──── access + refresh JWT ───
       ──── Authorization: Bearer JWT ──► Vercel API / přímo Supabase REST/RLS
```

- **Sessions a refresh tokeny** spravuje Supabase JS SDK (klíče/JWT v Expo `SecureStore`).
- **Backend** ověří JWT proti **Supabase JWKS** (URL `https://<projekt>.supabase.co/auth/v1/keys`).
- **Row Level Security (RLS)** v Postgresu omezí každý select/update jen na řádky s `user_id = auth.uid()`. To znamená, že většinu CRUD operací můžeme volat **přímo z aplikace** přes Supabase JS, bez vlastního API.

### Konkrétní knihovny v Expo

- `@supabase/supabase-js` — klient pro Auth + DB.
- `expo-auth-session` + `expo-web-browser` — Google native flow (nebo redirect).
- `expo-apple-authentication` — Apple Sign In na iOS.
- `expo-secure-store` — bezpečné uložení session.
- `react-native-url-polyfill/auto` — nutné pro Supabase v RN.

### Co musí být nastaveno v Cloudech

- **Google Cloud Console**: OAuth Client ID(s) (iOS, Android, Web).
- **Apple Developer**: Service ID + Key, povolit Sign In with Apple, nastavit doménu Supabase pro callback.
- **Supabase**: zapnout providery Google / Apple, vyplnit Client ID a Secret.

> Detaily kroků v Cloudech viz **DEPLOYMENT.md** (§ Cloud setup — Supabase, Google, Apple).

---

## 4. Datový model (Supabase Postgres + RLS)

### Tabulky

| Tabulka | Klíčové sloupce | Účel |
|---------|------------------|-------|
| `profiles` | `id uuid (= auth.users.id)`, `created_at`, `display_name?`, `locale?` | 1:1 s `auth.users`; bezpečně sdílené veřejné info uživatele |
| `vocab_items` | `id uuid PK`, `user_id uuid`, `client_uuid text`, `it`, `cz`, `p`, `learned bool`, `streak int`, `updated_at`, `deleted_at?` | Slovíčka — replikovatelná zařízeními |
| `study_events` | `id uuid PK`, `user_id uuid`, `kind text`, `payload jsonb`, `client_id text`, `created_at` | Append-only historie (kvíz, lekce otevřena, …) |
| `device_sync_state` | `user_id`, `device_id`, `last_pull_at`, `last_push_at` | Volitelné — kurzor pro pull |

**Indexy:**
- `vocab_items (user_id, updated_at desc)`
- `vocab_items (user_id, client_uuid) unique` — idempotentní upsert z appky.
- `study_events (user_id, created_at desc)`

### Row Level Security (zásady, ne SQL)

- Pro **každou** tabulku zapnout RLS.
- Politika `select / insert / update / delete` na `auth.uid() = user_id`.
- `profiles`: `select` všem přihlášeným (jen vlastní řádek), `insert` při prvním přihlášení (trigger na `auth.users`).

### Konflikty

- **Slovíčka:** klíč pro merge = `client_uuid`; merge `streak = max(local, remote)`, `learned = local OR remote`, `updated_at` rozhoduje pro textová pole.
- **Events:** append-only, `client_id` zajišťuje idempotenci (deduplikace).

---

## 5. Sync (offline-first)

```
┌──────────────────────┐        ┌─────────────────────┐
│ Mobil (AsyncStorage) │        │ Supabase Postgres   │
│ - vocab + outbox     │ ─push─►│ - vocab_items       │
│ - lastPulledAt       │ ◄pull──│ - study_events      │
└──────────────────────┘        └─────────────────────┘
```

1. **Zápis:** lokální mutace → uložit do `vocab-store` + zapsat do `outbox` (AsyncStorage).
2. **Push:** při online a přihlášení → `upsert` do `vocab_items` přes Supabase JS (po dávkách).
3. **Pull:** `select * where user_id = auth.uid() and updated_at > lastPulledAt`.
4. **Merge:** podle pravidel (§ 4); update lokálního store + emit změn do UI.
5. **Anonym → přihlášený:** dialog *„Sloučit lokální slovíčka s účtem?“* (default ANO).
6. **Odhlášení:** lokální data zůstávají; jen se vymaže session a outbox se pause-uje.

> Není potřeba vlastní `/sync/push` endpoint. Supabase JS volá **přímo** PostgREST chráněný RLS — **méně kódu na Vercelu**.  
> Vercel endpointy přidáváme jen tam, kde potřebujeme **server-side logiku** (např. `delete-account`, `export-data`).

---

## 6. Vrstvy v aplikaci (které soubory přidat)

| Vrstva | Cíl |
|--------|------|
| `lib/auth/supabase.ts` | Singleton Supabase klienta s `expo-secure-store` adaptérem. |
| `lib/auth/use-auth.ts` | Hook se session, `signInGoogle()`, `signInApple()`, `signOut()`. |
| `lib/sync/outbox.ts` | Fronta mutací (push retry, dedup). |
| `lib/sync/vocab-sync.ts` | `pushVocab`, `pullVocab`, merge politika. |
| `app/(tabs)/profile.tsx` (nebo modal) | Přihlášení / odhlášení / „Smazat účet“. |
| `app/_layout.tsx` | Po startu probudit auth + spustit pull (NetInfo gating). |

---

## 7. Lazy load a split `grammar.json`

**Dnes:** jeden bundle `grammar` (~88 KB JSON) — u Metro je to zanedbatelné; problém roste až při **řádově větším** obsahu nebo **pomalém síťovém** prvním stažení.

**Doporučení (priorita):**

1. **Split podle kapitol** (nejjednodušší produktově):  
   - `grammar-essere-avere.json`, `grammar-regular-are.json`, …  
   - Manifest rozšíříš o více `bundle` id; obrazovka Gramatika načte jen aktivní kapitolu + prefetch sousední.
2. **Lazy route v Expo:** `grammar.tsx` dynamicky `import()` jen UI moduly — **nezmenší** samotný JSON v bundlu, pokud zůstane v `assets/data/`. K reálnému úsporu u bundlu musí být data **mimo** default bundle (oddělené soubory + načtení přes `fetch` / sync cache).
3. **SQLite v appce** (`expo-sqlite`): velké slovníky / historie lokálně; JSON jen pro seed — až při větším rozsahu uživatelských dat.

**Praktický krok:** dokud je `grammar.json` pod ~500 KB–1 MB, split je **volitelný**; jakmile přidáš generování stovek dalších sloves, **zaveď kapitoly jako samostatné bundly** v manifestu (stejný mechanismus jako `content-bundle`).

---

## 8. Fáze implementace

| Fáze | Obsah |
|------|--------|
| **0** | Vytvořit Supabase projekt (EU); Google OAuth Client ID; Apple Sign In Service. Viz **DEPLOYMENT.md**. |
| **1** | App: `lib/auth/supabase.ts`, hook `useAuth`, obrazovka **Profil** (Sign in with Google / Apple, Sign out). |
| **2** | Migrace v Supabase: `profiles`, `vocab_items`, `study_events` + RLS politiky + trigger pro `profiles`. |
| **3** | App: outbox + `vocab-sync` (push/pull) + merge dialogu při prvním přihlášení. |
| **4** | UI: indikátor stavu syncu, „Smazat účet“ (Vercel endpoint volá Supabase Admin SDK). |
| **5** | Export dat / smazání účtu (GDPR). |

---

## 9. Bezpečnost a soukromí

- Refresh tokeny v **`expo-secure-store`** (Keychain / Keystore), ne v plain AsyncStorage.
- Supabase **Service Role key** **nikdy** v aplikaci — jen na serveru (Vercel env), použít pouze ve `delete-account` / admin endpointech.
- Anon key v aplikaci je v pořádku (chrání RLS).
- GDPR: připravit endpoint `DELETE /api/account` (volá `auth.admin.deleteUser` se Service Role), návratový stav promítne do UI.

---

## 10. Shrnutí

- **Auth + DB:** Supabase (EU); přihlášení **Google + Apple**; RLS dělá většinu autorizace, takže `/sync` endpointy nejsou nutné.
- **Vercel** zůstává pro `translate`, `content-bundle` a budoucí admin endpointy (`delete-account`, `export-data`).
- **Offline-first:** zápis vždy lokálně + outbox; pull při startu / návratu do popředí.
- **Lazy load grammar:** zatím odložit; až při růstu rozsekat na více `content-bundle` id.

Detaily nasazení a env proměnných: **[docs/DEPLOYMENT.md](./DEPLOYMENT.md)**.
