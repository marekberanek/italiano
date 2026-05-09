# Italiano

Mobilní aplikace (Expo / React Native) pro učení italštiny: slovíčka s opakováním, vyhledávání s překladem, lekce (gramatika, situace, čísla, abeceda, dny, měsíce) a výslovnost přes systémový TTS.

Podrobný popis architektury: **[ARCHITECTURE.md](./ARCHITECTURE.md)**.  
Plán (bez implementace): účet Google/Apple, sync slovíček a historie, offline-first, free tier a lazy load gramatiky — **[docs/PLAN-auth-sync-offline.md](./docs/PLAN-auth-sync-offline.md)**.  
Detailní deployment (Supabase, Vercel, EAS, Google/Apple OAuth) — **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)**.

---

## Požadavky

- **Node.js** 20+ (doporučeno LTS)
- **npm** (součást Node instalace)
- Pro iOS: **Xcode** + simulátor (macOS)
- Pro Android: **Android Studio** + emulátor, nebo fyzické zařízení s USB laděním
- (Volitelné) Účet **DeepL API** pro reálný překlad v záložce *Hledat*

---

## 1. Klonování a instalace (mobilní aplikace)

```bash
cd italiano
npm install
```

---

## 2. Spuštění aplikace

```bash
npm start
# nebo
npx expo start
```

V terminálu pak:

- **`i`** — otevře iOS simulátor (macOS + Xcode)
- **`a`** — Android emulátor
- Naskenuj **QR kód** v **Expo Go** na telefonu (telefon musí být ve stejné Wi‑Fi jako počítač, pokud ne používáš tunel v Expo)

Přímo:

```bash
npm run ios
npm run android
npm run web
```

### Lokální proměnné (bez DeepL)

Bez nastavení překladu aplikace poběží; záložka *Hledat* použije **zjednodušený fallback** (žádný skutečný překlad).

### Lokální proměnné (s DeepL přes proxy)

1. Zkopíruj soubor s šablonou:

   ```bash
   cp .env.example .env
   ```

2. Do `.env` doplň URL svého backendu (viz krok 4), například:

   ```env
   EXPO_PUBLIC_TRANSLATE_ENDPOINT=http://192.168.1.10:3000/api/translate
   ```

3. **Restartuj** Metro bundler (`Ctrl+C` a znovu `npm start`), aby se načetly `EXPO_PUBLIC_*` proměnné.

**Důležité:** Na fyzickém telefonu musí být adresa **IP tvého počítače v LAN**, ne `localhost` (telefon localhost neznamená tvůj PC).

Alternativa pro produkci / sdílení týmu: nasaď proxy na **HTTPS** (např. Vercel) a do `.env` dej veřejnou URL.

Volitelně můžeš endpoint zapsat i do `app.json` → `expo.extra.translateEndpoint` (vhodné pro EAS Build bez `.env` v repu).

### Synchronizace obsahu lekcí (volitelné)

Redakční JSON (gramatika, situace, číslovky, …) lze servovat z téhož backendu jako překlad. Aplikace při startu zkusí stáhnout manifest a bundly; **bez URL nebo offline** zůstane u **vestavěných** souborů v `assets/data/` a případné dřívější **cache** v AsyncStorage. **Vlastní slovíčka uživatele** (`lib/storage/vocab-store.ts`) se synchronizací vůbec nemění.

Do `.env` (stejná pravidla jako u překladu — LAN IP na telefonu):

```env
EXPO_PUBLIC_CONTENT_BASE_URL=http://192.168.1.10:3000
```

Nebo `app.json` → `expo.extra.contentBaseUrl`. Po změně znovu spusť Metro.

---

## 3. DeepL — získání API klíče

1. Jdi na [DeepL API](https://www.deepl.com/pro-api) a vytvoř si účet / přihlas se.
2. Vytvoř **API klíč** v přehledu účtu.
3. Klíč z **Free** plánu končí na **`:fx`** — backend podle toho volí host `api-free.deepl.com` vs `api.deepl.com`.
4. Ujisti se, že máš povolené jazyky **čeština** a **italština** (standardně ano).

Klíč **nikdy nedávej** přímo do mobilní aplikace — pouze do serverové proxy (níže).

---

## 4. Backend (proxy) — lokální vývoj

Proxy drží `DEEPL_API_KEY` na serveru; aplikace posílá jen text dotazu.

```bash
cd backend
npm install
```

Vytvoř soubor **`backend/.env.local`** (nebo exportuj proměnnou v shellu):

```bash
echo "DEEPL_API_KEY=xxxxxxxx:fx" > .env.local
```

Spusť lokální Vercel dev server (musíš mít nainstalovaný Vercel CLI: `npm i -g vercel`):

```bash
npx vercel dev
```

Výchozí port bývá **3000**. Endpoint pro aplikaci je:

```text
http://<IP-POČÍTAČE>:3000/api/translate
```

Ověření z terminálu:

```bash
curl -s -X POST http://127.0.0.1:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"query":"dobrý den"}' | jq .
```

Očekáváš JSON s poli `it` a `cz` (a volitelně `p`).

### Chyby a řešení

| Problém | Možná příčina |
|--------|----------------|
| `DEEPL_API_KEY is not configured` | Chybí `backend/.env.local` nebo proměnná v prostředí, kde běží `vercel dev`. |
| `DeepL 403` / `456` | Neplatný klíč, vyčerpaný limit, nebo jazyk není v plánu povolený. |
| Aplikace „Network error“ | Špatná URL v `.env`, firewall, telefon není ve stejné síti, nebo používáš `localhost` z telefonu. |
| Překlad špatným směrem | Heuristika jazyka v proxy; zkus explicitně český/italský vstup s diakritikou. |

---

## 5. Nasazení proxy (produkce)

1. Projekt `backend` připoj k **Vercel** (import repozitáře nebo `vercel` z adresáře `backend`).
2. V **Project Settings → Environment Variables** nastav `DEEPL_API_KEY`.
3. Po deployi zkopíruj URL ve tvaru `https://tvuj-projekt.vercel.app/api/translate` do `EXPO_PUBLIC_TRANSLATE_ENDPOINT` v `.env` nebo do CI pro EAS.

Implementace endpointu: `backend/api/translate.ts` (Edge runtime, `POST`, tělo `{ "query": "..." }`).

---

## 6. Další užitečné příkazy

```bash
npm run lint          # ESLint (Expo config)
npx tsc --noEmit      # TypeScript bez emitu
npm run generate:grammar   # přegeneruje assets/data/grammar.json ze skriptu
```

---

## 7. Struktura repozitáře (stručně)

| Cesta | Účel |
|-------|------|
| `app/` | Expo Router — obrazovky a navigace |
| `assets/data/` | Statická JSON data (gramatika, situace, čísla, …) |
| `components/` | Sdílené UI komponenty |
| `constants/theme.ts` | Design tokeny |
| `hooks/` | `useVocabStore`, `useItalianTts`, … |
| `lib/` | API klient (`translate`), úložiště slovíček |
| `backend/` | Serverless proxy na DeepL |

---

## Licence

Soukromý projekt — doplň podle potřeby.
