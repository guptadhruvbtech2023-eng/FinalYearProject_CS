import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any, List, Optional
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from backend.app.utils.helpers import detect_columns

def parse_dates_and_engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Identifies order date columns and creates date-derived features.
    Does not mutate original columns destructively.
    """
    cols = detect_columns(df)
    df_copy = df.copy()
    
    order_date_col = cols.get("order_date")
    if order_date_col and order_date_col in df_copy.columns:
        try:
            df_copy["_parsed_order_date"] = pd.to_datetime(df_copy[order_date_col], errors="coerce")
            df_copy["_order_year"] = df_copy["_parsed_order_date"].dt.year
            df_copy["_order_month"] = df_copy["_parsed_order_date"].dt.month
            df_copy["_order_quarter"] = df_copy["_parsed_order_date"].dt.quarter
            df_copy["_order_dayofweek"] = df_copy["_parsed_order_date"].dt.dayofweek
            df_copy["_order_month_name"] = df_copy["_parsed_order_date"].dt.strftime("%b")
            df_copy["_order_year_month"] = df_copy["_parsed_order_date"].dt.strftime("%Y-%m")
        except Exception:
            pass
            
    # Also ensure sales, profit, quantity, discount are float/int
    for num_key in ["sales", "profit", "quantity", "discount", "shipping_cost"]:
        col = cols.get(num_key)
        if col and col in df_copy.columns:
            df_copy[col] = pd.to_numeric(df_copy[col], errors="coerce").fillna(0.0)
            
    return df_copy

def detect_outliers_iqr(series: pd.Series, threshold: float = 1.5) -> Dict[str, Any]:
    """
    Computes IQR bounds and returns outlier indices and counts.
    """
    clean_s = pd.to_numeric(series, errors="coerce").dropna()
    if clean_s.empty:
        return {"count": 0, "percentage": 0.0, "lower_bound": 0.0, "upper_bound": 0.0, "indices": []}
        
    q1 = clean_s.quantile(0.25)
    q3 = clean_s.quantile(0.75)
    iqr = q3 - q1
    lower_bound = q1 - threshold * iqr
    upper_bound = q3 + threshold * iqr
    
    outliers = clean_s[(clean_s < lower_bound) | (clean_s > upper_bound)]
    count = len(outliers)
    pct = round((count / len(clean_s)) * 100, 2)
    
    return {
        "count": count,
        "percentage": pct,
        "lower_bound": round(float(lower_bound), 2),
        "upper_bound": round(float(upper_bound), 2),
        "indices": outliers.index.tolist()
    }

def detect_outliers_zscore(series: pd.Series, threshold: float = 3.0) -> Dict[str, Any]:
    """
    Computes Z-Score and returns outlier indices and counts.
    """
    clean_s = pd.to_numeric(series, errors="coerce").dropna()
    if clean_s.empty or clean_s.std() == 0:
        return {"count": 0, "percentage": 0.0, "lower_bound": 0.0, "upper_bound": 0.0, "indices": []}
        
    mean = clean_s.mean()
    std = clean_s.std()
    z_scores = np.abs((clean_s - mean) / std)
    
    outliers = clean_s[z_scores > threshold]
    count = len(outliers)
    pct = round((count / len(clean_s)) * 100, 2)
    
    lower_bound = mean - threshold * std
    upper_bound = mean + threshold * std
    
    return {
        "count": count,
        "percentage": pct,
        "lower_bound": round(float(lower_bound), 2),
        "upper_bound": round(float(upper_bound), 2),
        "indices": outliers.index.tolist()
    }

def prepare_ml_dataset(
    df: pd.DataFrame, 
    target_canonical: str = "sales",
    test_size: float = 0.2,
    random_state: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, List[str], List[str]]:
    """
    Builds feature matrix X and target y preventing data leakage.
    Uses time-based or stratified ordering where appropriate.
    Returns: X_train, X_test, y_train, y_test, num_features, cat_features
    """
    cols = detect_columns(df)
    target_actual = cols.get(target_canonical)
    if not target_actual or target_actual not in df.columns:
        raise ValueError(f"Target column for '{target_canonical}' not found in dataset.")

    # Candidate feature columns
    candidate_features = []
    
    # Feature columns to look for
    possible_keys = ["quantity", "discount", "shipping_cost", "category", "sub_category", "region", "segment", "ship_mode"]
    if target_canonical == "profit":
        possible_keys.insert(0, "sales")
    elif target_canonical == "sales":
        possible_keys.insert(0, "profit") # Or exclude profit to avoid leakage in sales forecasting

    # Include engineered date features if available
    date_features = ["_order_year", "_order_month", "_order_quarter", "_order_dayofweek"]
    for df_col in date_features:
        if df_col in df.columns:
            candidate_features.append(df_col)

    actual_features = []
    for k in possible_keys:
        act = cols.get(k)
        if act and act in df.columns and act != target_actual:
            if act not in actual_features:
                actual_features.append(act)
                
    features_to_use = actual_features + [c for c in candidate_features if c not in actual_features]
    
    # Clean dataset of missing values in target or features
    df_clean = df.dropna(subset=[target_actual] + [f for f in features_to_use if f in df.columns]).copy()
    
    # Identify numerical vs categorical
    num_features = []
    cat_features = []
    for f in features_to_use:
        if pd.api.types.is_numeric_dtype(df_clean[f]):
            num_features.append(f)
        else:
            cat_features.append(f)
            
    X = df_clean[features_to_use]
    y = df_clean[target_actual]
    
    # If date column exists, sort chronologically before split to prevent future leakage
    order_date_col = cols.get("order_date")
    if order_date_col and "_parsed_order_date" in df_clean.columns:
        df_clean = df_clean.sort_values(by="_parsed_order_date")
        X = df_clean[features_to_use]
        y = df_clean[target_actual]
        # Time-series split (latest test_size% for testing)
        split_idx = int(len(df_clean) * (1 - test_size))
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )
        
    return X_train, X_test, y_train, y_test, num_features, cat_features
