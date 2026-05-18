-- Required for god_is_typing v2.6 web channel rate limiting
-- Run this in Supabase SQL Editor before deploying

create table if not exists public.web_rate_limit (
  ip_hash text primary key,
  count int not null default 0,
  window_start timestamptz not null default now(),
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_web_rate_limit_ip_hash
  on public.web_rate_limit using btree (ip_hash);

create index if not exists idx_web_rate_limit_window_start
  on public.web_rate_limit using btree (window_start);

-- Optional cleanup function (>30 days old entries)
create or replace function public.cleanup_old_web_rate_limits()
returns void as $$
begin
  delete from public.web_rate_limit
  where window_start < now() - interval '30 days';
end;
$$ language plpgsql;
