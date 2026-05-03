import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TestProvider } from './context/TestContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRegister from './components/auth/AdminRegister';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';

// Pages
import Home from './pages/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AdminPanel from './pages/AdminPanel';
import StudentPanel from './pages/StudentPanel';
import TestInterface from './components/student/TestInterface';
import TestPage from './pages/TestPage';

// Components
import { SessionTimeout } from './components/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <TestProvider>
          <SessionTimeout timeoutMinutes={30} />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin-register" element={<AdminRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            
            {/* Student Routes */}
            <Route
              path="/student/*"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentPanel />
                </ProtectedRoute>
              }
            />
            
            {/* Test Routes - Standalone (no sidebar/panel) */}
            <Route
              path="/student/take-test/:testId"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <TestInterface />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/student/test/:testId"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <TestPage />
                </ProtectedRoute>
              }
            />
            
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TestProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;