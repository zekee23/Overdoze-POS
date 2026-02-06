@echo off
title Overdoze POS Network Diagnostic
color 0A

echo.
echo ========================================
echo   Overdoze POS Network Diagnostic
echo ========================================
echo.

echo [1] IP Address Information:
echo Localhost: 127.0.0.1
echo Network IPs:
ipconfig | findstr "IPv4" | findstr /V "127.0.0.1"
echo.

echo [2] Server Status:
echo Checking port 3000 (Backend)...
netstat -an | findstr ":3000" | findstr "LISTENING"
if %errorlevel% equ 0 (
    echo ✓ Backend server is running on port 3000
) else (
    echo ✗ Backend server is NOT running on port 3000
)

echo.
echo Checking port 5173 (Frontend)...
netstat -an | findstr ":5173" | findstr "LISTENING"
if %errorlevel% equ 0 (
    echo ✓ Frontend server is running on port 5173
) else (
    echo ✗ Frontend server is NOT running on port 5173
)
echo.

echo [3] Firewall Status:
echo Checking Windows Firewall rules...
netsh advfirewall firewall show rule name="Vite Dev Server" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Vite Dev Server firewall rule exists
) else (
    echo ✗ Vite Dev Server firewall rule NOT found
)

netsh advfirewall firewall show rule name="Backend API" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend API firewall rule exists
) else (
    echo ✗ Backend API firewall rule NOT found
)
echo.

echo [4] Connectivity Tests:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do set IP=%%a
set IP=%IP: =%

if defined IP (
    echo Testing connectivity to %IP%...
    
    echo Testing backend...
    curl -s --connect-timeout 3 "http://%IP%:3000" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✓ Backend accessible from network
    ) else (
        echo ✗ Backend NOT accessible from network
    )
    
    echo Testing frontend...
    curl -s --connect-timeout 3 "http://%IP%:5173" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✓ Frontend accessible from network
    ) else (
        echo ✗ Frontend NOT accessible from network
    )
) else (
    echo Could not determine network IP for testing
)
echo.

echo [5] Running Node.js Processes:
tasklist | findstr "node.exe"
echo.

echo ========================================
echo         Diagnostic Complete
echo ========================================
echo.
echo If servers are running but not accessible:
echo 1. Check Windows Firewall settings
echo 2. Ensure servers are bound to 0.0.0.0 (not 127.0.0.1)
echo 3. Try disabling firewall temporarily for testing
echo 4. Check if devices are on the same network
echo.
echo Access URLs:
if defined IP (
    echo Frontend: http://%IP%:5173
    echo Backend:  http://%IP%:3000
)
echo Local:    http://localhost:5173
echo.
pause
