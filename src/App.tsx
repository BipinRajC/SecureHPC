import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import ComplianceFrameworks from './pages/ComplianceFrameworks';
import ToolIntegrations from './pages/ToolIntegrations';
import AssessmentResults from './pages/AssessmentResults';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import ScheduledAssessments from './pages/ScheduledAssessments';
import CustomFrameworks from './pages/CustomFrameworks';
import HistoricalData from './pages/HistoricalData';
import OpenSCAPReport from './pages/OpenSCAPReport';
import WazuhConfig from './pages/WazuhConfig';
import WazuhResult from './pages/WazuhResult';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="frameworks" element={<ComplianceFrameworks />} />
        <Route path="custom-frameworks" element={<CustomFrameworks />} />
        <Route path="integrations" element={<ToolIntegrations />} />
        <Route path="integrations/wazuh-config" element={<WazuhConfig />} />
        <Route path="wazuh-result" element={<WazuhResult />} />
        <Route path="assessments" element={<AssessmentResults />} />
        <Route path="scheduled" element={<ScheduledAssessments />} />
        <Route path="historical" element={<HistoricalData />} />
        <Route path="settings" element={<Settings />} />
        <Route path="openscap-report" element={<OpenSCAPReport />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;