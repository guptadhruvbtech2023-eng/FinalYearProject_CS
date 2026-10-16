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

@router.get("/export-csv")
def export_anomalies_csv(
    method: str = Query("isolation_forest", pattern="^(isolation_forest|iqr|zscore)$"),
    contamination: float = Query(0.02, ge=0.001, le=0.2),
    selected_metric: Optional[str] = None
):
    from fastapi.responses import Response
    import pandas as pd
    res = anomaly_service.detect_anomalies(
        method=method,
        contamination=contamination,
        selected_metric=selected_metric
    )
    anomalies = res.get("anomalies", [])
    df_anom = pd.DataFrame(anomalies)
    csv_bytes = df_anom.to_csv(index=False).encode("utf-8-sig")
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="Flagged_Anomalies_{method}.csv"'}
    )
