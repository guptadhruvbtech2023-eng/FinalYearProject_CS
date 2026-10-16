import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from backend.app.services.data_service import data_service
from backend.app.models.schemas import FilterParams
from backend.app.utils.helpers import clean_for_json, detect_columns

class AnalyticsService:
    def filter_df(self, df: pd.DataFrame, filters: Optional[FilterParams] = None) -> pd.DataFrame:
        """Applies global filters to dataset."""
        if df is None or df.empty or filters is None:
            return df
            
        mapping = detect_columns(df)
        filtered = df.copy()

        # Year filter
        if filters.year and len(filters.year) > 0:
            target_years = [int(y) for y in filters.year if str(y).isdigit()]
            if "_order_year" in filtered.columns:
                filtered = filtered[filtered["_order_year"].isin(target_years)]
            elif mapping.get("year") and mapping["year"] in filtered.columns:
                filtered = filtered[filtered[mapping["year"]].isin(target_years)]

        # Region filter
        if filters.region and len(filters.region) > 0:
            reg_col = mapping.get("region")
            if reg_col and reg_col in filtered.columns:
                filtered = filtered[filtered[reg_col].isin(filters.region)]

        # State filter
        if filters.state and len(filters.state) > 0:
            state_col = mapping.get("state")
            if state_col and state_col in filtered.columns:
                filtered = filtered[filtered[state_col].isin(filters.state)]

        # Category filter
        if filters.category and len(filters.category) > 0:
            cat_col = mapping.get("category")
            if cat_col and cat_col in filtered.columns:
                filtered = filtered[filtered[cat_col].isin(filters.category)]

        # Sub-Category filter
        if filters.sub_category and len(filters.sub_category) > 0:
            sub_col = mapping.get("sub_category")
            if sub_col and sub_col in filtered.columns:
                filtered = filtered[filtered[sub_col].isin(filters.sub_category)]

        # Segment filter
        if filters.segment and len(filters.segment) > 0:
            seg_col = mapping.get("segment")
            if seg_col and seg_col in filtered.columns:
                filtered = filtered[filtered[seg_col].isin(filters.segment)]

        # Ship Mode filter
        if filters.ship_mode and len(filters.ship_mode) > 0:
            sm_col = mapping.get("ship_mode")
            if sm_col and sm_col in filtered.columns:
                filtered = filtered[filtered[sm_col].isin(filters.ship_mode)]

        return filtered

    def get_kpis(self, filters: Optional[FilterParams] = None) -> Dict[str, Any]:
        """Calculates core business KPIs."""
        if data_service.df is None:
            return {"status": "empty"}

        df = self.filter_df(data_service.df, filters)
        cols = detect_columns(df)

        sales_col = cols.get("sales")
        profit_col = cols.get("profit")
        qty_col = cols.get("quantity")
        order_col = cols.get("order_id")

        total_sales = float(df[sales_col].sum()) if sales_col and sales_col in df.columns else 0.0
        total_profit = float(df[profit_col].sum()) if profit_col and profit_col in df.columns else 0.0
        total_qty = int(df[qty_col].sum()) if qty_col and qty_col in df.columns else len(df)
        total_orders = int(df[order_col].nunique()) if order_col and order_col in df.columns else len(df)
        if total_orders == 0:
            total_orders = len(df)

        aov = round(total_sales / total_orders, 2) if total_orders > 0 else 0.0
        profit_margin = round((total_profit / total_sales) * 100, 2) if total_sales > 0 else 0.0

        return clean_for_json({
            "total_sales": round(total_sales, 2),
            "total_profit": round(total_profit, 2),
            "total_orders": total_orders,
            "average_order_value": aov,
            "profit_margin_percent": profit_margin,
            "total_quantity": total_qty,
            "filtered_rows": len(df),
            "unfiltered_rows": len(data_service.df)
        })

    def get_sales_analytics(self, filters: Optional[FilterParams] = None, interval: str = "monthly") -> Dict[str, Any]:
        """Detailed Sales breakdowns and trends."""
        if data_service.df is None:
            return {"status": "empty"}

        df = self.filter_df(data_service.df, filters)
        cols = detect_columns(df)
        sales_col = cols.get("sales")
        if not sales_col or sales_col not in df.columns:
            return {"status": "error", "message": "Sales column not found"}

        # 1. Sales Trend
        trend_data = []
        if "_parsed_order_date" in df.columns:
            if interval == "daily":
                grp = df.groupby(df["_parsed_order_date"].dt.strftime("%Y-%m-%d"))[sales_col].sum()
            elif interval == "quarterly":
                grp = df.groupby(df["_parsed_order_date"].dt.to_period("Q").astype(str))[sales_col].sum()
            elif interval == "yearly":
                grp = df.groupby(df["_order_year"])[sales_col].sum()
            else: # monthly
                grp = df.groupby(df["_order_year_month"])[sales_col].sum()

            for period, val in grp.items():
                trend_data.append({"period": str(period), "sales": round(float(val), 2)})
            trend_data = sorted(trend_data, key=lambda x: x["period"])

        # 2. Sales by Category
        cat_data = []
        cat_col = cols.get("category")
        if cat_col and cat_col in df.columns:
            grp_cat = df.groupby(cat_col)[sales_col].sum().sort_values(ascending=False)
            for cat, val in grp_cat.items():
                cat_data.append({"category": str(cat), "sales": round(float(val), 2)})

        # 3. Sales by Sub-Category
        subcat_data = []
        sub_col = cols.get("sub_category")
        if sub_col and sub_col in df.columns:
            grp_sub = df.groupby(sub_col)[sales_col].sum().sort_values(ascending=False)
            for sub, val in grp_sub.items():
                subcat_data.append({"sub_category": str(sub), "sales": round(float(val), 2)})

        # 4. Sales by Region
        reg_data = []
        reg_col = cols.get("region")
        if reg_col and reg_col in df.columns:
            grp_reg = df.groupby(reg_col)[sales_col].sum().sort_values(ascending=False)
            for reg, val in grp_reg.items():
                reg_data.append({"region": str(reg), "sales": round(float(val), 2)})

        # 5. Sales by Segment
        seg_data = []
        seg_col = cols.get("segment")
        if seg_col and seg_col in df.columns:
            grp_seg = df.groupby(seg_col)[sales_col].sum().sort_values(ascending=False)
            for seg, val in grp_seg.items():
                seg_data.append({"segment": str(seg), "sales": round(float(val), 2)})

        return clean_for_json({
            "trend": trend_data,
            "by_category": cat_data,
            "by_sub_category": subcat_data,
            "by_region": reg_data,
            "by_segment": seg_data
        })

    def get_profit_analytics(self, filters: Optional[FilterParams] = None) -> Dict[str, Any]:
        """Detailed Profit breakdowns, margin %, and loss-making products."""
        if data_service.df is None:
            return {"status": "empty"}

        df = self.filter_df(data_service.df, filters)
        cols = detect_columns(df)
        sales_col = cols.get("sales")
        profit_col = cols.get("profit")
        cat_col = cols.get("category")
        sub_col = cols.get("sub_category")
        reg_col = cols.get("region")
        prod_col = cols.get("product_name")

        # 1. Profit Trend
        profit_trend = []
        if "_parsed_order_date" in df.columns and profit_col in df.columns:
            grp = df.groupby(df["_order_year_month"]).agg({
                profit_col: "sum",
                sales_col: "sum" if sales_col else "count"
            })
            for period, row in grp.iterrows():
                prof = float(row[profit_col])
                sls = float(row[sales_col]) if sales_col else 1.0
                margin = round((prof / sls) * 100, 2) if sls > 0 else 0.0
                profit_trend.append({
                    "period": str(period),
                    "profit": round(prof, 2),
                    "sales": round(sls, 2),
                    "margin_pct": margin
                })
            profit_trend = sorted(profit_trend, key=lambda x: x["period"])

        # 2. Profit by Category
        by_cat = []
        if cat_col and cat_col in df.columns and profit_col in df.columns:
            grp_c = df.groupby(cat_col).agg({
                profit_col: "sum",
                sales_col: "sum" if sales_col else "count"
            }).reset_index()
            for _, r in grp_c.iterrows():
                p = float(r[profit_col])
                s = float(r[sales_col]) if sales_col else 1.0
                m = round((p / s) * 100, 2) if s > 0 else 0.0
                by_cat.append({"category": str(r[cat_col]), "profit": round(p, 2), "sales": round(s, 2), "margin_pct": m})
            by_cat = sorted(by_cat, key=lambda x: x["profit"], reverse=True)

        # 3. Profit by Region
        by_reg = []
        if reg_col and reg_col in df.columns and profit_col in df.columns:
            grp_r = df.groupby(reg_col).agg({
                profit_col: "sum",
                sales_col: "sum" if sales_col else "count"
            }).reset_index()
            for _, r in grp_r.iterrows():
                p = float(r[profit_col])
                s = float(r[sales_col]) if sales_col else 1.0
                m = round((p / s) * 100, 2) if s > 0 else 0.0
                by_reg.append({"region": str(r[reg_col]), "profit": round(p, 2), "sales": round(s, 2), "margin_pct": m})
            by_reg = sorted(by_reg, key=lambda x: x["profit"], reverse=True)

        # 4. Loss-Making Products Table
        loss_products = []
        if prod_col and prod_col in df.columns and profit_col in df.columns:
            grp_p = df.groupby(prod_col).agg({
                profit_col: "sum",
                sales_col: "sum" if sales_col else "count"
            }).reset_index()
            unprofitable = grp_p[grp_p[profit_col] < 0].sort_values(by=profit_col, ascending=True).head(20)
            for _, r in unprofitable.iterrows():
                p = float(r[profit_col])
                s = float(r[sales_col]) if sales_col else 0.0
                m = round((p / s) * 100, 2) if s > 0 else -100.0
                loss_products.append({
                    "product_name": str(r[prod_col]),
                    "profit": round(p, 2),
                    "sales": round(s, 2),
                    "margin_pct": m
                })

        return clean_for_json({
            "trend": profit_trend,
            "by_category": by_cat,
            "by_region": by_reg,
            "loss_making_products": loss_products
        })

    def get_customer_analytics(self, filters: Optional[FilterParams] = None) -> Dict[str, Any]:
        """Customer segments, top customers by revenue and profitability."""
        if data_service.df is None:
            return {"status": "empty"}

        df = self.filter_df(data_service.df, filters)
        cols = detect_columns(df)
        cust_col = cols.get("customer_name") or cols.get("customer_id")
        sales_col = cols.get("sales")
        profit_col = cols.get("profit")
        order_col = cols.get("order_id")
        seg_col = cols.get("segment")

        if not cust_col or cust_col not in df.columns:
            return {"status": "error", "message": "Customer identifier not found in dataset"}

        total_customers = int(df[cust_col].nunique())

        agg_dict = {
            sales_col: "sum",
            profit_col: "sum",
            order_col: "nunique" if order_col else "count"
        }
        grp = df.groupby(cust_col).agg(agg_dict).reset_index()
        grp.columns = ["customer", "sales", "profit", "orders"]
        grp["aov"] = (grp["sales"] / grp["orders"]).round(2)
        grp["margin_pct"] = ((grp["profit"] / grp["sales"]) * 100).round(2)

        top_by_sales = grp.sort_values(by="sales", ascending=False).head(10).to_dict(orient="records")
        top_by_profit = grp.sort_values(by="profit", ascending=False).head(10).to_dict(orient="records")

        # Segment analysis
        seg_breakdown = []
        if seg_col and seg_col in df.columns:
            s_grp = df.groupby(seg_col).agg({
                cust_col: "nunique",
                sales_col: "sum",
                profit_col: "sum"
            }).reset_index()
            for _, r in s_grp.iterrows():
                sls = float(r[sales_col])
                prf = float(r[profit_col])
                seg_breakdown.append({
                    "segment": str(r[seg_col]),
                    "unique_customers": int(r[cust_col]),
                    "sales": round(sls, 2),
                    "profit": round(prf, 2),
                    "margin_pct": round((prf / sls) * 100, 2) if sls > 0 else 0.0
                })

        return clean_for_json({
            "total_customers": total_customers,
            "top_customers_sales": top_by_sales,
            "top_customers_profit": top_by_profit,
            "segment_breakdown": seg_breakdown
        })

    def get_product_analytics(self, filters: Optional[FilterParams] = None) -> Dict[str, Any]:
        """Top/bottom products and High Sales / Low Profit products analysis."""
        if data_service.df is None:
            return {"status": "empty"}

        df = self.filter_df(data_service.df, filters)
        cols = detect_columns(df)
        prod_col = cols.get("product_name")
        sales_col = cols.get("sales")
        profit_col = cols.get("profit")
        cat_col = cols.get("category")
        sub_col = cols.get("sub_category")

        if not prod_col or prod_col not in df.columns:
            return {"status": "error", "message": "Product name column not found"}

        grp = df.groupby(prod_col).agg({
            sales_col: "sum",
            profit_col: "sum"
        }).reset_index()
        grp.columns = ["product_name", "sales", "profit"]
        grp["margin_pct"] = ((grp["profit"] / grp["sales"]) * 100).round(2)

        top_sales = grp.sort_values(by="sales", ascending=False).head(10).to_dict(orient="records")
        top_profit = grp.sort_values(by="profit", ascending=False).head(10).to_dict(orient="records")
        bottom_profit = grp.sort_values(by="profit", ascending=True).head(10).to_dict(orient="records")

        # High Sales / Low Profit: Sales > median sales, Profit Margin < 5% or negative
        median_sales = grp["sales"].median()
        high_sales_low_profit = grp[(grp["sales"] >= median_sales) & (grp["margin_pct"] < 5.0)].sort_values(
            by="sales", ascending=False
        ).head(15).to_dict(orient="records")

        return clean_for_json({
            "top_products_sales": top_sales,
            "top_products_profit": top_profit,
            "bottom_products_profit": bottom_profit,
            "high_sales_low_profit": high_sales_low_profit
        })

    def get_regional_analytics(self, filters: Optional[FilterParams] = None) -> Dict[str, Any]:
        """Regional and state-level performance matrix."""
        if data_service.df is None:
            return {"status": "empty"}

        df = self.filter_df(data_service.df, filters)
        cols = detect_columns(df)
        reg_col = cols.get("region")
        state_col = cols.get("state")
        sales_col = cols.get("sales")
        profit_col = cols.get("profit")
        order_col = cols.get("order_id")

        if not reg_col or reg_col not in df.columns:
            return {"status": "error", "message": "Region column not found"}

        reg_grp = df.groupby(reg_col).agg({
            sales_col: "sum",
            profit_col: "sum",
            order_col: "nunique" if order_col else "count"
        }).reset_index()
        reg_grp.columns = ["region", "sales", "profit", "orders"]
        reg_grp["margin_pct"] = ((reg_grp["profit"] / reg_grp["sales"]) * 100).round(2)
        regional_summary = reg_grp.sort_values(by="sales", ascending=False).to_dict(orient="records")

        # Top 10 States
        state_summary = []
        if state_col and state_col in df.columns:
            st_grp = df.groupby(state_col).agg({
                sales_col: "sum",
                profit_col: "sum"
            }).reset_index()
            st_grp.columns = ["state", "sales", "profit"]
            st_grp["margin_pct"] = ((st_grp["profit"] / st_grp["sales"]) * 100).round(2)
            state_summary = st_grp.sort_values(by="sales", ascending=False).head(15).to_dict(orient="records")

        return clean_for_json({
            "regions": regional_summary,
            "states": state_summary
        })

    def get_correlation_matrix(self) -> Dict[str, Any]:
        """Calculates Pearson correlation matrix for numerical variables with explanations."""
        if data_service.df is None:
            return {"status": "empty"}

        df = data_service.df
        display_cols = [c for c in df.columns if not c.startswith("_")]
        num_cols = [c for c in display_cols if pd.api.types.is_numeric_dtype(df[c])]

        # Exclude constant or non-meaningful IDs if applicable
        meaningful_cols = [c for c in num_cols if df[c].nunique() > 1 and not any(x in c.lower() for x in ["id", "row", "记录数"])]
        if len(meaningful_cols) < 2:
            meaningful_cols = num_cols[:6]

        corr_df = df[meaningful_cols].corr().round(3)
        corr_matrix = corr_df.to_dict()

        # Generate automatic statistical insights
        insights = []
        pairs_checked = set()
        for c1 in meaningful_cols:
            for c2 in meaningful_cols:
                if c1 != c2 and (c2, c1) not in pairs_checked:
                    pairs_checked.add((c1, c2))
                    val = corr_df.loc[c1, c2]
                    if abs(val) >= 0.3:
                        direction = "positive" if val > 0 else "negative"
                        strength = "strong" if abs(val) >= 0.6 else "moderate"
                        impact = (
                            f"as {c1} increases, {c2} tends to increase proportionally."
                            if val > 0 else
                            f"higher {c1} is associated with lower {c2}, indicating potential margin compression or trade-offs."
                        )
                        insights.append({
                            "var1": c1,
                            "var2": c2,
                            "correlation": val,
                            "strength": strength,
                            "direction": direction,
                            "interpretation": f"There is a {strength} {direction} correlation ({val}) between {c1} and {c2}: {impact}"
                        })

        insights = sorted(insights, key=lambda x: abs(x["correlation"]), reverse=True)[:8]

        return clean_for_json({
            "variables": meaningful_cols,
            "matrix": corr_df.values.tolist(),
            "columns": list(corr_df.columns),
            "insights": insights
        })

    def get_eda_data(self, x_col: str, y_col: Optional[str] = None, chart_type: str = "histogram") -> Dict[str, Any]:
        """Provides dynamic EDA distribution data for custom user exploratory analysis."""
        if data_service.df is None or x_col not in data_service.df.columns:
            return {"status": "error", "message": f"Column {x_col} not available"}

        df = data_service.df
        s_x = df[x_col].dropna()

        result: Dict[str, Any] = {"x_col": x_col, "y_col": y_col, "chart_type": chart_type}

        if chart_type == "histogram" and pd.api.types.is_numeric_dtype(s_x):
            # Compute 15 bins
            counts, bin_edges = np.histogram(s_x, bins=15)
            bins = []
            for i in range(len(counts)):
                bins.append({
                    "range": f"{round(bin_edges[i], 1)} - {round(bin_edges[i+1], 1)}",
                    "count": int(counts[i]),
                    "midpoint": round(float((bin_edges[i] + bin_edges[i+1]) / 2), 2)
                })
            result["distribution"] = bins
            result["stats"] = {
                "mean": round(float(s_x.mean()), 2),
                "median": round(float(s_x.median()), 2),
                "std": round(float(s_x.std()), 2),
                "skew": round(float(s_x.skew()), 2)
            }

        elif chart_type == "boxplot" and pd.api.types.is_numeric_dtype(s_x):
            q1 = float(s_x.quantile(0.25))
            q2 = float(s_x.median())
            q3 = float(s_x.quantile(0.75))
            iqr = q3 - q1
            min_val = float(max(s_x.min(), q1 - 1.5 * iqr))
            max_val = float(min(s_x.max(), q3 + 1.5 * iqr))
            result["boxplot_stats"] = {
                "min": round(min_val, 2),
                "q1": round(q1, 2),
                "median": round(q2, 2),
                "q3": round(q3, 2),
                "max": round(max_val, 2)
            }

        elif chart_type == "scatter" and y_col and y_col in df.columns:
            # Sample up to 500 points for snappy rendering
            sub_df = df[[x_col, y_col]].dropna()
            if len(sub_df) > 500:
                sub_df = sub_df.sample(500, random_state=42)
            points = []
            for _, r in sub_df.iterrows():
                points.append({"x": round(float(r[x_col]), 2), "y": round(float(r[y_col]), 2)})
            result["points"] = points

        elif chart_type == "bar":
            if y_col and y_col in df.columns and pd.api.types.is_numeric_dtype(df[y_col]):
                grp = df.groupby(x_col)[y_col].mean().sort_values(ascending=False).head(15)
            else:
                grp = s_x.value_counts().head(15)
            bar_data = [{"category": str(k), "value": round(float(v), 2)} for k, v in grp.items()]
            result["bar_data"] = bar_data

        return clean_for_json(result)

analytics_service = AnalyticsService()
