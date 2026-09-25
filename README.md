# Cordoval Word Match

Flip cards to match word pairs. Short sessions in the browser.

## Privacy

- No accounts
- No analytics
- No scoreboard server
- Progress and best scores stay in local storage on your device

## Features

- 16 face-down cards (8 word pairs) drawn from a starter deck of 24 pairs, shuffled every game
- Move counter and timer (starts on your first flip)
- Free play and a Daily board: the same layout for everyone on a given calendar day in Europe/London, seeded entirely in the browser
- Best moves and best time saved in `localStorage` (separately for free play and for today's daily board)
- Optional click sound (off by default)
- Works on phone and desktop

## Run locally

Requires Node.js 20.19 or newer.

```bash
npm install
npm run dev      # start the dev server at http://localhost:5173
npm run build    # type check and build the static site into dist/
npm run preview  # serve the production build locally
```

## Deploy (Vercel)

Static site, no environment variables. Vercel auto-detects Vite: build command `npm run build`, output directory `dist`.
Open Graph and Twitter image URLs in `index.html` point at `https://word-match.cordoval.co.uk/logos/word-match.png`; update them if the domain changes.

## Brand

Logos live in `public/logos/` (`word-match.svg`, `word-match.png`) and are used for the favicon, Apple touch icon, header and social images. Accent colour `#5B21B6`.

## Product

Part of [Cordoval](https://www.cordoval.co.uk). Privacy-first / local-first software brand.

## Stack

Vite + React + TypeScript. Static deploy on Vercel. Subdomain word-match.cordoval.co.uk.
