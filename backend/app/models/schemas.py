from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field

class FilterParams(BaseModel):
    year: Optional[List[Union[int, str]]] = None
    region: Optional[List[str]] = None
    state: Optional[List[str]] = None
    category: Optional[List[str]] = None
    sub_category: Optional[List[str]] = None
    segment: Optional[List[str]] = None
    ship_mode: Optional[List[str]] = None

class CleanRequest(BaseModel):
    missing_treatment: Optional[Dict[str, str]] = None  # {col_name: "drop"|"mean"|"median"|"mode"|"ffill"}
    drop_duplicates: bool = False
    type_conversions: Optional[Dict[str, str]] = None   # {col_name: "numeric"|"string"|"datetime"}
    outlier_treatment: Optional[Dict[str, str]] = None  # {col_name: "cap"|"remove"}
    outlier_method: str = "iqr"                         # "iqr" | "zscore"

class OutlierDetectRequest(BaseModel):
    column: str
    method: str = "iqr"  # "iqr" or "zscore"
    threshold: float = 1.5

class TrainRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    target_variable: str = "Sales"  # "Sales" or "Profit"
    model_types: List[str] = ["linear_regression", "random_forest", "gradient_boosting"]
    test_size: float = 0.2
    selected_features: Optional[List[str]] = None

class PredictRequest(BaseModel):
    target_variable: str = "Sales"  # "Sales" or "Profit"
    features: Dict[str, Any]

class WhatIfRequest(BaseModel):
    target_variable: str = "Profit"
    base_features: Dict[str, Any]
    scenario_changes: Dict[str, Any]

class ChatRequest(BaseModel):
    query: str
    conversation_id: Optional[str] = None
    filters: Optional[FilterParams] = None

class ReportRequest(BaseModel):
    title: Optional[str] = "Comprehensive Business Intelligence & AI Report"
    filters: Optional[FilterParams] = None

class EDAAnalysisRequest(BaseModel):
    x_col: str
    y_col: Optional[str] = None
    chart_type: str = "histogram"  # histogram, boxplot, scatter, bar
