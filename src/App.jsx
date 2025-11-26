import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LagosBioBootcamp from './pages/LagosBioBootcamp';
import Workspace from './pages/Workspace';
import Gallery from './pages/Gallery';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LagosBioBootcamp />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/gallery" element={<Gallery />} />
      </Routes>
    </Router>
  );
}

export default App;
