import Groq from 'groq-sdk';
import {
  generateTemplateRecommendation,
  type RecommendationContext,
} from './recommendation-template';

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

export interface RecommendationResult {
  action: 'beli' | 'tunggu';
  explanation: string;
  source: 'llm' | 'template';
}

export async function generateRecommendation(
  fruitId: string,
  cityId: string,
  context: RecommendationContext
): Promise<RecommendationResult> {
  if (!groq) {
    // No API key — use template
    const result = generateTemplateRecommendation(fruitId, cityId, context);
    return { ...result, source: 'template' };
  }

  try {
    const prompt = buildPrompt(fruitId, cityId, context);

    const completion = await groqCallWithRetry(prompt);
    const text = completion.choices[0]?.message?.content ?? '';

    // Parse the response
    const action = text.toUpperCase().includes('REKOMENDASI: BELI') ? 'beli' : 'tunggu';
    const lines = text.split('\n').filter((l) => l.trim());
    const explanationLines = lines.filter((l) => !l.startsWith('REKOMENDASI:'));
    const explanation = explanationLines.join(' ').trim() || text;

    return { action, explanation, source: 'llm' };
  } catch (error) {
    console.error('[Groq] API error, falling back to template:', error);
    const result = generateTemplateRecommendation(fruitId, cityId, context);
    return { ...result, source: 'template' };
  }
}

async function groqCallWithRetry(
  prompt: string,
  maxRetries = 3
): Promise<Groq.Chat.ChatCompletion> {
  const delays = [1000, 2000, 4000];

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await groq!.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        max_tokens: 400,
        temperature: 0.3,
      });
    } catch (error: unknown) {
      const isRateLimit = (error as { status?: number })?.status === 429;
      if (isRateLimit && i < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delays[i]));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

const SYSTEM_PROMPT = `Kamu adalah analis pasar buah Indonesia yang berpengalaman. Tugasmu adalah memberikan rekomendasi singkat apakah konsumen sebaiknya membeli buah ini sekarang atau menunggu harga lebih murah. Gunakan data harga aktual yang diberikan. Jawab dalam Bahasa Indonesia yang natural, singkat, dan mudah dipahami. Format jawaban: baris pertama 'REKOMENDASI: BELI' atau 'REKOMENDASI: TUNGGU', lalu satu baris kosong, lalu 2-3 kalimat penjelasan.`;

function buildPrompt(
  _fruitId: string,
  _cityId: string,
  context: RecommendationContext
): string {
  const {
    fruitNameId,
    cityName,
    currentPrice,
    weekChangePercent,
    last14Days,
    predictions28,
    seasonStatus,
    growingRegions,
    cheapestCity,
    cheapestCityPrice,
  } = context;

  const historyTable = last14Days
    .map((d) => `${d.date}: Rp ${d.price.toLocaleString('id-ID')}`)
    .join('\n');
  const predSummary =
    predictions28.length > 0
      ? `Prediksi 4 minggu ke depan: ${predictions28[0].price.toLocaleString('id-ID')} → ${predictions28[predictions28.length - 1].price.toLocaleString('id-ID')} IDR`
      : 'Prediksi tidak tersedia';

  return `Buah: ${fruitNameId} di ${cityName}
Harga saat ini: Rp ${currentPrice.toLocaleString('id-ID')}/kg
Perubahan 7 hari: ${weekChangePercent > 0 ? '+' : ''}${weekChangePercent.toFixed(1)}%
Status musim: ${seasonStatus}
Daerah penghasil: ${growingRegions.join(', ')}

Harga 14 hari terakhir:
${historyTable}

${predSummary}

Kota termurah hari ini: ${cheapestCity} (Rp ${cheapestCityPrice.toLocaleString('id-ID')}/kg)

Berikan rekomendasi BELI atau TUNGGU.`;
}
