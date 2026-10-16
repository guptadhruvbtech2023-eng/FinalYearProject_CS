import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from sklearn.ensemble import IsolationForest
from backend.app.services.data_service import data_service
from backend.app.utils.helpers import clean_for_json, detect_columns
from backend.app.utils.preprocessing import detect_outliers_iqr, detect_outliers_zscore

class AnomalyService:
    def detect_anomalies(
        self,
        method: str = "isolation_forest",
        contamination: float = 0.02,
        selected_metric: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Detects anomalous records using Isolation Forest, IQR, or Z-Score.
        Returns detailed records with expected ranges and anomaly explanations.
        """
        if data_service.df is None:
            return {"status": "empty", "message": "No dataset loaded"}

        df = data_service.df
        cols = detect_columns(df)

        sales_col = cols.get("sales")
        profit_col = cols.get("profit")
        qty_col = cols.get("quantity")
        disc_col = cols.get("discount")
        date_col = cols.get("order_date")
        prod_col = cols.get("product_name")
        reg_col = cols.get("region")

        target_metrics = []
        for m_col in [sales_col, profit_col, qty_col, disc_col]:
            if m_col and m_col in df.columns:
                target_metrics.append(m_col)

        if not target_metrics:
            return {"status": "error", "message": "No numeric metric columns available for anomaly detection"}

        anomalies_list = []

        if method == "isolation_forest":
            # Multivariate detection using Isolation Forest
            clean_sub = df[target_metrics].dropna()
            iso = IsolationForest(contamination=contamination, random_state=42, n_jobs=-1)
            preds = iso.fit_predict(clean_sub)
            scores = iso.decision_function(clean_sub)

            # -1 represents an anomaly
            anomaly_mask = preds == -1
            anomaly_indices = clean_sub[anomaly_mask].index

            # Calculate standard expected ranges (Q1 - 1.5*IQR to Q3 + 1.5*IQR) for metrics
            ranges = {}
            for m in target_metrics:
                q1 = float(clean_sub[m].quantile(0.25))
                q3 = float(clean_sub[m].quantile(0.75))
                iqr = q3 - q1
                ranges[m] = (round(q1 - 1.5 * iqr, 2), round(q3 + 1.5 * iqr, 2))

            for idx in anomaly_indices[:60]: # Top 60 anomalies
                row = df.loc[idx]
                score_val = round(float(scores[clean_sub.index.get_loc(idx)]), 3)

                # Determine primary anomalous metric
                max_dev_col = target_metrics[0]
                max_dev_ratio = 0.0
                for m in target_metrics:
                    val = float(row[m])
                    lb, ub = ranges[m]
                    if val < lb or val > ub:
                        span = (ub - lb) if (ub - lb) > 0 else 1.0
                        ratio = abs(val - (ub + lb) / 2) / span
                        if ratio > max_dev_ratio:
                            max_dev_ratio = ratio
                            max_dev_col = m

                anomalies_list.append({
                    "id": int(idx),
                    "date": str(row[date_col])[:10] if date_col and date_col in df.columns else "N/A",
                    "region": str(row[reg_col]) if reg_col and reg_col in df.columns else "N/A",
                    "product": str(row[prod_col])[:40] if prod_col and prod_col in df.columns else "N/A",
                    "metric": max_dev_col,
                    "value": round(float(row[max_dev_col]), 2),
                    "expected_range": f"[{ranges[max_dev_col][0]}, {ranges[max_dev_col][1]}]",
                    "anomaly_score": score_val,
                    "severity": "Critical" if score_val < -0.15 else "Moderate",
                    "details": {m: round(float(row[m]), 2) for m in target_metrics}
                })

        elif method in ["iqr", "zscore"]:
            col_to_check = selected_metric if (selected_metric and selected_metric in df.columns) else (profit_col or sales_col)
            if not col_to_check:
                col_to_check = target_metrics[0]

            s = df[col_to_check]
            if method == "iqr":
                iqr_res = detect_outliers_iqr(s, threshold=1.5)
                outlier_indices = iqr_res["indices"]
                lb, ub = iqr_res["lower_bound"], iqr_res["upper_bound"]
            else:
                z_res = detect_outliers_zscore(s, threshold=3.0)
                outlier_indices = z_res["indices"]
                lb, ub = z_res["lower_bound"], z_res["upper_bound"]

            for idx in outlier_indices[:60]:
                row = df.loc[idx]
                val = float(row[col_to_check])
                anomalies_list.append({
                    "id": int(idx),
                    "date": str(row[date_col])[:10] if date_col and date_col in df.columns else "N/A",
                    "region": str(row[reg_col]) if reg_col and reg_col in df.columns else "N/A",
                    "product": str(row[prod_col])[:40] if prod_col and prod_col in df.columns else "N/A",
                    "metric": col_to_check,
                    "value": round(val, 2),
                    "expected_range": f"[{lb}, {ub}]",
                    "anomaly_score": round(abs(val - ((ub + lb) / 2)), 2),
                    "severity": "High" if val < lb else "Warning",
                    "details": {m: round(float(row[m]), 2) for m in target_metrics}
                })

        return clean_for_json({
            "status": "success",
            "method": method,
            "total_anomalies_detected": len(anomalies_list),
            "anomalies": anomalies_list,
            "disclaimer": "Flagged transactions represent statistical anomalies based on configured variance bounds and do not necessarily represent operational fraud or data corruption.",
            "method_explanation": "Isolation Forest constructs an ensemble of isolation trees to isolate sparse records; IQR and Z-Score evaluate univariate dispersion against standard distribution thresholds."
        })

anomaly_service = AnomalyService()
