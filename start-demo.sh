#!/bin/bash

# Display ASCII art banner
echo ""
echo "██╗  ██╗██████╗  ██████╗    ██╗    ██╗ █████╗ ███████╗██╗   ██╗██╗  ██╗"
echo "██║  ██║██╔══██╗██╔════╝    ██║    ██║██╔══██╗╚══███╔╝██║   ██║██║  ██║"
echo "███████║██████╔╝██║         ██║ █╗ ██║███████║  ███╔╝ ██║   ██║███████║"
echo "██╔══██║██╔═══╝ ██║         ██║███╗██║██╔══██║ ███╔╝  ██║   ██║██╔══██║"
echo "██║  ██║██║     ╚██████╗    ╚███╔███╔╝██║  ██║███████╗╚██████╔╝██║  ██║"
echo "╚═╝  ╚═╝╚═╝      ╚═════╝     ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝"
echo "                                                                         "
echo "                 Security Compliance Framework Demo                      "
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  echo "Error: npm is not installed. Please install Node.js and npm first."
  exit 1
fi

# Check if the package.json exists
if [ ! -f "package.json" ]; then
  echo "Error: package.json not found. Make sure you're in the correct directory."
  exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

# Check if server/package.json exists
if [ ! -f "server/package.json" ]; then
  echo "Error: server/package.json not found. The server directory might be missing."
  exit 1
fi

# Install server dependencies if server/node_modules doesn't exist
if [ ! -d "server/node_modules" ]; then
  echo "Installing backend dependencies..."
  cd server && npm install && cd ..
fi

# Start the application
echo "Starting the HPC Security Compliance Framework Demo..."
echo "The application will be available at:"
echo "  Frontend: http://localhost:5173"
echo "  Backend API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop the servers."
echo ""
echo "NOTE: If you encounter issues with the Wazuh integration, ensure both servers are running."
echo "      You can start them manually with:"
echo "      - Backend: cd server && node server.js"
echo "      - Frontend: npm run dev"
echo ""

# Run the dev:all script which starts both frontend and backend
npm run dev:all 