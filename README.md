# Data Analytics with AI Integration for Intelligent Insights and Prediction

> **A Complete, Production-Quality B.Tech Capstone Project in Computer Science / Data Science**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20+%20Vite-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn-F7931E?style=flat&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind%20CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#)

---

## 1. Project Overview

Modern businesses generate vast volumes of transactional data, yet converting raw figures into actionable executive strategy remains a critical bottleneck. **NexusAnalytics** is an end-to-end intelligent business analytics platform that bridges raw transactional datasets (such as `superstore.csv`) with:

1. **Automated Data Quality & Cleaning**: Missing value imputation (Mean/Median/Mode/FFill), duplicate removal, and IQR/Z-score outlier inspection.
2. **Interactive Business Intelligence**: KPI scorecards, multi-dimensional slicing (Year, Region, Category, Sub-Category, Segment, Ship Mode), and loss-making SKU detection.
3. **Exploratory Data Analysis (EDA)**: Parametric distributions, five-number summaries, and bivariate scatter correlation.
4. **Predictive Analytics & Machine Learning**: Linear Regression, Random Forest, and Gradient Boosting regressors with strict chronological train/test isolation to prevent data leakage.
5. **Multivariate Anomaly Detection**: Isolation Forest and statistical bounding identifying anomalous transactions.
6. **Explainable AI (XAI)**: Relative feature importance tracking and decision-tree split breakdown.
7. **What-If Scenario Simulator**: Real-time policy impact modeling (e.g. evaluating the margin impact of reducing discounts from 20% to 15%).
8. **Grounded AI Business Analyst**: Zero-hallucination conversational interface answering questions using calculated metrics.
9. **Automated 13-Section Business Reports**: Instant executive dossier generation with print/PDF export.

---

## 2. System Architecture

```text
                               ┌────────────────────────────────────────────────────────┐
                               │                    REACT + VITE UI                     │
                               │  Tailwind CSS · Recharts · Lucide · Dark/Light Mode   │
                               └───────────────────────────┬────────────────────────────┘
                                                           │ REST APIs (Axios)
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │                    FASTAPI BACKEND                     │
                               ├───────────────────────────┬────────────────────────────┤
                               │       Data Pipeline       │       Analytics Engine     │
                               │  • Auto Schema Mapping    │  • Multi-Filter Slicing    │
                               │  • Imputation & Capping   │  • KPI Aggregations        │
                               │  • Outlier Diagnostics    │  • Pearson Heatmap         │
                               ├───────────────────────────┼────────────────────────────┤
                               │    ML & Explainability    │      AI Service Layer      │
                               │  • Regression (LR/RF/GB)  │  • Grounded Query Handler  │
                               │  • Test Leakage Isolation │  • LLM / Heuristic Engine  │
                               │  • Isolation Forest       │  • What-If Simulator       │
                               │  • Feature Importance     │  • 13-Section Report Gen   │
                               └───────────────────────────┴────────────────────────────┘
```

---

## 3. Grounded AI Architecture (Zero Hallucinations)

A foundational architectural requirement is that the AI must **never fabricate or hallucinate business figures**:

```text
USER QUESTION ("Why did profit decrease?")
      ↓
AI QUESTION INTENT UNDERSTANDING
      ↓
ANALYTICS ENGINE EXECUTION (Pandas / Scikit-learn)
      ↓
ACTUAL VERIFIED METRICS (Total losses, high discount counts, worst region)
      ↓
AI REASONING & SYNTHESIS
      ↓
GROUNDED RESPONSE + VERIFIED DATA BADGES
```

If an `OPENAI_API_KEY` is provided in `.env`, the system provides verified facts to the LLM. If the key is absent, the built-in **Statistical NLP Business Analyst** generates precise, mathematically verified answers, ensuring the application operates 100% offline without crashing or requiring paid API credits.

---

## 4. End-to-End Analytics Pipeline

```text
RAW DATA (superstore.csv)
   ↓
DATA VALIDATION & INGESTION
   ↓
DATA CLEANING (Missing / Duplicates / Outliers)
   ↓
DATA PROFILING & MOMENTS
   ↓
EXPLORATORY DATA ANALYSIS (EDA)
   ↓
DESCRIPTIVE & DIAGNOSTIC ANALYTICS
   ↓
MACHINE LEARNING REGRESSION (Leakage Prevention)
   ↓
PREDICTIVE ANALYTICS & RESIDUALS
   ↓
ANOMALY DETECTION (Isolation Forest)
   ↓
EXPLAINABLE AI (Feature Importance)
   ↓
WHAT-IF SCENARIO SIMULATION
   ↓
GROUNDED AI BUSINESS ANALYST CHAT
   ↓
13-SECTION AI EXECUTIVE REPORT & PDF EXPORT
```

---

## 5. Technology Stack

### Backend
- **Python 3.11**
- **FastAPI**: Modern, asynchronous, high-performance REST framework.
- **Uvicorn**: ASGI web server implementation.
- **Pandas & NumPy**: High-performance data manipulation and vectorized matrix arithmetic.
- **Scikit-learn**: Machine learning algorithms (Linear Regression, Random Forest, Gradient Boosting, Isolation Forest, StandardScaler, OneHotEncoder, ColumnTransformer).
- **SciPy**: Statistical tests, parametric bounds, and skewness computation.
- **Pydantic v2**: Request/response validation and strict schema enforcement.
- **Pytest & TestClient**: Automated API integration and regression testing.

