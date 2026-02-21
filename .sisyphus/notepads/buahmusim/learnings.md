# Learnings

## [2026-02-20] Session Start
- Working directory: C:\Project Vasko\BuahMusim (Windows)
- Platform: win32 — use forward slashes in code, backslashes in shell only
- No code exists yet — starting from scratch
- pnpm monorepo: apps/web (Next.js 15), apps/ml-service (FastAPI), packages/shared (TS)
- SQLite at data/buahmusim.db

## [2026-02-20] Phase 3: ML Prediction Service
- Scaffolded files existed as stubs — replaced with full implementations
- Python files: main.py (FastAPI endpoints), predictor.py (Prophet + fallback), holidays_id.py (Indonesian holidays)
- TS files: ml-client.ts (fetch with retry + cache), route.ts (Next.js API route)
- `predictor.py` has fallback to 7-day moving average when Prophet unavailable
- Prices rounded to nearest 500 IDR (Indonesian pricing convention)
- `PredictionCache` model field is typed as `'prophet' | 'fallback' | 'unavailable'` in shared types
- db.ts already had `getPredictions`, `insertPredictions`, `getPrices` — ml-client.ts just uses them
- tsconfig paths: `@/*` → app root, `@shared/*` → shared/src, `@buahmusim/shared` → package import
- Prophet LSP import error in Python is expected — prophet not installed in dev env
- Batch endpoint limited to 10 items, uses ThreadPoolExecutor(max_workers=4)
- API route returns 200 with empty predictions on error (graceful degradation)

## [2026-02-20] Phase 5: Price Charts

### Files Created
- `apps/web/components/charts/PriceChart.tsx` — Recharts ComposedChart with Area (confidence band) + Line (historical) + Line (prediction dashed) + ReferenceLine (today)
- `apps/web/components/charts/PriceStats.tsx` — 4-stat grid: current price, 7-day change, 30-day range, 28-day prediction
- `apps/web/app/buah/[fruitId]/page.tsx` — Client component with city tabs, useParams/useSearchParams, PriceStats + PriceChart
- `apps/web/app/kota/[cityId]/page.tsx` — Client component with 3-way sort (alpha/price_asc/change_desc), 30-fruit grid

### TypeScript gotchas with Recharts
- `Tooltip formatter` param types: `(value: number | undefined, name: string | undefined)` — name is `string | undefined` not just `string`
- `Tooltip labelFormatter` param type: `(label: unknown)` — label is `ReactNode`, cast with `String(label)`
- Both required explicit typing to satisfy Recharts' `Formatter<number, string>` generic

