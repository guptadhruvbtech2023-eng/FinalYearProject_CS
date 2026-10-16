import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from backend.app.services.data_service import data_service
from backend.app.utils.helpers import clean_for_json, detect_columns
from backend.app.utils.preprocessing import detect_outliers_iqr, detect_outliers_zscore, parse_dates_and_engineer_features

class CleaningService:
    def get_cleaning_summary(self) -> Dict[str, Any]:
        """Provides an overview of data quality issues (missing, duplicates, outliers)."""
        if data_service.df is None:
            return {"status": "empty", "message": "No dataset loaded"}

        df = data_service.df
        total_rows = len(df)
        total_duplicates = int(df.duplicated().sum())

        missing_info = []
        outlier_info = []

        display_cols = [c for c in df.columns if not c.startswith("_")]
        for col in display_cols:
            series = df[col]
            missing_count = int(series.isnull().sum())
            if missing_count > 0:
                pct = round((missing_count / total_rows) * 100, 2)
                treatment = "Fill with Mean" if pd.api.types.is_numeric_dtype(series) else "Fill with Mode"
                missing_info.append({
                    "column": col,
                    "missing_count": missing_count,
                    "missing_percentage": pct,
                    "suggested_treatment": treatment
                })

            # Check outliers for numerical columns
            if pd.api.types.is_numeric_dtype(series):
                iqr_res = detect_outliers_iqr(series)
                z_res = detect_outliers_zscore(series)
                if iqr_res["count"] > 0:
                    outlier_info.append({
                        "column": col,
                        "iqr_count": iqr_res["count"],
                        "iqr_percentage": iqr_res["percentage"],
                        "iqr_lower": iqr_res["lower_bound"],
                        "iqr_upper": iqr_res["upper_bound"],
                        "zscore_count": z_res["count"],
                        "zscore_percentage": z_res["percentage"],
                        "min_val": round(float(series.min()), 2),
                        "max_val": round(float(series.max()), 2),
                        "mean_val": round(float(series.mean()), 2)
                    })

        return clean_for_json({
            "status": "ready",
            "total_rows": total_rows,
            "total_duplicates": total_duplicates,
            "missing_columns": missing_info,
            "outlier_summary": outlier_info
        })

    def inspect_outliers(self, column: str, method: str = "iqr", threshold: float = 1.5, limit: int = 50) -> Dict[str, Any]:
        """Returns sample outlier rows for user inspection before making changes."""
        if data_service.df is None or column not in data_service.df.columns:
            return {"status": "error", "message": f"Column {column} not found"}

        df = data_service.df
        series = df[column]
        if method == "zscore":
            res = detect_outliers_zscore(series, threshold=threshold)
        else:
            res = detect_outliers_iqr(series, threshold=threshold)

        outlier_indices = res["indices"]
        sample_rows = []
        if outlier_indices:
            sample_df = df.loc[outlier_indices[:limit]]
            display_cols = [c for c in sample_df.columns if not c.startswith("_")]
            sample_rows = sample_df[display_cols].to_dict(orient="records")

        return clean_for_json({
            "column": column,
            "method": method,
            "threshold": threshold,
            "outlier_count": res["count"],
            "outlier_percentage": res["percentage"],
            "lower_bound": res["lower_bound"],
            "upper_bound": res["upper_bound"],
            "sample_records": sample_rows
        })

    def apply_cleaning(
        self,
        missing_treatment: Optional[Dict[str, str]] = None,
        drop_duplicates: bool = False,
        type_conversions: Optional[Dict[str, str]] = None,
        outlier_treatment: Optional[Dict[str, str]] = None,
        outlier_method: str = "iqr"
    ) -> Dict[str, Any]:
        """Applies cleaning actions to current dataset in place."""
        if data_service.df is None:
            return {"status": "error", "message": "No dataset loaded"}

        df = data_service.df.copy()
        actions_taken = []
        initial_rows = len(df)

        # 1. Drop Duplicates
        if drop_duplicates:
            dups = int(df.duplicated().sum())
            if dups > 0:
                df = df.drop_duplicates().reset_index(drop=True)
                actions_taken.append(f"Removed {dups} duplicate rows.")

        # 2. Missing value treatment
        if missing_treatment:
            for col, method in missing_treatment.items():
                if col in df.columns:
                    missing_before = int(df[col].isnull().sum())
                    if missing_before > 0:
                        if method == "drop":
                            df = df.dropna(subset=[col]).reset_index(drop=True)
                            actions_taken.append(f"Dropped {missing_before} rows with missing {col}.")
                        elif method == "mean" and pd.api.types.is_numeric_dtype(df[col]):
                            mean_val = df[col].mean()
                            df[col] = df[col].fillna(mean_val)
                            actions_taken.append(f"Imputed missing {col} with mean ({round(mean_val, 2)}).")
                        elif method == "median" and pd.api.types.is_numeric_dtype(df[col]):
                            med_val = df[col].median()
                            df[col] = df[col].fillna(med_val)
                            actions_taken.append(f"Imputed missing {col} with median ({round(med_val, 2)}).")
                        elif method == "mode":
                            mode_series = df[col].mode()
                            if not mode_series.empty:
                                df[col] = df[col].fillna(mode_series[0])
                                actions_taken.append(f"Imputed missing {col} with mode ({mode_series[0]}).")
                        elif method == "ffill":
                            df[col] = df[col].ffill().bfill()
                            actions_taken.append(f"Forward-filled missing values in {col}.")

        # 3. Type conversions
        if type_conversions:
            for col, target_type in type_conversions.items():
                if col in df.columns:
                    try:
                        if target_type == "numeric":
                            df[col] = pd.to_numeric(df[col], errors="coerce")
                            actions_taken.append(f"Converted {col} to numeric.")
                        elif target_type == "datetime":
                            df[col] = pd.to_datetime(df[col], errors="coerce")
                            actions_taken.append(f"Converted {col} to datetime.")
                        elif target_type == "string":
                            df[col] = df[col].astype(str)
                            actions_taken.append(f"Converted {col} to string.")
                    except Exception as e:
                        actions_taken.append(f"Failed converting {col} to {target_type}: {str(e)}")

        # 4. Outlier treatments
        if outlier_treatment:
            for col, action in outlier_treatment.items():
                if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                    res = detect_outliers_iqr(df[col]) if outlier_method == "iqr" else detect_outliers_zscore(df[col])
                    if res["count"] > 0:
                        lb = res["lower_bound"]
                        ub = res["upper_bound"]
                        if action == "cap":
                            df[col] = df[col].clip(lower=lb, upper=ub)
                            actions_taken.append(f"Winsorized/Capped {res['count']} outliers in {col} to [{lb}, {ub}].")
                        elif action == "remove":
                            df = df[(df[col] >= lb) & (df[col] <= ub)].reset_index(drop=True)
                            actions_taken.append(f"Removed {res['count']} outlier rows from {col}.")

        # Refresh dataset in data_service
        data_service._set_dataframe(df, data_service.filename or "cleaned_data.csv", is_demo=data_service.is_demo)

        return clean_for_json({
            "status": "success",
            "initial_rows": initial_rows,
            "final_rows": len(df),
            "rows_removed": initial_rows - len(df),
            "actions_taken": actions_taken,
            "updated_profile": data_service.get_profile()
        })

cleaning_service = CleaningService()
