@echo off
echo ========================================
echo Overdoze POS - Remote Update Script
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Stop existing servers
echo Stopping existing servers...
call Stop-Servers.bat >nul 2>&1
timeout /t 2 >nul

:: Backup current version
echo Creating backup...
if not exist "backups" mkdir backups
set "backup_file=backups\overdoze_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%.zip"
powershell -command "Compress-Archive -Path * -DestinationPath '%backup_file%' -Force"

:: Download latest code from GitHub
echo Downloading latest code from GitHub...
:: Replace with your GitHub repository URL
set "GITHUB_REPO=https://github.com/yourusername/overdoze-pos"
set "RELEASE_URL=%GITHUB_REPO%/releases/latest/download/overdoze-pos.zip"

powershell -command "Invoke-WebRequest -Uri '%RELEASE_URL%' -OutFile 'latest_update.zip'"

:: Extract and replace files
echo Extracting update...
powershell -command "Expand-Archive -Path 'latest_update.zip' -DestinationPath '.' -Force"

:: Clean up
del latest_update.zip

:: Install/update dependencies
echo Installing dependencies...
cd backend
call npm install
cd ..\frontend
call npm install
cd ..

:: Restart servers
echo Restarting servers...
call Start-Servers.bat

echo.
echo ========================================
echo Update completed successfully!
echo ========================================
echo.
echo The application has been updated and restarted.
echo You can now access it at: http://localhost:5173
echo.
pause
