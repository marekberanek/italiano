# Deployment — Italiano

Konkrétní plán „co kam nasadit“ pro projekt **Italiano**. Cíl: **free tier**, EU region, přihlášení **Google + Apple** přes **Supabase Auth**, vlastní API na **Vercelu**, mobilní binárky přes **Expo / EAS**.

Architektura projektu: **[ARCHITECTURE.md](../ARCHITECTURE.md)**.  
Plán autentizace + syncu: **[PLAN-auth-sync-offline.md](./PLAN-auth-sync-offline.md)**.

---

## 1. Mapa služeb

| Vrstva | Provider | Region | Free tier (orientačně) |
|--------|----------|--------|--------------------------|
| Mobilní aplikace (binárky) | **Expo / EAS** (build), **App Store** + **Google Play** (distribuce) | — | EAS: omezený počet buildů/měsíc. Store: iOS Apple Developer Program $99/rok, Android jednorázově $25. |
| Auth + DB + Storage | **Supabase** | EU (Frankfurt nebo Ireland) | 1 projekt zdarma; cca 50 000 MAU, 500 MB DB; pauza po 7 dnech neaktivity. |
| API proxy (DeepL, content) | **Vercel** | EU prefer | Hobby plán zdarma; bandwidth a počet invocations limitované. |
| OAuth Google | **Google Cloud Console** | — | Zdarma. |
| OAuth Apple Sign In | **Apple Developer** | — | Vyžaduje Apple Developer Program ($99/rok) pro reálné iOS buildy/podpis. |
| Doména (volitelné) | **Cloudflare / Namecheap / …** | — | Doména ~$10–15/rok; pro dev stačí `*.vercel.app`. |
| (Volitelné) Překlad bez DeepL | místní fallback v appce | — | $0. |
| Kód / repo | **GitHub** | — | Zdarma. |

---

## 2. Logická topologie

```
┌─────────────┐  OAuth (Google/Apple, redirect přes Supabase)
│   Mobile    │ ─────────────────────────────────► Supabase Auth
│  (Expo/EAS) │ ◄── access + refresh JWT ────────
│             │
│             │   PostgREST (RLS)
│             │ ─────────────────────────────────► Supabase Postgres
│             │
│             │   Bearer JWT
│             │ ─────────────────► Vercel Functions
│             │                    ├─ /api/translate (DeepL)
│             │                    ├─ /api/content-manifest
│             │                    ├─ /api/content-bundle
│             │                    └─ /api/account/* (admin)
└─────────────┘
```

---

## 3. Zdrojový repozitář a větve

- **GitHub repo** = jediný zdroj pravdy.  
- Doporučené větve:
  - `main` → produkční nasazení (Vercel + EAS prod profil).
  - `dev` → preview (Vercel preview URL, EAS preview channel).
- **Tagy** `vX.Y.Z` pro store releases.

---

## 4. Supabase — projekt a Auth

### 4.1 Vytvoření

