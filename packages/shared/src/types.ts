export interface PriceRecord {
  id?: number;
  fruitId: string;
  cityId: string;
  date: string;
  price: number;
  source: 'synthetic' | 'scraped';
  createdAt?: string;
}

export interface Prediction {
  date: string;
  price: number;
  lower: number;
  upper: number;
}

export interface PredictionCache {
  id?: number;
  fruitId: string;
  cityId: string;
  predictions: Prediction[];
  model: 'prophet' | 'fallback' | 'unavailable';
  generatedAt: string;
  expiresAt: string;
}

export interface Recommendation {
  id?: number;
  fruitId: string;
  cityId: string;
  action: 'beli' | 'tunggu';
  explanation: string;
  source: 'llm' | 'template' | 'cache';
  generatedAt: string;
  expiresAt: string;
}

export interface MapCityData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  price: number;
  trend: number;
  rank: number;
}
