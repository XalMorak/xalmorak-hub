# Xal'Morak Hub

Gaming community site: Steam catalog, Hub ratings, public lounge, private DMs, user-created group chat, and wishlist.

## Stack

- TanStack Start / Router / Query
- Postgres (Neon in production, PGLite in preview)
- Better Auth (Google, X)
- Steam Store API + CheapShark (server-side HTTPS allowlist)

## Security

- Chat membership is checked on the server; messages never leak across rooms
- Uploads: JPEG / PNG / WebP (350KB) and MP4 / WebM (1.5MB), magic-byte inspection, HTML/SVG rejected
- Video links: HTTPS YouTube, Vimeo, or `.mp4`/`.webm` only — localhost and private IPs blocked
- Chat/lounge text strips HTML tags and `javascript:` payloads
- Rate limits on lounge, chat, media, reviews, and group creation
- Catalog fetches only `store.steampowered.com`, `steamcommunity.com`, `www.cheapshark.com` (no redirects)
- CSP, `nosniff`, and Permissions-Policy on production responses

## Scripts

```
npm run dev
npm run build
npm run typecheck
```
