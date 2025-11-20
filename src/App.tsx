import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<div className="p-8"><h1 className="text-2xl font-bold">Products</h1><p className="mt-4">Coming soon...</p></div>} />
          <Route path="/notifications" element={<div className="p-8"><h1 className="text-2xl font-bold">Notifications</h1><p className="mt-4">Coming soon...</p></div>} />
          <Route path="/billing" element={<div className="p-8"><h1 className="text-2xl font-bold">Billing</h1><p className="mt-4">Coming soon...</p></div>} />
          <Route path="/team" element={<div className="p-8"><h1 className="text-2xl font-bold">Team</h1><p className="mt-4">Coming soon...</p></div>} />
          <Route path="/settings" element={<div className="p-8"><h1 className="text-2xl font-bold">Settings</h1><p className="mt-4">Coming soon...</p></div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
