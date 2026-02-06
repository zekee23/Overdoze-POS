# Network Access Setup for Overdoze POS

This guide helps you start the Overdoze POS servers so they can be accessed from other devices on your network.

## Quick Start

### For Windows Users
Use the existing batch file:
```cmd
Start-Network-Access.bat
```

### For Linux/macOS Users
Use the new bash scripts:
```bash
# Make scripts executable (run once)
chmod +x start-network-access.sh stop-servers.sh

# Start servers for network access
./start-network-access.sh

# Stop servers (optional)
./stop-servers.sh
```

## What the Scripts Do

### Network Setup
- **Finds your IP address** automatically
- **Configures firewall** rules for ports 3000 (backend) and 5173 (frontend)
- **Starts both servers** in the background
- **Provides access URLs** for both local and network access

### Server Configuration
- **Backend**: Runs on port 3000 with network binding (0.0.0.0)
- **Frontend**: Runs on port 5173 with network binding (0.0.0.0)
- **CORS**: Configured to accept requests from your network IP

## Access URLs

After running the startup script, you can access the application from:

### From Other Devices on Your Network
- **Frontend**: `http://YOUR_IP:5173`
- **Backend API**: `http://YOUR_IP:3000`

### From This Computer
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`

## Default Login
- **Username**: `admin`
- **Password**: `admin`

## Troubleshooting

### Firewall Issues
If you can't access from other devices:
1. **Windows**: Check Windows Firewall settings
2. **Linux**: Ensure `ufw` or `firewalld` allows ports 3000 and 5173
3. **macOS**: Check System Preferences > Security & Privacy > Firewall

### Port Already in Use
If ports are already in use:
```bash
# Find what's using the ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :5173

# Or use lsof
lsof -i :3000
lsof -i :5173
```

### IP Address Issues
If the automatic IP detection doesn't work:
1. Find your IP manually:
   - **Windows**: `ipconfig` (look for IPv4 Address)
   - **Linux**: `ip addr show` or `hostname -I`
   - **macOS**: `ifconfig` or `ipconfig getifaddr en0`

2. Update the script or use the manual IP in your browser

## Manual Server Startup

If the scripts don't work, you can start servers manually:

### Backend
```bash
cd backend
npm run dev
```

### Frontend
```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

## Security Notes

- These scripts open ports for network access
- Only use on trusted networks
- Consider changing default credentials
- Review firewall rules for production use

## File Structure

```
Manual/
├── Start-Network-Access.bat    # Windows startup script
├── start-network-access.sh     # Linux/macOS startup script
├── stop-servers.sh             # Linux/macOS stop script
├── backend/
│   ├── server.js               # Backend server
│   └── package.json
├── frontend/
│   ├── vite.config.js          # Vite configuration
│   └── package.json
└── NETWORK_SETUP_README.md     # This file
```
