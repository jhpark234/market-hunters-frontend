@echo off

start cmd /k "cd /d E:\MarketHunters_safe_GOOD\backend && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

timeout /t 2 > nul

start cmd /k "cd /d E:\MarketHunters_safe_GOOD\frontend && python -m http.server 5500"

echo All servers started!
pause