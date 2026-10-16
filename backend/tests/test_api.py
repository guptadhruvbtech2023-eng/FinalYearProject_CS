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
