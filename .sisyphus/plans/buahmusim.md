# BuahMusim — Work Plan

> Indonesian Seasonal Fruit Price Prediction & Market Intelligence Platform  
> "Beli sekarang atau tunggu?" — Should I buy this fruit today, or wait?

---

## Architecture Reference

**Stack**: pnpm monorepo | Next.js 15 App Router | FastAPI + Prophet ML | SQLite + better-sqlite3 | Recharts | Leaflet + React-Leaflet | Groq LLM (llama-3.3-70b) | node-cron | Docker Compose

**Two services**: `apps/web` (Next.js, API routes, scheduler, DB) + `apps/ml-service` (Python FastAPI, Prophet)  
**Shared package**: `packages/shared` (fruit data, city data, types, constants)  
**Database**: Single SQLite file at `data/buahmusim.db`

**Key decisions**:
- Synthetic data (real gov APIs have no fruit coverage) — realistic seasonal curves from Litbang Kementan
- Lazy Prophet training (on-demand per fruit/city pair, cached 24h, pre-train top 10 via cron)
- LLM template fallback (works without GROQ_API_KEY)
- 30 fruits × 10 cities fixed set, Bahasa Indonesia only, no auth

---

## PHASE 1: Project Foundation

- [ ] **1.1** Initialize pnpm monorepo — root `package.json` (`"private":true`, scripts), `pnpm-workspace.yaml` (`apps/*`, `packages/*`), `.gitignore`, `.nvmrc` (Node 20), `tsconfig.base.json` with path aliases
- [ ] **1.2** Scaffold `packages/shared` with full TypeScript source — `fruits.ts` (all 30 FruitData objects with id, nameId, nameEn, peakMonths[], offMonths[], seasonalityType, growingRegions[], priceRange{low,high}, ramadanImpact, emoji), `cities.ts` (all 10 CityData objects with id, name, province, market, lat, lng, population, fruitSpecialties[]), `seasons.ts` (isFruitInSeason, getSeasonalMultiplier, getSeasonStatus), `types.ts` (PriceRecord, Prediction, Recommendation, MapCityData interfaces), `constants.ts` (Indonesian holiday dates: Ramadan 2025-2027, Lebaran, Idul Adha, school holidays as Date arrays), `utils.ts` (formatPrice → "Rp 25.000", formatDate Indonesian locale, getTrend), `index.ts` barrel export
- [ ] **1.3** Scaffold `apps/web` with Next.js 15 — App Router, TypeScript, Tailwind CSS. Configure `next.config.ts` to resolve `packages/shared`. Create root layout (`app/layout.tsx`) with Bahasa Indonesia lang, Inter font, mobile viewport meta. Implement responsive shell: sticky top header (desktop nav: Beranda/Peta/Buah/Kalender) + bottom tab bar (mobile only, 4 tabs with icons). Global CSS tokens in `tailwind.config.ts` (green-600 primary, fruit/earth palette).
- [ ] **1.4** Set up SQLite database — `apps/web/lib/db.ts`: open/create `data/buahmusim.db`, enable WAL mode (`PRAGMA journal_mode=WAL`), create tables `prices`, `predictions`, `recommendations` with all columns and indexes as per schema. Export typed query helpers: `insertPrice`, `getPrices`, `insertPredictions`, `getPredictions`, `upsertRecommendation`, `getRecommendation`. On module load: run `CREATE TABLE IF NOT EXISTS` for all tables.
- [ ] **1.5** Docker Compose setup — `docker-compose.yml` with services: `web` (Node 20 Alpine, port 3000, mounts `./data:/app/data`) and `ml-service` (Python 3.11 slim, port 8000). Shared named volume `buahmusim-data` for SQLite. `.env.example` with `GROQ_API_KEY`, `ML_SERVICE_URL=http://ml-service:8000`, `DATABASE_PATH=/app/data/buahmusim.db`. `apps/web/Dockerfile` (multi-stage: deps → builder → runner). `apps/ml-service/Dockerfile` (Python 3.11-slim, install requirements, expose 8000).

---

## PHASE 2: Synthetic Data Engine

