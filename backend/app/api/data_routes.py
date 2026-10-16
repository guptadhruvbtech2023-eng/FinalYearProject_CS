from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional
from backend.app.services.data_service import data_service
from backend.app.services.cleaning_service import cleaning_service
from backend.app.models.schemas import CleanRequest, OutlierDetectRequest

router = APIRouter(prefix="/api/data", tags=["Data"])

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV file.")
    try:
        content = await file.read()
        profile = data_service.load_from_bytes(content, file.filename)
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {str(e)}")

@router.get("/profile")
def get_dataset_profile():
    profile = data_service.get_profile()
    if profile.get("status") == "empty":
        raise HTTPException(status_code=404, detail="No dataset loaded. Please upload a dataset.")
    return profile

@router.get("/cleaning-summary")
def get_cleaning_summary():
    return cleaning_service.get_cleaning_summary()

@router.post("/outliers/inspect")
def inspect_outliers(req: OutlierDetectRequest):
    return cleaning_service.inspect_outliers(
        column=req.column,
        method=req.method,
        threshold=req.threshold
    )

@router.post("/clean")
def clean_dataset(req: CleanRequest):
    return cleaning_service.apply_cleaning(
        missing_treatment=req.missing_treatment,
        drop_duplicates=req.drop_duplicates,
        type_conversions=req.type_conversions,
        outlier_treatment=req.outlier_treatment,
        outlier_method=req.outlier_method
    )

@router.post("/reset-demo")
def reset_to_demo():
    data_service.initialize()
    return data_service.get_profile()
