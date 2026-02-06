# Network Access Setup Documentation

## Overview
This documentation explains how to configure your Vite frontend and Express backend to be accessible from other devices on the same network.

## Prerequisites
- All devices must be connected to the same WiFi/network
- Windows Firewall permissions may be required
- Backend and frontend must be running

## Step 1: Find Your Local IP Address
```bash
ipconfig | findstr "IPv4"
```
Note your IP address (e.g., `192.168.1.6`)

## Step 2: Configure Vite Frontend for Network Access

### File: `frontend/vite.config.js`
Add these configurations to the server section:

```javascript
server: {
  host: '0.0.0.0', // Allow access from any IP on the network
  port: 5173, // Specify port or let Vite choose
  hmr: {
    overlay: true,
  },
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
  },
  fs: {
    strict: false
  }
},
```

## Step 3: Configure Express Backend for Network Access

### File: `backend/server.js`

### 3.1 Update CORS Configuration
Replace the existing CORS middleware:

```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://0.0.0.0:5173', /^http:\/\/192\.168\.\d+\.\d+:5173$/, /^http:\/\/10\.\d+\.\d+\.\d+:5173$/],
  credentials: true
}));
```

### 3.2 Update Server Listen
Replace the existing app.listen:

```javascript
app.listen(PORT, '0.0.0.0', () => {
    console.log("Server is running on port " + PORT);
    console.log("Accessible at: http://192.168.1.6:" + PORT);
});
```

## Step 4: Configure Frontend API Connection

### File: `frontend/src/utils/api.js`
Update the baseURL to use your network IP:

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.1.6:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Step 5: Environment Configuration

### File: `.env` (in root directory)
Add the API URL:

```bash
VITE_API_URL=http://192.168.1.6:3000/api
```

## Step 6: Firewall Configuration

### Allow Vite Dev Server
```bash
netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=5173
```

### Allow Backend Server
```bash
netsh advfirewall firewall add rule name="Backend API" dir=in action=allow protocol=TCP localport=3000
```

## Step 7: Start Both Services

### Start Backend
```bash
cd backend
npm run dev
```

### Start Frontend
```bash
cd frontend
npm run dev
```

## Step 8: Access from Other Devices

### Frontend Access
- **Local**: `http://localhost:5173`
- **Network**: `http://192.168.1.6:5173` (replace with your IP)

### Backend Access
- **Local**: `http://localhost:3000`
- **Network**: `http://192.168.1.6:3000` (replace with your IP)

## Testing the Setup

### 1. Test Backend Directly
Open `http://192.168.1.6:3000` in browser - should show "Cannot GET /" error

### 2. Test Frontend
Open `http://192.168.1.6:5173` in browser - should load the application

### 3. Test API Connection
Try logging in with valid credentials to verify frontend-backend communication

## Troubleshooting

### Issue: Frontend loads but authentication fails
**Solution**: Verify the API baseURL in `frontend/src/utils/api.js` uses your network IP

### Issue: Cannot reach backend from other devices
**Solution**: 
1. Ensure backend is listening on `0.0.0.0`
2. Check firewall rules
3. Verify both devices are on same network

### Issue: CORS errors
**Solution**: Ensure CORS configuration includes your network IP range

### Issue: Port already in use
**Solution**: 
1. Change ports in configuration
2. Kill processes using the ports:
   ```bash
   netstat -ano | findstr ":3000"
   taskkill /PID <PID> /F
   ```

## Security Notes

- This setup is for development only
- `0.0.0.0` allows access from any device on your network
- Consider using a VPN for remote development
- Disable network access when not needed

## Reverting Changes

To restore localhost-only access:

1. Remove `host: '0.0.0.0'` from Vite config
2. Change `app.listen(PORT, '0.0.0.0')` back to `app.listen(PORT)`
3. Update CORS to only allow `http://localhost:5173`
4. Change API baseURL back to `http://localhost:3000/api`
5. Remove firewall rules if needed

## Quick Commands Summary

```bash
# Find IP
ipconfig | findstr "IPv4"

# Add firewall rules
netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="Backend API" dir=in action=allow protocol=TCP localport=3000

# Start services
cd backend && npm run dev
cd frontend && npm run dev

# Test from other device
http://192.168.1.6:5173
```

Replace `192.168.1.6` with your actual IP address throughout this documentation.
