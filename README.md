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
