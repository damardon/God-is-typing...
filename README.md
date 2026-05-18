# god_is_typing — web (Vite + React)

Frontend for **god_is_typing v2.6**: parchment-style letter UI with routes `/`, `/ask`, `/reveal`, `/browse` — talks to your **n8n** webhook (`POST` JSON with `message`, `language`, `deity`, `sessionId`, `ipHash`).

Full architecture, Supabase SQL, and n8n export live in this repo:

- [`docs/README_v2_6.md`](./docs/README_v2_6.md) — architecture, testing, deployment checklist
- [`supabase/web_rate_limit.sql`](./supabase/web_rate_limit.sql) — rate limit table for the web channel
- [`n8n/god_is_typing_v2_6.json`](./n8n/god_is_typing_v2_6.json) — workflow import (verify against your latest export)

## Local development

```bash
npm install
cp .env.example .env
# Set VITE_N8N_WEBHOOK_URL to your active n8n webhook URL
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy (n8n + Vercel + Codespaces)

Step-by-step guide (Spanish): [`docs/DEPLOY.md`](./docs/DEPLOY.md)

Quick Vercel checklist:

1. Push to GitHub (`git init` if needed — see DEPLOY.md).
2. Vercel → **Add New Project** → import repo (Vite preset).
3. Set `VITE_N8N_WEBHOOK_URL` to your **active** n8n production webhook URL.
4. Deploy. `vercel.json` handles SPA routing for React Router.

GitHub Codespaces: open repo → **Code** → **Codespaces** (`.devcontainer/` included).

## Privacy note

The browser sends a **fingerprint** (`ipHash`), not a real IP. See limitations in `docs/README_v2_6.md`.
