# Virtue Tracker

A self-contained React + Vite app for tracking daily virtues and vices,
whole-life assessment, daily mindset review, HSPU progression, and a
5-day superset workout program with adjustable weights.

This version has no server and no API key requirement — the AI Companion
(Get Insight / Visualize) feature from the original AI Studio build has
been removed so this runs as a fully static site anywhere for free.

## Run locally

**Prerequisites:** Node.js (18+)

1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`

## Build for deployment

```
npm install
npm run build
```

This produces a `dist/` folder containing plain HTML/CSS/JS — upload
that folder's contents to any static host (GitHub Pages, Netlify,
Vercel, Cloudflare Pages, or even a plain web server) with zero
configuration and zero ongoing cost.

## GitHub Pages — automatic deployment

This repo includes `.github/workflows/deploy.yml`, which builds and
deploys the app to GitHub Pages automatically every time you push to
`main`.

1. Push this repo to GitHub (a new repo, branch named `main`).
2. In the repo, go to **Settings → Pages** and set **Source** to
   **GitHub Actions**.
3. Push any change (or re-run the workflow from the **Actions** tab)
   to trigger a deploy. First run takes a minute or two.
4. Your app will be live at `https://<username>.github.io/<repo>/`.
5. Open that URL in Safari on your iPad → Share → Add to Home Screen.

From then on, every push to `main` redeploys automatically — no manual
build step needed.
