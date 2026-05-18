# Setting up `god_is_typing` in n8n (Phase 1)

This guide takes you from a clean n8n instance to a working Telegram deity-bot in roughly 30 minutes. We assume:

- A working n8n instance (n8n Cloud, Render free tier, or self-hosted ≥ v1.50.0)
- A Telegram bot token from `@BotFather` ([5 minutes — see STEP_BY_STEP.md](../../docs/STEP_BY_STEP.md))
- A Supabase project (free tier is fine)
- A Google AI Studio API key (free tier is fine)
- Optional: an OpenAI API key (only if you want voice responses)
- Optional: a Tavily API key (only if you want web-search-augmented responses)

If any of these are unfamiliar, the [`docs/STEP_BY_STEP.md`](../../docs/STEP_BY_STEP.md) page has the full walkthrough.

## 1. Prepare Supabase

Already covered in [STEP_BY_STEP.md → Phase 1, Steps 1.2–1.3](../../docs/STEP_BY_STEP.md#step-12--set-up-supabase). The schema is in [`deploy/db/schema.sql`](../../deploy/db/schema.sql) — run it once in the Supabase SQL editor.

## 2. Get your credentials

You will need the following — note them down, paste them into n8n's credential manager:

| What | Where to get it |
|---|---|
| `SUPABASE_URL` | Supabase → Project settings → API |
| `SUPABASE_SERVICE_KEY` | Supabase → Project settings → API → `service_role` |
| `POSTGRES_*` | Supabase → Project settings → Database → Connection info |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey (free) |
| `TELEGRAM_BOT_TOKEN` | `@BotFather` on Telegram → `/newbot` |
| `TAVILY_API_KEY` (optional) | https://tavily.com (1000 free searches/month) |
| `OPENAI_API_KEY` (optional) | https://platform.openai.com (only if you want voice) |

## 3. Import the workflows

`god_is_typing` is **not one big workflow**; per [ADR-0002](../../docs/adr/0002-hexagonal-architecture.md), it is split into modular sub-workflows organised by architectural layer.

Import them in this order — each later one references the earlier ones:

1. **`god_is_typing-retriever-sefaria.json`** — Sefaria adapter
2. **`god_is_typing-retriever-bible.json`** — bible-api adapter
3. **`god_is_typing-retriever-quran.json`** — Quran.com adapter
4. **`god_is_typing-retriever-bhagavad-gita.json`** — Gita adapter
5. **`god_is_typing-retriever-vector-store.json`** — Supabase semantic retrieval
6. **`god_is_typing-llm-gemini.json`** — Gemini LLM adapter
7. **`god_is_typing-tts-openai.json`** — OpenAI TTS adapter (optional)
8. **`god_is_typing-cost-logger.json`** — emits cost events to Supabase
9. **`god_is_typing-router.json`** — detects tradition from inbound message
10. **`god_is_typing-dialogue.json`** — orchestrates a single dialogue turn
11. **`god_is_typing-channel-telegram.json`** — Telegram polling + reply

Each is in this directory.

## 4. Wire credentials inside n8n

For each imported workflow, open the credential-using nodes and connect them to your stored credentials. The credentials we expect to exist:

- **HTTP Header Auth — Sefaria:** none (Sefaria has no auth, but we use the credential slot to set User-Agent)
- **Google Gemini:** uses `GEMINI_API_KEY`
- **Supabase:** uses `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`
- **Postgres:** uses `POSTGRES_*` info
- **Telegram:** uses `TELEGRAM_BOT_TOKEN` (n8n has a built-in Telegram credential type)
- **HTTP Bearer Auth — OpenAI** (optional): uses `OPENAI_API_KEY`
- **HTTP Bearer Auth — Tavily** (optional): uses `TAVILY_API_KEY`

## 5. Activate the Telegram channel

Unlike WhatsApp, Telegram doesn't need webhook verification. Just:

1. Open `god_is_typing-channel-telegram.json` in n8n
2. The `Telegram Trigger` node is set to **Polling** mode by default — leave it that way for Phase 1
3. Click **Activate** (top right toggle)

That's it. The bot starts listening for messages immediately.

> **Why polling and not webhook?** Polling means n8n calls Telegram every ~1 second asking "any new messages?". No public URL needed — works in any environment, including Codespaces, behind home routers, etc. The latency overhead (~1s) is invisible at conversational speed. See [ADR-0013](../../docs/adr/0013-telegram-instead-of-whatsapp.md) for the full reasoning.

## 6. Seed the vector store

Run `scripts/seed_corpus.py` (Phase 2) — or, in Phase 1, manually trigger the `god_is_typing-corpus-ingestion.json` workflow, which:

- Pulls the curated commentary corpora listed in [`docs/SOURCES.md`](../../docs/SOURCES.md) from public sources
- Embeds them with Gemini `text-embedding-004`
- Inserts into Supabase with `metadata.tradition_family` set per [ADR-0006](../../docs/adr/0006-tradition-as-tenant.md)

The seed run takes ~5 minutes and costs about $0.04 in embeddings. After that, retrieval is free at our scale.

## 7. Test it

Open Telegram. Search for your bot's username (e.g., `@god_is_typing_bot`). Click Start.

Send `/menu`. You should receive the cosmic switchboard menu with inline buttons.

Tap "Hashem (Orthodox)" → send `What does Torah say about forgiveness?`. You should receive a response that:

- Begins with the disclaimer (`⚠️ I am a literary representation...`)
- Cites at least one passage from the Tanakh or Mishnah
- Does **not** mention Jesus, the Quran, or Krishna
- Comes back in under 5 seconds

If any of those fail, see [`docs/RUNBOOK.md`](../../docs/RUNBOOK.md).

## 8. Verify cost dashboard

Open Supabase → SQL editor and run:

```sql
select tradition, count(*) as turns,
       sum(cost_usd) as total_cost,
       avg(cost_usd) as avg_cost,
       percentile_cont(0.95) within group (order by cost_usd) as p95_cost
from cost_events
where created_at > now() - interval '1 day'
group by tradition;
```

Average cost should be ≤ $0.001. If it isn't, something is wrong — likely TTS being used unintentionally, or a runaway tool-call loop.

## You're done

Send the bot link `t.me/your_bot_name` to a friend who speaks fluent skepticism. See if the deities convince them. Open issues for whatever breaks first. That's how we learn.
