from fastapi import APIRouter, Query
from typing import Optional
from backend.app.services.anomaly_service import anomaly_service

router = APIRouter(prefix="/api/anomaly", tags=["Anomaly Detection"])

@router.post("/detect")
def detect_anomalies(
    method: str = Query("isolation_forest", pattern="^(isolation_forest|iqr|zscore)$"),
    contamination: float = Query(0.02, ge=0.001, le=0.2),
    selected_metric: Optional[str] = None
):
    return anomaly_service.detect_anomalies(
        method=method,
        contamination=contamination,
        selected_metric=selected_metric
    )
