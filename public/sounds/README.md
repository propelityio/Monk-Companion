Entry bells, played when a visitor opens the chat. Each visit uses the next bell
in turn (the list is `BELLS` in `src/lib/bell.ts`); the bell stays the same for
the whole visit.

Trimmed, faded and loudness-matched (about -20 LUFS) from the originals in
`/sounds-source` (kept out of git):

| File | Source | Clip |
|---|---|---|
| bell-tibetan-bell.mp3 | Tibetan - Bell.wav | first strike, 5.5 s, 2.5 s fade |
| bell-small-bowl.mp3 | Tibetan - Small Bowl.wav | first strike, 5.5 s, natural decay |
| bell-silver-bells.mp3 | Tibetan Silver Bells.mp3 | first pair of chimes, 4.4 s |
| bell-singing-bowl.mp3 | Tibetan - Singing Bowl.flac | rubbed-bowl swell, 5.5 s, faded in and out |

To add or remove a bell, add the file here and update `BELLS`.
Only use recordings you have the rights to; note their source and licence here.
