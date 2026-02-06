# Overdoze POS - Client Setup Guide

## 📋 Requirements

### 1. **Node.js** (Required)
- Download from: https://nodejs.org/
- Version: 18.x or higher recommended
- Choose **LTS** (Long Term Support) version

### 2. **PostgreSQL** (Required for Database)
- Download from: https://www.postgresql.org/download/windows/
- Version: 14.x or higher recommended
- During installation, remember the password you set for the `postgres` user

## 🚀 Quick Setup (5-10 minutes)

### Step 1: Install Node.js
1. Go to https://nodejs.org/
2. Download and install the LTS version
3. Restart the computer after installation

### Step 2: Copy Project Files
1. Copy the entire `Manual` folder to the client's computer
2. Place it in a convenient location (e.g., `C:\OverdozePOS\`)

### Step 3: Install Dependencies
Open **Command Prompt** or **PowerShell** as Administrator and run:

```bash
# Navigate to project directory
cd C:\OverdozePOS\Manual

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ..\frontend
npm install

# Go back to root
cd ..
```

### Step 4: Database Setup
1. Install PostgreSQL if not already installed
2. Create a database named `overdoze_pos`
3. Update database connection in `backend/config/db.js` if needed

### Step 5: Start the Application
Simply **double-click** `Start-Servers.bat`

This will:
- Configure firewall automatically
- Start both backend and frontend servers
- Open the application in your browser
- Show network access URLs

## 🌐 Access the Application

**From the same computer:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

**From other devices on the same network:**
- Frontend: http://[COMPUTER_IP]:5173
- Backend: http://[COMPUTER_IP]:3000

**Default Login:**
- Username: `admin`
- Password: `admin`

## 🛑 Stop the Application
Double-click `Stop-Servers.bat` to stop all servers

## 🔧 Troubleshooting

### "Node.js is not installed" Error
- Install Node.js from https://nodejs.org/
- Restart computer after installation

### "Port already in use" Error
- Run `Stop-Servers.bat` first
- Then try `Start-Servers.bat` again

### Database Connection Error
- Make sure PostgreSQL is running
- Check database name and credentials in `backend/config/db.js`
- Ensure the database exists

### Firewall Issues
- Windows Firewall should be configured automatically
- If blocked, manually allow ports 3000 and 5173 through Windows Firewall

## 📁 Project Structure
```
Manual/
├── Start-Servers.bat     # Double-click to start
├── Stop-Servers.bat      # Double-click to stop
├── backend/              # Node.js backend server
│   ├── package.json
│   ├── server.js
│   └── ...
├── frontend/             # React frontend
│   ├── package.json
│   ├── vite.config.js
│   └── ...
└── documentation/       # Additional docs
```

## 🎯 What's Included

**No additional downloads needed** - everything is included:
- ✅ Complete POS system
- ✅ Database scripts
- ✅ Network access setup
- ✅ Auto-configuration scripts
- ✅ User documentation

**Only requirements:**
1. Node.js (for running the application)
2. PostgreSQL (for the database)

## 📞 Support
If issues arise:
1. Check the troubleshooting section above
2. Ensure both Node.js and PostgreSQL are properly installed
3. Verify network connectivity for multi-device access
