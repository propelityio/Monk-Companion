# Monk Companion (Kalden the Monk)

Website for [Awaythroughfoundation](https://github.com/propelityio/kaldenthemonk): a guest-first companion grounded in Kalden’s teachings.

- **Product:** Monk Companion
- **Conversation UI:** Monk Chat (`/chat`)
- **Access:** no login or subscription to talk
- **Curated path:** optional name + email stored in the browser for now

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
