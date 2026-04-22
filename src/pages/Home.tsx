import React, { useEffect, useState } from 'react';
import { Trophy, ShieldCheck, Zap, ArrowRight, Calendar, MapPin } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import bgImage from '../assets/login-bg.png';

interface Tournament {
  id: string;
  name: string;
  sport: string;
  location: string;
  startDate: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    fetch('/api/tournaments')
      .then(res => res.json())
      .then(data => setTournaments(data.slice(0, 3))) // Show only last 3
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundImage: `linear-gradient(rgba(12, 14, 20, 0.7), rgba(12, 14, 20, 0.9)), url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      color: 'white',
      padding: '120px 2.5rem 50px',
      textAlign: 'center'
    }}>
      <div className="glass-card fadeIn" style={{ padding: '4rem', maxWidth: '900px', marginBottom: '4rem' }}>
        <Trophy size={80} color="#00f2fe" style={{ marginBottom: '2rem' }} />
        <h1 className="gradient-text" style={{ fontSize: '5rem', marginBottom: '1rem', lineHeight: 1 }}>MatchUp</h1>
        <p style={{ fontSize: '1.5rem', opacity: 0.8, maxWidth: '600px', margin: '0 auto' }}>
          La plataforma definitiva para la gestión y organización de torneos deportivos de alto nivel.
        </p>
        
        <div style={{ marginTop: '3rem', display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/explore')}
            style={{ padding: '1.2rem 3rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            Explorar Deportes <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* Recent Tournaments Section */}
      {tournaments.length > 0 && (
        <div style={{ width: '100%', maxWidth: '1200px', marginBottom: '5rem' }}>
          <h2 style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
            <Trophy color="var(--primary)" /> Torneos Recientes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {tournaments.map(t => (
              <Link key={t.id} to={`/tournament/${t.id}`} style={{ textDecoration: 'none' }}>
                <div className="glass-card fadeIn" style={{ padding: '2rem', textAlign: 'left', border: '1px solid rgba(255,255,255,0.05)', height: '100%' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>{t.sport}</span>
                  <h3 style={{ margin: '0.5rem 0 1rem', color: 'white' }}>{t.name}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.6, fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={14} /> {t.location}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={14} /> {new Date(t.startDate).toLocaleDateString()}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1200px' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <ShieldCheck size={48} color="#00f2fe" style={{ marginBottom: '1rem' }} />
          <h3>Gestión Administrador</h3>
          <p style={{ opacity: 0.7 }}>Control total sobre la creación y edición de torneos con perfiles seguros.</p>
        </div>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <Zap size={48} color="#ff007c" style={{ marginBottom: '1rem' }} />
          <h3>8+ Deportes</h3>
          <p style={{ opacity: 0.7 }}>Desde Racquetball hasta Futbol, todo en un solo lugar.</p>
        </div>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <Trophy size={48} color="#4facfe" style={{ marginBottom: '1rem' }} />
          <h3>Tablas Dinámicas</h3>
          <p style={{ opacity: 0.7 }}>Actualizaciones en tiempo real y seguimiento de resultados premium.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
