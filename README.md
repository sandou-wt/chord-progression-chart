# Chord Progression Chart (v1)

A free, static, English-language tool site for the keyword **chord progression chart**.
Pure front end: pick a key and style, see Roman numerals and chord names, hear the
progression with Web Audio, transpose, and print.

This is a practice site. **No domain has been purchased, and nothing has been deployed.**

## Pages

- `/` — chord progression chart (home)
- `/12-bar-blues-chord-progression/` — 12-bar blues
- `/circle-of-fifths-chord-progression/` — circle of fifths

## Commands

```bash
npm test          # music-theory checks
npm run build     # static export to ./out
npm start         # serve ./out on http://localhost:4173
npm run dev       # Next.js dev server
```

Canonical URLs and `sitemap.xml` / `robots.txt` use the placeholder origin
`https://example.com` until a real domain is bought.

## Stack

Next.js 14 App Router with `output: "export"`. No external APIs, no account required.


## Audio credits

Playback uses recorded steel-string acoustic guitar notes, self-hosted in
`public/samples/guitar/` and loaded on first play (about 0.6 MB). They come from the
"guitar-acoustic" set in [nbrosowsky/tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments),
originally from the University of Iowa Electronic Music Studios Musical Instrument
Samples, licensed [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Changes:
12 notes selected (E2 to C5), trimmed with a fade-out, loudness-matched, re-encoded to
mono MP3. Other pitches are made by resampling the nearest note.

Example-phrase melodies use nylon-string guitar notes in `public/samples/lead/` (about
0.37 MB, loaded only when a phrase is played): the "guitar-nylon" set from the same
repository, originally the Freesound pack "classicalguitar-multisampled" by
[quartertone](https://freesound.org/people/quartertone/packs/11573/), CC BY 3.0.
Same edits as above.
