# god_is_typing — Web (Vite + React)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/damardon/Godistyping)

Thin **web client** for **god_is_typing v2.6**: a multi-tradition contemplative Q&A experience. Users pick a path (Jewish, Christian, Buddhist, Pantheon, Future Self), ask a short question, and receive a letter-like answer—often with a sacred citation when the pipeline supports it.

Telegram (`@god_is_typing_bot`) and this web app share **one n8n workflow** and the same business logic; only entry and egress differ by channel.

| Docs | Description |
|------|-------------|
| [**Architecture**](./docs/ARCHITECTURE.md) | System design, technical decisions, diagrams (EN / ES) |
| [**Tech stack**](./docs/STACK.md) | Layers, tools, API contract (EN / ES) |
| [**n8n web fixes**](./docs/N8N_FIX_WEB.md) | Parse Decomposition, `Final Source Switch`, node names |
| [**Deploy guide**](./docs/DEPLOY.md) | n8n + Vercel + Codespaces (Spanish) |
| [**v2.6 checklist**](./docs/README_v2_6.md) | Full multi-channel testing & setup |

## Architecture (summary)

```text
[Browser SPA]  --POST JSON-->  [n8n v2.6]  -->  Groq LLM (+ optional RAG)
                                    |
                                    +--> Supabase (state, logs, rate limits)
                                    +--> LangFuse (traces)
```

**Design highlights:**

- **Canonical context** after `Normalize Context` — one state shape for Telegram and Web.
- **Rate limit before LLM** — 3 questions / 24 h enforced server-side (`chat_id` vs `ip_hash`).
- **Conditional RAG** — Jewish/Christian only; other paths skip decomposer/API calls.
- **Channel-aware egress** — Web: `Build Web Response` → `Respond Success`; Telegram: `Send Response`.
- **Privacy** — Web sends a browser **fingerprint** (`ipHash`), not a raw IP.

Full rationale and diagrams: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React 19, TypeScript, Vite 8, React Router 7 |
| Orchestration | n8n Cloud (import [`n8n/god_is_typing_v2.6_live.json`](./n8n/god_is_typing_v2.6_live.json)) |
| LLM | Groq via n8n (8B decomposer, 70B agents) |
| RAG | Sefaria + Bible API (Jewish / Christian branches) |
| Data | Supabase |
| Hosting | Vercel (SPA) |

Details: [`docs/STACK.md`](./docs/STACK.md).

## Routes

| Path | Purpose |
|------|---------|
| `/` | Landing |
| `/ask` | Choose tradition + question |
| `/reveal` | Typing ritual + answer letter |

## Local development

```bash
npm install
cp .env.example .env
# VITE_N8N_WEBHOOK_URL=https://YOUR.app.n8n.cloud/webhook/godistyping-web
npm run dev
```

Use the **production** webhook URL with the workflow **active** in n8n. `webhook-test` only works while listening in the editor.

```bash
npm run build
npm run preview
npm run lint
```

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_N8N_WEBHOOK_URL` | Yes | Active n8n production webhook for `godistyping-web` |

## Deploy

1. Import / activate workflow: `n8n/god_is_typing_v2.6_live.json`.
2. Run `supabase/web_rate_limit.sql` (and full schema in `deploy/db/schema.sql` if needed).
3. Push to GitHub → Vercel → set `VITE_N8N_WEBHOOK_URL` → deploy.

Step-by-step (Spanish): [`docs/DEPLOY.md`](./docs/DEPLOY.md).

## Repository layout

```text
src/           React SPA
n8n/           Workflow exports
supabase/      SQL (web rate limit)
docs/          Architecture, stack, deploy, fixes
vercel.json    SPA rewrites
```

## License & disclaimer

AI-generated contemplative text — an invitation to reflect, not absolute truth. See in-app copy and [`docs/README_v2_6.md`](./docs/README_v2_6.md).

---

**Español:** [`README.es.md`](./README.es.md)