1. Vytvořit účet na [supabase.com](https://supabase.com) (přihlas se přes GitHub).
2. **New project** → název `italiano-prod`, region `eu-central-1` (Frankfurt) nebo `eu-west-1` (Ireland).
3. Uložit **Project URL** a **anon key** + **service_role key** (do trezoru, nedávat do gitu).

### 4.2 Schéma DB (později migrací — viz § 9)

Tabulky `profiles`, `vocab_items`, `study_events` + RLS politiky. Detail v plánu.

### 4.3 Auth providery

V Supabase Dashboard → **Authentication → Providers**:

#### Google

1. **Google Cloud Console** → projekt `italiano`.
2. **APIs & Services → OAuth consent screen** → External, vyplnit produkt + e-mail.
3. **Credentials → Create OAuth Client ID**:
   - **Web application** (pro Supabase callback)
     - Authorized redirect URI: `https://<project>.supabase.co/auth/v1/callback`
   - **iOS** Client ID (bundle id z Expo).
   - **Android** Client ID (package name + SHA-1 podpisu z EAS — `eas credentials`).
4. V Supabase **Google provider** → vložit Web Client ID + Secret.
5. Volitelně doplnit „Skip nonce check“ pokud má Expo OAuth potíže (viz Supabase docs — Expo Google).

#### Apple Sign In

1. **Apple Developer**:
   - **Identifiers → Services IDs** → vytvořit Service ID `com.italiano.web`.
   - V detailu Service ID povolit *Sign In with Apple*, **Configure**:
     - Domain: `<project>.supabase.co`
     - Return URL: `https://<project>.supabase.co/auth/v1/callback`
   - **Keys** → New Key, povolit *Sign In with Apple*, stáhnout `.p8` privátní klíč (jen jednou!).
2. V Supabase **Apple provider**:
   - Service ID = `com.italiano.web`
   - Team ID = z Apple Dev (Membership)
   - Key ID = z vytvořeného `.p8`
   - Private key = obsah `.p8`
3. Pro nativní iOS flow stačí v appce **`expo-apple-authentication`** + předat `id_token` Supabase klientovi (`signInWithIdToken({ provider: "apple", token })`).

### 4.4 Site URL & redirecty

- **Authentication → URL Configuration**:
  - Site URL: `italiano://auth-callback` (deep link tvojí appky).
  - Additional redirect URLs: `italiano://auth-callback`, `https://italiano.example/auth-callback` (pokud bys měl web).

---

## 5. Mobilní aplikace (Expo / EAS)

### 5.1 Lokální vývoj

```bash
npm install
npx expo start          # Metro
i / a                   # iOS / Android
```

### 5.2 Konfigurace

`app.json` → `expo.extra` (commitnuté výchozí hodnoty) + `.env` (lokálně, **negitovat**):

```env
EXPO_PUBLIC_TRANSLATE_ENDPOINT=https://italiano-api.vercel.app/api/translate
EXPO_PUBLIC_CONTENT_BASE_URL=https://italiano-api.vercel.app
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### 5.3 EAS (build služba)

```bash
npm install -g eas-cli
eas login
eas init --id italiano                # vytvoří projekt na Expo
eas build:configure                   # vytvoří eas.json
```

`eas.json` (návrh, doplníš později):

```json
{
  "build": {
    "preview": { "distribution": "internal", "channel": "preview" },
    "production": { "channel": "production" }
  },
  "submit": {
    "production": {}
  }
}
```

Build:

```bash
eas build -p ios --profile preview        # internal TestFlight build
eas build -p android --profile preview    # AAB pro internal track
eas build -p ios --profile production
eas build -p android --profile production
```

Submit do storů (volitelné):

```bash
eas submit -p ios --latest
eas submit -p android --latest
```

### 5.4 Konstanty v EAS

Citlivé (none — `EXPO_PUBLIC_*` jdou do binárky) i veřejné `EXPO_PUBLIC_*` lze:

- nastavit přímo v `app.json` `expo.extra`,
- nebo přes `eas secret` (`eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://...`) a v `eas.json` `env`.

> **Pozor:** `EXPO_PUBLIC_*` se ZAPÉČOU do binárky. Service-role keys ani DeepL klíč tam **nedávat**.

---

## 6. Backend na Vercelu

### 6.1 Projekt

V `backend/` je už `vercel.json` a `package.json`. První deploy:

```bash
cd backend
vercel login
vercel link              # připojí složku k Vercel projektu
vercel --prod            # první produkční deploy
```

### 6.2 Environment variables

V Vercel Dashboard → **Project → Settings → Environment Variables** (nastavit pro `Production` i `Preview`):

| Klíč | Hodnota | Kde se používá |
|------|---------|----------------|
| `DEEPL_API_KEY` | DeepL API klíč | `api/translate.ts` |
| `CONTENT_VERSION` | `2` (nebo vyšší při změně obsahu) | `api/content-manifest.ts` |
| `SUPABASE_URL` | `https://<project>.supabase.co` | `api/account/*` (admin) |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key (jen na serveru!) | `api/account/*` |
| `SUPABASE_JWT_AUDIENCE` | `authenticated` | volitelné při ověřování JWT |

### 6.3 Region

V `vercel.json` lze přidat `"regions": ["fra1"]` (Frankfurt) pro nižší latenci v EU.

### 6.4 Stávající endpointy

| Endpoint | Co dělá |
|----------|---------|
| `POST /api/translate` | DeepL proxy (žádný uživatel) |
| `GET /api/content-manifest` | Manifest bundlů (verze) |
| `GET /api/content-bundle?bundle=…` | Vrátí konkrétní JSON |

### 6.5 Plánované endpointy (s Auth)

| Endpoint | Účel | Klíče |
|----------|------|-------|
| `POST /api/account/delete` | Smazat účet (auth.admin.deleteUser + cascade DELETE v tabulkách) | `SUPABASE_SERVICE_ROLE_KEY` |
| `GET /api/account/export` | Export uživatelských dat (JSON download) | service role + ověření Bearer JWT volajícího |

---

## 7. Doménové jméno (volitelné)

- Začni s **`*.vercel.app`** a **deep linkem** `italiano://` (nepotřebuješ doménu).
- Pro produkci doporučeno vlastní:
  - `italiano-api.example.com` → Vercel project domain.
  - `italiano-app.example.com` → Universal Link / App Link (až později).
- DNS: A/AAAA nebo CNAME na Vercel; certifikát Vercel řídí automaticky.

---

## 8. Stručný release flow

1. PR → review → merge do `main`.
2. **Backend:** GitHub → Vercel auto-deploy `main` → produkce; preview pro PR (Vercel Preview).
3. **Frontend:** vyrobit `eas build --profile production` (může běžet manuálně nebo přes GitHub Action).
4. **Supabase:** migrace přes `supabase db push` z lokálu (viz § 9). Žádné automatické tagování verzí přes Vercel.
5. **Bump `CONTENT_VERSION`** v Vercel envs, když měníš obsah JSON lekcí (`backend/content/*.json`).

---

## 9. Migrace databáze (Supabase CLI)

```bash
brew install supabase/tap/supabase
supabase login
cd <repo-root>
supabase init                       # vytvoří supabase/ folder
supabase link --project-ref <ref>   # ID z dashboardu
supabase db diff -f init_schema     # vytvoří první migraci
supabase db push                    # aplikuje na cloudový projekt
```

Migrace jdou do gitu (`supabase/migrations/*.sql`). RLS politiky a trigger pro automatické vytvoření `profiles` při `auth.users` insertu se píšou tady.

---

## 10. Sekrety — kam patří

| Klíč | Mobile (`.env`/`extra`) | Vercel env | Supabase | Git |
|------|--------------------------|------------|----------|-----|
| `EXPO_PUBLIC_TRANSLATE_ENDPOINT` | ano | — | — | ano (jen URL) |
| `EXPO_PUBLIC_CONTENT_BASE_URL` | ano | — | — | ano |
| `EXPO_PUBLIC_SUPABASE_URL` | ano | — | — | ano |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ano | — | — | ano (anon key není tajný) |
| `DEEPL_API_KEY` | NE | ano | — | NE |
| `SUPABASE_SERVICE_ROLE_KEY` | NE NIKDY | ano (jen serverless) | — | NE |
| Apple `.p8` privátní klíč | NE | NE (jen Supabase) | ano | NE |
| Google OAuth Client Secret | NE | NE (jen Supabase) | ano | NE |

> **Service role key** = plný přístup k DB **bez RLS**. Patří **jen** na server (Vercel env).

---

## 11. Monitoring a kvóty

- **Supabase**: Dashboard → Project → Reports (DB, Auth, Storage). E-mail alert před 80 % limitu free tier.
- **Vercel**: Dashboard → Project → Analytics + Logs (otevřené i na free).
- **Expo**: web dashboard pro EAS buildy a OTA updates.
- **DeepL**: dashboard ukáže zbylé znaky free planu.

---

## 12. Costs check (přibližné, pro orientaci)

| Položka | Free | Placené až když |
|---------|------|-----------------|
| Supabase | $0 | > 50k MAU nebo > 500 MB DB |
| Vercel | $0 | velký traffic, > 100 GB bandwidth/měs |
| Expo / EAS | $0 (limity) | více souběžných buildů, prioritní fronta |
| Apple Developer | $99/rok | povinné pro App Store |
| Google Play | $25 jednorázově | povinné pro Play Store |
| DeepL Free | $0 | > 500 000 znaků/měs |

---

## 13. Checklist „MVP do produkce“

- [ ] Supabase projekt v EU + zapnuté Google a Apple providery (Section § 4).
- [ ] Vercel projekt s `DEEPL_API_KEY`, `CONTENT_VERSION`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] `app.json` doplněn o `EXPO_PUBLIC_SUPABASE_*`; `.env.example` aktualizovaný.
- [ ] Migrace `supabase/migrations/0001_init.sql` aplikovaná, RLS zapnuté.
- [ ] EAS účet, `eas init`, build profily `preview` a `production`.
- [ ] Apple Developer účet (pokud iOS), Google Play konzole (pokud Android).
- [ ] TestFlight + interní Android track funkční.
- [ ] Plán smazání účtu (`/api/account/delete`) implementován.
- [ ] README a ARCHITECTURE odkazují na tento dokument.

---

## 14. Co nemusíš (zatím) řešit

- Vlastní Postgres mimo Supabase (Neon / RDS) — Supabase free stačí.
- Vlastní container / Docker — vše běží serverless.
- CDN pro JSON — Vercel už dělá `Cache-Control` (nastavený v `content-bundle`).
- Real-time (WebSocket) sync — periodický pull stačí; Supabase Realtime se dá zapnout později.

---

*Tento dokument udržuj aktuální při každé změně cloudového stacku. Pro implementační kroky (migrace, RLS, hooky) viz [PLAN-auth-sync-offline.md](./PLAN-auth-sync-offline.md).*
