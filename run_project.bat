@echo off
echo ===================================================================
echo Launching Data Analytics with AI Integration (NexusAnalytics)...
echo ===================================================================

start "NexusAnalytics - FastAPI Backend (Port 8000)" cmd /k "cd %~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 3 /nobreak >nul
start "NexusAnalytics - React Frontend (Port 5173)" cmd /k "cd %~dp0frontend && npm run dev"

echo.
echo Both servers are starting!
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
pause
