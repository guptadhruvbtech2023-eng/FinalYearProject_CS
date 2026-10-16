import uuid
from datetime import datetime
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from backend.app.services.data_service import data_service
from backend.app.utils.helpers import clean_for_json, detect_columns
from backend.app.utils.preprocessing import detect_outliers_iqr, detect_outliers_zscore, parse_dates_and_engineer_features

class CleaningService:
    def __init__(self):
        # Persistent audit log of all operations performed in current session
        self.audit_log: List[Dict[str, Any]] = []
        # Granular cell-level before/after changes
        self.cell_changes: List[Dict[str, Any]] = []

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
            "dataset_id": data_service.dataset_id,
            "version_id": data_service.version_id,
            "total_rows": total_rows,
            "total_duplicates": total_duplicates,
            "missing_columns": missing_info,
            "outlier_summary": outlier_info,
            "total_operations_logged": len(self.audit_log),
            "total_cells_modified": len(self.cell_changes),
            "can_undo": len(data_service.history_stack) > 0
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

    def preview_cleaning(
        self,
        missing_treatment: Optional[Dict[str, str]] = None,
        drop_duplicates: bool = False,
        type_conversions: Optional[Dict[str, str]] = None,
        outlier_treatment: Optional[Dict[str, str]] = None,
        outlier_method: str = "iqr"
    ) -> Dict[str, Any]:
        """Projects the impact of proposed cleaning operations without mutating active data."""
        if data_service.df is None:
            return {"status": "error", "message": "No dataset loaded"}

        df = data_service.df
        projected_rows = len(df)
        projected_dups_removed = int(df.duplicated().sum()) if drop_duplicates else 0
        projected_rows -= projected_dups_removed

        missing_impact = []
        if missing_treatment:
            for col, method in missing_treatment.items():
                if col in df.columns:
                    cnt = int(df[col].isnull().sum())
                    if cnt > 0:
                        if method == "drop":
                            projected_rows -= cnt
                        missing_impact.append({
                            "column": col,
                            "missing_before": cnt,
                            "treatment": method,
                            "projected_filled_or_dropped": cnt
                        })

        outlier_impact = []
        if outlier_treatment:
            for col, action in outlier_treatment.items():
                if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                    res = detect_outliers_iqr(df[col]) if outlier_method == "iqr" else detect_outliers_zscore(df[col])
                    if res["count"] > 0:
                        if action == "remove":
                            projected_rows -= res["count"]
                        outlier_impact.append({
                            "column": col,
                            "outlier_count": res["count"],
                            "action": action,
                            "bounds": [res["lower_bound"], res["upper_bound"]]
                        })

        return clean_for_json({
            "status": "ready",
            "current_rows": len(df),
            "initial_rows": len(df),
            "projected_rows": max(0, projected_rows),
            "estimated_final_rows": max(0, projected_rows),
            "projected_rows_removed": len(df) - max(0, projected_rows),
            "estimated_rows_removed": len(df) - max(0, projected_rows),
            "duplicates_to_remove": projected_dups_removed,
            "missing_treatments_projected": missing_impact,
            "outlier_treatments_projected": outlier_impact,
            "planned_actions": [f"Remove {projected_dups_removed} duplicate records"] if projected_dups_removed else ["Trim text whitespace", "Process column treatments"]
        })

    def apply_cleaning(
        self,
        missing_treatment: Optional[Dict[str, str]] = None,
        drop_duplicates: bool = False,
        type_conversions: Optional[Dict[str, str]] = None,
        outlier_treatment: Optional[Dict[str, str]] = None,
        outlier_method: str = "iqr",
        trim_whitespace: bool = False
    ) -> Dict[str, Any]:
        """Applies cleaning actions, logs changes to audit trail, and creates an undo point."""
        if data_service.df is None:
            return {"status": "error", "message": "No dataset loaded"}

        df_before = data_service.df.copy(deep=True)
        df = df_before.copy(deep=True)
        initial_rows = len(df)
        actions_taken = []
        cols_detected = detect_columns(df)
        order_col = cols_detected.get("order_id")

        timestamp_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

        # 1. Trim Whitespace & String Standardization
        if trim_whitespace:
            trimmed_cells = 0
            str_cols = df.select_dtypes(include=["object"]).columns
            for col in str_cols:
                mask = df[col].astype(str).str.strip() != df[col].astype(str)
                count = int(mask.sum())
                if count > 0:
                    for idx in df[mask].index[:25]:
                        self.cell_changes.append({
                            "row_identifier": str(df.loc[idx, order_col]) if order_col else f"Row #{idx}",
                            "column": col,
                            "original_value": str(df.loc[idx, col]),
                            "cleaned_value": str(df.loc[idx, col]).strip(),
                            "cleaning_rule": "Trimmed leading/trailing whitespace",
                            "timestamp": timestamp_str
                        })
                    df[col] = df[col].astype(str).str.strip()
                    trimmed_cells += count

            if trimmed_cells > 0:
                actions_taken.append(f"Trimmed whitespace across {trimmed_cells} cells.")
                self.audit_log.append({
                    "operation_id": str(uuid.uuid4())[:8],
                    "timestamp": timestamp_str,
                    "operation_name": "Whitespace Standardization",
                    "column_affected": "Text Columns",
                    "cleaning_rule": "str.strip() leading & trailing whitespace",
                    "original_state": f"{trimmed_cells} cells with un-trimmed spaces",
                    "resulting_state": "All text cells clean & trimmed",
                    "affected_rows_count": trimmed_cells,
                    "affected_cells_count": trimmed_cells,
                    "status": "SUCCESS"
                })

        # 2. Drop Duplicates
        if drop_duplicates:
            dups = int(df.duplicated().sum())
            if dups > 0:
                dup_indices = df[df.duplicated(keep="first")].index[:50]
                for idx in dup_indices:
                    self.cell_changes.append({
                        "row_identifier": str(df.loc[idx, order_col]) if order_col else f"Row #{idx}",
                        "column": "ENTIRE_ROW",
                        "original_value": "Duplicate Record",
                        "cleaned_value": "DELETED",
                        "cleaning_rule": "Drop exact duplicate row",
                        "timestamp": timestamp_str
                    })
                df = df.drop_duplicates().reset_index(drop=True)
                actions_taken.append(f"Removed {dups} duplicate rows.")
                self.audit_log.append({
                    "operation_id": str(uuid.uuid4())[:8],
                    "timestamp": timestamp_str,
                    "operation_name": "Duplicate Row Removal",
                    "column_affected": "ALL",
                    "cleaning_rule": "Drop exact duplicates (keep first)",
                    "original_state": f"{dups} duplicate rows detected",
                    "resulting_state": f"{len(df)} unique records remaining",
                    "affected_rows_count": dups,
                    "affected_cells_count": dups * len(df.columns),
                    "status": "SUCCESS"
                })

        # 3. Missing Value Treatment
        if missing_treatment:
            for col, method in missing_treatment.items():
                if col in df.columns:
                    missing_indices = df[df[col].isnull()].index
                    missing_before = len(missing_indices)
                    if missing_before > 0:
                        imputed_val = None
                        if method == "drop":
                            for idx in missing_indices[:50]:
                                self.cell_changes.append({
                                    "row_identifier": str(df.loc[idx, order_col]) if order_col else f"Row #{idx}",
                                    "column": col,
                                    "original_value": "NULL",
                                    "cleaned_value": "ROW_DELETED",
                                    "cleaning_rule": f"Drop row with missing {col}",
                                    "timestamp": timestamp_str
                                })
                            df = df.dropna(subset=[col]).reset_index(drop=True)
                            actions_taken.append(f"Dropped {missing_before} rows with missing {col}.")
                        elif method == "mean" and pd.api.types.is_numeric_dtype(df[col]):
                            imputed_val = round(float(df[col].mean()), 2)
                            df[col] = df[col].fillna(imputed_val)
                            actions_taken.append(f"Imputed missing {col} with mean ({imputed_val}).")
                        elif method == "median" and pd.api.types.is_numeric_dtype(df[col]):
                            imputed_val = round(float(df[col].median()), 2)
                            df[col] = df[col].fillna(imputed_val)
                            actions_taken.append(f"Imputed missing {col} with median ({imputed_val}).")
                        elif method == "mode":
                            mode_series = df[col].mode()
                            if not mode_series.empty:
                                imputed_val = str(mode_series[0])
                                df[col] = df[col].fillna(imputed_val)
                                actions_taken.append(f"Imputed missing {col} with mode ({imputed_val}).")
                        elif method == "ffill":
                            df[col] = df[col].ffill().bfill()
                            imputed_val = "Forward/Backward Fill"
                            actions_taken.append(f"Forward-filled missing values in {col}.")

                        if method != "drop" and imputed_val is not None:
                            for idx in missing_indices[:50]:
                                self.cell_changes.append({
                                    "row_identifier": str(df_before.loc[idx, order_col]) if order_col and idx in df_before.index else f"Row #{idx}",
                                    "column": col,
                                    "original_value": "NULL",
                                    "cleaned_value": str(imputed_val),
                                    "cleaning_rule": f"Impute missing with {method}",
                                    "timestamp": timestamp_str
                                })

                        self.audit_log.append({
                            "operation_id": str(uuid.uuid4())[:8],
                            "timestamp": timestamp_str,
                            "operation_name": "Missing Value Imputation",
                            "column_affected": col,
                            "cleaning_rule": f"Impute with {method}",
                            "original_state": f"{missing_before} null values",
                            "resulting_state": f"0 null values remaining ({method})",
                            "affected_rows_count": missing_before,
                            "affected_cells_count": missing_before,
                            "status": "SUCCESS"
                        })

        # 4. Type Conversions
        if type_conversions:
            for col, target_type in type_conversions.items():
                if col in df.columns:
                    try:
                        orig_dtype = str(df[col].dtype)
                        if target_type == "numeric":
                            df[col] = pd.to_numeric(df[col], errors="coerce")
                        elif target_type == "datetime":
                            df[col] = pd.to_datetime(df[col], errors="coerce")
                        elif target_type == "string":
                            df[col] = df[col].astype(str)
                        actions_taken.append(f"Converted {col} from {orig_dtype} to {target_type}.")
                        self.audit_log.append({
                            "operation_id": str(uuid.uuid4())[:8],
                            "timestamp": timestamp_str,
                            "operation_name": "Data Type Casting",
                            "column_affected": col,
                            "cleaning_rule": f"Convert to {target_type}",
                            "original_state": f"Dtype: {orig_dtype}",
                            "resulting_state": f"Dtype: {target_type}",
                            "affected_rows_count": len(df),
                            "affected_cells_count": len(df),
                            "status": "SUCCESS"
                        })
                    except Exception as e:
                        actions_taken.append(f"Failed converting {col} to {target_type}: {str(e)}")

        # 5. Outlier Treatments
        if outlier_treatment:
            for col, action in outlier_treatment.items():
                if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                    res = detect_outliers_iqr(df[col]) if outlier_method == "iqr" else detect_outliers_zscore(df[col])
                    if res["count"] > 0:
                        lb = res["lower_bound"]
                        ub = res["upper_bound"]
                        outlier_idx = res["indices"]
                        if action == "cap":
                            for idx in outlier_idx[:50]:
                                self.cell_changes.append({
                                    "row_identifier": str(df.loc[idx, order_col]) if order_col else f"Row #{idx}",
                                    "column": col,
                                    "original_value": str(round(float(df.loc[idx, col]), 2)),
                                    "cleaned_value": str(round(float(np.clip(df.loc[idx, col], lb, ub)), 2)),
                                    "cleaning_rule": f"Winsorize/Cap to [{lb}, {ub}]",
                                    "timestamp": timestamp_str
                                })
                            df[col] = df[col].clip(lower=lb, upper=ub)
                            actions_taken.append(f"Winsorized/Capped {res['count']} outliers in {col} to [{lb}, {ub}].")
                            self.audit_log.append({
                                "operation_id": str(uuid.uuid4())[:8],
                                "timestamp": timestamp_str,
                                "operation_name": "Outlier Treatment (Winsorization)",
                                "column_affected": col,
                                "cleaning_rule": f"{outlier_method.upper()} bounds [{lb}, {ub}]",
                                "original_state": f"{res['count']} outliers ({res['percentage']}%)",
                                "resulting_state": f"All values clipped to [{lb}, {ub}]",
                                "affected_rows_count": res["count"],
                                "affected_cells_count": res["count"],
                                "status": "SUCCESS"
                            })
                        elif action == "remove":
                            for idx in outlier_idx[:50]:
                                self.cell_changes.append({
                                    "row_identifier": str(df.loc[idx, order_col]) if order_col else f"Row #{idx}",
                                    "column": col,
                                    "original_value": str(round(float(df.loc[idx, col]), 2)),
                                    "cleaned_value": "ROW_DELETED",
                                    "cleaning_rule": f"Remove {outlier_method.upper()} outlier row",
                                    "timestamp": timestamp_str
                                })
                            df = df[(df[col] >= lb) & (df[col] <= ub)].reset_index(drop=True)
                            actions_taken.append(f"Removed {res['count']} outlier rows from {col}.")
                            self.audit_log.append({
                                "operation_id": str(uuid.uuid4())[:8],
                                "timestamp": timestamp_str,
                                "operation_name": "Outlier Row Deletion",
                                "column_affected": col,
                                "cleaning_rule": f"Drop values outside [{lb}, {ub}]",
                                "original_state": f"{res['count']} outlier rows",
                                "resulting_state": f"{len(df)} records remaining",
                                "affected_rows_count": res["count"],
                                "affected_cells_count": res["count"] * len(df.columns),
                                "status": "SUCCESS"
                            })

        # Save to history stack and advance version in data_service
        data_service.set_working_dataframe(df, action_label="; ".join(actions_taken) if actions_taken else "Cleaning")

        return clean_for_json({
            "status": "success",
            "initial_rows": initial_rows,
            "final_rows": len(df),
            "rows_removed": initial_rows - len(df),
            "actions_taken": actions_taken,
            "total_audit_events": len(self.audit_log),
            "updated_profile": data_service.get_profile()
        })

    def get_audit_history(self, limit: int = 100, column: Optional[str] = None) -> Dict[str, Any]:
        """Returns the complete audit trail and before/after modified cell details."""
        changes = self.cell_changes
        if column:
            changes = [c for c in changes if c["column"].lower() == column.lower()]

        return clean_for_json({
            "status": "ready",
            "dataset_id": data_service.dataset_id,
            "version_id": data_service.version_id,
            "total_operations": len(self.audit_log),
            "total_cell_modifications": len(self.cell_changes),
            "operations_history": self.audit_log[::-1],  # Most recent first
            "history": self.audit_log[::-1],
            "sample_cell_changes": changes[:limit],
            "cell_changes": changes[:limit],
            "can_undo": len(data_service.history_stack) > 0,
            "can_reset": data_service.original_df is not None
        })

    def undo_last_operation(self) -> Dict[str, Any]:
        """Undoes the most recent cleaning operation and logs the rollback in audit trail."""
        res = data_service.undo_last_operation()
        if res.get("status") == "error":
            return res

        timestamp_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        if self.audit_log:
            last_op = self.audit_log.pop()
            # Also log undo action
            self.audit_log.append({
                "operation_id": str(uuid.uuid4())[:8],
                "timestamp": timestamp_str,
                "operation_name": f"Undo: {last_op.get('operation_name')}",
                "column_affected": last_op.get("column_affected", "ALL"),
                "cleaning_rule": "Reverted to previous working snapshot",
                "original_state": last_op.get("resulting_state"),
                "resulting_state": last_op.get("original_state"),
                "affected_rows_count": last_op.get("affected_rows_count", 0),
                "affected_cells_count": last_op.get("affected_cells_count", 0),
                "status": "SUCCESS_REVERTED"
            })

        return clean_for_json({
            "status": "success",
            "message": "Successfully reverted to previous dataset snapshot.",
            "current_rows": len(data_service.df) if data_service.df is not None else 0,
            "updated_profile": data_service.get_profile()
        })

    def reset_to_original(self) -> Dict[str, Any]:
        """Restores dataset to the immutable original copy and clears operations log."""
        res = data_service.reset_to_original()
        if res.get("status") == "error":
            return res

        timestamp_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        self.audit_log.append({
            "operation_id": str(uuid.uuid4())[:8],
            "timestamp": timestamp_str,
            "operation_name": "Reset to Original Dataset",
            "column_affected": "ALL",
            "cleaning_rule": "Complete reset to immutable master copy",
            "original_state": "Cleaned working copy",
            "resulting_state": f"Original {len(data_service.df)} records restored",
            "affected_rows_count": len(data_service.df),
            "affected_cells_count": len(data_service.df) * len(data_service.df.columns),
            "status": "SUCCESS_RESET"
        })
        self.cell_changes.clear()

        return clean_for_json({
            "status": "success",
            "message": "Dataset successfully reset to original master copy.",
            "current_rows": len(data_service.df) if data_service.df is not None else 0,
            "updated_profile": data_service.get_profile()
        })

cleaning_service = CleaningService()
