-- Questions visitors asked that no recorded teaching answered: a to-do list of
-- talks and transcripts to add next. Run once in Supabase (SQL Editor). Safe to re-run.
-- Only the question itself is kept: no names, intentions, email or conversation.
-- Email addresses, phone numbers and links are removed before saving.

create table if not exists unanswered_questions (
  id        bigint generated always as identity primary key,
  asked_at  timestamptz not null default now(),
  question  text not null,
  language  text not null,
  outcome   text not null,          -- offered_nearby | no_teaching
  topics    text not null default '' -- search terms the companion used
);

create index if not exists unanswered_questions_asked_idx on unanswered_questions (asked_at desc);
alter table unanswered_questions enable row level security;  -- only the server can read or write
