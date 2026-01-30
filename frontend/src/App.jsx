import React, { useState } from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import Leaderboard from './components/Leaderboard';
import AdminPanel from './components/AdminPanel';

function App() {
  const [adminMode, setAdminMode] = useState(false);
  const location = useLocation();

  const AdminRoute = () => {
    const [passwordInput, setPasswordInput] = useState('');
    const [error, setError] = useState('');

    if (adminMode) {
      return <AdminPanel />;
    }

    const handleSubmit = (e) => {
      e.preventDefault();
      if (passwordInput === 'admin@2026') {
        setAdminMode(true);
      } else {
        setError('Incorrect password');
      }
    };

    return (
      <div className="container" style={{ maxWidth: '400px', marginTop: '50px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Admin Access</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Enter Admin Password"
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #475569', background: '#1e293b', color: 'white' }}
          />
          {error && <p style={{ color: '#ef4444', fontSize: '14px' }}>{error}</p>}
          <button type="submit" className="btn btn-admin">Login</button>
        </form>
      </div>
    );
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">🚀</div>
          <h1>TrailBlaze</h1>
        </div>
        <p className="subtitle">Season 1 Competitive Leaderboard</p>
      </header>

      <nav className="app-nav">
        <Link to="/">
          <button className={`nav-btn ${location.pathname === '/' ? 'active' : ''}`}>
            🏆 Leaderboard
          </button>
        </Link>
      </nav>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Leaderboard />} />
          <Route path="/admin" element={<AdminRoute />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>TrailBlaze | Copyright 2026</p>
      </footer>
    </div>
  );
}

export default App;
