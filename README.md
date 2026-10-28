# Monk Companion (Kalden the Monk)

Website for [A Way Through Foundation](https://github.com/propelityio/kaldenthemonk): a guest-first companion grounded in Kalden’s teachings.

- **Product:** Monk Companion
- **Conversation UI:** Monk Chat (`/chat`)
- **Access:** no login or subscription to talk
- **Personal path:** optional name (+ intention) stored in the browser; the Monk greets by name and keeps the intention in mind

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How the conversation works

The Monk opens with a time-of-day question ("Good morning. How are you feeling as this day
begins?"), and that question is sent along with the conversation, so the person's reply is
understood as an answer to it.

1. A fast model reads the recent conversation and decides what the latest message is:
   a **share** (how they feel, what is happening), a **question** about a teaching, or **small talk**,
   and turns it into search terms (English, Spanish, Portuguese).
2. Supabase full-text search finds matching passages in `teaching_chunks`.
3. With matching passages, the answer model replies conversationally: a brief acknowledgement,
   teaching taken only from the passages and cited as `[n]`, and one gentle follow-up question.
   It answers `NO_ANSWER` when the passages don't fit, and uncited answers are discarded.
4. With no fitting passage:
   - a **share** or **small talk** gets a short listening reply (acknowledge, invite more) that
     is not allowed to contain any teaching or advice;
   - a **question** gets the honest "no recorded teaching yet" reply.
5. Crisis language is checked first on every message and always routes to a crisis line.

## Languages, greeting and voice

- The chat screen follows the visitor's browser language (English, Spanish, Portuguese,
  French, German, Italian, Chinese, Japanese) with a picker to change it. Answers follow the
  language the person writes in, whatever it is. Strings live in `src/lib/i18n.ts`.
- The opening greeting comes from the visitor's own clock: morning, afternoon, evening or night,
  with a reflective question that changes daily.
- Crisis language is detected in all of those languages; the reply names the local helpline
  where known (US/CA 988, UK/IE/DE 116 123, FR 3114, ES 024, BR 188) and always points to
  findahelpline.com.
- Spoken replies use ElevenLabs when `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` are set
  (`/api/speak`), otherwise a slower, lower browser voice.

## Knowledge base setup

1. Supabase → SQL Editor → run `supabase/schema.sql` (once; safe to re-run).
2. Put keys in `.env.local` (see `.env.example`) and in Vercel → Settings → Environment Variables.
3. Put finished transcripts (.docx) in `knowledge/sources/` (git-ignored).
   Drafts named `IN PROGRESS …` and `Raw …` folders are skipped.
4. `npm run ingest -- --dry` to preview, then `npm run ingest` to upload.
5. Add exact video links to `knowledge/manifest.json` as they become known.

## What this first version does

- Landing page and Monk Chat (text + browser speech)
- Answers retrieved from a small foundation corpus, with citations
- Honest refusal when a teaching is not loaded
- Crisis language routes to 988 instead of companion mode

## What comes next

1. License and ingest YouTube talks, transcripts, and written texts
2. Replace keyword retrieval with embeddings
3. Magic-link identity instead of `localStorage`
4. Phase II app on the same API
