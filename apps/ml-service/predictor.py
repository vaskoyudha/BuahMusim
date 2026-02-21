import pandas as pd
import numpy as np
from prophet import Prophet
from holidays_id import get_indonesian_holidays
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger(__name__)


class IndonesianFruitPredictor:

    def predict(
        self,
        fruit_id: str,
        city_id: str,
        history: list[dict],  # [{ds: "YYYY-MM-DD", y: float}]
        periods: int = 28,
    ) -> list[dict]:
        """
        Returns list of {date: str, price: float, lower: float, upper: float}
        Falls back to moving average if Prophet fails.
        """
        if len(history) < 14:
            raise ValueError(f"Need at least 14 data points, got {len(history)}")

        try:
            return self._prophet_predict(history, periods)
        except Exception as e:
            logger.warning(
                f"Prophet failed for {fruit_id}/{city_id}: {e}. Using fallback."
            )
            return self._fallback_predict(history, periods)

    def _prophet_predict(self, history: list[dict], periods: int) -> list[dict]:
        df = pd.DataFrame(history)
        df["ds"] = pd.to_datetime(df["ds"])
        df["y"] = df["y"].astype(float)

        holidays = get_indonesian_holidays()

        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            changepoint_prior_scale=0.05,
            interval_width=0.8,
            holidays=holidays,
        )

        model.fit(df)

        future = model.make_future_dataframe(periods=periods, freq="D")
        forecast = model.predict(future)

        # Only return future predictions (not historical fitted values)
        future_forecast = forecast[forecast["ds"] > df["ds"].max()].copy()

        min_price = df["y"].min() * 0.5

        results = []
        for _, row in future_forecast.iterrows():
            results.append(
                {
                    "date": row["ds"].strftime("%Y-%m-%d"),
                    "price": max(
                        round(float(row["yhat"]) / 500) * 500, min_price
                    ),
                    "lower": max(
                        round(float(row["yhat_lower"]) / 500) * 500, min_price
                    ),
                    "upper": max(
                        round(float(row["yhat_upper"]) / 500) * 500, min_price
                    ),
                }
            )

        return results[:periods]

    def _fallback_predict(self, history: list[dict], periods: int) -> list[dict]:
        """7-day moving average extrapolation with +/-15% static confidence band"""
        prices = [float(h["y"]) for h in history[-7:]]
        avg = sum(prices) / len(prices)

        # Calculate trend from last 14 days
        if len(history) >= 14:
            early_avg = sum(float(h["y"]) for h in history[-14:-7]) / 7
            trend_per_day = (avg - early_avg) / 7
        else:
            trend_per_day = 0

        last_date = pd.Timestamp(history[-1]["ds"])
        results = []

        for i in range(1, periods + 1):
            future_date = last_date + pd.Timedelta(days=i)
            predicted = avg + (trend_per_day * i)
            predicted = max(predicted, prices[-1] * 0.3)  # sanity floor

            results.append(
                {
                    "date": future_date.strftime("%Y-%m-%d"),
                    "price": round(predicted / 500) * 500,
                    "lower": round(predicted * 0.85 / 500) * 500,
                    "upper": round(predicted * 1.15 / 500) * 500,
                }
            )

        return results
