import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, PlusCircle, Users, Activity, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Group {
  id: string;
  name: string;
  _count: { pairs: number, matches: number };
}

interface Tournament {
  id: string;
  name: string;
  groups: Group[];
}

const TournamentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/tournaments/${id}`);
      const data = await res.json();
      setTournament(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const res = await fetch(`http://localhost:3001/api/tournaments/${id}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName })
      });
      if (res.ok) {
        setNewGroupName('');
        fetchTournament();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAdmin) return <Navigate to="/" />;

  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Cargando torneo...</div>;

  return (
    <div style={{
      minHeight: '100vh', padding: '120px 2rem 50px',
      backgroundImage: 'linear-gradient(135deg, #0c0e14 0%, #1a1d23 100%)', color: 'white'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <Link to="/create" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: '2rem' }}>
          <ChevronLeft size={20} /> Volver a Mis Torneos
        </Link>

        <header style={{ marginBottom: '3rem' }}>
          <h1 className="gradient-text" style={{ fontSize: '3rem', margin: '0 0 1rem' }}>{tournament?.name}</h1>
          <div style={{ display: 'flex', gap: '2rem', opacity: 0.7 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Users size={20} /> {tournament?.groups.length} Grupos totales
            </span>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '3rem', alignItems: 'start' }}>
          {/* Groups List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Grupos del Torneo</h2>
            {tournament?.groups.map((group) => (
              <div key={group.id} className="glass-card fadeIn" style={{ 
                padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.3rem' }}>{group.name}</h3>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', opacity: 0.6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Users size={14} /> {group._count.pairs} Parejas
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Activity size={14} /> {group._count.matches} Partidos
                    </span>
                  </div>
                </div>
                <Link to={`/group/${group.id}`} className="btn-primary" style={{ 
                   textDecoration: 'none', padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  Gestionar <ArrowRight size={18} />
                </Link>
              </div>
            ))}
            {tournament?.groups.length === 0 && (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', opacity: 0.4 }}>
                No hay grupos creados todavía.
              </div>
            )}
          </div>

          {/* Sidebar: Action Box */}
          <div className="glass-card" style={{ padding: '2rem', border: '1px solid var(--primary)33' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PlusCircle color="var(--primary)" /> Añadir Grupo
            </h3>
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Nombre (ej: Grupo A)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Crear Grupo</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentDetails;
function Navigate({ to }: { to: string }) {
  const navigate = useNavigate();
  React.useEffect(() => { navigate(to); }, []);
  return null;
}
