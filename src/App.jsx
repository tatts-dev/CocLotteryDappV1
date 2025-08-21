import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Lottery from './pages/Lottery';
import { Web3Provider } from './context/Web3Context';

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="min-h-screen bg-white">
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/lottery" element={<Lottery />} />
          </Routes>
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;
