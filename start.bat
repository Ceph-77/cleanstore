@echo off
echo Demarrage de KLEAN'STOR...

start "KLEAN'STOR - Backend" cmd /k "cd /d %~dp0backend && npm run dev"
start "KLEAN'STOR - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Deux fenetres se sont ouvertes (backend + frontend).
echo Laisse-les ouvertes, puis va sur http://localhost:5173
pause
