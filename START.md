# HPE Security Framework - Getting Started

## Starting the Application

### Option 1: Using the Batch File (Recommended for Windows)
Simply double-click the `start-dev.bat` file in this directory. This will:
- Start the backend server
- Start the frontend development server
- Open new command windows for each process

### Option 2: Starting Manually in PowerShell

#### Start the Backend Server
```powershell
cd ../../server
node server.js
```

#### Start the Frontend Server (in a new PowerShell window)
```powershell
cd wazuh-working/wazuh-isolated
npm run dev
```

### Option 3: Starting Manually in Command Prompt

#### Start the Backend Server
```cmd
cd server
start-server.cmd
```

#### Start the Frontend Server
```cmd
cd wazuh-working\wazuh-isolated
npm run dev
```

## Accessing the Application
- Backend API: http://localhost:3001/api
- Frontend: http://localhost:5173

## Troubleshooting
- If you see "Port already in use" errors, make sure to close any existing node processes
- Check both console windows for error messages
- The server has been configured to automatically try alternative ports if the default is in use 