# Italiano Translate Proxy

Serverless function (Vercel/Cloudflare Workers/Netlify) that proxies translation requests from the mobile app to DeepL. Keeps the API key on the server side — the mobile binary never carries it.

## Endpoint

`POST /api/translate`

Request body:

```json
{ "query": "buongiorno" }
```

Response body:

```json
{ "it": "buongiorno", "cz": "dobrý den", "p": "[buondžorno]" }
```

`p` (Czech-friendly phonetic transcription) is optional. DeepL itself does not provide it; it can be added later via an LLM step or a phonetic dictionary.

## Direction detection

DeepL detects the source language automatically. Czech input → Italian output, Italian input → Czech output. The handler picks the target language based on the detected source.

## Local setup (Vercel)

```bash
cd backend
npm install
echo "DEEPL_API_KEY=your-key" > .env
npx vercel dev
```

Use **`backend/.env`** for local `vercel dev` (not committed to git). Older Vercel CLI builds may ignore `.env.local` for dev; `.env` is loaded reliably.

In Expo, set `EXPO_PUBLIC_TRANSLATE_ENDPOINT=http://<lan-ip>:3000/api/translate` (or your deployed URL) in the project root `.env`.

## Content API (lesson JSON)

- `GET /api/content-manifest` — JSON `{ version, bundles }`. Set `CONTENT_VERSION` on deploy to invalidate caches (default in code is `2` when env is unset).
- `GET /api/content-bundle?bundle=<id>` — raw JSON for one bundle. Bundle ids include `time`, `seasons`, `weather`, `food-drinks`, `false-friends`, etc. (full list: `lib/content/bundle-ids.ts` in the app repo).

The handler reads files from `backend/content/`. Keep `assets/data/` in the app repo in sync for offline-first installs.
