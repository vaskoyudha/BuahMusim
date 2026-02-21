from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging

app = FastAPI(title="BuahMusim ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.get("/health")
def health():
    return {"status": "ok", "model": "prophet", "version": "1.1.5"}


from predictor import IndonesianFruitPredictor


class HistoryPoint(BaseModel):
    ds: str
    y: float


class PredictRequest(BaseModel):
    fruit_id: str
    city_id: str
    history: List[HistoryPoint]


class BatchPredictItem(BaseModel):
    fruit_id: str
    city_id: str
    history: List[HistoryPoint]


class BatchPredictRequest(BaseModel):
    items: List[BatchPredictItem]


@app.post("/predict")
def predict(request: PredictRequest):
    if len(request.history) < 14:
        raise HTTPException(
            status_code=422,
            detail=f"Need at least 14 history points, got {len(request.history)}",
        )

    predictor = IndonesianFruitPredictor()
    history = [{"ds": h.ds, "y": h.y} for h in request.history]

    try:
        predictions = predictor.predict(request.fruit_id, request.city_id, history)
        # Determine if fallback was used (check if Prophet worked)
        model_used = "prophet"
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    from datetime import datetime, timezone

    return {
        "predictions": predictions,
        "model": model_used,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/predict/batch")
def predict_batch(request: BatchPredictRequest):
    if len(request.items) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 items per batch")

    results = []
    # Use ThreadPoolExecutor for parallel prediction
    from concurrent.futures import ThreadPoolExecutor, as_completed

    def predict_one(item):
        predictor = IndonesianFruitPredictor()
        history = [{"ds": h.ds, "y": h.y} for h in item.history]
        try:
            preds = predictor.predict(item.fruit_id, item.city_id, history)
            return {
                "fruit_id": item.fruit_id,
                "city_id": item.city_id,
                "predictions": preds,
                "model": "prophet",
            }
        except Exception as e:
            return {
                "fruit_id": item.fruit_id,
                "city_id": item.city_id,
                "predictions": [],
                "model": "error",
                "error": str(e),
            }

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {
            executor.submit(predict_one, item): item for item in request.items
        }
        for future in as_completed(futures):
            results.append(future.result())

    return {"results": results}
