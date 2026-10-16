from fastapi import APIRouter, Query
from typing import Optional
from backend.app.services.analytics_service import analytics_service
from backend.app.models.schemas import FilterParams, EDAAnalysisRequest

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.post("/kpis")
def get_kpis(filters: Optional[FilterParams] = None):
    return analytics_service.get_kpis(filters)

@router.post("/sales")
def get_sales_analytics(filters: Optional[FilterParams] = None, interval: str = Query("monthly")):
    return analytics_service.get_sales_analytics(filters, interval=interval)

@router.post("/profit")
def get_profit_analytics(filters: Optional[FilterParams] = None):
    return analytics_service.get_profit_analytics(filters)

@router.post("/customers")
def get_customer_analytics(filters: Optional[FilterParams] = None):
    return analytics_service.get_customer_analytics(filters)

@router.post("/products")
def get_product_analytics(filters: Optional[FilterParams] = None):
    return analytics_service.get_product_analytics(filters)

@router.post("/regions")
def get_regional_analytics(filters: Optional[FilterParams] = None):
    return analytics_service.get_regional_analytics(filters)

@router.get("/correlation")
def get_correlation_matrix():
    return analytics_service.get_correlation_matrix()

@router.post("/eda")
def get_eda_analysis(req: EDAAnalysisRequest):
    return analytics_service.get_eda_data(
        x_col=req.x_col,
        y_col=req.y_col,
        chart_type=req.chart_type
    )
