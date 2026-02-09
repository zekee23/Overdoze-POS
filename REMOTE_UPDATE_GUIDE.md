# Overdoze POS - Remote Update Guide

This guide provides multiple ways to update your client's POS system remotely without visiting the store.

## Option 1: GitHub Releases (Recommended)

### Setup Steps (One-time)

1. **Create GitHub repository** for your project
2. **Push your code** to GitHub
3. **Create releases** with zip files

### GitHub Release Process

1. **Create a release** on GitHub:
   - Go to your repository → Releases → "Create a new release"
   - Tag version (e.g., v1.0.0)
   - Upload your project as `overdoze-pos.zip`
   - Publish release

2. **Update script** with your repository URL:
   ```batch
   set "GITHUB_REPO=https://github.com/yourusername/your-repo"
   ```

### Update Script for Client

Create `Update-App.bat` on the client's computer:

```batch
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
```

### GitHub Benefits

- ✅ **Version control** - Track all changes
- ✅ **Automatic releases** - Client always gets latest version
- ✅ **No storage limits** - GitHub handles file hosting
- ✅ **Professional setup** - Easy to manage multiple clients
- ✅ **Rollback capability** - Can revert to previous versions

### Update Workflow with GitHub

1. **Make changes** to your code locally
2. **Test thoroughly** on your machine
3. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "Update: feature description"
   git push origin main
   ```
4. **Create new release** on GitHub:
   - Go to Releases → "Create a new release"
   - Tag new version (v1.0.1, v1.0.2, etc.)
   - Upload updated `overdoze-pos.zip`
5. **Notify client**: "Please run Update-App.bat"

### Client Instructions

Tell your client:
1. "Save this `Update-App.bat` file in your Manual folder"
2. "When I say there's an update, just double-click it"
3. "It will automatically download the latest version from GitHub"
4. "Your old version is backed up automatically"

## Option 2: Direct Download (No Git Required)

### Setup Steps (One-time)

1. **Create a cloud storage share** (Google Drive, Dropbox, OneDrive)
2. **Upload your project files** to a zip file
3. **Share the download link** with your client

### Update Script for Client

Create `Update-App.bat` on the client's computer:

```batch
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

:: Download latest code (replace with your download URL)
echo Downloading latest code...
:: Option A: From cloud storage (no Git needed)
powershell -command "Invoke-WebRequest -Uri 'YOUR_DOWNLOAD_LINK_HERE' -OutFile 'latest_update.zip'"

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
```

## Option 2: Simple File Replacement

### For Small Updates

1. **Create a zip file** with only the changed files
2. **Send to client** via email/cloud storage
3. **Client extracts** over existing files
4. **Client runs** `Start-Servers.bat`

### Update Script for Small Changes

```batch
@echo off
echo Updating specific files...
echo.

:: Stop servers
call Stop-Servers.bat >nul 2>&1

:: Extract update files (client places update.zip in project folder)
powershell -command "Expand-Archive -Path 'update.zip' -DestinationPath '.' -Force"

:: Restart servers
call Start-Servers.bat

echo Update completed!
pause
```

## Option 3: USB Drive Update

### Physical but Remote

1. **Mail a USB drive** with updated files
2. **Client copies** files to computer
3. **Client runs** update script

## Option 4: Remote Desktop (Advanced)

### Using Windows Remote Desktop

1. **Set up Remote Desktop** on client computer
2. **Connect remotely** to update files
3. **Requires Windows Pro** and network configuration

## Recommended Setup

### For Your Client

1. **Create this update script** as `Update-App.bat`
2. **Test it once** to ensure it works
3. **Instruct client** to run it when you send updates

### Update Process

1. **Make your changes** locally
2. **Create zip file** of entire project
3. **Upload to cloud storage** and get shareable link
4. **Update the script** with your download link
5. **Send script to client** (one-time setup)
6. **For future updates**, just update the cloud storage file

### Client Instructions

Tell your client:
1. "When I send you an update email, just double-click `Update-App.bat`"
2. "The script will backup your current version automatically"
3. "It will download and install the latest updates"
4. "The app will restart automatically"

## Security Notes

- **Always backup** before updating (script does this automatically)
- **Test updates** on your machine first
- **Use secure cloud storage** with password protection if needed
- **Keep a copy** of the client's database backup

## Troubleshooting

### Download Fails
- Check internet connection
- Verify download link is accessible
- Try downloading manually first

### Extraction Fails
- Ensure zip file is not corrupted
- Check for antivirus blocking

### Server Won't Start
- Check Node.js installation
- Verify ports 3000 and 5173 are available
- Run `Stop-Servers.bat` first, then try again
