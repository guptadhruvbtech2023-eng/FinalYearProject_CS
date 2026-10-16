from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import Response, StreamingResponse
from typing import Optional
from backend.app.services.data_service import data_service
from backend.app.services.cleaning_service import cleaning_service
from backend.app.services.export_service import export_service
from backend.app.models.schemas import CleanRequest, CleanPreviewRequest, OutlierDetectRequest

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

@router.get("/cleaning/history")
def get_cleaning_history(limit: int = 100, column: Optional[str] = None):
    return cleaning_service.get_audit_history(limit=limit, column=column)

@router.post("/cleaning/preview")
def preview_cleaning(req: CleanPreviewRequest):
    return cleaning_service.preview_cleaning(
        missing_treatment=req.missing_treatment,
        drop_duplicates=req.drop_duplicates,
        type_conversions=req.type_conversions,
        outlier_treatment=req.outlier_treatment,
        outlier_method=req.outlier_method
    )

@router.post("/cleaning/undo")
def undo_cleaning():
    return cleaning_service.undo_last_operation()

@router.post("/cleaning/reset")
def reset_cleaning():
    return cleaning_service.reset_to_original()

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
        outlier_method=req.outlier_method,
        trim_whitespace=req.trim_whitespace
    )

@router.get("/export/csv")
def export_csv():
    buf, filename = export_service.export_cleaned_csv()
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/export/excel")
def export_excel():
    buf, filename = export_service.export_cleaned_excel()
    return Response(
        content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/export/cleaned-pdf")
def export_cleaned_pdf(max_rows: int = 400):
    buf, filename = export_service.export_cleaned_dataset_pdf(max_rows=max_rows)
    return Response(
        content=buf.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/export/cleaning-report-pdf")
def export_cleaning_report_pdf():
    buf, filename = export_service.export_cleaning_report_pdf()
    return Response(
        content=buf.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.post("/reset-demo")
def reset_to_demo():
    data_service.initialize()
    return data_service.get_profile()

