import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { PriceRecord, Prediction, PredictionCache, Recommendation } from '@buahmusim/shared';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'buahmusim.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for concurrent access
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fruit_id TEXT NOT NULL,
    city_id TEXT NOT NULL,
    date TEXT NOT NULL,
    price INTEGER NOT NULL,
    source TEXT NOT NULL DEFAULT 'synthetic',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(fruit_id, city_id, date)
  );
  CREATE INDEX IF NOT EXISTS idx_prices_fruit_city_date ON prices(fruit_id, city_id, date);
  CREATE INDEX IF NOT EXISTS idx_prices_date ON prices(date);

  CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fruit_id TEXT NOT NULL,
    city_id TEXT NOT NULL,
    predictions_json TEXT NOT NULL,
    model TEXT NOT NULL,
    generated_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    UNIQUE(fruit_id, city_id)
  );

  CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fruit_id TEXT NOT NULL,
    city_id TEXT NOT NULL,
    action TEXT NOT NULL,
    explanation TEXT NOT NULL,
    source TEXT NOT NULL,
    generated_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    UNIQUE(fruit_id, city_id)
  );
`);

// Prepared statements
const stmtInsertPrice = db.prepare(`
  INSERT OR IGNORE INTO prices (fruit_id, city_id, date, price, source)
  VALUES (@fruitId, @cityId, @date, @price, @source)
`);

const stmtGetPrices = db.prepare(`
  SELECT id, fruit_id AS fruitId, city_id AS cityId, date, price, source, created_at AS createdAt
  FROM prices
  WHERE fruit_id = ? AND city_id = ?
  ORDER BY date DESC
  LIMIT ?
`);

const stmtGetLatestPrice = db.prepare(`
  SELECT id, fruit_id AS fruitId, city_id AS cityId, date, price, source, created_at AS createdAt
  FROM prices
  WHERE fruit_id = ? AND city_id = ?
  ORDER BY date DESC
  LIMIT 1
`);

const stmtGetPricesForCity = db.prepare(`
  SELECT p.fruit_id AS fruitId, p.price, p.date
  FROM prices p
  INNER JOIN (
    SELECT fruit_id, MAX(date) AS max_date
    FROM prices
    WHERE city_id = ?
    GROUP BY fruit_id
  ) latest ON p.fruit_id = latest.fruit_id AND p.date = latest.max_date
  WHERE p.city_id = ?
`);

const stmtGetPricesForFruit = db.prepare(`
  SELECT p.city_id AS cityId, p.price, p.date
  FROM prices p
  INNER JOIN (
    SELECT city_id, MAX(date) AS max_date
    FROM prices
    WHERE fruit_id = ?
    GROUP BY city_id
  ) latest ON p.city_id = latest.city_id AND p.date = latest.max_date
  WHERE p.fruit_id = ?
`);

const stmtInsertPredictions = db.prepare(`
  INSERT OR REPLACE INTO predictions (fruit_id, city_id, predictions_json, model, expires_at)
  VALUES (?, ?, ?, ?, ?)
`);

const stmtGetPredictions = db.prepare(`
  SELECT id, fruit_id AS fruitId, city_id AS cityId, predictions_json, model,
         generated_at AS generatedAt, expires_at AS expiresAt
  FROM predictions
  WHERE fruit_id = ? AND city_id = ?
`);

const stmtUpsertRecommendation = db.prepare(`
  INSERT OR REPLACE INTO recommendations (fruit_id, city_id, action, explanation, source, expires_at)
  VALUES (@fruitId, @cityId, @action, @explanation, @source, @expiresAt)
`);

const stmtGetRecommendation = db.prepare(`
  SELECT id, fruit_id AS fruitId, city_id AS cityId, action, explanation, source,
         generated_at AS generatedAt, expires_at AS expiresAt
  FROM recommendations
  WHERE fruit_id = ? AND city_id = ?
`);

const stmtGetPriceCount = db.prepare(`
  SELECT COUNT(*) AS count FROM prices
`);

// Exported query helpers

export function insertPrice(record: PriceRecord): void {
  stmtInsertPrice.run({
    fruitId: record.fruitId,
    cityId: record.cityId,
    date: record.date,
    price: record.price,
    source: record.source,
  });
}

export function getPrices(fruitId: string, cityId: string, days: number): PriceRecord[] {
  return stmtGetPrices.all(fruitId, cityId, days) as PriceRecord[];
}

export function getLatestPrice(fruitId: string, cityId: string): PriceRecord | null {
  return (stmtGetLatestPrice.get(fruitId, cityId) as PriceRecord) ?? null;
}

export function getPricesForCity(cityId: string): { fruitId: string; price: number; date: string }[] {
  return stmtGetPricesForCity.all(cityId, cityId) as { fruitId: string; price: number; date: string }[];
}

export function getPricesForFruit(fruitId: string): { cityId: string; price: number; date: string }[] {
  return stmtGetPricesForFruit.all(fruitId, fruitId) as { cityId: string; price: number; date: string }[];
}

export function insertPredictions(
  fruitId: string,
  cityId: string,
  predictions: Prediction[],
  model: string
): void {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  stmtInsertPredictions.run(fruitId, cityId, JSON.stringify(predictions), model, expiresAt);
}

export function getPredictions(fruitId: string, cityId: string): PredictionCache | null {
  const row = stmtGetPredictions.get(fruitId, cityId) as
    | (Omit<PredictionCache, 'predictions'> & { predictions_json: string })
    | undefined;

  if (!row) return null;

  return {
    id: row.id,
    fruitId: row.fruitId,
    cityId: row.cityId,
    predictions: JSON.parse(row.predictions_json) as Prediction[],
    model: row.model as PredictionCache['model'],
    generatedAt: row.generatedAt,
    expiresAt: row.expiresAt,
  };
}

export function upsertRecommendation(rec: Recommendation): void {
  stmtUpsertRecommendation.run({
    fruitId: rec.fruitId,
    cityId: rec.cityId,
    action: rec.action,
    explanation: rec.explanation,
    source: rec.source,
    expiresAt: rec.expiresAt,
  });
}

export function getRecommendation(fruitId: string, cityId: string): Recommendation | null {
  return (stmtGetRecommendation.get(fruitId, cityId) as Recommendation) ?? null;
}

export function getPriceCount(): number {
  const row = stmtGetPriceCount.get() as { count: number };
  return row.count;
}

export function insertPriceBatch(records: PriceRecord[]): void {
  const insertMany = db.transaction((recs: PriceRecord[]) => {
    for (const rec of recs) {
      stmtInsertPrice.run({
        fruitId: rec.fruitId,
        cityId: rec.cityId,
        date: rec.date,
        price: rec.price,
        source: rec.source,
      });
    }
  });
  insertMany(records);
}
