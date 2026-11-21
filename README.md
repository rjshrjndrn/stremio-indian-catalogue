# Stremio Indian Catalogue

Catalog addon for [Stremio](https://www.stremio.com) and [Nuvio](https://nuvio.wiki): **trending Malayalam, Tamil, Marathi and Hindi** movies and series, from TMDB.

- 8 rows: each language × movies / series, most popular first, endless scroll
- Movies: **digital (OTT) release in India in the last 90 days**, so streams are likely to exist
- Series: an episode aired in the last 90 days (currently running or just finished)
- IMDb ids (`tt…`) wherever TMDB has one, so stream addons like Torrentio can find streams
- Catalog only: no streams, no metadata pages (your other addons handle those)

## Deploy (free, browser only)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frjshrjndrn%2Fstremio-indian-catalogue&env=TMDB_API_KEY&envDescription=TMDB%20v3%20API%20key%20or%20v4%20read%20access%20token&envLink=https%3A%2F%2Fwww.themoviedb.org%2Fsettings%2Fapi&project-name=stremio-indian-catalogue&repository-name=stremio-indian-catalogue)

1. Get a free TMDB API key: themoviedb.org → Settings → [API](https://www.themoviedb.org/settings/api)
2. Click **Deploy with Vercel**, sign in with GitHub, paste the key as `TMDB_API_KEY`
3. When the deploy finishes, copy your URL and add `/manifest.json`:
   `https://<your-project>.vercel.app/manifest.json`
4. Install it:
   - **Nuvio**: Addons → Install from URL → paste the manifest URL
   - **Stremio**: paste the manifest URL in the addon search box

The button copies this repo into your GitHub account; pushes to your copy redeploy automatically.
Runs within Vercel's free Hobby plan (personal, non-commercial use). Catalogs are cached at the CDN for 6 hours, so TMDB is called a few times a day, not per viewer.

## Local development

Requires Node 20.12+ (uses built-in `fetch`, `node:test`, `--env-file`). No dependencies.

```bash
cp .env.example .env.local   # put your TMDB_API_KEY in it
make test                    # unit tests, no network
make dev                     # http://localhost:3000/manifest.json
make check                   # smoke test against real TMDB (dev server must be running)
make check BASE=https://<your-project>.vercel.app   # same, against a deployment
```

Nuvio on the same Mac can install `http://localhost:3000/manifest.json` directly.

## How it works

```
Nuvio ── /catalog/movie/in-ml/skip=40.json ──▶ Vercel CDN (6h cache) ──miss──▶ api/index.js
                                                                                 │
     TMDB /discover/movie?with_original_language=ml&sort_by=popularity.desc
                         &region=IN&with_release_type=4&release_date.gte=<90d ago>&page=3
     TMDB /movie/{id}/external_ids  ×20  → imdb_id (tt…), else tmdb:{id}
                                                                                 │
Nuvio ◀── { metas: [{ id: "tt…", name, poster, … }] } ◀──────────────────────────┘
  └─ tt id ─▶ metadata addon (details) ─▶ stream addons (Torrentio, …)
```

Titles without an IMDb id keep a `tmdb:` id so every page is exactly 20 items and any scroll
position costs one TMDB page (21 calls). Those few titles may show no streams.

## Credits

This product uses the TMDB API but is not endorsed or certified by TMDB.
Data and images © [TMDB](https://www.themoviedb.org).

## License

MIT
