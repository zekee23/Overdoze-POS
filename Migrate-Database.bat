@echo off
title Overdoze POS - Database Migration Tool
color 0B
echo.
echo ========================================
echo   Database Migration Tool
echo ========================================
echo.

REM Check if PostgreSQL tools are available
pg_dump --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PostgreSQL tools not found!
    echo Please install PostgreSQL and add it to PATH
    echo Or use pgAdmin for manual migration
    echo.
    pause
    exit /b 1
)

echo [1/5] Getting current database configuration...
REM Read from .env file or ask user
set /p CURRENT_HOST="Current database host (localhost): " || set CURRENT_HOST=localhost
set /p CURRENT_PORT="Current database port (5432): " || set CURRENT_PORT=5432
set /p CURRENT_DB="Current database name: "
set /p CURRENT_USER="Current database user (postgres): " || set CURRENT_USER=postgres

echo.
echo [2/5] Getting target database configuration...
set /p TARGET_HOST="Target database host: "
set /p TARGET_PORT="Target database port (5432): " || set TARGET_PORT=5432
set /p TARGET_DB="Target database name: "
set /p TARGET_USER="Target database user (postgres): " || set TARGET_USER=postgres

echo.
echo [3/5] Exporting current database...
set BACKUP_FILE=%TEMP%\overdoze_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.sql
echo Backup file: %BACKUP_FILE%

pg_dump -h %CURRENT_HOST% -p %CURRENT_PORT% -U %CURRENT_USER% -d %CURRENT_DB% > "%BACKUP_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Failed to export database!
    echo Check your database connection and credentials
    pause
    exit /b 1
)
echo ✅ Database exported successfully!

echo.
echo [4/5] Creating target database and importing...
REM Create target database
psql -h %TARGET_HOST% -p %TARGET_PORT% -U %TARGET_USER% -c "CREATE DATABASE %TARGET_DB%;" 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Database might already exist, continuing...
)

REM Import data
psql -h %TARGET_HOST% -p %TARGET_PORT% -U %TARGET_USER% -d %TARGET_DB% < "%BACKUP_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Failed to import database!
    echo Check target database connection and credentials
    pause
    exit /b 1
)
echo ✅ Database imported successfully!

echo.
echo [5/5] Updating application configuration...
REM Create new .env file for target
echo DB_HOST=%TARGET_HOST% > .env.new
echo DB_PORT=%TARGET_PORT% >> .env.new
echo DB_NAME=%TARGET_DB% >> .env.new
echo DB_USER=%TARGET_USER% >> .env.new
echo DB_PASSWORD=your_password_here >> .env.new

echo ✅ Configuration file created: .env.new
echo Please edit .env.new and set the correct DB_PASSWORD

echo.
echo ========================================
echo     MIGRATION COMPLETED!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env.new and set the correct database password
echo 2. Rename .env.new to .env (backup old .env first)
echo 3. Test the application with: Start-Servers.bat
echo.
echo Backup file location: %BACKUP_FILE%
echo.
pause
