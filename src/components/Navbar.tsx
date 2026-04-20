import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy, Menu, User, LogOut,
  Circle, Zap, Activity,
  Maximize, Layers, Repeat, Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAdmin, logout, user } = useAuth();
  const navigate = useNavigate();

  const sports = [
    { name: 'Basquetball', icon: <Circle size={16} /> },
    { name: 'Front Tenis', icon: <Repeat size={16} />, disabled: true },
    { name: 'Futbol', icon: <Circle size={16} /> },
    { name: 'Padel', icon: <Layers size={16} />, disabled: true },
    { name: 'Pickleball', icon: <Target size={16} /> },
    { name: 'Racquetball', icon: <Maximize size={16} /> },
    { name: 'Squash', icon: <Activity size={16} />, disabled: true },
    { name: 'Tenis', icon: <Zap size={16} />, disabled: true }
  ];

  return (
    <nav className="glass-card" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none',
      padding: '0.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Trophy color="#00f2fe" size={32} />
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h2 className="gradient-text" style={{ margin: 0, fontSize: '1.8rem' }}>MatchUp</h2>
        </Link>
      </div>
      <div className="nav-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 600 }}>
          Inicio
        </Link>
        {isAdmin && (
          <Link to="/create" style={{ color: 'white', textDecoration: 'none', fontWeight: 600 }}>
            Crear Torneo
          </Link>
        )}

        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
            Deportes <Menu size={20} />
          </span>
          {isMenuOpen && (
            <div className="glass-card" style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '10px',
              width: '200px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px',
              backgroundColor: '#1a1d23', opacity: 1, border: '1px solid var(--glass-border)'
            }}>
              {sports.filter(s => !s.disabled).map(sport => (
                <Link
                  key={sport.name}
                  to={`/sport/${sport.name.toLowerCase()}`}
                  style={{
                    color: 'white', textDecoration: 'none', padding: '8px 10px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    borderRadius: '6px', transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ color: 'var(--primary)', display: 'flex' }}>{sport.icon}</span>
                  {sport.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {isAdmin ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{user?.username}</span>
            <button className="btn-primary" onClick={() => { logout(); navigate('/'); }} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <LogOut size={16} /> Salir
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={() => navigate('/login')}>
            <User size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Ingresar
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