- [ ] **2.1** Build synthetic price generator `apps/web/lib/data-generator.ts` — `generatePrice(fruitId, cityId, date, previousPrice?)` function that computes: (a) base price from fruit's priceRange, (b) seasonal multiplier via sinusoidal curve over peakMonths (in-season = 0.7× base, off-season = 1.3× base, lerp between), (c) Ramadan spike (+15-30% for high-impact fruits if date falls in Ramadan month), (d) weekend micro-bump (+3-5% on Sat/Sun), (e) city differential (Jakarta=1.0 base, Medan=0.95, Palembang=0.97, Bandung=1.05, Semarang=1.02, Yogyakarta=1.03, Surabaya=1.0, Malang=1.01, Makassar=1.08, Denpasar=1.10), (f) Gaussian noise ±8% (seeded by `${fruitId}-${cityId}-${date}` for reproducibility), (g) clamp result to never go below fruit's priceRange.low × 0.8. Returns integer IDR price.
- [ ] **2.2** Implement 90-day historical seeder `apps/web/lib/seeder.ts` — `seedHistoricalData()`: check if `prices` table has any rows; if empty, loop over last 90 days × 30 fruits × 10 cities, call `generatePrice` with previous day's price for continuity, bulk-insert in batches of 500 using `INSERT OR IGNORE`. Log progress. Must complete in <10s. Export `checkAndSeed()` called at app startup via Next.js instrumentation (`instrumentation.ts`).
- [ ] **2.3** Implement daily price generator — `generateDailyPrices(date: string)` in data-generator.ts: fetch yesterday's price for each fruit/city pair from DB, generate today's price with continuity, bulk-insert 300 records. Called by cron job.
- [ ] **2.4** API route `GET /api/prices` — `apps/web/app/api/prices/route.ts`: query params `fruit` (required), `city` (required), `days` (default 30, max 90). Query DB for date range. Return `{ data: [{date, price, source}], fruit, city }`. Add `Cache-Control: s-maxage=3600, stale-while-revalidate`.
- [ ] **2.5** API route `GET /api/prices/latest` — `apps/web/app/api/prices/latest/route.ts`: query param `city` OR `fruit` (one required). If `city` provided: return all 30 fruits' latest price in that city. If `fruit` provided: return all 10 cities' latest price for that fruit. Include 7-day trend calculation (today vs 7 days ago: percentage change, direction 'up'|'down'|'stable').
- [ ] **2.6** API route `GET /api/prices/map` — `apps/web/app/api/prices/map/route.ts`: query param `fruit` (required). Return `{ cities: [{id, name, lat, lng, price, trend, rank}], min, max, fruit, updatedAt }`. Rank 1 = cheapest. Used by map for color normalization.

---

## PHASE 3: ML Prediction Service

- [ ] **3.1** Scaffold `apps/ml-service` — `main.py` (FastAPI app, CORS middleware allowing localhost:3000 and *), `predictor.py` (Prophet wrapper class), `holidays_id.py` (Indonesian holidays DataFrame for Prophet), `requirements.txt` (`prophet==1.1.5 fastapi uvicorn pandas numpy`), `Dockerfile`. Health endpoint `GET /health` returns `{"status":"ok","model":"prophet","version":"1.1.5"}`.
- [ ] **3.2** Prophet prediction engine `apps/ml-service/predictor.py` — `IndonesianFruitPredictor` class: `predict(fruit_id, city_id, history: list[{ds,y}]) -> list[{ds,yhat,yhat_lower,yhat_upper}]`. Configure Prophet: `yearly_seasonality=True`, `weekly_seasonality=True`, `changepoint_prior_scale=0.05`, `interval_width=0.8`. Add custom `'ramadan'` seasonality (period=354.25, fourier_order=3). Add holidays DataFrame from `holidays_id.py` (Lebaran, Idul Adha, Natal, Tahun Baru, school holidays 2024-2027). Fit model. Make future 28-day dataframe. Return forecast with yhat clamped to >= min observed price × 0.5. Fallback: if Prophet raises exception, return 7-day moving average extrapolation for 28 days with ±15% static confidence band.
- [ ] **3.3** Prediction API endpoint `POST /predict` — request body `{fruit_id: str, city_id: str, history: [{ds: str, y: float}]}`. Validate minimum 14 history points (return 422 if fewer). Call `IndonesianFruitPredictor().predict(...)`. Return `{predictions: [{date, price, lower, upper}], model: "prophet"|"fallback", generated_at: ISO}`.
- [ ] **3.4** Batch prediction endpoint `POST /predict/batch` — request body `{items: [{fruit_id, city_id, history}]}`, max 10 items. Use `ThreadPoolExecutor(max_workers=4)` to predict in parallel. Return `{results: [{fruit_id, city_id, predictions, model}]}`.
- [ ] **3.5** ML client `apps/web/lib/ml-client.ts` — `predictPrices(fruitId, cityId): Promise<Prediction[]>`. Steps: (1) fetch last 90 days history from DB, (2) check if valid prediction exists in DB cache (generated today), (3) if cache hit → return cached, (4) if miss → call `POST ${ML_SERVICE_URL}/predict`, (5) store result in `predictions` table, (6) return. Retry logic: 3 attempts with 1s/2s/4s backoff. Timeout: 30s. If ML service unreachable: log error, return empty array.
- [ ] **3.6** API route `GET /api/predictions` — `apps/web/app/api/predictions/route.ts`: query params `fruit` and `city` (both required). Call `predictPrices()` from ml-client. Return `{predictions: [{date, price, lower, upper}], model, generatedAt}`.
- [ ] **3.7** Scheduled prediction pre-warming — in scheduler: at 00:00 UTC, call batch predict for top 10 fruit/city combos: [durian/jakarta, mangga/surabaya, jeruk/jakarta, pisang/jakarta, rambutan/medan, semangka/bandung, alpukat/malang, pepaya/jakarta, salak/yogyakarta, manggis/jakarta]. Store in predictions cache.

