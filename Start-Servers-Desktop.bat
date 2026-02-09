@echo off
title Overdoze POS - Network Access Starter
color 0A
echo.
echo ========================================
echo   Overdoze POS Network Access Setup
echo ========================================
echo.

REM Set the project path (change this to your actual path)
set PROJECT_PATH=C:\Users\Earl Jann Rivera\OneDrive\Desktop\Manual

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/5] Finding your IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do set IP=%%a
set IP=%IP: =%
echo Your IP: %IP%

echo.
echo [2/5] Setting up firewall rules...
netsh advfirewall firewall delete rule name="Vite Dev Server" >nul 2>&1
netsh advfirewall firewall delete rule name="Backend API" >nul 2>&1
netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=5173 >nul 2>&1
netsh advfirewall firewall add rule name="Backend API" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
echo Firewall rules configured!

echo.
echo [3/5] Starting Backend Server...
cd /d "%PROJECT_PATH%\backend"
start "Backend Server" cmd /k "title Backend Server && echo Backend Server Starting... && npm run dev"

echo.
echo [4/5] Starting Frontend Server...
cd /d "%PROJECT_PATH%\frontend"
set VITE_API_URL=http://%IP%:3000/api
start "Frontend Server" cmd /k "title Frontend Server && echo Frontend Server Starting... && echo API URL: %VITE_API_URL% && npm run dev"

echo.
echo [5/5] Waiting for servers to start...
timeout /t 15 /nobreak >nul

echo.
echo ========================================
echo           SETUP COMPLETE!
echo ========================================
echo.
echo Access your application from other devices:
echo Frontend: http://%IP%:5173
echo Backend:  http://%IP%:3000
echo.
echo Local access:
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3000
echo.
echo Default login credentials:
echo Username: admin
echo Password: admin
echo.
echo Press any key to open the application in your browser...
pause >nul

start http://%IP%:5173

echo.
echo ========================================
echo   Servers are running in background
echo   Close this window to stop servers
echo ========================================
echo.
echo To stop all servers:
echo 1. Close this window
echo 2. Close the Backend Server window
echo 3. Close the Frontend Server window
echo.
echo Or run "Stop-Servers.bat" for automatic shutdown
echo.
pause
