@echo off
title Overdoze POS - Stop Servers
color 0C
echo.
echo ========================================
echo     Overdoze POS Stop Servers
echo ========================================
echo.

echo [1/4] Stopping Backend Server (port 3000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    echo Killing process %%a...
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo [2/4] Stopping Frontend Server (port 5173)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173"') do (
    echo Killing process %%a...
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo [3/4] Stopping any remaining Node.js processes...
taskkill /f /im node.exe /fi "windowtitle eq Backend Server*" >nul 2>&1
taskkill /f /im node.exe /fi "windowtitle eq Frontend Server*" >nul 2>&1
echo Additional Node.js processes stopped

echo.
echo [4/4] Removing firewall rules...
netsh advfirewall firewall delete rule name="Vite Dev Server" >nul 2>&1
netsh advfirewall firewall delete rule name="Backend API" >nul 2>&1
echo Firewall rules removed!

echo.
echo ========================================
echo        ALL SERVERS STOPPED
echo ========================================
echo.
echo All servers have been stopped successfully.
echo.
pause