---

## PHASE 4: Interactive Map

- [ ] **4.1** Install and configure Leaflet — `pnpm add react-leaflet leaflet @types/leaflet`. In `apps/web/app/peta/page.tsx`: use `dynamic(() => import('@/components/map/IndonesiaMap'), {ssr: false})`. Import leaflet CSS in component file (not global). Configure default marker icon fix for Next.js (override `L.Icon.Default.prototype._getIconUrl`).
- [ ] **4.2** Build `IndonesiaMap` component `apps/web/components/map/IndonesiaMap.tsx` — `MapContainer` centered `[-2.5, 118]` zoom 5, min 4 max 8. `TileLayer` with OSM `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`. For each city: `CircleMarker` with radius 14-22 (based on population rank), fillColor from price color scale (green→yellow→red using linear interpolation of hex), fillOpacity 0.85. `Tooltip` (permanent=false): "{city} — Rp {price}/kg". `Popup`: city name bold, market name, price, trend arrow + percentage, "Termurah!" badge if rank===1, link to `/kota/{cityId}`. Props: `fruitId`, `citiesData` (from API).
- [ ] **4.3** Fruit selector + map page `apps/web/app/peta/page.tsx` — Horizontal scrollable pill selector of all 30 fruits with emoji (default: durian). On select: fetch `/api/prices/map?fruit={id}`, update map data. Show loading skeleton over map during fetch. "Terakhir diperbarui" timestamp below map.
- [ ] **4.4** Map legend component `apps/web/components/map/MapLegend.tsx` — positioned bottom-right of map (Leaflet control). Color gradient bar from green to red. Labels: "Murah" left, "Mahal" right. Shows selected fruit name + "/kg". Uses absolute positioning within map container.
- [ ] **4.5** Embed map on home page — import dynamic IndonesiaMap into `app/page.tsx` section "Peta Harga Hari Ini". Height 400px on desktop, 280px on mobile. Fruit selector above it (default: mangga for home page).

---

## PHASE 5: Price Charts

- [ ] **5.1** Build `PriceChart` component `apps/web/components/charts/PriceChart.tsx` — `pnpm add recharts`. `ResponsiveContainer` full width, height 320. `ComposedChart` with: (a) `<Area dataKey="lower" fill="transparent" stroke="none"/>` + `<Area dataKey="upper" fill="#a855f7" fillOpacity={0.15} stroke="none"/>` for confidence band, (b) `<Line dataKey="historicalPrice" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls/>` for history, (c) `<Line dataKey="predictedPrice" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls/>` for prediction, (d) `<ReferenceLine x={todayStr} stroke="#6b7280" strokeDasharray="3 3" label={{value:"Hari ini",position:"top"}}/>`. XAxis: date strings, tickFormatter to Indonesian short date. YAxis: tickFormatter `(v) => "Rp "+v.toLocaleString('id-ID')`. Custom `<Tooltip>` showing date, price type, value formatted. Props: `history: {date,price}[]`, `predictions: {date,price,lower,upper}[]`.
- [ ] **5.2** Price statistics panel `apps/web/components/charts/PriceStats.tsx` — 4-stat grid: (1) "Harga Sekarang" with large price + source badge, (2) "Perubahan 7 Hari" with colored ↑↓ arrow + percentage, (3) "Rentang 30 Hari" high/low bar, (4) "Prediksi 4 Minggu" predicted price + direction badge "Naik"/"Turun"/"Stabil". Mobile: 2×2 grid. Desktop: 4-column row.
- [ ] **5.3** Fruit detail page `apps/web/app/buah/[fruitId]/page.tsx` — Server component for metadata (title: "{FruitName} — BuahMusim"). Client components: fruit header (emoji large, nameId H1, nameEn subtitle, seasonality badge "🟢 Musim Panen"/"🔴 Tidak Musim"/"🟡 Transisi"), city tab selector (10 tabs, default Jakarta, URL param `?kota=jakarta`), async data fetching for prices+predictions, `<PriceChart>`, `<PriceStats>`, `<RecommendationCard>` (Phase 6), seasonal info card ("Daerah penghasil: {regions}" + current season description).
- [ ] **5.4** City detail page `apps/web/app/kota/[cityId]/page.tsx` — Header: city name, province, market name, population. Grid of 30 fruit cards: each shows emoji, fruit name, current price formatted, 7-day trend arrow+%, season badge. Sort controls: "Harga Terendah", "Penurunan Terbesar", "A-Z". Click card → navigate to `/buah/{fruitId}?kota={cityId}`.

