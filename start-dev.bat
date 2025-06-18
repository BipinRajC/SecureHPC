@echo off
echo Starting HPE Security Framework Dev Environment...

echo Starting backend server...
start cmd /k "cd ../../server && node server.js"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak > nul

echo Starting frontend development server...
start cmd /k "npm run dev"

echo Dev environment started!
echo Backend: http://localhost:3001/api
echo Frontend: http://localhost:5173

echo Press any key to exit this window...
pause > nul 