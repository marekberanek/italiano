# Expo Go on iPhone — tunnel mode (test outside your home Wi‑Fi)

This guide walks you through running the **Italiano** app inside **Expo Go** on a
physical **iPhone**, using **Metro over a public tunnel** so the phone works on
**cellular data** or any Wi‑Fi — no Apple Developer Program ($99) required.

> Full cloud deploy (Vercel, Supabase, EAS): **[DEPLOYMENT.md](./DEPLOYMENT.md)**  
> Day‑to‑day local backend: **[../README.md](../README.md)**

---

## What you get vs. what you trade off

| You get | Trade‑off |
|---------|-----------|
| Real device, real gestures, real iOS | App runs **inside Expo Go**, not as a standalone icon (unless you later build a dev client). |
| Works on LTE / guest Wi‑Fi | Your **Mac must stay awake** with Metro + tunnel running. Close the terminal → phone disconnects. |
| No $99 Apple Developer fee for this flow | Some **native-only** libraries *not* in the Expo SDK may not work in Expo Go (this project sticks to supported modules). |

---

## Prerequisites

On the **Mac** (same machine that will run Metro):

1. **Node.js** 20+ or 22 LTS (matches project `engines` if present).
2. Repo cloned and dependencies installed:

   ```bash
   cd /path/to/italiano
   npm install
   ```

3. **Expo CLI** (comes with `npx expo`, no global install required).
4. **Tunnel helper** (install once — avoids the interactive prompt *“install @expo/ngrok?”* when Cursor/CI runs non‑interactively):

   ```bash
   npm i -g @expo/ngrok@^4.1.0
   ```

On the **iPhone**:

1. Install **Expo Go** from the App Store (free).
2. Sign in to **iCloud / App Store** as usual (only for downloading Expo Go).

---

## 1. Point the app at your cloud backend (recommended)

For testing **away from home**, your `.env` (project root) should use **HTTPS**
URLs, not `http://192.168.x.x` or `127.0.0.1`:

```env
EXPO_PUBLIC_TRANSLATE_ENDPOINT=https://italiano-api.vercel.app/api/translate
EXPO_PUBLIC_CONTENT_BASE_URL=https://italiano-api.vercel.app
EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
```

After editing `.env`, always restart Metro with a clean cache:

```bash
npx expo start --tunnel --clear
```

---

## 2. Start Metro in tunnel mode (must be an **interactive** terminal)

> **Important:** Run this in **Terminal.app**, **iTerm**, or an **interactive**
> Cursor / VS Code terminal tab — **not** as a fully backgrounded job. Expo
> prints the QR code and `exp://` URL to stdout; non‑TTY sessions hide it.

```bash
cd /path/to/italiano

# Stop any stale Metro from earlier sessions (safe if nothing runs)
pkill -f "expo start" 2>/dev/null || true

npx expo start --tunnel
```

Wait until you see:

```text
Tunnel connected.
Tunnel ready.
Waiting on http://localhost:8081
```

### First‑time flags

| Flag | Purpose |
|------|---------|
| `--tunnel` | Routes Metro through Expo’s `*.exp.direct` tunnel → works off‑LAN. |
| `--clear` | Wipes Metro cache after `.env` / native config changes. |

---

## 3. Open the project on the iPhone

### Option A — QR scan (fastest)

1. In the terminal, press **`?`** to see the key cheat sheet (optional).
2. Open **Expo Go** on the iPhone.
3. Tap **Scan QR code** and frame the QR printed in the terminal.

### Option B — iOS Camera → Expo Go

1. Open the **Camera** app and point at the QR.
2. Tap the yellow **Open in Expo Go** banner.

### Option C — Manual URL (if QR fails)

1. In Expo Go, tap **Enter URL manually**.
2. Paste the `exp://…` URL shown under the QR in the terminal.

---

## 4. Smoke test checklist (on the phone)

| Step | Expected |
|------|----------|
| **Hledat → `postel`** | Italian `letto` appears (Vercel `/api/translate` works). |
| **+ Přidat do slovíček** | Row appears under **Slovíčka**. |
| **Profil → Přihlásit Googlem** | Safari OAuth flow, returns to Expo Go signed‑in (Supabase must allow the **`exp://…`** redirect Expo uses in Go, not only `italiano://`; see DEPLOYMENT.md §2.4). |
| **Profil → Synchronizovat** | Completes without error (Postgres + RLS). |
| **Lekce** | Content loads from `EXPO_PUBLIC_CONTENT_BASE_URL` bundles. |

---

## 5. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Input is required … install @expo/ngrok` | Run `npm i -g @expo/ngrok@^4.1.0` once, restart `npx expo start --tunnel`. |
| `Failed to start tunnel` / `ngrok` errors | Retry with `npx expo start --tunnel --clear`. Check corporate VPN / firewall blocking outbound HTTPS. |
| Expo Go shows **“Could not connect to development server”** | Metro died or Mac slept — wake Mac, re‑run `npx expo start --tunnel`, rescan QR. |
| No QR / URL visible | Terminal is non‑interactive — open a real TTY tab (see §2). |
| White screen / infinite spinner on first open | Wait 30–60 s (first bundle compile). Shake device → **Reload** if stuck. |
| Google sign‑in fails with *Invalid redirect URL* | Add **`exp://…`** (and optionally `italiano://` for builds) under Supabase **Authentication → URL Configuration** (DEPLOYMENT.md §2.4). |
| Google sign‑in **never returns** / infinite spinner after browser OK | Supabase allow-list missing the **`exp://`** callback Expo Go uses | Same as above; or use an EAS **development build** where `italiano://` applies. |

---

## 6. Stopping Metro

In the terminal where Metro runs:

- Press **Ctrl+C** once (graceful shutdown).

---

## 7. Next step when you no longer want the Mac online 24/7

Build a **development client** once (`eas build --profile development`) and
push JS with **`eas update`** — the phone then downloads bundles from
`https://u.expo.dev/...` while you hack on the laptop offline. iOS still needs
Apple Developer for that *standalone* install; Android can sideload the APK for
free.

See **[DEPLOYMENT.md](./DEPLOYMENT.md) §5** for the full EAS flow.

---

*Last reviewed: 2026‑05‑10 — Expo SDK 54, tunnel via `@expo/ngrok`.*