### Build behavior on Windows
- `✓ Compiled successfully` and `✓ Generating static pages (5/5)` — all pass
- `Collecting build traces` fails with ENOENT on `.nft.json` files — Windows race condition bug in Next.js 15.5.12 standalone tracing, pre-existing, not caused by app code
- Running consecutive builds without cleaning `.next` causes `pages-manifest.json` not found — always clean with `cmd /c rmdir /s /q` (bash `rm -rf` doesn't always work on Windows)
- `eslint.ignoreDuringBuilds: true` already set in next.config.ts

### Architecture patterns used
- `useCallback` + `useEffect` for data fetching to avoid stale closure re-fetch loops
- `useMemo` for sorted fruit list in city page (avoids re-sort on every render)
- Season status computed client-side using `getSeasonStatus(fruitId, month)` from @buahmusim/shared
- All `useState`/`useEffect`/`useParams`/`useSearchParams` pages marked `'use client'` at top
- 404 fallback: checks `getFruitById`/`getCityById` return undefined, renders friendly error
- Loading skeleton: animated pulse UI shown until first data fetch completes

## [2026-02-20] Phase 4: Interactive Map

### Leaflet + Next.js 15 Integration
- `react-leaflet` + `leaflet` + `@types/leaflet` installed via `pnpm --filter @buahmusim/web add`
- Leaflet MUST only be imported in `'use client'` components — never in server components
- `import 'leaflet/dist/leaflet.css'` belongs inside the map component file (not layout.tsx)
- Default icon fix: delete `_getIconUrl` and call `L.Icon.Default.mergeOptions({...})` in `useEffect(()=>{},[])`
- `IndonesiaMap` MUST be a default export (required by `dynamic(() => import(...)`)
- All map usages: `dynamic(() => import('@/components/map/IndonesiaMap'), { ssr: false })`
- `MapLegend` uses `useMap()` hook — must be rendered inside `<MapContainer>`, not outside
- `L.Control` legend added in `useEffect` with `legend.addTo(map)` and cleanup `legend.remove()`

### Build Issues (Windows / Next.js 15.5 specific)
- `incremental: true` in tsconfig.json + stale `tsconfig.tsbuildinfo` causes "File not found" errors after clean `.next` delete. Fix: always delete BOTH `.next/` AND `tsconfig.tsbuildinfo` before a clean build.
- `.next/export/500.html` rename error → intermittent on Windows, pre-existing infra issue, not code error
- `.next/server/pages-manifest.json` not found → race condition, clears on retry
- Adding `app/not-found.tsx` resolves some 404 export errors
- **Winning build command**: `rm -rf .next tsconfig.tsbuildinfo && pnpm build` (run twice if intermittent)
- ESLint circular JSON warning is pre-existing (eslint flat config issue) — already suppressed with `ignoreDuringBuilds: true`

### Server Component → Client Fetch Pattern
- `page.tsx` (server component) fetches map data via `fetch(baseUrl + '/api/prices/map?fruit=mangga')`
- Must guard with `content-type: application/json` check before calling `res.json()` — Next.js build can return HTML on errors
- `fetchInitialMapData()` returns `null` on any error; `HomeMapSection` handles gracefully (shows empty map)
- `NEXT_PUBLIC_APP_URL` env var used for base URL; fallback `http://localhost:3000`

### Component Architecture
- `IndonesiaMap` — default export, 'use client', Leaflet map with CircleMarkers
- `MapLegend` — named export, 'use client', uses `useMap()`, must be inside MapContainer
- `HomeMapSection` — named export, 'use client', top 8 fruits selector + map
- `PetaPage` — 'use client' (needs state), all 30 FRUITS pill selector
- `not-found.tsx` added to fix Next.js 15 App Router 404 page generation

### PriceChart.tsx pre-existing bug fixed
- Recharts `Formatter` type requires `value: number | undefined, name: string | undefined`
- Was typed as `value: number, name: string` — caused TS error during build

## [2026-02-20] Phase 7: Seasonal Calendar

### Files Created
- `apps/web/components/calendar/SeasonCell.tsx` — Single grid cell (button), computes status via `getSeasonStatus(fruitId, monthIndex + 1)` (1-indexed), applies inline style bg colors, ring for selection/currentMonth
- `apps/web/components/calendar/SeasonalCalendar.tsx` — 30×12 CSS Grid heatmap, sticky fruit name column (z-10), sticky header corner (z-20), detail panel (DetailPanel subcomponent), legend. Accepts `filterOnlySeasonal`, `sortMode`, `fruits` props for composability
- `apps/web/app/kalender/page.tsx` — 'use client' page with filter toggle (Semua/Musim Sekarang) + sort toggle (A-Z/Mulai Musim Tercepat), renders SeasonalCalendar
- `apps/web/app/buah/page.tsx` — 'use client' fruit list with real-time search, filter pills, sort select, 2-5 column responsive grid of FruitCards linking to /buah/{fruitId}
- `apps/web/components/home/InSeasonSection.tsx` — Horizontal scroll row of peak-season fruits for home page integration (Phase 8)

### Key Technical Decisions
- `getSeasonStatus(fruitId, month)` uses 1-indexed months (confirmed from seasons.ts). Always use `new Date().getMonth() + 1` for current month
- CSS Grid uses `gridTemplateColumns: '160px repeat(12, minmax(32px, 1fr))'` for responsive cell sizing
- "Bulan Ini" label uses `calc()` with CSS for absolute positioning over correct month column
- `monthsUntilNextPeak()` helper handles wrap-around (e.g. Dec→Jan) using modular arithmetic for "Mulai Musim Tercepat" sort
- Detail panel shown below grid (not as modal) to preserve mobile scroll experience
- InSeasonSection shows empty state message when no fruits in peak season (transition seasons)
- All color values use inline `style={{ backgroundColor: hex }}` for season cells (Tailwind JIT can't detect dynamic hex values) — exception to the "no inline styles" rule where truly needed for dynamic runtime values

### Build Notes
- Build passed clean on first attempt: `✓ Compiled successfully` + all 7 static/dynamic routes
- New routes: `/buah` (static ○), `/kalender` (static ○)
- No TypeScript errors; Windows `.nft.json` ENOENT is pre-existing race condition

## [2026-02-20] Phase 2: Synthetic Data Engine
- Built `apps/web/lib/data-generator.ts` — mulberry32 seeded PRNG, deterministic price generation
  - 11-step price pipeline: base -> seasonal -> city * ramadan * weekend * gaussian noise -> continuity clamp -> floor/ceil -> round to 500 IDR
  - `generateDailyPrices(dateStr)` iterates 30 fruits x 10 cities, uses `getLatestPrice` for continuity
- Built `apps/web/lib/seeder.ts` — 90-day historical backfill with batch inserts (500 per transaction)
  - Tracks `prevPrices` Map for continuity across days during seed
  - Uses `insertPriceBatch` (added to db.ts) with `db.transaction()` for fast bulk inserts
- 3 API routes:
  - `GET /api/prices?fruit=&city=&days=` — time series data
  - `GET /api/prices/latest?city=` or `?fruit=` — latest prices with 7-day trend
  - `GET /api/prices/map?fruit=` — all cities ranked by price for map viz
- Gotchas:
  - SQLite `SQLITE_BUSY` during `next build` if stale WAL/SHM lock files exist from prior crashed process. Clean them before build.
  - ESLint circular JSON warning is pre-existing config issue in eslint flat config, not code error
  - `isRamadan()` in shared/constants.ts takes Date object, but for data-generator we compare date strings directly against RAMADAN_DATES to avoid timezone issues
   - `getPrices()` returns DESC by date — index 0 is latest, last index is oldest

## [2026-02-20] Phase 6: LLM Recommendations

### Files Created
- `apps/web/lib/recommendation-template.ts` — Pure rule-based recommendation engine (6 rules + default)
  - Rules: price dropping, peak season spike, peak season stable, predicted drop, off season rising, cheaper city available
  - All output in Indonesian (Bahasa Indonesia), no placeholders
  - Exports `RecommendationContext` interface used by both template and groq-client
- `apps/web/lib/groq-client.ts` — Groq LLM client with template fallback
  - Auto-detects `GROQ_API_KEY` env var; null if missing → falls back to template
  - Uses `llama-3.3-70b-versatile` model via Groq SDK
  - `groqCallWithRetry()` — exponential backoff (1s, 2s, 4s) on 429 rate limit
  - Response parsing: extracts `REKOMENDASI: BELI` or `REKOMENDASI: TUNGGU` from first line
  - Falls back to template on any Groq API error (graceful degradation)
- `apps/web/app/api/recommendations/route.ts` — Next.js API route
  - `GET /api/recommendations?fruit=&city=` — returns action, explanation, source
  - Checks SQLite cache first (24h TTL via `expiresAt`)
  - Builds `RecommendationContext` from price history, predictions, season status
  - `getPrices()` returns DESC — index 0 is latest price
  - Uses `upsertRecommendation()` for cache writes (REPLACE INTO)
- `apps/web/components/recommendations/RecommendationCard.tsx` — Client component
  - Fetches from `/api/recommendations` in `useEffect` with cleanup (`cancelled` flag)
  - Three states: loading skeleton (animate-pulse), loaded card, error
  - BELI: green theme (bg-green-50, bg-green-600), TUNGGU: amber theme
  - Shows source label (Analisis AI / Analisis Otomatis / Dari Cache) + formatted date

### Dependencies Added
- `groq-sdk` added via `pnpm --filter @buahmusim/web add groq-sdk`

### Key Decisions
- Unused function params prefixed with `_` (e.g. `_fruitId`, `_cityId`) to satisfy TS no-unused-vars
- `Recommendation` type from `@buahmusim/shared` already defined with `source: 'llm' | 'template' | 'cache'`
- `upsertRecommendation()` in db.ts uses named params (`@fruitId`, `@cityId`, etc.)
- Template engine uses `getSeasonStatus()` from shared for real-time season detection
- Build consistently passes TypeScript type checking; Windows ENOENT race conditions in build traces are pre-existing

## [2026-02-20] Phase 8: Home Page & Navigation

### Files Created / Modified
- `apps/web/app/page.tsx` — Full home page (server component), 5 sections: Hero, InSeasonSection, HomeMapSection, Buah Populer grid, Kota Termurah table
- `apps/web/app/kota/page.tsx` — New cities list page ('use client'), 10 city cards with specialties + market info
- `apps/web/app/error.tsx` — Global error boundary ('use client'), Indonesian text, reset button
- `apps/web/app/loading.tsx` — Global loading skeleton with animate-pulse
- `apps/web/components/ui/Skeleton.tsx` — Reusable skeleton component with width/height props
- `apps/web/app/layout.tsx` — Updated metadata to template pattern (`title.default` + `title.template`)
- `apps/web/app/buah/layout.tsx`, `kalender/layout.tsx`, `kota/layout.tsx`, `peta/layout.tsx` — Server component layout wrappers for metadata (needed because pages are 'use client')

### Key Technical Decisions
- `metadata` cannot be exported from 'use client' pages in Next.js App Router — must create a server component `layout.tsx` wrapper that re-exports `metadata` and renders `{children}`
- Home page uses `Promise.all([fetchInitialMapData(), fetchLatestPrices(), fetchCheapestCities()])` for parallel server-side fetching
- `fetchCheapestCities()` uses `Promise.all()` across all 5 fruit IDs, wraps each in try-catch (graceful per-fruit degradation)
- Popular fruits grid uses `getFruitById(id)` from shared, falls back to `priceRange.low` if no live price data
- `city.population` in shared CITIES is already in millions (e.g. `10.6` = 10.6M) — format directly with `.toFixed(1)jt`
- All text in Bahasa Indonesia; no English UI strings
- `POPULAR_FRUIT_IDS` uses `buah_naga` (underscore) not `buah-naga` — matches FRUITS id
- `manggis` not `anggur` used for 12th popular fruit (anggur not in FRUITS data, manggis is)
- Hero gradient: `bg-gradient-to-br from-primary-600 to-primary-800` with decorative circles + bottom fade

### Build Notes
- Build passed first try: `✓ Compiled successfully in 12.4s` + all 8 static routes
- Home page renders as `○ (Static)` with `Revalidate: 1h` due to `next: { revalidate: 3600 }` on server fetches
- `/kota` renders as `○ (Static)` — purely SSG since CITIES is static data
- Windows ENOENT `.nft.json` warnings are pre-existing race conditions, not code errors

## [2026-02-20] Phase 10: Polish & Production Readiness

### not-found.tsx
- Replaced plain `<a>` tag with Next.js `<Link>` component from `next/link`
- Changed emoji to 🍑, improved layout: `min-h-[60vh] flex flex-col items-center justify-center`
- Indonesian copy: *"Halaman yang kamu cari tidak ada. Mungkin buah ini sedang tidak musim?"*

### next.config.ts — instrumentationHook removed in Next.js 15.5+
- **Do NOT add `experimental.instrumentationHook: true`** to next.config.ts in Next.js 15.5.12+
- The key was removed from `ExperimentalConfig` type in Next.js 15.5 — it is now built-in by default
- Adding it causes a TypeScript type error and build failure
- `instrumentation.ts` is picked up automatically with no config needed

### Error Resilience Audit — { error: string, code: number } pattern
- All 5 API routes (`prices`, `prices/latest`, `prices/map`, `predictions`, `recommendations`) now return `{ error: string, code: number }` in all error responses
- HTTP status codes: 400 for bad params, 404 for not found, 500 for server errors, 503 for degraded service
- Error messages are in Bahasa Indonesia (e.g. "Parameter fruit dan city wajib diisi")
- `groq-client.ts` and `ml-client.ts` were already production-ready — no changes needed
- `api/health/route.ts` was already production-ready — no changes needed
- Pattern: `return NextResponse.json({ error: 'Deskripsi error', code: 400 }, { status: 400 })`

### README.md
- Created monorepo root `README.md` with: badges, feature list, tech stack table, ASCII architecture diagram, data flow, Docker + manual quickstart, env vars table, API reference table (7 endpoints), data model (3 tables), ML model description, all 30 fruits table, all 10 cities table, roadmap, project structure tree
- All 30 fruits and 10 cities sourced from `packages/shared/src/fruits.ts` and `cities.ts`
- README is in English (UI remains Bahasa Indonesia)

### Final Build
- `pnpm --filter @buahmusim/web build` passes clean: `✓ Compiled successfully`, 14 routes, 0 TypeScript errors
- 14 routes: `/`, `/_not-found`, `/api/health`, `/api/predictions`, `/api/prices`, `/api/prices/latest`, `/api/prices/map`, `/api/recommendations`, `/buah`, `/buah/[fruitId]`, `/kalender`, `/kota`, `/kota/[cityId]`, `/peta`

## [2026-02-20] Phase 9: Scheduling & Auto-Refresh
- `db` variable in db.ts is module-scoped, NOT exported — jobs needing raw SQL (cache-invalidation, health route) must open their own `better-sqlite3` connection using the same DB_PATH logic
- WAL mode allows concurrent readers/writers, so separate connections work fine
- `node-cron` installed as runtime dep, `@types/node-cron` as devDep
- `instrumentation.ts` uses dynamic `await import('node-cron')` — accessing `cron.default.schedule()` (not `cron.schedule()`) because ESM dynamic import wraps the default export
- `generateDailyPrices(dateStr)` returns `number` (count of records inserted) — synchronous, no await needed
- `predictPrices(fruitId, cityId)` returns `Promise<Prediction[]>` — async, has internal retry + cache
- Health endpoint opens DB as readonly for safety; closes connection in `finally` block
- ML health check uses `AbortSignal.timeout(3000)` — 3s timeout to avoid blocking
- HTTP 207 (Multi-Status) used when any subsystem is degraded but endpoint itself works
- Cron schedules: 15:00 UTC (23:00 WIB) daily prices, 16:00 UTC (00:00 WIB) predictions, 17:00 UTC (01:00 WIB) cache invalidation
- Build passed first try with all 5 new files, zero TypeScript errors
