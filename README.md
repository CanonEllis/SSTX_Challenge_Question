# SSTX Monthly Code Challenge — Static Site (GitHub Pages)

This repository hosts a static site for your monthly coding/math challenges:
- PDFs for each challenge
- Countdown timer for the current challenge window
- Leaderboard (name, score, timestamp)
- Winners section
- Past challenges archive

No backend required. All data is in JSON files you can edit directly.

## Deploy (GitHub Pages)
1. Create a new **public** GitHub repo and upload everything in this folder to the repo root.
2. Put your challenge PDFs into `pdfs/` and update their paths in `data/challenges.json`.
3. In GitHub → **Settings** → **Pages**, set:
   - Source: *Deploy from a branch*
   - Branch: `main` (or `master`), Folder: `/` (root)
4. Your site will publish at `https://<user>.github.io/<repo>/`.

## Update Each Month
1. Add PDF(s) to `pdfs/`.
2. Append a new object in `data/challenges.json` with `id`, `title`, `pdf`, `start`, `end`, and set `"current"` to that `id`.
3. Add/modify rows in `data/leaderboard.json` as submissions arrive.
4. When finished, add winners in `data/winners.json` and set the challenge `status` to `"closed"`.

## Notes
- Timestamps are ISO with timezone offset (e.g., `-05:00` for America/Chicago).
- `challenge.html?id=YYYY-MM` deep-links to a specific challenge.
- You can swap `assets/logo.svg` for your school logo.
