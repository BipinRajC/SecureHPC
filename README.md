# HPC Security Compliance Framework

A comprehensive security compliance tool designed for High Performance Computing environments.

## Features

- Security tool integrations (Lynis, OpenSCAP, Wazuh, etc.)
- Compliance framework mapping
- Scheduled security assessments
- Security posture visualization
- Historical data tracking
- Real-time vulnerability monitoring
- Customizable compliance frameworks
- Dashboard for security insights

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Lynis installed on the system (for Lynis integration)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-repo/hpc-security-compliance-framework.git
cd hpc-security-compliance-framework
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd server
npm install
cd ..
```

## Running the Application

### Development Mode

1. Start the backend server:
```bash
cd server
npm run dev
```

2. In a separate terminal, start the frontend:
```bash
npm run dev
```

3. Or run both concurrently:
```bash
npm run dev:all
```

The frontend will be available at http://localhost:5173 by default.
The backend API will be available at http://localhost:3001.

### Production Build

1. Build the frontend:
```bash
npm run build
```

2. Start the backend server:
```bash
cd server
npm start
```

## Project Structure

```
├── public/              # Static files
├── server/              # Express backend
├── src/                 # Frontend source code
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Reusable React components
│   ├── context/         # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── store/           # State management (Zustand)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main App component
│   └── main.tsx         # Application entry point
├── .gitignore           # Git ignore file
├── index.html           # HTML entry point
├── package.json         # Project dependencies
├── postcss.config.js    # PostCSS configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## Lynis Integration

The Lynis security tool integration requires Lynis to be installed on your system. When you click the "Run" button for Lynis in the Tool Integrations page, the application will:

1. Execute the Lynis audit in the background
2. Generate a JSON report
3. Make the results available in the application interface

### Installing Lynis

#### Debian/Ubuntu:
```bash
sudo apt-get update
sudo apt-get install lynis
```

#### RHEL/CentOS:
```bash
sudo yum install epel-release
sudo yum install lynis
```

#### macOS:
```bash
brew install lynis
```

## Wazuh Integration

The Wazuh integration allows you to connect to a Wazuh server and view agent information, hardware details, and security compliance results.

### Getting Started with Wazuh Demo

1. Start both the frontend and backend:
```bash
npm run dev:all
```

2. Navigate to the Tool Integrations page and click "Configure" for the Wazuh tool.

3. Enter your Wazuh API credentials:
   - API URL: The URL of your Wazuh server (default: https://10.108.206.16:55000)
   - Username: Your Wazuh API username (default: wazuh)
   - Password: Your Wazuh API password

4. Click "Connect & Configure" to authenticate with the Wazuh API.

5. Once connected, you will be redirected to the Wazuh Dashboard where you can view:
   - Agent information
   - Compliance status (PCI-DSS, HIPAA, GDPR, NIST)
   - System hardware details
   - Security Configuration Assessment (SCA) results

### Troubleshooting

If you encounter connection issues:
- Ensure your Wazuh server is running and accessible
- Verify API credentials are correct
- Check that the backend server is running on port 3001
- Look for error messages in the browser console or server logs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT 