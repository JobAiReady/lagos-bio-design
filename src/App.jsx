import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LagosBioBootcamp from './pages/LagosBioBootcamp';

const Workspace = lazy(() => import('./pages/Workspace'));
const Gallery = lazy(() => import('./pages/Gallery'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="h-screen w-full bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>}>
        <Routes>
          <Route path="/" element={<LagosBioBootcamp />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/gallery" element={<Gallery />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
