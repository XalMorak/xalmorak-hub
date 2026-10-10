# Xal'Morak Hub

[![CI](https://github.com/XalMorak/xalmorak-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/XalMorak/xalmorak-hub/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Gaming community platform: Steam catalog, Hub ratings, public lounge, private DMs, user-created group chat, and wishlist.

## Features

- Steam catalog + CheapShark deals (server-side allowlist)
- Hub ratings and reviews
- Public lounge and private DMs
- User-created group chat
- Wishlist

## Stack

- TanStack Start / Router / Query
- Postgres (Neon in production, PGLite in preview)
- Better Auth (Google, X)
- Steam Store API + CheapShark
- Vercel

## Security

- Chat membership checked on the server; messages never leak across rooms
- Uploads: JPEG / PNG / WebP (350KB) and MP4 / WebM (1.5MB), magic-byte inspection
- Video links: HTTPS YouTube, Vimeo, or `.mp4`/`.webm` only
- Rate limits, CSP, `nosniff`, Permissions-Policy

## Setup

```bash
npm install
cp .env.example .env   # хэрэв файл байвал
npm run dev
```

Бусад шалгах:

```bash
npm run typecheck
npm test
npm run build
```

## CI/CD

- **CI:** GitHub Actions — typecheck, check:auth, test, lint (`main` + PR)
- **CD:** Vercel Git integration — `main` рүү пуш хийхэд production deploy
- Dependabot долоо хоногт npm + Actions update PR нээнэ

## License

MIT — see `LICENSE`.
