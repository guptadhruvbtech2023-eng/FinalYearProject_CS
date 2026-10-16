import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Base Directories
BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent
DATA_DIR = BACKEND_DIR / "uploads"
MODELS_DIR = BACKEND_DIR / "models_cache"
REPORTS_DIR = BACKEND_DIR / "reports"

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Look for default superstore.csv
DEFAULT_DATASET_PATH = None
candidates = [
    ROOT_DIR / "superstore.csv",
    DATA_DIR / "superstore.csv",
    ROOT_DIR / "Superstore.csv"
]
for candidate in candidates:
    if candidate.exists():
        DEFAULT_DATASET_PATH = candidate
        break

class Settings(BaseSettings):
    PROJECT_NAME: str = "Data Analytics with AI Integration"
    VERSION: str = "1.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    
    # AI LLM Keys
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    
    # Directories
    DATA_DIR: Path = DATA_DIR
    MODELS_DIR: Path = MODELS_DIR
    REPORTS_DIR: Path = REPORTS_DIR
    DEFAULT_DATASET: Path | None = DEFAULT_DATASET_PATH

    class Config:
        env_file = [str(BACKEND_DIR / ".env"), str(ROOT_DIR / ".env")]
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
