@echo off
echo ========================================================
echo Starting NexusAnalytics FastAPI Backend on Port 8000...
echo ========================================================
cd %~dp0backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
