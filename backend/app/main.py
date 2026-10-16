import sys
from pathlib import Path
from contextlib import asynccontextmanager

# Ensure root and backend directories are in sys.path
backend_dir = Path(__file__).resolve().parent.parent
root_dir = backend_dir.parent
for p in [str(root_dir), str(backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.config import settings
from backend.app.services.data_service import data_service
from backend.app.api.data_routes import router as data_router
from backend.app.api.analytics_routes import router as analytics_router
from backend.app.api.ml_routes import router as ml_router
from backend.app.api.anomaly_routes import router as anomaly_router
from backend.app.api.ai_routes import router as ai_router
from backend.app.api.whatif_routes import router as whatif_router
from backend.app.api.report_routes import router as report_router

# Ensure UTF-8 stdout on Windows
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Auto-load default dataset if available
    print("[INFO] Initializing Business Analytics & AI Platform...")
    data_service.initialize()
    yield
    print("[INFO] Shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Business Analytics & Machine Learning Platform with Explainable AI and Generative AI Grounding.",
    lifespan=lifespan
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler to prevent raw unhandled crash traces
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": str(exc), "path": request.url.path}
    )

# Register Sub-Routers
app.include_router(data_router)
app.include_router(analytics_router)
app.include_router(ml_router)
app.include_router(anomaly_router)
app.include_router(ai_router)
app.include_router(whatif_router)
app.include_router(report_router)

@app.get("/")
def health_check():
    profile = data_service.get_profile()
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "dataset_loaded": profile.get("status") == "ready",
        "dataset_name": data_service.filename,
        "rows": profile.get("total_rows", 0),
        "columns": profile.get("total_columns", 0),
        "is_demo": data_service.is_demo
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
