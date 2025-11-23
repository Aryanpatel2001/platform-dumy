import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import AgentBuilder from './pages/AgentBuilder';
import AgentDetail from './pages/AgentDetail';
import TestAgent from './pages/TestAgent';
import PhoneNumbers from './pages/PhoneNumbers';
import EmailDashboard from './pages/EmailDashboard';
import EmailCampaigns from './pages/EmailCampaigns';
import CampaignBuilder from './pages/CampaignBuilder';
import EmailContacts from './pages/EmailContacts';
import EmailTemplates from './pages/EmailTemplates';
import Unsubscribe from './pages/Unsubscribe';
import CampaignAnalytics from './pages/CampaignAnalytics';
import ABTestResults from './pages/ABTestResults';
import Login from './pages/Login';
import Register from './pages/Register';
import APIDocumentation from './pages/APIDocumentation';
import SiteFooter from './components/SiteFooter';
import './App.css';

function App() {
  const AppRoutes = () => {
    const location = useLocation();
    const state = location.state;
    // Show footer only when the underlying page is the home page
    const isHome = (state?.backgroundLocation?.pathname || location.pathname) === '/';

    return (
      <>
        {/* Render the underlying page using the background location when present */}
        <Routes location={state?.backgroundLocation || location}>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/api-docs" element={<APIDocumentation />} />

          {/* Protected app */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="agent/new" element={<AgentBuilder />} />
            <Route path="agent/:id" element={<AgentDetail />} />
            <Route path="agent/:id/test" element={<TestAgent />} />
            <Route path="agent/:id/edit" element={<AgentBuilder />} />
            <Route path="phone-numbers" element={<PhoneNumbers />} />

            {/* Email Marketing Routes */}
            <Route path="email" element={<EmailDashboard />} />
            <Route path="email/campaigns" element={<EmailCampaigns />} />
            <Route path="email/campaigns/new" element={<CampaignBuilder />} />
            <Route path="email/campaigns/:id" element={<CampaignBuilder />} />
            <Route path="email/campaigns/:id/analytics" element={<CampaignAnalytics />} />
            <Route path="email/campaigns/:id/ab-test" element={<ABTestResults />} />
            <Route path="email/contacts" element={<EmailContacts />} />
            <Route path="email/templates" element={<EmailTemplates />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* When a background location exists, render modal routes on top */}
        {state?.backgroundLocation && (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        )}

        {/* Home page footer only */}
        {isHome && <SiteFooter />}
      </>
    );
  };

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-brand-surface dark:bg-brand-dark">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#34569D',
                color: '#fff',
              },
            }}
          />
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;