### Frontend
- **React 18**: Component-driven reactive user interface.
- **Vite 5**: Sub-second Hot Module Replacement (HMR) and optimized rollup production bundling.
- **Tailwind CSS**: Responsive utility-first design system with dark/light mode.
- **Recharts**: Declarative composable charting library for area, bar, line, scatter, and donut charts.
- **Lucide React**: Clean, accessible iconography.
- **Axios**: Promised-based HTTP client communicating with FastAPI endpoints.
- **React Router v6**: Single-page application routing and deep-linking.

---

## 6. Directory Structure

```text
btechproject/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application setup, CORS, lifespan
│   │   ├── config.py                   # App settings, directory paths, environment
│   │   ├── models/
│   │   │   └── schemas.py              # Pydantic request/response data contracts
│   │   ├── utils/
│   │   │   ├── helpers.py              # Dynamic column detection & JSON encoders
│   │   │   └── preprocessing.py        # Date parsing, feature prep, outlier math
│   │   ├── services/
│   │   │   ├── data_service.py         # CSV loading, caching, profiling
│   │   │   ├── cleaning_service.py     # Imputation, duplicates, IQR/Z-score capping
│   │   │   ├── analytics_service.py    # KPIs, sales, profit, customer, product, region, EDA
│   │   │   ├── ml_service.py           # LR, RF, GB training, metrics (MAE/RMSE/R2), XAI
│   │   │   ├── anomaly_service.py      # Isolation Forest & statistical outlier bounds
│   │   │   ├── ai_service.py           # Grounded AI advisor & executive summaries
│   │   │   ├── whatif_service.py       # Policy simulation & delta estimation
│   │   │   └── report_service.py       # 13-section report generation & HTML/PDF export
│   │   └── api/
│   │       ├── data_routes.py          # /api/data endpoints
│   │       ├── analytics_routes.py     # /api/analytics endpoints
│   │       ├── ml_routes.py            # /api/ml endpoints
│   │       ├── anomaly_routes.py       # /api/anomaly endpoints
│   │       ├── ai_routes.py            # /api/ai endpoints
│   │       ├── whatif_routes.py        # /api/whatif endpoints
│   │       └── report_routes.py        # /api/report endpoints
│   ├── tests/
│   │   └── test_api.py                 # Comprehensive automated backend test suite
│   ├── uploads/                        # User-uploaded CSV datasets
│   ├── models_cache/                   # Serialized Scikit-learn pipelines (.joblib)
│   ├── reports/                        # Saved business reports
│   ├── requirements.txt                # Python dependencies
│   └── .env.example                    # Backend environment template
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Brand, dataset status, theme toggle
│   │   │   ├── Sidebar.jsx             # Grouped navigation matching viva spec
│   │   │   ├── FilterBar.jsx           # Global multi-dimensional filters
│   │   │   ├── KPICard.jsx             # Metric scorecards with trend tags
│   │   │   ├── ChartCard.jsx           # Reusable container for charts
│   │   │   ├── DataTable.jsx           # Searchable, paginated data table
│   │   │   ├── LoadingState.jsx        # Animated contextual loading state
│   │   │   └── EmptyState.jsx          # Friendly empty state placeholder
│   │   ├── pages/
│   │   │   ├── Home.jsx                # Landing page, hero, pipeline, viva guide
│   │   │   ├── Dashboard.jsx           # Executive BI dashboard with real KPIs
│   │   │   ├── Upload.jsx              # CSV drag & drop, validation, preview
│   │   │   ├── Cleaning.jsx            # Missing imputation, duplicate & outlier tools
│   │   │   ├── DataProfile.jsx         # Detailed attribute schema & moments table
│   │   │   ├── Sales.jsx               # Daily/Monthly/Quarterly/Yearly sales trends
│   │   │   ├── Profit.jsx              # Profit margins & loss-making products table
│   │   │   ├── Customers.jsx           # Top accounts, customer segments, AOV
│   │   │   ├── Products.jsx            # High Sales / Low Profit anomaly analysis
│   │   │   ├── Regions.jsx             # Territorial performance & state rankings
│   │   │   ├── Correlation.jsx         # Pearson correlation heatmap & explanations
│   │   │   ├── EDA.jsx                 # Dynamic univariate histograms & scatter plots
│   │   │   ├── Predictions.jsx         # ML model comparison & live inference sandbox
│   │   │   ├── Anomalies.jsx           # Isolation Forest & outlier detection
│   │   │   ├── Explainability.jsx      # Feature importance and decision drivers
│   │   │   ├── WhatIf.jsx              # Interactive policy sliders & delta calculation
│   │   │   ├── AIChat.jsx              # AI Business Analyst chatbot
│   │   │   ├── AIInsights.jsx          # Automated executive summary & recommendations
│   │   │   └── Reports.jsx             # 13-section AI business report with PDF export
│   │   ├── services/
│   │   │   └── api.js                  # Axios client connecting to backend
│   │   ├── context/
│   │   │   └── AppContext.jsx          # Global dataset, filter, and theme state
│   │   ├── App.jsx                     # Route definitions
│   │   ├── main.jsx                    # React entrypoint
│   │   └── index.css                   # Tailwind styles and dark mode rules
│   ├── package.json                    # Node dependencies
│   ├── vite.config.js                  # Vite server & backend API proxy
│   ├── tailwind.config.js              # Custom brand theme & dark mode
│   └── index.html                      # HTML template with Google Fonts
│
├── superstore.csv                      # Primary dataset (51,290 rows, 27 columns)
├── .env.example                        # Root environment template
├── run_backend.bat                     # Windows one-click backend runner
├── run_frontend.bat                    # Windows one-click frontend runner
└── README.md                           # Comprehensive documentation & Viva guide
```

