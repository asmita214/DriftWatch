import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ModelProvider } from './context/ModelContext';
import { supabase } from './api/client';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import DriftAnalysis from './pages/DriftAnalysis';
import Forecast from './pages/Forecast';
import Reports from './pages/Reports';
import Models from './pages/Models';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Quickstart from './pages/Quickstart';

const ProtectedRoute = ({ children, session }) => {
  const location = useLocation();
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

const AppLayout = ({ children, session }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  return (
    <>
      {!isAuthPage && session && <Navbar />}
      {children}
    </>
  );
};

function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // still loading session
  if (session === undefined) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, color: 'var(--text-3)' }}>Loading...</div>
    </div>
  );

  return (
    <ModelProvider>
      <BrowserRouter>
        <AppLayout session={session}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/signup" element={session ? <Navigate to="/dashboard" replace /> : <Signup />} />
            <Route path="/dashboard" element={<ProtectedRoute session={session}><Dashboard /></ProtectedRoute>} />
            <Route path="/drift" element={<ProtectedRoute session={session}><DriftAnalysis /></ProtectedRoute>} />
            <Route path="/forecast" element={<ProtectedRoute session={session}><Forecast /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute session={session}><Reports /></ProtectedRoute>} />
            <Route path="/models" element={<ProtectedRoute session={session}><Models /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute session={session}><Settings /></ProtectedRoute>} />
            <Route path="/quickstart" element={<ProtectedRoute session={session}><Quickstart /></ProtectedRoute>} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </ModelProvider>
  );
}

export default App;