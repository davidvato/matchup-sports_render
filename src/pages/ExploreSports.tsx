import React from 'react';
import { Link } from 'react-router-dom';
import { sportsData } from '../data/sports';
import bgImage from '../assets/login-bg.png';
import { ChevronLeft } from 'lucide-react';

const ExploreSports: React.FC = () => {
  // Ordered list for the grid
  const sports = [
    'basquetball', 'front tenis', 'futbol', 'padel', 
    'pickleball', 'racquetball', 'squash', 'tenis'
  ];

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      backgroundImage: `linear-gradient(rgba(12, 14, 20, 0.8), rgba(12, 14, 20, 0.95)), url(${bgImage})`,
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
      padding: '120px 2rem 50px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <Link to="/" style={{ 
            color: 'rgba(255,255,255,0.6)', textDecoration: 'none', 
            display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '1.5rem' 
          }}>
            <ChevronLeft size={20} /> Volver al Inicio
          </Link>
          <h1 className="gradient-text" style={{ fontSize: '4rem', margin: '0 0 1rem' }}>Explorar Deportes</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto' }}>
            Descubre todas las disciplinas que MatchUp tiene para ofrecer. Elige un deporte para ver sus reglas y detalles técnicos.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '2rem' 
        }}>
          {sports.map((id) => {
            const sport = sportsData[id];
            if (!sport) return null;
            const isDisabled = sport.disabled;

            const cardStyle: React.CSSProperties = {
              height: '350px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '2rem',
              transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
              cursor: isDisabled ? 'default' : 'pointer',
              border: `1px solid ${isDisabled ? 'rgba(255,255,255,0.1)' : (sport.color + '33')}`,
              backgroundColor: 'rgba(255,255,255,0.02)',
              filter: isDisabled ? 'grayscale(1) opacity(0.5)' : 'none'
            };

            const card = (
              <div 
                className={`glass-card ${!isDisabled ? 'fadeIn' : ''}`} 
                style={cardStyle}
                onMouseEnter={(e) => {
                  if (isDisabled) return;
                  e.currentTarget.style.transform = 'translateY(-10px)';
                  e.currentTarget.style.boxShadow = `0 15px 30px ${sport.color}22`;
                  e.currentTarget.style.borderColor = sport.color;
                }}
                onMouseLeave={(e) => {
                  if (isDisabled) return;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = `${sport.color}33`;
                }}
              >
                {/* Visual background effect for card */}
                <div style={{
                  position: 'absolute', top: '-10%', right: '-10%',
                  opacity: 0.15, transform: 'rotate(-15deg)',
                  color: isDisabled ? '#666' : sport.color
                }}>
                  {sport.icon}
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ 
                    color: isDisabled ? '#666' : sport.color, marginBottom: '1rem', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '60px', height: '60px', backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px'
                  }}>
                    {sport.icon}
                  </div>
                  <h2 style={{ color: 'white', margin: '0 0 0.5rem', fontSize: '1.8rem' }}>
                    {sport.name} {isDisabled && <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>(Próximamente)</span>}
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1.5rem', lineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {isDisabled ? 'Esta disciplina aún no está configurada para torneos. Vuelve pronto para ver las actualizaciones.' : sport.description}
                  </p>
                  {!isDisabled && (
                    <div style={{ color: sport.color, fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      Ver Detalles →
                    </div>
                  )}
                </div>
              </div>
            );

            return isDisabled ? (
              <div key={id}>{card}</div>
            ) : (
              <Link key={id} to={`/sport/${id}`} style={{ textDecoration: 'none' }}>
                {card}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExploreSports;
