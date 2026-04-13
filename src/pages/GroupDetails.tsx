import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, UserPlus, Trophy, Trash2, RefreshCcw, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Pair {
  id: string;
  name: string;
  totalScore: number;
}

interface Match {
  id: string;
  pairAId: string;
  pairBId: string;
  winnerId: string | null;
  pointsA: number;
  pointsB: number;
  pairA: Pair;
  pairB: Pair;
}

interface Group {
  id: string;
  name: string;
  tournamentId: string;
  pairs: Pair[];
  matches: Match[];
}

const GroupDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [newPairName, setNewPairName] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingMatch, setSavingMatch] = useState<string | null>(null);

  useEffect(() => {
    fetchGroup();
  }, [id]);

  const fetchGroup = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/groups/${id}`);
      const data = await res.json();
      setGroup(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPairName.trim()) return;
    try {
      const res = await fetch(`http://localhost:3001/api/groups/${id}/pairs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPairName })
      });
      if (res.ok) {
        setNewPairName('');
        fetchGroup();
      } else {
        const error = await res.json();
        alert(error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveResult = async (match: Match, winnerId: string, pA: number, pB: number) => {
    setSavingMatch(match.id);
    try {
      await fetch(`http://localhost:3001/api/matches/${match.id}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          winnerId, 
          pointsA: pA, 
          pointsB: pB,
          pairAId: match.pairAId,
          pairBId: match.pairBId
        })
      });
      fetchGroup();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingMatch(null);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('¿Deseas reiniciar todos los marcadores?')) return;
    try {
      await fetch(`http://localhost:3001/api/groups/${id}/reset`, { method: 'POST' });
      fetchGroup();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePair = async (pairId: string) => {
    if (!window.confirm('¿Eliminar esta pareja? Sus partidos también se borrarán.')) return;
    try {
      await fetch(`http://localhost:3001/api/pairs/${pairId}`, { method: 'DELETE' });
      fetchGroup();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAdmin) return <Navigate to="/" />;
  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Cargando grupo...</div>;

  return (
    <div style={{
      minHeight: '100vh', padding: '120px 2rem 50px',
      backgroundImage: 'linear-gradient(135deg, #0c0e14 0%, #1a1d23 100%)', color: 'white'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Link to={`/tournament/${group?.tournamentId}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: '2rem' }}>
          <ChevronLeft size={20} /> Volver al Torneo
        </Link>

        <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 className="gradient-text" style={{ fontSize: '3rem', margin: '0 0 0.5rem' }}>{group?.name}</h1>
            <p style={{ opacity: 0.6 }}>Gestión de parejas y registro de partidos.</p>
          </div>
          <button onClick={handleReset} className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', color: '#ff4b2b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCcw size={18} /> Reiniciar Marcadores
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
          {/* Main Content: Match Matrix */}
          <section className="glass-card" style={{ padding: '2rem', overflowX: 'auto' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Matriz de Partidos</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Partido</th>
                  <th style={{ padding: '1rem' }}>Puntos A</th>
                  <th style={{ padding: '1rem' }}>Puntos B</th>
                  <th style={{ padding: '1rem' }}>Ganador</th>
                  <th style={{ padding: '1rem' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {group?.matches.map((match) => (
                  <MatchRow 
                    key={match.id} 
                    match={match} 
                    onSave={handleSaveResult} 
                    isSaving={savingMatch === match.id} 
                  />
                ))}
              </tbody>
            </table>
            {group?.matches.length === 0 && (
              <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>Agrega al menos dos parejas para generar partidos.</p>
            )}
          </section>

          {/* Sidebar: Pairs List & Add Form */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserPlus color="var(--primary)" /> Nueva Pareja
              </h3>
              <form onSubmit={handleAddPair} style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Nombre"
                  value={newPairName}
                  onChange={(e) => setNewPairName(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '0 1rem' }}>+</button>
              </form>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Clasificación</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {group?.pairs.sort((a,b) => b.totalScore - a.totalScore).map((p) => (
                  <div key={p.id} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px'
                  }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                        {p.totalScore} pts
                      </div>
                    </div>
                    <button onClick={() => handleDeletePair(p.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,75,43,0.5)', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

// Sub-component for a Match Row with local state for inputs
const MatchRow = ({ match, onSave, isSaving }: { match: Match, onSave: any, isSaving: boolean }) => {
  const [pA, setPA] = useState(match.pointsA);
  const [pB, setPB] = useState(match.pointsB);
  const [winner, setWinner] = useState(match.winnerId || '');

  const isPlayed = match.winnerId !== null;

  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: isPlayed ? 'rgba(0, 242, 254, 0.02)' : 'transparent' }}>
      <td style={{ padding: '1rem', textAlign: 'left' }}>
        <div style={{ fontSize: '0.9rem', color: winner === match.pairAId ? 'var(--primary)' : 'white' }}>{match.pairA.name}</div>
        <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>vs</div>
        <div style={{ fontSize: '0.9rem', color: winner === match.pairBId ? 'var(--primary)' : 'white' }}>{match.pairB.name}</div>
      </td>
      <td style={{ padding: '1rem' }}>
        <input 
          type="number" 
          value={pA} 
          onChange={(e) => setPA(parseInt(e.target.value) || 0)}
          style={{ width: '50px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '5px' }}
        />
      </td>
      <td style={{ padding: '1rem' }}>
        <input 
          type="number" 
          value={pB} 
          onChange={(e) => setPB(parseInt(e.target.value) || 0)}
          style={{ width: '50px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '5px' }}
        />
      </td>
      <td style={{ padding: '1rem' }}>
        <select 
          value={winner} 
          onChange={(e) => setWinner(e.target.value)}
          style={{ background: '#1a1d23', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '5px' }}
        >
          <option value="">Pendiente</option>
          <option value={match.pairAId}>{match.pairA.name}</option>
          <option value={match.pairBId}>{match.pairB.name}</option>
        </select>
      </td>
      <td style={{ padding: '1rem' }}>
        <button 
          onClick={() => onSave(match, winner, pA, pB)}
          disabled={!winner || isSaving}
          className="btn-primary"
          style={{ padding: '0.5rem', opacity: winner ? 1 : 0.5 }}
        >
          <Save size={18} />
        </button>
      </td>
    </tr>
  );
};

export default GroupDetails;
function Navigate({ to }: { to: string }) {
  const navigate = useNavigate();
  React.useEffect(() => { navigate(to); }, []);
  return null;
}
