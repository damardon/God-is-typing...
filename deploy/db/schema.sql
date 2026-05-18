-- ====================================================================
-- THEOLOGOS — full Supabase / Postgres schema
-- ====================================================================
-- Run this once on a fresh Supabase project. Idempotent (uses IF NOT EXISTS).
--
-- Architectural references:
--   - ADR-0006: tradition-as-tenant (metadata.tradition_family filter)
--   - ADR-0009: cost as observable
--   - ADR-0012: analytics in Postgres, not Notion
--
-- This single file is the source of truth for our schema.
-- In Phase 2 it gets wrapped in Alembic migrations.
-- ====================================================================

-- 1. pgvector extension for semantic retrieval
create extension if not exists vector;

-- ====================================================================
-- 2. documents — the RAG corpus, multi-tenant by metadata.tradition_family
-- ====================================================================
create table if not exists documents (
  id          bigserial primary key,
  content     text         not null,
  metadata    jsonb        not null default '{}'::jsonb,
  embedding   vector(768)  not null  -- 768 dim = Gemini text-embedding-004
);

-- IVFFlat index for fast cosine ANN search
create index if not exists documents_embedding_idx
  on documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- GIN index for fast metadata filtering — this is what enforces tenancy
create index if not exists documents_metadata_idx
  on documents using gin (metadata);

-- ====================================================================
-- 3. match_documents — the retrieval RPC called by n8n's Vector Store node
-- ====================================================================
create or replace function match_documents (
  query_embedding vector(768),
  match_count int default 5,
  filter jsonb default '{}'::jsonb
) returns table (
  id bigint, content text, metadata jsonb, similarity float
) language plpgsql as $$
#variable_conflict use_column
begin
  return query
  select id, content, metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ====================================================================
-- 4. n8n_chat_histories — conversation memory
-- ====================================================================
-- Used by n8n's Postgres Chat Memory node. Session ID is a hash, not a phone.
create table if not exists n8n_chat_histories (
  id          bigserial primary key,
  session_id  text         not null,
  message     jsonb        not null,
  created_at  timestamptz  default now()
);

create index if not exists n8n_chat_histories_session_idx
  on n8n_chat_histories (session_id, created_at desc);

-- ====================================================================
-- 5. cost_events — every dialogue turn logs cost decomposition
-- ====================================================================
-- See ADR-0009. Soft circuit breakers monitor this table.
create table if not exists cost_events (
  id              bigserial primary key,
  session_id      text          not null,    -- already hashed
  tradition       text          not null,
  channel         text          not null,    -- 'telegram' | 'rest' | 'cli' | 'whatsapp' (Phase 3)
  llm_input       int           not null,
  llm_output      int           not null,
  cost_usd        numeric(10,6) not null,
  latency_ms      int           not null,
  voice_response  bool          not null default false,
  cache_hit       bool          not null default false,
  created_at      timestamptz   default now()
);

create index if not exists cost_events_tradition_time_idx
  on cost_events (tradition, created_at desc);

-- ====================================================================
-- 6. questions_log — anonymized question capture for analytics
-- ====================================================================
-- See ADR-0012. session_hash is sha256(phone) — never the raw phone.
-- question_topic is auto-classified by an async LLM call; controlled vocabulary.
create table if not exists questions_log (
  id              bigserial primary key,
  session_hash    text          not null,
  tradition       text          not null,
  question        text          not null,    -- raw text, NOT in public view
  question_lang   text,                       -- ISO 639-1, e.g. 'es', 'en'
  question_topic  text,                       -- LLM-classified, controlled vocab
  response_chars  int           not null,
  cited_sources   jsonb         default '[]'::jsonb,
  created_at      timestamptz   default now()
);

create index if not exists questions_log_tradition_time_idx
  on questions_log (tradition, created_at desc);
create index if not exists questions_log_topic_idx
  on questions_log (question_topic);
create index if not exists questions_log_session_idx
  on questions_log (session_hash);

-- ====================================================================
-- 7. public_analytics view — what the Streamlit dashboard reads
-- ====================================================================
-- Exposes ONLY aggregates. No raw question text. Privacy by construction.
create or replace view public_analytics as
select
  tradition,
  question_topic,
  date_trunc('day', created_at) as day,
  count(*) as question_count
from questions_log
where question_topic is not null
group by tradition, question_topic, date_trunc('day', created_at);

-- ====================================================================
-- 8. Row-Level Security
-- ====================================================================
-- service_role bypasses RLS, so n8n (using service key) can still write.
-- Public anon clients reading via the view are blocked from raw tables.
alter table documents enable row level security;
alter table cost_events enable row level security;
alter table questions_log enable row level security;
alter table n8n_chat_histories enable row level security;

-- Streamlit dashboard reads the view through a read-only Postgres user
-- (created manually in Supabase → Authentication → Users → Add user).
-- That user gets:
--   GRANT SELECT ON public_analytics TO god_is_typing_dashboard_readonly;
-- and nothing else.

-- ====================================================================
-- 9. Data retention (run nightly via n8n)
-- ====================================================================
-- See SECURITY.md. n8n_chat_histories rolls 30 days; cost_events 90 days.
-- These are example queries; the actual deletion happens in
-- god_is_typing-data-retention.json workflow.
--
-- delete from n8n_chat_histories where created_at < now() - interval '30 days';
-- delete from cost_events where created_at < now() - interval '90 days';
-- (questions_log is retained until /forget; not auto-deleted)

-- ====================================================================
-- Done. Verify with:
--   \dt           -- 4 tables expected
--   \dv           -- 1 view expected
--   \df match_documents  -- 1 function expected
-- ====================================================================