---

## PHASE 6: LLM Recommendations

- [ ] **6.1** Groq client `apps/web/lib/groq-client.ts` — `pnpm add groq-sdk`. Export `generateRecommendation(fruitId, cityId, context: RecommendationContext): Promise<{action:'beli'|'tunggu', explanation: string}>`. If `!process.env.GROQ_API_KEY`: call template fallback. Else: call Groq with model `llama-3.3-70b-versatile`, max_tokens=400, temperature=0.3. Parse response to extract REKOMENDASI: BELI or TUNGGU and explanation text. Retry 3× with backoff on rate limit (429).
- [ ] **6.2** Recommendation prompt — System: "Kamu adalah analis pasar buah Indonesia yang berpengalaman. Tugasmu adalah memberikan rekomendasi singkat apakah konsumen sebaiknya membeli buah ini sekarang atau menunggu harga lebih murah. Gunakan data harga aktual yang diberikan. Jawab dalam Bahasa Indonesia yang natural, singkat, dan mudah dipahami. Format jawaban: baris pertama 'REKOMENDASI: BELI' atau 'REKOMENDASI: TUNGGU', lalu satu baris kosong, lalu 2-3 kalimat penjelasan." User prompt: inject fruitName, cityName, currentPrice formatted, 7-day change %, last 14 days prices table, next 28-day predictions summary (direction + magnitude), season status (musim/tidak musim), growing regions, upcoming holidays if relevant, cheapest city comparison.
- [ ] **6.3** Template fallback `apps/web/lib/recommendation-template.ts` — `generateTemplateRecommendation(fruitId, cityId, context)`: compute trend (last 7 days slope), days until peak season, Ramadan proximity. Rules: IF trend<-5% AND daysUntilPeak>14 → TUNGGU + explain price dropping + peak approaching. IF trend>+8% AND daysIntoPeak>7 → TUNGGU + explain high season prices will drop. IF inPeakSeason AND trend<+3% → BELI + explain currently cheapest. ELSE → neutral. Always include actual price in Rp and % change in explanation text.
- [ ] **6.4** Recommendation API `GET /api/recommendations` — `apps/web/app/api/recommendations/route.ts`: params `fruit`, `city`. Check DB cache (valid if `expires_at > now()`). If hit: return cached. If miss: fetch last 14 days prices + 28-day predictions, build context, call `generateRecommendation()`, store in DB with `expires_at = now() + 24h`, return. Response: `{action, explanation, generatedAt, expiresAt, source:'llm'|'template'|'cache'}`.
- [ ] **6.5** Recommendation card `apps/web/components/recommendations/RecommendationCard.tsx` — Large action badge: green card with "✅ BELI SEKARANG" or red card with "⏳ TUNGGU DULU". Explanation paragraph below, 14px Indonesian text. Source indicator: "Analisis AI" or "Analisis Otomatis". Timestamp "Diperbarui {date}". Skeleton loader (3 lines) while fetching. Error state: "Rekomendasi tidak tersedia saat ini."

---

## PHASE 7: Seasonal Calendar

