-- Recommended listening for Monk Companion (podcasts, and later videos).
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run. Safe to re-run.
-- These are suggestions only: the Monk never quotes or describes them beyond
-- the title, and only recommends items listed here.

create table if not exists recommended_listening (
  id          text primary key,
  kind        text not null default 'podcast',    -- podcast | video
  title       text not null,
  language    text not null,                      -- en | es | pt | fr | de ...
  topics      text not null,                      -- keywords used for matching (English)
  description text not null default '',           -- internal note for matching
  url         text not null,                      -- where the visitor listens
  active      boolean not null default true,
  tsv tsvector generated always as (
    to_tsvector('english', title || ' ' || topics || ' ' || description)
  ) stored
);

create index if not exists recommended_listening_tsv_idx on recommended_listening using gin (tsv);
alter table recommended_listening enable row level security;

-- Best matches for the search terms, preferring the visitor's language.
create or replace function match_listening(
  q_en text, q_es text, q_pt text, lang text, match_count int default 2
)
returns table (id text, kind text, title text, language text, url text, rank real)
language sql stable
set search_path = public
as $$
  with q as (
    select websearch_to_tsquery('english',    coalesce(q_en, ''))
        || websearch_to_tsquery('spanish',    coalesce(q_es, ''))
        || websearch_to_tsquery('portuguese', coalesce(q_pt, '')) as query
  )
  select r.id, r.kind, r.title, r.language, r.url,
         ts_rank_cd(r.tsv, q.query) + case when r.language = lang then 1 else 0 end as rank
  from recommended_listening r, q
  where r.active and r.tsv @@ q.query
  order by rank desc
  limit match_count;
$$;

revoke execute on function match_listening(text, text, text, text, int) from public, anon, authenticated;
grant  execute on function match_listening(text, text, text, text, int) to service_role;

-- The first eight episodes (Google Drive). Topics come from the titles; edit as needed.
insert into recommended_listening (id, title, language, topics, url) values
  ('karma-true-mechanics-en',   'The True Mechanics of Karma', 'en',
   'karma cause effect action result intention habit mind conditions',
   'https://drive.google.com/file/d/1C6LiZPJaTeyx6A6U7hAHS_AkQPQ2JVBD/view'),
  ('karma-real-physics-en',     'The Real Physics of Karma', 'en',
   'karma cause effect action result conditions intention why things happen',
   'https://drive.google.com/file/d/12g6MAKj2nthQOsbeP77ihj7tt7XAMxIp/view'),
  ('karma-physical-reality-en', 'How Karma Shapes Physical Reality', 'en',
   'karma reality perception experience environment cause effect world',
   'https://drive.google.com/file/d/1MysjIUVlyXvu4jFmwZsclYHd55aGgB9k/view'),
  ('mind-projects-reality-en',  'How Your Mind Projects Reality', 'en',
   'mind perception projection interpretation reality anger blame resentment habit thoughts',
   'https://drive.google.com/file/d/1EyLTx_a3z4UuBm2B6OGFcEQtlS3yVPt4/view'),
  ('karma-four-powers-es',      'Los Cuatro Poderes Para Purificar El Karma', 'es',
   'karma purification purify guilt regret mistake four powers amends negative actions',
   'https://drive.google.com/file/d/1N9oGyNbfCJ0Dn-DuSS5a-t49K-fx9c7j/view'),
  ('karma-intention-pt',        'Karma é Intenção E Não Punição', 'pt',
   'karma intention not punishment guilt fear why bad things happen motivation',
   'https://drive.google.com/file/d/1NNEBG6-3KsJ9ioqpVNAgyC6rG0p0EIF3/view'),
  ('karma-intention-fr',        'Le Karma Repose Sur l''Intention', 'fr',
   'karma intention motivation action cause effect',
   'https://drive.google.com/file/d/1i8bjS5mV2ViQG34HMFa6folF2sYw2WzK/view'),
  ('karma-intention-de',        'Deine Absicht Bestimmt Dein Karma', 'de',
   'karma intention motivation action cause effect',
   'https://drive.google.com/file/d/1aBeieigZEw6zMHqkej-_fLvQ-RhSAZrR/view')
on conflict (id) do update set
  title = excluded.title, language = excluded.language, topics = excluded.topics, url = excluded.url;
