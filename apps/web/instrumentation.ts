export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 1) Seed database on startup (auto-populates 90 days history if empty)
    const { checkAndSeed } = await import('./lib/seeder');
    await checkAndSeed();

    // 2) Register cron jobs
    const cron = await import('node-cron');
    const { dailyPricesJob } = await import('./lib/jobs/daily-prices');
    const { predictionRefreshJob } = await import(
      './lib/jobs/prediction-refresh'
    );
    const { cacheInvalidationJob } = await import(
      './lib/jobs/cache-invalidation'
    );

    // 23:00 WIB (15:00 UTC) — generate today's prices
    cron.default.schedule('0 15 * * *', () => {
      void dailyPricesJob();
    });
    // 00:00 WIB (16:00 UTC) — refresh predictions for top 10 combos
    cron.default.schedule('0 16 * * *', () => {
      void predictionRefreshJob();
    });
    // 01:00 WIB (17:00 UTC) — purge expired recommendation cache
    cron.default.schedule('0 17 * * *', () => {
      void cacheInvalidationJob();
    });

    console.log('[BuahMusim] Startup: seeded + 3 cron jobs registered');
  }
}
