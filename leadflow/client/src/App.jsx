import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';

import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetails from './pages/LeadDetails';
import Contacts from './pages/Contacts';
import Upload from './pages/Upload';
import Imports from './pages/Imports';
import EmailCompose from './pages/EmailCompose';
import Templates from './pages/Templates';
import EmailHistory from './pages/EmailHistory';
import FollowUps from './pages/FollowUps';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import WebsiteMockupPreview from './pages/WebsiteMockupPreview';
import ErrorBoundary from './components/common/ErrorBoundary';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="h-8 w-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Wrapper (redirects to / if logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="h-8 w-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Auth Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Public Mockup Concept Landing Page */}
        <Route path="/preview/:leadId" element={<WebsiteMockupPreview />} />

        {/* Protected Dashboard & Operations Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/:id" element={<LeadDetails />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="upload" element={<Upload />} />
          <Route path="imports" element={<Imports />} />
          <Route path="email-compose/:leadId" element={<EmailCompose />} />
          <Route path="templates" element={<Templates />} />
          <Route path="email-history" element={<EmailHistory />} />
          <Route path="follow-ups" element={<FollowUps />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/gmail" element={<Navigate to="/settings" replace />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

