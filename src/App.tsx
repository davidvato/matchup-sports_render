import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TournamentCreation from './pages/TournamentCreation';
import LoginPage from './pages/LoginPage';
import SportPage from './pages/SportPage';
import ExploreSports from './pages/ExploreSports';

const AppContent: React.FC = () => {
  const location = useLocation();
  const showNavbar = location.pathname !== '/login' && location.pathname !== '/explore';

  return (
    <div style={{ minHeight: '100vh', width: '100%' }}>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/explore" element={<ExploreSports />} />
        <Route path="/create" element={<TournamentCreation />} />
        <Route path="/sport/:sportId" element={<SportPage />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
