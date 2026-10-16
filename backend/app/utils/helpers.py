import math
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional

CANONICAL_ALIASES = {
    "sales": ["sales", "revenue", "turnover", "total_sales", "amount"],
    "profit": ["profit", "net_profit", "margin", "earnings", "net_income"],
    "quantity": ["quantity", "qty", "units", "items", "volume"],
    "discount": ["discount", "disc", "discount_rate", "rebate"],
    "order_date": ["order.date", "order date", "order_date", "date", "orderdate", "trans_date", "invoice_date"],
    "ship_date": ["ship.date", "ship date", "ship_date", "shipping_date", "dispatch_date"],
    "customer_name": ["customer.name", "customer name", "customer_name", "customer", "client_name", "client"],
    "customer_id": ["customer.id", "customer id", "customer_id", "client_id"],
    "category": ["category", "product_category", "prod_category", "dept"],
    "sub_category": ["sub.category", "sub-category", "sub category", "subcategory", "product_sub_category"],
    "product_name": ["product.name", "product name", "product_name", "product", "item_name", "item"],
    "product_id": ["product.id", "product id", "product_id", "item_id", "sku"],
    "region": ["region", "territory", "zone", "market", "area"],
    "state": ["state", "province", "county"],
    "city": ["city", "town", "municipality"],
    "segment": ["segment", "customer_segment", "cust_segment", "group"],
    "ship_mode": ["ship.mode", "ship mode", "ship_mode", "shipping_mode", "delivery_method"],
    "order_id": ["order.id", "order id", "order_id", "invoice_id", "trans_id"],
    "shipping_cost": ["shipping.cost", "shipping cost", "shipping_cost", "freight", "delivery_cost"],
    "year": ["year", "order_year"]
}

def detect_columns(df: pd.DataFrame) -> Dict[str, Optional[str]]:
    """
    Dynamically inspects DataFrame columns and identifies canonical business columns.
    Returns mapping from canonical name -> actual column name in DataFrame.
    """
    mapping: Dict[str, Optional[str]] = {}
    lower_to_actual = {str(col).strip().lower(): col for col in df.columns}
    
    for canonical, aliases in CANONICAL_ALIASES.items():
        matched = None
        for alias in aliases:
            if alias.lower() in lower_to_actual:
                matched = lower_to_actual[alias.lower()]
                break
        
        # If no exact match, try substring matching for core fields
        if not matched:
            for clean_col, actual in lower_to_actual.items():
                if any(alias in clean_col for alias in aliases if len(alias) > 3):
                    matched = actual
                    break
                    
        mapping[canonical] = matched
        
    return mapping

def clean_for_json(obj: Any) -> Any:
    """
    Recursively replaces NaN, Infinity, -Infinity with None or 0,
    and converts Timestamp/datetime to ISO strings.
    """
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple, set)):
        return [clean_for_json(v) for v in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or np.isnan(obj):
            return 0.0
        if math.isinf(obj) or np.isinf(obj):
            return 0.0
        return round(obj, 4)
    elif isinstance(obj, (np.int64, np.int32, np.int16, np.int8)):
        return int(obj)
    elif isinstance(obj, (np.float64, np.float32)):
        if np.isnan(obj) or np.isinf(obj):
            return 0.0
        return round(float(obj), 4)
    elif isinstance(obj, (pd.Timestamp, pd.DatetimeIndex)):
        return str(obj)
    elif pd.isna(obj):
        return None
    return obj

def format_currency(value: float) -> str:
    if abs(value) >= 1_000_000:
        return f"${value / 1_000_000:.2f}M"
    elif abs(value) >= 1_000:
        return f"${value / 1_000:.1f}K"
    return f"${value:.2f}"

def format_percent(value: float) -> str:
    return f"{value:.1f}%"