- [ ] **7.1** Build `SeasonalCalendar` component `apps/web/components/calendar/SeasonalCalendar.tsx` — CSS Grid: 31 columns (1 sticky fruit name col + 12 month cols + right padding) × 31 rows (1 header + 30 fruit rows). Cell color function: `getPeak` → dark green `#16a34a`, `getTransition` → `#86efac`, `getNormal` → `#dcfce7`, `getOff` → `#e5e7eb`. Each cell: 28×28px minimum, rounded corners. Mobile: `overflow-x: auto` on container, fruit name col `position: sticky; left: 0; z-index: 10; background: white`. Month headers in Indonesian abbreviated names. Row headers: `{fruit.emoji} {fruit.nameId}`.
- [ ] **7.2** Seasonal detail overlay `apps/web/components/calendar/SeasonCell.tsx` — Each cell is a button. On click: set selected state `{fruitId, month}`. Show detail panel below grid (not popup, avoids mobile issues): fruit name + month name, season status in Indonesian with icon, growing regions list, typical price range for that month formatted in Rp. Highlight selected cell with ring border.
- [ ] **7.3** Current month highlighting — In SeasonalCalendar: current month column gets `bg-yellow-50 ring-2 ring-yellow-400` header cell + subtle column tint. "Bulan Ini" label above column header. Fruits in peak season in current month show small "🔥" indicator in their name cell.
- [ ] **7.4** Calendar page `apps/web/app/kalender/page.tsx` — Page title "Kalender Musim Buah Indonesia". Toggle filter: "Semua Buah" / "Hanya Buah Musiman". Sort toggle: "Urut A-Z" / "Urut Mulai Musim". Full `<SeasonalCalendar>` component. Explanation text below: "Warna hijau tua = panen raya (harga murah). Abu-abu = tidak musim (harga mahal). Klik sel untuk detail."
- [ ] **7.5** "Lagi Musim Sekarang" home page section — In `app/page.tsx`: compute current in-season fruits (peakMonths includes current month). Render horizontal scroll row of fruit cards: emoji large, name, "🟢 Musim Panen", cheapest city today + price. Link to `/buah/{fruitId}`. If no fruits in peak season: show "Transisi musim — harga sedang berubah" message.

---

## PHASE 8: Home Page & Navigation

- [ ] **8.1** Complete home page `apps/web/app/page.tsx` — Sections in order: (1) Hero: BuahMusim logo/wordmark, tagline "Prediksi Harga Buah Indonesia — Beli sekarang atau tunggu?", search bar to find a fruit. (2) "Sedang Musim Panen" horizontal card scroll (Phase 7.5). (3) "Peta Harga Hari Ini" with embedded map + fruit selector (Phase 4.5). (4) "Buah Populer" 3×4 grid of top 12 fruits with current price + trend badge. (5) "Kota Termurah Hari Ini" — table or card showing for each of top 5 fruits which city is cheapest today. All sections use consistent card styling, shadows, rounded corners.
- [ ] **8.2** Navigation components — `apps/web/components/layout/Header.tsx`: Logo left, nav links center (hidden on mobile), desktop only. `apps/web/components/layout/BottomNav.tsx`: fixed bottom, 4 tabs with icons (🏠/🗺/🍎/📅), highlight active tab based on current pathname, height 64px, safe-area-inset-bottom padding. Both components use `usePathname()` for active state.
- [ ] **8.3** Fruit list page `apps/web/app/buah/page.tsx` — H1 "Semua Buah". Search input (client-side filter by nameId/nameEn). Filter pills: "Semua", "Musim Sekarang", "Tidak Musim". Sort select: "A-Z", "Harga Terendah". Grid of 30 `<FruitCard>` components: emoji, nameId, nameEn small, season badge, current price range (cheapest city today). Each links to `/buah/{fruitId}`.
- [ ] **8.4** City list page `apps/web/app/kota/page.tsx` — H1 "10 Kota Pasar Utama". Grid of 10 `<CityCard>` components: city name, province, market name, 3 cheapest fruits today with prices. Each links to `/kota/{cityId}`.
- [ ] **8.5** SEO metadata — In each page/layout: `export const metadata: Metadata = { title, description, openGraph: {...}, alternates: { canonical } }`. Root layout: site name "BuahMusim — Prediksi Harga Buah Indonesia", description in Bahasa Indonesia. Per-fruit page: "{FruitName} — Harga & Prediksi di 10 Kota Indonesia". Per-city page: "Harga Buah di {CityName} — Pasar {MarketName}".
- [ ] **8.6** Loading states & error handling — `apps/web/app/error.tsx` global error boundary: Indonesian friendly message "Terjadi kesalahan. Silakan coba lagi." + retry button. `apps/web/app/loading.tsx`: skeleton grid. Per-component `<Skeleton>` component: animated gray pulse bars. Empty states: "Tidak ada data tersedia" with fruit emoji illustration. `apps/web/components/ui/ErrorBoundary.tsx` client component wrapper.

