# 🛡️ HPC Security Compliance Framework

A comprehensive, full-stack security compliance monitoring and reporting platform designed specifically for High-Performance Computing (HPC) environments. This framework integrates multiple security tools and provides real-time monitoring, compliance assessment, and detailed reporting capabilities.

## 🌟 Key Features

### 🔧 **Security Tool Integrations**
- **Wazuh Integration**: Real-time security monitoring, agent management, and SIEM capabilities
- **Lynis Integration**: System hardening and security auditing
- **OpenSCAP Integration**: Security compliance scanning and vulnerability assessment
- **SSH Remote Access**: Connect to remote servers for security tool execution (external functionality)

### 📊 **Compliance Frameworks**
- **PCI-DSS**: Payment Card Industry Data Security Standard
- **GDPR**: General Data Protection Regulation
- **HIPAA**: Health Insurance Portability and Accountability Act
- **NIST 800-53**: National Institute of Standards and Technology Security Controls

### 📈 **Advanced Monitoring & Reporting**
- **Real-time Agent Monitoring**: Live system status, processes, and network activity
- **Security Configuration Assessment (SCA)**: Detailed security rule evaluation with expandable descriptions
- **File Integrity Monitoring**: Track file changes and system modifications
- **Network Security Analysis**: Port monitoring, interface statistics, and protocol analysis
- **Hardware & OS Profiling**: Comprehensive system information gathering

### 📋 **Export & Reporting**
- **Interactive HTML Reports**: Comprehensive security reports with pie charts, tables, and expandable sections
- **JSON Data Export**: Raw data export for integration with other tools
- **Professional Styling**: Dark-themed, responsive reports with modern UI/UX
- **Complete Data Sets**: Dashboard shows limited records (20) for performance, HTML exports include ALL data

### 🎨 **User Interface**
- **Modern React Frontend**: Built with TypeScript, Tailwind CSS, and Vite
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Updates**: Live data refresh and status monitoring
- **Interactive Dashboards**: Dynamic charts, tables, and visualizations

## 🏗️ Architecture

### **Frontend Stack**
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for modern, responsive styling
- **Zustand** for lightweight state management
- **Recharts** for interactive data visualizations
- **Lucide React** for consistent iconography

### **Backend Stack**
- **Node.js** with Express.js REST API
- **Axios** for HTTP client communications
- **CORS** enabled for cross-origin requests
- **JWT Token Management** for Wazuh API authentication

### **Security Tools Integration**
- **Wazuh API**: Direct integration with Wazuh SIEM platform
- **Lynis**: Local system security auditing
- **OpenSCAP**: Compliance and vulnerability scanning

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Lynis** installed on the system (for local auditing)
- **Wazuh Server** (for security monitoring integration)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd wazuh-isolated
```

2. **Install frontend dependencies:**
```bash
npm install
```

3. **Install backend dependencies:**
```bash
cd server
npm install
cd ..
```

### Running the Application

#### Development Mode (Recommended)

**Option 1: Run both frontend and backend concurrently**
```bash
npm run dev:all
```

**Option 2: Run separately**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm run dev
```

#### Production Mode

1. **Build the frontend:**
```bash
npm run build
```

2. **Start the backend:**
```bash
cd server
npm start
```

### Access Points

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

## 🔧 Configuration

### Wazuh Integration Setup

1. **Navigate to Tool Integrations** in the application
2. **Click "Configure"** for the Wazuh integration
3. **Enter your Wazuh API credentials:**
   - **API URL**: `https://your-wazuh-server:55000`
   - **Username**: Your Wazuh API username
   - **Password**: Your Wazuh API password
4. **Click "Connect & Configure"** to establish the connection

### Lynis Integration

Lynis integration requires the tool to be installed locally:

**Debian/Ubuntu:**
```bash
sudo apt-get update
sudo apt-get install lynis
```

**RHEL/CentOS/Fedora:**
```bash
sudo dnf install lynis
# or for older versions:
sudo yum install epel-release
sudo yum install lynis
```

**macOS:**
```bash
brew install lynis
```

## 📁 Project Structure

```
wazuh-isolated/
├── 📁 public/                    # Static assets
├── 📁 server/                    # Express.js backend
│   ├── server.js                 # Main server file
│   ├── wazuhService.js          # Wazuh API integration
│   ├── lynisService.js          # Lynis tool integration
│   └── package.json             # Backend dependencies
├── 📁 src/                       # React frontend source
│   ├── 📁 components/           # Reusable React components
│   │   ├── 📁 wazuh/           # Wazuh-specific components
│   │   │   ├── ComplianceOverview.tsx    # Compliance dashboard & HTML export
│   │   │   ├── ProcessesTable.tsx       # Running processes display
│   │   │   ├── PortsTable.tsx           # Network ports monitoring
│   │   │   ├── SystemInformation.tsx    # System details & file integrity
│   │   │   └── AgentSelector.tsx        # Agent selection interface
│   │   └── 📁 ui/              # Common UI components
│   ├── 📁 pages/               # Page components
│   │   ├── WazuhResult.tsx     # Main Wazuh dashboard
│   │   ├── ToolIntegrations.tsx # Tool configuration page
│   │   └── Dashboard.tsx       # Main application dashboard
│   ├── 📁 store/               # Zustand state management
│   ├── 📁 types/               # TypeScript type definitions
│   ├── App.tsx                 # Main application component
│   └── main.tsx               # Application entry point
├── package.json               # Frontend dependencies & scripts
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts          # Vite build configuration
└── README.md              # This file
```

