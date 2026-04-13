import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { PlusCircle, Trophy, FolderOpen, Trash2, Calendar } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  sport: string;
  createdAt: string;
  _count: { groups: number };
}

const TournamentCreation: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [newTournamentName, setNewTournamentName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/tournaments');
      const data = await res.json();
      setTournaments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournamentName.trim()) return;

    try {
      const res = await fetch('http://localhost:3001/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newTournamentName, 
          creatorId: user?.id 
        })
      });
      if (res.ok) {
        setNewTournamentName('');
        fetchTournaments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este torneo?')) return;
    try {
      await fetch(`http://localhost:3001/api/tournaments/${id}`, { method: 'DELETE' });
      fetchTournaments();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '120px 2rem 50px',
      backgroundImage: 'linear-gradient(135deg, #0c0e14 0%, #1a1d23 100%)',
      color: 'white'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Gestión de Torneos</h1>
          <p style={{ opacity: 0.7 }}>Bienvenido, {user?.username}. Aquí puedes crear y administrar tus eventos deportivos.</p>
        </header>

        {/* Create Tournament Form */}
        <section className="glass-card fadeIn" style={{ padding: '2rem', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PlusCircle color="var(--primary)" /> Nuevo Torneo
          </h2>
          <form onSubmit={handleCreateTournament} style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              className="input-field"
              placeholder="Ej: Liga de Verano 2026"
              value={newTournamentName}
              onChange={(e) => setNewTournamentName(e.target.value)}
              required
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0 2rem' }}>Crear</button>
          </form>
        </section>

        {/* Tournaments Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {tournaments.map((t) => (
            <div key={t.id} className="glass-card fadeIn" style={{ 
              padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{t.name}</h3>
                  <span style={{ fontSize: '0.8rem', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={12} /> {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ background: 'rgba(0, 242, 254, 0.1)', padding: '8px', borderRadius: '10px' }}>
                  <Trophy size={20} color="#00f2fe" />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.7)' }}>
                <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FolderOpen size={16} /> {t._count.groups} Grupos
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                <Link to={`/tournament/${t.id}`} className="btn-primary" style={{ 
                  flex: 1, textAlign: 'center', textDecoration: 'none', padding: '0.8rem', fontSize: '0.9rem' 
                }}>
                  Administrar
                </Link>
                <button 
                  onClick={() => handleDelete(t.id)}
                  style={{ 
                    background: 'rgba(255, 75, 43, 0.1)', border: 'none', borderRadius: '8px', 
                    padding: '0.8rem', cursor: 'pointer', color: '#ff4b2b'
                  }}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {loading && <p style={{ textAlign: 'center', marginTop: '2rem' }}>Cargando torneos...</p>}
        {!loading && tournaments.length === 0 && (
          <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>
            <p>Aún no tienes torneos creados. ¡Comienza creando uno arriba!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentCreation;
