@echo off
setlocal

cd /d "%~dp0"

set "TOOLBELT=C:\Users\Rodion\codex-agent\apps\agent-windows\dist\codex-toolbelt.js"
set "USE_TOOLBELT=0"
if not defined PORT set "PORT=5173"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found in PATH.
  echo Install Node.js 22+ and run this file again.
  pause
  exit /b 1
)

echo.
echo === Velocity Rift dev launcher ===
echo Project: %CD%
echo URL: http://127.0.0.1:%PORT%/
echo.

if exist "%TOOLBELT%" (
  echo Checking local agent environment...
  node "%TOOLBELT%" doctor >nul 2>nul
  if errorlevel 1 (
    echo Toolbelt is not usable from this shell, using npm.cmd fallback.
  ) else (
    echo Toolbelt ready.
    set "USE_TOOLBELT=1"
  )
) else (
  echo Toolbelt not found, using npm.cmd fallback.
)

if not exist "node_modules\phaser\dist\phaser.min.js" (
  echo.
  echo Installing dependencies...
  if "%USE_TOOLBELT%"=="1" (
    node "%TOOLBELT%" npm -- install
  ) else (
    call npm.cmd install
  )
  if errorlevel 1 (
    echo Dependency install failed.
    pause
    exit /b 1
  )
)

echo.
echo Building project...
if "%USE_TOOLBELT%"=="1" (
  node "%TOOLBELT%" npm -- run build
) else (
  call npm.cmd run build
)
if errorlevel 1 (
  echo Build failed.
  pause
  exit /b 1
)

if /I "%~1"=="--no-server" (
  echo Build complete. Server start skipped.
  exit /b 0
)

echo.
echo Starting server. Close this window or press Ctrl+C to stop.
echo.
start "" "http://127.0.0.1:%PORT%/"
node scripts\serve.mjs

endlocal
