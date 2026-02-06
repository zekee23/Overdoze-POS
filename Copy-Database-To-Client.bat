@echo off
title Overdoze POS - Copy Database to Client
color 0E
echo.
echo ========================================
echo   Copy Database to Client's Server
echo ========================================
echo.

echo This script will:
echo 1. Export your current database
echo 2. Create a portable backup file
echo 3. Give you instructions for client setup
echo.

REM Get current database info
set /p CURRENT_DB="Your current database name (overdoze_pos): " || set CURRENT_DB=overdoze_pos
set /p CURRENT_USER="Your database user (postgres): " || set CURRENT_USER=postgres

echo.
echo [1/3] Finding PostgreSQL installation...

REM Check common PostgreSQL installation paths
set PG_PATH=""
if exist "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" set PG_PATH=C:\Program Files\PostgreSQL\16\bin
if exist "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" set PG_PATH=C:\Program Files\PostgreSQL\15\bin
if exist "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe" set PG_PATH=C:\Program Files\PostgreSQL\14\bin
if exist "C:\Program Files\PostgreSQL\13\bin\pg_dump.exe" set PG_PATH=C:\Program Files\PostgreSQL\13\bin

if "%PG_PATH%"=="" (
    echo [ERROR] PostgreSQL not found in common locations!
    echo Please install PostgreSQL or specify the path manually
    echo Common locations checked:
    echo - C:\Program Files\PostgreSQL\16\bin
    echo - C:\Program Files\PostgreSQL\15\bin
    echo - C:\Program Files\PostgreSQL\14\bin
    echo.
    set /p PG_PATH="Enter PostgreSQL bin path (e.g., C:\Program Files\PostgreSQL\16\bin): "
    if not exist "%PG_PATH%\pg_dump.exe" (
        echo [ERROR] pg_dump.exe not found in: %PG_PATH%
        pause
        exit /b 1
    )
)

echo ✅ PostgreSQL found at: %PG_PATH%

echo.
echo Exporting your database...

REM Create backup filename with timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"

set BACKUP_FILE=overdoze_database_backup_%timestamp%.sql
echo Backup file: %BACKUP_FILE%

REM Export the database using full path
"%PG_PATH%\pg_dump" -h localhost -U %CURRENT_USER% -d %CURRENT_DB% > "%BACKUP_FILE%" 2>error.log
if %errorlevel% neq 0 (
    echo [ERROR] Failed to export database!
    echo Check error.log for details
    echo Common issues:
    echo - PostgreSQL not running
    echo - Wrong database name or user
    echo - Password required
    echo.
    type error.log
    pause
    exit /b 1
)

echo ✅ Database exported successfully!
echo File size: 
dir "%BACKUP_FILE%" | findstr "%BACKUP_FILE%"

echo.
echo [2/3] Creating client setup package...

REM Create instructions file
echo # Database Setup Instructions for Client > client_database_setup.txt
echo. >> client_database_setup.txt
echo ## Quick Setup Steps >> client_database_setup.txt
echo. >> client_database_setup.txt
echo 1. Install PostgreSQL on client computer >> client_database_setup.txt
echo 2. Create database named "overdoze_pos" >> client_database_setup.txt
echo 3. Run this command to import: >> client_database_setup.txt
echo    psql -U postgres -d overdoze_pos -f %BACKUP_FILE% >> client_database_setup.txt
echo. >> client_database_setup.txt
echo ## Alternative with pgAdmin: >> client_database_setup.txt
echo 1. Open pgAdmin >> client_database_setup.txt
echo 2. Create new database "overdoze_pos" >> client_database_setup.txt
echo 3. Right-click database >> client_database_setup.txt
echo 4. Select "Restore" >> client_database_setup.txt
echo 5. Choose %BACKUP_FILE% >> client_database_setup.txt
echo 6. Click Restore >> client_database_setup.txt
echo. >> client_database_setup.txt
echo ## After Import: >> client_database_setup.txt
echo - Update .env file with database credentials >> client_database_setup.txt
echo - Test with Start-Servers.bat >> client_database_setup.txt

echo ✅ Client instructions created!

echo.
echo [3/3] Package ready for client!
echo.
echo ========================================
echo     FILES TO GIVE TO CLIENT:
echo ========================================
echo.
echo 📦 Main Package:
echo    - Copy the entire "Manual" folder
echo.
echo 📄 Database Files:
echo    - %BACKUP_FILE% (your database backup)
echo    - client_database_setup.txt (setup instructions)
echo.
echo ========================================
echo     CLIENT SETUP SUMMARY:
echo ========================================
echo.
echo 1. Client installs PostgreSQL
echo 2. Client creates database "overdoze_pos"
echo 3. Client imports %BACKUP_FILE%
echo 4. Client updates .env file
echo 5. Client runs Start-Servers.bat
echo.
echo 📁 Your backup file is ready: %BACKUP_FILE%
echo 📝 Instructions saved: client_database_setup.txt
echo.
echo Press any key to open the folder with your files...
pause >nul
explorer .
echo.
echo Done! Give the backup file and instructions to your client.
pause
