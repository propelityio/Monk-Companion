Entry bells, played when a visitor opens the chat. Each visit uses the next bell
in turn (the list is `BELLS` in `src/lib/bell.ts`); the bell stays the same for
the whole visit.

Trimmed to 2 s with a natural ring-out (the level falls evenly in decibels after
the strike, to silence at 2 s, rather than a straight-line fade that sounds cut off),
and loudness-matched (about -20 LUFS) from the originals in
`/sounds-source` (kept out of git):

| File | Source | Clip |
|---|---|---|
| bell-tibetan-bell.mp3 | Tibetan - Bell.wav | first strike, 2 s, faded |
| bell-small-bowl.mp3 | Tibetan - Small Bowl.wav | first strike, 2 s, faded |
| bell-silver-bells.mp3 | Tibetan Silver Bells.mp3 | first chimes, 2 s, faded |
| bell-singing-bowl.mp3 | Tibetan - Singing Bowl.flac | rubbed-bowl swell, 2 s, faded in and out |

To add or remove a bell, add the file here and update `BELLS`.
Only use recordings you have the rights to; note their source and licence here.