---

## PHASE 9: Scheduling & Auto-Refresh

- [ ] **9.1** Cron scheduler `apps/web/instrumentation.ts` — Use Next.js `register()` hook (runs once on server start). Import and init node-cron (`pnpm add node-cron @types/node-cron`). Only run in `process.env.NEXT_RUNTIME === 'nodejs'`. Schedule 3 jobs: `cron.schedule('0 23 * * *', dailyPricesJob)`, `cron.schedule('0 0 * * *', predictionRefreshJob)`, `cron.schedule('0 1 * * *', cacheInvalidationJob)`. Log job registrations on startup. Also call `checkAndSeed()` on startup (from seeder.ts).
- [ ] **9.2** Daily price generation job — `apps/web/lib/jobs/daily-prices.ts`: `dailyPricesJob()`: call `generateDailyPrices(today)`, log count of records inserted, log any errors. Wrap in try-catch so cron never crashes.
- [ ] **9.3** Prediction refresh job — `apps/web/lib/jobs/prediction-refresh.ts`: `predictionRefreshJob()`: array of 10 top combos. For each: fetch last 90 days history, call ML service `/predict`, store in predictions table. Use sequential execution (not parallel) to avoid overwhelming ML service.
- [ ] **9.4** Cache invalidation job — `apps/web/lib/jobs/cache-invalidation.ts`: `cacheInvalidationJob()`: DELETE from recommendations WHERE expires_at < datetime('now'). Log count deleted.
- [ ] **9.5** Health API `GET /api/health` — `apps/web/app/api/health/route.ts`: Check: (1) DB query `SELECT COUNT(*) FROM prices` succeeds, (2) fetch `${ML_SERVICE_URL}/health` with 3s timeout, (3) latest price record timestamp. Return `{status:'ok'|'degraded', db:{status,priceCount}, ml:{status,version}, lastPriceUpdate, timestamp}`.

---

## PHASE 10: Polish & Production Readiness

- [ ] **10.1** UI/UX polish — Define Tailwind theme in `tailwind.config.ts`: primary green-600, secondary purple-600, earth tones. Apply consistent card styles (white bg, shadow-sm, rounded-xl, p-4). Add `framer-motion` or CSS transitions for page mount animations. Ensure all text is properly Indonesian (no English UI strings leak through). Typography: Inter variable font, proper line-height for Indonesian text. Dark mode: `class` strategy, toggle button in header.
- [ ] **10.2** Performance — Add `export const dynamic = 'force-dynamic'` only where needed. Use `next/dynamic` for heavy components (Map, Charts). Add `revalidate` to static-friendly pages. Run `next build` and check bundle size output — if Leaflet chunk >200KB, verify tree-shaking. Add `<meta name="viewport" content="width=device-width, initial-scale=1">` (already in Next.js defaults).
- [ ] **10.3** Error resilience — Wrap all external calls (ML service, Groq) in try-catch with typed errors. API routes: return consistent `{error: string, code: number}` on failure with appropriate HTTP status. If ML service down: predictions API returns `{predictions:[], model:'unavailable', error:'Layanan prediksi sedang tidak tersedia'}`. All error states shown in UI with Indonesian messages.
- [ ] **10.4** README.md — Complete documentation: project banner/screenshots, "Tentang BuahMusim" description, architecture diagram (ASCII or mermaid), tech stack table with why-chosen column, quickstart (`docker compose up --build`), manual setup (pnpm install, env vars, python venv), all env vars explained, API endpoints table, data model, ML model explanation, screenshot placeholders, future roadmap section.
- [ ] **10.5** Final integration test — Run `docker compose up --build`. Verify: (1) web starts on :3000, (2) ml-service starts on :8000, (3) `/api/health` returns all-green, (4) home page loads with data (seed ran), (5) map shows 10 markers, (6) fruit detail page shows chart + recommendation, (7) seasonal calendar renders all 30×12 cells, (8) mobile layout correct at 375px. Fix any issues found.

---

## Scope Lock

**IN**: 30 fruits, 10 cities, synthetic data, Prophet predictions, Leaflet map, Groq LLM, seasonal calendar, Docker Compose, README  
**OUT**: real web scraping, user auth, push notifications, >10 cities, >30 fruits, English UI, admin dashboard, WebSockets
