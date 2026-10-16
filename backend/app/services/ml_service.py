import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from backend.app.config import settings
from backend.app.services.data_service import data_service
from backend.app.utils.helpers import clean_for_json, detect_columns
from backend.app.utils.preprocessing import prepare_ml_dataset

class MLService:
    def __init__(self):
        self.trained_models: Dict[str, Dict[str, Any]] = {}
        self.model_metrics: Dict[str, List[Dict[str, Any]]] = {}
        self.feature_names: Dict[str, List[str]] = {}
        self.pipelines: Dict[str, Any] = {}

    def train_models(
        self,
        target_variable: str = "Profit",
        model_types: Optional[List[str]] = None,
        test_size: float = 0.2
    ) -> Dict[str, Any]:
        """
        Trains regression models (Linear Regression, Random Forest, Gradient Boosting).
        Guarantees strict separation of train/test data to prevent data leakage.
        """
        if data_service.df is None:
            return {"status": "error", "message": "No dataset loaded"}

        if model_types is None:
            model_types = ["linear_regression", "random_forest", "gradient_boosting"]

        target_canonical = target_variable.lower()
        df = data_service.df

        # Prepare dataset with proper time/stratified train-test split
        try:
            X_train, X_test, y_train, y_test, num_features, cat_features = prepare_ml_dataset(
                df, target_canonical=target_canonical, test_size=test_size
            )
        except Exception as e:
            return {"status": "error", "message": f"Dataset preparation failed: {str(e)}"}

        # Build column transformer for preprocessing: fit ONLY on training data!
        preprocessor = ColumnTransformer(
            transformers=[
                ("num", StandardScaler(), num_features),
                ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features)
            ]
        )

        models_to_train = {}
        if "linear_regression" in model_types:
            models_to_train["Linear Regression"] = LinearRegression()
        if "random_forest" in model_types:
            models_to_train["Random Forest"] = RandomForestRegressor(
                n_estimators=30, max_depth=10, random_state=42, n_jobs=-1
            )
        if "gradient_boosting" in model_types:
            models_to_train["Gradient Boosting"] = GradientBoostingRegressor(
                n_estimators=30, max_depth=5, random_state=42
            )

        results = []
        best_r2 = -float("inf")
        best_model_name = None
        best_pipeline = None
        best_feature_importance = []
        actual_vs_pred = []

        for name, model_instance in models_to_train.items():
            # Create full pipeline: preprocessor + model
            pipe = Pipeline(steps=[
                ("preprocessor", preprocessor),
                ("regressor", model_instance)
            ])

            # Train on training set only
            pipe.fit(X_train, y_train)

            # Predict on test set
            y_pred = pipe.predict(X_test)

            mae = mean_absolute_error(y_test, y_pred)
            mse = mean_squared_error(y_test, y_pred)
            rmse = np.sqrt(mse)
            r2 = r2_score(y_test, y_pred)

            metric_entry = {
                "model": name,
                "mae": round(float(mae), 3),
                "mse": round(float(mse), 3),
                "rmse": round(float(rmse), 3),
                "r2": round(float(r2), 4)
            }
            results.append(metric_entry)

            # Track best model based on R2
            if r2 > best_r2:
                best_r2 = r2
                best_model_name = name
                best_pipeline = pipe

                # Build actual vs predicted points for chart (sample 80 points)
                sample_indices = np.random.choice(len(y_test), min(80, len(y_test)), replace=False)
                y_test_arr = np.array(y_test)
                actual_vs_pred = [
                    {
                        "index": int(i),
                        "actual": round(float(y_test_arr[idx]), 2),
                        "predicted": round(float(y_pred[idx]), 2),
                        "residual": round(float(y_test_arr[idx] - y_pred[idx]), 2)
                    }
                    for i, idx in enumerate(sample_indices)
                ]

        # Extract feature importance from tree model if available
        feature_importance_list = []
        if best_pipeline and hasattr(best_pipeline.named_steps["regressor"], "feature_importances_"):
            rf_model = best_pipeline.named_steps["regressor"]
            fitted_prep = best_pipeline.named_steps["preprocessor"]
            try:
                all_feat_names = list(fitted_prep.get_feature_names_out())
            except Exception:
                all_feat_names = num_features + cat_features

            importances = rf_model.feature_importances_
            if len(importances) == len(all_feat_names):
                feat_df = pd.DataFrame({"feature": all_feat_names, "importance": importances})
                
                # Aggregate one-hot encoded categories back to main features for clarity
                aggregated: Dict[str, float] = {}
                for _, r in feat_df.iterrows():
                    f = str(r["feature"])
                    val = float(r["importance"])
                    clean_name = f.split("__")[-1] if "__" in f else f
                    base_f = clean_name.split("_")[0] if "_" in clean_name and not clean_name.startswith("_order") else clean_name
                    aggregated[base_f] = aggregated.get(base_f, 0.0) + val
                    
                sorted_imp = sorted(aggregated.items(), key=lambda x: x[1], reverse=True)
                feature_importance_list = [
                    {"feature": k, "importance": round(v * 100, 2)} for k, v in sorted_imp[:12]
                ]

        # Cache best pipeline
        cache_key = f"{target_canonical}_best"
        self.pipelines[cache_key] = best_pipeline
        self.model_metrics[target_canonical] = results
        self.feature_names[target_canonical] = {
            "all_features": list(X_train.columns),
            "num_features": num_features,
            "cat_features": cat_features
        }

        # Save to disk
        try:
            model_file = settings.MODELS_DIR / f"{target_canonical}_pipeline.joblib"
            joblib.dump(best_pipeline, model_file)
        except Exception:
            pass

        return clean_for_json({
            "status": "success",
            "target": target_variable,
            "best_model": best_model_name,
            "best_r2": round(float(best_r2), 4),
            "metrics": results,
            "feature_importance": feature_importance_list,
            "actual_vs_predicted": actual_vs_pred,
            "training_samples": len(X_train),
            "testing_samples": len(X_test),
            "features_used": list(X_train.columns)
        })

    def predict(self, target_variable: str, features: Dict[str, Any]) -> Dict[str, Any]:
        """Runs inference on user input using cached trained pipeline."""
        target_canonical = target_variable.lower()
        cache_key = f"{target_canonical}_best"

        pipe = self.pipelines.get(cache_key)
        if pipe is None:
            # Try loading from disk
            model_file = settings.MODELS_DIR / f"{target_canonical}_pipeline.joblib"
            if model_file.exists():
                pipe = joblib.load(model_file)
                self.pipelines[cache_key] = pipe
            else:
                # Auto-train if not yet trained
                train_res = self.train_models(target_variable=target_variable)
                if train_res.get("status") == "error":
                    return train_res
                pipe = self.pipelines.get(cache_key)

        feature_meta = self.feature_names.get(target_canonical, {})
        req_features = feature_meta.get("all_features", list(features.keys()))
        cat_features = feature_meta.get("cat_features", [])
        num_features = feature_meta.get("num_features", [])

        # Lowercase mapping for user inputs to allow case-insensitive lookup
        user_features_lower = {str(k).lower().replace(".", "").replace("_", "").replace("-", "").replace(" ", ""): v for k, v in features.items()}

        input_dict = {}
        for f in req_features:
            norm_key = str(f).lower().replace(".", "").replace("_", "").replace("-", "").replace(" ", "")
            if norm_key in user_features_lower:
                input_dict[f] = [user_features_lower[norm_key]]
            elif f in cat_features:
                input_dict[f] = ["Other"]
            elif "_year" in f:
                input_dict[f] = [2024]
            elif "_month" in f or "_quarter" in f:
                input_dict[f] = [1]
            else:
                input_dict[f] = [0.0]

        input_df = pd.DataFrame(input_dict)

        try:
            pred_val = float(pipe.predict(input_df)[0])
        except Exception as e:
            return {"status": "error", "message": f"Prediction failed: {str(e)}"}

        # Compute explainability contribution heuristics
        contributions = []
        for k, v in features.items():
            if isinstance(v, (int, float)):
                contributions.append({
                    "feature": k,
                    "input_value": v,
                    "impact": "Positive Driver" if v > 0 and k.lower() in ["sales", "quantity"] else "Cost/Margin Driver"
                })

        return clean_for_json({
            "status": "success",
            "target": target_variable,
            "predicted_value": round(pred_val, 2),
            "input_features": features,
            "contributions": contributions
        })

ml_service = MLService()
