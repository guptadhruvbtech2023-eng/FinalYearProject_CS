import json
from datetime import datetime
from typing import Dict, Any, Optional
from backend.app.config import settings
from backend.app.services.data_service import data_service
from backend.app.services.analytics_service import analytics_service
from backend.app.services.ai_service import ai_service
from backend.app.services.ml_service import ml_service
from backend.app.services.anomaly_service import anomaly_service
from backend.app.models.schemas import FilterParams
from backend.app.utils.helpers import clean_for_json, format_currency, format_percent

class ReportService:
    def generate_full_report(self, filters: Optional[FilterParams] = None) -> Dict[str, Any]:
        """Assembles the comprehensive 13-section AI Business Report."""
        if data_service.df is None:
            return {"status": "empty", "message": "No dataset loaded"}

        timestamp = datetime.now().strftime("%B %d, %Y - %H:%M")
        profile = data_service.get_profile()
        kpis = analytics_service.get_kpis(filters)
        sales_data = analytics_service.get_sales_analytics(filters)
        profit_data = analytics_service.get_profit_analytics(filters)
        cust_data = analytics_service.get_customer_analytics(filters)
        prod_data = analytics_service.get_product_analytics(filters)
        reg_data = analytics_service.get_regional_analytics(filters)
        exec_summary = ai_service.generate_executive_summary()
        quick_insights = ai_service.generate_quick_insights()
        anomalies = anomaly_service.detect_anomalies(method="isolation_forest", contamination=0.01)

        # Retrieve ML model metrics if available
        ml_profit_metrics = ml_service.model_metrics.get("profit")
        if not ml_profit_metrics:
            # Quick train if not yet cached
            train_res = ml_service.train_models(target_variable="Profit")
            ml_profit_metrics = train_res.get("metrics", [])
            ml_feature_imp = train_res.get("feature_importance", [])
            best_model_name = train_res.get("best_model", "Random Forest")
        else:
            ml_feature_imp = ml_service.train_models(target_variable="Profit").get("feature_importance", [])
            best_model_name = "Random Forest Regressor"

        report = {
            "title": "Data Analytics with AI Integration — Intelligent Executive Report",
            "generated_at": timestamp,
            "dataset_filename": data_service.filename or "superstore.csv",
            "sections": {
                "1_executive_summary": exec_summary.get("executive_summary", ""),
                "2_dataset_overview": {
                    "total_rows": profile.get("total_rows", 0),
                    "total_columns": profile.get("total_columns", 0),
                    "numerical_columns": profile.get("numerical_columns_count", 0),
                    "categorical_columns": profile.get("categorical_columns_count", 0),
                    "date_columns": profile.get("date_columns_count", 0),
                    "missing_values": profile.get("total_missing_values", 0),
                    "duplicate_rows": profile.get("duplicate_rows", 0)
                },
                "3_sales_performance": {
                    "total_sales": format_currency(kpis["total_sales"]),
                    "total_orders": kpis["total_orders"],
                    "average_order_value": format_currency(kpis["average_order_value"]),
                    "top_categories_by_sales": sales_data.get("by_category", [])[:5],
                    "top_sub_categories_by_sales": sales_data.get("by_sub_category", [])[:5]
                },
                "4_profit_performance": {
                    "total_profit": format_currency(kpis["total_profit"]),
                    "profit_margin": f"{kpis['profit_margin_percent']}%",
                    "profit_by_category": profit_data.get("by_category", [])[:5],
                    "loss_making_products_count": len(profit_data.get("loss_making_products", [])),
                    "top_loss_making_products": profit_data.get("loss_making_products", [])[:5]
                },
                "5_customer_analysis": {
                    "total_customers": cust_data.get("total_customers", 0),
                    "top_customers_sales": cust_data.get("top_customers_sales", [])[:5],
                    "top_customers_profit": cust_data.get("top_customers_profit", [])[:5],
                    "segment_breakdown": cust_data.get("segment_breakdown", [])
                },
                "6_product_analysis": {
                    "top_products_sales": prod_data.get("top_products_sales", [])[:5],
                    "top_products_profit": prod_data.get("top_products_profit", [])[:5],
                    "bottom_products_profit": prod_data.get("bottom_products_profit", [])[:5],
                    "high_sales_low_profit_skus": prod_data.get("high_sales_low_profit", [])[:5]
                },
                "7_regional_analysis": {
                    "regional_summary": reg_data.get("regions", []),
                    "top_states": reg_data.get("states", [])[:8]
                },
                "8_major_trends": {
                    "trend_insight": quick_insights.get("trend_insight", ""),
                    "positive_trends": exec_summary.get("positive_trends", [])
                },
                "9_anomalies": {
                    "total_anomalies_flagged": anomalies.get("total_anomalies_detected", 0),
                    "sample_anomalies": anomalies.get("anomalies", [])[:8]
                },
                "10_machine_learning_results": {
                    "target_variable": "Profit",
                    "best_performing_model": best_model_name,
                    "model_comparison": ml_profit_metrics,
                    "feature_importance": ml_feature_imp[:8]
                },
                "11_predictions": {
                    "outlook_summary": exec_summary.get("predictive_outlook", ""),
                    "key_drivers": [f"{f['feature']}: {f['importance']}% importance" for f in ml_feature_imp[:4]]
                },
                "12_important_insights": {
                    "key_insight": quick_insights.get("key_insight", ""),
                    "profit_insight": quick_insights.get("profit_insight", ""),
                    "regional_insight": quick_insights.get("regional_insight", "")
                },
                "13_areas_for_investigation": exec_summary.get("suggested_investigations", [])
            }
        }

        return clean_for_json(report)

    def generate_html_report(self, report_data: Dict[str, Any]) -> str:
        """Generates a styled, printable HTML document for PDF export."""
        sections = report_data.get("sections", {})
        kpi_sec = sections.get("3_sales_performance", {})
        profit_sec = sections.get("4_profit_performance", {})
        dt = sections.get("2_dataset_overview", {})
        ml_sec = sections.get("10_machine_learning_results", {})

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{report_data.get('title')}</title>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 0 auto; padding: 40px 20px; background: #fff; }}
        h1 {{ color: #0f172a; border-bottom: 3px solid #2563eb; padding-bottom: 12px; margin-bottom: 8px; }}
        h2 {{ color: #1e40af; margin-top: 32px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }}
        .header-meta {{ color: #64748b; font-size: 14px; margin-bottom: 30px; }}
        .kpi-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }}
        .kpi-card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }}
        .kpi-value {{ font-size: 22px; font-weight: bold; color: #0f172a; }}
        .kpi-label {{ font-size: 12px; color: #64748b; text-transform: uppercase; margin-top: 4px; }}
        table {{ width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }}
        th, td {{ padding: 10px 14px; border: 1px solid #e2e8f0; text-align: left; }}
        th {{ background: #f1f5f9; color: #334155; }}
        ul {{ padding-left: 20px; }}
        li {{ margin-bottom: 8px; }}
        .badge {{ display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; background: #e0f2fe; color: #0369a1; }}
        .badge-danger {{ background: #fee2e2; color: #b91c1c; }}
        @media print {{
            body {{ padding: 0; }}
            .no-print {{ display: none; }}
        }}
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="background: #2563eb; color: #fff; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Print / Save as PDF</button>
    </div>
    <h1>{report_data.get('title')}</h1>
    <div class="header-meta">
        <strong>Generated:</strong> {report_data.get('generated_at')} | 
        <strong>Source:</strong> {report_data.get('dataset_filename')} | 
        <strong>Scope:</strong> Complete Pipeline Analysis
    </div>

    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-value">{kpi_sec.get('total_sales', '$0')}</div>
            <div class="kpi-label">Total Revenue</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value">{profit_sec.get('total_profit', '$0')}</div>
            <div class="kpi-label">Net Profit</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value">{profit_sec.get('profit_margin', '0%')}</div>
            <div class="kpi-label">Profit Margin</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value">{kpi_sec.get('total_orders', '0'):,}</div>
            <div class="kpi-label">Total Orders</div>
        </div>
    </div>

    <h2>1. Executive Summary</h2>
    <p>{sections.get('1_executive_summary', '')}</p>

    <h2>2. Dataset Overview</h2>
    <p>The analytics pipeline validated <strong>{dt.get('total_rows', 0):,} rows</strong> and <strong>{dt.get('total_columns', 0)} columns</strong> ({dt.get('numerical_columns', 0)} numeric, {dt.get('categorical_columns', 0)} categorical, {dt.get('date_columns', 0)} temporal). Missing values detected: {dt.get('missing_values', 0)}, duplicate rows: {dt.get('duplicate_rows', 0)}.</p>

    <h2>3. Machine Learning Evaluation</h2>
    <p>Predictive models were trained using strictly separated training and validation partitions to prevent data leakage.</p>
    <table>
        <thead><tr><th>Model</th><th>MAE</th><th>RMSE</th><th>R² Score</th></tr></thead>
        <tbody>
"""
        for m in ml_sec.get("model_comparison", []):
            html += f"<tr><td><strong>{m['model']}</strong></td><td>{m['mae']}</td><td>{m['rmse']}</td><td><span class='badge'>{m['r2']}</span></td></tr>"

        html += f"""
        </tbody>
    </table>

    <h2>4. Key Risk Areas & Anomalies</h2>
    <ul>
"""
        for risk in sections.get("12_important_insights", {}).values():
            if risk:
                html += f"<li>{risk}</li>"

        html += f"""
    </ul>

    <h2>5. Suggested Areas for Investigation</h2>
    <ul>
"""
        for inv in sections.get("13_areas_for_investigation", []):
            html += f"<li><strong>Action:</strong> {inv}</li>"

        html += """
    </ul>
</body>
</html>
"""
        return html

report_service = ReportService()
