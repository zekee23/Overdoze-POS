# Overdoze POS - Easy Network Access Guide

## For Non-Technical Users

### Quick Start (Double-Click Method)

#### To Start the Application:
1. **Double-click** the file: `Start-Network-Access.bat`
2. **Wait** for the setup to complete (about 30 seconds)
3. **Note** your IP address shown in the window
4. The application will open automatically in your browser

#### To Stop the Application:
1. **Double-click** the file: `Stop-Servers.bat`
2. All servers will stop automatically

---

## Access from Other Devices

### From Phones/Tablets:
1. Connect to the **same WiFi** as the computer
2. Open browser and go to: `http://[YOUR_IP]:5173`
   - Replace `[YOUR_IP]` with the IP shown in the setup window
   - Example: `http://192.168.1.6:5173`

### From Other Computers:
1. Connect to the **same network**
2. Open browser and go to: `http://[YOUR_IP]:5173`

---

## Default Login
- **Username**: `admin`
- **Password**: `admin`

---

## What Happens When You Run It?

The `Start-Network-Access.bat` file automatically:
1. ✅ Checks if Node.js is installed
2. ✅ Finds your computer's IP address
3. ✅ Sets up firewall permissions
4. ✅ Starts the backend server
5. ✅ Starts the frontend server
6. ✅ Opens the application in your browser

---

## Troubleshooting

### "Node.js is not installed" Error:
1. Download Node.js from: https://nodejs.org/
2. Install it (click Next, Next, Finish)
3. Try running the batch file again

### "Cannot access from phone" Issue:
1. **Check WiFi**: Make sure phone and computer use same WiFi
2. **Check IP**: Use the exact IP shown in setup window
3. **Try incognito**: Open browser in private/incognito mode
4. **Restart**: Stop servers and start again

### "Application not loading" Issue:
1. **Wait longer**: Sometimes takes 1-2 minutes to fully start
2. **Check windows**: Make sure server windows didn't close
3. **Restart computer**: If nothing works, restart and try again

---

## Important Notes

⚠️ **Security**: This setup is for local network use only. Do not expose to internet.

📱 **Same Network Required**: All devices must be connected to the same WiFi/network.

🔋 **Keep Running**: Keep the batch file windows open while using the application.

💾 **Auto-saves**: All your data is automatically saved in the database.

---

## Advanced Options (Optional)

### Change Default Login:
Contact your administrator to change the default username and password.

### Different Port Numbers:
If ports 3000 or 5173 are blocked, contact technical support to change them.

---

## Need Help?

If you encounter any issues:
1. Try stopping and restarting the servers
2. Check that all devices are on the same WiFi
3. Make sure Node.js is properly installed
4. Contact your technical support team

---

## File Summary

- `Start-Network-Access.bat` - Double-click to start everything
- `Stop-Servers.bat` - Double-click to stop everything  
- `USER_GUIDE.md` - This guide file

That's it! Just double-click and start using your POS system.
