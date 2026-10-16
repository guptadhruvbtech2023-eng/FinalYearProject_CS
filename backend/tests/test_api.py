import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.data_service import data_service

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_dataset():
    # Ensure dataset is loaded
    if data_service.df is None:
        data_service.initialize()

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["dataset_loaded"] is True

def test_data_profile():
    response = client.get("/api/data/profile")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["total_rows"] > 0
    assert "filter_options" in data

def test_analytics_kpis():
    response = client.post("/api/analytics/kpis", json={})
    assert response.status_code == 200
    data = response.json()
    assert "total_sales" in data
    assert "total_profit" in data
    assert data["total_sales"] > 0

def test_sales_and_profit_analytics():
    res_sales = client.post("/api/analytics/sales?interval=monthly", json={})
    assert res_sales.status_code == 200
    assert "trend" in res_sales.json()
    assert "by_category" in res_sales.json()

    res_profit = client.post("/api/analytics/profit", json={})
    assert res_profit.status_code == 200
    assert "by_category" in res_profit.json()
    assert "loss_making_products" in res_profit.json()

def test_ml_train_and_predict():
    train_res = client.post("/api/ml/train", json={
        "target_variable": "Profit",
        "model_types": ["linear_regression", "random_forest"],
        "test_size": 0.2
    })
    assert train_res.status_code == 200
    data = train_res.json()
    assert data["status"] == "success"
    assert len(data["metrics"]) > 0

    # Test prediction
    pred_res = client.post("/api/ml/predict", json={
        "target_variable": "Profit",
        "features": {
            "Sales": 250.0,
            "Quantity": 4,
            "Discount": 0.1,
            "Category": "Technology",
            "Region": "West"
        }
    })
    assert pred_res.status_code == 200
    assert "predicted_value" in pred_res.json()

def test_anomaly_detection():
    res = client.post("/api/anomaly/detect?method=isolation_forest&contamination=0.01")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "anomalies" in data

def test_ai_insights_and_chat():
    res_insights = client.get("/api/ai/insights")
    assert res_insights.status_code == 200
    assert "key_insight" in res_insights.json()

    res_chat = client.post("/api/ai/chat", json={"query": "Why did profit decrease?"})
    assert res_chat.status_code == 200
    data = res_chat.json()
    assert "response" in data
    assert len(data["response"]) > 0

def test_whatif_analysis():
    res = client.post("/api/whatif/simulate", json={
        "target_variable": "Profit",
        "base_features": {"Sales": 200, "Quantity": 3, "Discount": 0.2},
        "scenario_changes": {"Discount": 0.1}
    })
    assert res.status_code == 200
    data = res.json()
    assert "baseline_prediction" in data
    assert "scenario_prediction" in data
    assert "difference" in data

def test_report_generation():
    res = client.post("/api/report/generate", json={})
    assert res.status_code == 200
    data = res.json()
    assert "sections" in data
    assert "1_executive_summary" in data["sections"]

def test_cleaning_audit_and_preview():
    # 1. Test preview dry-run
    preview_res = client.post("/api/data/cleaning/preview", json={
        "drop_duplicates": True,
        "trim_whitespace": True
    })
    assert preview_res.status_code == 200
    preview_data = preview_res.json()
    assert "initial_rows" in preview_data
    assert "estimated_final_rows" in preview_data
    assert "planned_actions" in preview_data

    # 2. Test audit history endpoint
    history_res = client.get("/api/data/cleaning/history")
    assert history_res.status_code == 200
    history_data = history_res.json()
    assert "history" in history_data
    assert "cell_changes" in history_data
    assert "can_undo" in history_data

def test_cleaning_execution_undo_and_reset():
    initial_profile = client.get("/api/data/profile").json()
    initial_rows = initial_profile["total_rows"]

    # Execute cleaning action
    clean_res = client.post("/api/data/clean", json={
        "drop_duplicates": True,
        "trim_whitespace": True
    })
    assert clean_res.status_code == 200

    # Test undo
    undo_res = client.post("/api/data/cleaning/undo")
    assert undo_res.status_code == 200
    undo_data = undo_res.json()
    assert undo_data["status"] == "success"

    # Test reset to pristine original
    reset_res = client.post("/api/data/cleaning/reset")
    assert reset_res.status_code == 200
    reset_data = reset_res.json()
    assert reset_data["status"] == "success"
    assert reset_data["current_rows"] == initial_rows

def test_multiformat_exports():
    # 1. Cleaned CSV
    res_csv = client.get("/api/data/export/csv")
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers.get("content-type", "")
    assert len(res_csv.content) > 100

    # 2. 4-Sheet Excel
    res_excel = client.get("/api/data/export/excel")
    assert res_excel.status_code == 200
    assert "spreadsheetml" in res_excel.headers.get("content-type", "")
    assert len(res_excel.content) > 500

    # 3. Cleaned Dataset PDF
    res_pdf = client.get("/api/data/export/cleaned-pdf")
    assert res_pdf.status_code == 200
    assert res_pdf.content.startswith(b"%PDF-")

    # 4. Cleaning Audit Report PDF
    res_audit_pdf = client.get("/api/data/export/cleaning-report-pdf")
    assert res_audit_pdf.status_code == 200
    assert res_audit_pdf.content.startswith(b"%PDF-")

    # 5. Anomaly CSV Export
    res_anom_csv = client.get("/api/anomaly/export-csv")
    assert res_anom_csv.status_code == 200
    assert "text/csv" in res_anom_csv.headers.get("content-type", "")

def test_ml_baseline_and_experiments():
    # Train ML models
    train_res = client.post("/api/ml/train", json={
        "target_variable": "Profit",
        "model_types": ["linear_regression", "random_forest"],
        "test_size": 0.2
    })
    assert train_res.status_code == 200
    metrics = train_res.json()["metrics"]
    
    # Verify baseline DummyRegressor exists
    baseline_entry = next((m for m in metrics if m.get("is_baseline")), None)
    assert baseline_entry is not None
    assert "Historical Mean" in baseline_entry["model_name"]
    assert "mape" in baseline_entry

    # Check non-baseline model has uplift calculated
    trained_model = next((m for m in metrics if not m.get("is_baseline")), None)
    assert trained_model is not None
    assert "improvement_over_baseline_pct" in trained_model

    # Test Research Experiment Summary API
    exp_res = client.get("/api/experiments/summary?target=Profit")
    assert exp_res.status_code == 200
    exp_data = exp_res.json()
    assert "target_variable" in exp_data
    assert "ml_benchmark" in exp_data
    assert "viva_defense_notes" in exp_data

    # Test Markdown Export API
    md_res = client.get("/api/experiments/export-markdown?target=Profit")
    assert md_res.status_code == 200
    assert b"Academic Experiment Results" in md_res.content

