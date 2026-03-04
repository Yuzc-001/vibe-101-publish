@echo off
setlocal EnableExtensions

cd /d "%~dp0"

echo ======================================
echo   vibe-101-publish - Quick Start
echo ======================================
echo.

where node >nul 2>nul
if errorlevel 1 goto :NO_NODE

set "PKG_CMD=npm"
set "DEV_CMD=npm run dev -- --host 127.0.0.1 --port 5173"
where pnpm >nul 2>nul
if not errorlevel 1 (
  set "PKG_CMD=pnpm"
  set "DEV_CMD=pnpm dev --host 127.0.0.1 --port 5173"
)

if not exist "node_modules\\.bin\\vite.cmd" goto :INSTALL_DEPS
echo [1/3] Dependencies found, skip install.
goto :OPEN_BROWSER

:INSTALL_DEPS
echo [1/3] Installing dependencies...
call %PKG_CMD% install
if errorlevel 1 goto :INSTALL_FAILED

:OPEN_BROWSER
echo [2/3] Opening browser: http://127.0.0.1:5173/
start "" "http://127.0.0.1:5173/"

echo [3/3] Starting dev server...
echo Close this window to stop.
echo.
call %DEV_CMD%
goto :END

:NO_NODE
echo [ERROR] Node.js not found. Please install Node.js 18+ first:
echo https://nodejs.org/
pause
exit /b 1

:INSTALL_FAILED
echo [ERROR] Dependency install failed. Check network and retry.
pause
exit /b 1

:END
endlocal
