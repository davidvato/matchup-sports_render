import React from 'react';
import { PlusCircle, Edit3, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const TournamentCreation: React.FC = () => {
  const { isAdmin, user } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div style={{
      padding: '120px 2rem 50px', maxWidth: '1000px', margin: '0 auto',
      color: 'white'
    }}>
      <div className="glass-card" style={{ padding: '3rem', position: 'relative' }}>
        <h2 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Panel de Administración</h2>
        <p style={{ marginBottom: '2rem', opacity: 0.7 }}>Bienvenido de nuevo, {user?.username}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem', cursor: 'pointer', textAlign: 'center' }}>
            <PlusCircle size={32} color="#00f2fe" style={{ display: 'block', margin: '0 auto 0.5rem' }} />
            <span>Crear Torneo</span>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem', cursor: 'pointer', textAlign: 'center', opacity: 0.5 }}>
            <Edit3 size={32} color="#4facfe" style={{ display: 'block', margin: '0 auto 0.5rem' }} />
            <span>Editar (Próximamente)</span>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem', cursor: 'pointer', textAlign: 'center', opacity: 0.5 }}>
            <Trash2 size={32} color="#ff007c" style={{ display: 'block', margin: '0 auto 0.5rem' }} />
            <span>Borrar (Próximamente)</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '2rem', borderStyle: 'dashed' }}>
          <h3 style={{ margin: 0, opacity: 0.6, textAlign: 'center' }}>Selecciona una acción para comenzar</h3>
        </div>
      </div>
    </div>
  );
};

export default TournamentCreation;
