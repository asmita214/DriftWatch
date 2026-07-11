import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ModelProvider } from './context/ModelContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import DriftAnalysis from './pages/DriftAnalysis';
import Forecast from './pages/Forecast';
import Reports from './pages/Reports';
import Models from './pages/Models';
import Settings from './pages/Settings';

function App() {
  return (
    <ModelProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/drift" element={<DriftAnalysis />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/models" element={<Models />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </ModelProvider>
  );
}

export default App;