## 🔍 Features Deep Dive

### Wazuh Security Dashboard

**Agent Management:**
- Real-time agent status monitoring
- IPv4/IPv6 address resolution with smart prioritization
- Hardware profiling (CPU, RAM, storage)
- Operating system information

**Security Monitoring:**
- **Running Processes**: Monitor active system processes (Dashboard: top 20, HTML export: unlimited)
- **Network Ports**: Track open ports and listening services (Dashboard: top 20, HTML export: unlimited)
- **File Integrity**: Monitor file changes and modifications (Dashboard: top 20, HTML export: unlimited)
- **Network Interfaces**: Interface statistics and traffic analysis
- **Security Configuration Assessment**: Detailed rule evaluation with compliance mapping

**Compliance Assessment:**
- Multi-framework compliance scoring (PCI-DSS, GDPR, HIPAA, NIST)
- Interactive pie charts with pass/fail/not-applicable breakdowns
- Detailed rule descriptions, rationale, and remediation steps
- Expandable/collapsible rule sections for detailed analysis

### HTML Export System

**Comprehensive Reports Include:**
- **Executive Summary**: Compliance status across all frameworks
- **System Information**: Complete hardware, OS, and network details
- **Security Assessment**: All SCA rules with detailed descriptions
- **Process Analysis**: Complete process list with resource usage
- **Network Security**: All open ports and interface statistics
- **File Integrity**: Complete file change history
- **Professional Styling**: Dark theme, responsive design, print-friendly

**Export Features:**
- **Unlimited Data**: HTML exports contain complete datasets (no 20-record limits)
- **Interactive Elements**: Expandable sections, sortable tables
- **Professional Formatting**: Corporate-ready styling with proper typography
- **Self-contained**: Single HTML file with embedded CSS and JavaScript

### Performance Optimizations

**Dashboard Performance:**
- Limited to 20 records per section for fast loading
- Real-time data refresh capabilities
- Efficient API calls with proper error handling
- Smart caching and state management

**Export Performance:**
- Separate API calls for unlimited data
- Optimized HTML generation
- Efficient data processing and formatting

## 🔌 API Endpoints

### Wazuh Integration

```
POST   /api/tools/wazuh/configure          # Configure Wazuh connection
GET    /api/tools/wazuh/status             # Check connection status
GET    /api/tools/wazuh/agents             # List all agents
GET    /api/tools/wazuh/agents/:id/hardware # Agent hardware info
GET    /api/tools/wazuh/agents/:id/os       # Agent OS information
GET    /api/tools/wazuh/agents/:id/processes # Agent processes (limit configurable)
GET    /api/tools/wazuh/agents/:id/ports    # Agent network ports
GET    /api/tools/wazuh/agents/:id/sca      # Security Configuration Assessment
GET    /api/tools/wazuh/agents/:id/syscheck # File integrity monitoring
GET    /api/tools/wazuh/agents/:id/netiface # Network interface statistics
```

### Lynis Integration

```
POST   /api/tools/lynis/run               # Execute Lynis scan
GET    /api/tools/lynis/report            # Get scan results
GET    /api/tools/lynis/status            # Check scan status
```

### System Health

```
GET    /api/health                        # System health check
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start frontend development server
npm run build        # Build frontend for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run server       # Start backend server
npm run dev:all      # Start both frontend and backend
```

### Backend Scripts

```bash
cd server
npm start           # Start production server
npm run dev         # Start development server with nodemon
```

### Environment Configuration

The application uses environment-based configuration:

- **Development**: Frontend on port 5173, Backend on port 3001
- **Production**: Configurable ports via environment variables

## 🔒 Security Considerations

### Authentication & Authorization
- JWT token-based authentication for Wazuh API
- Automatic token renewal (15-minute expiration)
- Secure credential handling

### Network Security
- CORS configuration for cross-origin requests
- HTTPS support for production deployments
- SSL certificate validation (configurable)

### Data Protection
- No sensitive data stored in frontend
- Secure API communication
- Proper error handling without data leakage

## 🚨 Troubleshooting

### Common Issues

**Wazuh Connection Problems:**
1. Verify Wazuh server is running and accessible
2. Check API credentials and permissions
3. Ensure network connectivity on port 55000
4. Review backend server logs for detailed errors

**Lynis Integration Issues:**
1. Confirm Lynis is installed: `lynis --version`
2. Check file permissions for Lynis execution
3. Verify system compatibility

**Performance Issues:**
1. Monitor browser console for JavaScript errors
2. Check network tab for failed API requests
3. Review backend server logs
4. Ensure adequate system resources

### Debug Mode

Enable detailed logging by checking browser console and backend server output:

```bash
# Backend logs
cd server
npm run dev  # Shows detailed request/response logs
```

## 🌐 Remote Server Integration

This framework supports **SSH-based remote server access** for executing security tools on distributed HPC infrastructure:

- **Remote Lynis Execution**: SSH into remote servers to run Lynis audits
- **Remote OpenSCAP Scanning**: Execute compliance scans on remote systems
- **Distributed Security Assessment**: Coordinate security tools across multiple servers
- **Centralized Reporting**: Aggregate results from multiple remote systems

*Note: SSH remote access functionality is available in the extended version of this framework.*

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**


## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

For support, feature requests, or bug reports, please open an issue in the repository. 