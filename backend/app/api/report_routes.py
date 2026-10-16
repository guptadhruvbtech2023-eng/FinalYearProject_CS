from fastapi import APIRouter
from fastapi.responses import HTMLResponse
from typing import Optional
from backend.app.services.report_service import report_service
from backend.app.models.schemas import FilterParams

router = APIRouter(prefix="/api/report", tags=["Reports"])

@router.post("/generate")
def generate_report(filters: Optional[FilterParams] = None):
    return report_service.generate_full_report(filters)

@router.post("/export-html", response_class=HTMLResponse)
def export_report_html(filters: Optional[FilterParams] = None):
    data = report_service.generate_full_report(filters)
    return report_service.generate_html_report(data)
