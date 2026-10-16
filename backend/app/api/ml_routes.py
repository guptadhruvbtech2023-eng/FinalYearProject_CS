from fastapi import APIRouter
from backend.app.services.ml_service import ml_service
from backend.app.models.schemas import TrainRequest, PredictRequest

router = APIRouter(prefix="/api/ml", tags=["Machine Learning"])

@router.post("/train")
def train_models(req: TrainRequest):
    return ml_service.train_models(
        target_variable=req.target_variable,
        model_types=req.model_types,
        test_size=req.test_size
    )

@router.post("/predict")
def predict(req: PredictRequest):
    return ml_service.predict(
        target_variable=req.target_variable,
        features=req.features
    )

@router.get("/metrics")
def get_metrics():
    return {
        "status": "success",
        "models": ml_service.model_metrics
    }
