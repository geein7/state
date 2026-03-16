@echo off
echo 한국 주식 차트 서버 시작 중...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
