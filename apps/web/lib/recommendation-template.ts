import { getFruitById, getSeasonStatus } from '@buahmusim/shared';

export interface RecommendationContext {
  fruitNameId: string;
  cityName: string;
  currentPrice: number;
  weekChangePercent: number; // positive = price went up, negative = went down
  last14Days: { date: string; price: number }[];
  predictions28: { date: string; price: number; lower: number; upper: number }[];
  seasonStatus: string; // 'peak' | 'transition' | 'normal' | 'off'
  growingRegions: string[];
  cheapestCity: string;
  cheapestCityPrice: number;
}

export interface TemplateResult {
  action: 'beli' | 'tunggu';
  explanation: string;
}

export function generateTemplateRecommendation(
  fruitId: string,
  _cityId: string,
  context: RecommendationContext
): TemplateResult {
  getFruitById(fruitId);
  const month = new Date().getMonth() + 1;
  const seasonStatus = getSeasonStatus(fruitId, month);

  const { currentPrice, weekChangePercent, predictions28, cheapestCity, cheapestCityPrice } =
    context;

  // Calculate predicted trend
  let predictedTrend = 0;
  if (predictions28.length > 0) {
    const lastPrediction = predictions28[predictions28.length - 1].price;
    predictedTrend = ((lastPrediction - currentPrice) / currentPrice) * 100;
  }

  const priceFormatted = `Rp ${currentPrice.toLocaleString('id-ID')}`;
  const cheapestFormatted = `Rp ${cheapestCityPrice.toLocaleString('id-ID')}`;

  // Rule 1: Price dropping + not yet peak season → TUNGGU
  if (weekChangePercent < -5 && seasonStatus !== 'peak') {
    return {
      action: 'tunggu',
      explanation: `Harga ${context.fruitNameId} di ${context.cityName} sedang turun ${Math.abs(weekChangePercent).toFixed(1)}% dalam 7 hari terakhir (${priceFormatted}/kg). Tren ini kemungkinan berlanjut seiring mendekati musim panen. Tunggu beberapa hari lagi untuk harga yang lebih baik.`,
    };
  }

  // Rule 2: Price spiking + deep in season → TUNGGU (will come down)
  if (weekChangePercent > 8 && seasonStatus === 'peak') {
    return {
      action: 'tunggu',
      explanation: `Harga ${context.fruitNameId} naik tajam ${weekChangePercent.toFixed(1)}% meski sedang musim panen. Ini kemungkinan lonjakan sementara. Harga biasanya kembali turun dalam musim panen — tunggu 1-2 minggu.`,
    };
  }

  // Rule 3: In peak season + price stable or slightly down → BELI
  if (seasonStatus === 'peak' && weekChangePercent <= 3) {
    return {
      action: 'beli',
      explanation: `${context.fruitNameId} sedang musim panen sehingga harga relatif terjangkau di ${priceFormatted}/kg. Harga stabil dan pasokan melimpah. Sekarang waktu terbaik untuk membeli.`,
    };
  }

  // Rule 4: Predicted to drop significantly → TUNGGU
  if (predictedTrend < -10) {
    return {
      action: 'tunggu',
      explanation: `Prediksi harga ${context.fruitNameId} menunjukkan potensi penurunan ${Math.abs(predictedTrend).toFixed(0)}% dalam 4 minggu ke depan. Dengan harga saat ini ${priceFormatted}/kg, menunggu bisa menghemat cukup signifikan.`,
    };
  }

  // Rule 5: Off season + price rising → BELI (won't get better until next season)
  if (seasonStatus === 'off' && weekChangePercent > 5) {
    return {
      action: 'beli',
      explanation: `${context.fruitNameId} sedang tidak musim dan harga terus naik (${priceFormatted}/kg, +${weekChangePercent.toFixed(1)}% 7 hari). Jika butuh sekarang, beli segera karena harga akan terus naik hingga musim panen berikutnya.`,
    };
  }

  // Rule 6: Cheaper city exists (>15% difference) → suggest alternative
  if (cheapestCityPrice < currentPrice * 0.85) {
    return {
      action: 'tunggu',
      explanation: `Harga ${context.fruitNameId} di ${context.cityName} (${priceFormatted}/kg) lebih mahal dibanding ${cheapestCity} (${cheapestFormatted}/kg). Pertimbangkan alternatif atau tunggu harga lokal turun.`,
    };
  }

  // Default: BELI (prices are reasonable)
  return {
    action: 'beli',
    explanation: `Harga ${context.fruitNameId} di ${context.cityName} saat ini ${priceFormatted}/kg, dalam kisaran normal. Tidak ada tanda-tanda kenaikan harga drastis dalam waktu dekat. Aman untuk membeli sekarang.`,
  };
}
