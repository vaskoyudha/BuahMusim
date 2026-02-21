import Database from 'better-sqlite3';
import path from 'path';

export async function cacheInvalidationJob(): Promise<void> {
  try {
    const dbPath =
      process.env.DATABASE_PATH ||
      path.join(process.cwd(), 'data', 'buahmusim.db');
    const db = new Database(dbPath, { readonly: false });
    db.pragma('journal_mode = WAL');

    try {
      const result = db.prepare(
        "DELETE FROM recommendations WHERE expires_at < datetime('now')"
      ).run();
      console.log(
        `[cache-invalidation] Deleted ${result.changes} expired recommendations`
      );
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('[cache-invalidation] Job failed:', error);
  }
}