---

## 7. Installation & Quick Start

### Prerequisites
- **Python 3.11+** installed and added to PATH
- **Node.js v18+** and **npm** installed

### Step 1: Backend Setup
Open a terminal in the project directory:

```bash
cd backend
python -m pip install -r requirements.txt
```

Run the backend server:

```bash
uvicorn app.main:app --reload --port 8000
```

The FastAPI backend will start at `http://localhost:8000`. It will automatically detect `superstore.csv` in the root directory and load all 51,290 records on launch!

### Step 2: Frontend Setup
In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:5173`. Open your browser and navigate to `http://localhost:5173`.

---

## 8. Windows One-Click Launch Scripts

Convenience scripts are provided for demonstration:

1. **`run_backend.bat`**: Launches the FastAPI backend on port 8000.
2. **`run_frontend.bat`**: Launches Vite dev server on port 5173.

---

## 9. Verification & Automated Tests

To execute the backend test suite covering all 9 analytical modules:

```bash
python -m pytest backend/tests/test_api.py -v
```

All 9 tests will execute:
- `test_health_check`: PASSED
- `test_data_profile`: PASSED
- `test_analytics_kpis`: PASSED
- `test_sales_and_profit_analytics`: PASSED
- `test_ml_train_and_predict`: PASSED
- `test_anomaly_detection`: PASSED
- `test_ai_insights_and_chat`: PASSED
- `test_whatif_analysis`: PASSED
- `test_report_generation`: PASSED

To verify the frontend build:

```bash
cd frontend
npm run build
```

---

## 10. Viva-Voce Examination Guide

When presenting this project to external examiners, structure your walkthrough as follows:

### Q1. What is the core problem and how does your system address it?
> *"Raw transactional data is noisy, complex, and uninformative in its raw state. Traditional BI dashboards are purely descriptive and static. Our system introduces an end-to-end intelligent pipeline that connects automated data cleaning, exploratory analysis, machine learning prediction, unsupervised anomaly detection, and grounded generative AI to provide prescriptive business recommendations."*

### Q2. How do you prevent data leakage in Machine Learning?
> *"Data leakage is prevented by enforcing strict chronological or holdout train/test partitioning prior to any preprocessing. All feature transformers—including `StandardScaler` for continuous numerical features and `OneHotEncoder` with `handle_unknown='ignore'` for categorical features—are fitted strictly on training observations and merely transformed on test sets. Furthermore, future target information is strictly excluded from feature matrices."*

### Q3. How does the AI avoid hallucinating business numbers?
> *"We implemented a two-tier grounded AI architecture. The user's query is first routed through an intent classification engine that dynamically triggers statistical pandas aggregations over the active dataset. The verified numerical facts are then passed into the AI reasoning context. Every number output by the assistant is grounded in verified calculations, guaranteeing zero factual hallucinations."*

### Q4. How are anomalies detected?
> *"We implement three complementary techniques:*
> 1. *Multivariate Isolation Forest: An unsupervised tree ensemble that isolates outliers by randomly partitioning feature dimensions.*
> 2. *Interquartile Range (IQR): Non-parametric bounding ($Q1 - 1.5 \times IQR$ to $Q3 + 1.5 \times IQR$).*
> 3. *Z-Score Analysis: Standardized normal distribution screening for observations with $|z| > 3.0$."*

### Q5. What is the purpose of the What-If Analysis module?
> *"What-If Analysis bridges predictive modeling with strategic executive decision-making. By allowing managers to adjust parameters such as promotional discounts or order quantities via interactive sliders, the trained regression model estimates the expected delta on operating profit before policies are implemented in the real world."*

---

## 11. Environment Configuration

Copy `.env.example` to `.env` if you wish to configure optional settings:

```ini
# Optional OpenAI Key for enhanced generative phrasing
OPENAI_API_KEY=
OPENAI_MODEL=gpt-3.5-turbo

# Server Configuration
PORT=8000
HOST=0.0.0.0
BACKEND_URL=http://localhost:8000
```

> **Note**: The application works completely without an API key using its built-in Statistical NLP Business Analyst engine.

---

## 12. License
This project is developed as an academic capstone for B.Tech Computer Science / Information Technology and is distributed under the MIT License.
