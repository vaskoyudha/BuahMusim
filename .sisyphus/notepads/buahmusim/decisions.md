# Decisions

## [2026-02-20] Architecture
- Stack: pnpm monorepo | Next.js 15 App Router | FastAPI + Prophet ML | SQLite + better-sqlite3 | Recharts | Leaflet + React-Leaflet | Groq LLM | node-cron | Docker Compose
- Synthetic data (no public Indonesian fruit price APIs)
- Lazy Prophet training (on-demand, cached 24h)
- LLM template fallback (works without GROQ_API_KEY)
- 30 fruits × 10 cities fixed set, Bahasa Indonesia only
