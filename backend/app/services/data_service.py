import os
import io
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional, List
from backend.app.config import settings
from backend.app.utils.helpers import detect_columns, clean_for_json
from backend.app.utils.preprocessing import parse_dates_and_engineer_features

class DataService:
    def __init__(self):
        self.df: Optional[pd.DataFrame] = None
        self.filename: Optional[str] = None
        self.column_mapping: Dict[str, Optional[str]] = {}
        self.is_demo: bool = False
        self.profile_cache: Optional[Dict[str, Any]] = None

    def initialize(self):
        """Auto-loads default dataset (superstore.csv) if present."""
        if settings.DEFAULT_DATASET and settings.DEFAULT_DATASET.exists():
            try:
                print(f"Loading initial dataset from: {settings.DEFAULT_DATASET}")
                self.load_from_path(str(settings.DEFAULT_DATASET), is_demo=True)
                print(f"Successfully loaded {len(self.df)} rows, {len(self.df.columns)} columns.")
            except Exception as e:
                print(f"Warning: Failed to load default dataset: {e}")

    def load_from_path(self, filepath: str, is_demo: bool = False) -> Dict[str, Any]:
        """Loads dataset from file path (tries utf-8 then latin1 fallback)."""
        try:
            df = pd.read_csv(filepath, encoding="utf-8")
        except UnicodeDecodeError:
            df = pd.read_csv(filepath, encoding="latin1")
            
        return self._set_dataframe(df, Path(filepath).name, is_demo=is_demo)

    def load_from_bytes(self, content: bytes, filename: str) -> Dict[str, Any]:
        """Loads dataset from uploaded file bytes."""
        try:
            df = pd.read_csv(io.BytesIO(content), encoding="utf-8")
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(content), encoding="latin1")
            
        # Save to uploads dir
        save_path = settings.DATA_DIR / filename
        with open(save_path, "wb") as f:
            f.write(content)
            
        return self._set_dataframe(df, filename, is_demo=False)

    def _set_dataframe(self, df: pd.DataFrame, filename: str, is_demo: bool = False) -> Dict[str, Any]:
        # Preprocess dates & numerical columns
        self.df = parse_dates_and_engineer_features(df)
        self.filename = filename
        self.is_demo = is_demo
        self.column_mapping = detect_columns(self.df)
        self.profile_cache = None
        return self.get_profile()

    def get_profile(self) -> Dict[str, Any]:
        """Returns deep profile and summary statistics of current dataset."""
        if self.df is None:
            return {"status": "empty", "message": "No dataset currently loaded"}
            
        if self.profile_cache is not None:
            return self.profile_cache

        df = self.df
        total_rows, total_cols = df.shape
        duplicates = int(df.duplicated().sum())
        total_missing = int(df.isnull().sum().sum())
        
        # User-facing columns (exclude internal helper columns starting with _)
        display_cols = [c for c in df.columns if not c.startswith("_")]
        
        num_cols = []
        cat_cols = []
        date_cols = []
        bool_cols = []
        
        col_summaries = []
        for col in display_cols:
            series = df[col]
            dtype = str(series.dtype)
            missing_count = int(series.isnull().sum())
            missing_pct = round((missing_count / total_rows) * 100, 2)
            unique_count = int(series.nunique(dropna=True))
            
            # Suggest treatment for missing values
            treatment = "None Needed"
            if missing_count > 0:
                if missing_pct > 60:
                    treatment = "Drop Column (>60% missing)"
                elif pd.api.types.is_numeric_dtype(series):
                    treatment = "Fill with Median" if series.skew() > 1 else "Fill with Mean"
                else:
                    treatment = "Fill with Mode (Frequent)"
            
            summary: Dict[str, Any] = {
                "column": col,
                "dtype": dtype,
                "missing_count": missing_count,
                "missing_pct": missing_pct,
                "unique_count": unique_count,
                "suggested_treatment": treatment,
                "sample_values": [str(x) for x in series.dropna().unique()[:5].tolist()]
            }
            
            if pd.api.types.is_numeric_dtype(series):
                num_cols.append(col)
                clean_s = series.dropna()
                if not clean_s.empty:
                    summary.update({
                        "min": round(float(clean_s.min()), 2),
                        "max": round(float(clean_s.max()), 2),
                        "mean": round(float(clean_s.mean()), 2),
                        "median": round(float(clean_s.median()), 2),
                        "std": round(float(clean_s.std()), 2)
                    })
            elif pd.api.types.is_datetime64_any_dtype(series):
                date_cols.append(col)
            elif pd.api.types.is_bool_dtype(series):
                bool_cols.append(col)
            else:
                cat_cols.append(col)
                
            col_summaries.append(summary)

        # Build filter options dynamically
        filter_options = self.get_filter_options()

        result = {
            "status": "ready",
            "filename": self.filename,
            "is_demo": self.is_demo,
            "total_rows": total_rows,
            "total_columns": total_cols,
            "numerical_columns_count": len(num_cols),
            "categorical_columns_count": len(cat_cols),
            "date_columns_count": len(date_cols),
            "total_missing_values": total_missing,
            "duplicate_rows": duplicates,
            "column_mapping": self.column_mapping,
            "columns": col_summaries,
            "filter_options": filter_options,
            "preview": clean_for_json(df[display_cols].head(25).to_dict(orient="records"))
        }
        
        self.profile_cache = result
        return clean_for_json(result)

    def get_filter_options(self) -> Dict[str, List[Any]]:
        """Extracts available values for global filters."""
        if self.df is None:
            return {}
            
        df = self.df
        mapping = self.column_mapping
        
        options: Dict[str, List[Any]] = {
            "years": [],
            "regions": [],
            "states": [],
            "categories": [],
            "sub_categories": [],
            "segments": [],
            "ship_modes": []
        }
        
        # Years
        if "_order_year" in df.columns:
            options["years"] = sorted([int(y) for y in df["_order_year"].dropna().unique() if y > 0])
        elif mapping.get("year") and mapping["year"] in df.columns:
            options["years"] = sorted([int(y) for y in df[mapping["year"]].dropna().unique() if y > 0])
            
        # Region
        if mapping.get("region") and mapping["region"] in df.columns:
            options["regions"] = sorted([str(r) for r in df[mapping["region"]].dropna().unique()])
            
        # State
        if mapping.get("state") and mapping["state"] in df.columns:
            options["states"] = sorted([str(s) for s in df[mapping["state"]].dropna().unique()])
            
        # Category
        if mapping.get("category") and mapping["category"] in df.columns:
            options["categories"] = sorted([str(c) for c in df[mapping["category"]].dropna().unique()])
            
        # Sub-Category
        if mapping.get("sub_category") and mapping["sub_category"] in df.columns:
            options["sub_categories"] = sorted([str(sc) for sc in df[mapping["sub_category"]].dropna().unique()])
            
        # Segment
        if mapping.get("segment") and mapping["segment"] in df.columns:
            options["segments"] = sorted([str(s) for s in df[mapping["segment"]].dropna().unique()])
            
        # Ship Mode
        if mapping.get("ship_mode") and mapping["ship_mode"] in df.columns:
            options["ship_modes"] = sorted([str(sm) for sm in df[mapping["ship_mode"]].dropna().unique()])
            
        return options

data_service = DataService()
