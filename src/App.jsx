import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LagosBioBootcamp from './pages/LagosBioBootcamp';

const Workspace = lazy(() => import('./pages/Workspace'));
const Gallery = lazy(() => import('./pages/Gallery'));
const VerifyCertificate = lazy(() => import('./pages/VerifyCertificate'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="h-screen w-full bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>}>
        <Routes>
          <Route path="/" element={<LagosBioBootcamp />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/verify/:code" element={<VerifyCertificate />} />
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={
            <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-center px-4">
              <h1 className="text-6xl font-bold text-emerald-500 mb-4">404</h1>
              <p className="text-slate-400 mb-6">This page doesn't exist.</p>
              <a href="/" className="text-sm px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all">Back to Bootcamp</a>
            </div>
          } />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
