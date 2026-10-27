-- Monk Companion knowledge base.
-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run.

create table if not exists teaching_chunks (
  id          text primary key,              -- <source_id>#<chunk_index>
  source_id   text not null,                 -- one transcript / video
  title       text not null,                 -- e.g. "Buddhist Tips for a Happy Life 35"
  series      text,
  part        int,
  language    text not null default 'en',    -- en | es | pt
  ts_config   regconfig not null default 'english',
  video_url   text,                          -- link used in citations
  chunk_index int  not null,
  content     text not null,
  tsv tsvector generated always as (
    to_tsvector(ts_config, coalesce(title, '') || ' ' || content)
  ) stored,
  created_at  timestamptz not null default now()
);

create index if not exists teaching_chunks_tsv_idx on teaching_chunks using gin (tsv);
create index if not exists teaching_chunks_source_idx on teaching_chunks (source_id);

-- Only the server (service role key) may read or write. No public access.
alter table teaching_chunks enable row level security;

-- Search across English, Spanish and Portuguese at once.
-- Each argument uses web-search syntax, e.g. 'anger or angry or hatred'.
create or replace function match_teachings(
  q_en text, q_es text, q_pt text, match_count int default 8
)
returns table (
  id text, source_id text, title text, video_url text,
  language text, content text, rank real
)
language sql stable
set search_path = public
as $$
  with q as (
    select websearch_to_tsquery('english',    coalesce(q_en, ''))
        || websearch_to_tsquery('spanish',    coalesce(q_es, ''))
        || websearch_to_tsquery('portuguese', coalesce(q_pt, '')) as query
  )
  select c.id, c.source_id, c.title, c.video_url, c.language, c.content,
         ts_rank_cd(c.tsv, q.query) as rank
  from teaching_chunks c, q
  where c.tsv @@ q.query
  order by rank desc
  limit match_count;
$$;

revoke execute on function match_teachings(text, text, text, int) from public, anon, authenticated;
grant  execute on function match_teachings(text, text, text, int) to service_role;
