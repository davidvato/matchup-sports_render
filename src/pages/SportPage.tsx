import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Info, Gavel, Trophy, MapPin, Calendar } from 'lucide-react';
import { sportsData } from '../data/sports';
import bgImage from '../assets/login-bg.png';

interface Tournament {
  id: string;
  name: string;
  location: string;
  startDate: string;
  sport: string;
}

const SportPage: React.FC = () => {
  const { sportId } = useParams<{ sportId: string }>();
  const sport = sportId ? sportsData[sportId] : null;
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    if (sport) {
      fetch(`/api/tournaments?sport=${sport.name}`)
        .then(res => res.json())
        .then(data => setTournaments(data))
        .catch(err => console.error(err));
    }
  }, [sport]);

  if (!sport) {
    return (
      <div style={{ padding: '120px 2rem', color: 'white', textAlign: 'center' }}>
        <h1 className="gradient-text">Deporte no encontrado</h1>
        <Link to="/" className="btn-primary" style={{ display: 'inline-block', marginTop: '2rem', textDecoration: 'none' }}> Volver al Inicio</Link>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      backgroundImage: `linear-gradient(rgba(12, 14, 20, 0.8), rgba(12, 14, 20, 0.95)), url(${sport.image})`,
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
      padding: '120px 2rem 50px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <Link to="/explore" style={{ 
          color: 'rgba(255,255,255,0.6)', textDecoration: 'none', 
          display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2rem' 
        }}>
          <ChevronLeft size={20} /> Volver a Explorar
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
          <div style={{ 
            color: sport.color, background: 'rgba(255,255,255,0.05)', 
            padding: '1rem', borderRadius: '16px', border: `1px solid ${sport.color}44`
          }}>
            {sport.icon}
          </div>
          <h1 className="gradient-text" style={{ fontSize: '3.5rem', margin: 0 }}>{sport.name}</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          {/* Section 1: Description */}
          <section className="glass-card" style={{ padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
              <Info size={120} color={sport.color} />
            </div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: sport.color, marginBottom: '1.5rem' }}>
              <Info size={24} /> Descripción
            </h2>
            <p style={{ fontSize: '1.25rem', lineHeight: '1.8', color: 'rgba(255,255,255,0.9)', maxWidth: '800px' }}>
              {sport.description}
            </p>
          </section>

          {/* Section 2: Basic Rules */}
          <section className="glass-card" style={{ padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.1 }}>
              <Gavel size={120} color={sport.color} />
            </div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: sport.color, marginBottom: '1.5rem' }}>
              <Gavel size={24} /> Reglas Básicas
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {sport.rules.map((rule, index) => (
                <div key={index} style={{ 
                  display: 'flex', gap: '15px', padding: '1.2rem', 
                  backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                  borderLeft: `4px solid ${sport.color}`
                }}>
                  <span style={{ fontWeight: 'bold', color: sport.color, fontSize: '1.2rem' }}>{index + 1}</span>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>{rule}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Related Tournaments */}
          <section style={{ marginTop: '2rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', marginBottom: '1.5rem' }}>
              <Trophy size={24} color="var(--primary)" /> Torneos Disponibles
            </h2>
            {tournaments.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {tournaments.map(t => (
                  <Link key={t.id} to={`/tournament/${t.id}`} style={{ textDecoration: 'none' }}>
                    <div className="glass-card fadeIn" style={{ 
                      padding: '2rem', textAlign: 'left', 
                      border: '1px solid rgba(255,255,255,0.05)', 
                      transition: 'transform 0.3s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <span style={{ fontSize: '0.8rem', color: sport.color, fontWeight: 'bold', textTransform: 'uppercase' }}>{t.sport}</span>
                      <h3 style={{ margin: '0.5rem 0 1rem', color: 'white' }}>{t.name}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.6, fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={14} /> {t.location}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={14} /> {t.startDate ? new Date(t.startDate).toLocaleDateString() : 'Por definir'}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', opacity: 0.6 }}>
                <p style={{ margin: 0 }}>No hay torneos activos para este deporte en este momento.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default SportPage;
