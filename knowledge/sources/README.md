# Knowledge sources

Official teachings for Monk Companion belong here after the monk and
Awaythroughfoundation grant a written license.

Expected layout:

```
knowledge/sources/
  talks/<talk-id>/video.url.txt
  talks/<talk-id>/transcript.md
  texts/<work-id>.md
```

Each file should keep bibliographic fields (title, date, canonical URL,
timestamp map). The website retrieves from `src/lib/knowledge.ts` until an
ingest job replaces that seed corpus.
